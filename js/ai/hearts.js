/* 52 Cards — Hearts computer player.
 * Pass: dump the Q♠, A♠, K♠ and high hearts, or void a short suit.
 * Play: duck tricks, shed the Q♠ and high hearts when void, and stop a
 * moon shot (hard) by taking a heart when one player has all the points. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  C52.AI = C52.AI || {};
  const ORDER = '23456789TJQKA';
  const r = (c) => ORDER.indexOf(c[0]);

  function passCards(hand, level, rng) {
    if (level === 'easy') return hand.slice().sort(() => rng() - 0.5).slice(0, 3);
    const danger = (c) => (c === 'QS' ? 100 : c === 'AS' || c === 'KS' ? 80 : c[1] === 'H' ? 20 + r(c) * 2 : r(c) * 3);
    const count = {};
    hand.forEach((c) => (count[c[1]] = (count[c[1]] || 0) + 1));
    // Keep low spades if we hold the queen with plenty of cover.
    const spades = hand.filter((c) => c[1] === 'S');
    const safeQueen = hand.includes('QS') && spades.length >= 5;
    return hand
      .slice()
      .sort((a, b) => {
        const da = danger(a) + (count[a[1]] <= 2 && a[1] !== 'S' ? 25 : 0) - (safeQueen && a[1] === 'S' ? 120 : 0);
        const db = danger(b) + (count[b[1]] <= 2 && b[1] !== 'S' ? 25 : 0) - (safeQueen && b[1] === 'S' ? 120 : 0);
        return db - da;
      })
      .slice(0, 3);
  }

  function decide(v, actions, level, rng) {
    if (actions[0].type === 'pass') return { type: 'pass', cards: passCards(v.hand, level, rng) };
    if (actions[0].type === 'next') return actions[0];
    const legal = actions.map((a) => a.card);
    let want = 'lose';
    // Hard: if one opponent holds every point taken so far (moon threat), take a point-bearing trick to stop it.
    if (level === 'hard') {
      const total = v.pointsTaken.reduce((a, b) => a + b, 0);
      const leader = v.pointsTaken.findIndex((p) => p === total && p >= 14);
      if (leader >= 0 && leader !== v.me && v.trick.some((p) => p.card[1] === 'H' || p.card === 'QS')) want = 'win';
    }
    const card = C52.TrickAI.choose({
      legal, trick: v.trick, trump: null, me: v.me, n: 4, want, level, rng, played: v.played, hand: v.hand,
      dangerous: (c) => c === 'QS' || c === 'AS' || c === 'KS' || c[1] === 'H',
    });
    return { type: 'play', card };
  }

  C52.AI.hearts = { decide, passCards, delay: C52.TrickAI.delay };
})(typeof window !== 'undefined' ? window : globalThis);
