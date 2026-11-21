import test from 'node:test';
import assert from 'node:assert/strict';
import { runBrowserBenchmark, collectHardware } from '../src/services/browserBenchmark.js';

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
  // chunk timings are kept so the stream can be replayed through each release policy
  assert.equal(report.rows[1].chunks.map(([, text]) => text).join(''), report.rows[1].response);
  assert.ok(report.rows[1].chunks.every(([ms]) => ms >= 0));
  assert.equal(report.gpuMemoryBytes, null);
  assert.equal(unloaded, true);
});

test('benchmark preserves a model-load failure instead of inventing measurements', async () => {
  const report = await runBrowserBenchmark({ loadEngine: async () => { throw new Error('test failure'); }, artifactMetadata, prompts: { A: 'A', B: 'B' }, repeats: 1 });
  assert.equal(report.status, 'load_failed');
  assert.equal(report.rows.length, 0);
  assert.equal(report.gpuMemoryBytes, null);
});

test('benchmark separates startup, runtime counters, failures, switch and unload', async () => {
  let calls = 0;
  const engine = {
    chat: { completions: { create: async function* () {
      calls += 1;
      if (calls === 3) throw Object.assign(new Error('gpu lost'), { name: 'GPUDeviceLost' });
      yield { choices: [{ delta: { content: 'Hi' } }] };
      yield { choices: [], usage: { prompt_tokens: 10, completion_tokens: 4,
        extra: { prefill_tokens_per_s: 60, decode_tokens_per_s: 2.5, time_to_first_token_s: 0.2, time_per_output_token_s: 0.4, e2e_latency_s: 1.8 } } };
    } } },
    unload: async () => {},
  };
  let switched = false;
  const report = await runBrowserBenchmark({
    loadEngine: async (onProgress) => { onProgress({ text: 'Fetching' }); return engine; },
    artifactMetadata, prompts: { A: 'A', B: 'B' }, repeats: 2, cacheState: 'cached',
    hardware: async () => ({ gpu: { vendor: 'test' } }), switchModel: async () => { switched = true; },
  });
  assert.equal(report.status, 'completed_with_failures');
  assert.equal(report.startup.cacheState, 'cached');
  assert.ok(report.startup.firstProgressMilliseconds >= 0);
  assert.equal(report.hardware.gpu.vendor, 'test');
  assert.equal(report.rows[1].runtime.decodeTokensPerSecond, 2.5);
  assert.equal(report.rows[2].status, 'failed');
  assert.equal(report.rows[2].errorType, 'GPUDeviceLost');
  const failed = report.rows[2].condition;
  assert.equal(report.summary[failed].failureRate, 0.5);
  assert.equal(report.summary.A.medianRuntimeDecodeTokensPerSecond, 2.5);
  assert.equal(switched, true);
  assert.equal(report.switch.status, 'switched');
  assert.ok(report.unloadMilliseconds >= 0);
});

test('benchmark rejects an unlabelled cache state', async () => {
  await assert.rejects(runBrowserBenchmark({ loadEngine: async () => ({}), artifactMetadata, prompts: { A: 'A', B: 'B' }, cacheState: 'warm' }), /cache state/);
});

test('collectHardware never throws without WebGPU', async () => {
  const hw = await collectHardware({ userAgent: 'x', hardwareConcurrency: 8 });
  assert.equal(hw.gpu, null);
  assert.equal(hw.hardwareConcurrency, 8);
});
