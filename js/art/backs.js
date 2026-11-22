/* 52 Cards — card back designs. Patterns live in Art.defs(), which the UI
 * inserts once per page; each back's draw() references them by id. */
(function (root) {
  'use strict';
  const Art = root.C52.Art;

  // Inset panel inside the white border, matching the card's corner radius.
  const panel = (rx, fill, stroke) =>
    `<rect x="14" y="14" width="222" height="322" rx="${Math.max(rx - 6, 4)}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="2"` : ''}/>`;

  function lattice(id, ink, name) {
    return {
      name,
      def:
        `<pattern id="c52-pat-${id}" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
        `<rect width="18" height="18" fill="${ink}"/>` +
        `<rect x="0" y="7" width="18" height="4" fill="#fff" opacity=".85"/>` +
        `<rect x="7" y="0" width="4" height="18" fill="#fff" opacity=".85"/>` +
        `<rect x="0" y="8.5" width="18" height="1" fill="${ink}" opacity=".6"/>` +
        `<rect x="8.5" y="0" width="1" height="18" fill="${ink}" opacity=".6"/>` +
        `</pattern>`,
      draw: (rx) => panel(rx, `url(#c52-pat-${id})`, ink),
    };
  }

  Art.registerBack('lattice-red', lattice('lattice-red', '#B3242C', 'Red lattice'));
  Art.registerBack('lattice-blue', lattice('lattice-blue', '#1F3F7A', 'Blue lattice'));

  // Engraved guilloché: interlaced rose curves, like the border of a banknote.
  function rosette(cx, cy, r, petals, turns, phase) {
    let d = '';
    const steps = 720;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2 * turns;
      const rr = r * (0.72 + 0.28 * Math.cos(petals * t / turns + phase));
      const x = cx + rr * Math.cos(t);
      const y = cy + rr * Math.sin(t);
      d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    return d + 'Z';
  }
  const rosettes = [0, 0.5, 1, 1.5, 2, 2.5]
    .map((ph) => `<path d="${rosette(125, 175, 82, 12, 1, ph)}" fill="none" stroke="#1E5A53" stroke-width=".9"/>`)
    .join('');
  Art.registerBack('guilloche', {
    name: 'Engraved guilloché',
    border: '#F4F8E6',
    edge: '#9fb38f',
    def:
      `<pattern id="c52-pat-guilloche" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
      `<rect width="14" height="14" fill="#DFECB7"/>` +
      `<path d="M0 7h14M7 0v14" stroke="#1E5A53" stroke-width=".7" opacity=".55"/>` +
      `<circle cx="7" cy="7" r="2" fill="none" stroke="#1E5A53" stroke-width=".7"/>` +
      `</pattern>`,
    draw: (rx) =>
      panel(rx, 'url(#c52-pat-guilloche)', '#1E5A53') +
      `<rect x="22" y="22" width="206" height="306" rx="${Math.max(rx - 9, 3)}" fill="none" stroke="#1E5A53" stroke-width="1"/>` +
      `<circle cx="125" cy="175" r="92" fill="#DFECB7"/>` +
      rosettes +
      `<circle cx="125" cy="175" r="34" fill="#DFECB7" stroke="#1E5A53" stroke-width="1.5"/>` +
      `<text x="125" y="188" text-anchor="middle" font-family="Georgia, serif" font-size="34" font-style="italic" fill="#1E5A53">52</text>`,
  });

  // Monogram: midnight panel, fine gold rules, a small crest.
  Art.registerBack('monogram', {
    name: 'Monogram',
    border: '#F7F2E7',
    draw: (rx) =>
      panel(rx, '#141B2D', '#141B2D') +
      `<rect x="24" y="24" width="202" height="302" rx="${Math.max(rx - 10, 3)}" fill="none" stroke="#C9A55A" stroke-width="1.2"/>` +
      `<rect x="30" y="30" width="190" height="290" rx="${Math.max(rx - 12, 2)}" fill="none" stroke="#C9A55A" stroke-width=".6"/>` +
      `<path d="M125 120L170 175L125 230L80 175Z" fill="none" stroke="#C9A55A" stroke-width="1.2"/>` +
      `<path d="M125 132L160 175L125 218L90 175Z" fill="none" stroke="#C9A55A" stroke-width=".6"/>` +
      `<text x="125" y="187" text-anchor="middle" font-family="Georgia, serif" font-size="30" letter-spacing="2" fill="#C9A55A">52</text>` +
      [60, 290].map((y) => `<path d="M95 ${y}h60" stroke="#C9A55A" stroke-width=".8"/><circle cx="125" cy="${y}" r="3" fill="#C9A55A"/>`).join(''),
  });
})(typeof window !== 'undefined' ? window : globalThis);
