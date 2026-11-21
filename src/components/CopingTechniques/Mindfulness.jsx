import { useRef, useState } from 'react';
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion';
import TechniqueShell from './TechniqueShell';
import useTechniqueEvents from './useTechniqueEvents';

/**
 * 5-4-3-2-1 grounding. The page's own look: the room's colour shifts with each sense, and
 * every thing you notice drops a pebble into a row, so you can count without thinking.
 * Typing what you notice is optional; "I noticed one" is enough.
 */

const SENSES = [
  { sense: 'Sight', n: 5, what: 'things you can see', tint: '#D9E9F8', ink: '#3A67C9',
    prompt: 'Look slowly around. Pick out colours, shapes, the way light falls on something.', example: 'the edge of a cup, a blue book…' },
  { sense: 'Touch', n: 4, what: 'things you can feel', tint: '#DDEFE2', ink: '#3A764F',
    prompt: 'Your feet on the floor, the chair under you, the fabric of your sleeve, the air on your skin.', example: 'cool desk under my hand…' },
  { sense: 'Sound', n: 3, what: 'sounds you can hear', tint: '#E7E2F7', ink: '#6E5FB3',
    prompt: 'Listen for the nearest sound, then the furthest. Quiet ones count too.', example: 'the fridge humming…' },
  { sense: 'Smell', n: 2, what: 'things you can smell', tint: '#FBEBD2', ink: '#92621A',
    prompt: 'Breathe in gently through your nose. If there is nothing, think of a smell you like.', example: 'soap, coffee…' },
  { sense: 'Taste', n: 1, what: 'thing you can taste', tint: '#FADDE4', ink: '#B5445E',
    prompt: 'Notice the taste in your mouth, or take a sip of water and notice that.', example: 'toothpaste, tea…' },
];

const QUICK = [
  ['Cold water', 'Hold something cold, or run cold water over your wrists.'],
  ['Press and let go', 'Clench your fists or press your feet down for five seconds, then release.'],
  ['One object', 'Pick up something nearby and describe it to yourself in detail.'],
  ['Change the air', 'Open a window or step into a different room.'],
  ['Name things', 'Name five animals, five cities, five foods. Anything that takes a little thought.'],
  ['Move a little', 'Roll your shoulders, stretch your fingers, or walk to the door and back.'],
];

const COMFORT = [
  'This feeling is strong, and it will change. Feelings always do.',
  'You don’t have to do this perfectly. Noticing one thing is enough.',
  'You can go as slowly as you need to.',
  'It makes sense that this is hard. You are doing something about it.',
  'You can stop at any time, and come back to it later.',
];

// A pebble: an irregular stone shape, filled when counted.
const Pebble = ({ filled, color, i }) => {
  const shapes = ['46% 54% 52% 48% / 55% 45% 55% 45%', '58% 42% 46% 54% / 48% 56% 44% 52%', '50% 50% 40% 60% / 60% 40% 60% 40%'];
  return (
    <Motion.span
      initial={false}
      animate={{ scale: filled ? 1 : 0.85, opacity: filled ? 1 : 0.5 }}
      transition={{ type: 'spring', stiffness: 500, damping: 18 }}
      className="block h-9 w-11 border-2"
      style={{ borderRadius: shapes[i % 3], borderColor: color, background: filled ? color : 'transparent' }}
    />
  );
};

