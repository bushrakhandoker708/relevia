import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  motion as Motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
} from 'framer-motion';
import { ArrowDown, Check, Eraser, Eye } from 'lucide-react';
import { recordAbout } from '../services/activity';

/*
 * About: "What is it actually?"
 *
 * REDESIGN (21 November 2026): a scroll story instead of one long column of cards.
 * - The page moves through chapters: the alarm, why it happens, what it can feel like,
 *   when to reach out, and what helps.
 * - Coloured light behind frosted glass changes from alarm-rose to calm-green as you read.
 * - "What it can feel like" is a set of cards you scribble on to uncover. Nothing is
 *   locked: Enter uncovers a card, "Show all" uncovers every card, and the text is always
 *   in the page for screen readers.
 * - The urgent-help note is never hidden, never behind scrolling effects, and comes early.
 * - With reduced motion, the pinned and sideways-scrolling sections become a plain column.
 */

const causes = [
  { title: 'Family history', tint: '#E9E4FA', deep: '#7F6FD0',
    text: "If anxiety runs in your family, your nervous system may react more strongly to stress. It doesn't mean panic attacks are certain." },
  { title: 'Stress and big changes', tint: '#FCEBC7', deep: '#C98A12',
    text: 'Moving, a new job, a loss: big events can overwhelm the ways we usually cope. Panic can be a sign you need more support.' },
  { title: 'Health conditions', tint: '#F8DCE3', deep: '#C2456A',
    text: 'Thyroid problems, heart conditions and breathing problems can cause similar symptoms. It is worth checking with a doctor.' },
  { title: 'Brain chemistry', tint: '#D9E6FA', deep: '#3E6FD8',
    text: 'Chemical messengers such as serotonin help regulate mood. When they are out of balance, anxiety can rise. This is treatable.' },
  { title: 'Substances and medicines', tint: '#DCEFE1', deep: '#3F8A5A',
    text: 'Caffeine, alcohol, some medicines and withdrawal can trigger panic-like symptoms, even in ordinary amounts.' },
];

const feelings = [
  { name: 'Racing heart or palpitations', note: 'A racing heartbeat can have several causes. This page cannot tell which one is yours.', tint: '#F8DCE3' },
  { name: 'Sweating or sudden chills', note: "Your body's cooling and warming systems reacting to stress.", tint: '#D9E6FA' },
  { name: 'Hard to breathe, or feeling smothered', note: 'Breathlessness can come with anxiety or with other conditions. Seek urgent help for severe breathing difficulty.', tint: '#DCEFE1' },
  { name: 'Dizzy or light-headed', note: 'Sit somewhere supported if you feel unsteady. Get medical advice if this is new or worrying.', tint: '#E9E4FA' },
  { name: 'Tight or uncomfortable chest', note: 'Chest discomfort needs a proper medical check. Do not assume it is anxiety.', tint: '#FCEBC7' },
  { name: 'Feeling sick or an upset stomach', note: 'Digestion slows down under stress. This usually settles.', tint: '#DCEFE1' },
  { name: 'Tingling in hands, feet or face', note: 'Tingling has several possible causes. This page cannot tell whether yours is harmless.', tint: '#D9E6FA' },
  { name: "Feeling like you can't swallow", note: 'Throat muscles can tense up. Sip water slowly if you can.', tint: '#F8DCE3' },
  { name: "Fear of losing control or 'going mad'", note: 'This can be very distressing. A qualified professional can help work out what is happening.', tint: '#E9E4FA' },
  { name: 'A strong fear of dying', note: 'Panic can make the brain signal danger very loudly. If you are unsure whether it is an emergency, get urgent help.', tint: '#FCEBC7' },
];

const alarmSteps = [
  { label: 'A false alarm', text: "A panic attack is a sudden wave of intense fear or discomfort. It's as if the body's emergency system, built to protect you, goes off when no emergency is there." },
  { label: 'It rises, then falls', text: 'Panic attacks are brief but intense. They often peak within minutes and usually ease within 5 to 20, though in the middle of one it can feel endless.' },
  { label: 'It can feel like something worse', text: "People describe feeling they are losing control, having a heart attack or dying. Similar symptoms can have other causes, so new or worrying symptoms need a doctor's check." },
];

