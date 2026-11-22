/* 52 Cards — Oh Hell computer player. Bids its trick estimate (honouring
 * the dealer's hook), then plays to hit the bid exactly: win while short,
 * duck once it has enough. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  C52.AI = C52.AI || {};

  function decide(v, actions, level, rng) {
    if (actions[0].type === 'next') return actions[0];
    if (actions[0].type === 'bid') {
      let est = C52.TrickAI.estimate(v.hand, v.trump);
      // Small hands: estimates run high, so shade them down.
      if (v.size <= 3) est *= 0.8;
      if (level === 'easy') est += rng() * 1.4 - 0.7;
      const want = Math.max(0, Math.min(v.size, Math.round(est)));
      const ok = actions.map((a) => a.n);
      const best = ok.sort((a, b) => Math.abs(a - want) - Math.abs(b - want))[0];
      return { type: 'bid', n: best };
    }
    const need = v.bids[v.me] - v.won[v.me];
    const want = need > 0 ? 'win' : 'lose';
    const card = C52.TrickAI.choose({
      legal: actions.map((a) => a.card), trick: v.trick, trump: v.trump, me: v.me, n: v.n, want, level, rng, played: v.played, hand: v.hand,
    });
    return { type: 'play', card };
  }

  C52.AI.ohhell = { decide, delay: C52.TrickAI.delay };
})(typeof window !== 'undefined' ? window : globalThis);
