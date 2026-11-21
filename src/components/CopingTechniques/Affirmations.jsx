import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion';
import {
  ChevronLeftIcon, ChevronRightIcon, SpeakerWaveIcon, SpeakerXMarkIcon, HeartIcon,
  ArrowPathIcon, PlayIcon, PauseIcon, AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import TechniqueShell from './TechniqueShell';
import useTechniqueEvents from './useTechniqueEvents';
import { speakSoftly, softVoices } from '../../services/softVoice';
import { SETS, readKept, toggleKept } from '../../services/affirmations';

const SIZES = { Smaller: 'clamp(1.5rem,3.6vw,2.4rem)', Medium: 'clamp(1.8rem,4.6vw,3.1rem)', Larger: 'clamp(2.1rem,5.6vw,3.8rem)' };

// The page's own look: a blush dawn with a few soft petals drifting slowly upwards.
const Dawn = () => (
  <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(170deg, #FFF1F3 0%, #FCE3E8 40%, #F8DCD3 75%, #F6E6D8 100%)' }}>
    {[...Array(9)].map((_, i) => (
      <span key={i} className="aff-petal absolute rounded-full"
        style={{
          left: `${(i * 37) % 100}%`, bottom: '-10vh',
          width: 10 + (i % 4) * 8, height: 10 + (i % 4) * 8,
          background: i % 3 ? 'rgba(232,120,150,0.22)' : 'rgba(255,190,150,0.3)',
          animationDelay: `${-i * 3.1}s`, animationDuration: `${22 + (i % 5) * 4}s`,
        }} />
    ))}
    <style>{`
      .aff-petal { filter: blur(1px); animation: affRise linear infinite; }
      @keyframes affRise { from { transform: translate(0, 0) rotate(0); } 50% { transform: translate(24px, -60vh) rotate(160deg); } to { transform: translate(-12px, -120vh) rotate(320deg); } }
      @media (prefers-reduced-motion: reduce) { .aff-petal { animation: none; display: none; } }
    `}</style>
  </div>
);

export default function Affirmations() {
  const reduce = useReducedMotion();
  const [setKey, setSetKey] = useState('panic');
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [kept, setKept] = useState(readKept);
  const [speaking, setSpeaking] = useState(false);
  const [auto, setAuto] = useState(false);
  const [voice, setVoice] = useState(null);
  const [speed, setSpeed] = useState(0.8);
  const [size, setSize] = useState('Medium');
  const [showSettings, setShowSettings] = useState(false);
  const stopRef = useRef(null);
  // Started once someone moves past the first sentence or listens to one. Reading has no
  // meaningful end, so nothing is ever recorded as completed.
  const [engaged, setEngaged] = useState(false);
  useTechniqueEvents('affirmations', engaged, false);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const lines = setKey === 'kept' ? kept : SETS[setKey].lines;
  const text = lines[index % Math.max(lines.length, 1)] || '';
  const isKept = kept.includes(text);

  useEffect(() => {
    if (!supported) return;
    const load = () => setVoice(softVoices(window.speechSynthesis.getVoices(), { allowOnline: true })[0] || null);
    load();
    window.speechSynthesis.addEventListener?.('voiceschanged', load);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', load);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const hush = () => { stopRef.current?.(); setSpeaking(false); };

  const go = useCallback((step) => {
    if (!lines.length) return;
    stopRef.current?.(); setSpeaking(false);
    setDir(step);
    setEngaged(true);
    setIndex((i) => (i + step + lines.length) % lines.length);
  }, [lines.length]);

  const speak = useCallback(() => {
    if (speaking) { hush(); return; }
    setEngaged(true);
    stopRef.current = speakSoftly(text, {
      allowOnline: true, voice, rate: speed,
      onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false), onError: () => setSpeaking(false),
    });
  }, [speaking, text, voice, speed]);

  const keep = useCallback(() => { if (text) setKept(toggleKept(text)); }, [text]);

  useEffect(() => {
    if (!auto || speaking) return undefined;
    const t = setTimeout(() => go(1), 9000);
    return () => clearTimeout(t);
  }, [auto, speaking, index, go]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, select, textarea, button')) return;
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === ' ') { e.preventDefault(); speak(); }
      else if (e.key.toLowerCase() === 'k') keep();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, speak, keep]);

  const pick = (k) => { hush(); setSetKey(k); setIndex(0); };
  const tabs = [...Object.entries(SETS).map(([k, s]) => [k, s.label]), ...(kept.length ? [['kept', 'Ones I kept']] : [])];
  const words = text.split(' ');
  const ctl = 'flex h-11 w-11 items-center justify-center rounded-full text-ink-900 transition hover:bg-white/70 focus-visible:bg-white/70';

  return (
    <TechniqueShell icon="affirmations" color="rose" note="A note to yourself" title="Affirmations" backdrop={<Dawn />}
      intro="Short, kind sentences to read slowly or listen to. Pick what fits how you feel, and keep the ones that help.">

      {/* Sets: words that wrap onto a second line rather than hide off the edge */}
      <div role="tablist" aria-label="Affirmation sets">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {tabs.map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={setKey === k} onClick={() => pick(k)}
              className={`relative whitespace-nowrap py-2 text-lg font-bold transition-colors ${setKey === k ? 'text-ink-900' : 'text-ink-700 hover:text-ink-900'}`}>
              {label}
              {setKey === k && (
                <Motion.span layoutId="aff-tab" className="absolute inset-x-0 -bottom-0.5 h-1 rounded-full bg-rose-400"
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* The sentence itself, large, arriving a word at a time; drag sideways to move on */}
      <section className="relative mt-6 flex min-h-[30vh] items-center" aria-live="polite">
        {lines.length === 0 ? (
          <p className="text-xl text-ink-700">Nothing kept yet. Tap the heart under a sentence to keep it here.</p>
        ) : (
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <Motion.blockquote
              key={`${setKey}-${text}`}
              custom={dir}
              drag={reduce ? false : 'x'}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.35}
              onDragEnd={(_, info) => { if (info.offset.x < -70) go(1); else if (info.offset.x > 70) go(-1); }}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-4xl cursor-grab touch-pan-y select-none active:cursor-grabbing"
            >
              <p className="font-bold leading-[1.15] tracking-tight text-ink-900" style={{ fontSize: SIZES[size] }}>
                {words.map((w, i) => (
                  <Motion.span key={i} className="inline-block"
                    initial={reduce ? false : { opacity: 0, y: 8, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.12 + i * 0.06, duration: 0.45 }}>
                    {w}&nbsp;
                  </Motion.span>
                ))}
              </p>
            </Motion.blockquote>
          </AnimatePresence>
        )}
      </section>

      {/* One quiet row of controls */}
      <div className="glass mt-6 inline-flex flex-wrap items-center gap-1 rounded-full p-1.5">
        <button type="button" onClick={() => go(-1)} className={ctl} aria-label="Previous sentence"><ChevronLeftIcon className="h-5 w-5" /></button>
        {supported && (
          <button type="button" onClick={speak} aria-pressed={speaking}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-ink-900 px-5 font-bold text-sheet transition hover:bg-ink-800">
            {speaking ? <SpeakerXMarkIcon className="h-5 w-5" aria-hidden="true" /> : <SpeakerWaveIcon className="h-5 w-5" aria-hidden="true" />}
            {speaking ? 'Stop' : 'Read aloud'}
          </button>
        )}
        <button type="button" onClick={() => go(1)} className={ctl} aria-label="Next sentence"><ChevronRightIcon className="h-5 w-5" /></button>
        <span className="mx-1 h-6 w-px bg-ink-900/15" aria-hidden="true" />
        <Motion.button type="button" onClick={keep} className={ctl} aria-pressed={isKept} whileTap={reduce ? undefined : { scale: 1.35 }}
          aria-label={isKept ? 'Stop keeping this sentence' : 'Keep this sentence'}>
          {isKept ? <HeartIcon className="h-6 w-6 text-rose-500" /> : <HeartOutline className="h-6 w-6 text-rose-500" />}
        </Motion.button>
        <button type="button" onClick={() => { setDir(1); setIndex(Math.floor(Math.random() * Math.max(lines.length, 1))); }} className={ctl} aria-label="A random sentence">
          <ArrowPathIcon className="h-5 w-5" />
        </button>
        <button type="button" onClick={() => setAuto(!auto)} aria-pressed={auto} className={`${ctl} ${auto ? 'bg-white/80' : ''}`}
          aria-label={auto ? 'Stop moving on by itself' : 'Move on by itself every 9 seconds'}>
          {auto ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
        </button>
        <button type="button" onClick={() => setShowSettings(!showSettings)} aria-expanded={showSettings} className={`${ctl} ${showSettings ? 'bg-white/80' : ''}`}
          aria-label="Text size and speech speed">
          <AdjustmentsHorizontalIcon className="h-5 w-5" />
        </button>
      </div>

      {showSettings && (
        <div className="mt-5 flex max-w-xl flex-wrap gap-x-10 gap-y-4">
          <fieldset>
            <legend className="text-sm font-bold text-ink-900">Text size</legend>
            <div className="mt-2 flex gap-4">
              {Object.keys(SIZES).map((s) => (
                <label key={s} className="flex items-center gap-1.5 text-sm text-ink-800">
                  <input type="radio" name="aff-size" checked={size === s} onChange={() => setSize(s)} className="accent-rose-500" /> {s}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block min-w-[200px] text-sm font-bold text-ink-900">
            Speech speed: {speed}×
            <input type="range" min="0.5" max="1.1" step="0.1" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="mt-2 w-full accent-rose-500" />
          </label>
        </div>
      )}

      <p className="mt-8 max-w-2xl text-sm leading-relaxed text-ink-700">
        Swipe or use the arrow keys to move on. Space reads aloud and K keeps a sentence. Kept sentences stay in this browser only,
        and Home may show you one of them. If a sentence doesn&apos;t feel true today, skip it; that&apos;s fine.
      </p>
    </TechniqueShell>
  );
}
