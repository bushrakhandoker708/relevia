// Opt-in research harness. It is not connected to the application chat or storage:
// it uses its own engine (from loadEngine), a fixed synthetic input, and returns a
// local report. Nothing is uploaded.
//
// What it separates (Milestone 4, Task 6):
//   startup        loadEngine() time, labelled with the caller's cache state
//                  ('network_cold' | 'cached' | 'unknown'); a cached load is never
//                  reported as cold
//   ttft           wall-clock time to the first non-empty streamed text
//   prefill/decode WebLLM's own per-request counters (usage.extra), when the runtime
//                  provides them; null otherwise. These are runtime-reported, not GPU
//                  kernel timings.
//   end-to-end     request start to stream end
//   effective tps  completion tokens / end-to-end seconds (includes prefill and overhead)
//   failures       kept as rows; summarised as a failure rate
//   switch/unload  optional model switch and the final unload, timed separately
// GPU memory is still not measurable from the page, so it stays null.

const median = (xs) => {
  const v = xs.filter(x => typeof x === 'number' && Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};

/** Hardware facts the page can actually see. Never throws. */
export async function collectHardware(nav = globalThis.navigator) {
  const out = { userAgent: nav?.userAgent ?? null, hardwareConcurrency: nav?.hardwareConcurrency ?? null,
    deviceMemoryGB: nav?.deviceMemory ?? null, platform: nav?.userAgentData?.platform ?? null, gpu: null };
  try {
    const adapter = await nav?.gpu?.requestAdapter({ powerPreference: 'high-performance' });
    if (adapter) {
      const info = adapter.info || {};
      out.gpu = { vendor: info.vendor || null, architecture: info.architecture || null, description: info.description || null,
        shaderF16: adapter.features.has('shader-f16'), maxBufferSize: adapter.limits?.maxBufferSize ?? null,
        isFallbackAdapter: Boolean(adapter.isFallbackAdapter || info.isFallbackAdapter) };
    }
  } catch { out.gpuError = 'adapter request failed'; }
  return out;
}

export function summarise(rows) {
  const summary = {};
  for (const condition of [...new Set(rows.filter(r => !r.warmup).map(r => r.condition))]) {
    const sub = rows.filter(r => !r.warmup && r.condition === condition);
    const ok = sub.filter(r => r.status === 'generated');
    summary[condition] = {
      attempted: sub.length, generated: ok.length, failureRate: sub.length ? (sub.length - ok.length) / sub.length : null,
      medianTtftMilliseconds: median(ok.map(r => r.ttftMilliseconds)),
      medianEndToEndMilliseconds: median(ok.map(r => r.elapsedMilliseconds)),
      medianEffectiveOutputTokensPerSecond: median(ok.map(r => r.outputTokensPerSecond)),
      medianRuntimePrefillTokensPerSecond: median(ok.map(r => r.runtime?.prefillTokensPerSecond)),
      medianRuntimeDecodeTokensPerSecond: median(ok.map(r => r.runtime?.decodeTokensPerSecond)),
    };
  }
  return summary;
}

export async function runBrowserBenchmark({ loadEngine, artifactMetadata, prompts, repeats = 5, cacheState = 'unknown',
  hardware = collectHardware, switchModel = null }) {
  if (typeof loadEngine !== 'function' || !prompts?.A || !prompts?.B) {
    throw new Error('Provide an isolated engine factory and both frozen prompts');
  }
  for (const field of ['modelId', 'modelRevision', 'runtimeVersion', 'quantisation', 'wasmArtifact']) {
    if (!artifactMetadata?.[field]) throw new Error(`Missing artifact metadata: ${field}`);
  }
  if (!['network_cold', 'cached', 'unknown'].includes(cacheState)) throw new Error('Invalid cache state');
  if (!Number.isInteger(repeats) || repeats < 1 || repeats > 20) throw new Error('Invalid repeat count');
  const report = {
    status: 'starting', artifactMetadata, artifactVerification: 'Caller-supplied; verify immutable URLs and checksums before interpretation',
    userAgent: globalThis.navigator?.userAgent ?? null, startedUtc: new Date().toISOString(),
    hardware: typeof hardware === 'function' ? await hardware() : null,
    startup: { cacheState, loadMilliseconds: null, firstProgressMilliseconds: null },
    gpuMemoryBytes: null, purePrefillThroughput: null, rows: [], summary: {}, switch: null, unloadMilliseconds: null,
    notes: 'TTFT is time to first nonempty text chunk. Prefill/decode rates are WebLLM-reported per request, not GPU kernel timings. '
      + 'GPU memory is not observable from the page. No Python/browser equivalence is assumed.',
  };
  let engine;
  try {
    const loadStart = performance.now();
    engine = await loadEngine((progress) => {
      if (report.startup.firstProgressMilliseconds === null) report.startup.firstProgressMilliseconds = performance.now() - loadStart;
      report.startup.lastProgressText = progress?.text ?? null;
    });
    report.startup.loadMilliseconds = performance.now() - loadStart;
    report.loadMilliseconds = report.startup.loadMilliseconds; // kept for older reports
    const jobs = [{ condition: 'A', warmup: true, repeat: 0 }];
    for (let repeat = 1; repeat <= repeats; repeat++) {
      for (const condition of repeat % 2 ? ['A', 'B'] : ['B', 'A']) jobs.push({ condition, repeat, warmup: false });
    }
    for (const job of jobs) {
      const start = performance.now();
      const row = { ...job, status: 'failed', startedUtc: new Date().toISOString() };
      let first = null;
      let output = '';
      try {
        const chunks = await engine.chat.completions.create({
          messages: [
            { role: 'system', content: prompts[job.condition] },
            { role: 'user', content: job.warmup ? 'Please say hello briefly.' : 'I care for a relative and feel guilty taking an hour to myself.' },
          ],
          max_tokens: 110, temperature: 0, seed: 42, stream: true,
          stream_options: { include_usage: true },
        });
        row.chunks = []; // [milliseconds since request start, text]: replayable through each release policy
        for await (const chunk of chunks) {
          const text = chunk.choices?.[0]?.delta?.content || '';
          if (text && first === null) first = performance.now();
          if (text) row.chunks.push([performance.now() - start, text]);
          output += text;
          if (chunk.usage) row.usage = chunk.usage;
        }
        if (!output.trim()) throw new Error('Empty generation');
        row.status = 'generated'; row.response = output;
      } catch (error) {
        row.errorType = error.name;
      }
      row.elapsedMilliseconds = performance.now() - start;
      row.ttftMilliseconds = first === null ? null : first - start;
      row.outputTokensPerSecond = row.usage?.completion_tokens != null
        ? row.usage.completion_tokens / (row.elapsedMilliseconds / 1000) : null;
      const extra = row.usage?.extra;
      row.runtime = extra ? {
        prefillTokensPerSecond: extra.prefill_tokens_per_s ?? null, decodeTokensPerSecond: extra.decode_tokens_per_s ?? null,
        ttftSeconds: extra.time_to_first_token_s ?? null, timePerOutputTokenSeconds: extra.time_per_output_token_s ?? null,
        endToEndSeconds: extra.e2e_latency_s ?? null,
      } : null;
      row.endedUtc = new Date().toISOString();
      report.rows.push(row);
    }
    report.summary = summarise(report.rows);
    if (typeof switchModel === 'function') {
      const s = performance.now();
      try { await switchModel(engine); report.switch = { status: 'switched', milliseconds: performance.now() - s }; }
      catch (error) { report.switch = { status: 'failed', errorType: error.name, milliseconds: performance.now() - s }; }
    }
    report.status = report.rows.every(row => row.status === 'generated') ? 'completed' : 'completed_with_failures';
  } catch (error) {
    report.status = 'load_failed'; report.errorType = error.name;
  } finally {
    report.endedUtc = new Date().toISOString();
    if (engine?.unload) {
      const s = performance.now();
      try { await engine.unload(); report.unloadMilliseconds = performance.now() - s; }
      catch (error) { report.unloadErrorType = error.name; }
    }
  }
  return report;
}
