/* 52 Cards — Rummy computer player. Takes the discard only when it
 * completes or extends something, melds whatever it can, lays off, and
 * throws its highest card that isn't close to a meld. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  C52.AI = C52.AI || {};
  const ORDER = 'A23456789TJQK';
  const ri = (c) => ORDER.indexOf(c[0]);

  /** Every meld available in a hand (sets of 3–4, runs of 3+). */
  function findMelds(hand) {
    const R = C52.Games.engine('rummy');
    const out = [];
    const byRank = {};
    hand.forEach((c) => (byRank[c[0]] = (byRank[c[0]] || []).concat(c)));
    Object.values(byRank).forEach((cs) => {
      if (cs.length >= 3) out.push(cs.slice(0, Math.min(4, cs.length)));
    });
    'SHDC'.split('').forEach((s) => {
      const cs = hand.filter((c) => c[1] === s).sort((a, b) => ri(a) - ri(b));
      let run = [];
      cs.forEach((c) => {
        if (run.length && ri(c) === ri(run[run.length - 1]) + 1) run.push(c);
        else {
          if (run.length >= 3) out.push(run);
          run = [c];
        }
      });
      if (run.length >= 3) out.push(run);
    });
    return out.filter(R.isMeld);
  }

  /** Cards that sit next to a likely meld (pairs, near-runs) are worth keeping. */
  function keepValue(hand, c) {
    let v = 0;
    hand.forEach((o) => {
      if (o === c) return;
      if (o[0] === c[0]) v += 2;
      if (o[1] === c[1] && Math.abs(ri(o) - ri(c)) <= 2) v += 1.5 - Math.abs(ri(o) - ri(c)) * 0.4;
    });
    return v;
  }

  function decide(v, actions, level, rng) {
    if (actions[0].type === 'next') return actions[0];
    const hand = v.hand;
    if (v.step === 'draw') {
      const fromDiscard = actions.find((a) => a.from === 'discard');
      const fromStock = actions.find((a) => a.from === 'stock');
      if (fromDiscard && v.top) {
        const helps = findMelds(hand.concat([v.top])).some((m) => m.includes(v.top)) || v.melds.some((m) => C52.Games.engine('rummy').isMeld(m.cards.concat([v.top])));
        if (helps && (level !== 'easy' || rng() < 0.6)) return fromDiscard;
      }
      return fromStock || fromDiscard;
    }
    // Meld (keep the card we just took if melding it is the point, that's fine).
    const melds = findMelds(hand);
    if (melds.length && (level !== 'easy' || rng() < 0.8)) {
      // Prefer the meld that sheds the most points.
      const best = melds.sort((a, b) => b.reduce((s, c) => s + C52.Cards.pipValue(c), 0) - a.reduce((s, c) => s + C52.Cards.pipValue(c), 0))[0];
      // Don't meld away the only cards when we couldn't then discard (the took-card rule): engine allows going out anyway.
      return { type: 'meld', cards: best };
    }
    const lay = actions.find((a) => a.type === 'layoff');
    if (lay) return lay;
    const discards = actions.filter((a) => a.type === 'discard');
    if (!discards.length) return actions.find((a) => a.type === 'layoff') || { type: 'meld', cards: melds[0] };
    const scored = discards.map((a) => ({ a, s: C52.Cards.pipValue(a.card) - (level === 'easy' ? 0 : keepValue(hand, a.card) * 3) + rng() * 0.5 }));
    return scored.sort((x, y) => y.s - x.s)[0].a;
  }

  C52.AI.rummy = { decide, findMelds };
})(typeof window !== 'undefined' ? window : globalThis);
