/* 52 Cards — Crazy Eights (game 08).
 *
 * 2–4 players get 7 cards, 5–7 players get 5. Match the top card's suit or
 * rank; eights are wild and name the next suit. If you can't play, draw one
 * card: play it if you can, otherwise your turn ends. The first player out
 * scores what's left in the other hands (8 = 50, faces 10, A 1, others face
 * value). First to the target wins.
 */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const K = C52.Cards;
  const E = C52.Engine;

  const value = (c) => (c[0] === '8' ? 50 : K.pipValue(c));
  const handValue = (h) => h.reduce((s, c) => s + value(c), 0);

  const options = [
    { key: 'target', label: 'Play to', default: 100, values: [{ value: 100, label: '100' }, { value: 200, label: '200' }] },
  ];

  function setup(cfg, rng) {
    const st = E.base('crazy8', cfg);
    st.dealer = Math.floor(rng() * cfg.n);
    deal(st, rng);
    return st;
  }

  function deal(st, rng) {
    st.round += 1;
    st.dealer = st.round === 1 ? st.dealer : E.next(st, st.dealer);
    const deck = K.shuffle(K.makeDeck(), rng);
    const size = st.n <= 4 ? 7 : 5;
    st.hands = K.deal(deck, st.n, size).map((h) => K.sortHand(h, 'A23456789TJQK', 'SHCD'));
    // Starter: an eight goes back into the middle of the deck.
    let starter = K.draw(deck, 1)[0];
    while (starter[0] === '8') {
      deck.splice(Math.floor(deck.length / 2), 0, starter);
      starter = K.draw(deck, 1)[0];
    }
    st.stock = deck;
    st.discard = [starter];
    st.suit = starter[1];
    st.turn = E.next(st, st.dealer);
    st.drawn = null; // card drawn this turn, if any
    st.passes = 0;
    st.phase = 'play';
    st.summary = null;
    E.emit(st, { text: `${E.nm(st, st.dealer)} deals. The ${K.name(starter)} starts the pile.`, sound: 'deal', count: st.n * size });
  }

  const top = (st) => st.discard[st.discard.length - 1];
  const fits = (st, c) => c[0] === '8' || c[1] === st.suit || c[0] === top(st)[0];

  function playActions(st, cards) {
    const out = [];
    cards.forEach((c) => {
      if (!fits(st, c)) return;
      if (c[0] === '8') 'SHDC'.split('').forEach((s) => out.push({ type: 'play', card: c, suit: s }));
      else out.push({ type: 'play', card: c });
    });
    return out;
  }

  function actions(st, seat) {
    if (st.phase === 'roundover') return seat === 0 ? [{ type: 'next' }] : [];
    if (st.phase !== 'play' || seat !== st.turn) return [];
    if (st.drawn) return playActions(st, [st.drawn]).concat([{ type: 'pass' }]);
    const plays = playActions(st, st.hands[seat]);
    if (plays.length) return plays;
    if (st.stock.length || st.discard.length > 1) return [{ type: 'draw' }];
    return [{ type: 'pass' }];
  }

  function refill(st, rng) {
    if (st.stock.length || st.discard.length <= 1) return;
    const keep = st.discard.pop();
    st.stock = K.shuffle(st.discard, rng);
    st.discard = [keep];
    E.emit(st, { text: 'The discards are shuffled into a new draw pile.', sound: 'shuffle' });
  }

  function apply(st, seat, action, rng) {
    const a = E.legal(actions(st, seat), action);
    const name = E.nm(st, seat);
    if (a.type === 'next') return deal(st, rng);

    if (a.type === 'draw') {
      refill(st, rng);
      const c = K.draw(st.stock, 1)[0];
      st.hands[seat].push(c);
      st.hands[seat] = K.sortHand(st.hands[seat], 'A23456789TJQK', 'SHCD');
      E.emit(st, { text: `${name} draws a card.`, sound: 'draw', seat });
      if (fits(st, c)) st.drawn = c;
      else endTurn(st, seat, true);
      return st;
    }
    if (a.type === 'pass') {
      if (!st.drawn) st.passes += 1;
      E.emit(st, { text: `${name} passes.`, seat });
      st.drawn = null;
      if (st.passes >= st.n) return blocked(st);
      return endTurn(st, seat, false);
    }
    // play
    K.take(st.hands[seat], a.card);
    st.discard.push(a.card);
    st.passes = 0;
    st.drawn = null;
    if (a.card[0] === '8') {
      st.suit = a.suit;
      E.emit(st, { text: `${name} plays the ${K.name(a.card)} and calls ${K.SUIT_NAME[a.suit]}.`, sound: 'place', seat, card: a.card });
    } else {
      st.suit = a.card[1];
      E.emit(st, { text: `${name} plays the ${K.name(a.card)}.`, sound: 'place', seat, card: a.card });
    }
    if (!st.hands[seat].length) return roundOver(st, seat);
    if (st.hands[seat].length === 1) E.emit(st, { text: `${name} is down to one card.`, seat });
    return endTurn(st, seat, false);
  }

  function endTurn(st, seat) {
    st.drawn = null;
    st.turn = E.next(st, seat);
    return st;
  }

  function blocked(st) {
    // Nobody can move and there's nothing to draw: lowest hand wins.
    const vals = st.hands.map(handValue);
    const low = Math.min(...vals);
    const w = vals.indexOf(low);
    E.emit(st, { text: 'The game is blocked. The lowest hand takes the round.' });
    return roundOver(st, w);
  }

  function roundOver(st, w) {
    const pts = st.hands.map((h, i) => (i === w ? 0 : handValue(h)));
    const won = pts.reduce((a, b) => a + b, 0);
    const row = st.hands.map((_, i) => (i === w ? won : 0));
    st.scores = st.scores.map((s, i) => s + row[i]);
    st.history.push({ label: 'Round ' + st.round, points: row });
    st.turn = null;
    const target = st.options.target || 100;
    const over = st.scores[w] >= target;
    st.phase = over ? 'gameover' : 'roundover';
    st.winners = over ? [w] : null;
    st.summary = {
      title: over ? `${E.nm(st, w)} wins the game` : `${E.nm(st, w)} goes out`,
      note: `${E.nm(st, w)} scores ${won} from the cards left in the other hands.`,
      head: ['', 'Left in hand', 'This round', 'Total'],
      rows: st.names.map((nm, i) => [nm, i === w ? '—' : st.hands[i].map(K.label).join(' ') + ` (${pts[i]})`, row[i], st.scores[i]]),
    };
    E.emit(st, { text: st.summary.title + '.', sound: 'sweep', seat: w, count: 4 });
    return st;
  }

  function view(st, seat) {
    const v = E.baseView(st, seat);
    v.hand = st.hands[seat] ? st.hands[seat].slice() : [];
    v.counts = st.hands.map((h) => h.length);
    v.top = top(st);
    v.suit = st.suit;
    v.stock = st.stock.length;
    v.discardCount = st.discard.length;
    v.dealer = st.dealer;
    v.drawn = seat === st.turn ? st.drawn : null;
    v.target = st.options.target || 100;
    v.reveal = st.phase !== 'play' ? st.hands.map((h) => h.slice()) : null;
    return v;
  }

  const zones = (st) => [st.stock, st.discard, ...st.hands];

  C52.Games.register('crazy8', { options, setup, actions, apply, view, zones, value });
})(typeof window !== 'undefined' ? window : globalThis);
