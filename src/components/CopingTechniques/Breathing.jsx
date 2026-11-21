import { lazy, Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import TechniqueShell from './TechniqueShell';
import useTechniqueEvents from './useTechniqueEvents';
import { PATTERNS, DEFAULT_PATTERN, patternSummary } from '../../services/breathingPatterns';

// The moving balls are decoration and pull in three.js (about 100 KB compressed). They load
// after the exercise is on screen, and not at all when they are switched off or the person
// prefers reduced motion, so the circle never waits for them.
const Ballpit = lazy(() => import('../Balls'));

const readPref = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v === null ? fallback : v === '1'; } catch { return fallback; }
};
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;


const calmingAffirmations = [
  { text: "You can pause and ask for support", type: "safety" },
  { text: "This moment is yours", type: "present" },
  { text: "You breathe with grace", type: "strength" },
  { text: "Calm flows through you", type: "present" },
  { text: "You are exactly where you need to be", type: "empowerment" },
  { text: "Your breath is your anchor", type: "trust" },
  { text: "Each breath brings deeper peace", type: "progress" },
  { text: "You radiate tranquility", type: "strength" },
  { text: "This is your moment of zen", type: "present" },
  { text: "Serenity surrounds you", type: "peace" },
];

// What a phase does to the circle comes from its explicit kind (breathingPatterns.js).
const phaseKind = (phase) => (phase.kind === 'rest' ? 'pause' : phase.kind);

