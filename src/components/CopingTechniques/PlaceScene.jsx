/**
 * PlaceScene - a painted picture of each visualisation place, drawn in SVG so it scales
 * to any screen and needs no image files.
 *
 * `progress` (0 to 1) moves the sun across the sky as the steps go by. Gentle motion
 * (waves, drifting clouds, fireflies, swaying flowers) stops for anyone whose system asks
 * for reduced motion. Every random-looking detail is seeded, so a place looks the same
 * on every visit.
 */

const seeded = (seed) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

const W = 1600;
const H = 900;

function Sun({ progress, colour = '#FFE3A3', glow = '#FFD07A', low = 520, high = 170 }) {
  // An arc from left to right, highest in the middle.
  const x = 260 + progress * (W - 520);
  const y = low - Math.sin(Math.PI * Math.min(1, Math.max(0, progress))) * (low - high);
  return (
    <g style={{ transition: 'transform 2s ease' }} transform={`translate(${x} ${y})`}>
      <circle r="150" fill={glow} opacity="0.25" />
      <circle r="95" fill={glow} opacity="0.35" />
      <circle r="62" fill={colour} />
    </g>
  );
}

function Clouds({ seed, colour = '#FFFFFF', y = 160 }) {
  const r = seeded(seed);
  return (
    <g className="ps-drift" opacity="0.85">
      {[0, 1, 2, 3].map((i) => {
        const cx = i * 460 + r() * 200;
        const cy = y + r() * 120;
        const s = 0.7 + r() * 0.6;
        return (
          <g key={i} transform={`translate(${cx} ${cy}) scale(${s})`}>
            <ellipse cx="0" cy="0" rx="90" ry="28" fill={colour} />
            <ellipse cx="-40" cy="-14" rx="48" ry="30" fill={colour} />
            <ellipse cx="30" cy="-22" rx="56" ry="36" fill={colour} />
          </g>
        );
      })}
    </g>
  );
}

function Beach({ progress }) {
  return (
    <>
      <defs>
        <linearGradient id="ps-beach-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9FD3F0" />
          <stop offset="0.65" stopColor="#FFE1C4" />
          <stop offset="1" stopColor="#FFC9A8" />
        </linearGradient>
        <linearGradient id="ps-beach-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3E9BC7" />
          <stop offset="1" stopColor="#7FD0DE" />
        </linearGradient>
        <linearGradient id="ps-beach-sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F6E2B5" />
          <stop offset="1" stopColor="#E9C98C" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#ps-beach-sky)" />
      <Sun progress={progress} low={560} />
      <Clouds seed={3} />
      <rect y="520" width={W} height="200" fill="url(#ps-beach-sea)" />
      {[0, 1, 2].map((i) => (
        <path key={i} className={`ps-wave ps-wave-${i}`}
          d={`M0 ${560 + i * 45} ${Array.from({ length: 17 }, (_, k) => `Q ${k * 200 + 50} ${552 + i * 45} ${k * 200 + 100} ${560 + i * 45} T ${k * 200 + 200} ${560 + i * 45}`).join(' ')}`}
          fill="none" stroke="#FFFFFF" strokeOpacity={0.55 - i * 0.12} strokeWidth="5" strokeLinecap="round" />
      ))}
      <path d={`M0 700 C 400 640, 900 690, ${W} 650 L ${W} ${H} L 0 ${H} Z`} fill="url(#ps-beach-sand)" />
      <path className="ps-foam" d={`M0 700 C 400 640, 900 690, ${W} 650`} fill="none" stroke="#FFFFFF" strokeWidth="10" strokeOpacity="0.7" strokeLinecap="round" />
      {[[240, 260], [300, 240], [1200, 220]].map(([x, y], i) => (
        <path key={i} className="ps-bird" d={`M${x} ${y} q 14 -12 28 0 q 14 -12 28 0`} fill="none" stroke="#4A5A6A" strokeWidth="3" strokeLinecap="round" />
      ))}
    </>
  );
}

