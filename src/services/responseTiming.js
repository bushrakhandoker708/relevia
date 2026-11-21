/**
 * responseTiming.js - when reply text actually reaches the screen.
 *
 * The browser benchmark measures time to the first generated token. The user sees
 * something later, because the release policy holds text back. Both are recorded here so
 * that "the model is slow" and "the guard is holding text" can be told apart.
 *
 * Session-only and in memory, like the guard's events: timings, counts and labels only,
 * never reply or user text. Nothing is stored or sent.
 */
const records = [];

export function getResponseTimings() { return records.slice(); }

/** Starts timing one reply. Call the returned methods as the stream progresses. */
export function startResponseTiming(policy, now = () => performance.now()) {
  const t0 = now();
  const r = { ts: Date.now(), policy, firstChunkMs: null, firstVisibleMs: null, doneMs: null,
    chunks: 0, generatedChars: 0, visibleCharsAtDone: 0, policyMs: 0, blocked: false, guardAction: null };
  return {
    chunk(chars) {
      r.chunks += 1;
      r.generatedChars += chars;
      if (r.firstChunkMs === null) r.firstChunkMs = now() - t0;
    },
    /** Wraps a release-policy call so its own cost is counted. */
    timePolicy(fn) {
      const s = now();
      try { return fn(); } finally { r.policyMs += now() - s; }
    },
    visible(chars) {
      if (chars > 0 && r.firstVisibleMs === null) r.firstVisibleMs = now() - t0;
      r.visibleCharsAtDone = Math.max(r.visibleCharsAtDone, chars);
    },
    block() { r.blocked = true; },
    done(guardAction) {
      r.doneMs = now() - t0;
      r.guardAction = guardAction;
      records.push({ ...r });
      if (records.length > 200) records.shift();
      return { ...r };
    },
  };
}
