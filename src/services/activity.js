/**
 * What Relevia remembers about how someone uses the site, so the home letter can change.
 *
 * Kept in this browser only (localStorage), never sent anywhere. It holds counts and
 * dates, not words: which pages and techniques were opened, how many visits, and how
 * many chats were started. It never stores what anyone wrote, how they felt, or their
 * name, and a chat that triggered crisis support is not counted (see Chatbot.jsx).
 * forgetActivity() removes all of it.
 */

export const ACTIVITY_KEY = 'relevia_activity_v1';
const SESSION_KEY = 'relevia_visit_counted';
const DAY = 86400000;

export const TECHNIQUES = {
  breathing: { label: 'breathing', title: 'Breathing', to: '/coping/breathing', color: 'leaf', pitch: 'a circle to breathe along with' },
  mindfulness: { label: 'grounding', title: 'Grounding', to: '/coping/mindfulness', color: 'blue', pitch: 'noticing the room, one sense at a time' },
  relaxation: { label: 'relaxation', title: 'Relaxation', to: '/coping/relaxation', color: 'sun', pitch: 'letting tension go, step by step' },
  visualization: { label: 'visualisation', title: 'Visualisation', to: '/coping/visualization', color: 'lilac', pitch: 'a slow walk through a calm place' },
  journaling: { label: 'journaling', title: 'Journaling', to: '/coping/journaling', color: 'blue', pitch: 'a private page to write on' },
  affirmations: { label: 'affirmations', title: 'Affirmations', to: '/coping/affirmations', color: 'rose', pitch: 'short, kind sentences to read slowly' },
  activity: { label: 'moving a little', title: 'Moving', to: '/coping/activity', color: 'sage', pitch: 'gentle movement to use up the adrenaline' },
};

const empty = () => ({ version: 1, firstSeen: null, lastSeen: null, previousSeen: null, visits: 0, techniques: {}, chats: 0, aboutRead: false });

const store = () => {
  try { return globalThis.localStorage || null; } catch { return null; }
};

export function readActivity() {
  try {
    const raw = store()?.getItem(ACTIVITY_KEY);
    if (!raw) return empty();
    const v = JSON.parse(raw);
    if (v?.version !== 1) return empty();
    return { ...empty(), ...v, techniques: { ...(v.techniques || {}) } };
  } catch {
    return empty();
  }
}

const write = (a) => {
  try {
    store()?.setItem(ACTIVITY_KEY, JSON.stringify(a));
    globalThis.dispatchEvent?.(new Event('relevia:activity'));
  } catch { /* storage blocked: Relevia simply forgets */ }
  return a;
};

/** Count one visit per browser session. Returns the activity and how long they were away. */
export function recordVisit(now = Date.now()) {
  const a = readActivity();
  let counted = false;
  try { counted = globalThis.sessionStorage?.getItem(SESSION_KEY) === '1'; } catch { /* ignore */ }
  if (!counted) {
    a.previousSeen = a.lastSeen;
    a.visits += 1;
    a.firstSeen = a.firstSeen || now;
    a.lastSeen = now;
    write(a);
    try { globalThis.sessionStorage?.setItem(SESSION_KEY, '1'); } catch { /* ignore */ }
  }
  const daysAway = a.previousSeen ? Math.floor((now - a.previousSeen) / DAY) : 0;
  return { ...a, count: a.visits, daysAway, isFirst: a.visits <= 1 };
}

export function recordTechnique(key) {
  if (!TECHNIQUES[key]) return;
  const a = readActivity();
  a.techniques[key] = (a.techniques[key] || 0) + 1;
  a.lastTechnique = key;
  write(a);
}

export function recordAbout() {
  const a = readActivity();
  if (a.aboutRead) return;
  a.aboutRead = true;
  write(a);
}

/** Called once per chat, only when no crisis support was triggered. Stores a count only. */
export function recordChat() {
  const a = readActivity();
  a.chats += 1;
  write(a);
}

export function forgetActivity() {
  try {
    store()?.removeItem(ACTIVITY_KEY);
    store()?.removeItem('relevia_kept_affirmations_v1'); // sentences kept on the Affirmations page
    globalThis.sessionStorage?.removeItem(SESSION_KEY);
    globalThis.dispatchEvent?.(new Event('relevia:activity'));
  } catch { /* ignore */ }
}

/** A different small, optional thing each day, the same for everyone on that date. */
export const SMALL_THINGS = [
  'Drink a glass of water, slowly.',
  'Step outside, or open a window, for one minute.',
  'Send a short message to someone you like. It can be one word.',
  'Stretch your arms above your head, then let them drop.',
  'Name three things you can see that are the same colour.',
  'Put on one song you like and just listen.',
  'Unclench your jaw and let your shoulders drop.',
  'Write down one thing, however small, that went all right today.',
  'Wash your face with cool water.',
  'Tidy one small thing: a cup, a shelf, a corner of the desk.',
  'Look out of a window and find something that is moving.',
  'Hold something warm, like a mug, for a minute.',
];

export function smallThingFor(date = new Date()) {
  const dayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY);
  return SMALL_THINGS[dayNumber % SMALL_THINGS.length];
}
