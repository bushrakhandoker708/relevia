/*
 * safetyS3.js - S3 input-risk routing. Deterministic rules, not a clinical classifier.
 *
 * WHY a new file: S2 (safety.js) is hash-recorded in the research results, so it
 * stays frozen for historical comparison. S3 reuses S2's text normalisation and
 * adds what the evidence showed S2 lacked:
 *
 *   v3 held-out misses (6/24): "killin myself", an adverb between "i" and "want",
 *   a dropped subject, a bare "SUICIDAL", "took all my pills to end it", and
 *   "ending it tonight". The model's own replies to four of those were harmful.
 *   v4 baseline: S2 missed all 13 emergencies, i.e. an overdose or method already
 *   in progress, and called "i would never kill myself" urgent.
 *
 * What S3 changes:
 *   1. A new top tier, EMERGENCY: something already taken or done, or the means in
 *      hand with intent. It gets a fixed emergency-services message, never the model.
 *   2. Clause-level negation. A clause like "i would never kill myself" is dropped,
 *      but the next clause ("...but now i want to die") is still read.
 *   3. Frames instead of fixed sentences: an intent/desire/ideation word, optional
 *      adverbs, then a self-harm target. This covers "i honestly just want to die"
 *      without listing every sentence.
 *   4. Multi-turn: "yes" after a risk message, a retraction after an urgent one, and
 *      symptoms after a stated overdose all stay urgent or escalate.
 *
 * Known limits (see relevia-research/docs/safety_failure_taxonomy.md): English plus a
 * few French/Spanish phrases, no understanding of sarcasm, and the evaluation set
 * was written by the same agent that wrote these rules.
 */
import { normaliseRiskText, assessRisk as assessS2, CRISIS_RE } from './safety.js';
import { CRISIS_LINES } from './consts.js';

export const DETECTOR_VERSION = 'S3';

// Extra shorthand not in S2. Applied after S2's normalisation.
const SHORTHAND_S3 = [
  [/\bimma\b/g, 'i am going to'], [/\bima\b/g, 'i am going to'], [/\brly\b/g, 'really'], [/\bsrsly\b/g, 'seriously'],
  [/\b(want|need|going|plan|ready) 2\b/g, '$1 to'], [/\bno more\b/g, 'anymore'], [/\bany more\b/g, 'anymore'],
  [/\bi was dead\b/g, 'i were dead'],
];

function clean(text) {
  let t = normaliseRiskText(text);
  for (const [re, out] of SHORTHAND_S3) t = t.replace(re, out);
  return t;
}

const ADV = String.raw`(?:(?:really|realy|honestly|seriously|just|actually|literally|so|truly|sometimes|still|now|kinda|kind of|totally|genuinely|definitely|finally)\s+)*`;
const SELF_TARGET = String.raw`(?:die|be dead|kill(?:ing)? myself|end(?:ing)? my (?:own )?life|end(?:ing)? it(?: all)?(?! with\b)|end(?:ing)? things(?! with\b)|take my (?:own )?life|hurt(?:ing)? myself|harm(?:ing)? myself|cut(?:ting)? myself|commit suicide|jump)`;
const WANT = String.raw`(?:want|wanna|need|plan|planning|intend|am going|am about|have decided|decided|am ready|will|might|may|wish i could)`;

// A harm target that is negated inside its own clause ("i would never kill myself").
// "do not want to live" is NOT here: that is a risk statement.
// POST HOC FIX (after the first v4 run): "can't stop thinking about ending my life" was
// read as negated. A negator followed by stop/help/quit is not a negation of the risk.
const NEGATED_HARM = new RegExp(String.raw`\b(?:not|never|no longer|do not|would not|will not|could not|cannot|without|no intention of|no plans? to|no desire to)\b(?!\s+(?:stop|help|quit)\b)(?:\s+[a-z']+){0,3}?\s+(?:${SELF_TARGET}|suicidal|suicide|self[- ]harm(?:ing)?|overdos\w*)\b`);
const PAST_ONLY = /\b(?:years ago|last year|in the past|used to|when i was (?:younger|a teenager|at school))\b/;
const FICTION = /\b(?:novel|story|character|film|movie|book|chapter|poem|essay|research|class|lecture|textbook|article|prevention|report)\b/;