export default function Mindfulness() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState('intro'); // intro | active | done
  const [step, setStep] = useState(0);
  const [noticed, setNoticed] = useState(SENSES.map(() => []));
  const [draft, setDraft] = useState('');
  const [extra, setExtra] = useState(null); // 'quick' | 'comfort' | null
  const [comfortIndex, setComfortIndex] = useState(0);
  const inputRef = useRef(null);
  const autoNext = useRef(null);
  useTechniqueEvents('mindfulness', phase !== 'intro', phase === 'done');
  const s =SENSES[step];
  const count = noticed[step].length;
  const left = Math.max(s.n - count, 0);

  const start = () => { setPhase('active'); setStep(0); setNoticed(SENSES.map(() => [])); setDraft(''); setTimeout(() => inputRef.current?.focus(), 80); };
  const next = () => {
    if (autoNext.current) { clearTimeout(autoNext.current); autoNext.current = null; }
    setDraft('');
    if (step < SENSES.length - 1) { setStep(step + 1); setTimeout(() => inputRef.current?.focus(), 80); }
    else setPhase('done');
  };
  const notice = () => {
    if (left === 0) { next(); return; }
    const updated = noticed.map((a, i) => (i === step ? [...a, draft.trim()] : a));
    setNoticed(updated);
    setDraft('');
    if (updated[step].length >= s.n) {
      // Move on by itself after a beat; a click in the meantime cancels the timer instead of skipping twice.
      const t = setTimeout(() => { autoNext.current = null; next(); }, reduce ? 0 : 700);
      autoNext.current = t;
    }
  };

  const tint = phase === 'active' ? s.tint : phase === 'done' ? '#E6EFE4' : '#E8EEF4';
  const backdrop = (
    <div className="absolute inset-0 transition-colors duration-1000" style={{ background: `linear-gradient(180deg, ${tint} 0%, #F4F1EA 85%)` }} />
  );

  return (
    <TechniqueShell icon="mindfulness" color="blue" note="Come back to the room" title="5-4-3-2-1 grounding" backdrop={backdrop}
      intro="Notice things around you with each of your senses, one at a time. This is optional, and you can stop whenever it feels uncomfortable.">

      {phase === 'intro' && (
        <section>
          <ol className="grid grid-cols-5 gap-2 sm:gap-6" aria-label="The five senses">
            {SENSES.map((x, i) => (
              <Motion.li key={x.sense}
                initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }}>
                <span className="block text-[clamp(3rem,11vw,7rem)] font-bold leading-none tracking-tight" style={{ color: x.ink }}>{x.n}</span>
                <span className="mt-1 block text-sm font-bold text-ink-900 sm:text-lg">{x.sense}</span>
                <span className="hidden text-ink-700 sm:block">{x.what}</span>
              </Motion.li>
            ))}
          </ol>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-800">
            For each sense, tap <strong>I noticed one</strong> each time you find something. Typing what it is helps some people, but you don&apos;t have to.
            It takes a few minutes, and you can skip any sense.
          </p>
          <button type="button" className="btn-ink mt-6" onClick={start}>Start grounding</button>
        </section>
      )}

      {phase === 'active' && (
        <section aria-live="polite">
          <AnimatePresence mode="wait">
            <Motion.div key={step} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -20 }} transition={{ duration: 0.35 }}
              className="grid items-start gap-6 sm:grid-cols-[auto_1fr] sm:gap-10">
              <div className="relative h-[clamp(6rem,18vw,11rem)] w-[clamp(5rem,14vw,9rem)]" aria-hidden="true">
                <AnimatePresence mode="popLayout">
                  <Motion.span key={left} initial={reduce ? false : { y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }}
                    className="absolute inset-0 block text-[clamp(6rem,18vw,11rem)] font-bold leading-none tracking-tight" style={{ color: s.ink }}>
                    {left}
                  </Motion.span>
                </AnimatePresence>
              </div>
              <div>
                <p className="font-bold" style={{ color: s.ink }}>{s.sense}</p>
                <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-bold leading-tight tracking-tight text-ink-900">
                  {left === 0 ? 'That’s all of them.' : `${left} more ${left === 1 ? s.what.replace('things', 'thing').replace('sounds', 'sound') : s.what}`}
                </h2>
                <p className="mt-3 max-w-xl text-lg leading-relaxed text-ink-800">{s.prompt}</p>

                <div className="mt-6 flex gap-2" aria-label={`${count} of ${s.n} noticed`}>
                  {Array.from({ length: s.n }, (_, i) => <Pebble key={i} i={i} filled={i < count} color={s.ink} />)}
                </div>

                <form className="mt-6 flex max-w-xl flex-wrap gap-3" onSubmit={(e) => { e.preventDefault(); notice(); }}>
                  <label htmlFor="noticed" className="sr-only">What you noticed (optional)</label>
                  <input id="noticed" ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} autoComplete="off" autoFocus
                    placeholder={`Optional: ${s.example}`}
                    className="min-w-0 flex-1 border-b-2 border-ink-900/25 bg-transparent px-1 py-2 font-handwritten text-2xl text-ink-900 placeholder:text-ink-700/50 focus:border-ink-900 focus:outline-none" />
                  <button type="submit" className="btn-ink">{left === 0 ? 'Next sense' : 'I noticed one'}</button>
                </form>
                <div className="mt-4 flex gap-5 text-sm font-bold text-ink-700">
                  <button type="button" className="underline underline-offset-4" onClick={next}>{step < SENSES.length - 1 ? 'Skip this sense' : 'Finish'}</button>
                  <button type="button" className="underline underline-offset-4" onClick={() => setPhase('intro')}>Stop</button>
                </div>
              </div>
            </Motion.div>
          </AnimatePresence>
        </section>
      )}

      {phase === 'done' && (
        <section className="max-w-3xl">
          <h2 className="text-[clamp(2rem,5vw,3rem)] font-bold leading-tight tracking-tight text-ink-900">You came back to the room.</h2>
          <p className="mt-3 text-lg leading-relaxed text-ink-800">
            That was all five senses. However you feel now is fine; there is no requirement to feel calm.
          </p>
          {noticed.some((a) => a.some(Boolean)) && (
            <dl className="mt-6 divide-y divide-ink-900/10 border-y border-ink-900/10">
              {SENSES.map((x, i) => noticed[i].some(Boolean) && (
                <div key={x.sense} className="flex flex-wrap gap-x-4 py-3">
                  <dt className="w-16 font-bold" style={{ color: x.ink }}>{x.sense}</dt>
                  <dd className="font-handwritten text-xl text-ink-800">{noticed[i].filter(Boolean).join(', ')}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="mt-4 text-sm text-ink-700">What you typed stays on this page and is gone when you leave it.</p>
          <button type="button" className="btn-ink mt-6" onClick={start}>Do it again</button>
        </section>
      )}

      {/* Other ways in, as quiet links rather than more boxes */}
      <div className="mt-14 flex flex-wrap gap-x-8 gap-y-2 border-t border-ink-900/10 pt-5">
        <button type="button" aria-expanded={extra === 'quick'} onClick={() => setExtra(extra === 'quick' ? null : 'quick')}
          className="font-bold text-red-800 underline decoration-2 underline-offset-4">Something quicker</button>
        <button type="button" aria-expanded={extra === 'comfort'} onClick={() => setExtra(extra === 'comfort' ? null : 'comfort')}
          className="font-bold text-ink-900 underline decoration-2 underline-offset-4">Words of comfort</button>
      </div>

      {extra === 'quick' && (
        <section className="mt-6 border-l-4 border-red-700 pl-5" aria-label="Something quicker">
          <dl className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
            {QUICK.map(([t, d]) => (
              <div key={t}><dt className="font-bold text-ink-900">{t}</dt><dd className="leading-relaxed text-ink-700">{d}</dd></div>
            ))}
          </dl>
          <p className="mt-5 leading-relaxed text-ink-800">
            Check that your surroundings are suitable before continuing. You can pause or stop. Consider reaching out to someone you trust.
          </p>
        </section>
      )}

      {extra === 'comfort' && (
        <section className="mt-6" aria-live="polite" aria-label="Words of comfort">
          <AnimatePresence mode="wait">
            <Motion.p key={comfortIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="max-w-3xl font-handwritten text-[clamp(1.8rem,4vw,2.4rem)] leading-snug text-ink-900">
              {COMFORT[comfortIndex]}
            </Motion.p>
          </AnimatePresence>
          <button type="button" className="mt-3 text-sm font-bold underline underline-offset-4"
            onClick={() => setComfortIndex((i) => (i + 1) % COMFORT.length)}>Another one</button>
        </section>
      )}
    </TechniqueShell>
  );
}
