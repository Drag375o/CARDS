/* 52 Cards — Pastel deck. Peach faces with a thick white die-cut border,
 * dusty rose and graphite pips, soft flat royals. */
(function (root) {
  'use strict';
  const Art = root.C52.Art;
  const ROSE = '#B86F6A';
  const GRAPHITE = '#5E5E60';
  const MAUVE = '#876B6C';
  const PEACH = '#F3DFD2';

  function court(code, ink, a) {
    const r = code[0];
    let g = `<rect x="56" y="70" width="138" height="210" rx="22" fill="${MAUVE}"/>`;
    g += `<rect x="56" y="70" width="138" height="24" rx="12" fill="#76585A"/>`;
    // A soft head-and-shoulders figure.
    g += `<path d="M76 280Q80 214 125 204Q170 214 174 280Z" fill="#EEC9B4"/>`;
    g += `<circle cx="125" cy="168" r="30" fill="${PEACH}"/>`;
    if (r === 'K') g += `<path d="M97 140L99 116L112 128L125 110L138 128L151 116L153 140Z" fill="#F0D9A0"/>`;
    else if (r === 'Q') g += `<path d="M95 172Q92 132 125 128Q158 132 155 172Q150 146 125 144Q100 146 95 172Z" fill="#E9C7B1"/><circle cx="125" cy="124" r="6" fill="#F0D9A0"/>`;
    else g += `<path d="M95 152Q98 126 125 124Q152 126 155 152Q125 142 95 152Z" fill="${GRAPHITE}"/>`;
    g += a.pip(code[1], 125, 246, 30, ink);
    return g;
  }

  Art.registerDeck('pastel', {
    name: 'Pastel',
    back: 'mauve',
    paper: PEACH,
    edge: '#FFFFFF',
    edgeWidth: 14,
    radius: 26,
    ink: { H: ROSE, D: ROSE, S: GRAPHITE, C: GRAPHITE },
    indexFont: "'Jost', 'Futura', sans-serif",
    indexWeight: 600,
    pipSize: 42,
    decor: () => `<rect x="7.5" y="7.5" width="235" height="335" rx="21" fill="none" stroke="#D9CFC8" stroke-width="1"/>`,
    court,
    ace: (code, ink, a) => `<circle cx="125" cy="175" r="62" fill="#EBCBB9"/>` + a.pip(code[1], 125, 175, 80, ink),
  });
})(typeof window !== 'undefined' ? window : globalThis);
