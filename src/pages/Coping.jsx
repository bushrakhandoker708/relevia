import { Link } from 'react-router-dom';
import { CrayonIcon } from '../components/Crayon';

// Paper theme: the techniques are a contents page, with one open page beside it for
// someone who needs something right now. The old page had drifting blobs, a looping
// animation and buttons with sparkles that never stopped moving.

const techniques = [
  { id: 'breathing', icon: 'breathing', color: 'leaf', title: 'Deep breathing', description: 'Try the 4-4-4 breathing technique to help calm your nervous system.' },
  { id: 'mindfulness', icon: 'mindfulness', color: 'blue', title: 'Mindfulness', description: 'Ground yourself with the 5-4-3-2-1 senses technique.' },
  { id: 'relaxation', icon: 'relaxation', color: 'sun', title: 'Progressive relaxation', description: 'Release tension by tensing and then relaxing each group of muscles.' },
  { id: 'visualization', icon: 'visualization', color: 'lilac', title: 'Visualisation', description: 'Picture a peaceful scene to help settle your mind.' },
  { id: 'affirmations', icon: 'affirmations', color: 'rose', title: 'Affirmations', description: 'Repeat calming phrases to help shift how you are thinking.' },
  { id: 'activity', icon: 'activity', color: 'sage', title: 'Moving', description: 'A few minutes of guided movement, sitting, standing or outside.' },
  { id: 'journaling', icon: 'journaling', color: 'blue', title: 'Journaling', description: 'Writing your thoughts down can help you work through them.' },
];

function Coping() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-32 pt-24 sm:px-6">
      <header className="max-w-2xl">
        <p className="margin-note text-2xl">Things to try</p>
        <h1 className="mt-1 text-4xl font-bold text-ink-900 sm:text-5xl">Coping techniques</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-700">
          Short, gentle exercises for when things feel like too much. Pick whichever feels manageable, and stop
          any exercise that makes you feel worse.
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.25fr_1fr]">
        <ul className="grid gap-4 sm:grid-cols-2" aria-label="All techniques">
          {techniques.map((t, i) => (
            <li key={t.id}>
              <Link to={`/coping/${t.id}`} className="paper-sheet group flex h-full items-start gap-4 p-5 transition-transform hover:-translate-y-0.5">
                <CrayonIcon kind={t.icon} color={t.color} size={56} seed={i + 11} />
                <span>
                  <span className="block text-lg font-bold text-ink-900 group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">{t.title}</span>
                  <span className="mt-1 block leading-relaxed text-ink-700">{t.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <aside className="paper-sheet ruled self-start py-8 pl-16 pr-6" style={{ '--line': '32px' }} aria-labelledby="right-now">
          <h2 id="right-now" className="font-handwritten text-[2rem] font-bold leading-[64px] text-ink-900">If you need something right now</h2>
          <p className="mb-[32px] leading-[32px] text-ink-800">
            Follow the circle: breathe in as it grows, hold, and breathe out as it shrinks. There is no right speed.
          </p>
          <div className="my-[32px] flex h-48 items-center justify-center" aria-hidden="true">
            <div className="animate-breathe h-40 w-40 rounded-full border-4 border-sage-500 bg-sage-100/70" />
          </div>
          <Link to="/coping/breathing" className="btn-ink">Start the breathing exercise</Link>
          <p className="margin-note mt-[32px] text-[1.5rem] leading-[32px]">Even one slow breath counts.</p>
        </aside>
      </div>

      <section className="mt-16 max-w-2xl">
        <h2 className="text-2xl font-bold text-ink-900">Looking for more?</h2>
        <p className="mt-2 leading-relaxed text-ink-700">Read about what happens during a panic attack, or get in touch.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/about" className="btn-outline">What is a panic attack?</Link>
          <Link to="/contact" className="btn-outline">Contact</Link>
        </div>
      </section>
    </main>
  );
}

export default Coping;
