/* 52 Cards — Klondike Solitaire (game 03).
 *
 * Seven tableau columns (1–7 cards, top card face up), 24 in the stock.
 * Build foundations up by suit from Ace to King; build the tableau down in
 * alternating colours; only Kings go into empty columns. Draw 1 or 3 from
 * the stock, with unlimited passes. Cards may come back down from the
 * foundations. Win by moving all 52 cards to the foundations.
 *
 * Piles are addressed by id: 'stock', 'waste', 'f0'–'f3' (foundations, one
 * per suit in the order S H D C), 't0'–'t6' (tableau).
 */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const K = C52.Cards;
  const E = C52.Engine;

  const ORDER = 'A23456789TJQK';
  const FSUITS = 'SHDC';
  const rank = (c) => ORDER.indexOf(c[0]);

  const options = [
    { key: 'draw', label: 'Draw from stock', default: 1, values: [{ value: 1, label: 'One card' }, { value: 3, label: 'Three cards' }] },
  ];

  function setup(cfg, rng) {
    const st = E.base('klondike', cfg);
    st.draw = cfg.options.draw === 3 ? 3 : 1;
    const deck = K.shuffle(K.makeDeck(), rng);
    st.tableau = [];
    for (let i = 0; i < 7; i++) {
      const cards = K.draw(deck, i + 1);
      st.tableau.push({ down: cards.slice(0, i), up: cards.slice(i) });
    }
    st.stock = deck;
    st.waste = [];
    st.found = [[], [], [], []];
    st.moves = 0;
    st.undo = [];
    st.round = 1;
    st.phase = 'play';
    st.turn = 0;
    E.emit(st, { text: 'The cards are laid out. Build each suit from Ace to King.', sound: 'deal', count: 28 });
    return st;
  }

  const fIndex = (c) => FSUITS.indexOf(c[1]);
  const fTop = (st, i) => st.found[i][st.found[i].length - 1];

  function toFoundationOk(st, card) {
    const f = st.found[fIndex(card)];
    return f.length === rank(card);
  }
  function onTableauOk(col, card) {
    if (!col.up.length) return !col.down.length && card[0] === 'K';
    const top = col.up[col.up.length - 1];
    return K.isRed(top) !== K.isRed(card) && rank(top) === rank(card) + 1;
  }

  /** Every legal move from the current position. */
  function moves(st) {
    const out = [];
    const sources = [];
    if (st.waste.length) sources.push({ from: 'waste', cards: [st.waste[st.waste.length - 1]] });
    st.tableau.forEach((col, i) => {
      for (let k = 0; k < col.up.length; k++) sources.push({ from: 't' + i, cards: col.up.slice(k), count: col.up.length - k });
    });
    st.found.forEach((f, i) => f.length && sources.push({ from: 'f' + i, cards: [f[f.length - 1]], fromFoundation: true }));

    sources.forEach((s) => {
      const lead = s.cards[0];
      if (s.cards.length === 1 && !s.fromFoundation && toFoundationOk(st, lead)) out.push({ type: 'move', from: s.from, to: 'f' + fIndex(lead), count: 1 });
      st.tableau.forEach((col, j) => {
        if (s.from === 't' + j) return;
        if (onTableauOk(col, lead)) out.push({ type: 'move', from: s.from, to: 't' + j, count: s.count || 1 });
      });
    });
    return out;
  }

  const allUp = (st) => !st.stock.length && !st.waste.length && st.tableau.every((c) => !c.down.length);

  function actions(st, seat) {
    if (seat !== 0 || st.phase !== 'play') return [];
    const out = moves(st);
    if (st.stock.length) out.push({ type: 'draw' });
    else if (st.waste.length) out.push({ type: 'recycle' });
    if (st.undo.length) out.push({ type: 'undo' });
    if (allUp(st)) out.push({ type: 'finish' });
    out.push({ type: 'concede' });
    return out;
  }

  function snapshot(st) {
    return JSON.stringify({ tableau: st.tableau, stock: st.stock, waste: st.waste, found: st.found, moves: st.moves });
  }

  function pile(st, id) {
    if (id === 'waste') return st.waste;
    if (id[0] === 'f') return st.found[Number(id[1])];
    return st.tableau[Number(id[1])].up;
  }

  function apply(st, seat, action) {
    const a = E.legal(actions(st, seat), action);
    if (a.type === 'concede') {
      st.phase = 'gameover';
      st.winners = [];
      st.summary = { title: 'The deck wins this time', note: `You stopped after ${st.moves} moves with ${found(st)} of 52 cards home.` };
      E.emit(st, { text: 'You gather up the cards.', sound: 'sweep', count: 5 });
      return st;
    }
    if (a.type === 'undo') {
      const prev = JSON.parse(st.undo.pop());
      Object.assign(st, prev);
      E.emit(st, { text: 'Move taken back.', sound: 'draw' });
      return st;
    }
    st.undo.push(snapshot(st));
    if (st.undo.length > 300) st.undo.shift();
    st.moves += 1;

    if (a.type === 'draw') {
      const n = Math.min(st.draw, st.stock.length);
      for (let i = 0; i < n; i++) st.waste.push(st.stock.pop());
      E.emit(st, { sound: 'flip' });
      return st;
    }
    if (a.type === 'recycle') {
      st.stock = st.waste.reverse();
      st.waste = [];
      E.emit(st, { text: 'The waste goes back to the stock.', sound: 'sweep', count: 3 });
      return st;
    }
    if (a.type === 'finish') {
      let guard = 0;
      while (found(st) < 52 && guard++ < 60) {
        for (const src of ['waste', 't0', 't1', 't2', 't3', 't4', 't5', 't6']) {
          const p = pile(st, src);
          const c = p[p.length - 1];
          if (c && toFoundationOk(st, c)) st.found[fIndex(c)].push(p.pop());
        }
      }
      E.emit(st, { text: 'The rest fly home.', sound: 'deal', count: 12 });
      return checkWin(st);
    }
    // move
    const src = pile(st, a.from);
    const cards = src.splice(src.length - a.count, a.count);
    pile(st, a.to).push(...cards);
    let text = '';
    if (a.to[0] === 'f') text = `${E.cardName(cards[0])} goes home.`;
    E.emit(st, { text, sound: a.to[0] === 'f' ? 'meld' : 'place', card: cards[0] });
    // Turn up the next face-down card in the column we took from.
    if (a.from[0] === 't') {
      const col = st.tableau[Number(a.from[1])];
      if (!col.up.length && col.down.length) {
        col.up.push(col.down.pop());
        E.emit(st, { sound: 'flip' });
      }
    }
    return checkWin(st);
  }

  const found = (st) => st.found.reduce((s, f) => s + f.length, 0);

  function checkWin(st) {
    if (found(st) === 52) {
      st.phase = 'gameover';
      st.winners = [0];
      st.summary = { title: 'Every suit is home', note: `Cleared in ${st.moves} moves, drawing ${st.draw === 3 ? 'three' : 'one'} at a time.` };
      E.emit(st, { text: 'Every suit is home.', sting: 'big' });
    }
    return st;
  }

  function view(st, seat) {
    const v = E.baseView(st, seat);
    v.tableau = st.tableau.map((c) => ({ down: c.down.length, up: c.up.slice() }));
    v.stock = st.stock.length;
    v.waste = st.waste.slice(-3);
    v.wasteCount = st.waste.length;
    v.found = st.found.map((f) => f.slice());
    v.moves = st.moves;
    v.draw = st.draw;
    v.home = found(st);
    v.hand = [];
    v.publicCards = [];
    return v;
  }

  const zones = (st) => [st.stock, st.waste, ...st.found, ...st.tableau.map((c) => c.down), ...st.tableau.map((c) => c.up)];

  C52.Games.register('klondike', { options, setup, actions, apply, view, zones, moves, toFoundationOk, onTableauOk });
})(typeof window !== 'undefined' ? window : globalThis);
