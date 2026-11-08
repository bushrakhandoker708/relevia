/* Deterministic routing baseline. These rules are not a clinical classifier. */
import { CRISIS_LINES } from './consts.js';

// Frozen S0 expression retained for reproducible comparison and conservative storage screening.
export const CRISIS_RE = new RegExp(
  [
    'suicid',                                   // suicide, suicidal
    'kill(ing)? my ?self',
    'end(ing)? (it all|my life)',
    'take my (own )?life',
    'no (point|reason) (in )?(living|to live)',
    "(want|wanna|going) to die",
    "don'?t want to (live|be alive|be here)",
    'better off (dead|without me)',
    '(hurt|harm|cut(ting)?) my ?self',
    'self[- ]?harm',
    'overdose',
  ].join('|'),
  'i'
);


/*
 * S2 normalisation. S1 (frozen in relevia-research/detectors/s1) matched clean
 * sentences only: the perturbation probe showed "I wanna die", "dont", "my self",
 * one typo, stretched letters, leetspeak or a single zero-width character could all
 * slip past it. S2 keeps every S1 rule and instead rewrites the text into the form
 * those rules expect. Each step below answers one observed failure type.
 */
export const DETECTOR_VERSION = 'S2';

// Shorthand people actually type -> the spelling the rules are written for.
const SHORTHAND = [
  [/\bi'?m\b/g, 'i am'], [/\bi'?ve\b/g, 'i have'], [/\bi'?ll\b/g, 'i will'],
  [/\bdon'?t\b/g, 'do not'], [/\bcan'?t\b/g, 'cannot'], [/\bwon'?t\b/g, 'will not'],
  [/\bwanna\b/g, 'want to'], [/\bgonna\b/g, 'going to'], [/\bgotta\b/g, 'got to'],
  [/\bu\b/g, 'you'], [/\bmy self\b/g, 'myself'], [/\b(kill|cutt|end|hurt)in\b/g, '$1ing'],
];

// Words the rules depend on. A token one small edit away from one of these is read
// as that word, so a single slip ("myslef", "wnat") does not hide a risk message.
const RISK_WORDS = ['myself', 'suicidal', 'suicide', 'overdose', 'overdosed', 'kill', 'killing',
  'harm', 'hurt', 'alive', 'life', 'live', 'want', 'going', 'cannot', 'tonight'];
const RISK_SET = new Set(RISK_WORDS);

function oneEditAway(a, b) {
  // Damerau distance exactly 1. Substitutions only count for long words: in short
  // words a substitution too often turns an ordinary word into a risk word
  // ("like" -> "live", "love" -> "live"), which would be a false alarm.
  if (a === b) return false;
  if (a.length === b.length) {
    const diff = [...a].map((c, i) => (c !== b[i] ? i : -1)).filter(i => i >= 0);
    if (diff.length === 2 && diff[1] === diff[0] + 1 && a[diff[0]] === b[diff[1]] && a[diff[1]] === b[diff[0]]) return true;
    return diff.length === 1 && a.length >= 6;
  }
  const [s, l] = a.length < b.length ? [a, b] : [b, a];
  if (l.length - s.length !== 1) return false;
  for (let i = 0; i < l.length; i++) if (l.slice(0, i) + l.slice(i + 1) === s) return true;
  return false;
}

function correctToken(token) {
  if (token.length < 4 || RISK_SET.has(token)) return token;
  return RISK_WORDS.find(w => oneEditAway(token, w)) || token;
}

export function normaliseRiskText(text) {
  let t = String(text || '').normalize('NFKC')
    .replace(/[\u200b-\u200d\u2060\ufeff\u00ad]/g, '')       // invisible characters split words
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .toLowerCase();
  // leetspeak, only inside words that also contain letters (keeps phone numbers intact)
  t = t.replace(/[a-z0-9@$]+/g, w => (/[a-z]/.test(w) && /[0-9@$]/.test(w)
    ? w.replace(/1/g, 'i').replace(/3/g, 'e').replace(/0/g, 'o').replace(/4|@/g, 'a').replace(/5|\$/g, 's')
    : w));
  t = t.replace(/([a-z])\1{2,}/g, '$1');                     // "dieee" -> "die", "reallyyy" -> "realy"
  t = t.replace(/[a-z']+/g, correctToken);
  for (const [re, out] of SHORTHAND) t = t.replace(re, out);
  return t.replace(/\s+/g, ' ').trim();
}

const DIRECT = /\b(?:i (?:want|wanna|plan|intend|am going|might|may|will|need) to (?:die|(?:kill?|hurt|harm|cut) my ?self|end my life)|i(?:'m| am) (?:suicidal|going to (?:kill?|hurt|harm) my ?self)|(?:kill?|hurt|harm|cutting) my ?self|end(?:ing)? (?:it all|my life)|take my (?:own )?life|i (?:do not|don't) want to (?:live|be alive|be here)|no (?:point|reason) (?:in )?(?:living|to live)|better off (?:dead|without me))\b/;
const INDIRECT = /(?:final goodbye|goodbye (?:letter|note)).*(?:not be here|won't be here|tomorrow|tonight)|(?:cannot|can't) keep myself safe|(?:i have|i've) (?:taken an overdose|overdosed)|(?:quiero|voy a) (?:quitarme la vida|matarme)/;
const THIRD_PARTY = /\b(?:my (?:friend|sister|brother|partner|child)|someone)\b.*\b(?:wants? to die|(?:kill|hurt|harm) (?:himself|herself|themselves)|suicidal|taken an overdose)\b/;
const AMBIGUOUS = /\bi (?:cannot|can't) (?:do this|go on) anymore\b|\bi wish i (?:would not|wouldn't) wake up\b/;

function currentRisk(text) {
  let t = normaliseRiskText(text);
  // Scope exclusions to explicit statements, never the whole message. A later
  // affirmative clause still has to be inspected ("not suicidal, but ...").
  t = t.replace(/\bi(?: am|'m)? (?:not|no longer) (?:feeling )?suicidal\b/g, '')
    .replace(/\bi (?:do not|don't|never) (?:want|plan|intend) to (?:die|(?:kill|hurt|harm) my ?self)\b/g, '')
    .replace(/\bi used to (?:be suicidal|self[- ]harm)\b/g, '');
  if (/\b(?:novel|poem|character|quotation|textbook)\b/.test(t)) {
    t = t.replace(/["“][^"”]*["”]/g, '');
  }
  if (THIRD_PARTY.test(t)) return { level: 'urgent', reason: 'third_party_risk' };
  if (DIRECT.test(t) || INDIRECT.test(t)) return { level: 'urgent', reason: 'explicit_or_indirect_risk' };
  if (AMBIGUOUS.test(t)) return { level: 'check_in', reason: 'ambiguous_distress' };
  // Bare risk words require clarification unless their explicit context is benign.
  if (/\b(?:suicid\w*|self[- ]harm|overdose)\b/.test(t)
      && !/\b(?:class|report|essay|research|prevention|novel|poem|definition|textbook|history|years ago)\b/.test(t)) {
    return { level: 'check_in', reason: 'risk_reference_unclear' };
  }
  return { level: 'none', reason: 'no_rule_match' };
}

export function assessRisk(text, history = []) {
  const result = currentRisk(text);
  if (result.level !== 'none') return result;
  const previous = history.filter(row => row.role === 'user').slice(-2);
  // Only an explicit imminent continuation carries risk across turns. Assistant
  // templates and unrelated earlier text cannot label every later message urgent.
  if (/\b(?:doing it now|yes[,]? tonight|i have a plan|i have decided to do it)\b/.test(normaliseRiskText(text))
      && previous.some(row => currentRisk(row.content).level === 'urgent')) {
    return { level: 'urgent', reason: 'recent_user_risk_continuation' };
  }
  return result;
}

export function isSensitiveChatText(text) {
  const t = normaliseRiskText(text);
  return CRISIS_RE.test(t) || assessRisk(t).level !== 'none';
}

export const URGENT_SUPPORT = [
  'What you described may need urgent real-world support. I am an AI and cannot provide emergency care or keep you safe.',
  'If you or someone else may act on these thoughts now, contact your local emergency service or go to the nearest emergency department now. Ask someone nearby you trust to stay with you or help you make contact.',
  'Do not wait for this chat or a breathing exercise before seeking urgent help.',
  ...CRISIS_LINES,
].join(' ');

export function CrisisFilter(text, history = []) {
  const risk = assessRisk(text, history);
  if (risk.level === 'urgent') return URGENT_SUPPORT;
  if (risk.level === 'check_in') return 'I may be misunderstanding. Are you or someone else in immediate danger, or thinking about self-harm? If there is immediate danger, contact your local emergency service and someone nearby you trust now. I am an AI and cannot provide emergency care.';
  return null;
}
