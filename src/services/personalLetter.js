/**
 * The home page letter.
 *
 * Safety boundary (kept from the 6 November 2026 safety fix): the letter never reads
 * chat history, never uses a name, never refers back to what someone said or felt, and
 * never says "last time". A letter that echoed an earlier crisis chat was the reason
 * this was locked down.
 *
 * REDESIGN (21 November 2026): the letter now changes with what someone has *done* on
 * the site, using the counts in services/activity.js: visits, techniques opened and
 * the number of chats started. It changes on every visit. With no activity it is the
 * default welcome letter.
 */
import { TECHNIQUES, techniqueLevel, recordVisit as recordActivityVisit } from './activity.js';

export const recordVisit = recordActivityVisit;
export async function getChatContext() { return { name: '', feeling: null, chatted: false }; }

export const HOME_EXERCISES = [
  'If comfortable, let your breathing settle at its own pace. You do not need to hold your breath or reach a target count. Stop any exercise that makes you feel worse.',
  'You could notice three things around you, or the support of your chair. This is optional; choose something else if focusing on sensations is uncomfortable.',
  'If it feels all right, let your shoulders drop a little and your hands rest. Nothing needs to change straight away.',
  'You might look for one small, ordinary thing nearby, a cup or a plant or the light on a wall, and stay with it for a few breaths.',
  'If you can, put your feet flat on the floor and notice it underneath you. Skip this if it does not feel right today.',
];

const NOTES = [
  'Your needs deserve consideration, including rest and support from other people.',
  'Going slowly is allowed.',
  'Small steps count, even the ones nobody else sees.',
  'You can be kind to yourself without having earned it first.',
  'It is all right to ask for help more than once.',
  'Rest is part of looking after yourself, not a break from it.',
];

/*
 * The period a letter is written in: each month has its own line and colours, a few
 * dates get their own note, and the weekday can add one. Lines talk about the month and
 * the day rather than the season, because seasons differ between hemispheres.
 */
const MONTHS = [
  { name: 'January', line: 'A new year has started. You do not need resolutions; getting through ordinary days counts.', env: ['#DDE8F6', '#BCD0EC'], seal: '#3E6FD8', stamp: '#7FA7D9' },
  { name: 'February', line: 'February is a short month. Short is allowed, for months and for efforts.', env: ['#F8DCE3', '#F1BFCB'], seal: '#C2456A', stamp: '#E2647F' },
  { name: 'March', line: 'March is a month of slow change. Things can shift a little at a time.', env: ['#DCEFE1', '#BFE0C8'], seal: '#3F8A5A', stamp: '#6FAF85' },
  { name: 'April', line: 'April weather changes its mind a lot. Feelings are allowed to do the same.', env: ['#E9E4FA', '#D3C9F4'], seal: '#7F6FD0', stamp: '#9B8CE0' },
  { name: 'May', line: 'May is often a busy month. If the world feels loud, a quiet minute here is enough.', env: ['#FCEBC7', '#F7D893'], seal: '#C98A12', stamp: '#F4B63A' },
  { name: 'June', line: 'June marks the middle of the year. Wherever you have got to, you have got here.', env: ['#FCE3D2', '#F6C7A6'], seal: '#C9673A', stamp: '#EE9A6B' },
  { name: 'July', line: 'July can be a month of long days. Rest counts as something you did.', env: ['#D8F0EE', '#B3E0DB'], seal: '#2F8C86', stamp: '#5FB8B0' },
  { name: 'August', line: 'August often runs slower. You are allowed to slow down with it.', env: ['#FCEBC7', '#F4D49A'], seal: '#B5781B', stamp: '#E6A63C' },
  { name: 'September', line: 'September feels like a fresh start for many people. You can start small, or not at all.', env: ['#F3E3C8', '#E8CC9C'], seal: '#A8662B', stamp: '#D4894A' },
  { name: 'October', line: 'October has World Mental Health Day in it. Looking after your mind is ordinary, everyday work.', env: ['#F6DCC6', '#EDBB94'], seal: '#B4562A', stamp: '#E07B45' },
  { name: 'November', line: 'November can feel long and low on light for many people. Warm drinks, early nights and small comforts all count.', env: ['#EFE1CF', '#E2C9A8'], seal: '#8E4B3A', stamp: '#B8735C' },
  { name: 'December', line: "December can be full of other people's plans. It is fine to keep some of the month for yourself.", env: ['#DCE9E2', '#BBD5C6'], seal: '#A3243B', stamp: '#3F7A5A' },
];

const HOLIDAYS = 'This time of year can bring joy, pressure, loneliness or all three. Whatever it brings you is allowed.';
const SPECIAL = {
  '1-1': 'It is the first day of the year. No need to have it all worked out by the end of it.',
  '2-14': 'Today is about love for a lot of people. Some of that is yours to keep, too.',
  '10-10': 'Today is World Mental Health Day. Thank you for spending a little of it here.',
  '12-24': HOLIDAYS,
  '12-25': HOLIDAYS,
  '12-31': 'It is the last day of the year. You do not have to sum it up.',
};

const WEEKDAY = [
  'It is Sunday. If tomorrow is weighing on you, you only have to deal with today.',
  'It is Monday. Starting the week slowly is still starting it.',
  null, null, null,
  'It is Friday. Whatever this week was, it is nearly done.',
  'It is Saturday. Rest is a perfectly good plan.',
];

