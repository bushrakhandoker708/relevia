/**
 * Affirmations: the sets used on the Affirmations page, the sentences someone keeps,
 * and the few that Home picks for a visit.
 *
 * Wording rules: first person, present tense, and nothing that promises an outcome
 * (no "I am safe", no "my body is healing", no "the universe has me"). A sentence
 * should still be true on a bad day.
 *
 * Kept sentences are stored in this browser only (localStorage), as the sentence text.
 * Nothing here reads chat or journal content.
 */

import { readActivity, techniqueLevel } from './activity.js';

export const KEPT_KEY = 'relevia_kept_affirmations_v1';

export const SETS = {
  panic: {
    label: 'In a panic',
    lines: [
      'This feeling is strong, and it is a feeling. It rises, and it falls.',
      'I can let my breath be slow, even if my thoughts are fast.',
      'My body is in alarm mode. I can notice it without arguing with it.',
      'I have got through moments like this before.',
      'I only need to get through the next minute.',
      'I can put both feet on the floor and feel them there.',
      'My heart is beating fast because adrenaline is in my body. That will settle.',
      'I can name five things I can see. That is enough to start with.',
      'I am allowed to ask someone to stay with me.',
      'I do not have to fight this. I can let it pass at its own pace.',
      'Slow out-breath. Then another one.',
      'It is all right to sit down, step outside, or stop what I am doing.',
      'My thoughts are loud right now. Loud is not the same as true.',
      'I can soften my shoulders, my jaw and my hands.',
      'If this feels different from usual, I can get medical help. That is a good choice, not a failure.',
      'I can be scared and still be kind to myself.',
    ],
  },
  anxiety: {
    label: 'Worried',
    lines: [
      'My thoughts are thoughts. I can watch them go by.',
      'I do not need every answer today.',
      'One step at a time is still moving.',
      'I can come back to what is in front of me.',
      'Worry is trying to protect me. I can thank it and put it down for a moment.',
      'I can choose one small thing I can actually do, and do that.',
      'Uncertainty is uncomfortable, and I can carry it.',
      'Resting is not wasting time.',
      'I can let this be a problem for later, at a time I choose.',
      'Not everything that feels urgent is urgent.',
      'I have handled hard things before, even when it did not feel like it.',
      'I can be curious about what might go right, too.',
      'My worth is not measured by how much I get done.',
      'Breathing slowly is something I can do right now.',
      'I can talk to someone about this. I do not have to sort it out alone.',
    ],
  },
  hardDay: {
    label: 'A hard day',
    lines: [
      'Today is heavy. I can still do one gentle thing.',
      'Getting through the day counts.',
      'I can lower the bar today, and that is allowed.',
      'A small thing done is better than a big thing waiting.',
      'I can drink some water and eat something. That is caring for myself.',
      'Hard days end. Tomorrow is a new page.',
      'I do not have to feel better to deserve rest.',
      'I can let some things wait.',
      'Feeling low does not mean I am doing it wrong.',
      'I can reach out, even with a short message.',
      'I am more than how today is going.',
      'It is enough to take care of the next hour.',
    ],
  },
  confidence: {
    label: 'Steady',
    lines: [
      'I can do hard things slowly.',
      'My voice matters, even when it shakes.',
      'I do not have to be perfect to be worth something.',
      'Each time I try, I learn a little more about what helps.',
      'I am allowed to take up space.',
      'I can trust myself to try, and to adjust.',
      'Being nervous and being capable can happen together.',
      'I can notice what I did well today, however small.',
      'Mistakes are part of learning, not proof that I cannot.',
      'I am becoming someone who looks after themself.',
      'I can say no. I can say not yet.',
      'Courage often feels like fear, moving anyway.',
      'I am allowed to be proud of small steps.',
    ],
  },
  selfCompassion: {
    label: 'Kinder to myself',
    lines: [
      'I can speak to myself the way I would speak to a friend.',
      'It makes sense that I feel this way.',
      'I do not have to earn rest or care.',
      'I can be imperfect and still be worth caring for.',
      'I am learning, and learning is untidy.',
      'Even on hard days, I am trying. That counts.',
      'I can forgive myself for not knowing then what I know now.',
      'My feelings are allowed, all of them.',
      'I can start again, as many times as I need.',
      'Being gentle with myself is not giving up.',
      'I am not my worst moment.',
      'I can hold this feeling with a soft hand.',
      'I can let "good enough" be good enough.',
    ],
  },
  grounding: {
    label: 'Grounded',
    lines: [
      'My feet are on the ground. I can feel where they touch.',
      'I am here, in this room, at this moment.',
      'I can notice the air going in, and the air going out.',
      'The chair is holding my weight. I can let it.',
      'I can feel the temperature of my hands.',
      'I can listen for the furthest sound, and the nearest.',
      'Right now, I can just notice. Nothing else is needed.',
      'I can let my shoulders drop a centimetre.',
      'I can look for something blue, something soft, something still.',
      'This moment is the only one I have to be in.',
      'I can press my palms together and feel the pressure.',
      'I can come back to my body, again and again.',
    ],
  },
  rest: {
    label: 'Winding down',
    lines: [
      'The day is done. What is unfinished can wait for tomorrow.',
      'I can let my body get heavy.',
      'Nothing more is needed from me tonight.',
      'I can let my thoughts drift past without following them.',
      'Rest is part of looking after myself.',
      'If sleep does not come quickly, resting still helps.',
      'I can loosen my forehead, my jaw and my hands.',
      'I can put tomorrow\'s worries on paper and leave them there.',
      'Each slow breath out lets a little more go.',
      'I did enough today.',
      'I can let the room be quiet around me.',
      'Tomorrow can be met tomorrow.',
    ],
  },
  connection: {
    label: 'Reaching out',
    lines: [
      'Asking for help is a skill, not a weakness.',
      'People who care about me would want to know.',
      'I can send one short message. That is enough.',
      'I do not have to explain everything to be supported.',
      'Talking things through can make them feel smaller.',
      'Other people feel this too. I am not the only one.',
      'I can let someone sit with me, even quietly.',
      'Professional help is there for moments like this.',
      'I can accept kindness without paying it back straight away.',
      'Being understood starts with saying a little.',
      'I can choose who I talk to and how much I share.',
    ],
  },
  comingBack: {
    label: 'Keep going',
    lines: [
      'Coming back to what helps is a way of caring for myself.',
      'Practice makes these skills easier to reach for.',
      'Some days it helps more than others, and that is normal.',
      'I am building a small toolkit, one try at a time.',
      'I can notice which things suit me best.',
      'Progress is not a straight line, and it still counts.',
      'I keep showing up for myself.',
      'Every time I practise on a calm day, it is there for a hard one.',
      'I can be patient with how slowly change happens.',
      'Looking after myself is worth the time.',
    ],
  },
};

