// Keeps docs/DATA_FLOWS.md honest. Every storage key written as a string literal in src/,
// and every kind of network call, must be named in the inventory. This is a text search,
// so it catches new keys and calls written in the usual way; it cannot prove that no
// other data flow exists (a key built at run time from variables would slip past).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const doc = readFileSync(join(root, 'docs', 'DATA_FLOWS.md'), 'utf8');

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(jsx?|mjs)$/.test(name)) files.push(p);
  }
};
walk(join(root, 'src'));
const sources = files.map((p) => ({ path: relative(root, p).replace(/\\/g, '/'), text: readFileSync(p, 'utf8') }));

test('every literal storage key in src/ is listed in DATA_FLOWS.md', () => {
  const keys = new Set();
  const storageCall = /(?:localStorage|sessionStorage|storage\(\)|disk)\??\.(?:getItem|setItem|removeItem)\(\s*['"`]([^'"`$]+)/g;
  const keyConst = /(?:_KEY|_PREFIX|KEYS\.\w+|OPEN_KEY)\s*[=:]\s*['"]([^'"]+)['"]/g;
  const helper = /(?:readStore|writeStore|readPref|writePref)\(\s*['"]([^'"]+)['"]/g;
  for (const { text } of sources) {
    for (const re of [storageCall, keyConst, helper]) for (const m of text.matchAll(re)) keys.add(m[1]);
  }
  // journalStore keeps its keys in one object literal
  const js = sources.find((s) => s.path.endsWith('services/journalStore.js')).text;
  for (const m of js.matchAll(/(?:entries|draft|settings|prompts):\s*'([^']+)'/g)) keys.add(m[1]);

  assert.ok(keys.size >= 12, `expected to find the known keys, found ${[...keys].join(', ')}`);
  const missing = [...keys].filter((k) => !doc.includes(k));
  assert.deepEqual(missing, [], 'storage keys missing from docs/DATA_FLOWS.md');
});

test('src/ makes no network calls other than the documented ones', () => {
  const calls = /\b(fetch|sendBeacon|XMLHttpRequest|WebSocket|EventSource)\s*\(|new\s+(XMLHttpRequest|WebSocket|EventSource)\b/g;
  const found = [];
  for (const { path, text } of sources) {
    const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const m of code.matchAll(calls)) found.push(`${path}: ${m[0]}`);
  }
  // Model downloads happen inside WebLLM, analytics inside @vercel/analytics; the app's own
  // code should not open connections itself.
  assert.deepEqual(found, []);
});

test('third-party packages that talk to the network are the documented ones', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const networked = Object.keys(pkg.dependencies).filter((d) => /analytics|insights|sentry|posthog|web-?llm|firebase|supabase|axios|amplitude|mixpanel/i.test(d));
  for (const d of networked) assert.ok(doc.includes(d) || (d.includes('web-llm') && doc.includes('WebLLM')), `${d} is not described in DATA_FLOWS.md`);
  assert.ok(networked.length >= 2);
});

test('no third-party preconnect or font request in the page shell', () => {
  const shell = readFileSync(join(root, 'index.html'), 'utf8') + sources.find((s) => s.path === 'src/App.jsx').text;
  assert.doesNotMatch(shell, /rel=["'](preconnect|dns-prefetch)["']/);
  assert.doesNotMatch(shell, /fonts\.googleapis|fonts\.gstatic/);
});