const RULES = {
  emergency: [
    // something already taken, in a dangerous quantity, AND it is a medicine.
    // POST HOC FIX (ED scan): without the medicine noun, "I took my son out and did a
    // bunch of nice stuff" and "took a lot of fun vacations" were routed as emergencies.
    /\b(?:took|taken|swallowed|downed|drank|drunk)\b[^.!?]{0,40}?\b(?:all (?:of )?(?:my|the|her|his|their)|whole (?:bottle|packet|box|pack|strip)|bottle of|bunch of|lot of|loads of|handful of|too many|\d{2,})\b[^.!?]{0,30}?\b(?:pills|tablets|meds|medication|medicine|paracetamol|ibuprofen|aspirin|antidepressants|painkillers|sleeping|capsules|insulin|drugs)\b/,
    /\b(?:took|taken|swallowed)\b[^.!?]{0,30}\b(?:pills|tablets|meds|antidepressants|painkillers)\b[^.!?]{0,20}\b(?:at once|to end it|to die)\b/,
    // POST HOC FIX: the subject is often dropped ("overdosed on my meds an hour ago")
    /\b(?:overdosed|taken an overdose|od'?d on)\b/,
    /\b(?:drank|drunk|swallowed) (?:some )?(?:bleach|antifreeze|poison|weedkiller)\b/,
    // means in hand plus intent or a time
    // (a time alone, "take my tablets now", is ordinary; intent or readiness is required)
    /\b(?:rope|noose|knife|blade|razor|gun|pills|tablets)\b.*\b(?:ready|in my hand|here with me|going to do it|doing it)\b/,
    // in a dangerous place and about to act
    /\b(?:on|at) the (?:bridge|roof|ledge|edge|tracks|platform)\b.*\b(?:jump|do it|end it)\b/,
    // POST HOC FIX (ED scan): "dared me to jump off the highest cliff into the water"
    /\b(?:going to|about to|gonna|will|want to) (?:jump|throw myself) (?:off|from|in front of) (?:a |the |this )?(?:bridge|building|roof|balcony|tower|car park|train|tracks|lorry|bus)\b/,
    // injury already done
    /\bcut\b.*\b(?:won'?t|will not|cannot|can'?t) stop bleeding\b/,
    /\b(?:taking|swallowing) (?:the|all the|all my) (?:pills|tablets)(?: now| right now)\b/,
    /\bengine running\b.*\bgarage\b/,
  ],
  urgent: [
    new RegExp(String.raw`\b(?:i (?:am |have )?)?${ADV}${WANT} to ${ADV}${SELF_TARGET}\b`),
    new RegExp(String.raw`\b(?:i (?:am |was |have been |keep |can'?t stop |cannot stop )?)?${ADV}(?:thinking|thought|think) (?:of|about) ${ADV}(?:suicide|killing myself|ending (?:my life|it(?: all)?|things)|taking my (?:own )?life|dying|being dead)\b`),
    /\b(?:i (?:am |feel |felt |have been |keep feeling )?(?:\w+ )?suicidal|^suicidal\b|suicidal (?:again|tonight|now)|feeling suicidal)\b/,
    /\b(?:killing|kill|hurting|hurt|harming|harm|cutting) myself\b/,
    /\bend(?:ing)? (?:it all|my life)\b/,
    /\b(?:i am|i'm) (?:going to |about to )?end(?:ing)? (?:it|things)(?! with\b)(?:\s+(?:tonight|today|now|soon|this (?:week|weekend)))\b/,
    /\b(?:better off|would be better) (?:if i (?:were|was) dead|dead|without me)\b/,
    /\b(?:wish|wishing) i (?:were|was) dead\b/,
    /\b(?:no|don'?t see the|do not see the|cannot see the|lost the) (?:point|reason) (?:in |to |of )?(?:keep )?(?:living|live|being alive|going on)\b/,
    /\bno reason to (?:keep )?(?:living|live|go on|stay alive)\b/,
    /\b(?:^|[,.] |and |but )(?:i )?(?:do not|don'?t) (?:\w+ )?(?:want|wanna) to (?:live|be alive|exist)\b/,
    /\b(?:i )?(?:do not|don'?t) (?:\w+ )?want to be here anymore\b/,
    /\b(?:written|wrote|writing) (?:my|a) (?:suicide |goodbye )?note\b/,
    /\b(?:cannot|can'?t) keep myself safe\b/,
    /\b(?:given|giving) (?:everything|all my (?:things|stuff|belongings)) away\b/, /\bno future for me\b.*\b(?:tonight|after today|anymore)\b/,
    // French and Spanish (partial coverage only)
    /\b(?:je veux|j'ai envie de|je vais) (?:mourir|me tuer|me suicider|en finir)\b/, /\ben finir\b/,
    /\b(?:quiero|voy a) (?:morir|matarme|quitarme la vida)\b/,
  ],
  third_party: [
    /\b(?:my (?:friend|sister|brother|mum|mom|dad|partner|girlfriend|boyfriend|wife|husband|child|son|daughter|flatmate|roommate)|someone|somebody|a friend|they|she|he)\b.*\b(?:wants? to (?:die|kill (?:himself|herself|themselves))|(?:kill|hurt|harm)(?:ing)? (?:himself|herself|themselves)|end(?:ing)? (?:her|his|their) (?:own )?life|suicidal|going to jump|took an overdose|taken an overdose)\b/,
  ],
  check_in: [
    /\bi (?:cannot|can'?t) (?:do this|go on|take (?:it|this)) anymore\b/,
    /\b(?:sleep|go to sleep) and (?:not|never) wake up\b/, /\bi wish i (?:would not|wouldn'?t) wake up\b/,
    /\bwhat'?s the point (?:of|in) (?:anything|everything|it all|living)\b/,
    /\b(?:so |just )?done with (?:everything|it all|life)\b/,
    /\bkms\b/, /\bdisappear forever\b/,
  ],
};

const AFFIRM = /^(?:yes|yeah|yep|yea|i do|i am|tonight|now|soon|doing it now|i have a plan|i have decided to do it|i have the (?:pills|rope|knife)(?: here)?)\b/;
const RETRACT = /\b(?:never ?mind|forget (?:i said|it|what i said)|just kidding|jk|ignore (?:that|me)|i am fine now|it'?s nothing)\b/;
const SYMPTOM = /\b(?:sleepy|drowsy|dizzy|can'?t breathe|cannot breathe|throwing up|vomiting|numb|passing out|heart racing|blurry)\b/;
const MEANS_NOW = /\b(?:i have|i've got|got) (?:the |my )?(?:pills|tablets|rope|knife|blade|gun)\b/;

function clauses(t) {
  return t.split(/(?:[.;!?]+|,|\bbut\b|\bthough\b|\bhowever\b)\s*/).map(s => s.trim()).filter(Boolean);
}

/** Tier for one message on its own: emergency | urgent | check_in | none. */
function messageTier(text) {
  const raw = clean(text);
  const fiction = FICTION.test(raw);
  // quoted lines inside a discussion of fiction or study are not the writer speaking
  const t = fiction ? raw.replace(/["“][^"”]*["”]/g, ' ') : raw;
  let best = 'none';
  let reason = 'no_rule_match';
  const raise = (tier, why) => {
    const order = ['none', 'check_in', 'urgent', 'emergency'];
    if (order.indexOf(tier) > order.indexOf(best)) { best = tier; reason = why; }
  };
  for (const c of clauses(t)) {
    if (NEGATED_HARM.test(c) && !/\b(?:but|now|tonight)\b/.test(c)) continue;
    if (RULES.emergency.some(r => r.test(c)) && !(fiction && !/\bi\b/.test(c))) {
      raise(PAST_ONLY.test(t) ? 'check_in' : 'emergency', PAST_ONLY.test(t) ? 'past_event' : 'emergency_in_progress');
    }
    // POST HOC FIX (ED scan): "he did it perfectly and did not hurt himself"
    const negatedOther = /\b(?:not|never|didn'?t|did not|without)\b[^.!?]{0,20}\b(?:hurt|harm|kill)(?:ing)? (?:himself|herself|themselves)\b/.test(c);
    if (!negatedOther && RULES.third_party.some(r => r.test(c))) raise('urgent', 'third_party_risk');
    // study or fiction context only suppresses clauses that are not about the writer
    const aboutMe = /\b(?:i|me|myself)\b/.test(c);
    if ((!fiction || aboutMe) && RULES.urgent.some(r => r.test(c))) raise('urgent', 'explicit_or_indirect_risk');
    if (RULES.check_in.some(r => r.test(c))) raise('check_in', 'ambiguous_distress');
  }
  // Emergency patterns also over the whole message, since a clause split can separate
  // the means from the intent ("i have the knife in my hand, i'm going to do it").
  if (best !== 'emergency' && !fiction && !PAST_ONLY.test(t) && !clauses(t).some(c => NEGATED_HARM.test(c))
      && RULES.emergency.some(r => r.test(t))) raise('emergency', 'emergency_in_progress');
  // Keep S2's verdict as a floor, but only for clauses that are not negated.
  if (best === 'none' && !fiction) {
    const kept = clauses(t).filter(c => !NEGATED_HARM.test(c)).join('. ');
    const s2 = kept ? assessS2(kept).level : 'none';
    if (s2 === 'urgent') raise('urgent', 's2_rule');
    else if (s2 === 'check_in') raise('check_in', 's2_check_in');
  }
  return { tier: best, reason };
}

/**
 * Risk for the current message, given earlier turns. `level` keeps the S1/S2 meaning
 * (urgent | check_in | none) so existing callers work; `tier` adds 'emergency'.
 */
export function assessRisk(text, history = []) {
  const now = messageTier(text);
  const prevUser = history.filter(r => r.role === 'user').slice(-2).map(r => messageTier(r.content));
  const t = clean(text);
  let { tier, reason } = now;
  const priorUrgent = prevUser.some(p => p.tier === 'urgent' || p.tier === 'emergency');
  const priorEmergency = prevUser.some(p => p.tier === 'emergency');
  const priorRisk = priorUrgent || prevUser.some(p => p.tier === 'check_in');
  if (tier !== 'emergency') {
    // POST HOC FIX: "i took the pills" then "i feel sleepy now". The first message alone
    // is not an emergency, but a symptom after it is. Prescribed use is excluded.
    const priorIngestion = history.filter(r => r.role === 'user').slice(-2).some(r => {
      const p = clean(r.content);
      return /\b(?:took|taken|swallowed|had)\b.*\b(?:pills|tablets|meds|medication)\b/.test(p)
        && !/\b(?:doctor|prescribed|as usual|my usual|every (?:day|morning|night)|this morning)\b/.test(p);
    });
    if ((priorEmergency || priorIngestion) && SYMPTOM.test(t)) { tier = 'emergency'; reason = 'symptoms_after_ingestion'; }
    else if (priorUrgent && MEANS_NOW.test(t)) { tier = 'emergency'; reason = 'means_after_risk'; }
    else if (tier !== 'urgent' && priorRisk && AFFIRM.test(t)) { tier = 'urgent'; reason = 'affirmed_after_risk'; }
    else if (tier !== 'urgent' && priorUrgent && RETRACT.test(t)) { tier = 'urgent'; reason = 'retraction_after_risk'; }
  }
  return { level: tier === 'emergency' ? 'urgent' : tier, tier, reason, detector: DETECTOR_VERSION };
}

export function isSensitiveChatText(text) {
  const t = clean(text);
  return CRISIS_RE.test(t) || assessRisk(t).tier !== 'none';
}

// Fixed, non-generative responses. PENDING BUSHRA'S REVIEW (and ideally a qualified
// reviewer) before any public release. Emergency numbers are the official ones
// for the regions named; nothing here depends on the model.
export const EMERGENCY_SUPPORT = [
  'This sounds like it could be a medical emergency, and it needs real help now.',
  'Please call your local emergency number straight away: 999 in the UK, 112 in the EU and many other countries, 911 in the US and Canada. If you cannot call, go to the nearest emergency department or ask anyone nearby to call for you.',
  'If you or someone else has taken something, tell them what it was and how much, and keep the packet. Do not wait to see if you feel better.',
  'If this is about someone else, stay with them if it is safe and call for them.',
  'I am an AI. I cannot call anyone or check on you, so please do it now.',
].join(' ');

export const URGENT_SUPPORT = [
  'What you described may need urgent real-world support. I am an AI and cannot provide emergency care or keep you safe.',
  'If you or someone else may act on these thoughts now, contact your local emergency service or go to the nearest emergency department now. Ask someone nearby you trust to stay with you or help you make contact.',
  'Do not wait for this chat or a breathing exercise before seeking urgent help.',
  ...CRISIS_LINES,
].join(' ');

export const CHECK_IN = 'I may be misunderstanding. Are you or someone else in immediate danger, or thinking about self-harm? If there is immediate danger, contact your local emergency service and someone nearby you trust now. I am an AI and cannot provide emergency care.';

export function CrisisFilter(text, history = []) {
  const risk = assessRisk(text, history);
  if (risk.tier === 'emergency') return EMERGENCY_SUPPORT;
  if (risk.tier === 'urgent') return URGENT_SUPPORT;
  if (risk.tier === 'check_in') return CHECK_IN;
  return null;
}

export const FIXED_SAFETY_REPLIES = [EMERGENCY_SUPPORT, URGENT_SUPPORT, CHECK_IN];
