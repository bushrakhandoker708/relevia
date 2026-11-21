import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { recordTechnique } from '../../services/activity';
import { Wind, Leaf, Sun, Mountain, PenLine, Footprints, Heart, Info, Pill, Mail } from 'lucide-react';

// Each technique gets its own colour and a soft, lit sphere instead of the crayon patch,
// which looked muddy at this size. The light comes from the top left, as on the 3D balls.
const SPHERE = {
  leaf: ['#BFE3C8', '#4E9E6A'],
  blue: ['#C7D8F7', '#3E6FD8'],
  sun: ['#FCE3A6', '#E0A12A'],
  rose: ['#F8C9D3', '#D9567A'],
  lilac: ['#DCD5F6', '#7F6FD0'],
  sage: ['#D5E2D7', '#5F7F68'],
};
const GLYPH = {
  breathing: Wind, mindfulness: Leaf, grounding: Leaf, relaxation: Sun,
  visualization: Mountain, journaling: PenLine, activity: Footprints, affirmations: Heart,
  info: Info, pill: Pill, letter: Mail, heart: Heart,
};

export function TechniqueSphere({ icon, color, size = 112 }) {
  const [light, deep] = SPHERE[color] || SPHERE.sage;
  const Glyph = GLYPH[icon] || Leaf;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size, height: size, minWidth: size,
        background: `radial-gradient(circle at 32% 28%, #ffffff 0%, ${light} 30%, ${deep} 100%)`,
        boxShadow: `0 18px 30px -14px ${deep}, inset -8px -10px 18px rgba(0,0,0,0.12)`,
      }}
      aria-hidden="true"
    >
      <Glyph size={size * 0.38} strokeWidth={1.8} color="#ffffff" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }} />
    </div>
  );
}

/**
 * TechniqueShell - the shared page frame for the seven coping techniques.
 *
 * Every technique opens the same way, like a page in the same notebook: a way back to the
 * list, a handwritten margin note, a plain heading, one or two sentences on what the
 * exercise is, and a coloured sphere for the technique. The exercise itself goes below as children.
 */
export default function TechniqueShell({ icon, color, note, title, intro, wide = false, fit = false, backdrop = null, children }) {
  // Counts the visit for the home letter and sticker page (a number, kept in this browser).
  useEffect(() => { recordTechnique(icon); }, [icon]);
  const width = wide ? 'max-w-6xl' : 'max-w-4xl';
  const back = (
    <Link to="/coping" className="text-sm font-bold text-ink-700 underline decoration-2 underline-offset-4 hover:text-ink-900">
      All coping techniques
    </Link>
  );
  return (
    <>
      {backdrop && (
        <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
          {backdrop}
          {/* a soft light wash under the heading, so text stays readable over any picture */}
          <div className="absolute inset-x-0 top-0 h-[55vh] bg-gradient-to-b from-[#F4F5EF]/90 via-[#F4F5EF]/55 to-transparent" />
        </div>
      )}
      {fit ? (
        // One-screen layout for exercises someone may use mid-panic: everything needed is
        // visible without scrolling. Only very short screens (under 560px) scroll.
        <div className={`relative z-10 mx-auto flex h-[100dvh] min-h-[560px] flex-col px-4 pb-4 pt-[4.75rem] sm:px-6 ${width}`}>
          <header className="flex shrink-0 items-center justify-between gap-4">
            <div className="min-w-0">
              {back}
              <h1 className="mt-1 flex flex-wrap items-baseline gap-x-3 text-3xl font-bold leading-tight text-ink-900">
                {title}
                {note && <span className="margin-note text-xl font-normal">{note}</span>}
              </h1>
              {intro && <p className="mt-1 text-sm leading-snug text-ink-700 sm:text-base">{intro}</p>}
            </div>
            <div className="hidden shrink-0 sm:block">
              <TechniqueSphere icon={icon} color={color} size={64} />
            </div>
          </header>
          <div className="mt-3 min-h-0 flex-1">{children}</div>
        </div>
      ) : (
        <div className={`relative z-10 mx-auto px-4 pb-32 pt-24 sm:px-6 ${width}`}>
          {back}
          <header className="mt-5 flex items-start justify-between gap-6">
            <div className="max-w-2xl">
              {note && <p className="margin-note text-2xl">{note}</p>}
              <h1 className="mt-1 text-4xl font-bold leading-tight text-ink-900 sm:text-5xl">{title}</h1>
              {intro && <p className="mt-4 text-lg leading-relaxed text-ink-700">{intro}</p>}
            </div>
            <div className="hidden shrink-0 sm:block">
              <TechniqueSphere icon={icon} color={color} />
            </div>
          </header>
          <div className="mt-10">{children}</div>
        </div>
      )}
    </>
  );
}

/** A sheet of paper with an optional heading, for one part of an exercise. */
export function Sheet({ title, children, ruled = false, className = '' }) {
  return (
    <section className={`paper-sheet ${ruled ? 'ruled py-8 pl-16 pr-6' : 'p-6 sm:p-8'} ${className}`}
      style={ruled ? { '--line': '32px' } : undefined}>
      {title && <h2 className={`font-bold text-ink-900 ${ruled ? 'text-2xl leading-[64px]' : 'mb-4 text-2xl'}`}>{title}</h2>}
      {children}
    </section>
  );
}
