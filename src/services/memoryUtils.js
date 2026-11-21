/* memoryUtils.js – tone detection + offline fallback replies (used by releviaBrain.js and groqApi.js) */
import { assessRisk, URGENT_SUPPORT } from './safetyS3.js';

export function analyzeEmotionalTone(text) {
  const t = text.toLowerCase();
  // Routing and fallback selection share the same deterministic policy.
  if (assessRisk(t).level !== 'none') return 'crisis';
  if (/(panic|anxious|anxiety|scared|can.t breathe|heart racing)/.test(t)) return 'anxiety';
  if (/(depressed|depression|hopeless|worthless|empty inside)/.test(t)) return 'depression';
  if (/(grief|died|death|loss|funeral)/.test(t)) return 'grief';
  if (/(angry|furious|betrayed|rage)/.test(t)) return 'anger';
  if (/(lonely|isolated|no friends|abandoned)/.test(t)) return 'lonely';
  // FIX: plain "I'm sad" used to fall through to neutral and get a generic reply
  if (/\b(sad|down|low|upset|crying|cried|hurt|heartbroken|miserable)\b/.test(t)) return 'sad';
  // FIX: good news used to land in "neutral", so "im happy" got "Tell me more—what's been
  // on your mind?" like nothing happened. Checked last, so "happy but anxious" stays anxious.
  // (promot/propot also catches the common "propotion" typo)
  // "not happy" / "don't feel happy" is the opposite, catch it before the happy check
  // (n't has no \b in front of it - "don't" is one word - so it sits outside that group)
  if (/(?:\b(?:not|never|no longer)|n['’]t)\s+(feel(ing)?\s+|so\s+|very\s+|really\s+)?(happy|excited|glad|proud|grateful)/.test(t)) return 'sad';
  if (/\b(happy|excited|so glad|great news|good news|promot|propot|got the job|passed|proud|grateful|thrilled|engaged|amazing day)/.test(t)) return 'happy';
  return 'neutral';
}

/* huge curated fallback pool – feel free to expand */
export const fallbackPool = {
  crisis: [URGENT_SUPPORT],
  anxiety: [
    "That sounds uncomfortable. If you would like, notice a few things around you and breathe gently without forcing or holding your breath. Stop if it feels worse. I cannot tell from a chat whether symptoms are caused by anxiety.",
    "You can take this one step at a time. Would you prefer to talk about what is happening or pause for a moment? If symptoms are new, severe or worrying, seek appropriate medical help rather than relying on this chat."
  ],
  depression: [
    "That sounds difficult to carry. If it feels manageable, consider one small task such as getting some water. Support from someone you trust or a qualified professional may also help; you do not have to explain everything here.",
    "You do not need to force yourself to feel better for this conversation. What would make the next few minutes a little more manageable?"
  ],
  grief: [
    "I am sorry to hear about the loss. There is no requirement to talk or to find a positive side. You can share a memory if you want to, or leave it there for now.",
    "People experience grief differently. Would it help to describe what you are missing, or would you prefer a quiet pause?"
  ],
  anger: [
    "You can acknowledge anger without acting on an impulse that could hurt someone. If possible, pause before sending a message or making a decision. What happened?",
    "Would you like to describe the situation? We can consider a response that respects your boundaries without assuming another person's motives."
  ],
  lonely: [
    "Feeling disconnected can be difficult. I am an AI, not a replacement for people in your life. If you want, we can consider a low-pressure way to contact someone you trust.",
    "Would a familiar activity or a brief message to someone feel manageable today? There is no pressure to make a large social plan."
  ],
  sad: [
    "I am sorry things feel difficult. You can describe what is weighing on you if you want to; you do not have to find perfect words.",
    "Would you prefer space to talk or help thinking through one small next step?"
  ],
  happy: [
    "That sounds like good news. What part mattered most to you?",
    "You can take a moment to enjoy that. Would you like to say more about it?"
  ],
  neutral: [
    "What would you like to talk about? I am an AI offering general supportive conversation, not professional care.",
    "You can share as much or as little as you want. If I misunderstand, you can correct me."
  ]
};

/*
 * Small talk. FIX: "hi" used to get "Sometimes we don't have the words..." and
 * "what r u doing?" got "Tell me more", because everything that wasn't an emotion
 * fell into the neutral pool. These cover the normal chit-chat people open with.
 * {ai} gets replaced with a short, honest note about the AI still loading.
 */
const SMALL_TALK = [
  {
    re: /^\s*(hi+|hey+|hello+|hiya|yo|sup|heya|salam|assalamu\s*alaikum|good\s+(morning|afternoon|evening))\b[\s!.?]*$/i,
    replies: [
      "Hey! 😊 I'm really glad you're here. How are you feeling today?{ai}",
      "Hi there! How's your day going so far, honestly?{ai}",
    ],
  },
  {
    re: /(what\s+(are|r)\s+(you|u)\s+(doing|up to)|wh?at\s*(are|r)\s*(you|u)\s*doin|who\s+(are|r)\s+(you|u)|what\s+(are|r)\s+(you|u)\b|are\s+(you|u)\s+(real|a\s+bot|ai|human))/i,
    replies: [
      "I'm Relevia, an AI for general supportive conversation, not a person or a therapist.{ai} What would you like to discuss?",
      "Just here, keeping you company 💜 I'm an AI, not a person, but I'm all ears. How are you doing?{ai}",
    ],
  },
  {
    re: /^\s*(how\s+(are|r)\s+(you|u)|how('?s| is)\s+it\s+going|hru|wbu)\b/i,
    replies: [
      "I'm good, thanks for asking! 😊 More importantly, how are YOU doing?{ai}",
    ],
  },
  {
    re: /^\s*(thanks|thank\s+(you|u)|thx|ty)\b/i,
    replies: [
      "Anytime 💜 I'm glad I could be here. Anything else on your mind?",
      "Of course. You don't have to go through things alone.",
    ],
  },
  {
    re: /^\s*(bye|goodbye|good\s*night|gn|see\s+(you|u|ya)|gotta\s+go|ttyl)\b/i,
    replies: [
      "Take care of yourself 💜 I'm here whenever you want to talk again.",
      "Goodnight! Be gentle with yourself, and come back anytime.",
    ],
  },
];

function aiNote(status) {
  // only while it's actually loading, and keep it short - this isn't about me
  if (status?.state === 'loading') {
    return ` (The local model is loading: ${status.progress || 0}%. This reply is a prepared fallback.)`;
  }
  return '';
}

export function getContextualResponse(text, tone, name, history, status) {
  const botReplies = (history || []).filter(t => t.role === 'assistant').length;

  // small talk first, but never over an emotion. "hi, I feel awful" is about the feeling.
  if (tone === 'neutral') {
    const talk = SMALL_TALK.find(s => s.re.test(text));
    if (talk) return talk.replies[botReplies % talk.replies.length].replace('{ai}', aiNote(status));
  }

  const pool = fallbackPool[tone] || fallbackPool.neutral;
  // simple rotate so repeats feel less robotic
  // FIX: I used history.length, but history is always user+bot pairs (even) or capped
  // at 12, so it picked the SAME reply every time. Counting bot replies actually rotates.
  let out = pool[botReplies % pool.length];
  // FIX: I used to replace every "you" with the name, which gave stuff like
  // "Bushra're not alone" and "I'm right here for Bushra". Just greet them by name instead,
  // and only on every 3rd reply - every single time sounded robotic.
  // (keep "I" capitalised, only lowercase normal first words)
  if (name && botReplies % 3 === 0) {
    out = `${name}, ${/^I\b/.test(out) ? out : out.charAt(0).toLowerCase() + out.slice(1)}`;
  }
  return out;
}