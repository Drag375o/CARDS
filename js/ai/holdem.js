/* 52 Cards — Hold'em computer players.
 * Before the flop: a starting-hand score (pairs, high cards, suited,
 * connected) and position. After: equity from random run-outs against the
 * opponents still in, compared with the pot odds. Hard players simulate
 * more deals and bluff a little; easy players are loose and passive. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  C52.AI = C52.AI || {};
  const ORDER = '23456789TJQKA';
  const r = (c) => ORDER.indexOf(c[0]);

  /** Starting-hand score, roughly 0 (7-2 offsuit) to 20 (aces). Chen-style. */
  function preflopScore(hole) {
    const [a, b] = hole.slice().sort((x, y) => r(y) - r(x));
    const hv = (c) => ({ 12: 10, 11: 8, 10: 7, 9: 6 }[r(c)] || (r(c) + 2) / 2);
    let s = hv(a);
    if (a[0] === b[0]) return Math.max(5, s * 2);
    if (a[1] === b[1]) s += 2;
    const gap = r(a) - r(b) - 1;
    s -= gap === 0 ? 0 : gap === 1 ? 1 : gap === 2 ? 2 : gap === 3 ? 4 : 5;
    if (gap <= 1 && r(a) < 10) s += 1;
    return s;
  }

  /** Chance to win at showdown against `opp` random hands. */
  function equity(hole, board, opp, iters, rng, dead) {
    const H = C52.Hands;
    const used = new Set(hole.concat(board, dead || []));
    const deck = C52.Cards.makeDeck().filter((c) => !used.has(c));
    let wins = 0;
    for (let it = 0; it < iters; it++) {
      // Partial shuffle: draw just the cards we need.
      const need = opp * 2 + (5 - board.length);
      for (let i = 0; i < need; i++) {
        const j = i + Math.floor(rng() * (deck.length - i));
        const t = deck[i];
        deck[i] = deck[j];
        deck[j] = t;
      }
      const full = board.concat(deck.slice(opp * 2, need));
      const mine = H.best(hole.concat(full)).score;
      let best = true;
      let tie = false;
      for (let o = 0; o < opp && best; o++) {
        const s = H.best([deck[o * 2], deck[o * 2 + 1]].concat(full)).score;
        if (s > mine) best = false;
        else if (s === mine) tie = true;
      }
      if (best) wins += tie ? 0.5 : 1;
    }
    return wins / iters;
  }

  function sizeRaise(v, raise, frac) {
    const target = Math.round(v.currentBet + Math.max(v.minRaise, v.pot * frac));
    return Math.max(raise.min, Math.min(raise.max, target));
  }

  function decide(v, actions, level, rng) {
    const f = (t) => actions.find((a) => a.type === t);
    if (f('next')) return f('next');
    const raise = f('raise');
    const call = f('call');
    const check = f('check');
    const opp = v.inHand.filter((x, i) => x && !v.folded[i] && i !== v.me).length;
    const toCall = v.toCall;
    const potOdds = toCall / (v.pot + toCall || 1);
    const chips = v.chips[v.me];

    let strength;
    if (v.street === 'preflop') {
      const s = preflopScore(v.hand);
      // Map to a rough win chance, tighter with more opponents.
      strength = Math.min(0.95, 0.18 + s / 22 - (opp - 1) * 0.035);
    } else {
      const iters = level === 'hard' ? 260 : level === 'medium' ? 130 : 45;
      strength = equity(v.hand, v.board, Math.max(1, opp), iters, rng);
    }
    if (level === 'easy') strength += rng() * 0.2 - 0.05;

    const strong = strength > (opp > 2 ? 0.55 : 0.68);
    const bluff = level === 'hard' && v.street === 'river' && check && rng() < 0.1;
    if (raise && (strong || bluff) && (level !== 'easy' || rng() < 0.4)) {
      const frac = strength > 0.8 ? 0.9 : 0.6;
      // Don't jam a short-stack all-in casually unless very strong.
      const to = strength > 0.85 && rng() < 0.3 ? raise.max : sizeRaise(v, raise, frac);
      return { type: 'raise', to };
    }
    if (check) return check;
    if (call) {
      const margin = level === 'easy' ? -0.08 : level === 'hard' ? 0.02 : 0;
      if (strength > potOdds + margin || (toCall <= v.blinds[1] && strength > 0.25)) return call;
      if (call.amount >= chips && strength > 0.5) return call;
      return f('fold') || call;
    }
    return actions[0];
  }

  C52.AI.holdem = { decide, preflopScore, equity, delay: (v, a, l, rng) => 750 + rng() * 650 };
})(typeof window !== 'undefined' ? window : globalThis);
