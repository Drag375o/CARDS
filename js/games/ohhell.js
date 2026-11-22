/* 52 Cards — Oh Hell (game 11). 3–7 players, no partners.
 *
 * Hands grow by one card each round, from 1 up to the largest the deck
 * allows with one card left over to turn up for trump (17 with 3 players,
 * 12 with 4, 10 with 5, 8 with 6, 7 with 7). Everyone bids exactly how many
 * tricks they will take; the dealer bids last and may not make the bids
 * add up to the number of tricks. Follow suit; trumps win. An exact bid
 * scores 10 + the bid, anything else 0. Highest total after the last
 * round wins.
 */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const K = C52.Cards;
  const E = C52.Engine;
  const TR = C52.Tricks;

  const options = [
    {
      key: 'length', label: 'Hands go up to', default: 'full',
      values: [{ value: 'full', label: 'Full deck' }, { value: 10, label: '10 cards' }, { value: 7, label: '7 cards' }],
    },
  ];

  const maxHand = (n) => Math.floor(51 / n);

  function setup(cfg, rng) {
    const st = E.base('ohhell', cfg);
    const full = maxHand(cfg.n);
    st.rounds = cfg.options.length === 'full' || !cfg.options.length ? full : Math.min(full, Number(cfg.options.length));
    st.dealer = Math.floor(rng() * cfg.n);
    deal(st, rng);
    return st;
  }

  function deal(st, rng) {
    st.round += 1;
    if (st.round > 1) st.dealer = E.next(st, st.dealer);
    const size = st.round;
    const deck = K.shuffle(K.makeDeck(), rng);
    st.hands = K.deal(deck, st.n, size);
    st.trumpCard = K.draw(deck, 1)[0];
    st.trump = st.trumpCard[1];
    st.hands = st.hands.map((h) => TR.sortHand(h, st.trump));
    st.stock = deck;
    st.size = size;
    st.bids = new Array(st.n).fill(null);
    st.won = new Array(st.n).fill(0);
    st.taken = st.hands.map(() => []);
    st.trick = [];
    st.lastTrick = null;
    st.tricks = 0;
    st.summary = null;
    st.phase = 'bid';
    st.turn = E.next(st, st.dealer);
    E.emit(st, {
      text: `Round ${st.round} of ${st.rounds}: ${size} card${size > 1 ? 's' : ''} each. The ${K.name(st.trumpCard)} is turned: ${K.SUIT_NAME[st.trump]} are trump.`,
      sound: 'deal',
      count: size * st.n,
    });
  }

  function actions(st, seat) {
    if (st.phase === 'roundover') return seat === 0 ? [{ type: 'next' }] : [];
    if (seat !== st.turn) return [];
    if (st.phase === 'bid') {
      const out = [];
      const isDealer = seat === st.dealer;
      const sum = st.bids.reduce((s, b) => s + (b || 0), 0);
      for (let n = 0; n <= st.size; n++) if (!(isDealer && sum + n === st.size)) out.push({ type: 'bid', n });
      return out;
    }
    if (st.phase === 'play') {
      const led = st.trick.length ? st.trick[0].card[1] : null;
      return TR.follow(st.hands[seat], led).map((c) => ({ type: 'play', card: c }));
    }
    return [];
  }

  function apply(st, seat, action, rng) {
    const a = E.legal(actions(st, seat), action);
    if (a.type === 'next') return deal(st, rng);
    if (a.type === 'bid') {
      st.bids[seat] = a.n;
      E.emit(st, { text: `${E.nm(st, seat)} bids ${a.n}.`, sound: 'bid', seat });
      if (st.bids.every((b) => b !== null)) {
        st.phase = 'play';
        st.turn = E.next(st, st.dealer);
        const sum = st.bids.reduce((s, b) => s + b, 0);
        E.emit(st, { text: `Bids total ${sum} for ${st.size} trick${st.size > 1 ? 's' : ''}. ${E.nm(st, st.turn)} leads.` });
      } else st.turn = E.next(st, seat);
      return st;
    }
    K.take(st.hands[seat], a.card);
    st.trick.push({ seat, card: a.card });
    E.emit(st, { text: `${E.nm(st, seat)} plays the ${K.name(a.card)}.`, sound: 'place', seat, card: a.card });
    if (st.trick.length < st.n) {
      st.turn = E.next(st, seat);
      return st;
    }
    const w = TR.winner(st.trick, st.trump);
    st.won[w] += 1;
    st.taken[w].push(...st.trick.map((p) => p.card));
    st.lastTrick = { plays: st.trick, winner: w };
    st.trick = [];
    st.tricks += 1;
    st.turn = w;
    E.emit(st, { text: `${E.nm(st, w)} takes the trick.`, sound: 'sweep', seat: w, count: st.n });
    if (st.tricks === st.size) roundOver(st);
    return st;
  }

  function roundOver(st) {
    const pts = st.bids.map((b, i) => (st.won[i] === b ? 10 + b : 0));
    st.scores = st.scores.map((s, i) => s + pts[i]);
    st.history.push({ label: `Round ${st.round} (${st.size})`, points: pts });
    st.turn = null;
    const over = st.round >= st.rounds;
    const hi = Math.max(...st.scores);
    st.winners = over ? st.scores.map((s, i) => (s === hi ? i : -1)).filter((i) => i >= 0) : null;
    st.phase = over ? 'gameover' : 'roundover';
    const exact = st.bids.filter((b, i) => st.won[i] === b).length;
    st.summary = {
      title: over ? `${E.andList(st.winners.map((w) => E.nm(st, w)))} ${st.winners.length > 1 ? 'share the win' : 'wins'}` : `Round ${st.round} of ${st.rounds} scored`,
      note: `${exact} of ${st.n} made their bid exactly.`,
      head: ['', 'Bid', 'Took', 'This round', 'Total'],
      rows: st.names.map((nm, i) => [nm, st.bids[i], st.won[i], pts[i], st.scores[i]]),
    };
  }

  function view(st, seat) {
    const v = E.baseView(st, seat);
    v.hand = st.hands[seat].slice();
    v.counts = st.hands.map((h) => h.length);
    v.trick = st.trick.slice();
    v.lastTrick = st.lastTrick;
    v.bids = st.bids.slice();
    v.won = st.won.slice();
    v.trump = st.trump;
    v.trumpCard = st.trumpCard;
    v.size = st.size;
    v.handSize = st.size;
    v.rounds = st.rounds;
    v.dealer = st.dealer;
    v.played = [].concat(...st.taken, st.trick.map((p) => p.card));
    v.publicCards = [st.trumpCard];
    return v;
  }

  const zones = (st) => [...st.hands, ...st.taken, st.trick.map((p) => p.card), st.stock, [st.trumpCard]];

  C52.Games.register('ohhell', { options, setup, actions, apply, view, zones, maxHand });
})(typeof window !== 'undefined' ? window : globalThis);
