/* 52 Cards — Big Two computer player. Finds every combination in its
 * hand; leads to shed the most low cards; follows with the cheapest play
 * that wins; medium and hard hold back twos and big hands while their
 * hand is still long. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  C52.AI = C52.AI || {};

  function combos(hand) {
    const B = C52.Games.engine('bigtwo');
    const out = [];
    const h = B.sortHand(hand);
    h.forEach((c) => out.push([c]));
    for (let i = 0; i < h.length; i++)
      for (let j = i + 1; j < h.length; j++) {
        if (h[i][0] === h[j][0]) {
          out.push([h[i], h[j]]);
          for (let k = j + 1; k < h.length; k++) if (h[k][0] === h[i][0]) out.push([h[i], h[j], h[k]]);
        }
      }
    // Five-card hands: all 5-subsets when small enough, else a sampled search over likely shapes.
    if (h.length >= 5) {
      const n = h.length;
      const idx = [0, 1, 2, 3, 4];
      let guard = 0;
      while (guard++ < 7000) {
        const cs = idx.map((i) => h[i]);
        if (B.combo(cs)) out.push(cs);
        let k = 4;
        while (k >= 0 && idx[k] === n - 5 + k) k--;
        if (k < 0) break;
        idx[k]++;
        for (let m = k + 1; m < 5; m++) idx[m] = idx[m - 1] + 1;
      }
    }
    return out.map((cs) => ({ cards: cs, c: B.combo(cs) })).filter((x) => x.c);
  }

  const cost = (x) => x.cards.reduce((s, c) => s + C52.Games.engine('bigtwo').val(c), 0) / x.cards.length;
  const hasTwo = (x) => x.cards.some((c) => c[0] === '2');

  function decide(v, actions, level, rng) {
    if (actions[0].type === 'next') return actions[0];
    const B = C52.Games.engine('bigtwo');
    let all = combos(v.hand).filter((x) => B.check(v, x.cards).ok);
    const pass = actions.find((a) => a.type === 'pass');
    if (!all.length) return pass;
    if (level === 'easy') {
      const pick = all[Math.floor(rng() * all.length)];
      return pass && rng() < 0.15 ? pass : { type: 'play', cards: pick.cards };
    }
    const long = v.hand.length > 6;
    if (!v.pile) {
      // Lead: shed as many low cards as possible.
      const score = (x) => x.cards.length * 12 - cost(x) - (long && hasTwo(x) ? 40 : 0);
      all.sort((a, b) => score(b) - score(a));
      return { type: 'play', cards: all[0].cards };
    }
    // Follow: cheapest winner; hold twos and big five-card hands while the hand is long.
    all.sort((a, b) => (a.c.kind - b.c.kind) * 100 + (a.c.key - b.c.key));
    const cheap = all.find((x) => !(long && (hasTwo(x) || x.c.kind >= 3)));
    const opponentLow = v.counts.some((n, s) => s !== v.me && n <= 2);
    const pick = cheap || (opponentLow || !long || level === 'hard' ? all[0] : null);
    if (!pick && pass) return pass;
    return { type: 'play', cards: (pick || all[0]).cards };
  }

  C52.AI.bigtwo = { decide, combos };
})(typeof window !== 'undefined' ? window : globalThis);
