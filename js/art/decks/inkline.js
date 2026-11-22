/* 52 Cards — Ink Line deck. Outline-only pips and line-drawn royals:
 * a crowned profile for kings, a tiara for queens, a cap for jacks. */
(function (root) {
  'use strict';
  const Art = root.C52.Art;

  // Line drawings, centred on the card, stroked in the suit's ink: a profile facing left,
  // the back of the head and shoulders, then the rank's headwear.
  const FACE = 'M118 192Q104 200 100 214L94 223Q92 229 99 231L104 232L103 241Q103 249 112 248L121 247';
  const HEAD = 'M118 192Q150 186 152 216Q153 238 142 254';
  const SHOULDERS = 'M110 266Q126 256 152 260Q176 266 184 292M110 266Q92 274 84 292';
  const DRAW = {
    K: 'M102 180L98 150L116 165L127 142L138 165L156 150L152 180ZM102 186H152' + FACE + HEAD + SHOULDERS + 'M104 241Q112 268 136 262',
    Q: 'M108 184L110 164L120 174L128 156L136 174L146 164L148 184Z' + FACE + HEAD + SHOULDERS + 'M150 204Q176 236 164 290',
    J: 'M98 194Q102 162 128 160Q154 162 158 194Q128 184 98 194ZM150 168Q166 136 186 142Q172 152 160 176' + FACE + HEAD + SHOULDERS,
  };

  Art.registerDeck('inkline', {
    name: 'Ink Line',
    back: 'monogram',
    paper: '#FFFFFF',
    edge: '#222',
    edgeWidth: 4,
    radius: 18,
    outline: 2.6, // pips drawn as outlines, 2.6 units wide
    indexFont: "'Jost', 'Futura', sans-serif",
    indexWeight: 500,
    pipSize: 44,
    court: (code, ink, a) =>
      `<path d="${DRAW[code[0]]}" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` +
      a.deckPip({ outline: 2.6, paper: '#FFFFFF' }, code[1], 186, 74, 30, ink, false),
    ace: (code, ink, a) => a.deckPip({ outline: 4, paper: '#FFFFFF' }, code[1], 125, 175, 110, ink, false),
  });
})(typeof window !== 'undefined' ? window : globalThis);
