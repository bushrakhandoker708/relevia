#!/usr/bin/env python3
"""Privacy and secret scanner for this repository (standard library only).

It reports the rule, the path, the line number and a value fingerprint (the first 16 hex
characters of the value's SHA-256), and never prints the matched value. It does not
guarantee that nothing sensitive leaks. It catches common credential formats and
personal-data patterns, and is meant to sit alongside, not replace, a dedicated scanner
such as Gitleaks and a human reading the diff.

An identical copy lives in the application and research repositories. Keep them in sync.

Modes (exit status 1 when anything is found, 2 when the scan itself could not run):
  --staged          added lines and file names in the staged diff (used by the pre-commit hook)
  --tree            every tracked file at HEAD
  --history         every blob reachable from any ref
  --dist DIR        every file in a build directory
  --release         --tree plus --dist dist when a dist/ exists; also fails on allowlist
                    entries still marked "pending" (an owner decision is outstanding)

Allowlist: .privacy-allowlist.json, a list of {"rule", "path", "fingerprint", "reason"}
objects, with an optional "pending": true. "path" is an fnmatch pattern.
"""
import fnmatch
import hashlib
import json
import os
import re
import subprocess
import sys

RULES = {
    'aws_access_key': r'\b(?:AKIA|ASIA)[0-9A-Z]{16}\b',
    'github_token': r'\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{40,}\b',
    'groq_key': r'\bgsk_[A-Za-z0-9]{40,}\b',
    'openai_key': r'\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b',
    'anthropic_key': r'\bsk-ant-[A-Za-z0-9_-]{20,}\b',
    'google_api_key': r'\bAIza[0-9A-Za-z_-]{35}\b',
    'huggingface_token': r'\bhf_[A-Za-z0-9]{30,}\b',
    'slack_token': r'\bxox[abposr]-[A-Za-z0-9-]{10,}\b',
    'stripe_live_key': r'\b(?:sk|rk)_live_[A-Za-z0-9]{20,}\b',
    'private_key_block': r'-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY',
    'jwt': r'\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}',
    'url_with_credentials': r'\b[a-z][a-z0-9+.-]*://[^\s/:@"\'<>]+:[^\s/@"\'<>]+@[^\s/"\'<>]+',
    'secret_assignment': r'(?i)\b(?:api[_-]?key|secret|token|passw(?:or)?d)\b["\']?\s*[:=]\s*["\'][A-Za-z0-9_\-+/=]{20,}["\']',
    'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b',
    'phone_link': r'(?i)\b(?:tel:|wa\.me/|api\.whatsapp\.com/send\?phone=)\+?[0-9][0-9 ()-]{5,}',
    'intl_phone': r'(?<![\w.+])\+\d{1,3}[ -]?\(?\d{2,5}\)?[ -]?\d{3,4}[ -]?\d{3,4}(?!\w)',
    'social_profile_id': r'(?i)facebook\.com/profile\.php\?id=\d+',
    'windows_user_path': r'(?i)\b[A-Z]:[\\/]{1,2}Users[\\/]{1,2}(?!Public\b|Default\b)[^\\/\s"\'<>]+',
    'unix_home_path': r'(?<![\w.])/(?:home|Users)/[A-Za-z][A-Za-z0-9_-]*/',
}
ALLOWED_EMAIL = re.compile(r'(?i)(noreply|no-reply)@|@example\.(?:com|org|net)$|@users\.noreply\.github\.com$|^git@github\.com$')
BLOCKED_NAMES = re.compile(
    r'(?i)(?:^|/)(?:\.env(?:\.(?!example$)[^/]+)?|[^/]*\.pem|[^/]*\.p12|[^/]*\.pfx|id_(?:rsa|ed25519|ecdsa)[^/]*|'
    r'[^/]*credentials?[^/]*\.(?:json|ya?ml|txt)|[^/]*(?:chat|conversation)s?[_-]?export[^/]*|'
    r'[^/]*\.(?:safetensors|gguf|ckpt|pt|pth)|[^/]*\.sqlite3?)$')
SKIP_TEXT = re.compile(r'(?i)\.(?:png|jpe?g|gif|webp|ico|svg|mp4|webm|mp3|wav|ogg|woff2?|ttf|otf|eot|pdf|zip|7z|gz|tgz|'
                       r'jar|bin|onnx|wasm|lottie)$|(?:^|/)(?:package-lock\.json|node_modules/)')
MEDIA = re.compile(r'(?i)\.(?:png|jpe?g|gif|webp|ico|svg|mp4|webm|mp3|wav|ogg|woff2?|ttf|otf|eot)$')
MAX_BYTES = 5_000_000


def git(*args, binary=False):
    r = subprocess.run(['git', *args], capture_output=True)
    if r.returncode:
        raise RuntimeError('git ' + ' '.join(args[:2]) + ' failed: ' + r.stderr.decode(errors='replace')[:200])
    return r.stdout if binary else r.stdout.decode('utf-8', 'replace')


def fingerprint(value):
    return hashlib.sha256(value.encode('utf-8', 'replace')).hexdigest()[:16]


def scan_text(path, text, line_offsets=None):
    """Yield (rule, path, line, fingerprint). line_offsets maps text line -> original line."""
    for rule, rx in RULES.items():
        for m in re.finditer(rx, text):
            value = m.group(0)
            if rule == 'email' and ALLOWED_EMAIL.search(value):
                continue
            line = text.count('\n', 0, m.start()) + 1
            if line_offsets:
                line = line_offsets[line - 1]
            yield rule, path, line, fingerprint(value)