function Breathing() {
  const [selectedPattern, setSelectedPattern] = useState(DEFAULT_PATTERN);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  // The 3D balls from the original page, back behind the paper. Off for anyone who has
  // asked their system for reduced motion, and switchable here.
  const [showBalls, setShowBalls] = useState(() => !prefersReducedMotion() && readPref('relevia_breath_balls', true));
  const toggleBalls = (on) => {
    setShowBalls(on);
    try { localStorage.setItem('relevia_breath_balls', on ? '1' : '0'); } catch { /* storage blocked */ }
  };
  const isSmall = typeof window !== 'undefined' && window.innerWidth < 768;
  const [cycle, setCycle] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [currentAffirmation, setCurrentAffirmation] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);

  const elapsedRef = useRef(0); // time spent in the current phase, kept across a pause
  const circleRef = useRef(null);
  const scaleRef = useRef(1); // the circle's current size, so a re-render never resets it
  const sessionStartRef = useRef(null);

  // ---------- AUDIO SYNTH (optional, off by default) ----------
  const audioCtx = useRef(null);
  const oscL = useRef(null), oscR = useRef(null);
  const subOsc = useRef(null);
  const gainL = useRef(null), gainR = useRef(null);
  const subGain = useRef(null);
  const panner = useRef(null);

  // REDESIGN: the old page changed the pace of every phase from mouse, click, key and
  // scroll timing ("bio-feedback"), so the count someone was following drifted without
  // warning, and the mouse listener was never removed. The pace is now exactly what the
  // pattern says.
  const pattern = PATTERNS[selectedPattern];

  const buildAudio = () => {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx.current = new Ctx();
    gainL.current = audioCtx.current.createGain();
    gainR.current = audioCtx.current.createGain();
    subGain.current = audioCtx.current.createGain();
    panner.current = audioCtx.current.createStereoPanner();
    oscL.current = audioCtx.current.createOscillator();
    oscR.current = audioCtx.current.createOscillator();
    subOsc.current = audioCtx.current.createOscillator();
    oscL.current.connect(gainL.current).connect(panner.current);
    oscR.current.connect(gainR.current).connect(panner.current);
    subOsc.current.connect(subGain.current).connect(panner.current);
    panner.current.connect(audioCtx.current.destination);
    oscL.current.start();
    oscR.current.start();
    subOsc.current.start();
  };

  const closeAudio = () => {
    audioCtx.current?.close();
    audioCtx.current = null;
  };

  // Sound switched on mid-session starts the tone; switched off stops it.
  useEffect(() => {
    if (soundEnabled && isRunning && !audioCtx.current) buildAudio();
    if (!soundEnabled) closeAudio();
  }, [soundEnabled, isRunning]);
  useEffect(() => () => closeAudio(), []);

  // FIX (smoothness): the circle's size used to be React state set every 100 ms, with the
  // next phase started by a separate timer. Frames delayed by the 3D background showed as
  // stutters, and for up to 100 ms after a hold the out-breath reused the old progress (1),
  // so the circle snapped small and back: a visible shake. Now one animation-frame loop
  // sets the size directly on the circle with a gentle ease, and moves to the next phase in
  // the same frame. React only re-renders when the countdown second changes.
  useEffect(() => {
    if (!isRunning || currentPhaseIndex === -1) return undefined;
    const phases = pattern.phases;
    const max = Math.max(...phases.map((p) => p.targetScale));
    const phase = phases[currentPhaseIndex];
    const k = phaseKind(phase);
    const begin = performance.now() - elapsedRef.current;
    let frame = 0;
    let shownSecond = -1;
    const tick = (now) => {
      const elapsed = now - begin;
      elapsedRef.current = elapsed;
      const t = Math.min(1, elapsed / phase.duration);
      const eased = 0.5 - Math.cos(Math.PI * t) / 2; // slow at both ends, like a breath
      const scale = k === 'in' ? 1 + (max - 1) * eased
        : k === 'hold' ? (phase.targetScale > 1 ? max : 1)
          : k === 'out' ? 1 + (max - 1) * (1 - eased)
            : 1;
      circleRef.current?.setAttribute('r', String(70 * scale));
      scaleRef.current = scale;
      const second = Math.ceil(Math.max(0, phase.duration - elapsed) / 1000);
      if (second !== shownSecond) { shownSecond = second; setRemainingTime(second * 1000); }
      if (t >= 1) {
        elapsedRef.current = 0;
        const next = (currentPhaseIndex + 1) % phases.length;
        if (next === 0) {
          setCycle((c) => {
            const n = c + 1;
            if (n % 3 === 0) {
              const a = calmingAffirmations[Math.floor(Math.random() * calmingAffirmations.length)];
              setCurrentAffirmation(a.text);
            }
            return n;
          });
        }
        setCurrentPhaseIndex(next);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isRunning, currentPhaseIndex, pattern]);

  // Session time
  useEffect(() => {
    if (!isRunning || !sessionStartRef.current) return undefined;
    const interval = setInterval(() => {
      setSessionDuration(Math.floor((Date.now() - sessionStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Started: the circle was set going. Completed: one full round of the pattern.
  useTechniqueEvents('breathing', currentPhaseIndex !== -1, cycle >= 1);
  const currentPhase = currentPhaseIndex !== -1 ? pattern.phases[currentPhaseIndex] : null;
  // FIX: the old scale shrank during a hold and jumped straight to small on the out-breath
  // (the out phase's own target is 1). In grows to the pattern's largest size, a hold keeps
  // the size it reached, out shrinks smoothly, and a pause stays small.
  const maxScale = Math.max(...pattern.phases.map((p) => p.targetScale));
  const kind = currentPhase ? phaseKind(currentPhase) : 'idle';
  const growing = kind === 'in';
  // The tone's loudness follows the phase's end size (the circle itself is animated above).
  const breathingScale = kind === 'in' || (kind === 'hold' && currentPhase.targetScale > 1) ? maxScale : 1;

  // Tone follows the breath
  useEffect(() => {
    if (!soundEnabled || !audioCtx.current) return;
    const base = 256;
    const freq = base * Math.pow(2, (growing ? 3 : -3) / 12);
    const now = audioCtx.current.currentTime;
    oscL.current.frequency.setTargetAtTime(freq, now, 0.1);
    oscR.current.frequency.setTargetAtTime(freq + 6, now, 0.1);
    subOsc.current.frequency.setTargetAtTime(64, now, 0.1);
    const vol = 0.1 * (breathingScale ** 2);
    const glide = currentPhase ? currentPhase.duration / 3000 : 0.1; // reach the new level over the phase
    gainL.current.gain.setTargetAtTime(vol, now, glide);
    gainR.current.gain.setTargetAtTime(vol, now, glide);
    subGain.current.gain.setTargetAtTime(vol * 0.5, now, glide);
    panner.current.pan.setTargetAtTime(growing ? 0.3 : -0.3, now, 0.1);
  }, [soundEnabled, growing, breathingScale, currentPhase]);

  const startExercise = useCallback(() => {
    if (soundEnabled) {
      if (!audioCtx.current) buildAudio();
      else if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
    }
    if (currentPhaseIndex === -1) {
      setCurrentPhaseIndex(0);
      setIsRunning(true);
      sessionStartRef.current = Date.now();
      setCurrentAffirmation('');
    } else {
      if (!isRunning && sessionStartRef.current) sessionStartRef.current = Date.now() - sessionDuration * 1000;
      setIsRunning((v) => !v);
    }
  }, [currentPhaseIndex, isRunning, sessionDuration, soundEnabled]);

  const resetExercise = useCallback(() => {
    setCurrentPhaseIndex(-1);
    setIsRunning(false);
    setCycle(0);
    setSessionDuration(0);
    elapsedRef.current = 0;
    scaleRef.current = 1;
    circleRef.current?.setAttribute('r', '70');
    setCurrentAffirmation('');
    sessionStartRef.current = null;
    closeAudio();
  }, []);

  const choosePattern = (key) => {
    resetExercise();
    setSelectedPattern(key);
  };

  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

  const options = (
    <>
      <label className="flex items-center gap-3 font-bold text-ink-900">
        <input type="checkbox" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} className="h-4 w-4 accent-ink-900" />
        {soundEnabled ? <Volume2 className="h-4 w-4" aria-hidden="true" /> : <VolumeX className="h-4 w-4" aria-hidden="true" />}
        Soft tone
      </label>
      <label className="mt-2 flex items-center gap-3 font-bold text-ink-900">
        <input type="checkbox" checked={showBalls} onChange={(e) => toggleBalls(e.target.checked)} className="h-4 w-4 accent-ink-900" />
        Floating 3D balls
      </label>
    </>
  );

  return (
    <TechniqueShell icon="breathing" color="leaf" note="Slow it down" title="Breathing" wide fit
      backdrop={showBalls ? (
        <Suspense fallback={null}><Ballpit key={selectedPattern} followCursor={!isSmall}
          colors={[pattern.color, '#ffffff', '#F2C14E', pattern.color]}
          count={isSmall ? 30 : 60} gravity={0} friction={0.9975} maxVelocity={0.05} minSize={0.4} maxSize={0.9} className="opacity-90" /></Suspense>
      ) : null}
      intro="Breathe in as the circle grows, out as it shrinks. Stop if you feel dizzy, and breathe normally.">
      <div className="grid h-full gap-4 lg:grid-cols-[1fr_300px]">
        <section className="glass flex h-full min-h-0 min-w-0 flex-col items-center justify-center px-4 py-4" aria-label="Breathing guide">
          {/* The circle takes whatever height is left, so the page never needs scrolling. */}
          <div className="flex min-h-0 w-full flex-1 items-center justify-center">
            <svg viewBox="0 0 240 240" className="h-full max-h-[360px] w-auto max-w-full" aria-hidden="true">
              <circle cx="120" cy="120" r={70 * Math.max(...pattern.phases.map((p) => p.targetScale))} fill="none" stroke="#C9D3DE" strokeWidth="2" strokeDasharray="4 6" />
              <circle cx="120" cy="120" r="70" fill="none" stroke="#C9D3DE" strokeWidth="2" />
              <circle ref={circleRef} cx="120" cy="120" r={70 * scaleRef.current} fill="#E1EAE2" stroke="#5F7F68" strokeWidth="4" />
              {currentPhase && (
                <text x="120" y="129" textAnchor="middle" fontSize="28" fontWeight="700" fill="#2B2D42">{Math.ceil(remainingTime / 1000)}</text>
              )}
            </svg>
          </div>
          <div className="shrink-0 text-center" aria-live="polite">
            <p className="text-2xl font-bold text-ink-900 first-letter:uppercase sm:text-3xl">
              {currentPhase ? currentPhase.name : 'Ready when you are'}
            </p>
            <p className="min-h-[1.5rem] text-base text-ink-700 sm:text-lg">
              {currentPhase ? currentPhase.instruction : patternSummary(pattern)}
            </p>
            <p className="margin-note min-h-[1.75rem] text-[1.4rem] leading-tight">
              {currentAffirmation || (cycle > 0 && cycle % 5 === 0 ? `${cycle} rounds. Well done.` : '')}
            </p>
          </div>
          <div className="mt-2 flex shrink-0 flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={startExercise} className="btn-ink">
              {isRunning ? <Pause className="h-5 w-5" aria-hidden="true" /> : <Play className="h-5 w-5" aria-hidden="true" />}
              {currentPhaseIndex === -1 ? 'Start breathing' : isRunning ? 'Pause' : 'Carry on'}
            </button>
            {currentPhaseIndex !== -1 && (
              <button type="button" onClick={resetExercise} className="btn-outline">
                <RotateCcw className="h-5 w-5" aria-hidden="true" /> Start again
              </button>
            )}
          </div>
          {/* Phones and narrow windows: pattern and options in one row under the button. */}
          <div className="mt-3 flex w-full shrink-0 flex-wrap items-center justify-center gap-3 lg:hidden">
            <label className="sr-only" htmlFor="pattern-small">Breathing pattern</label>
            <select id="pattern-small" value={selectedPattern} onChange={(e) => choosePattern(e.target.value)}
              className="rounded-lg border-2 border-ink-900/20 bg-sheet px-2 py-1.5 text-sm font-bold text-ink-900">
              {Object.entries(PATTERNS).map(([key, p]) => <option key={key} value={key}>{p.name}</option>)}
            </select>
                        <details className="relative">
              <summary className="cursor-pointer text-sm font-bold text-ink-800 underline underline-offset-4">Options</summary>
              <div className="glass absolute bottom-full right-0 z-20 mb-2 w-56 p-4 text-sm">{options}</div>
            </details>
          </div>
        </section>

        <aside className="hidden min-h-0 flex-col gap-4 lg:flex">
          <section className="glass p-4">
            <h2 className="mb-2 text-lg font-bold text-ink-900">Pattern</h2>
            <div className="space-y-1" role="radiogroup" aria-label="Breathing pattern">
              {Object.entries(PATTERNS).map(([key, p]) => (
                <button key={key} type="button" role="radio" aria-checked={selectedPattern === key}
                  onClick={() => choosePattern(key)}
                  className={`block w-full rounded-lg border-2 px-3 py-1.5 text-left ${selectedPattern === key ? 'border-ink-900' : 'border-transparent hover:border-ink-900/30'}`}>
                  <span className={`font-bold text-ink-900 ${selectedPattern === key ? 'highlight' : ''}`}>{p.name}</span>
                  <span className="block text-sm text-ink-700">{patternSummary(p)}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-700">Changing the pattern starts the count again.</p>
          </section>
          <section className="glass p-4 text-sm">
            <dl className="mb-3 grid grid-cols-2 gap-2">
              <div><dt className="text-ink-700">Rounds</dt><dd className="text-xl font-bold text-ink-900">{cycle}</dd></div>
              <div><dt className="text-ink-700">Time</dt><dd className="text-xl font-bold text-ink-900">{formatTime(sessionDuration)}</dd></div>
            </dl>
            {options}
          </section>
        </aside>
      </div>
    </TechniqueShell>
  );
}

export default Breathing;