const useIsWide = () => {
  const query = '(min-width: 1024px)';
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return wide;
};

/* ---------- Coloured light behind the glass ---------- */
function Light() {
  const { scrollYProgress } = useScroll();
  const reduce = useReducedMotion();
  // Alarm-rose at the top of the page, calm green and blue by the end.
  const a = useTransform(scrollYProgress, [0, 0.35, 1], ['#F4A6B8', '#B9A8F0', '#9FD3B0']);
  const b = useTransform(scrollYProgress, [0, 0.5, 1], ['#F7C873', '#9EC1F2', '#A9DCC8']);
  const y1 = useTransform(scrollYProgress, [0, 1], ['0vh', reduce ? '0vh' : '-30vh']);
  const y2 = useTransform(scrollYProgress, [0, 1], ['0vh', reduce ? '0vh' : '25vh']);
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <Motion.div className="absolute -left-[10vw] top-[5vh] h-[55vw] w-[55vw] max-h-[720px] max-w-[720px] rounded-full opacity-60 blur-3xl"
        style={{ background: a, y: y1 }} />
      <Motion.div className="absolute -right-[12vw] top-[35vh] h-[50vw] w-[50vw] max-h-[680px] max-w-[680px] rounded-full opacity-50 blur-3xl"
        style={{ background: b, y: y2 }} />
    </div>
  );
}

