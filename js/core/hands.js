/* 52 Cards — poker hand evaluation (Texas Hold'em).
 *
 *   Hands.eval5(cards)  -> { score, cat, name }   higher score is better
 *   Hands.best(cards)   -> best five of 5–7 cards, same shape plus .five
 *
 * Ace is high, and also low in the A-2-3-4-5 straight ("the wheel").
 */
(function (root) {
  'use strict';
  const C52 = (root.C52 = root.C52 || {});

  const ORDER = '23456789TJQKA';
  const NAMES = ['High card', 'One pair', 'Two pair', 'Three of a kind', 'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush'];

  /** Pack a category and up to five tiebreak ranks into one comparable number. */
  const pack = (cat, ranks) => ranks.reduce((s, r, i) => s + r * Math.pow(15, 4 - i), cat * Math.pow(15, 5));

  function eval5(cards) {
    const ranks = cards.map((c) => ORDER.indexOf(c[0])).sort((a, b) => b - a);
    const flush = cards.every((c) => c[1] === cards[0][1]);
    const uniq = [...new Set(ranks)];
    let straightHigh = -1;
    if (uniq.length === 5) {
      if (ranks[0] - ranks[4] === 4) straightHigh = ranks[0];
      else if (ranks[0] === 12 && ranks[1] === 3) straightHigh = 3; // wheel: 5-high
    }
    const counts = {};
    ranks.forEach((r) => (counts[r] = (counts[r] || 0) + 1));
    // Groups ordered by size, then rank.
    const groups = Object.entries(counts)
      .map(([r, n]) => [Number(r), n])
      .sort((a, b) => b[1] - a[1] || b[0] - a[0]);
    const shape = groups.map((g) => g[1]).join('');
    const byGroup = groups.map((g) => g[0]);
    let cat;
    let tie;
    if (straightHigh >= 0 && flush) (cat = 8), (tie = [straightHigh]);
    else if (shape === '41') (cat = 7), (tie = byGroup);
    else if (shape === '32') (cat = 6), (tie = byGroup);
    else if (flush) (cat = 5), (tie = ranks);
    else if (straightHigh >= 0) (cat = 4), (tie = [straightHigh]);
    else if (shape === '311') (cat = 3), (tie = byGroup);
    else if (shape === '221') (cat = 2), (tie = byGroup);
    else if (shape === '2111') (cat = 1), (tie = byGroup);
    else (cat = 0), (tie = ranks);
    const name = cat === 8 && straightHigh === 12 ? 'Royal flush' : NAMES[cat];
    return { score: pack(cat, tie), cat, name };
  }

  function best(cards) {
    if (cards.length <= 5) return Object.assign(eval5(cards), { five: cards.slice() });
    let top = null;
    const n = cards.length;
    for (let a = 0; a < n; a++)
      for (let b = a + 1; b < n; b++)
        for (let c = b + 1; c < n; c++)
          for (let d = c + 1; d < n; d++)
            for (let e = d + 1; e < n; e++) {
              const five = [cards[a], cards[b], cards[c], cards[d], cards[e]];
              const r = eval5(five);
              if (!top || r.score > top.score) top = Object.assign(r, { five });
            }
    return top;
  }

  C52.Hands = { eval5, best, NAMES, ORDER };
})(typeof window !== 'undefined' ? window : globalThis);
