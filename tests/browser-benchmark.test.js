import test from 'node:test';
import assert from 'node:assert/strict';
import { runBrowserBenchmark } from '../src/services/browserBenchmark.js';

const artifactMetadata = { modelId: 'test-double', modelRevision: 'test-only', runtimeVersion: 'test-only', quantisation: 'none', wasmArtifact: 'none' };

test('benchmark records streamed usage and unloads its isolated test engine', async () => {
  let unloaded = false;
  const engine = {
    chat: { completions: { create: async function* () {
      yield { choices: [{ delta: { content: 'Test response' } }] };
      yield { choices: [], usage: { prompt_tokens: 10, completion_tokens: 2 } };
    } } },
    unload: async () => { unloaded = true; },
  };
  const report = await runBrowserBenchmark({ loadEngine: async () => engine, artifactMetadata, prompts: { A: 'A', B: 'B' }, repeats: 1 });
  assert.equal(report.status, 'completed');
  assert.equal(report.rows.length, 3);
  assert.equal(report.rows.filter(row => row.warmup).length, 1);
  assert.equal(report.rows[1].usage.completion_tokens, 2);
  assert.ok(report.rows[1].ttftMilliseconds >= 0);
  assert.equal(report.gpuMemoryBytes, null);
  assert.equal(unloaded, true);
});

test('benchmark preserves a model-load failure instead of inventing measurements', async () => {
  const report = await runBrowserBenchmark({ loadEngine: async () => { throw new Error('test failure'); }, artifactMetadata, prompts: { A: 'A', B: 'B' }, repeats: 1 });
  assert.equal(report.status, 'load_failed');
  assert.equal(report.rows.length, 0);
  assert.equal(report.gpuMemoryBytes, null);
});
