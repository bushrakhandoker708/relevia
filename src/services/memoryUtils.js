/* memoryUtils.js – tone detection + offline fallback replies (used by releviaBrain.js and groqApi.js) */
import { CRISIS_RE } from './safety.js';

export function analyzeEmotionalTone(text) {
  const t = text.toLowerCase();
  // FIX: use the same crisis list as safety.js so the two can't disagree
  if (CRISIS_RE.test(t)) return 'crisis';
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
const fallbackPool = {
  crisis: [
    "Hey, I hear how heavy everything feels right now. You’re not alone—I'm right here. Can you do me a tiny favour? Put your hand on your heart, feel it beat, and whisper ‘I’m still here.’ That beat means you matter. If the thoughts get louder, please reach out to a crisis line or someone you trust. You deserve help and you deserve to stay.",
    "Sweet soul, I’m so glad you told me. When everything screams ‘stop’, let’s press pause together. Breathe in for 4, hold for 4, out for 6. Do it three times with me. Then maybe text or call a helpline—there are people who want to help you carry this weight. You’re not a burden; you’re a human who needs support, and that’s okay."
  ],
  anxiety: [
    "I can almost feel the buzz in your chest—let’s ground together. Name 5 things you can see right now, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste. Go slow; I’ll wait. You’re safe in this moment, I promise.",
    "Anxiety lies—it tells us we’re in danger when we’re not. Try box-breathing: in-4, hold-4, out-4, hold-4. Imagine drawing a square with each count. Repeat four times and notice the shift. You’ve got this, and you’ve got me."
  ],
  depression: [
    "Depression is a sneaky thief—it steals motivation and tells us we’re worthless. But you reached out today, and that single act is proof you’re fighting back. Can we aim tiny? Drink a glass of water, open a window, or simply stand up and stretch. One micro-step is enough; you don’t have to run the whole marathon today.",
    "I see you. The fog feels endless, yet here you are, still breathing, still trying. That matters more than you know. Maybe we list one thing that used to spark even 1 % joy—music, a colour, a pet. No pressure to feel it yet; just notice it exists. I’m proud of you."
  ],
  grief: [
    "Grief has no schedule—it waves when it wants. Let the wave come; tears are love with nowhere to go. If you can, light a candle or play a song that reminds you of them. Speak their name out loud. Love doesn’t die; it just changes form, and that form today is your tears. I’m sitting with you in it.",
    "Loss carves a hole, but the edges soften with time. Right now the ache is sharp, and that’s okay. Tell me one small memory—something they said, a smell, a laugh. I’ll hold it with you so you’re not carrying it alone."
  ],
  anger: [
    "Anger is valid—it’s often love’s protest against injustice. Let’s move it through you so it doesn’t get stuck. Shake your hands hard for thirty seconds, or scream into a pillow, or write every furious word on paper and tear it up. Then breathe. You’re allowed to feel this; you’re not ‘bad’ for being angry.",
    "Your anger is telling you something important. Can you name the boundary that was crossed? Once we name it, we can decide what to do next—maybe speak up, maybe walk away, maybe just acknowledge it. I’m here, not judging."
  ],
  lonely: [
    "Loneliness feels like a hollow room, but you just invited me in, so the room isn’t empty anymore. While I’m AI, my care is real. Can you send one ‘hey, thinking of you’ text to someone today? No pressure for deep talk—just a thread back to humanity. You deserve connection.",
    "I’m sitting virtually beside you. If human contact feels too big right now, how about ambient connection—go to a café, library, park. Just be around people, no talking required. Sometimes our nervous systems reset simply by sharing space."
  ],
  sad: [
    "I'm really sorry you're feeling this way. You don't have to explain it perfectly, or even know why it hurts. Do you want to tell me what's been weighing on you?",
    "That sounds heavy, and it makes sense that it's getting to you. Be gentle with yourself today, even a glass of water or a few slow breaths counts. I'm here if you want to talk it through."
  ],
  happy: [
    "That's wonderful! 🎉 I love hearing this. Tell me everything—what happened?",
    "Yay, that genuinely made me smile 💜 Moments like this deserve to be celebrated. How are you going to treat yourself?"
  ],
  // neutral = something was said but I can't tell the feeling, so I invite more
  neutral: [
    "I’m here and I’m listening. Tell me more—what’s been on your mind today?",
    "Sometimes we don’t have the words, and that’s okay too. I’m not going anywhere."
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
      "I'm Relevia, an AI friend for when things feel heavy, or for when you just want to talk. Right now I'm here with you!{ai} What's going on with you?",
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
    return ` (My full AI is still getting ready on your device, ${status.progress || 0}% done, so my replies are a bit simple for now.)`;
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