def scan_file_meta(path, size, head, check_size=True):
    if BLOCKED_NAMES.search(path):
        yield 'blocked_filename', path, 0, fingerprint(path)
    if head.startswith(b'version https://git-lfs'):
        yield 'lfs_pointer', path, 0, fingerprint(path)
    # Large non-media files in source control are usually build tools, weights or data dumps.
    if check_size and size > MAX_BYTES and not MEDIA.search(path):
        yield 'large_file', path, 0, fingerprint(path)


def scan_blob(path, data, check_size=True):
    yield from scan_file_meta(path, len(data), data[:40], check_size)
    if not SKIP_TEXT.search(path) and len(data) <= MAX_BYTES and b'\0' not in data[:8000]:
        yield from scan_text(path, data.decode('utf-8', 'replace'))


def staged():
    names = git('diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z').split('\0')
    for path in filter(None, names):
        data = git('show', ':' + path, binary=True)
        yield from scan_file_meta(path, len(data), data[:40])
    diff = git('diff', '--cached', '--unified=0', '--no-color', '--diff-filter=ACMR')
    path, added, lines, line = None, [], [], 0

    def flush():
        if path and added and not SKIP_TEXT.search(path):
            yield from scan_text(path, '\n'.join(added), lines)

    for raw in diff.splitlines():
        if raw.startswith('+++ '):
            yield from flush()
            path, added, lines = (raw[6:] if raw.startswith('+++ b/') else None), [], []
        elif raw.startswith('@@'):
            m = re.search(r'\+(\d+)', raw)
            line = int(m.group(1)) if m else 0
        elif raw.startswith('+') and path:
            added.append(raw[1:])
            lines.append(line)
            line += 1
    yield from flush()


def tree(rev='HEAD'):
    for entry in git('ls-tree', '-r', '-z', rev).split('\0'):
        if not entry:
            continue
        meta, path = entry.split('\t', 1)
        _, kind, sha = meta.split()
        if kind == 'blob':
            yield from scan_blob(path, git('cat-file', 'blob', sha, binary=True))


def history():
    seen = set()
    for rev in git('rev-list', '--all').split():
        for entry in git('ls-tree', '-r', '-z', rev).split('\0'):
            if not entry:
                continue
            meta, path = entry.split('\t', 1)
            _, kind, sha = meta.split()
            if kind == 'blob' and sha not in seen:
                seen.add(sha)
                for rule, p, line, fp in scan_blob(path, git('cat-file', 'blob', sha, binary=True)):
                    yield rule, f'{p}@{rev[:7]}', line, fp


def dist(directory):
    if not os.path.isdir(directory):
        raise RuntimeError(f'build directory {directory!r} does not exist')
    for root, _, files in os.walk(directory):
        for name in files:
            full = os.path.join(root, name)
            rel = os.path.relpath(full, '.').replace(os.sep, '/')
            with open(full, 'rb') as fh:
                data = fh.read()
            yield from scan_blob(rel, data, check_size=False)  # bundled runtimes are large by design
            if name.endswith('.map'):
                yield 'source_map_in_build', rel, 0, fingerprint(rel)


def load_allowlist():
    if not os.path.exists('.privacy-allowlist.json'):
        return []
    with open('.privacy-allowlist.json', encoding='utf-8') as fh:
        return json.load(fh)


def allowed(finding, allowlist, release):
    rule, path, _, fp = finding
    base = path.split('@', 1)[0]
    for entry in allowlist:
        if entry['rule'] == rule and entry['fingerprint'] == fp and fnmatch.fnmatch(base, entry['path']):
            return not (release and entry.get('pending'))
    return False


def main(argv):
    if not argv or argv[0] not in ('--staged', '--tree', '--history', '--dist', '--release'):
        print(__doc__)
        return 2
    mode = argv[0]
    try:
        os.chdir(git('rev-parse', '--show-toplevel').strip())
        allowlist = load_allowlist()
        if mode == '--staged':
            found = list(staged())
        elif mode == '--tree':
            found = list(tree())
        elif mode == '--history':
            found = list(history())
        elif mode == '--dist':
            found = list(dist(argv[1] if len(argv) > 1 else 'dist'))
        else:
            found = list(tree()) + (list(dist('dist')) if os.path.isdir('dist') else [])
    except Exception as exc:  # fail closed: a scan that cannot run is not a pass
        print(f'privacy scan could not run: {exc}', file=sys.stderr)
        return 2
    blocking = [f for f in found if not allowed(f, allowlist, mode == '--release')]
    pending = [f for f in found if f not in blocking and any(
        e.get('pending') and e['fingerprint'] == f[3] for e in allowlist)]
    for rule, path, line, fp in sorted(set(blocking)):
        print(f'BLOCK {rule:22} {path}:{line}  fp={fp}')
    for rule, path, line, fp in sorted(set(pending)):
        print(f'PENDING-OWNER-DECISION {rule:22} {path}:{line}  fp={fp}')
    print(f'privacy scan ({mode[2:]}): {len(set(blocking))} blocking, {len(set(pending))} pending, '
          f'{len(found)} raw matches. Values are never printed; this scan is not a guarantee.')
    return 1 if blocking else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
