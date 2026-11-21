import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion';
import { PauseIcon, PlayIcon, ForwardIcon } from '@heroicons/react/24/solid';
import TechniqueShell from './TechniqueShell';

/**
 * Moving: short guided routines to use up some of the adrenaline panic brings, chosen by
 * where you are. The page's own look is a footpath: each move is a footprint, and the
 * path fills in as you go.
 */

const ROUTINES = {
  sitting: {
    label: 'Sitting down',
    hint: 'At a desk, on a bus, in bed',
    moves: [
      { name: 'Press your feet into the floor', cue: 'Push down through your heels for a few seconds, then let go. Again.', secs: 30 },
      { name: 'Roll your shoulders', cue: 'Slow circles backwards. Big ones, then small ones.', secs: 30 },
      { name: 'Press your palms together', cue: 'Push your hands into each other at chest height. Hold, then release.', secs: 25 },
      { name: 'Heel raises', cue: 'Lift both heels, lower them. Keep a steady rhythm, like a slow walk.', secs: 30 },
      { name: 'Reach up', cue: 'Stretch both arms up as you breathe in, lower them as you breathe out.', secs: 30 },
      { name: 'Shake out your hands', cue: 'Loose wrists. Let your fingers flop. Shake the buzz out.', secs: 20 },
    ],
  },
  standing: {
    label: 'Standing up',
    hint: 'A little space around you',
    moves: [
      { name: 'March on the spot', cue: 'Lift your knees a little. Swing your arms. Any pace that feels all right.', secs: 45 },
      { name: 'Shake it out', cue: 'Shake your hands, then your arms, then one leg, then the other.', secs: 30 },
      { name: 'Wall push-ups', cue: 'Hands on a wall, lean in slowly, push back. Feel your arms working.', secs: 30 },
      { name: 'Calf raises', cue: 'Up onto your toes, and slowly down. Hold something for balance if you like.', secs: 30 },
      { name: 'Big reach', cue: 'Reach up tall as you breathe in. Let your arms float down as you breathe out.', secs: 30 },
      { name: 'Stand still', cue: 'Feel your feet on the floor and your heartbeat slowing in its own time.', secs: 25 },
    ],
  },
  outside: {
    label: 'Outside',
    hint: 'A short walk, any pace',
    moves: [
      { name: 'Walk', cue: 'Just walk. Notice the ground under each step.', secs: 90 },
      { name: 'Breathe with your steps', cue: 'Breathe in for four steps, out for six. Count quietly.', secs: 60 },
      { name: 'Look for colours', cue: 'Find something green, then something red, then something blue.', secs: 60 },
      { name: 'Listen', cue: 'Pick out the furthest sound you can hear, then the nearest.', secs: 45 },
      { name: 'Slow down', cue: 'Let your pace ease off. Swing your arms loosely.', secs: 45 },
    ],
  },
};

const IDEAS = [
  { energy: 'low', text: 'Stand up and stretch while the kettle boils.' },
  { energy: 'low', text: 'Walk to the end of the road and back.' },
  { energy: 'low', text: 'Five minutes of slow stretching before bed.' },
  { energy: 'low', text: 'Water the plants, tidy one shelf, or hang the washing out.' },
  { energy: 'some', text: 'A twenty-minute walk, somewhere with trees if you can.' },
  { energy: 'some', text: 'Dance to two songs you like, in your room.' },
  { energy: 'some', text: 'A beginner yoga or stretching video.' },
  { energy: 'some', text: 'Cycle, or take the stairs instead of the lift.' },
  { energy: 'lots', text: 'A swim, a jog or a fitness class.' },
  { energy: 'lots', text: 'A longer walk or hike with a friend.' },
  { energy: 'lots', text: 'A team sport, climbing, or anything that makes you laugh.' },
];
const ENERGY = { low: 'Not much energy', some: 'Some energy', lots: 'Plenty of energy' };

const Foot = ({ state, flip, label }) => {
  const fill = state === 'done' ? 'fill-sage-400' : state === 'now' ? 'fill-crayon-leaf' : 'fill-white/80';
  return (
    <svg viewBox="0 0 40 64" role="img" aria-label={label}
      className={`h-14 w-9 transition-all duration-500 sm:h-16 sm:w-10 ${flip ? 'translate-y-5 -scale-x-100' : ''} ${state === 'now' ? 'drop-shadow-[0_0_10px_rgba(78,158,106,0.7)]' : ''}`}>
      <g className={fill} stroke="#2B2D42" strokeOpacity={state === 'todo' ? 0.3 : 0} strokeWidth="1.2">
        {/* sole */}
        <path d="M21 16c7 0 10 6 10 14 0 6-3 9-3 14s2 8 0 13c-2 4-9 5-12 1-3-5 0-9-1-15-1-5-5-8-5-14 0-8 4-13 11-13z" />
        {/* toes */}
        <ellipse cx="11" cy="12" rx="3.6" ry="4.4" />
        <ellipse cx="17.5" cy="7.5" rx="3.2" ry="4" />
        <ellipse cx="24" cy="6.5" rx="2.8" ry="3.6" />
        <ellipse cx="29.5" cy="9" rx="2.4" ry="3.1" />
        <ellipse cx="33.5" cy="13.5" rx="2" ry="2.6" />
      </g>
    </svg>
  );
};

