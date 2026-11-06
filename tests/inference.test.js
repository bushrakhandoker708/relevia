import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chatStore } from '../src/services/chatStorage.js';
import { CRISIS_RE } from '../src/services/safety.js';

// Replace only Vite's build-time env and relative module URLs. The production think path is executed.
async function loadBrain() {
  const path = new URL('../src/services/releviaBrain.js', import.meta.url);
  const source = (await readFile(path, 'utf8')).replaceAll('import.meta.env.DEV', 'false')
    .replace(/from '(\.\/[^']+)'/g, (_, relative) => `from '${new URL(relative, path).href}'`);
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${Math.random()}`);
}
test('deterministic crisis rules preserved including known false alarms and misses', () => {
  assert.equal(CRISIS_RE.test('I want to hurt myself'), true);
  assert.equal(CRISIS_RE.test('A literature class about suicide'), true);
  assert.equal(CRISIS_RE.test('I don’t want to live'), false);
  assert.equal(CRISIS_RE.test('I passed my exam'), false);
});
test('failed WebGPU initialization returns curated reply without network or persistent storage', async () => {
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { gpu: { requestAdapter: async () => { throw new Error('synthetic GPU failure'); } } } });
  globalThis.window = { dispatchEvent() {} };
  const fetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Unexpected network'); };
  try {
    const brain = await loadBrain();
    const reply = await brain.think('Synthetic exam stress', 'gpu-test');
    assert.equal(typeof reply, 'string'); assert.ok(reply.length > 0);
    assert.equal(chatStore.open('gpu-test').getHist().length, 2);
    assert.equal(brain.isEngineReady(), false);
  } finally { globalThis.fetch = fetch; }
});
test('crisis handling precedes GPU access and never persists by default', async () => {
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { gpu: { requestAdapter() { throw new Error('Must not run'); } } } });
  const brain = await loadBrain();
  const reply = await brain.think('I want to hurt myself', 'crisis-test');
  assert.ok(reply.length > 0); assert.equal(chatStore.settings('crisis-test').sensitive, true);
  assert.equal(chatStore.settings('crisis-test').persistent, false);
});
test('new risk forms and user-history continuation bypass inference', async () => {
  let gpuCalls = 0;
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { gpu: { requestAdapter() { gpuCalls++; throw new Error('Must not run'); } } } });
  const brain = await loadBrain();
  for (const [id, text] of [['unicode','I don’t want to live'], ['typo','I want to kil myself'],
    ['indirect','I have written my final goodbye and will not be here tomorrow.'], ['spanish','Quiero quitarme la vida']]) {
    const reply = await brain.think(text, `improved-${id}`);
    assert.match(reply, /cannot provide emergency care/);
    assert.equal(chatStore.settings(`improved-${id}`).sensitive, true);
  }
  chatStore.open('context-route').addTurn('I want to hurt myself', 'Synthetic prior reply');
  assert.match(await brain.think('I have a plan', 'context-route'), /cannot provide emergency care/);
  assert.equal(gpuCalls, 0);
});
