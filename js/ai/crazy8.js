/* 52 Cards — Crazy Eights computer player.
 * Easy: any legal move. Medium: keep eights for emergencies, shed high
 * cards, call the suit you hold most. Hard: also counts what's been
 * played and changes suit to starve a player who is close to going out. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  C52.AI = C52.AI || {};

  function suitCounts(hand) {
    const n = { S: 0, H: 0, D: 0, C: 0 };
    hand.forEach((c) => c[0] !== '8' && n[c[1]]++);
    return n;
  }
  const bestSuit = (hand) => {
    const n = suitCounts(hand);
    return Object.keys(n).sort((a, b) => n[b] - n[a])[0];
  };

  function decide(view, actions, level, rng) {
    const pick = (xs) => xs[Math.floor(rng() * xs.length)];
    if (actions.length === 1) return actions[0];
    if (level === 'easy') {
      const plays = actions.filter((a) => a.type === 'play');
      return plays.length ? pick(plays) : actions[0];
    }
    const hand = view.hand;
    const counts = suitCounts(hand);
    const plays = actions.filter((a) => a.type === 'play');
    const plain = plays.filter((a) => a.card[0] !== '8');
    const eights = plays.filter((a) => a.card[0] === '8');
    const nextSeat = (view.me + 1) % view.n;
    const danger = view.counts[nextSeat] <= 2;

    if (plain.length) {
      // Prefer cards in the suit we hold most (keeps options open), then higher value.
      const score = (a) => {
        let s = counts[a.card[1]] * 3 + C52.Cards.pipValue(a.card);
        // Hard: when the next player is nearly out, prefer changing the suit.
        if (level === 'hard' && danger && a.card[1] !== view.suit) s += 12;
        return s;
      };
      return plain.sort((a, b) => score(b) - score(a))[0];
    }
    if (eights.length) {
      const suit = bestSuit(hand.filter((c) => c !== eights[0].card));
      return eights.find((a) => a.suit === suit) || eights[0];
    }
    return actions.find((a) => a.type === 'draw') || actions.find((a) => a.type === 'pass') || actions[0];
  }

  C52.AI.crazy8 = { decide };
})(typeof window !== 'undefined' ? window : globalThis);