/* ---------- Chapter 1: the alarm (pinned on wide screens) ---------- */
function AlarmStory({ wide }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const pinned = wide && !reduce;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setActive(Math.min(alarmSteps.length - 1, Math.floor(v * alarmSteps.length))));
  const pulse = useTransform(scrollYProgress, [0, 0.33, 0.66, 1], [1, 1.18, 0.95, 0.85]);
  const hue = useTransform(scrollYProgress, [0, 0.5, 1], ['#E2647F', '#B39DDB', '#6FAF85']);

  return (
    <section ref={ref} className={pinned ? 'relative h-[260vh]' : 'relative'} aria-labelledby="alarm-heading">
      <div className={pinned ? 'sticky top-0 flex h-screen items-center' : 'py-16'}>
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="flex justify-center" aria-hidden="true">
            <Motion.div className="relative aspect-square w-56 max-w-full rounded-full sm:w-72"
              style={{ scale: pinned ? pulse : 1, background: hue, boxShadow: '0 40px 80px -30px rgba(43,45,66,0.45)' }}>
              <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.95), rgba(255,255,255,0) 45%)' }} />
              <div className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset -18px -24px 40px rgba(0,0,0,0.18)' }} />
            </Motion.div>
          </div>
          <div>
            <p className="margin-note text-2xl">Chapter one</p>
            <h2 id="alarm-heading" className="mt-1 text-4xl font-bold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl">
              An alarm with no fire
            </h2>
            <ol className="mt-8 space-y-6">
              {alarmSteps.map((s, i) => (
                <li key={s.label}
                  className={`glass p-5 transition-all duration-500 ${pinned && i !== active ? 'opacity-35 saturate-0' : 'opacity-100'}`}>
                  <p className="text-xl font-bold text-ink-900">{s.label}</p>
                  <p className="mt-1 leading-relaxed text-ink-800">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Chapter 2: causes, scrolling sideways on wide screens ---------- */
function CausesRail({ wide }) {
  const ref = useRef(null);
  const track = useRef(null);
  const reduce = useReducedMotion();
  const pinned = wide && !reduce;
  const [distance, setDistance] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0.05, 0.95], [0, -distance]);

  useEffect(() => {
    if (!pinned) return undefined;
    const measure = () => setDistance(Math.max(0, (track.current?.scrollWidth || 0) - window.innerWidth + 48));
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [pinned]);

  const cards = causes.map((c, i) => (
    <article key={c.title}
      className="glass relative flex w-[78vw] shrink-0 snap-center flex-col justify-between overflow-hidden p-7 sm:w-[420px] lg:h-[44vh] lg:w-[440px]"
      style={{ background: `linear-gradient(160deg, ${c.tint}E6, rgba(250,251,247,0.55))` }}>
      <span className="absolute -right-6 -top-10 select-none text-[9rem] font-bold leading-none" style={{ color: c.deep, opacity: 0.14 }} aria-hidden="true">
        {i + 1}
      </span>
      <h3 className="relative text-3xl font-bold leading-tight tracking-tight text-ink-900">{c.title}</h3>
      <p className="relative mt-6 text-lg leading-relaxed text-ink-800">{c.text}</p>
    </article>
  ));

  return (
    <section ref={ref} className={pinned ? 'relative h-[320vh]' : 'relative py-16'} aria-labelledby="causes-heading">
      <div className={pinned ? 'sticky top-0 flex h-screen flex-col justify-center overflow-hidden' : ''}>
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <p className="margin-note text-2xl">Chapter two</p>
          <h2 id="causes-heading" className="mt-1 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl">
            Why it happens
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-ink-700">
            Knowing the &ldquo;why&rdquo; can make panic less mysterious. Usually it is a mix of these.
            {pinned && ' Keep scrolling to move along.'}
          </p>
        </div>
        {pinned ? (
          <Motion.div ref={track} className="mt-10 flex gap-6 pl-[max(1rem,calc((100vw-72rem)/2+1.5rem))]" style={{ x }}>
            {cards}
          </Motion.div>
        ) : (
          <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:px-6" tabIndex={0} aria-label="Causes, scroll sideways">
            {cards}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- Chapter 3: scribble to uncover ---------- */
function ScratchCard({ item, revealed, onReveal }) {
  const wrap = useRef(null);
  const canvas = useRef(null);
  const drawing = useRef(false);
  const moves = useRef(0);
  const last = useRef(null);

  useEffect(() => {
    if (revealed) return undefined;
    const c = canvas.current;
    const paint = () => {
      const { width, height } = wrap.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      c.width = width * dpr;
      c.height = height * dpr;
      const ctx = c.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = item.tint;
      ctx.fillRect(0, 0, width, height);
      // A few loose loops, like a doodle someone left on the page.
      ctx.strokeStyle = 'rgba(43,45,66,0.22)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      for (let row = 0; row < 3; row += 1) {
        ctx.beginPath();
        for (let t = 0; t <= width; t += 4) {
          const y = height * (0.3 + row * 0.2) + Math.sin(t / 11 + row) * 6 + Math.cos(t / 23) * 4;
          if (t === 0) ctx.moveTo(t, y); else ctx.lineTo(t, y);
        }
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(43,45,66,0.6)';
      ctx.font = '600 22px Caveat, cursive';
      ctx.textAlign = 'center';
      ctx.fillText('scribble here', width / 2, height - 18);
    };
    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(wrap.current);
    return () => ro.disconnect();
  }, [revealed, item.tint]);

  const scratch = (e) => {
    if (!drawing.current) return;
    const c = canvas.current;
    const rect = c.getBoundingClientRect();
    const ctx = c.getContext('2d');
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Erase along the whole stroke, not just where pointer events land, so a quick
    // scribble clears a solid band.
    const from = last.current || { x, y };
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = '#000'; // fully opaque, so the eraser clears completely
    ctx.lineWidth = 46;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    last.current = { x, y };
    moves.current += 1;
    if (moves.current % 6 === 0) checkCleared();
  };

  // Sample every 16th pixel: once about 35% is cleared, take the rest away.
  const checkCleared = () => {
    const c = canvas.current;
    if (!c) return;
    const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let clear = 0; let total = 0;
    for (let i = 3; i < data.length; i += 64) { total += 1; if (data[i] < 40) clear += 1; }
    if (clear / total > 0.35) onReveal();
  };

  const endStroke = () => {
    if (drawing.current) checkCleared();
    drawing.current = false;
    last.current = null;
  };

  return (
    <li ref={wrap} className="glass relative min-h-[170px] overflow-hidden p-5" style={{ background: `linear-gradient(160deg, ${item.tint}CC, rgba(250,251,247,0.6))` }}>
      <p className="text-lg font-bold leading-snug text-ink-900">{item.name}</p>
      <p className="mt-2 leading-relaxed text-ink-800">{item.note}</p>
      {!revealed && (
        <button
          type="button"
          className="absolute inset-0 h-full w-full cursor-crosshair touch-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:-outline-offset-4"
          aria-label={`Uncover: ${item.name}`}
          // Keyboard: Enter or Space uncovers at once. A pointer tap does nothing on its own,
          // so scribbling stays the way in for mouse and touch.
          onClick={(e) => { if (e.detail === 0) onReveal(); }}
          onPointerDown={(e) => { drawing.current = true; e.currentTarget.setPointerCapture?.(e.pointerId); scratch(e); }}
          onPointerMove={scratch}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
        >
          <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden="true" />
        </button>
      )}
    </li>
  );
}

function Discover() {
  const [open, setOpen] = useState(() => new Set());
  const allOpen = open.size === feelings.length;
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6" aria-labelledby="feel-heading">
      <p className="margin-note text-2xl">Chapter three</p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="feel-heading" className="mt-1 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl">
          What it can feel like
        </h2>
        <div className="flex gap-3">
          <button type="button" className="btn-outline !py-2" onClick={() => setOpen(new Set(feelings.map((f) => f.name)))} disabled={allOpen}>
            <Eye className="h-4 w-4" aria-hidden="true" /> Show all
          </button>
          {open.size > 0 && (
            <button type="button" className="text-sm font-bold text-ink-800 underline underline-offset-4" onClick={() => setOpen(new Set())}>
              <Eraser className="mr-1 inline h-4 w-4" aria-hidden="true" />Cover them again
            </button>
          )}
        </div>
      </div>
      <p className="mt-3 max-w-2xl text-lg text-ink-700">
        Scribble on a card to uncover it, or choose &ldquo;Show all&rdquo;. These can have different causes, and a clinician can help assess them.
      </p>
      <p className="mt-1 text-sm text-ink-700">{open.size} of {feelings.length} uncovered</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {feelings.map((f) => (
          <ScratchCard key={f.name} item={f} revealed={open.has(f.name)}
            onReveal={() => setOpen((prev) => new Set(prev).add(f.name))} />
        ))}
      </ul>
    </section>
  );
}

/* ---------- Page ---------- */
export default function PanicUnderstanding() {
  useEffect(() => { recordAbout(); }, []);
  const wide = useIsWide();
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const heroFade = useTransform(scrollY, [0, 500], [1, reduce ? 1 : 0.2]);
  const heroLift = useTransform(scrollY, [0, 500], [0, reduce ? 0 : -60]);

  return (
    <div className="relative">
      <Light />

      <div className="relative z-10">
        {/* Hero */}
        <Motion.header className="mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-center px-4 pt-20 sm:px-6"
          style={{ opacity: heroFade, y: heroLift }}>
          <p className="margin-note text-2xl sm:text-3xl">You&apos;re not the only one</p>
          <h1 className="mt-2 max-w-5xl text-[clamp(2.75rem,8vw,6.5rem)] font-bold leading-[0.95] tracking-[-0.03em] text-ink-900">
            Understanding panic attacks
          </h1>
          <p className="mt-8 max-w-2xl text-xl leading-relaxed text-ink-800">
            If you&apos;re here, you may be having panic attacks or supporting someone who is. Panic can feel frightening. This page gives general information. It cannot work out the cause of your symptoms.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/coping/breathing" className="btn-ink">Breathe with me now</Link>
            <a href="#alarm-heading" className="inline-flex items-center gap-2 font-bold text-ink-800 underline underline-offset-4">
              Read on <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </Motion.header>

        {/* Urgent help: early, plain and never animated away. */}
        <aside className="mx-auto max-w-6xl px-4 sm:px-6" aria-labelledby="urgent-heading">
          <div className="glass border-l-4 !border-l-red-700 p-6">
            <h2 id="urgent-heading" className="text-xl font-bold text-ink-900">When to get urgent help</h2>
            <p className="mt-2 max-w-3xl leading-relaxed text-ink-800">
              A website cannot confirm that your symptoms are a panic attack. If you have severe chest pain, severe breathing difficulty or another possible emergency, seek urgent medical help instead of waiting for an exercise to work.
            </p>
          </div>
        </aside>

        <AlarmStory wide={wide} />
        <CausesRail wide={wide} />

        {/* Interlude */}
        <section className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
          <p className="text-[clamp(2rem,5vw,3.75rem)] font-bold leading-[1.05] tracking-tight text-ink-900">
            You&apos;re in good company.
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ink-800">
            Many people have a panic attack at some point in their lives: teachers, parents, students, people in every kind of job. Having them says nothing bad about who you are.
          </p>
        </section>

        <Discover />

        {/* Chapter four */}
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-24 sm:px-6 lg:grid-cols-2" aria-labelledby="reach-heading">
          <div>
            <p className="margin-note text-2xl">Chapter four</p>
            <h2 id="reach-heading" className="mt-1 text-4xl font-bold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl">
              When to reach out
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-700">
              If these symptoms keep coming back, consider speaking with a qualified health professional. Do not use a predicted duration to decide whether you need urgent help.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Panic attacks are happening often',
                "You're avoiding places or situations in case one happens",
                'Fear of panic is getting in the way of daily life, work or relationships',
                "You're using alcohol, drugs or other substances to cope",
                "You're feeling low or depressed as well",
              ].map((t) => (
                <li key={t} className="flex gap-3 text-ink-800">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-600 text-white"><Check className="h-4 w-4" aria-hidden="true" /></span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass self-start p-7">
            <h3 className="text-2xl font-bold text-ink-900">Asking for help is a strong step</h3>
            <p className="mt-2 leading-relaxed text-ink-800">Therapists, counsellors and doctors help people with anxiety and panic every day. Options include:</p>
            <dl className="mt-5 space-y-4">
              {[
                ['Cognitive behavioural therapy (CBT)', 'helps change the thought patterns that feed panic'],
                ['Mindfulness-based therapies', 'practise noticing the present moment'],
                ['Medicine', 'when appropriate, can help manage symptoms'],
                ['Support groups', 'time with others who understand'],
              ].map(([t, d]) => (
                <div key={t}>
                  <dt className="font-bold text-ink-900">{t}</dt>
                  <dd className="text-ink-700">{d}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 leading-relaxed text-ink-800">Panic disorder is treatable, and many people learn to manage it well.</p>
          </div>
        </section>

        {/* Chapter five */}
        <section className="mx-auto max-w-6xl px-4 pb-32 pt-12 sm:px-6" aria-labelledby="path-heading">
          <p className="margin-note text-2xl">Chapter five</p>
          <h2 id="path-heading" className="mt-1 text-4xl font-bold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl">
            Your way forward
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ['Understanding', 'Knowing what is happening can make it less frightening.', '#D9E6FA'],
              ['Kindness to yourself', "Treat yourself the way you'd treat a good friend.", '#F8DCE3'],
              ['Support', "You don't have to face this alone. Help is out there.", '#DCEFE1'],
            ].map(([t, d, tint]) => (
              <div key={t} className="glass p-6" style={{ background: `linear-gradient(160deg, ${tint}E6, rgba(250,251,247,0.55))` }}>
                <p className="text-2xl font-bold tracking-tight text-ink-900">{t}</p>
                <p className="mt-2 leading-relaxed text-ink-800">{d}</p>
              </div>
            ))}
          </div>
          <div className="glass mt-10 flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl font-handwritten text-[1.9rem] leading-snug text-ink-900">
              One breath, one moment, one day at a time.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/coping" className="btn-ink">Try a coping technique</Link>
              <button type="button" className="btn-outline" onClick={() => window.dispatchEvent(new Event('relevia:open-chat'))}>
                Talk with Relevia
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
