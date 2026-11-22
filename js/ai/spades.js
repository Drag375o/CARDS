/* 52 Cards — Spades computer player.
 * Bids from a trick estimate (Nil with a weak hand and no high spades);
 * plays to make the team's bid, then ducks to avoid bags; protects a
 * partner's Nil by covering their cards. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  C52.AI = C52.AI || {};
  const ORDER = '23456789TJQKA';

  function bid(v, level, rng) {
    const est = C52.TrickAI.estimate(v.hand, 'S');
    const spades = v.hand.filter((c) => c[1] === 'S');
    const highSpade = spades.some((c) => 'TJQKA'.includes(c[0]));
    const aces = v.hand.filter((c) => c[0] === 'A').length;
    if (level !== 'easy' && est < 1.2 && !highSpade && aces === 0 && spades.length <= 3 && v.bids[(v.me + 2) % 4] !== 0) return 0;
    let n = Math.round(est + (level === 'easy' ? rng() * 1.6 - 0.8 : 0));
    return Math.max(1, Math.min(13, n));
  }

  function decide(v, actions, level, rng) {
    if (actions[0].type === 'next') return actions[0];
    if (actions[0].type === 'bid') return { type: 'bid', n: bid(v, level, rng) };
    const me = v.me;
    const partner = (me + 2) % 4;
    const legal = actions.map((a) => a.card);
    let want = 'win';
    const myNil = v.bids[me] === 0;
    const partnerNil = v.bids[partner] === 0;
    if (myNil) want = 'lose';
    else if (level !== 'easy') {
      const teamBid = [me, partner].filter((s) => v.bids[s] > 0).reduce((s, x) => s + v.bids[x], 0);
      const teamWon = v.won[me] + v.won[partner];
      if (teamWon >= teamBid && !partnerNil) want = 'lose'; // bid made: avoid bags
    }
    const card = C52.TrickAI.choose({
      legal, trick: v.trick, trump: 'S', me, partner: partnerNil ? null : partner, n: 4, want, level, rng, played: v.played, hand: v.hand,
      order: ORDER,
    });
    return { type: 'play', card };
  }

  C52.AI.spades = { decide, delay: C52.TrickAI.delay, bid };
})(typeof window !== 'undefined' ? window : globalThis);
