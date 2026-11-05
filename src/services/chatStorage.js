// Local storage is neither differential privacy nor authentication.
import { CRISIS_RE } from './safety.js';
export const RETENTION_MS = 86400000;
export const CHAT_PREFIX = 'relevia_chat_v2:';
export const newSessionId = () => globalThis.crypto.randomUUID();

export function createChatStore({ storage = () => globalThis.localStorage, now = Date.now } = {}) {
  const sessions = new Map();
  const state = (id) => {
    if (!id || typeof id !== 'string') throw new TypeError('A session ID is required');
    if (!sessions.has(id)) sessions.set(id, { rows: [], name: '', persist: false, sensitive: false, epoch: 0, next: 1 });
    return sessions.get(id);
  };
  const prune = s => { s.rows = s.rows.filter(r => r.ts > now() - RETENTION_MS); };
  const remove = id => storage()?.removeItem(CHAT_PREFIX + id);
  const save = (id, s) => {
    prune(s);
    if (!s.persist || s.sensitive) return;
    try { storage().setItem(CHAT_PREFIX + id, JSON.stringify({ version: 2, rows: s.rows })); }
    catch { s.persist = false; s.error = 'Saving stopped. An earlier saved copy may remain; retry deleting saved chats.'; throw new Error('Saving is unavailable. This chat remains in memory.'); }
  };
  const decode = raw => {
    const value = JSON.parse(raw);
    if (value?.version !== 2 || !Array.isArray(value.rows)) return [];
    if (value.rows.some(r => typeof r.content === 'string' && CRISIS_RE.test(r.content))) return [];
    return value.rows.filter(r => ['user', 'assistant'].includes(r.role) && typeof r.content === 'string'
      && Number.isFinite(r.ts) && r.ts <= now() && r.ts > now() - RETENTION_MS && !CRISIS_RE.test(r.content));
  };
  return {
    open(id) {
      const s = state(id), epoch = s.epoch;
      const valid = () => epoch === s.epoch;
      return {
        isCurrent: valid,
        getHist(n = 24) { if (!valid()) return []; prune(s); if (s.persist) save(id, s); return s.rows.slice(-n).map(r => ({ ...r })); },
        getName() { return valid() && s.nameAt > now() - RETENTION_MS ? s.name : ''; },
        setName(name) { if (valid()) { s.name = String(name).slice(0, 80); s.nameAt = now(); } },
        addTurn(user, bot, { sensitive = false } = {}) {
          if (!valid()) return;
          // Later replies may quote sensitive context: disable saving for this whole chat.
          if (sensitive || CRISIS_RE.test(user) || CRISIS_RE.test(bot)) {
            const wasPersistent = s.persist;
            s.sensitive = true; s.persist = false;
            if (wasPersistent) {
              try { remove(id); }
              catch { s.error = 'Saved-copy deletion failed. Close other tabs and retry deleting saved chats.'; }
            }
          }
          const ts = now();
          s.rows.push({ id: s.next++, role: 'user', content: user, ts },
            { id: s.next++, role: 'assistant', content: bot, ts });
          s.rows = s.rows.slice(-100);
          save(id, s);
        },
      };
    },
    settings(id) { const s = state(id); return { persistent: s.persist, sensitive: s.sensitive, error: s.error || '' }; },
    setPersistence(id, enabled) {
      const s = state(id);
      s.epoch++; // invalidate pending writes under the earlier consent decision
      if (!enabled) { s.persist = false; remove(id); return; }
      if (s.sensitive) throw new Error('Saving is disabled for this chat because it contains sensitive context.');
      s.persist = true; save(id, s);
    },
    listSaved() {
      const disk = storage(), result = [];
      const keys = Array.from({ length: disk.length }, (_, i) => disk.key(i)).filter(k => k?.startsWith(CHAT_PREFIX));
      for (const key of keys) {
        let rows = [];
        try { rows = decode(disk.getItem(key)); } catch { /* invalid data is not restored */ }
        if (!rows.length) disk.removeItem(key);
        else {
          disk.setItem(key, JSON.stringify({ version: 2, rows }));
          result.push({ id: key.slice(CHAT_PREFIX.length), savedAt: rows.at(-1).ts });
        }
      }
      return result;
    },
    restore(savedId, freshId) {
      if (savedId === freshId) throw new Error('Restore requires a fresh session');
      const s = state(freshId);
      if (s.rows.length) throw new Error('Restore requires an empty session');
      s.rows = decode(storage().getItem(CHAT_PREFIX + savedId));
      s.next = Math.max(0, ...s.rows.map(r => r.id || 0)) + 1;
      remove(savedId); // restoring does not consent to saving subsequent messages
      return this.open(freshId);
    },
    clear(id) {
      const s = state(id);
      s.epoch++; s.rows = []; s.name = ''; s.persist = false; s.sensitive = false;
      remove(id); // report deletion failure instead of claiming success
    },
    invalidateAll() {
      for (const s of sessions.values()) {
        s.epoch++; s.rows = []; s.name = ''; s.persist = false; s.sensitive = false;
      }
    },
    clearAll() {
      this.invalidateAll();
      const disk = storage();
      const keys = Array.from({ length: disk.length }, (_, i) => disk.key(i));
      for (const key of keys) {
        if (key?.startsWith(CHAT_PREFIX) || key?.startsWith('relevia_memory_') || key === 'relevia_visits') disk.removeItem(key);
      }
    },
  };
}

export const chatStore = createChatStore();
// Never import legacy shared records into a newly isolated session.
export function deleteLegacyChat(factory = globalThis.indexedDB) {
  if (!factory) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const req = factory.deleteDatabase('relevia');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(new Error('Legacy chat deletion failed.'));
    req.onblocked = () => reject(new Error('Close older Relevia tabs, then retry deleting chat history.'));
  });
}
