// Crayon helpers for the mockups: a texture filter and scribble fills.
// Everything is drawn into existing <svg data-crayon> elements; seeded, so it looks the same each load.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  // One shared filter: wobble the edges, then eat holes in the stroke like wax on paper.
  const defs = document.createElementNS(NS, 'svg');
  defs.setAttribute('width', 0); defs.setAttribute('height', 0); defs.setAttribute('aria-hidden', 'true');
  defs.style.position = 'absolute';
  defs.innerHTML = `
    <filter id="crayon" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="warp"/>
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="5" result="wobbly"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="9" result="grain"/>
      <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.75" result="holes"/>
      <feComposite in="wobbly" in2="holes" operator="in"/>
    </filter>`;
  document.body.prepend(defs);

  // Zigzag strokes across an ellipse, like colouring in.
  window.scribble = function (svg, { cx, cy, rx, ry, color, gap = 9, width = 7, angle = -30, opacity = .9 }) {
    const id = 'c' + Math.floor(rand() * 1e9);
    const clip = document.createElementNS(NS, 'clipPath');
    clip.id = id;
    clip.innerHTML = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
    svg.appendChild(clip);
    const r = Math.max(rx, ry) * 1.5;
    let d = `M ${cx - r} ${cy - r}`;
    for (let y = -r, flip = 0; y < r; y += gap, flip ^= 1) {
      d += ` L ${cx + (flip ? -r : r) + (rand() - .5) * 20} ${cy + y + (rand() - .5) * 4}`;
    }
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', color);
    p.setAttribute('stroke-width', width);
    p.setAttribute('stroke-linejoin', 'round');
    p.setAttribute('opacity', opacity);
    p.setAttribute('transform', `rotate(${angle} ${cx} ${cy})`);
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('clip-path', `url(#${id})`);
    g.setAttribute('filter', 'url(#crayon)');
    g.appendChild(p);
    svg.appendChild(g);
  };

  // A wobbly hand-drawn line, optionally closed.
  window.crayonLine = function (svg, points, { color, width = 6, closed = false } = {}) {
    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      const [x, y] = points[i];
      const [px, py] = points[i - 1];
      d += ` Q ${(x + px) / 2 + (rand() - .5) * 6} ${(y + py) / 2 + (rand() - .5) * 6} ${x} ${y}`;
    }
    if (closed) d += ' Z';
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', color);
    p.setAttribute('stroke-width', width);
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    p.setAttribute('filter', 'url(#crayon)');
    svg.appendChild(p);
  };

  // Points around an ellipse, slightly uneven, as a hand would draw it.
  window.loop = function (cx, cy, rx, ry, n = 18, turns = 1.08) {
    const pts = [];
    for (let i = 0; i <= n * turns; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const k = 1 + (rand() - .5) * .08;
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return pts;
  };
})();
