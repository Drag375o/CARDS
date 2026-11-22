/* 52 Cards — Twenty-Five computer player. Always plays to win tricks,
 * using the game's own trump order; robs by throwing its weakest card. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  C52.AI = C52.AI || {};

  function decide(v, actions, level, rng) {
    const G = C52.Games.engine('twentyfive');
    const t = v.trump;
    if (actions[0].type === 'next') return actions[0];
    if (actions[0].type === 'rob') {
      if (level === 'easy' && rng() < 0.3) return { type: 'norob' };
      const weakest = v.hand.slice().sort((a, b) => G.strength(a, t) - G.strength(b, t))[0];
      return { type: 'rob', card: weakest };
    }
    const legal = actions.map((a) => a.card);
    const card = C52.TrickAI.choose({
      legal, trick: v.trick, me: v.me, n: v.n, want: 'win', level, rng, played: v.played, hand: v.hand,
      trump: t,
      rank: (c) => G.strength(c, t),
      isTrump: (c) => G.isTrump(c, t),
      // The trick's current best is always a trump or of the suit led, so this comparison is exact.
      beats: (a, b) => {
        const at = G.isTrump(a, t);
        const bt = G.isTrump(b, t);
        if (at !== bt) return at;
        return G.effSuit(a, t) === G.effSuit(b, t) && G.strength(a, t) > G.strength(b, t);
      },
    });
    return { type: 'play', card };
  }

  C52.AI.twentyfive = { decide, delay: C52.TrickAI.delay };
})(typeof window !== 'undefined' ? window : globalThis);
