/**
 * replyGuard.js - deterministic check on what the MODEL says, after routing.
 *
 * WHY: safety routing only looks at the user's message. A real chat showed the gap:
 *   user: "she dies]"  -> not routed, went to the model
 *   model: "I cannot engage in a conversation that may involve suicide ... National
 *           Suicide Prevention Lifeline (1-800-273-TALK) ... text HOME to 741741"
 * It refused someone talking about a death and gave out-of-date US contact details for
 * a user whose location I don't know.
 *
 * Version 2 (Milestone 4.1 audit). Version 1 replaced every refusal and every reply
 * with a contact detail, and its streaming check only fired once a whole pattern had
 * arrived, so "I cannot eng..." or half a phone number could already be on screen.
 * Now:
 *   - refusals are split: refusing to give harmful information (methods, doses) is
 *     LEGITIMATE and kept; refusing to talk to someone about death, suicide or their
 *     feelings is INAPPROPRIATE and replaced
 *   - invented contact details are REDACTED sentence by sentence; the rest of a good
 *     reply survives, and the one verified line is appended
 *   - streaming shows complete sentences, plus the current one only while it cannot
 *     yet be the start of a problem (streamSafeLength)
 *   - every activation is recorded in memory (reason and action only, never text)
 * It does not judge empathy or quality, and it adds no advice of its own.
 */
import { CRISIS_LINES } from './consts.js';

export const GUARD_VERSION = 'G2';

// Contact details I cannot verify for the user: named services, short codes, and any
// phone-like span with 7+ digits (so "5-4-3-2-1" or "2-3 minutes" are not caught).
// The single verified line in CRISIS_LINES (116 123, 6 digits) is allowed.
// AUDIT FIX: the first G2 audit redacted 5 replies that only said "call a crisis
// hotline", which is generic advice, not an invented contact. Only NAMED services and
// numbers count now.
const NAMED_SERVICE = /\b(?:988|741741|85258|(?:national )?suicide prevention lifeline|lifeline australia|crisis text line|text (?:home|hello|connect|talk|shout) to|samaritans|befrienders|childline|kids help phone|mind infoline|papyrus)\b/i;
const PHONE_LIKE = /\+?\(?\d[\d\s().-]{5,}\d/g;
// The gap between the refusing verb and the action is a short adverb list, not any two
// words: "I can't check which support services exist" (our own fixed text) is not a refusal.
const REFUSAL = /\bI(?:'m| am)? (?:cannot|can't|can not|am unable to|unable to|am not able to|not able to|won't be able to|will not be able to|won't|will not|must not|shouldn't)\b(?:\s+(?:really|actually|currently|safely|properly|further|directly))?\s+(?:engage|discuss|talk|continue|participate|have this|help(?! but| feeling| thinking| wondering| noticing)|assist|provide|give(?! up)|share|answer|respond|support)\b/i;
// What a refusal is refusing. Refusing harmful specifics is the right behaviour.
const HARMFUL_OBJECT = /\b(?:method|methods|ways? to|how to|instructions|lethal|dose|dosage|how many|how much|means to|information (?:on|about) (?:how|ways))\b/i;
const HARM_REQUEST = /\b(?:how (?:to|do i|can i|many|much)|best way|painless|quickest way|lethal|what dose)\b.*\b(?:die|kill|overdose|suicide|hang|cut|end my life|pills)\b/i;

// The verified line is ours, not the model's, so it never counts as unverified.
const VERIFIED = CRISIS_LINES.join(' ');

function sentences(text) {
  return String(text).match(/[^.!?\n]+(?:[.!?]+|\n+|$)/g) || [];
}

function hasContact(s) {
  if (NAMED_SERVICE.test(s)) return true;
  return (s.match(PHONE_LIKE) || []).some(m => m.replace(/\D/g, '').length >= 7);
}

/**
 * What is wrong with a reply, or null.
 * kinds: inappropriate_refusal | unverified_contact | (legitimate_refusal is not a problem)
 */
export function classifyReply(text, { userText = '' } = {}) {
  const t = String(text || '').replace(VERIFIED, '');
  const refusal = REFUSAL.exec(t);
  if (refusal) {
    const after = t.slice(refusal.index, refusal.index + 140);
    const legitimate = HARMFUL_OBJECT.test(after) || HARM_REQUEST.test(userText);
    if (!legitimate) return 'inappropriate_refusal';
  }
  if (sentences(t).some(hasContact)) return 'unverified_contact';
  return null;
}

/** Kept for callers of version 1. Same meaning as classifyReply. */
export function replyProblem(text, opts) {
  return classifyReply(text, opts);
}

export const GUARDED_REPLY = [
  "I'm really sorry. That sounds painful, and you can talk to me about it.",
  "I'm an AI and I can't check which support services exist where you are, so I won't guess phone numbers.",
  'If you or anyone else might be in danger, contact your local emergency service or someone you trust nearby.',
  ...CRISIS_LINES,
  'If you want, you can tell me more about what happened.',
].join(' ');

const CONTACT_NOTE = "I can't check which services exist where you are, so I won't guess phone numbers. " + CRISIS_LINES.join(' ');

const events = [];
/** Session-only record of guard activations. No reply or user text is stored. */
export function getGuardEvents() { return events.slice(); }
function record(reason, action) {
  events.push({ ts: Date.now(), reason, action, version: GUARD_VERSION });
  if (events.length > 200) events.shift();
}

/**
 * The reply to show.
 *   action 'none'      unchanged
 *   action 'redacted'  sentences with unverified contacts removed, verified line added
 *   action 'replaced'  the fixed message (inappropriate refusal, or nothing useful left)
 */
export function guardReply(text, opts = {}) {
  const reason = classifyReply(text, opts);
  if (!reason) return { text, reason: null, action: 'none' };
  if (reason === 'inappropriate_refusal') {
    record(reason, 'replaced');
    return { text: GUARDED_REPLY, reason, action: 'replaced' };
  }
  const kept = sentences(String(text).replace(VERIFIED, '')).filter(s => !hasContact(s)).join('').replace(/\s+/g, ' ').trim()
    // a dangling list intro such as "please reach out to:" makes no sense once its items are gone
    .replace(/[^.!?]*:\s*$/, '').trim();
  if (kept.length < 40) {
    record(reason, 'replaced');
    return { text: GUARDED_REPLY, reason, action: 'replaced' };
  }
  record(reason, 'redacted');
  return { text: `${kept} ${CONTACT_NOTE}`, reason, action: 'redacted' };
}

// While streaming: anything in the unfinished sentence that could still grow into a
// refusal or a contact detail. Ordinary words ("I'm so sorry") are not held.
const SUSPECT_TAIL = /\d|\bI(?:'m| am)? (?:c|w|u|n|m|s(?:h))|\b(?:call|text|ring|dial|contact|reach|line|hotline|helpline|lifeline|samaritans|crisis|befrienders|national|number)\b/i;

/**
 * How many characters of a partial reply are safe to show now; -1 if the reply is
 * already a problem. Complete sentences are shown once checked. The unfinished
 * sentence is shown too unless it contains something that could become a problem.
 */
export function streamSafeLength(partial, opts) {
  const t = String(partial || '');
  if (classifyReply(t, opts)) return -1;
  const lastEnd = Math.max(t.lastIndexOf('. '), t.lastIndexOf('! '), t.lastIndexOf('? '), t.lastIndexOf('\n'));
  const tail = t.slice(lastEnd + 1);
  return SUSPECT_TAIL.test(tail) ? lastEnd + 1 : t.length;
}
