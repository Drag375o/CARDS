/* 52 Cards — card model, decks, shuffling and card-location auditing.
 *
 * A card is a two-character code: rank then suit.
 *   ranks  A 2 3 4 5 6 7 8 9 T J Q K
 *   suits  S H D C
 * e.g. "TH" = ten of hearts, "QS" = queen of spades.
 *
 * Games never compare raw codes for strength. Each game passes its own
 * rank order string (e.g. "23456789TJQKA" or "3456789TJQKA2") to rankIndex().
 */
(function (root) {
  'use strict';
  const C52 = (root.C52 = root.C52 || {});

  const RANKS = 'A23456789TJQK';
  const SUITS = 'SHDC';

  const SUIT_SYMBOL = { S: '♠', H: '♥', D: '♦', C: '♣' };
  const SUIT_NAME = { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' };
  const RANK_LABEL = { A: 'A', T: '10', J: 'J', Q: 'Q', K: 'K' };
  const RANK_NAME = {
    A: 'ace', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven',
    8: 'eight', 9: 'nine', T: 'ten', J: 'jack', Q: 'queen', K: 'king',
  };

  const rankOf = (c) => c[0];
  const suitOf = (c) => c[1];
  const isRed = (c) => c[1] === 'H' || c[1] === 'D';
  const isFace = (c) => c[0] === 'J' || c[0] === 'Q' || c[0] === 'K';
  const isValid = (c) =>
    typeof c === 'string' && c.length === 2 && RANKS.includes(c[0]) && SUITS.includes(c[1]);

  /** "10♥" */
  const label = (c) => (RANK_LABEL[c[0]] || c[0]) + SUIT_SYMBOL[c[1]];
  /** "ten of hearts" */
  const name = (c) => RANK_NAME[c[0]] + ' of ' + SUIT_NAME[c[1]];

  /** Position of a card's rank in a game-specific order (higher = stronger). */
  const rankIndex = (c, order) => order.indexOf(c[0]);

  /** Pip value with Ace = 1, faces = 10 (Rummy, Crazy Eights, Blackjack base). */
  const pipValue = (c) => {
    const r = c[0];
    if (r === 'A') return 1;
    if (r === 'T' || r === 'J' || r === 'Q' || r === 'K') return 10;
    return Number(r);
  };

  /** Fresh ordered 52-card deck. opts.exclude: array of codes to leave out. */
  function makeDeck(opts) {
    const exclude = new Set((opts && opts.exclude) || []);
    const deck = [];
    for (const s of SUITS) for (const r of RANKS) {
      const c = r + s;
      if (!exclude.has(c)) deck.push(c);
    }
    return deck;
  }

  /* ---------- random numbers ---------- */

  /** Uniform float in [0,1) from the Web Crypto API (falls back to Math.random). */
  function secureRng() {
    const cr = root.crypto || (typeof globalThis !== 'undefined' && globalThis.crypto);
    if (cr && cr.getRandomValues) {
      const buf = new Uint32Array(1);
      return () => {
        cr.getRandomValues(buf);
        return buf[0] / 4294967296;
      };
    }
    return Math.random;
  }

  /** Deterministic generator (mulberry32) for tests and replays. */
  function seededRng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** In-place Fisher–Yates shuffle. Returns the same array. */
  function shuffle(arr, rng) {
    const rand = rng || secureRng();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  /** Remove and return n cards from the end (top) of a pile. */
  function draw(pile, n) {
    if (n > pile.length) throw new Error('Not enough cards: wanted ' + n + ', pile has ' + pile.length);
    return pile.splice(pile.length - n, n);
  }

  /** Deal n cards to each of `count` hands, one at a time, from the top. */
  function deal(pile, count, n) {
    const hands = Array.from({ length: count }, () => []);
    for (let k = 0; k < n; k++) for (let h = 0; h < count; h++) hands[h].push(draw(pile, 1)[0]);
    return hands;
  }

  /** Remove a specific card from a pile. Throws if it isn't there. */
  function take(pile, card) {
    const i = pile.indexOf(card);
    if (i < 0) throw new Error('Card ' + card + ' is not in that pile');
    pile.splice(i, 1);
    return card;
  }

  /** Sort for display: by suit (order given) then rank (order given). */
  function sortHand(hand, rankOrder, suitOrder) {
    const ro = rankOrder || '23456789TJQKA';
    const so = suitOrder || 'SHCD';
    return hand.slice().sort((a, b) => so.indexOf(a[1]) - so.indexOf(b[1]) || ro.indexOf(a[0]) - ro.indexOf(b[0]));
  }

  /**
   * Card-location audit. `piles` is an array of card arrays (every zone a game
   * keeps). Confirms each card of `expected` appears exactly once and nothing
   * else appears. Returns { ok, missing, duplicates, unknown }.
   */
  function audit(piles, expected) {
    const want = new Set(expected || makeDeck());
    const seen = new Map();
    const unknown = [];
    for (const pile of piles) for (const c of pile) {
      if (!want.has(c)) unknown.push(c);
      seen.set(c, (seen.get(c) || 0) + 1);
    }
    const missing = [...want].filter((c) => !seen.has(c));
    const duplicates = [...seen].filter(([, n]) => n > 1).map(([c]) => c);
    return { ok: !missing.length && !duplicates.length && !unknown.length, missing, duplicates, unknown };
  }

  C52.Cards = {
    RANKS, SUITS, SUIT_SYMBOL, SUIT_NAME, RANK_NAME,
    rankOf, suitOf, isRed, isFace, isValid, label, name, rankIndex, pipValue,
    makeDeck, secureRng, seededRng, shuffle, draw, deal, take, sortHand, audit,
  };
})(typeof window !== 'undefined' ? window : globalThis);
