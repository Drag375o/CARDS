/* 52 Cards — Rummy (game 04), basic draw-and-discard. 2–6 players.
 *
 * Deal 10 each (2 players), 7 (3–4) or 6 (5–6); one card starts the
 * discard pile. A turn: draw from the stock or take the top discard, then
 * meld sets (3–4 of a rank) or runs (3+ in a suit, ace low only) and lay
 * off on any meld on the table, then discard one card — not the card just
 * taken from the discards. Melding or laying off your last card takes you
 * out (the final discard is optional). When the stock runs out the
 * discards are turned over once; if it runs out again the round ends with
 * no score. The winner scores everyone else's unmelded cards (A 1, 2–10
 * face, J Q K 10). First to the target wins.
 */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const K = C52.Cards;
  const E = C52.Engine;

  const ORDER = 'A23456789TJQK';
  const ri = (c) => ORDER.indexOf(c[0]);
  const sortHand = (h) => K.sortHand(h, ORDER, 'SHCD');

  const options = [
    { key: 'target', label: 'Play to', default: 100, values: [{ value: 100, label: '100' }, { value: 250, label: '250' }] },
  ];

  function isSet(cards) {
    return cards.length >= 3 && cards.length <= 4 && cards.every((c) => c[0] === cards[0][0]) && new Set(cards.map((c) => c[1])).size === cards.length;
  }
  function isRun(cards) {
    if (cards.length < 3 || !cards.every((c) => c[1] === cards[0][1])) return false;
    const r = cards.map(ri).sort((a, b) => a - b);
    return r.every((x, i) => i === 0 || x === r[i - 1] + 1);
  }
  const isMeld = (cards) => isSet(cards) || isRun(cards);
  const orderMeld = (cards) => (isRun(cards) ? cards.slice().sort((a, b) => ri(a) - ri(b)) : cards.slice().sort());

  function setup(cfg, rng) {
    const st = E.base('rummy', cfg);
    st.dealer = Math.floor(rng() * cfg.n);
    deal(st, rng);
    return st;
  }

  function deal(st, rng) {
    st.round += 1;
    if (st.round > 1) st.dealer = E.next(st, st.dealer);
    const size = st.n === 2 ? 10 : st.n <= 4 ? 7 : 6;
    const deck = K.shuffle(K.makeDeck(), rng);
    st.hands = K.deal(deck, st.n, size).map(sortHand);
    st.discard = K.draw(deck, 1);
    st.stock = deck;
    st.melds = []; // { cards, owner }
    st.turnedOver = false;
    st.step = 'draw';
    st.took = null;
    st.phase = 'play';
    st.summary = null;
    st.turn = E.next(st, st.dealer);
    E.emit(st, { text: `Round ${st.round}. ${E.nm(st, st.turn)} draws first.`, sound: 'deal', count: size * st.n });
  }

  /** Lay-off options: which meld can take this card. */
  function layoffs(st, hand) {
    const out = [];
    hand.forEach((c) => {
      st.melds.forEach((m, i) => {
        if (isMeld(m.cards.concat([c]))) out.push({ type: 'layoff', card: c, meld: i });
      });
    });
    return out;
  }

  function actions(st, seat) {
    if (st.phase === 'roundover') return seat === 0 ? [{ type: 'next' }] : [];
    if (st.phase !== 'play' || seat !== st.turn) return [];
    if (st.step === 'draw') {
      const out = [];
      if (st.stock.length || (!st.turnedOver && st.discard.length > 1)) out.push({ type: 'draw', from: 'stock' });
      if (st.discard.length) out.push({ type: 'draw', from: 'discard' });
      return out;
    }
    const hand = st.hands[seat];
    const out = [{ type: 'meld', choose: 'cards' }].concat(layoffs(st, hand));
    hand.forEach((c) => {
      if (c !== st.took || hand.length === 1) out.push({ type: 'discard', card: c });
    });
    return out;
  }

  function apply(st, seat, action, rng) {
    if (action.type === 'meld' && action.cards) {
      if (st.phase !== 'play' || seat !== st.turn || st.step !== 'play') throw new Error('Not your meld');
      const cards = action.cards;
      if (new Set(cards).size !== cards.length || !cards.every((c) => st.hands[seat].includes(c)) || !isMeld(cards)) throw new Error('Not a valid meld');
      cards.forEach((c) => K.take(st.hands[seat], c));
      st.melds.push({ cards: orderMeld(cards), owner: seat });
      E.emit(st, { text: `${E.nm(st, seat)} melds ${cards.length > 0 ? C52.Engine.andList(orderMeld(cards).map(K.label)) : ''}.`, sound: 'meld', seat });
      return afterPlay(st, seat);
    }
    const a = E.legal(actions(st, seat), action);
    if (a.type === 'next') return deal(st, rng);
    if (a.type === 'draw') {
      if (a.from === 'discard') {
        const c = st.discard.pop();
        st.hands[seat].push(c);
        st.took = c;
        E.emit(st, { text: `${E.nm(st, seat)} takes the ${K.name(c)}.`, sound: 'draw', seat, card: c });
      } else {
        if (!st.stock.length) {
          // First exhaustion: the discards (all but the top card) become the stock.
          const top = st.discard.pop();
          st.stock = st.discard.reverse();
          st.discard = [top];
          st.turnedOver = true;
          E.emit(st, { text: 'The stock is empty. The discards are turned over.', sound: 'sweep', count: 3 });
        }
        st.hands[seat].push(K.draw(st.stock, 1)[0]);
        st.took = null;
        E.emit(st, { text: `${E.nm(st, seat)} draws from the stock.`, sound: 'draw', seat });
      }
      st.hands[seat] = sortHand(st.hands[seat]);
      st.step = 'play';
      return st;
    }
    if (a.type === 'layoff') {
      K.take(st.hands[seat], a.card);
      const m = st.melds[a.meld];
      m.cards = orderMeld(m.cards.concat([a.card]));
      E.emit(st, { text: `${E.nm(st, seat)} lays off the ${K.name(a.card)}.`, sound: 'place', seat });
      return afterPlay(st, seat);
    }
    // discard
    K.take(st.hands[seat], a.card);
    st.discard.push(a.card);
    E.emit(st, { text: `${E.nm(st, seat)} discards the ${K.name(a.card)}.`, sound: 'place', seat, card: a.card });
    if (!st.hands[seat].length) return roundOver(st, seat);
    st.turn = E.next(st, seat);
    st.step = 'draw';
    st.took = null;
    // A stock that ran out a second time ends the round.
    if (!st.stock.length && st.turnedOver) return roundOver(st, null);
    return st;
  }

  function afterPlay(st, seat) {
    if (!st.hands[seat].length) return roundOver(st, seat);
    return st;
  }

  function deadwood(h) {
    return h.reduce((s, c) => s + K.pipValue(c), 0);
  }

  function roundOver(st, w) {
    st.turn = null;
    if (w === null) {
      st.history.push({ label: 'Round ' + st.round, points: st.names.map(() => 0) });
      st.phase = 'roundover';
      st.summary = { title: 'The stock ran out twice', note: 'No one went out, so the round scores nothing.', head: ['', 'Left in hand', 'Total'], rows: st.names.map((nm, i) => [nm, st.hands[i].map(K.label).join(' ') || '—', st.scores[i]]) };
      E.emit(st, { text: 'The stock is gone again. The round ends with no score.' });
      return st;
    }
    const won = st.hands.reduce((s, h, i) => s + (i === w ? 0 : deadwood(h)), 0);
    const row = st.names.map((_, i) => (i === w ? won : 0));
    st.scores = st.scores.map((s, i) => s + row[i]);
    st.history.push({ label: 'Round ' + st.round, points: row });
    const target = st.options.target || 100;
    const over = st.scores[w] >= target;
    st.phase = over ? 'gameover' : 'roundover';
    st.winners = over ? [w] : null;
    st.summary = {
      title: over ? `${E.nm(st, w)} wins the game` : `${E.nm(st, w)} goes out`,
      note: `${E.nm(st, w)} scores ${won} from the unmelded cards left in the other hands.`,
      head: ['', 'Left in hand', 'This round', 'Total'],
      rows: st.names.map((nm, i) => [nm, i === w ? '—' : `${st.hands[i].map(K.label).join(' ')} (${deadwood(st.hands[i])})`, row[i], st.scores[i]]),
    };
    E.emit(st, { text: `${E.nm(st, w)} goes out.`, sound: 'sweep', seat: w, count: 4 });
    return st;
  }

  function view(st, seat) {
    const v = E.baseView(st, seat);
    v.hand = st.hands[seat].slice();
    v.counts = st.hands.map((h) => h.length);
    v.melds = st.melds.map((m) => ({ cards: m.cards.slice(), owner: m.owner }));
    v.top = st.discard[st.discard.length - 1] || null;
    v.discardCount = st.discard.length;
    v.stock = st.stock.length;
    v.step = st.step;
    v.took = seat === st.turn ? st.took : null;
    v.turnedOver = st.turnedOver;
    v.dealer = st.dealer;
    v.target = st.options.target || 100;
    v.publicCards = [].concat(...st.melds.map((m) => m.cards), st.discard);
    return v;
  }

  const zones = (st) => [st.stock, st.discard, ...st.hands, ...st.melds.map((m) => m.cards)];

  C52.Games.register('rummy', { options, setup, actions, apply, view, zones, isSet, isRun, isMeld, deadwood });
})(typeof window !== 'undefined' ? window : globalThis);
