/* 52 Cards — shared SVG card geometry.
 *
 * Every card is a 250 × 350 viewBox (poker ratio 5:7). Decks register a
 * style object and this module handles the parts every deck shares: suit
 * shapes, pip layouts, corner indices, the card outline and the backs.
 *
 *   C52.Art.registerDeck(id, deck)
 *   C52.Art.card(code, opts)      -> '<svg …>' string (face up or down)
 *   C52.Art.defs()                -> hidden <svg> holding shared patterns,
 *                                    inserted once per page by the UI
 */
(function (root) {
  'use strict';
  const C52 = (root.C52 = root.C52 || {});

  const W = 250;
  const H = 350;
  const CX = W / 2;
  const CY = H / 2;

  /* ---------- suit shapes, drawn in a 100 × 100 box ---------- */

  const circle = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

  const SUIT_PATH = {
    H: 'M50 90C24 70 4 52 6 31C8 12 30 4 43 16C47 20 49 24 50 28C51 24 53 20 57 16C70 4 92 12 94 31C96 52 76 70 50 90Z',
    D: 'M50 4Q66 28 86 50Q66 72 50 96Q34 72 14 50Q34 28 50 4Z',
    S: 'M50 4C42 22 8 38 8 62C8 80 30 86 45 72C44 82 39 90 31 96L69 96C61 90 56 82 55 72C70 86 92 80 92 62C92 38 58 22 50 4Z',
    C:
      circle(50, 27, 19) + circle(27, 58, 19) + circle(73, 58, 19) +
      'M40 40L38 62L62 62L60 40Z' + // same winding as the circles, or it punches a hole

      'M46 58C46 76 41 88 31 96L69 96C59 88 54 76 54 58Z',
  };

  /** A suit pip centred at (x, y), `size` wide, optionally upside down. */
  function pip(suit, x, y, size, fill, flip, extra) {
    const s = size / 100;
    const rot = flip ? ` rotate(180 50 50)` : '';
    return `<path d="${SUIT_PATH[suit]}" fill="${fill}" transform="translate(${x - size / 2} ${y - size / 2}) scale(${s})${rot}"${extra || ''}/>`;
  }

  /** A pip in a deck's own style: filled, or outlined when deck.outline is set (its stroke width). */
  function deckPip(deck, suit, x, y, size, ink, flip) {
    if (deck && deck.outline) {
      // A thick inked shape with the paper colour laid over it: only the outer edge shows,
      // so overlapping parts (the club's circles) don't leave lines inside.
      const sw = ((deck.outline * 100) / size) * 2;
      return (
        pip(suit, x, y, size, ink, flip, ` stroke="${ink}" stroke-width="${sw.toFixed(2)}" stroke-linejoin="round"`) +
        pip(suit, x, y, size, deck.paper || '#FFFFFF', flip)
      );
    }
    return pip(suit, x, y, size, ink, flip);
  }

  /* ---------- pip layouts for 2–10 ---------- */

  const L = 80;
  const R = 170;
  const T = 76;
  const B = 274;
  const PIPS = {
    2: [[CX, T], [CX, B]],
    3: [[CX, T], [CX, CY], [CX, B]],
    4: [[L, T], [R, T], [L, B], [R, B]],
    5: [[L, T], [R, T], [CX, CY], [L, B], [R, B]],
    6: [[L, T], [R, T], [L, CY], [R, CY], [L, B], [R, B]],
    7: [[L, T], [R, T], [CX, 125], [L, CY], [R, CY], [L, B], [R, B]],
    8: [[L, T], [R, T], [CX, 125], [L, CY], [R, CY], [CX, 225], [L, B], [R, B]],
    9: [[L, T], [R, T], [L, 142], [R, 142], [CX, CY], [L, 208], [R, 208], [L, B], [R, B]],
    10: [[L, T], [R, T], [CX, 109], [L, 142], [R, 142], [L, 208], [R, 208], [CX, 241], [L, B], [R, B]],
  };

  const rankNumber = (r) => (r === 'T' ? 10 : Number(r));

  /** All pips for a numbered card. Pips below the middle are drawn upside down. */
  function pipLayout(code, fill, size, deck) {
    const n = rankNumber(code[0]);
    const spots = (deck && deck.layout && deck.layout(n)) || PIPS[n].map(([x, y]) => [x, y, y > CY + 1 ? 180 : 0]);
    return spots
      .map(([x, y, rot]) => {
        if (!rot || rot === 180) return deckPip(deck, code[1], x, y, size, fill, rot === 180);
        return `<g transform="rotate(${rot} ${x} ${y})">${deckPip(deck, code[1], x, y, size, fill, false)}</g>`;
      })
      .join('');
  }

  /* ---------- colours ---------- */

  const TWO_COLOUR = { S: '#141414', C: '#141414', H: '#C8102E', D: '#C8102E' };
  const FOUR_COLOUR = { S: '#141414', C: '#1B7A3A', H: '#C8102E', D: '#1F5FAE' };

  /* ---------- corner index ---------- */

  const RANK_TEXT = { A: 'A', T: '10', J: 'J', Q: 'Q', K: 'K' };

  function cornerIndex(code, fill, deck, large) {
    const f = deck.indexFont || "Georgia, 'Times New Roman', serif";
    const weight = deck.indexWeight || 700;
    const rank = RANK_TEXT[code[0]] || code[0];
    const k = large ? 1.35 : 1;
    const fs = (rank === '10' ? 36 : 42) * k;
    const one = (rank === '10' ? `letter-spacing="-3"` : '');
    const corner =
      `<text x="${26 * k}" y="${50 * k}" text-anchor="middle" font-family="${f}" font-weight="${weight}" ` +
      `font-size="${fs}" fill="${fill}" ${one}${deck.indexStyle ? ' font-style="' + deck.indexStyle + '"' : ''}>${rank}</text>` +
      deckPip(deck, code[1], 26 * k, 72 * k, 24 * k, fill, false);
    return corner + `<g transform="rotate(180 ${CX} ${CY})">${corner}</g>`;
  }

  /* ---------- outline ---------- */

  function frame(inner, deck, title) {
    const rx = deck.radius == null ? 14 : deck.radius;
    const stroke = deck.edge || '#bdb6a6';
    const ew = deck.edgeWidth || 2;
    const half = ew / 2;
    return (
      `<svg class="c52-card" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}">` +
      `<rect x="${half}" y="${half}" width="${W - ew}" height="${H - ew}" rx="${rx}" fill="${deck.paper || '#FFFFFF'}" stroke="${stroke}" stroke-width="${ew}"/>` +
      (deck.decor ? deck.decor() : '') +
      inner +
      `</svg>`
    );
  }

  /* ---------- backs ---------- */

  const BACKS = {};

  /** Register a back. `def` = pattern/gradient markup for defs(); `draw` = inner markup. */
  function registerBack(id, back) {
    BACKS[id] = back;
  }

  function backSvg(backId, deck) {
    const b = BACKS[backId] || BACKS['lattice-red'];
    const rx = deck && deck.radius != null ? deck.radius : 14;
    return (
      `<svg class="c52-card c52-back" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="card face down">` +
      `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${rx}" fill="${b.border || '#FFFFFF'}" stroke="${b.edge || '#bdb6a6'}" stroke-width="2"/>` +
      b.draw(rx) +
      `</svg>`
    );
  }

  function defs() {
    const parts = Object.values(BACKS)
      .map((b) => b.def || '')
      .join('');
    return `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${parts}</defs></svg>`;
  }

  /* ---------- decks ---------- */

  const DECKS = {};

  function registerDeck(id, deck) {
    deck.id = id;
    DECKS[id] = deck;
  }

  /**
   * Render a card.
   *   opts.deck       deck id (default 'classic')
   *   opts.faceDown   draw the back
   *   opts.back       back id (default: the deck's suggested back)
   *   opts.fourColour four-colour suits
   *   opts.largeIndex bigger corner indices
   */
  function card(code, opts) {
    const o = opts || {};
    const deck = DECKS[o.deck] || DECKS.classic;
    if (o.faceDown || !code) return backSvg(o.back || deck.back || 'lattice-red', deck);
    const palette = Object.assign({}, o.fourColour ? FOUR_COLOUR : TWO_COLOUR, deck.ink || {});
    if (o.fourColour) Object.assign(palette, deck.fourInk || {});
    const fill = palette[code[1]];
    const r = code[0];
    let body;
    if (r === 'A') body = deck.ace ? deck.ace(code, fill, api) : deckPip(deck, code[1], CX, CY, 96, fill, false);
    else if (r === 'J' || r === 'Q' || r === 'K') body = deck.court(code, fill, api);
    else body = deck.pips ? deck.pips(code, fill, api) : pipLayout(code, fill, deck.pipSize || 46, deck);
    const title = C52.Cards ? C52.Cards.name(code) : code;
    return frame(body + cornerIndex(code, fill, deck, o.largeIndex), deck, title);
  }

  const api = { W, H, CX, CY, SUIT_PATH, pip, pipLayout, deckPip, PIPS, circle };

  C52.Art = {
    W, H, SUIT_PATH, TWO_COLOUR, FOUR_COLOUR,
    pip, pipLayout, deckPip, registerDeck, registerBack, card, defs,
    decks: () => Object.values(DECKS),
    backs: () => Object.keys(BACKS).map((id) => ({ id, name: BACKS[id].name })),
    deck: (id) => DECKS[id],
  };
})(typeof window !== 'undefined' ? window : globalThis);
