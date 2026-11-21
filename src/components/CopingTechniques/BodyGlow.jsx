/**
 * BodyGlow - a soft outline of a body where the part the current step is about glows
 * warm amber, so someone can see where to put their attention. Steps that are not about
 * one part (preparation, a calm place, the whole body) light the whole figure gently.
 */

const REGIONS = {
  head: ['face', 'head & scalp', 'sight', 'hearing', 'smell', 'taste'],
  neck: ['shoulders & neck', 'neck & throat'],
  shoulders: ['shoulders & neck', 'shoulders & arms'],
  arms: ['arms', 'shoulders & arms', 'touch'],
  chest: ['chest & heart'],
  belly: ['abdomen'],
  hips: ['glutes', 'hips & pelvis'],
  thighs: ['thighs', 'legs'],
  calves: ['calves', 'legs'],
  feet: ['feet'],
};

const SHAPES = {
  head: <ellipse cx="100" cy="42" rx="24" ry="28" />,
  neck: <rect x="90" y="68" width="20" height="16" rx="6" />,
  shoulders: <path d="M58 92 Q100 78 142 92 L138 108 L62 108 Z" />,
  arms: <><path d="M60 96 Q44 150 40 206 L54 208 Q62 156 74 110 Z" /><path d="M140 96 Q156 150 160 206 L146 208 Q138 156 126 110 Z" /></>,
  chest: <path d="M66 104 L134 104 L130 150 L70 150 Z" />,
  belly: <path d="M70 150 L130 150 L128 186 L72 186 Z" />,
  hips: <path d="M72 186 L128 186 L132 214 L68 214 Z" />,
  thighs: <><path d="M70 212 L98 212 L94 282 L74 282 Z" /><path d="M102 212 L130 212 L126 282 L106 282 Z" /></>,
  calves: <><path d="M74 282 L94 282 L92 346 L78 346 Z" /><path d="M106 282 L126 282 L122 346 L108 346 Z" /></>,
  feet: <><path d="M76 346 L94 346 L98 362 L68 362 Z" /><path d="M106 346 L124 346 L132 362 L102 362 Z" /></>,
};

export default function BodyGlow({ part = '', className = '' }) {
  const p = part.toLowerCase();
  const lit = Object.keys(REGIONS).filter((r) => REGIONS[r].includes(p));
  const whole = lit.length === 0;
  return (
    <svg viewBox="0 0 200 380" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="bg-warm" cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#FFE7A8" />
          <stop offset="1" stopColor="#F4B63A" />
        </radialGradient>
        <filter id="bg-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      {/* the glow, blurred behind the figure */}
      <g filter="url(#bg-blur)" fill="url(#bg-warm)" className="bodyglow-pulse" opacity={whole ? 0.45 : 0.95}>
        {(whole ? Object.keys(SHAPES) : lit).map((r) => <g key={r}>{SHAPES[r]}</g>)}
      </g>
      {/* the figure */}
      <g fill="rgba(255,255,255,0.35)" stroke="#2B2D42" strokeOpacity="0.55" strokeWidth="1.6" strokeLinejoin="round">
        {Object.keys(SHAPES).map((r) => (
          <g key={r} fill={lit.includes(r) ? 'rgba(255,231,168,0.75)' : undefined}>{SHAPES[r]}</g>
        ))}
      </g>
      <style>{`
        .bodyglow-pulse { animation: bodyglow 4.5s ease-in-out infinite; transform-origin: 100px 190px; }
        @keyframes bodyglow { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .bodyglow-pulse { animation: none; } }
      `}</style>
    </svg>
  );
}
