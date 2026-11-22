/* 52 Cards — Klondike autoplayer (used for the Hint button and tests).
 * Priority: send cards home, free face-down cards, play from the waste,
 * then draw. Concedes after cycling the stock three times with no progress. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  C52.AI = C52.AI || {};

  function score(v, a) {
    if (a.type === 'finish') return 1000;
    if (a.type !== 'move') return -1;
    const fromT = a.from[0] === 't';
    const col = fromT ? v.tableau[Number(a.from[1])] : null;
    let s = 0;
    if (a.to[0] === 'f') s += 100;
    if (fromT && a.count === col.up.length && col.down > 0) s += 60 + col.down; // reveals a card
    if (a.from === 'waste') s += 30;
    if (a.from[0] === 'f') s -= 80;
    // Moving a King from one empty-able column to an empty column achieves nothing.
    if (fromT && a.count === col.up.length && col.down === 0 && a.to[0] === 't') s -= 200;
    // Don't shuffle stacks between columns unless it frees something useful.
    if (fromT && a.to[0] === 't' && a.count < col.up.length) {
      const under = col.up[col.up.length - a.count - 1];
      s += canGoHome(v, under) ? 70 : -40;
    }
    return s;
  }

  function canGoHome(v, c) {
    const f = v.found['SHDC'.indexOf(c[1])];
    return f.length === 'A23456789TJQK'.indexOf(c[0]);
  }
  const progress = (v) => v.home * 2 + v.tableau.reduce((s, c) => s - c.down, 21);

  const memo = new WeakMap();

  function decide(v, actions, level, rng) {
    const ranked = actions
      .filter((a) => a.type === 'move' || a.type === 'finish')
      .map((a) => ({ a, s: score(v, a) + rng() }))
      .sort((x, y) => y.s - x.s);
    if (ranked.length && ranked[0].s > 0) return ranked[0].a;
    // Track stock passes without progress on the view's identity per game.
    const key = v.events;
    const m = memo.get(key) || { best: -1, recycles: 0 };
    if (progress(v) > m.best) {
      m.best = progress(v);
      m.recycles = 0;
    }
    const draw = actions.find((a) => a.type === 'draw');
    if (draw) {
      memo.set(key, m);
      return draw;
    }
    const recycle = actions.find((a) => a.type === 'recycle');
    if (recycle && m.recycles < 3) {
      m.recycles++;
      memo.set(key, m);
      return recycle;
    }
    return actions.find((a) => a.type === 'concede');
  }

  C52.AI.klondike = { decide };
})(typeof window !== 'undefined' ? window : globalThis);
