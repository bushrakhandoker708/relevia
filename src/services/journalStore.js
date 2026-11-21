/**
 * Journal storage. Everything stays in this browser's localStorage under the keys the
 * journal has always used, so existing entries, drafts and settings carry over:
 *
 *   journalEntries   saved entries (array)
 *   journalDraft     the page being written, kept between visits
 *   journalSettings  text size, writing style and prompt choices
 *   customPrompts    prompts the person added
 *
 * Nothing here reads meaning from what was written. Older entries may carry a
 * `sentiment` field from a previous version; it is kept as stored (so nothing is lost)
 * but no longer shown or used.
 *
 * Every write reports whether it worked, because storage can be full, blocked (private
 * windows, site-data settings) or changed by another tab.
 *
 * Storage mode. Journal text is sensitive, so nothing is written to localStorage until the
 * person chooses "Keep on this device". Until then (mode 'session') entries, the draft,
 * settings and prompts live in memory and are gone when the tab closes. The choice itself
 * is kept under MODE_KEY, which holds only the word 'device'. Someone who already has
 * journal data in localStorage from an earlier version starts in 'device' mode, because
 * that is where their entries are; the page tells them so and lets them switch.
 */

export const MODE_KEY = 'journalStorage';

export const KEYS = {
  entries: 'journalEntries',
  draft: 'journalDraft',
  settings: 'journalSettings',
  prompts: 'customPrompts',
};

const disk = () => {
  try { return globalThis.localStorage || null; } catch { return null; }
};

// The in-memory store for 'session' mode, with the same interface as localStorage.
const memory = new Map();
const memoryStore = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => { memory.set(k, String(v)); },
  removeItem: (k) => { memory.delete(k); },
};

const hasStoredJournal = () => {
  const d = disk();
  try { return Boolean(d && Object.values(KEYS).some((k) => d.getItem(k) !== null)); } catch { return false; }
};

/** 'device' when the person chose to keep the journal (or already had one stored), else 'session'. */
export function getMode() {
  try {
    if (disk()?.getItem(MODE_KEY) === 'device') return 'device';
  } catch { return 'session'; }
  return hasStoredJournal() ? 'device' : 'session';
}

/** True when there is stored journal data but the person never made the choice. */
export function modeWasInferred() {
  try { return disk()?.getItem(MODE_KEY) !== 'device' && hasStoredJournal(); } catch { return false; }
}

const store = () => (getMode() === 'device' ? disk() : memoryStore);

/**
 * Switch mode, moving what is there. Going to 'device' copies this visit's journal into
 * localStorage. Going to 'session' copies the stored journal into memory for this visit
 * and removes it from localStorage.
 */
export function setMode(mode) {
  const d = disk();
  if (!d) return { ok: false, error: 'unavailable' };
  try {
    if (mode === 'device') {
      for (const k of Object.values(KEYS)) if (memory.has(k)) d.setItem(k, memory.get(k));
      d.setItem(MODE_KEY, 'device');
      memory.clear();
    } else {
      for (const k of Object.values(KEYS)) {
        const v = d.getItem(k);
        if (v !== null) memory.set(k, v);
        d.removeItem(k);
      }
      d.removeItem(MODE_KEY);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.name === 'QuotaExceededError' ? 'full' : 'blocked' };
  }
}

const readJSON = (key, fallback) => {
  try {
    const raw = store()?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback; // malformed JSON: treat as empty rather than crash the page
  }
};

const writeJSON = (key, value) => {
  const s = store();
  if (!s) return { ok: false, error: 'unavailable' };
  try {
    s.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.name === 'QuotaExceededError' ? 'full' : 'blocked' };
  }
};

const remove = (key) => {
  try { store()?.removeItem(key); return { ok: true }; } catch { return { ok: false, error: 'blocked' }; }
};

const str = (x) => (typeof x === 'string' ? x : '');

/** One entry, cleaned. Unknown fields are kept so a later version can still read them. */
export function normaliseEntry(e) {
  if (!e || typeof e !== 'object') return null;
  const text = str(e.text);
  if (!text.trim()) return null;
  const time = new Date(e.timestamp);
  return {
    ...e,
    id: Number.isFinite(e.id) || typeof e.id === 'string' ? e.id : `${time.getTime() || 0}-${text.length}`,
    title: str(e.title),
    text,
    tags: Array.isArray(e.tags) ? e.tags.filter((t) => typeof t === 'string' && t.trim()).slice(0, 20) : [],
    timestamp: Number.isNaN(time.getTime()) ? null : time.toISOString(),
  };
}

