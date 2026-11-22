/* 52 Cards — Silhouette deck. Solid black cards with white indices and
 * pips; the royals are bold white emblems. Stark and graphic. */
(function (root) {
  'use strict';
  const Art = root.C52.Art;
  const WHITE = '#F4F4F4';

  const EMBLEM = {
    // A five-pointed crown.
    K: `<path d="M70 210L64 130L96 168L125 112L154 168L186 130L180 210Z" fill="${WHITE}"/><rect x="70" y="218" width="110" height="18" rx="3" fill="${WHITE}"/>` +
      [64, 125, 186].map((x, i) => `<circle cx="${x}" cy="${[128, 108, 128][i]}" r="8" fill="${WHITE}"/>`).join(''),
    // A tiara with a jewel.
    Q: `<path d="M74 206Q76 150 98 140L108 164L125 126L142 164L152 140Q174 150 176 206Z" fill="${WHITE}"/><rect x="74" y="212" width="102" height="14" rx="3" fill="${WHITE}"/><circle cx="125" cy="116" r="10" fill="${WHITE}"/>`,
    // A feathered cap.
    J: `<path d="M70 214Q74 150 125 144Q176 150 180 214Q125 196 70 214Z" fill="${WHITE}"/><path d="M152 150Q176 96 206 104Q182 118 166 162Z" fill="${WHITE}"/><rect x="72" y="218" width="106" height="14" rx="3" fill="${WHITE}"/>`,
  };

  Art.registerDeck('silhouette', {
    name: 'Silhouette',
    back: 'noir',
    paper: '#121212',
    edge: '#000',
    ink: { S: WHITE, H: WHITE, D: WHITE, C: WHITE },
    fourInk: { S: WHITE, C: '#8FE0A8', H: '#FF8077', D: '#86B8FF' },
    indexFont: "'Jost', 'Futura', sans-serif",
    indexWeight: 600,
    pipSize: 46,
    court: (code, ink, a) => EMBLEM[code[0]] + a.pip(code[1], 125, 270, 30, ink),
  });
})(typeof window !== 'undefined' ? window : globalThis);
