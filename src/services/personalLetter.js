/**
 * personalLetter.js – the Home page letter, written for the person reading it.
 *
 * I used to show everyone the exact same letter, every visit. Now it changes with:
 *   - their name, if they told the chat it (IndexedDB, same as the chatbot)
 *   - first visit vs coming back, and how long it's been
 *   - the time of day (a 2 a.m. visit needs a different letter than a morning one)
 *   - how their last chat felt (the chatbot's tone detection, last 24 hours only,
 *     because the chat history deletes itself after a day)
 *   - a different breathing exercise, grounding exercise and affirmation each visit
 *
 * PRIVACY: everything here is read from this browser only. Nothing is sent anywhere,
 * and there's no AI involved, so the letter shows up instantly.
 */

import { DB } from './db.js';
import { analyzeEmotionalTone } from './memoryUtils.js';

const VISITS_KEY = 'relevia_visits';
const SESSION_KEY = 'relevia_visit_counted';

// ---------- visits ----------

/**
 * Count this visit once per browser session (navigating between pages, or React
 * running effects twice in dev, shouldn't count as coming back).
 * Returns { count, daysAway, isFirst }.
 */
export function recordVisit() {
  let data = { count: 0, last: 0 };
  try {
    data = JSON.parse(localStorage.getItem(VISITS_KEY)) || data;
  } catch {
    // private browsing or blocked storage - every visit just looks like a first one
  }

  let counted = false;
  try {
    counted = sessionStorage.getItem(SESSION_KEY) === '1';
  } catch { /* same as above */ }

  if (counted) {
    // already counted this session, report what we stored then
    return { count: data.count, daysAway: data.daysAway ?? 0, isFirst: data.count <= 1 };
  }

  const now = Date.now();
  const daysAway = data.last ? Math.floor((now - data.last) / 86400000) : 0;
  const next = { count: data.count + 1, last: now, daysAway };
  try {
    localStorage.setItem(VISITS_KEY, JSON.stringify(next));
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch { /* fine, just not remembered */ }
  return { count: next.count, daysAway, isFirst: next.count <= 1 };
}

// ---------- what the chat knows ----------

/** Their name and how their most recent chat felt, from this browser's chat history. */
export async function getChatContext() {
  try {
    const db = await DB('anon');
    const [name, hist] = await Promise.all([db.getName(), db.getHist(24)]);
    const userMsgs = hist.filter((t) => t.role === 'user').map((t) => t.content);
    const tones = userMsgs.map(analyzeEmotionalTone);
    // a crisis anywhere in the last day matters more than whatever came after it
    const feeling = tones.includes('crisis')
      ? 'crisis'
      : [...tones].reverse().find((t) => t !== 'neutral') || null;
    return { name: name || '', feeling, chatted: userMsgs.length > 0 };
  } catch {
    return { name: '', feeling: null, chatted: false };
  }
}

// ---------- the words ----------

const pick = (list, n) => list[n % list.length];

function timeOfDay(hour) {
  if (hour < 5) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  if (hour < 22) return 'evening';
  return 'night';
}

const BREATHING = [
  "Let's breathe together, shall we? Place one hand on your heart, feel its gentle rhythm. Now, breathe in slowly through your nose for 4 counts... hold for 4... and release through your mouth for 6.",
  "Let's try a box breath together. Breathe in for 4... hold for 4... out for 4... hold for 4. Picture tracing the sides of a square as you go. Two or three rounds is plenty.",
  "Try this with me: take a deep breath in through your nose, then a second, smaller sip of air on top of it, and let it all go slowly through your mouth. Doing it just twice can soften a racing heart.",
  "Let your shoulders drop away from your ears. Breathe in gently for 4, and let the out-breath be longer, maybe 6 or 7, like you're cooling a cup of tea. Longer out-breaths tell your body it's safe.",
];

const GROUNDING = [
  "Notice three things you can see right now—maybe the gentle glow of your screen, a photo that brings you joy, or shadows dancing on the wall. Listen for two sounds. Feel one thing—the warmth of your hands or the support of your chair.",
  "Press your feet into the floor and notice it pressing back. Feel the weight of your body being held by your seat. You don't have to hold yourself up right now; something is already doing that for you.",
  "Look around and find five things that are the same colour, anything blue or anything green. Naming them, slowly, gives a busy mind something kind to do.",
  "Hold something with a texture—a sleeve, a mug, a blanket. Notice whether it's warm or cool, soft or rough. Staying with one small sensation is a way of coming back to now.",
];

const AFFIRMATIONS = [
  "You are safe. You are loved. You are enough—not because of what you do, but simply because you exist.",
  "You are allowed to take up space, to rest, and to go slowly.",
  "Your feelings are real, and they are not the whole of you.",
  "You have survived every hard day so far. This one is no different.",
  "Being gentle with yourself is not giving up. It is how healing happens.",
];

// a follow-up on their last chat - written so it never sounds like I'm reading their diary
const FOLLOW_UP = {
  crisis: "Last time you were here, things felt really dark, and I'm so glad you're still here. If those thoughts come back, please reach out to someone right away: US/Canada 988, UK 116 123, or findahelpline.com. You deserve support, not just survival.",
  anxiety: "Last time we talked, things felt anxious and fast. If your chest still feels tight, that's okay—anxiety comes in waves, and every wave passes. You don't have to fight it, just let it move through.",
  depression: "Last time we talked, things felt heavy. If today still feels that way, please aim small: some water, some fresh air, one kind thought about yourself. Small is still something.",
  sad: "Last time we talked, you were carrying some sadness. You don't have to be over it yet. Sadness is often love or hope with nowhere to go, and it's okay to let it be here for a while.",
  grief: "Last time we talked, you were carrying a loss. Grief doesn't follow a schedule, and there's no right way to do it. Missing someone is a way of still loving them.",
  lonely: "Last time we talked, you were feeling lonely. I hope you've had even one small moment of connection since—and if not, that's okay. You're not alone in feeling alone.",
  anger: "Last time we talked, you were really frustrated. That anger was pointing at something that mattered to you. I hope you've found a little room to breathe around it.",
};

const DEFAULT_ENCOURAGEMENT = "Whatever you're feeling right now—anxiety, sadness, overwhelm, or numbness—it's valid, and it's temporary. You've weathered every storm in your life so far, and that strength lives within you still.";

const CLOSING = {
  // (the night opening already says "It's late", so this one doesn't repeat it)
  night: "Let this be enough for today. If sleep won't come, you don't have to force it—rest your eyes, keep breathing slowly, and let the night be quiet with you.",
  morning: "As you move into your day, go gently. You don't have to have everything figured out by lunchtime. Just the next small step.",
  afternoon: "Take all the time you need. Move gently through the rest of your day. You don't have to be perfect or have everything figured out. Just be kind to yourself.",
  evening: "As the day winds down, you're allowed to set down whatever you've been carrying. Whatever today was, you got through it.",
};

/**
 * Build the letter.
 * @param {{count:number, daysAway:number, isFirst:boolean}} visit - from recordVisit()
 * @param {{name:string, feeling:string|null, chatted:boolean}} chat - from getChatContext()
 * @param {Date} [now]
 */
export function buildLetter(visit, chat, now = new Date()) {
  const tod = timeOfDay(now.getHours());
  const n = visit.count || 1; // rotates the exercises so each visit feels new

  // greeting
  let greeting;
  if (chat.name) greeting = visit.isFirst ? `Dear ${chat.name},` : `Hey ${chat.name}, welcome back,`;
  else greeting = visit.isFirst ? 'Hey beautiful soul,' : 'Hey again, beautiful soul,';

  // opening
  let opening;
  if (visit.isFirst) {
    opening = "I see you here, and I want you to know—you're incredibly brave just for being present in this moment. Right now, in this very second, you are exactly where you need to be.";
  } else if (n % 10 === 0) {
    opening = `This is your ${n}th time here. Coming back again and again is what healing really looks like—quiet, steady, and brave. I'm glad this has become a place you return to.`;
  } else if (visit.daysAway >= 14) {
    opening = "It's been a while, and it's really good to see you. Whatever these weeks have held, you don't need to explain any of it. You're here now, and that's enough.";
  } else if (visit.daysAway >= 1) {
    const days = visit.daysAway === 1 ? 'a day' : `${visit.daysAway} days`;
    opening = `It's been ${days} since you were last here. I hope you've been a little gentle with yourself. However things have been, you came back, and that matters.`;
  } else {
    opening = "You came back today. Whatever brought you here again, I'm glad you did. This is your place to land, as often as you need it.";
  }
  if (tod === 'night') {
    opening = `It's late. If your mind won't quiet down, you're not the only one awake with your thoughts. ${opening}`;
  }

  return {
    greeting,
    opening,
    breathing: pick(BREATHING, n - 1),
    grounding: pick(GROUNDING, n - 1),
    encouragement: (chat.chatted && FOLLOW_UP[chat.feeling]) || DEFAULT_ENCOURAGEMENT,
    closing: CLOSING[tod],
    affirmation: pick(AFFIRMATIONS, n - 1),
    signature: 'With infinite love and gentle support,',
    // the crisis follow-up is the one paragraph that must never be skipped past
    urgent: chat.feeling === 'crisis',
  };
}
