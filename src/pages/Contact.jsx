// Contact: what the project is and where to follow it. It used to carry personal stories
// and photographs; those were removed on 21 November 2026 so that the public prototype
// shows the project, not private lives. Relevia offers no one-to-one contact.

import { Link } from 'react-router-dom';

const links = [
  { href: 'https://github.com/bushrakhandoker708/relevia', title: 'Application source', desc: 'The code for this site, with notes on how it is built, its privacy behaviour and its tests.' },
  { href: 'https://github.com/bushrakhandoker708/relevia-research', title: 'Research repository', desc: 'Experiments on prompting, safety routing and browser performance, with their data, results and limitations.' },
];

function Contact() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-32 pt-24 sm:px-6">
      <header>
        <p className="margin-note text-2xl">About this project</p>
        <h1 className="mt-1 text-4xl font-bold text-ink-900 sm:text-5xl">Contact</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-700">
          Relevia is a student research prototype: a quiet place to write things down, with breathing and grounding
          exercises and an AI chat that runs in your own browser. It is used to study how small on-device language
          models can give supportive replies safely and quickly.
        </p>
      </header>

      <section className="mt-10" aria-labelledby="status">
        <h2 id="status" className="text-2xl font-bold text-ink-900">What it is not</h2>
        <p className="mt-2 leading-relaxed text-ink-700">
          Relevia is not therapy, a diagnosis or an emergency service, and it has not been clinically evaluated. The chat
          is an experimental AI feature: its safety checks are rules that can miss things, and its replies have not been
          reviewed by professionals.
        </p>
      </section>

      <section className="mt-10" aria-labelledby="follow">
        <h2 id="follow" className="text-2xl font-bold text-ink-900">Follow the work</h2>
        <ul className="mt-4 border-t border-ink-900/10">
          {links.map((l) => (
            <li key={l.href} className="border-b border-ink-900/10">
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="group block py-5">
                <span className="block text-xl font-bold text-ink-900 group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
                  {l.title}<span className="sr-only"> (opens in a new tab)</span>
                </span>
                <span className="mt-1 block leading-relaxed text-ink-700">{l.desc}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-ink-700">
          Questions or problems with the site can be raised as an issue on either repository. Please do not post personal
          or health details there: issues are public.
        </p>
      </section>

      <aside className="paper-sheet mt-12 p-6" aria-labelledby="now">
        <h2 id="now" className="text-xl font-bold text-ink-900">If you need help now</h2>
        <p className="mt-2 leading-relaxed text-ink-800">
          Relevia cannot respond to messages. If you or someone else is in immediate danger, call your local emergency
          number (999 in the UK, 112 in the EU, 911 in the US and Canada). Crisis lines are listed on the{' '}
          <Link to="/medication#urgent-help" className="underline underline-offset-4">Medication page</Link>.
        </p>
      </aside>
    </div>
  );
}

export default Contact;
