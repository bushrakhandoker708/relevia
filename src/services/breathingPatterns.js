/**
 * Breathing patterns: the one source of truth for each pattern's name, timing, wording and
 * whether it includes a hold. The Breathing page runs them, and the Coping page and anything
 * else that describes breathing reads them from here, so the two can never disagree.
 *
 * kind: 'in' grows the circle, 'hold' keeps its size, 'out' shrinks it, 'rest' stays small.
 */

export const PATTERNS = {
  calm: {
    name: 'Ocean Calm',
    description: 'Gentle waves of tranquility',
    icon: '🌊',
    phases: [
      { name: 'breathe in', kind: 'in', targetScale: 1.25, duration: 4000, instruction: 'Draw in peace and stillness' },
      { name: 'breathe out', kind: 'out', targetScale: 1, duration: 6000, instruction: 'Let go of stress completely' },
    ],
    color: '#06B6D4'
  },
  box: {
    name: 'Box Breathing',
    description: 'Structured calm for focus',
    icon: '⬜',
    phases: [
      { name: 'inhale', kind: 'in', targetScale: 1.4, duration: 4000, instruction: 'Fill your lungs with serenity' },
      { name: 'hold', kind: 'hold', targetScale: 1.4, duration: 4000, instruction: 'Rest in this peaceful moment' },
      { name: 'exhale', kind: 'out', targetScale: 1, duration: 4000, instruction: 'Release all tension slowly' },
      { name: 'pause', kind: 'rest', targetScale: 1, duration: 4000, instruction: 'Embrace the quiet space' },
    ],
    color: '#8B5CF6'
  },
  fourSevenEight: {
    name: '4-7-8 Sleep',
    description: 'Deep relaxation for rest',
    icon: '😴',
    phases: [
      { name: 'inhale', kind: 'in', targetScale: 1.5, duration: 4000, instruction: 'Breathe in through your nose softly' },
      { name: 'hold', kind: 'hold', targetScale: 1.5, duration: 7000, instruction: 'Hold this peaceful breath' },
      { name: 'exhale', kind: 'out', targetScale: 1, duration: 8000, instruction: 'Slowly release through your mouth' },
    ],
    color: '#10B981'
  },
  gentle: {
    name: 'Gentle Flow',
    description: 'Natural and effortless',
    icon: '🍃',
    phases: [
      { name: 'breathe in', kind: 'in', targetScale: 1.3, duration: 3500, instruction: 'Welcome in fresh energy' },
      { name: 'hold softly', kind: 'hold', targetScale: 1.3, duration: 1500, instruction: 'Feel the gentle pause' },
      { name: 'breathe out', kind: 'out', targetScale: 1, duration: 4500, instruction: 'Release with gentle ease' },
    ],
    color: '#22C55E'
  },
};

export const DEFAULT_PATTERN = 'calm';

// 3500 ms reads as 3.5, never rounded to 4: the page counts these seconds out.
const secondsOf = (ms) => { const x = ms / 1000; return Number.isInteger(x) ? String(x) : x.toFixed(1); };
const WORD = { in: 'in', hold: 'hold', out: 'out', rest: 'rest' };

/** "4 breathe in, 6 breathe out": the timings in the page's own phase words. */
export const patternSummary = (p) => p.phases.map((ph) => `${secondsOf(ph.duration)} ${ph.name}`).join(', ');

export const hasHold = (p) => p.phases.some((ph) => ph.kind === 'hold');

/** A plain sentence such as "in for 4 seconds and out for 6, with no hold". */
export function describePattern(p) {
  const parts = p.phases.map((ph) => `${WORD[ph.kind]} for ${secondsOf(ph.duration)}`);
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0];
  return `${list.replace(/for ([\d.]+)/, 'for $1 seconds')}${hasHold(p) ? '' : ', with no hold'}`;
}