export function periodTheme(now = new Date()) {
  const m = MONTHS[now.getMonth()];
  const special = SPECIAL[`${now.getMonth() + 1}-${now.getDate()}`] || null;
  return { month: m.name, line: special || m.line, weekday: special ? null : WEEKDAY[now.getDay()], envelope: m.env, seal: m.seal, stamp: m.stamp };
}

const pick = (list, n) => list[((n % list.length) + list.length) % list.length];

const partOfDay = (h) => (h < 5 ? 'night' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : h < 22 ? 'evening' : 'night');

const GREETINGS = {
  morning: ['Good morning,', 'Morning,'],
  afternoon: ['Good afternoon,', 'Hello again,'],
  evening: ['Good evening,', 'Hello, this evening,'],
  night: ['Hello, at this late hour,', 'Hello, night owl,'],
};

const CLOSINGS = {
  morning: 'Go gently into the day. Just the next small step is enough.',
  afternoon: 'Choose what is manageable for the next part of your day.',
  evening: 'Choose what is manageable for the rest of your evening.',
  night: 'If sleep is slow to come, resting your eyes still counts.',
};

const list = (words) => (words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`);

/**
 * Build the letter. `_chat` is accepted for compatibility and deliberately ignored.
 * `activity` is the result of recordVisit() (counts only); without it the letter is the
 * default welcome.
 */
export function buildLetter(visit, _chat, now = new Date(), activity = null) {
  const visits = Math.max(1, activity?.visits || visit?.count || 1);
  const when = partOfDay(now.getHours());
  // "Tried" means the exercise was started, not just that its page was opened.
  const level = (k) => techniqueLevel(activity, k);
  const tried = Object.keys(TECHNIQUES).filter((k) => level(k) === 'started' || level(k) === 'completed');
  const looked = Object.keys(TECHNIQUES).filter((k) => level(k) === 'opened');
  const seen = [...tried, ...looked];
  const untried = Object.keys(TECHNIQUES).filter((k) => !seen.includes(k));
  const starts = (k) => activity?.started?.[k] || 0;
  const favourite = tried.slice().sort((a, b) => starts(b) - starts(a))[0];
  const isNew = !activity || visits <= 1;

  const paragraphs = [];
  let suggestion = null;
  const theme = periodTheme(now);

  if (isNew) {
    paragraphs.push('This is a space for general information and optional reflection. Relevia is an AI-supported tool, not a person, therapist or emergency service.');
    paragraphs.push(theme.line);
    paragraphs.push(pick(HOME_EXERCISES, 0));
    paragraphs.push('There is no requirement to feel a particular way. Consider what support you need, including someone you trust or a qualified professional.');
    suggestion = { to: TECHNIQUES.breathing.to, label: 'Try the breathing circle' };
  } else {
    if (activity.daysAway >= 7) {
      paragraphs.push("It has been a little while. You're welcome here whenever you need it, for as long or as short as you like.");
    } else {
      paragraphs.push(pick([
        'Welcome back to the notebook. Nothing here needs catching up on.',
        "It's good to see this page open again. Take whatever you need from it.",
        'Welcome back. There is no right way to use this place.',
      ], visits));
    }
    paragraphs.push(theme.weekday ? `${theme.line} ${theme.weekday}` : theme.line);

    if (tried.length > 0) {
      const names = tried.map((k) => TECHNIQUES[k].label);
      paragraphs.push(tried.length === Object.keys(TECHNIQUES).length
        ? "You've started every technique in the notebook now. Some will suit you more than others, and that's how it should be."
        : `So far you've tried ${list(names)}.${favourite && starts(favourite) > 1 ? ` ${TECHNIQUES[favourite].title} seems to be one you come back to. It's there whenever you want it.` : ''}`);
    } else if (looked.length > 0) {
      paragraphs.push(`You've had a look at ${list(looked.map((k) => TECHNIQUES[k].label))}. They're there whenever you want to try one.`);
    }

    if (untried.length > 0) {
      const next = TECHNIQUES[pick(untried, visits)];
      paragraphs.push(`If you'd like something new today, there is ${next.label}: ${next.pitch}. Only if it feels right.`);
      suggestion = { to: next.to, label: `Try ${next.label}` };
    } else if (favourite) {
      suggestion = { to: TECHNIQUES[favourite].to, label: `Back to ${TECHNIQUES[favourite].label}` };
    }
    if (!suggestion && looked.length > 0) {
      const k = pick(looked, visits);
      suggestion = { to: TECHNIQUES[k].to, label: `Try ${TECHNIQUES[k].label}` };
    }

    if (activity.chats > 0) {
      paragraphs.push(activity.chats === 1
        ? "You've written to Relevia once. The notebook is here if you want to put something down again."
        : `You've started ${activity.chats} conversations with Relevia. The notebook is here if you want to write again.`);
    } else {
      paragraphs.push("If writing helps, you can talk with Relevia. It runs in your browser, and half a sentence is fine.");
    }

    paragraphs.push(pick(HOME_EXERCISES, visits));
  }

  return {
    greeting: isNew ? 'Welcome to Relevia,' : pick(GREETINGS[when], visits),
    paragraphs,
    closing: CLOSINGS[when],
    affirmation: pick(NOTES, isNew ? 0 : visits),
    signature: 'Relevia — general support, with limits',
    suggestion,
    letterNumber: visits,
    theme,
    urgent: false,
  };
}