export function readEntries() {
  const v = readJSON(KEYS.entries, []);
  if (!Array.isArray(v)) return [];
  return v.map(normaliseEntry).filter(Boolean)
    .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
}

export const writeEntries = (entries) => writeJSON(KEYS.entries, entries);

export function addEntry(entry) {
  const clean = normaliseEntry(entry);
  if (!clean) return { ok: false, error: 'empty', entries: readEntries() };
  // Read again just before writing, so an entry saved in another tab is not overwritten.
  const entries = [clean, ...readEntries().filter((e) => e.id !== clean.id)];
  return { ...writeEntries(entries), entries };
}

export function deleteEntry(id) {
  const entries = readEntries().filter((e) => e.id !== id);
  return { ...writeEntries(entries), entries };
}

export function readDraft() {
  const d = readJSON(KEYS.draft, null);
  if (!d || typeof d !== 'object') return null;
  return { text: str(d.text), title: str(d.title), tags: Array.isArray(d.tags) ? d.tags.filter((t) => typeof t === 'string') : [], mood: d.mood && typeof d.mood === 'object' ? d.mood : null, lastModified: str(d.lastModified) };
}

export function writeDraft({ text, title, tags, mood }) {
  if (!str(text).trim() && !str(title).trim()) return remove(KEYS.draft);
  return writeJSON(KEYS.draft, { text, title, tags, mood, lastModified: new Date().toISOString() });
}

export const clearDraft = () => remove(KEYS.draft);

export function readSettings() {
  const v = readJSON(KEYS.settings, {});
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}

/** Merge, so settings this version does not know about are kept. */
export const writeSettings = (patch) => writeJSON(KEYS.settings, { ...readSettings(), ...patch });

export function readPrompts() {
  const v = readJSON(KEYS.prompts, []);
  return Array.isArray(v) ? v.filter((p) => typeof p === 'string' && p.trim()) : [];
}

export const writePrompts = (prompts) => writeJSON(KEYS.prompts, prompts);

/** A backup file: entries and custom prompts. */
export const backup = () => ({
  app: 'Relevia journal', version: 2, exportedAt: new Date().toISOString(),
  entries: readEntries(), customPrompts: readPrompts(),
});

/** Plain text of every entry, oldest first, for reading outside the app. */
export const plainText = (entries) => [...entries].reverse().map((e) => [
  e.title || 'Untitled entry',
  e.timestamp ? new Date(e.timestamp).toLocaleString('en-GB') : '',
  '',
  e.text,
].join('\n')).join('\n\n----------\n\n');

/** Merge a backup into what is here. Entries with the same id are not duplicated. */
export function restore(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.entries)) return { ok: false, error: 'invalid' };
  const incoming = data.entries.map(normaliseEntry).filter(Boolean);
  const here = readEntries();
  const ids = new Set(here.map((e) => e.id));
  const merged = [...here, ...incoming.filter((e) => !ids.has(e.id))]
    .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  const prompts = [...new Set([...readPrompts(), ...(Array.isArray(data.customPrompts) ? data.customPrompts : [])])]
    .filter((p) => typeof p === 'string' && p.trim());
  const r = writeEntries(merged);
  if (r.ok) writePrompts(prompts);
  return { ...r, added: merged.length - here.length, entries: merged };
}

/**
 * Delete every entry, the draft and custom prompts, from memory and from this browser's
 * storage whichever mode is on. Settings and the storage choice are kept unless asked.
 */
export function deleteAll({ settings = false } = {}) {
  const keys = [KEYS.entries, KEYS.draft, KEYS.prompts, ...(settings ? [KEYS.settings, MODE_KEY] : [])];
  const results = keys.map((k) => {
    memory.delete(k);
    try { disk()?.removeItem(k); return { ok: true }; } catch { return { ok: false, error: 'blocked' }; }
  });
  return results.every((r) => r.ok) ? { ok: true } : { ok: false, error: 'blocked' };
}
