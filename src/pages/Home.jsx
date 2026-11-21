import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ChatbotWidget from '../components/Chatbot';
import { CrayonScene } from '../components/Crayon';
import Letter from '../components/Letter';
import { TechniqueSphere } from '../components/CopingTechniques/TechniqueShell';
import { buildLetter } from '../services/personalLetter';
import { recordVisit, readActivity, smallThingFor, TECHNIQUES } from '../services/activity';
import { affirmationsForHome } from '../services/affirmations';

// Home: the first page of the notebook. The letter changes with what someone has done on
// the site (counts only, kept in this browser; see services/activity.js), a small thing
// changes every day, and a sticker page fills in as techniques are tried. None of it
// keeps score or breaks a streak: nothing is lost by staying away.

const contents = [
  { to: '/about', icon: 'info', color: 'blue', title: 'What is it actually?', desc: 'What happens in the body during a panic attack, told as a short story.' },
  { to: '/coping', icon: 'breathing', color: 'leaf', title: 'Coping techniques', desc: 'Breathing, grounding, relaxation and other things to try, step by step.' },
  { to: '/medication', icon: 'pill', color: 'lilac', title: 'Medication', desc: 'General information about common treatments, to talk through with a doctor.' },
  { to: '/contact', icon: 'letter', color: 'rose', title: 'Contact', desc: 'Who made Relevia and how to get in touch.' },
];

const openChat = () => window.dispatchEvent(new Event('relevia:open-chat'));

