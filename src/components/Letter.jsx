import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { forgetActivity } from '../services/activity';

const OPEN_KEY = 'relevia_letter_opened';

const wasOpened = (n) => {
  try { return globalThis.sessionStorage?.getItem(OPEN_KEY) === String(n); } catch { return false; }
};

/**
 * The home letter: it arrives in a sealed envelope each visit, and opens onto a sheet of
 * letter paper. Opening it is a click or Enter; once opened it stays open for the rest of
 * the visit. With reduced motion it opens without animation.
 */
export default function Letter({ letter, onForget }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(() => wasOpened(letter.letterNumber));
  const { envelope: env = ['#F6E7C8', '#EFD9AE'], seal = '#C2456A', stamp = '#6FAF85', month = '' } = letter.theme || {};
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const openLetter = () => {
    setOpen(true);
    try { globalThis.sessionStorage?.setItem(OPEN_KEY, String(letter.letterNumber)); } catch { /* ignore */ }
  };

  if (!open) {
    return (
      <div className="mx-auto max-w-2xl">
        <button type="button" onClick={openLetter} aria-label={`Open letter number ${letter.letterNumber}`}
          className="group relative block aspect-[4/3] w-full sm:aspect-[16/10] rounded-[14px] text-left shadow-[0_30px_60px_-30px_rgba(43,45,66,0.55)] transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-offset-4"
          style={{ background: `linear-gradient(160deg, ${env[0]}, ${env[1]})` }}>
          {/* side folds */}
          <span aria-hidden="true" className="absolute inset-0 rounded-[14px]"
            style={{ background: 'linear-gradient(to top right, rgba(0,0,0,0.06) 50%, transparent 50%) left bottom / 50% 100% no-repeat, linear-gradient(to top left, rgba(0,0,0,0.06) 50%, transparent 50%) right bottom / 50% 100% no-repeat' }} />
          {/* flap */}
          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[48%] origin-top transition-transform duration-500 group-hover:[transform:perspective(800px)_rotateX(18deg)]"
            style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)', background: `linear-gradient(180deg, ${env[0]}, ${env[1]})`, filter: 'brightness(0.96) drop-shadow(0 6px 6px rgba(0,0,0,0.08))' }} />
          {/* wax seal */}
          <span aria-hidden="true" className="absolute left-1/2 top-[48%] flex h-14 w-14 sm:h-16 sm:w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
            style={{ background: `radial-gradient(circle at 32% 28%, #ffffffaa, ${seal} 55%)`, boxShadow: `0 10px 18px -8px ${seal}, inset -4px -6px 10px rgba(0,0,0,0.25)` }}>
            <Heart className="h-6 w-6 fill-white/90 text-white/90" />
          </span>
          {/* stamp */}
          <span aria-hidden="true" className="absolute right-5 top-5 flex h-14 w-12 rotate-3 items-center justify-center border-2 border-dashed border-white/80 text-[10px] font-bold text-white" style={{ background: stamp }}>
            No.&nbsp;{letter.letterNumber}
          </span>
          <span className="absolute inset-x-0 bottom-5 text-center sm:bottom-7">
            <span className="block font-handwritten text-[2rem] leading-none text-ink-900">A {month} letter for you</span>
            <span className="mt-1 block text-sm font-bold text-ink-700 underline underline-offset-4">Open it</span>
          </span>
        </button>
      </div>
    );
  }

  return (
    <Motion.article
      initial={reduce ? false : { opacity: 0, y: 40, rotate: -1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto max-w-2xl rounded-[4px] px-7 py-10 sm:px-14 sm:py-14"
      style={{
        background: 'radial-gradient(120% 80% at 0% 0%, #FFFFFF, #FFFBF0 55%, #F8F0DC)',
        boxShadow: '0 1px 0 #E9DFC6, 0 40px 70px -40px rgba(43,45,66,0.55)',
      }}
      aria-labelledby="letter-title"
    >
      {/* stamp and date */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <p className="pt-2 text-sm text-ink-700">{today}</p>
        <span aria-hidden="true" className="flex h-16 w-14 rotate-3 flex-col items-center justify-center border-[3px] border-dashed border-white text-white shadow-md" style={{ background: stamp }}>
          <Heart className="h-5 w-5 fill-white/90" />
          <span className="mt-0.5 text-[10px] font-bold">{month.slice(0, 3)}</span>
        </span>
      </div>

      <h2 id="letter-title" className="font-handwritten text-[2.4rem] leading-none text-ink-900">{letter.greeting}</h2>
      <div className="font-pencil mt-6 space-y-5 text-[1.12rem] leading-[1.85] text-ink-900">
        {letter.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        <p>{letter.closing}</p>
        <p className="font-bold"><span className="highlight">{letter.affirmation}</span></p>
      </div>
      <p className="mt-8 font-handwritten text-[1.8rem] leading-none text-sage-700">{letter.signature}</p>

      {letter.suggestion && (
        <Link to={letter.suggestion.to} className="btn-outline mt-8">{letter.suggestion.label}</Link>
      )}

      <p className="mt-10 border-t border-ink-900/10 pt-4 text-xs leading-relaxed text-ink-700">
        To write this letter, Relevia counts which pages and techniques you open, start and finish, and how many chats you start. It keeps those numbers, and any affirmations you chose to keep, in this browser only, never what you wrote.{' '}
        <button type="button" className="font-bold underline underline-offset-2" onClick={() => { forgetActivity(); onForget?.(); }}>
          Forget them
        </button>
      </p>
    </Motion.article>
  );
}
