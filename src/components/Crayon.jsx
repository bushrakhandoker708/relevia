/**
 * Crayon.jsx - crayon drawings and pencil texture for the paper theme.
 *
 * Drawings are plain SVG: zigzag "colouring in" clipped to a shape, and slightly wobbly
 * lines, both passed through a filter that roughens the edge and leaves gaps like wax on
 * paper. Every random choice is seeded, so a drawing looks the same on every visit.
 * Crayon is used for pictures and accents only, never for text people need to read.
 */
import { useId, useMemo } from 'react';

function rng(seed) {
  let s = (seed % 2147483646) + 1;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

/** Filters used across the site. Render once, near the root. */
export function CrayonDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
      <filter id="crayon" filterUnits="userSpaceOnUse" x="-200" y="-200" width="1200" height="800">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="warp" />
        <feDisplacementMap in="SourceGraphic" in2="warp" scale="3" result="wobbly" />
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="9" result="grain" />
        <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.5" result="holes" />
        <feComposite in="wobbly" in2="holes" operator="in" />
      </filter>
      {/* Pencil: a lighter grain, so handwriting looks like graphite but stays readable */}
      <filter id="pencil-grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="2" result="g" />
        <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.3" result="m" />
        <feComposite in="SourceGraphic" in2="m" operator="in" />
      </filter>
    </svg>
  );
}

/** Colouring-in strokes across an ellipse. */
export function Scribble({ cx, cy, rx, ry, color, gap = 9, width = 7, angle = -30, opacity = 0.9, seed = 1 }) {
  const id = useId().replace(/:/g, '');
  const d = useMemo(() => {
    const r = rng(seed);
    const R = Math.max(rx, ry) * 1.5;
    let path = `M ${cx - R} ${cy - R}`;
    for (let y = -R, flip = 0; y < R; y += gap, flip ^= 1) {
      path += ` L ${(cx + (flip ? -R : R) + (r() - 0.5) * 20).toFixed(1)} ${(cy + y + (r() - 0.5) * 4).toFixed(1)}`;
    }
    return path;
  }, [cx, cy, rx, ry, gap, seed]);
  return (
    <g>
      <clipPath id={id}><ellipse cx={cx} cy={cy} rx={rx} ry={ry} /></clipPath>
      <g clipPath={`url(#${id})`} filter="url(#crayon)">
        <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinejoin="round" opacity={opacity}
          transform={`rotate(${angle} ${cx} ${cy})`} />
      </g>
    </g>
  );
}

/** A hand-drawn line through the points. */
export function CrayonLine({ points, color, width = 6, closed = false, seed = 3 }) {
  const d = useMemo(() => {
    const r = rng(seed);
    let path = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      const [x, y] = points[i];
      const [px, py] = points[i - 1];
      path += ` Q ${((x + px) / 2 + (r() - 0.5) * 6).toFixed(1)} ${((y + py) / 2 + (r() - 0.5) * 6).toFixed(1)} ${x} ${y}`;
    }
    return closed ? `${path} Z` : path;
  }, [points, closed, seed]);
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" filter="url(#crayon)" />;
}

/** Points around an ellipse, a little uneven, overlapping at the end as a hand would. */
function loopPoints(cx, cy, rx, ry, n = 18, turns = 1.08, seed = 5) {
  const r = rng(seed);
  const pts = [];
  for (let i = 0; i <= n * turns; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const k = 1 + (r() - 0.5) * 0.08;
    pts.push([+(cx + Math.cos(a) * rx * k).toFixed(1), +(cy + Math.sin(a) * ry * k).toFixed(1)]);
  }
  return pts;
}

const HEART = [[17, 29], [5, 17], [6, 9], [12, 6], [17, 11], [22, 6], [28, 9], [29, 17], [17, 29]];

/** The Relevia mark: a small coloured-in heart. */
export function CrayonHeart({ size = 34, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true" className={className}>
      <Scribble cx={17} cy={18} rx={12} ry={11} color="#E2647F" gap={3} width={2.6} seed={11} />
      <CrayonLine points={HEART} color="#B8405C" width={2} seed={12} />
    </svg>
  );
}

