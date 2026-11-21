/**
 * Soft voice: one place that chooses the gentlest available speech voice and reads text
 * slowly, a sentence at a time, with a natural pause between sentences.
 *
 * Privacy: the most natural voices in Edge ("... Online (Natural)") and Chrome ("Google
 * ...") are generated on Microsoft's or Google's servers, so the text is sent there.
 * That is fine for Relevia's own fixed exercise scripts (allowOnline: true). Anything
 * the person wrote, or a chat reply about it, must use allowOnline: false, which only
 * picks voices that run on the device (SpeechSynthesisVoice.localService).
 */

const PREFERRED = [
  // Natural / neural voices (often online)
  [/aria|jenny|sonia|libby|ava|emma|natasha|clara|michelle/i, 40],
  [/natural|neural/i, 30],
  [/google uk english female|google us english/i, 25],
  // Gentle on-device voices
  [/samantha|serena|karen|moira|tessa|fiona|kate|susan|hazel/i, 28],
  [/zira/i, 12],
  [/female/i, 8],
];
const AVOID = [/robot|whisper|bad news|bells|boing|bubbles|cellos|zarvox|trinoids|albert|fred|junior|ralph|organ/i];

export function softVoices(voices, { allowOnline = false } = {}) {
  return voices
    .filter((v) => /^en(-|_|$)/i.test(v.lang))
    .filter((v) => allowOnline || v.localService)
    .filter((v) => !AVOID.some((re) => re.test(v.name)))
    .map((v) => ({
      v,
      score: PREFERRED.reduce((n, [re, pts]) => n + (re.test(v.name) ? pts : 0), 0)
        + (/en-gb/i.test(v.lang) ? 3 : 0)
        + (v.localService ? 0 : 2),
    }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.v);
}

export function pickSoftVoice(opts = {}) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  return softVoices(window.speechSynthesis.getVoices(), opts)[0] || null;
}

const sentences = (text) =>
  String(text)
    .replace(/\s+/g, ' ')
    .match(/[^.!?…]+[.!?…]*["')\]]*\s*/g)
    ?.map((s) => s.trim())
    .filter(Boolean) || [];

/**
 * Speak text gently. Returns a function that stops it.
 * Options: allowOnline, voice (overrides the choice), rate (default 0.86),
 * pitch (default 0.96), volume (default 0.85), onStart, onEnd, onError.
 */
export function speakSoftly(text, {
  allowOnline = false, voice = null, rate = 0.86, pitch = 0.96, volume = 0.85, onStart, onEnd, onError,
} = {}) {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  if (!synth || !text) return () => {};
  synth.cancel();
  let stopped = false;
  let started = false;
  const run = () => {
    if (stopped || started) return;
    started = true;
    say();
  };
  // Some browsers (Chrome) load their voices a moment after the page; without waiting,
  // the first reading falls back to the flat default voice.
  if (synth.getVoices().length === 0) {
    synth.addEventListener?.('voiceschanged', run, { once: true });
    setTimeout(run, 800);
  } else {
    setTimeout(run, 0);
  }
  return () => { stopped = true; synth.cancel(); };

  function say() {
  const chosen = (voice && (allowOnline || voice.localService) ? voice : null) || pickSoftVoice({ allowOnline });
  // Private text with no on-device voice: the browser default might be an online voice,
  // so do not read it aloud at all.
  if (!chosen && !allowOnline) {
    onError?.({ error: 'no-local-voice' });
    return;
  }
  const parts = sentences(text);
  parts.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part);
    if (chosen) u.voice = chosen;
    u.lang = chosen?.lang || 'en-GB';
    // The last sentence is a touch slower, so the reading settles rather than stops.
    u.rate = Math.max(0.5, rate - (i === parts.length - 1 ? 0.03 : 0));
    u.pitch = pitch;
    u.volume = volume;
    if (i === 0 && onStart) u.onstart = onStart;
    if (i === parts.length - 1) u.onend = () => { if (!stopped) onEnd?.(); };
    u.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled') onError?.(e); };
    synth.speak(u);
  });
  }
}
