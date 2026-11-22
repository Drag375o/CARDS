/* 52 Cards — Blackjack computer players. Medium and hard play basic
 * strategy; hard also sizes bets with a running card count. Easy hits
 * anything under 15 and never doubles or splits. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  C52.AI = C52.AI || {};

  const up = (c) => (c[0] === 'A' ? 11 : C52.Cards.pipValue(c));

  /** Basic strategy for one deck, dealer stands on soft 17 (close enough for both rules). */
  function strategy(cards, dealerUp, canDouble, canSplit) {
    const BJ = C52.Games.engine('blackjack');
    const { total, soft } = BJ.total(cards);
    const d = up(dealerUp);
    if (canSplit) {
      const r = cards[0][0];
      const v = C52.Cards.pipValue(cards[0]);
      if (r === 'A' || r === '8') return 'split';
      if (v === 9 && ![7, 10, 11].includes(d)) return 'split';
      if (v === 7 && d <= 7) return 'split';
      if (v === 6 && d <= 6) return 'split';
      if (v === 4 && (d === 5 || d === 6)) return 'split';
      if ((v === 2 || v === 3) && d <= 7) return 'split';
    }
    if (soft) {
      if (total >= 19) return 'stand';
      if (total === 18) return d >= 3 && d <= 6 && canDouble ? 'double' : d <= 8 ? 'stand' : 'hit';
      if (total === 17) return d >= 3 && d <= 6 && canDouble ? 'double' : 'hit';
      if (total >= 15) return d >= 4 && d <= 6 && canDouble ? 'double' : 'hit';
      return d >= 5 && d <= 6 && canDouble ? 'double' : 'hit';
    }
    if (total >= 17) return 'stand';
    if (total >= 13) return d <= 6 ? 'stand' : 'hit';
    if (total === 12) return d >= 4 && d <= 6 ? 'stand' : 'hit';
    if (total === 11) return canDouble && d !== 11 ? 'double' : 'hit';
    if (total === 10) return canDouble && d <= 9 ? 'double' : 'hit';
    if (total === 9) return canDouble && d >= 3 && d <= 6 ? 'double' : 'hit';
    return 'hit';
  }

  function hiLo(cards) {
    return cards.reduce((s, c) => s + ('23456'.includes(c[0]) ? 1 : 'TJQKA'.includes(c[0]) ? -1 : 0), 0);
  }

  function decide(v, actions, level, rng) {
    const t = actions[0].type;
    if (t === 'next') return actions[0];
    if (t === 'bet') {
      const ok = actions.map((a) => a.amount);
      if (level === 'easy') return actions[Math.floor(rng() * actions.length)];
      let want = 25;
      if (level === 'hard') {
        const decksLeft = Math.max(0.3, v.shoe / 52);
        const tc = hiLo(v.seen) / decksLeft;
        want = tc >= 3 ? 100 : tc >= 1.5 ? 50 : tc <= -1 ? 10 : 25;
      }
      const pick = ok.filter((x) => x <= want).pop() || ok[0];
      return { type: 'bet', amount: pick };
    }
    const h = v.seats[v.me].hands[v.active];
    if (level === 'easy') return { type: h.total < 15 ? 'hit' : 'stand' };
    const can = (x) => actions.some((a) => a.type === x);
    const move = strategy(h.cards, v.dealer[0], can('double'), can('split'));
    return { type: can(move) ? move : move === 'double' ? 'hit' : 'stand' };
  }

  C52.AI.blackjack = { decide, strategy, delay: (v, a, l, rng) => 600 + rng() * 500 };
})(typeof window !== 'undefined' ? window : globalThis);