/** Two people on a bench under a tree, sun out. Used on the home page. */
export function CrayonScene({ className = '' }) {
  const rays = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2;
    return [[+(520 + Math.cos(a) * 56).toFixed(1), +(70 + Math.sin(a) * 56).toFixed(1)], [+(520 + Math.cos(a) * 80).toFixed(1), +(70 + Math.sin(a) * 80).toFixed(1)]];
  });
  return (
    <svg viewBox="0 0 620 330" className={className} role="img"
      aria-label="A crayon drawing of two people sitting together on a bench under a tree, with the sun out">
      <Scribble cx={520} cy={70} rx={42} ry={42} color="#F4B63A" gap={7} width={6} seed={21} />
      {rays.map((p, i) => <CrayonLine key={i} points={p} color="#F4B63A" width={6} seed={30 + i} />)}
      <Scribble cx={300} cy={360} rx={360} ry={90} color="#4E9E6A" gap={10} width={8} angle={-12} opacity={0.75} seed={22} />
      <CrayonLine points={[[150, 290], [156, 220], [150, 170]]} color="#8A5A3B" width={14} seed={23} />
      <Scribble cx={150} cy={130} rx={78} ry={62} color="#4E9E6A" gap={8} width={7} seed={24} />
      <Scribble cx={120} cy={150} rx={40} ry={30} color="#2F7D50" gap={8} width={6} angle={20} opacity={0.7} seed={25} />
      <CrayonLine points={[[250, 262], [390, 262]]} color="#8A5A3B" width={8} seed={26} />
      <CrayonLine points={[[262, 262], [262, 292]]} color="#8A5A3B" width={6} seed={27} />
      <CrayonLine points={[[378, 262], [378, 292]]} color="#8A5A3B" width={6} seed={28} />
      <CrayonLine points={loopPoints(290, 196, 15, 15, 18, 1.08, 40)} color="#2B2D42" width={4} seed={41} />
      <CrayonLine points={[[290, 212], [292, 258]]} color="#3E6FD8" width={24} seed={42} />
      <CrayonLine points={[[292, 258], [312, 260], [314, 288]]} color="#2B2D42" width={5} seed={43} />
      <CrayonLine points={loopPoints(346, 192, 15, 15, 18, 1.08, 44)} color="#2B2D42" width={4} seed={45} />
      <CrayonLine points={[[346, 208], [344, 258]]} color="#E2647F" width={24} seed={46} />
      <CrayonLine points={[[344, 258], [364, 260], [366, 288]]} color="#2B2D42" width={5} seed={47} />
      <CrayonLine points={[[300, 228], [334, 232]]} color="#2B2D42" width={4} seed={48} />
      <CrayonLine points={[[430, 140], [442, 132], [452, 140], [462, 132], [474, 140]]} color="#2B2D42" width={3} seed={49} />
      <Scribble cx={360} cy={60} rx={60} ry={18} color="#C9D4F5" gap={6} width={5} angle={0} seed={50} />
    </svg>
  );
}

const ICON_COLOURS = { lilac: '#9B8CE0', sun: '#F4B63A', leaf: '#4E9E6A', rose: '#E2647F', blue: '#3E6FD8', sage: '#7F9F85' };
const INK = '#2B2D42';

/** Small crayon icons: a coloured patch with a simple line drawing on top. */
export function CrayonIcon({ kind, color = 'lilac', size = 56, seed = 1 }) {
  const c = ICON_COLOURS[color] || color;
  const L = (points, w = 3, s = 0) => <CrayonLine key={s} points={points} color={INK} width={w} seed={seed * 10 + s} />;
  const drawings = {
    breathing: [L(loopPoints(32, 32, 16, 16, 16, 1.05, seed), 3, 1), L(loopPoints(32, 32, 7, 7, 10, 1.05, seed + 1), 3, 2)],
    grounding: [L([[12, 32], [22, 24], [32, 22], [42, 24], [52, 32], [42, 40], [32, 42], [22, 40], [12, 32]], 3, 1), L(loopPoints(32, 32, 6, 6, 10, 1.05, seed), 3, 2)],
    relaxation: [[18, 26], [26, 18], [34, 14], [42, 20], [50, 28]].map(([x, t], i) => L([[x, 46], [x, t]], 3, i + 1)),
    visualization: [L([[10, 46], [24, 30], [32, 38], [40, 28], [54, 46]], 3, 1), L(loopPoints(44, 18, 5, 5, 10, 1.05, seed), 3, 2)],
    journaling: [L([[20, 14], [44, 14], [44, 50], [20, 50], [20, 14]], 3, 1), ...[22, 30, 38].map((y, i) => L([[26, y], [38, y]], 2.5, i + 2))],
    activity: [L(loopPoints(36, 14, 4, 4, 8, 1.05, seed), 3, 1), L([[35, 19], [30, 34], [36, 40], [33, 52]], 3, 2), L([[30, 34], [22, 38]], 3, 3), L([[32, 24], [42, 28]], 3, 4)],
    affirmations: [L(HEART.map(([x, y]) => [x * 1.3 + 10, y * 1.3 + 8]), 3, 1)],
    mindfulness: [L([[8, 32], [20, 22], [32, 20], [44, 22], [56, 32], [44, 42], [32, 44], [20, 42], [8, 32]], 3, 1), L(loopPoints(32, 32, 7, 7, 10, 1.05, seed), 3, 2)],
    info: [L(loopPoints(32, 32, 18, 18, 18, 1.05, seed), 3, 1), L([[32, 28], [32, 44]], 3.5, 2), L([[32, 20], [32, 21]], 4, 3)],
    pill: [L([[18, 40], [36, 22], [46, 32], [28, 50], [18, 40]], 3, 1), L([[27, 31], [37, 41]], 3, 2)],
    letter: [L([[12, 20], [52, 20], [52, 46], [12, 46], [12, 20]], 3, 1), L([[12, 20], [32, 36], [52, 20]], 3, 2)],
  };
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <Scribble cx={32} cy={32} rx={27} ry={27} color={c} gap={5} width={4} opacity={0.55} seed={seed} />
      {drawings[kind] || drawings.info}
    </svg>
  );
}
