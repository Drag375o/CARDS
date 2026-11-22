/* 52 Cards — shared brain for trick-taking computer players.
 *
 *   C52.TrickAI.choose({ legal, trick, trump, order, rank, me, partner,
 *                        want: 'win' | 'lose', n, played, level, rng })
 *   C52.TrickAI.estimate(hand, trump, order)  -> expected tricks (float)
 *
 * `rank(card)` may be passed for games with unusual orders (Twenty-Five);
 * `beats(a, b, led)` likewise. Easy players pick sensibly but loosely;
 * medium follow the usual table habits; hard also count cards played. */
(function (root) {
  'use strict';
  const C52 = (root.C52 = root.C52 || {});

  function makeOps(o) {
    const order = o.order || '23456789TJQKA';
    const rank = o.rank || ((c) => order.indexOf(c[0]) + (o.trump && c[1] === o.trump ? 100 : 0));
    const isTrump = o.isTrump || ((c) => !!o.trump && c[1] === o.trump);
    // Does card a beat card b given the led suit?
    const beats =
      o.beats ||
      ((a, b, led) => {
        const at = isTrump(a);
        const bt = isTrump(b);
        if (at !== bt) return at;
        if (!at && a[1] !== b[1]) return a[1] === led;
        return rank(a) > rank(b);
      });
    return { rank, isTrump, beats };
  }

  function currentBest(trick, ops) {
    if (!trick.length) return null;
    const led = trick[0].card[1];
    let best = trick[0];
    trick.slice(1).forEach((p) => {
      if (ops.beats(p.card, best.card, led)) best = p;
    });
    return best;
  }

  function choose(o) {
    const { legal, trick, rng } = o;
    if (legal.length === 1) return legal[0];
    const ops = makeOps(o);
    const byRank = legal.slice().sort((a, b) => ops.rank(a) - ops.rank(b));
    const low = byRank[0];
    const high = byRank[byRank.length - 1];
    if (o.level === 'easy' && rng() < 0.45) return legal[Math.floor(rng() * legal.length)];

    const led = trick.length ? trick[0].card[1] : null;
    const best = currentBest(trick, ops);
    const last = trick.length === o.n - 1;
    const partnerWinning = best && o.partner != null && best.seat === o.partner;
    const winners = best ? byRank.filter((c) => ops.beats(c, best.card, led)) : [];

    if (o.want === 'lose') {
      if (!trick.length) {
        // Lead low from the suit where we hold the lowest card, avoiding trumps.
        const plain = byRank.filter((c) => !ops.isTrump(c));
        return (plain.length ? plain : byRank)[0];
      }
      const losers = byRank.filter((c) => !ops.beats(c, best.card, led));
      if (losers.length) {
        // Shed the most dangerous card we can safely lose with, else the highest safe card.
        if (o.dangerous) {
          const bad = losers.filter(o.dangerous);
          if (bad.length) return bad.sort((a, b) => ops.rank(b) - ops.rank(a))[0];
        }
        return losers[losers.length - 1];
      }
      // Forced to win: take it with the highest card so it can't cost us later.
      return high;
    }

    // want === 'win'
    if (!trick.length) {
      // Lead: a sure-ish winner (top card of a suit), else low from a long suit.
      const tops = byRank.filter((c) => isTopCard(c, o, ops));
      if (tops.length && o.level !== 'easy') return tops[tops.length - 1];
      const plain = byRank.filter((c) => !ops.isTrump(c));
      return longSuitLow(plain.length ? plain : byRank);
    }
    if (partnerWinning && (last || o.level !== 'easy')) return low;
    if (winners.length) {
      // Last to play: the cheapest winner. Otherwise also cheapest, unless it's easily overtaken.
      if (last) return winners[0];
      const strong = winners.filter((c) => isTopCard(c, o, ops));
      return o.level === 'hard' && strong.length ? strong[0] : winners[0];
    }
    return low;
  }

  /** Is this the highest unplayed card of its suit (hard players count; others guess with A/K)? */
  function isTopCard(c, o, ops) {
    if (o.level === 'hard' && o.played) {
      const order = o.order || '23456789TJQKA';
      const higher = order.slice(order.indexOf(c[0]) + 1).split('').map((r) => r + c[1]);
      return higher.every((h) => o.played.includes(h) || o.legal.includes(h) || (o.hand || []).includes(h));
    }
    return c[0] === 'A' || (c[0] === 'K' && (o.played || []).includes('A' + c[1]));
  }

  function longSuitLow(cards) {
    const count = {};
    cards.forEach((c) => (count[c[1]] = (count[c[1]] || 0) + 1));
    const suit = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
    return cards.filter((c) => c[1] === suit)[0];
  }

  /** Rough count of tricks a hand should take. */
  function estimate(hand, trump, order) {
    const o = order || '23456789TJQKA';
    const bySuit = { S: [], H: [], D: [], C: [] };
    hand.forEach((c) => bySuit[c[1]].push(o.indexOf(c[0])));
    let t = 0;
    for (const s of 'SHDC') {
      const r = bySuit[s].sort((a, b) => b - a);
      const len = r.length;
      const top = o.length - 1;
      if (r.includes(top)) t += 1;
      if (r.includes(top - 1) && len >= 2) t += r.includes(top) ? 0.9 : 0.6;
      if (r.includes(top - 2) && len >= 3) t += 0.35;
      if (s === trump) {
        t += Math.max(0, len - 3) * 0.75;
      } else if (trump && bySuit[trump].length >= 2) {
        if (len === 0) t += 0.8;
        else if (len === 1) t += 0.4;
      }
    }
    return t;
  }

  /** Wait a little longer before leading, so a finished trick can be seen. */
  function delay(v, actions, level, rng) {
    const leading = v.trick && !v.trick.length && v.lastTrick;
    return (leading ? 1750 : 700) + rng() * 450;
  }

  C52.TrickAI = { choose, estimate, currentBest, makeOps, delay };
})(typeof window !== 'undefined' ? window : globalThis);
