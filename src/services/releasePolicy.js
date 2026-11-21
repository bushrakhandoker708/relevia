/**
 * releasePolicy.js - how much of a partly generated reply may be on screen.
 *
 * The reply guard decides what is wrong with a reply. A release policy decides WHEN text
 * may be shown while the reply is still streaming. They are separate so the research
 * repository can replay the same recorded stream through each policy
 * (docs/response_release_protocol.md there). The app itself uses R2.
 *
 *   R0 immediate  everything at once; only the final reply is checked. Research
 *                 baseline for exposure. Never used in the app.
 *   R1 whole      nothing until the reply has finished, then the checked reply.
 *   R2 sentence   finished sentences that pass the check (guard version G3). App default.
 *   R3 prefix     candidate: R2, plus the words of the unfinished sentence up to the first
 *                 point where a rule could still act. That point is the start of a digit
 *                 run, of a refusal opener ("I c" could become "I cannot"), or of a term
 *                 the guard removes ("Child" could become "Childline").
 *
 * Every policy returns a number of characters of `partial` that may be visible, or -1 if
 * the reply is already a problem and nothing more should stream.
 *
 * R3 protects only against what the guard's rules describe, exactly like R2. Meaning that
 * no rule describes, or that spans sentences, passes both. That is why the study measures
 * exposure against independent labels, not against the guard.
 */
import { classifyReply, streamSafeLength, NAMED_SERVICE_TERMS, REFUSAL_VERBS } from './replyGuard.js';

export const POLICIES = ['R0', 'R1', 'R2', 'R3'];

const REFUSAL_OPENERS = ['i', "i'm", 'i am'].flatMap(p => REFUSAL_VERBS.map(v => `${p} ${v}`));
const TERMS = NAMED_SERVICE_TERMS.map(t => t.toLowerCase());

// True if `rest` could still become `term`, or already is it: one is a prefix of the other.
const compatible = (rest, term) => term.startsWith(rest) || rest.startsWith(term);

/**
 * Where in an unfinished sentence a rule could still act, or -1 if nowhere.
 * Exported for tests.
 */
export function holdPoint(tail) {
  const low = tail.toLowerCase().replace(/[‘’]/g, "'");
  let hold = -1;
  const take = (i) => { if (hold < 0 || i < hold) hold = i; };
  const digit = low.search(/[+(]?\d/);
  if (digit >= 0) take(digit);
  for (let i = 0; i < low.length; i++) {
    if (hold >= 0 && i >= hold) break;
    if (i > 0 && /[a-z0-9']/.test(low[i - 1])) continue; // only at the start of a word
    const rest = low.slice(i);
    if (rest[0] === 'i' && REFUSAL_OPENERS.some(o => compatible(rest, o))) take(i);
    else if (TERMS.some(t => compatible(rest, t))) take(i);
  }
  return hold;
}

/** Characters of `partial` that policy may show. `done` is true once generation has ended. */
export function releaseLength(policy, partial, { done = false, ...opts } = {}) {
  const t = String(partial || '');
  switch (policy) {
    case 'R0':
      return t.length;
    case 'R1':
      if (!done) return 0;
      return classifyReply(t, opts) ? -1 : t.length;
    case 'R2':
      if (done && !classifyReply(t, opts)) return t.length;
      return streamSafeLength(t, opts);
    case 'R3': {
      if (done && !classifyReply(t, opts)) return t.length;
      const safe = streamSafeLength(t, opts);
      if (safe < 0) return -1;
      const tail = t.slice(safe);
      const hold = holdPoint(tail);
      const open = hold < 0 ? tail : tail.slice(0, hold);
      // Whole words only: the last word may still be growing.
      const lastSpace = open.search(/\s\S*$/);
      return safe + (hold < 0 && /\s$/.test(open) ? open.length : Math.max(lastSpace + 1, 0));
    }
    default:
      throw new Error(`Unknown release policy: ${policy}`);
  }
}
