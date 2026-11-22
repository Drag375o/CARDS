/* 52 Cards — Egyptian Rat Screw computer players. They slap valid piles
 * after a human-like reaction time (easy slow and sometimes wrong, hard
 * quick), flip at a steady pace and pause before collecting a won pile so
 * there's a moment to slap it first. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  C52.AI = C52.AI || {};

  const REACT = { easy: [950, 1500], medium: [560, 900], hard: [340, 600] };

  function decide(v, actions, level, rng) {
    const can = (t) => actions.find((a) => a.type === t);
    if (v.slap && can('slap')) return can('slap');
    // Easy players occasionally slap a near miss.
    if (level === 'easy' && can('slap') && v.pile.length >= 2 && rng() < 0.04) return can('slap');
    return can('collect') || can('flip') || null; // null: nothing worth doing
  }

  function delay(v, actions, level, rng) {
    const [a, b] = REACT[level] || REACT.medium;
    if (v.slap) return a + rng() * (b - a);
    if (actions.some((x) => x.type === 'collect')) return 1100 + rng() * 400;
    return 650 + rng() * 350;
  }

  C52.AI.ers = { decide, delay };
})(typeof window !== 'undefined' ? window : globalThis);
