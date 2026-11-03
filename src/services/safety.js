/* safety.js – ultra-fast on-device crisis detector */
import { CRISIS_LINES } from './consts.js';

// FIX: my old regex only caught 5 exact phrases, so "I'm suicidal", "I want to
// hurt myself", "I don't want to be here anymore" etc. went straight to the model.
// This is the ONE place the crisis list lives now, memoryUtils uses it too.
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

export function CrisisFilter(text) {
  if (!CRISIS_RE.test(text)) return null;
  return [
    "I care about you deeply, and I'm really glad you told me. If you're thinking about ending your life or hurting yourself, please reach out right now:",
    CRISIS_LINES.join(' | '),
    "If you're in immediate danger, call your local emergency number. You're not alone, let's breathe together until you feel safe to call.",
  ].join(' ');
}
