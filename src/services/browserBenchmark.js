// Opt-in research harness. It is not connected to the application chat or storage.
export async function runBrowserBenchmark({ loadEngine, artifactMetadata, prompts, repeats = 5 }) {
  if (typeof loadEngine !== 'function' || !prompts?.A || !prompts?.B) {
    throw new Error('Provide an isolated engine factory and both frozen prompts');
  }
  for (const field of ['modelId', 'modelRevision', 'runtimeVersion', 'quantisation', 'wasmArtifact']) {
    if (!artifactMetadata?.[field]) throw new Error(`Missing artifact metadata: ${field}`);
  }
  if (!Number.isInteger(repeats) || repeats < 1 || repeats > 20) throw new Error('Invalid repeat count');
  const report = {
    status: 'starting', artifactMetadata, artifactVerification: 'Caller-supplied; verify immutable URLs and checksums before interpretation',
    userAgent: navigator.userAgent, startedUtc: new Date().toISOString(),
    gpuMemoryBytes: null, purePrefillThroughput: null, rows: [],
    notes: 'TTFT is time to first nonempty text chunk, not a GPU kernel measurement. No Python/browser equivalence is assumed.',
  };
  let engine;
  try {
    const loadStart = performance.now();
    engine = await loadEngine();
    report.loadMilliseconds = performance.now() - loadStart;
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
        for await (const chunk of chunks) {
          const text = chunk.choices?.[0]?.delta?.content || '';
          if (text && first === null) first = performance.now();
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
      row.endedUtc = new Date().toISOString();
      report.rows.push(row);
    }
    report.status = report.rows.every(row => row.status === 'generated') ? 'completed' : 'completed_with_failures';
  } catch (error) {
    report.status = 'load_failed'; report.errorType = error.name;
  } finally {
    report.endedUtc = new Date().toISOString();
    if (engine?.unload) {
      try { await engine.unload(); } catch (error) { report.unloadErrorType = error.name; }
    }
  }
  return report;
}