function Forest({ progress }) {
  const r = seeded(11);
  const layer = (count, base, height, colour, offset) => Array.from({ length: count }, (_, i) => {
    const x = (i / count) * (W + 200) - 100 + r() * 60 + offset;
    const h = height * (0.75 + r() * 0.5);
    const w = h * 0.38;
    return <path key={i} d={`M${x} ${base - h} L ${x + w} ${base} L ${x - w} ${base} Z`} fill={colour} />;
  });
  return (
    <>
      <defs>
        <linearGradient id="ps-forest-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CDE8C9" />
          <stop offset="1" stopColor="#F7EDC8" />
        </linearGradient>
        <linearGradient id="ps-forest-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6FA36F" />
          <stop offset="1" stopColor="#3F7350" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#ps-forest-sky)" />
      <Sun progress={progress} colour="#FFF2BF" glow="#FFE58A" low={420} high={140} />
      {[0, 1, 2, 3].map((i) => (
        <polygon key={i} className="ps-ray" points={`${500 + i * 180},0 ${560 + i * 180},0 ${760 + i * 220},${H} ${640 + i * 220},${H}`} fill="#FFF6CF" opacity="0.28" />
      ))}
      {layer(16, 620, 360, '#A9CBA0', 0)}
      <rect y="560" width={W} height="80" fill="#F4F1DA" opacity="0.45" className="ps-mist" />
      {layer(12, 720, 420, '#6E9F6B', 40)}
      {layer(9, 860, 520, '#3F7350', -30)}
      <rect y="820" width={W} height="80" fill="url(#ps-forest-ground)" />
      {Array.from({ length: 22 }, (_, i) => (
        <circle key={i} className="ps-firefly" style={{ animationDelay: `${(i % 7) * 0.6}s` }}
          cx={r() * W} cy={480 + r() * 340} r={3 + r() * 3} fill="#FFF3A6" />
      ))}
    </>
  );
}

function Mountain({ progress }) {
  return (
    <>
      <defs>
        <linearGradient id="ps-mountain-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B9A8F0" />
          <stop offset="0.6" stopColor="#F5C6D6" />
          <stop offset="1" stopColor="#FFDCC2" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#ps-mountain-sky)" />
      <Sun progress={progress} colour="#FFEBC2" glow="#FFC9A0" low={600} high={180} />
      <Clouds seed={7} y={230} />
      <path d={`M0 640 L 260 360 L 420 500 L 640 260 L 860 520 L 1060 330 L 1300 560 L 1460 420 L ${W} 520 L ${W} ${H} L 0 ${H} Z`} fill="#8C7FCF" opacity="0.75" />
      <path d="M640 260 L 700 330 L 670 320 L 640 345 L 610 318 L 585 330 Z" fill="#FFFFFF" opacity="0.9" />
      <path d="M1060 330 L 1110 385 L 1080 378 L 1058 398 L 1032 376 L 1012 386 Z" fill="#FFFFFF" opacity="0.9" />
      <path d={`M0 720 L 300 500 L 520 640 L 780 430 L 1040 650 L 1280 520 L ${W} 680 L ${W} ${H} L 0 ${H} Z`} fill="#5E57A6" />
      <path d="M780 430 L 830 478 L 805 474 L 780 492 L 756 472 L 735 480 Z" fill="#FFFFFF" opacity="0.85" />
      <rect y="760" width={W} height="140" fill="#F4E9F7" opacity="0.5" className="ps-mist" />
      <path d={`M0 820 C 400 780, 1000 840, ${W} 790 L ${W} ${H} L 0 ${H} Z`} fill="#3E3A78" />
    </>
  );
}

