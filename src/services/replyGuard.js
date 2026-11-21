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
 * Version 3 (21 November 2026), after an external review reproduced three G2 faults:
 *   1. Streaming showed the unfinished sentence when it "looked harmless". "Child" passed,
 *      then grew into "Childline", which the guard removes: text later rejected had
 *      already been on screen. G3 shows ONLY finished sentences that have been checked.
 *      The cost is a delay of up to one sentence, measured in the research repository
 *      (results/safety/reply-guard-v1/audit_g3.json).
 *   2. "I cannot help you organise your files." was replaced with the support message.
 *      An ordinary capability limit is not a refusal to support someone, so it is now
 *      classed as `capability_limit` and left alone.
 *   3. "I cannot discuss methods of coping with grief." was accepted as a legitimate
 *      safety refusal because it contains "methods". A refusal now counts as legitimate
 *      only if it names a harmful specific (method, dose, how many...) IN a self-harm
 *      context, or the user asked for one.
 * Refusals fall into four kinds (refusalKind), kept apart so that they can be counted:
 *   harmful_request   refusing harmful specifics: correct, kept
 *   capability_limit  "I can't book appointments": not a safety problem, kept
 *   grief_refusal     refusing to talk about a death or loss: replaced
 *   support_refusal   refusing to talk about feelings, suicide, "this": replaced
 * Invented contact details are still redacted sentence by sentence (unverified_contact).
 * These are keyword rules. They do not understand meaning, and a refusal worded in a way
 * nobody anticipated will be misclassified. Checked streaming only stops unchecked text
 * from appearing; it does not make the classifier right.
 * Every activation is recorded in memory (reason, kind and action only, never text).
 */
import { CRISIS_LINES } from './consts.js';

export const GUARD_VERSION = 'G3';

// Contact details I cannot verify for the user: named services, short codes, and any
// phone-like span with 7+ digits (so "5-4-3-2-1" or "2-3 minutes" are not caught).
// The single verified line in CRISIS_LINES (116 123, 6 digits) is allowed. Generic
// advice ("call a crisis hotline") is not an invented contact (G2 audit fix).
// The list is exported so that the release policies (releasePolicy.js) hold back the
// same terms the guard removes; the regex is built from it, so the two cannot drift.
export const NAMED_SERVICE_TERMS = ['988', '741741', '85258', 'national suicide prevention lifeline',
  'suicide prevention lifeline', 'lifeline australia', 'crisis text line', 'text home to', 'text hello to',
  'text connect to', 'text talk to', 'text shout to', 'samaritans', 'befrienders', 'childline', 'kids help phone',
  'mind infoline', 'papyrus'];