const ALL = Object.entries(SETS).flatMap(([set, s]) => s.lines.map((text) => ({ set, text })));

// ---- Kept sentences ----------------------------------------------------------------

const store = () => {
  try { return globalThis.localStorage || null; } catch { return null; }
};

export function readKept() {
  try {
    const v = JSON.parse(store()?.getItem(KEPT_KEY) || '[]');
    return Array.isArray(v) ? v.filter((t) => typeof t === 'string').slice(0, 200) : [];
  } catch {
    return [];
  }
}

export function toggleKept(text) {
  const kept = readKept();
  const next = kept.includes(text) ? kept.filter((t) => t !== text) : [text, ...kept];
  try {
    store()?.setItem(KEPT_KEY, JSON.stringify(next));
    globalThis.dispatchEvent?.(new Event('relevia:activity'));
  } catch { /* storage blocked */ }
  return next;
}

export function forgetKept() {
  try { store()?.removeItem(KEPT_KEY); } catch { /* ignore */ }
}

// ---- Home picks --------------------------------------------------------------------

// A small, stable number from a string, so a visit gets the same picks on reload.
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/**
 * Three sentences for Home, chosen from how the site has been used (counts only) and the
 * time of day. Each comes with a short, plain reason. Never reads chat or journal text.
 */
export function affirmationsForHome(activity = readActivity(), now = new Date(), kept = readKept()) {
  const hour = now.getHours();
  const reasons = [];
  // Each reason says only what was recorded: a page opened, an exercise started, or an
  // exercise finished (activity.js DONE_MEANS). It never implies anyone feels better.
  const lv = (k) => techniqueLevel(activity, k);
  const said = {
    breathing: { completed: 'Because you finished a breathing round', started: 'Because you started the breathing circle', opened: 'Because you looked at breathing' },
    mindfulness: { completed: 'Because you went through all five senses', started: 'Because you started grounding', opened: 'Because you looked at grounding' },
    journaling: { completed: 'Because you saved a journal entry', started: 'Because you started writing in the journal', opened: 'Because you opened the journal' },
    relaxation: { completed: 'Because you finished a relaxation exercise', started: 'Because you started a relaxation exercise', opened: 'Because you looked at relaxation' },
    visualization: { completed: 'Because you finished a visualisation', started: 'Because you started a visualisation', opened: 'Because you looked at visualisation' },
    affirmations: { started: 'Because you read some of these', opened: 'Because you opened the affirmations' },
  };
  const why = (k) => said[k][lv(k)] || null;
  if (kept.length) reasons.push({ kept: true, why: 'One you kept' });
  if (hour >= 21 || hour < 5) reasons.push({ set: 'rest', why: 'For this time of night' });
  // Stronger evidence first: something finished or started outranks a page opened.
  const rank = { completed: 0, started: 1, opened: 2 };
  [
    ['mindfulness', 'grounding'], ['breathing', 'panic'], ['journaling', 'selfCompassion'],
    ['relaxation', 'rest'], ['visualization', 'rest'], ['affirmations', 'confidence'],
  ].filter(([k]) => lv(k)).sort((x, y) => rank[lv(x[0])] - rank[lv(y[0])])
    .forEach(([k, set]) => reasons.push({ set, why: why(k) }));
  if (activity?.chats) reasons.push({ set: 'connection', why: activity.chats === 1 ? 'Because you wrote to Relevia' : 'Because you have written to Relevia' });
  if ((activity?.visits || 0) >= 3) reasons.push({ set: 'comingBack', why: 'Because you keep coming back' });
  // Nothing to go on yet: a gentle start.
  reasons.push({ set: 'anxiety', why: 'A gentle one to start with' });
  reasons.push({ set: 'selfCompassion', why: 'For today' });

  const seed = hash(`${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${activity?.visits || 0}`);
  const out = [];
  const usedSets = new Set();
  for (const r of reasons) {
    if (out.length === 3) break;
    if (r.kept) {
      out.push({ text: kept[seed % kept.length], why: r.why, set: null });
      continue;
    }
    if (usedSets.has(r.set)) continue;
    usedSets.add(r.set);
    const lines = SETS[r.set].lines.filter((l) => !out.some((o) => o.text === l));
    out.push({ text: lines[(seed + out.length * 7) % lines.length], why: r.why, set: r.set });
  }
  return out;
}

export const affirmationCount = ALL.length;
