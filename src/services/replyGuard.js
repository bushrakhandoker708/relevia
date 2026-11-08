/**
 * replyGuard.js - deterministic check on what the MODEL says, after routing.
 *
 * WHY: safety.js only routes the user's message. A real chat showed the gap:
 *   user: "the girl u were talking to commited suicide"  -> check-in question (fine)
 *   user: "she dies]"                                     -> not routed, went to the model
 *   model: "I cannot engage in a conversation that may involve suicide ... National
 *           Suicide Prevention Lifeline (1-800-273-TALK) ... text HOME to 741741"
 * That reply refused someone talking about a death, and it invented US contact details
 * (the 1-800 Lifeline number was replaced by 988 in 2022) for a user whose location I
 * don't know. Small models do this a lot, so I check the reply in code instead of
 * hoping the prompt stops it.
 *
 * The guard never adds new advice of its own: it swaps the whole reply for one fixed,
 * reviewed message. It does not judge empathy or quality.
 */
import { CRISIS_LINES } from './consts.js';

// Things a reply must never contain because I cannot verify them for the user:
// phone numbers, SMS short codes and named hotlines. Phone-like spans need 7+ digits,
// so grounding exercises like "5-4-3-2-1" or "2-3 minutes" are not caught.
const NAMED_SERVICE = /\b(?:988|741741|lifeline|crisis text line|text (?:home|hello|connect) to|samaritans|befrienders|helpline number|hotline number)\b/i;
const PHONE_LIKE = /\+?\(?\d[\d\s().-]{5,}\d/g;
const REFUSAL = /\bI (?:cannot|can't|can not|am unable to|am not able to|won't|will not) (?:engage|discuss|talk about|continue|participate|have this)\b/i;

export const GUARDED_REPLY = [
  "I'm really sorry. That sounds painful, and you can talk to me about it.",
  "I'm an AI and I can't check which support services exist where you are, so I won't guess phone numbers.",
  'If you or anyone else might be in danger, contact your local emergency service or someone you trust nearby.',
  ...CRISIS_LINES,
  'If you want, you can tell me more about what happened.',
].join(' ');

/** Which rule a reply breaks, or null. Works on partial text too (used while streaming). */
export function replyProblem(text) {
  const t = String(text || '');
  if (REFUSAL.test(t)) return 'refusal';
  if (NAMED_SERVICE.test(t)) return 'unverified_contact';
  for (const m of t.match(PHONE_LIKE) || []) {
    if (m.replace(/\D/g, '').length >= 7) return 'unverified_contact';
  }
  return null;
}

/** The reply to show: unchanged, or the fixed message if it breaks a rule. */
export function guardReply(text) {
  const reason = replyProblem(text);
  return reason ? { text: GUARDED_REPLY, reason } : { text, reason: null };
}