function Garden({ progress }) {
  const r = seeded(5);
  const petals = ['#F49AB5', '#F7C66B', '#B9A8F0', '#FFFFFF', '#F28C7A'];
  return (
    <>
      <defs>
        <linearGradient id="ps-garden-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A9D8F5" />
          <stop offset="1" stopColor="#EAF6E4" />
        </linearGradient>
        <radialGradient id="ps-garden-pond" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#B9E6F2" />
          <stop offset="1" stopColor="#5FA9C4" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#ps-garden-sky)" />
      <Sun progress={progress} low={500} />
      <Clouds seed={9} y={120} />
      <path d={`M0 560 C 300 480, 600 520, 900 500 C 1200 480, 1400 540, ${W} 510 L ${W} ${H} L 0 ${H} Z`} fill="#A6D49A" />
      <path d={`M0 650 C 400 590, 800 660, 1200 610 C 1400 590, 1500 620, ${W} 600 L ${W} ${H} L 0 ${H} Z`} fill="#7DBB74" />
      <ellipse cx="1180" cy="760" rx="230" ry="60" fill="url(#ps-garden-pond)" />
      <ellipse className="ps-ripple" cx="1150" cy="760" rx="60" ry="14" fill="none" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="3" />
      {Array.from({ length: 46 }, (_, i) => {
        const x = r() * W;
        const y = 640 + r() * 240;
        if (x > 920 && x < 1440 && y > 690 && y < 830) return null;
        const c = petals[Math.floor(r() * petals.length)];
        const s = 0.7 + r() * 0.6;
        return (
          <g key={i} className="ps-sway" style={{ transformOrigin: `${x}px ${y + 30}px`, animationDelay: `${(i % 5) * 0.4}s` }}>
            <line x1={x} y1={y} x2={x} y2={y + 34 * s} stroke="#4F8A4C" strokeWidth="3" />
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx={x} cy={y - 9 * s} rx={6 * s} ry={10 * s} fill={c} transform={`rotate(${a} ${x} ${y})`} />
            ))}
            <circle cx={x} cy={y} r={5 * s} fill="#F5B83D" />
          </g>
        );
      })}
      <g className="ps-butterfly">
        <ellipse cx="520" cy="430" rx="16" ry="10" fill="#B9A8F0" transform="rotate(-30 520 430)" />
        <ellipse cx="542" cy="430" rx="16" ry="10" fill="#F49AB5" transform="rotate(30 542 430)" />
        <line x1="531" y1="420" x2="531" y2="442" stroke="#3E3A78" strokeWidth="3" />
      </g>
    </>
  );
}

const SCENES = { peacefulBeach: Beach, enchantedForest: Forest, mountainRetreat: Mountain, healingGarden: Garden };

export default function PlaceScene({ place, progress = 0.2, className = '', still = false }) {
  const Scene = SCENES[place] || Garden;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={`${still ? 'ps-still' : ''} ${className}`} aria-hidden="true">
      <style>{`
        .ps-drift { animation: ps-drift 90s linear infinite; }
        .ps-wave { animation: ps-wave 9s ease-in-out infinite alternate; }
        .ps-wave-1 { animation-duration: 11s; }
        .ps-wave-2 { animation-duration: 13s; }
        .ps-foam { animation: ps-foam 7s ease-in-out infinite alternate; }
        .ps-bird { animation: ps-bird 6s ease-in-out infinite alternate; }
        .ps-ray { animation: ps-ray 8s ease-in-out infinite alternate; }
        .ps-mist { animation: ps-mist 20s ease-in-out infinite alternate; }
        .ps-firefly { animation: ps-twinkle 3.2s ease-in-out infinite; }
        .ps-sway { animation: ps-sway 5s ease-in-out infinite alternate; }
        .ps-ripple { animation: ps-ripple 6s ease-out infinite; transform-origin: 1150px 760px; }
        .ps-butterfly { animation: ps-flutter 14s ease-in-out infinite alternate; }
        @keyframes ps-drift { from { transform: translateX(-200px); } to { transform: translateX(200px); } }
        @keyframes ps-wave { from { transform: translateX(-60px); } to { transform: translateX(20px); } }
        @keyframes ps-foam { from { transform: translateY(0); } to { transform: translateY(10px); } }
        @keyframes ps-bird { from { transform: translate(0, 0); } to { transform: translate(60px, -12px); } }
        @keyframes ps-ray { from { opacity: 0.12; } to { opacity: 0.32; } }
        @keyframes ps-mist { from { transform: translateX(-40px); } to { transform: translateX(40px); } }
        @keyframes ps-twinkle { 0%, 100% { opacity: 0.15; } 50% { opacity: 1; } }
        @keyframes ps-sway { from { transform: rotate(-3deg); } to { transform: rotate(3deg); } }
        @keyframes ps-ripple { from { transform: scale(0.6); opacity: 0.8; } to { transform: scale(2.4); opacity: 0; } }
        @keyframes ps-flutter { 0% { transform: translate(0, 0); } 50% { transform: translate(260px, -60px); } 100% { transform: translate(520px, 30px); } }
        .ps-still * { animation: none !important; }
        @media (prefers-reduced-motion: reduce) { .ps-drift, .ps-wave, .ps-foam, .ps-bird, .ps-ray, .ps-mist, .ps-firefly, .ps-sway, .ps-ripple, .ps-butterfly { animation: none; } }
      `}</style>
      <Scene progress={progress} />
    </svg>
  );
}
