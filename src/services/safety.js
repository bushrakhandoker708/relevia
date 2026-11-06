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


export function normaliseRiskText(text) {
  return String(text || '').normalize('NFKC').replace(/[\u2018\u2019]/g, "'")
    .toLowerCase().replace(/\s+/g, ' ').trim();
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