const NAMED_SERVICE = new RegExp(`\\b(?:${NAMED_SERVICE_TERMS.join('|')})\\b`, 'i');
const PHONE_LIKE = /\+?\(?\d[\d\s().-]{5,}\d/g;
// The gap between the refusing verb and the action is a short adverb list, not any two
// words: "I can't check which support services exist" (our own fixed text) is not a refusal.
export const REFUSAL_VERBS = ['cannot', "can't", 'can not', 'am unable to', 'unable to', 'am not able to', 'not able to',
  "won't be able to", 'will not be able to', "won't", 'will not', 'must not', "shouldn't"];
const REFUSAL = new RegExp(String.raw`\bI(?:'m| am)? (?:${REFUSAL_VERBS.join('|')})\b(?:\s+(?:really|actually|currently|safely|properly|further|directly))?\s+(?:engage|discuss|talk|continue|participate|have this|help(?! but| feeling| thinking| wondering| noticing)|assist|provide|give(?! up)|share|answer|respond|support)\b`, 'i');
// A harmful specific, and the self-harm context that makes it harmful. Both are needed:
// "methods of coping" has the first without the second.
const HARMFUL_SPECIFIC = /\b(?:methods?|ways? to|how to|instructions|doses?|dosage|how many|how much|means|amounts?)\b/i;
const HARM_CONTEXT = /\b(?:suicid\w*|kill (?:yourself|myself|themselves)|end (?:your|my|their) life|self[- ]?harm\w*|(?:hurt|harm|cut|injur|poison)\w* (?:yourself|myself|themselves)|overdos\w*|lethal|fatal|die|dying|hang\w*|poison\w*)\b/i;
const HARM_REQUEST = /\b(?:how (?:to|do i|can i|many|much)|best way|painless|quickest way|lethal|what dose)\b.*\b(?:die|kill|overdose|suicide|hang|cut|end my life|pills)\b/i;
// What a support refusal refuses: the conversation itself, feelings, risk, or a bare
// "this/that/it", which in a support chat almost always means the user's topic.
const SUPPORT_TOPIC = /\b(?:this|that|it|conversation|topic|subject|suicid\w*|self[- ]?harm\w*|harm\w*|kill\w*|feel\w*|emotion\w*|mental|depress\w*|anxi\w*|crisis|sad\w*|pain\w*|hurt\w*|lonel\w*|what you(?:'re| are) going through|your situation)\b/i;
const GRIEF_TOPIC = /\b(?:grie\w*|loss|lost (?:him|her|them|my|your)|bereave\w*|death|dying|died|dies|passed away|mourn\w*|funeral)\b/i;

// The verified line is ours, not the model's, so it never counts as unverified.
const VERIFIED = CRISIS_LINES.join(' ');

/**
 * Sentences, each keeping its trailing whitespace so that join('') restores the text.
 * A sentence ends at . ! or ? followed by whitespace or the end, or at a newline, so
 * "0.5" and "e.g.Childline" are not split. The same splitter is used for streaming,
 * classification and redaction, so all three agree on where sentences are.
 */
function sentences(text) {
  const t = String(text);
  const out = [];
  const end = /[.!?]+(?=\s|$)\s*|\n+/g;
  let last = 0;
  let m;
  while ((m = end.exec(t))) {
    if (m[0].length === 0) { end.lastIndex++; continue; }
    out.push(t.slice(last, m.index + m[0].length));
    last = m.index + m[0].length;
  }
  if (last < t.length) out.push(t.slice(last));
  return out;
}

function hasContact(s) {
  if (NAMED_SERVICE.test(s)) return true;
  return (s.match(PHONE_LIKE) || []).some(m => m.replace(/\D/g, '').length >= 7);
}

/**
 * Which kind of refusal a reply contains, or null if none.
 * Only the refusal's own sentence is read, so a later sentence about feelings does not
 * turn "I can't book appointments." into a support refusal.
 */
export function refusalKind(text, { userText = '' } = {}) {
  const t = String(text || '').replace(VERIFIED, '');
  // Every refusal is classified, and the most serious kind wins, so an early "I can't
  // book appointments." cannot hide a later "I can't talk about this."
  const rank = { grief_refusal: 3, support_refusal: 3, harmful_request: 2, capability_limit: 1 };
  let worst = null;
  for (const refusal of t.matchAll(new RegExp(REFUSAL.source, 'gi'))) {
    const rest = t.slice(refusal.index);
    const sentence = rest.slice(0, (rest.search(/[.!?](?=\s|$)|\n/) + 1) || rest.length);
    let kind = 'capability_limit';
    if ((HARMFUL_SPECIFIC.test(sentence) && HARM_CONTEXT.test(sentence)) || /\blethal\b/i.test(sentence)
        || HARM_REQUEST.test(userText)) kind = 'harmful_request';
    else if (GRIEF_TOPIC.test(sentence)) kind = 'grief_refusal';
    else if (SUPPORT_TOPIC.test(sentence)) kind = 'support_refusal';
    if (!worst || rank[kind] > rank[worst]) worst = kind;
  }
  return worst;
}

/**
 * What is wrong with a reply, or null.
 * kinds: inappropriate_refusal (grief_refusal or support_refusal) | unverified_contact.
 * harmful_request and capability_limit refusals are not problems.
 */
export function classifyReply(text, opts = {}) {
  const kind = refusalKind(text, opts);
  if (kind === 'grief_refusal' || kind === 'support_refusal') return 'inappropriate_refusal';
  const t = String(text || '').replace(VERIFIED, '');
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
function record(reason, kind, action) {
  events.push({ ts: Date.now(), reason, kind, action, version: GUARD_VERSION });
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
    record(reason, refusalKind(text, opts), 'replaced');
    return { text: GUARDED_REPLY, reason, action: 'replaced' };
  }
  const kept = sentences(String(text).replace(VERIFIED, '')).filter(s => !hasContact(s)).join('').replace(/\s+/g, ' ').trim()
    // a dangling list intro such as "please reach out to:" makes no sense once its items are gone
    .replace(/[^.!?]*:\s*$/, '').trim();
  if (kept.length < 40) {
    record(reason, null, 'replaced');
    return { text: GUARDED_REPLY, reason, action: 'replaced' };
  }
  record(reason, null, 'redacted');
  return { text: `${kept} ${CONTACT_NOTE}`, reason, action: 'redacted' };
}

/**
 * How many characters of a partial reply are safe to show now; -1 if the reply is
 * already a problem.
 * Only finished sentences are shown: text up to the last ". ", "! ", "? " or newline
 * whose sentences have all been checked. The unfinished sentence is never shown,
 * however harmless it looks, because any prefix ("Child", "I c", "0800") can still grow
 * into something the final guard removes.
 */
export function streamSafeLength(partial, opts) {
  const t = String(partial || '');
  if (classifyReply(t, opts)) return -1;
  let safe = 0;
  const boundary = /[.!?]+\s+|\n+/g;
  let m;
  while ((m = boundary.exec(t))) safe = m.index + m[0].length;
  return safe;
}
