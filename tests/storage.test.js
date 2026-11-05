import test from 'node:test';
import assert from 'node:assert/strict';
import { createChatStore, RETENTION_MS, CHAT_PREFIX, deleteLegacyChat } from '../src/services/chatStorage.js';

function setup() {
  const values = new Map();
  let time = 1000000000;
  const storage = { get length() { return values.size; }, key: i => [...values.keys()][i],
    getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), removeItem: k => values.delete(k) };
  return { values, storage, advance: ms => { time += ms; }, store: createChatStore({ storage: () => storage, now: () => time }) };
}

test('default chat and names stay in memory; new page cannot read them', () => {
  const { store, values, storage } = setup();
  store.open('a').setName('Synthetic Person');
  store.open('a').addTurn('Synthetic exam stress', 'A synthetic reply');
  assert.equal(store.open('a').getHist().length, 2);
  assert.equal(values.size, 0);
  assert.deepEqual(createChatStore({ storage: () => storage }).open('a').getHist(), []);
});
test('opt-in saves messages without separate name; restoration requires an explicit action', () => {
  const { store, values } = setup();
  store.open('a').setName('SeparateName');
  store.setPersistence('a', true);
  store.open('a').addTurn('Synthetic message', 'Synthetic reply');
  assert.equal(JSON.parse(values.get(CHAT_PREFIX + 'a')).rows.length, 2);
  assert.ok(!values.get(CHAT_PREFIX + 'a').includes('SeparateName'));
  assert.deepEqual(store.open('b').getHist(), []);
  assert.equal(store.restore('a', 'b').getHist().length, 2);
  assert.equal(store.settings('b').persistent, false);
});
test('independent session histories and clearing one never reads another', () => {
  const { store } = setup();
  store.open('a').addTurn('A', 'reply A'); store.open('b').addTurn('B', 'reply B');
  store.clear('a');
  assert.equal(store.open('b').getHist()[0].content, 'B');
  assert.deepEqual(store.open('a').getHist(), []);
});
test('expiry enforced on memory reads and persisted reads without another message', () => {
  const { store, values, advance } = setup();
  store.setPersistence('a', true); store.open('a').addTurn('A', 'B');
  advance(RETENTION_MS);
  assert.deepEqual(store.open('a').getHist(), []);
  assert.deepEqual(JSON.parse(values.get(CHAT_PREFIX + 'a')).rows, []);
  assert.deepEqual(store.listSaved(), []);
});
test('expiry on writes preserves only recent turns', () => {
  const { store, advance } = setup();
  store.setPersistence('a', true); store.open('a').addTurn('old', 'old'); advance(RETENTION_MS);
  store.open('a').addTurn('new', 'new'); assert.equal(store.open('a').getHist().length, 2);
});
test('names expire and consent withdrawal prevents stale writes', () => {
  const { store, advance, values } = setup();
  store.open('a').setName('Synthetic'); advance(RETENTION_MS);
  assert.equal(store.open('a').getName(), '');
  store.setPersistence('a', true); const pending = store.open('a');
  store.setPersistence('a', false); pending.addTurn('late', 'late');
  assert.equal(values.size, 0); assert.deepEqual(store.open('a').getHist(), []);
});
test('failed persistence keeps the reply in memory and disables saving', () => {
  const { store, storage } = setup(); store.setPersistence('a', true);
  storage.setItem = () => { throw new Error('quota'); };
  assert.throws(() => store.open('a').addTurn('A', 'B'), /unavailable/);
  assert.equal(store.settings('a').persistent, false);
  assert.equal(store.open('a').getHist().length, 2);
});
test('page end invalidation removes all in-memory session context', () => {
  const { store } = setup(); const pending = store.open('a');
  pending.addTurn('A', 'B'); store.invalidateAll(); pending.addTurn('late', 'late');
  assert.deepEqual(store.open('a').getHist(), []);
});
test('deletion clears names, saved copies and invalidates pending handles', () => {
  const { store, values } = setup();
  store.setPersistence('a', true); const old = store.open('a');
  old.setName('Synthetic'); old.addTurn('A', 'B'); store.clear('a'); old.addTurn('late', 'late');
  old.setName('late'); assert.equal(old.isCurrent(), false);
  assert.equal(values.size, 0); assert.equal(store.open('a').getName(), '');
  assert.deepEqual(store.open('a').getHist(), []);
});
test('crisis text is memory-only and disables saving of future contextual replies', () => {
  const { store, values } = setup();
  store.open('a').addTurn('I want to hurt myself', 'synthetic response', { sensitive: true });
  assert.equal(values.size, 0);
  assert.throws(() => store.setPersistence('a', true), /sensitive/);
  store.setPersistence('b', true); store.open('b').addTurn('earlier', 'reply');
  store.open('b').addTurn('risk', 'reply', { sensitive: true }); store.open('b').addTurn('later', 'context');
  assert.equal(values.size, 0);
});
test('blocked storage does not prevent default chat or crisis context', () => {
  const store = createChatStore({ storage: () => { throw new Error('blocked'); } });
  store.open('a').addTurn('hello', 'hello');
  store.open('a').addTurn('risk', 'response', { sensitive: true });
  assert.equal(store.open('a').getHist().length, 4);
  assert.throws(() => store.setPersistence('b', true), /unavailable/);
  assert.equal(store.settings('b').persistent, false);
  assert.throws(() => store.clear('a'), /blocked/);
  assert.deepEqual(store.open('a').getHist(), []);
});
test('clear all removes legacy chat personalization but preserves separate journals', () => {
  const { store, values } = setup();
  values.set('relevia_memory_anon', 'legacy'); values.set('relevia_visits', '{}'); values.set('journalEntries', 'separate');
  store.clearAll(); assert.deepEqual([...values.keys()], ['journalEntries']);
});
test('malformed and expired saved records never restore', () => {
  const { store, values } = setup(); values.set(CHAT_PREFIX + 'bad', 'bad json');
  values.set(CHAT_PREFIX + 'old', JSON.stringify({ version: 2, rows: [{ role: 'user', content: 'old', ts: 0 }] }));
  assert.deepEqual(store.listSaved(), []); assert.equal(values.size, 0);
});
test('local-only storage operations never call fetch', () => {
  const original = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Unexpected network'); };
  try { const { store } = setup(); store.open('a').addTurn('A', 'B'); store.setPersistence('a', true); store.listSaved(); store.clearAll(); }
  finally { globalThis.fetch = original; }
});
test('legacy IndexedDB cleanup reports blocked deletion', async () => {
  await deleteLegacyChat({ deleteDatabase(name) { assert.equal(name, 'relevia'); const req = {}; queueMicrotask(() => req.onsuccess()); return req; } });
  await assert.rejects(deleteLegacyChat({ deleteDatabase() { const req = {}; queueMicrotask(() => req.onblocked()); return req; } }), /older Relevia tabs/);
});