function Home() {
  const [visit] = useState(() => recordVisit());
  const [activity, setActivity] = useState(() => readActivity());
  const [letter, setLetter] = useState(() => buildLetter(visit, null, new Date(), visit));
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  useEffect(() => {
    const refresh = () => setActivity(readActivity());
    window.addEventListener('relevia:activity', refresh);
    return () => window.removeEventListener('relevia:activity', refresh);
  }, []);

  const forget = () => {
    setActivity(readActivity());
    setLetter(buildLetter({ count: 1 }, null, new Date(), null));
  };

  // Recomputed when activity changes (for example after "Forget them").
  const homeAffirmations = affirmationsForHome(activity, new Date());
  const triedCount =Object.keys(activity.techniques).filter((k) => TECHNIQUES[k]).length;

  return (
    <>
      <ChatbotWidget />

      {/* Colour behind the glass */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-[12vw] -top-[8vh] h-[48vw] w-[48vw] max-h-[640px] max-w-[640px] rounded-full bg-[#F4C6A8] opacity-45 blur-3xl" />
        <div className="absolute -right-[10vw] top-[30vh] h-[44vw] w-[44vw] max-h-[600px] max-w-[600px] rounded-full bg-[#B9D7C2] opacity-50 blur-3xl" />
        <div className="absolute bottom-[-10vh] left-[25vw] h-[40vw] w-[40vw] max-h-[560px] max-w-[560px] rounded-full bg-[#C9C0F2] opacity-40 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-32 pt-24 sm:px-6">
        {/* Opening page */}
        <section className="grid items-center gap-10 md:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="margin-note text-2xl">{today}</p>
            <h1 className="mt-2 text-[clamp(2.4rem,5.5vw,4rem)] font-bold leading-[1.02] tracking-[-0.02em] text-ink-900">
              A quiet page to put things down.
            </h1>
            <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-ink-700">
              Write what&apos;s on your mind and Relevia will write back. The AI runs in your own browser,
              so what you write is not sent to a server.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" className="btn-ink" onClick={openChat}>Start writing</button>
              <Link to="/coping/breathing" className="btn-outline">Try a breathing exercise</Link>
            </div>
          </div>
          <CrayonScene className="w-full" />
        </section>

        {/* The letter */}
        <section className="mt-24" aria-label="Your letter">
          <p className="margin-note mb-4 text-center text-2xl">{visit.isFirst ? 'Your first letter' : 'A new letter, written for this visit'}</p>
          <Letter key={letter.letterNumber + (letter.paragraphs[0] || '')} letter={letter} onForget={forget} />
        </section>

        {/* Three sentences picked from how the site has been used (counts only, never words) */}
        <section className="mx-auto mt-28 max-w-4xl" aria-labelledby="aff-title">
          <h2 id="aff-title" className="margin-note text-center text-2xl">A few words for you</h2>
          <ul className="mt-8 space-y-10">
            {homeAffirmations.map((a, i) => (
              <li key={a.text} className={i === 1 ? 'sm:pl-[18%]' : i === 2 ? 'sm:pl-[8%]' : ''}>
                <p className="font-pencil text-base text-rose-700">{a.why}</p>
                <p className="mt-1 text-[clamp(1.5rem,3.4vw,2.3rem)] font-bold leading-tight tracking-tight text-ink-900">
                  <span className="bg-[linear-gradient(transparent_62%,rgba(244,170,190,0.45)_62%)]">{a.text}</span>
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-center">
            <Link to="/coping/affirmations" className="font-bold text-ink-900 underline decoration-rose-400 decoration-2 underline-offset-4">
              More sentences like these
            </Link>
          </p>
        </section>

        {/* Today's small thing: just words on the page */}
        <section className="mx-auto mt-28 max-w-3xl text-center">
          <p className="margin-note text-2xl">Today&apos;s small thing</p>
          <p className="mt-3 text-[clamp(1.6rem,3.4vw,2.4rem)] font-bold leading-tight tracking-tight text-ink-900">{smallThingFor()}</p>
          <p className="mt-3 text-sm text-ink-700">A different one every day. Only if you feel like it.</p>
        </section>

        {/* Sticker page: stickers only for what has been found; the rest are plain words */}
        <section className="mx-auto mt-28 max-w-5xl" aria-labelledby="stickers-title">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink-900/10 pb-3">
            <h2 id="stickers-title" className="text-2xl font-bold tracking-tight text-ink-900">Your sticker page</h2>
            <p className="text-sm text-ink-700">{triedCount} of {Object.keys(TECHNIQUES).length} found. No order, no deadline.</p>
          </div>
          <ul className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-5">
            {Object.entries(TECHNIQUES).map(([key, t]) => {
              const got = activity.techniques[key] > 0;
              return (
                <li key={key}>
                  <Link to={t.to} className="group flex flex-col items-center gap-1.5" aria-label={`${t.title}${got ? ', sticker found' : ', not tried yet'}`}>
                    {got && (
                      <span className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                        <TechniqueSphere icon={key} color={t.color} size={48} />
                      </span>
                    )}
                    <span className={`text-sm font-bold ${got ? 'text-ink-900' : 'text-ink-700/60 underline decoration-dotted underline-offset-4 group-hover:text-ink-900'}`}>{t.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Contents: a plain list with hairlines, like a table of contents */}
        <section className="mx-auto mt-28 max-w-5xl" aria-labelledby="contents-title">
          <h2 id="contents-title" className="border-b border-ink-900/10 pb-3 text-2xl font-bold tracking-tight text-ink-900">In this notebook</h2>
          <ul>
            {contents.map((item) => (
              <li key={item.to} className="border-b border-ink-900/10">
                <Link to={item.to} className="group flex items-baseline justify-between gap-6 py-5">
                  <span>
                    <span className="block text-xl font-bold text-ink-900 group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">{item.title}</span>
                    <span className="mt-1 block leading-relaxed text-ink-700">{item.desc}</span>
                  </span>
                  <span className="shrink-0 text-2xl text-ink-700 transition-transform group-hover:translate-x-1" aria-hidden="true">&rsaquo;</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-sm leading-relaxed text-ink-700">
            Relevia is an AI-supported tool for general information and everyday support. It is not a therapist
            or an emergency service. If you might be in danger, contact your local emergency number.
          </p>
        </section>
      </div>
    </>
  );
}

export default Home;
