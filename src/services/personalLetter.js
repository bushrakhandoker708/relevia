/** Home content never reads chat history or persisted identity. */
export function recordVisit() { return { count: 1, daysAway: 0, isFirst: true }; }
export async function getChatContext() { return { name: '', feeling: null, chatted: false }; }

export const HOME_EXERCISES = [
  'If comfortable, let your breathing settle at its own pace. You do not need to hold your breath or reach a target count. Stop any exercise that makes you feel worse.',
  'You could notice three things around you, or the support of your chair. This is optional; choose something else if focusing on sensations is uncomfortable.'
];

/** Build optional non-clinical content; supplied chat context is deliberately ignored. */
export function buildLetter(visit, _chat, now = new Date()) {
  const exercise = HOME_EXERCISES[(Math.max(1, visit.count || 1) - 1) % HOME_EXERCISES.length];
  return {
    greeting: 'Welcome to Relevia,',
    opening: 'This is a space for general information and optional reflection. Relevia is an AI-supported tool, not a person, therapist or emergency service.',
    breathing: exercise,
    grounding: 'If you would like, look around and name a few objects. You can skip this exercise or stop whenever you choose.',
    encouragement: 'There is no requirement to feel a particular way. Consider what support you need, including someone you trust or a qualified professional.',
    closing: now.getHours() >= 18 ? 'Choose what is manageable for the rest of your evening.' : 'Choose what is manageable for the next part of your day.',
    affirmation: 'Your needs deserve consideration, including rest and support from other people.',
    signature: 'Relevia — general support, with limits',
    urgent: false,
  };
}