// The page's look: fresh green morning, with a dotted path winding across.
const Path = () => (
  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #EEF6EC 0%, #E3F0E4 45%, #DCEBEF 100%)' }}>
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 900" preserveAspectRatio="none" aria-hidden="true">
      <path d="M-40 760 C 220 640, 380 860, 620 700 S 980 520, 1240 600" fill="none" stroke="#4E9E6A" strokeOpacity="0.18" strokeWidth="5" strokeDasharray="2 18" strokeLinecap="round" />
      <path d="M-40 300 C 260 220, 420 420, 700 300 S 1040 160, 1240 220" fill="none" stroke="#4E9E6A" strokeOpacity="0.12" strokeWidth="4" strokeDasharray="2 16" strokeLinecap="round" />
    </svg>
  </div>
);

function Routine({ routine, onStop }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [left, setLeft] = useState(routine.moves[0].secs);
  const [paused, setPaused] = useState(false);
  const done = step >= routine.moves.length;
  const timer = useRef(null);

  useEffect(() => {
    if (done || paused) return undefined;
    timer.current = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(timer.current);
  }, [done, paused, step]);

  useEffect(() => {
    if (left > 0 || done) return;
    const next = step + 1;
    setStep(next);
    if (next < routine.moves.length) setLeft(routine.moves[next].secs);
  }, [left, done, step, routine.moves]);

  const skip = () => {
    const next = step + 1;
    setStep(next);
    if (next < routine.moves.length) setLeft(routine.moves[next].secs);
  };
  const move = routine.moves[Math.min(step, routine.moves.length - 1)];
  const pct = done ? 100 : 100 - (left / move.secs) * 100;

  return (
    <section className="mt-8" aria-live="polite">
      {/* The footpath: one footprint per move */}
      <ol className="flex items-start gap-2 pb-5 sm:gap-4" aria-label="Moves">
        {routine.moves.map((m, i) => (
          <li key={m.name}><Foot flip={i % 2 === 1} state={i < step ? 'done' : i === step && !done ? 'now' : 'todo'} label={`${m.name}${i < step ? ', done' : i === step ? ', now' : ''}`} /></li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <Motion.div key={done ? 'done' : step}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -30 }} transition={{ duration: 0.3 }}
          className="mt-8 max-w-3xl">
          {done ? (
            <>
              <h2 className="text-[clamp(2rem,5vw,3.2rem)] font-bold leading-tight tracking-tight text-ink-900">That&apos;s the routine done.</h2>
              <p className="mt-3 text-lg leading-relaxed text-ink-800">
                Your heart may still be beating faster for a while. That&apos;s the movement, and it settles by itself. Have a drink of water if you can.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" className="btn-ink" onClick={() => { setStep(0); setLeft(routine.moves[0].secs); }}>Go again</button>
                <button type="button" className="btn-outline" onClick={onStop}>Choose another</button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-[clamp(2.2rem,6vw,4rem)] font-bold leading-[1.02] tracking-tight text-ink-900">{move.name}</h2>
              <p className="mt-4 font-handwritten text-[clamp(1.5rem,3vw,2rem)] leading-snug text-ink-800">{move.cue}</p>
            </>
          )}
        </Motion.div>
      </AnimatePresence>

      {!done && (
        <>
          <div className="mt-8 h-2 max-w-3xl overflow-hidden rounded-full bg-white/70" aria-hidden="true">
            <div className="h-full rounded-full bg-crayon-leaf transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" className="btn-ink !px-5 !py-2" onClick={() => setPaused(!paused)}>
              {paused ? <PlayIcon className="h-5 w-5" aria-hidden="true" /> : <PauseIcon className="h-5 w-5" aria-hidden="true" />}
              {paused ? 'Carry on' : 'Pause'}
            </button>
            <button type="button" className="btn-outline !px-5 !py-2" onClick={skip}>
              <ForwardIcon className="h-5 w-5" aria-hidden="true" /> Next move
            </button>
            <button type="button" onClick={onStop} className="text-sm font-bold text-ink-700 underline underline-offset-4">Stop</button>
            <span className="ml-auto text-sm font-bold tabular-nums text-ink-800">{paused ? 'Paused' : `${left}s`}</span>
          </div>
        </>
      )}
    </section>
  );
}

export default function Activity() {
  const [where, setWhere] = useState('standing');
  const [running, setRunning] = useState(false);
  const [energy, setEnergy] = useState('low');
  const r = ROUTINES[where];
  const mins = Math.round(r.moves.reduce((n, m) => n + m.secs, 0) / 60);

  return (
    <TechniqueShell icon="activity" color="sage" note="Move a little" title="Moving" backdrop={<Path />}
      intro="Panic fills your body with adrenaline, which is energy for running or fighting. Moving gently gives it somewhere to go, and gives your mind something simple to follow.">

      {!running ? (
        <section aria-labelledby="where-title">
          <h2 id="where-title" className="text-2xl font-bold tracking-tight text-ink-900">Where are you right now?</h2>
          <div className="mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-3" role="radiogroup" aria-label="Where you are">
            {Object.entries(ROUTINES).map(([k, v]) => (
              <button key={k} type="button" role="radio" aria-checked={where === k} onClick={() => setWhere(k)}
                className="group border-t-2 py-4 text-left transition-colors"
                style={{ borderColor: where === k ? '#4E9E6A' : 'rgba(43,45,66,0.12)' }}>
                <span className={`block text-2xl font-bold ${where === k ? 'text-ink-900' : 'text-ink-700 group-hover:text-ink-900'}`}>{v.label}</span>
                <span className="mt-1 block text-ink-700">{v.hint}</span>
              </button>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button type="button" className="btn-ink" onClick={() => setRunning(true)}>
              <PlayIcon className="h-5 w-5" aria-hidden="true" /> Move with me
            </button>
            <p className="text-ink-700">{r.moves.length} moves, about {mins} minute{mins === 1 ? '' : 's'}. Skip any that don&apos;t suit you.</p>
          </div>
        </section>
      ) : (
        <Routine key={where} routine={r} onStop={() => setRunning(false)} />
      )}

      <section className="mt-20 grid gap-10 md:grid-cols-[1fr_1fr]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink-900">Why moving can help</h2>
          <dl className="mt-4 divide-y divide-ink-900/10 border-y border-ink-900/10">
            {[
              ['It uses the energy up', 'The racing heart and restless legs of panic are your body getting ready to move. Moving lets some of that run its course.'],
              ['It gives your mind a job', 'Counting steps or following a cue is simple enough to do while anxious, and pulls attention away from the spiral.'],
              ['It helps over weeks', 'Regular activity is linked with lower anxiety in research reviews. A little, often, counts more than a lot, once.'],
            ].map(([t, d]) => (
              <div key={t} className="py-4">
                <dt className="font-bold text-ink-900">{t}</dt>
                <dd className="mt-1 leading-relaxed text-ink-700">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink-900">If it feels like panic</h2>
          <p className="mt-4 leading-relaxed text-ink-800">
            Exercise raises your heart rate and makes you breathe harder, which can feel a lot like panic. That&apos;s normal, and it fades as you cool down.
            Over time, feeling these sensations while you&apos;re safe and in control can make them less frightening. Start gently and build up.
          </p>
          <p className="mt-4 border-l-4 border-red-700 pl-4 leading-relaxed text-ink-800">
            Stop and seek urgent medical help if you have chest pain, feel faint, or your symptoms feel different from your usual panic.
            If you have a heart or lung condition, or are pregnant, check with a doctor what kind of exercise suits you.
          </p>
        </div>
      </section>

      <section className="mt-20" aria-labelledby="ideas-title">
        <h2 id="ideas-title" className="text-2xl font-bold tracking-tight text-ink-900">Something for this week</h2>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2" role="tablist" aria-label="How much energy you have">
          {Object.entries(ENERGY).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={energy === k} onClick={() => setEnergy(k)}
              className={`relative py-1 text-lg font-bold transition-colors ${energy === k ? 'text-ink-900' : 'text-ink-700/70 hover:text-ink-900'}`}>
              {label}
              {energy === k && <Motion.span layoutId="energy-tab" className="absolute inset-x-0 -bottom-0.5 h-1 rounded-full bg-crayon-leaf" />}
            </button>
          ))}
        </div>
        <ul className="mt-4 max-w-3xl">
          <AnimatePresence initial={false} mode="popLayout">
            {IDEAS.filter((i) => i.energy === energy).map((i) => (
              <Motion.li key={i.text} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="border-b border-ink-900/10 py-3 text-lg text-ink-800">
                {i.text}
              </Motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <p className="mt-4 text-sm text-ink-700">Pick something you enjoy; you&apos;re more likely to keep doing it. A few minutes on a hard day still counts.</p>
      </section>
    </TechniqueShell>
  );
}
