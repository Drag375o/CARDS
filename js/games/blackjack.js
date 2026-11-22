/* 52 Cards — Blackjack (game 02). 1–7 players against the house.
 *
 * One 52-card deck, reshuffled when fewer than 15 cards remain. Each player
 * bets, then gets two cards face up; the dealer takes one up and one down,
 * and peeks for blackjack when showing an ace or a ten. Hit, stand, double
 * (any first two cards) or split a pair once (split aces get one card
 * each; 21 after a split is not a blackjack). The dealer hits 16 or less
 * and stands on 17 (choose whether a soft 17 hits). Blackjack pays 3:2,
 * wins 1:1, ties push. No insurance or surrender. The player with the
 * most chips after the agreed number of hands wins.
 */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const K = C52.Cards;
  const E = C52.Engine;

  const BETS = [10, 25, 50, 100];
  const options = [
    { key: 'soft17', label: 'Dealer on soft 17', default: 'stand', values: [{ value: 'stand', label: 'Stands' }, { value: 'hit', label: 'Hits' }] },
    { key: 'hands', label: 'Hands to play', default: 10, values: [{ value: 10, label: '10' }, { value: 20, label: '20' }, { value: 40, label: '40' }] },
    { key: 'chips', label: 'Starting chips', default: 1000, values: [{ value: 500, label: '500' }, { value: 1000, label: '1,000' }] },
  ];

  function total(cards) {
    let t = 0;
    let aces = 0;
    cards.forEach((c) => {
      t += K.pipValue(c);
      if (c[0] === 'A') aces++;
    });
    const soft = aces > 0 && t + 10 <= 21;
    return { total: soft ? t + 10 : t, soft };
  }
  const isBJ = (cards) => cards.length === 2 && total(cards).total === 21;
  const ten = (c) => K.pipValue(c) === 10;

  function setup(cfg, rng) {
    RNG = rng;
    const st = E.base('blackjack', cfg);
    st.chips = new Array(cfg.n).fill(cfg.options.chips || 1000);
    st.shoe = K.shuffle(K.makeDeck(), rng);
    st.used = [];
    st.dealer = [];
    st.seats = st.names.map(() => ({ hands: [], bet: 0, out: false }));
    st.limit = cfg.options.hands || 10;
    newHand(st, rng);
    return st;
  }

  function newHand(st, rng) {
    st.round += 1;
    // Collect the last hand's cards.
    st.seats.forEach((s) => s.hands.forEach((h) => st.used.push(...h.cards)));
    st.used.push(...st.dealer);
    st.dealer = [];
    st.revealed = false;
    st.seats.forEach((s, i) => {
      s.hands = [];
      s.bet = 0;
      s.out = st.chips[i] < BETS[0];
    });
    if (st.shoe.length < 15) {
      st.shoe = K.shuffle(st.shoe.concat(st.used), rng);
      st.used = [];
      E.emit(st, { text: 'The dealer shuffles a fresh deck.', sound: 'shuffle' });
    }
    st.summary = null;
    st.phase = 'bet';
    st.turn = null;
    st.active = null;
    E.emit(st, { text: `Hand ${st.round} of ${st.limit}. Place your bets.` });
  }

  let RNG = Math.random; // the current match's generator, set on every call in

  /** Next card from the shoe; if it runs dry mid-hand, the played cards are shuffled back in. */
  function draw(st) {
    if (!st.shoe.length) {
      st.shoe = K.shuffle(st.used, RNG);
      st.used = [];
      E.emit(st, { text: 'The deck runs out. The dealer shuffles the played cards.', sound: 'shuffle' });
    }
    return st.shoe.pop();
  }

  function actions(st, seat) {
    if (st.phase === 'roundover') return seat === 0 ? [{ type: 'next' }] : [];
    const s = st.seats[seat];
    if (st.phase === 'bet') {
      if (s.out || s.bet) return [];
      return BETS.filter((b) => b <= st.chips[seat]).map((b) => ({ type: 'bet', amount: b }));
    }
    if (st.phase !== 'play' || seat !== st.turn) return [];
    const h = s.hands[st.active];
    const out = [{ type: 'hit' }, { type: 'stand' }];
    const committed = s.hands.reduce((a, x) => a + x.bet, 0);
    const free = st.chips[seat] - committed;
    if (h.cards.length === 2 && !h.fromAces && free >= h.bet) out.push({ type: 'double' });
    if (h.cards.length === 2 && s.hands.length === 1 && h.cards[0][0] === h.cards[1][0] && free >= h.bet) out.push({ type: 'split' });
    return out;
  }

  function apply(st, seat, action, rng) {
    if (rng) RNG = rng;
    const a = E.legal(actions(st, seat), action);
    const name = E.nm(st, seat);
    if (a.type === 'next') {
      newHand(st, rng);
      return st;
    }
    if (a.type === 'bet') {
      st.seats[seat].bet = a.amount;
      E.emit(st, { text: `${name} bets ${a.amount}.`, sound: 'chips', seat, count: Math.min(5, a.amount / 10) });
      if (st.seats.every((s) => s.out || s.bet)) deal(st);
      return st;
    }
    const s = st.seats[seat];
    const h = s.hands[st.active];
    if (a.type === 'hit') {
      h.cards.push(draw(st));
      const t = total(h.cards).total;
      E.emit(st, { text: `${name} hits: ${t > 21 ? 'bust with ' + t : t}.`, sound: 'shoe', seat });
      if (t >= 21) h.done = true;
    } else if (a.type === 'stand') {
      h.done = true;
      E.emit(st, { text: `${name} stands on ${total(h.cards).total}.`, seat });
    } else if (a.type === 'double') {
      h.bet *= 2;
      h.cards.push(draw(st));
      h.done = true;
      h.doubled = true;
      E.emit(st, { text: `${name} doubles down: ${total(h.cards).total}.`, sound: 'chips', seat, count: 4 });
    } else if (a.type === 'split') {
      const [c1, c2] = h.cards;
      const aces = c1[0] === 'A';
      s.hands = [
        { cards: [c1, draw(st)], bet: h.bet, split: true, fromAces: aces, done: aces },
        { cards: [c2, draw(st)], bet: h.bet, split: true, fromAces: aces, done: aces },
      ];
      E.emit(st, { text: `${name} splits the ${K.RANK_NAME[c1[0]]}s.`, sound: 'chips', seat, count: 3 });
      s.hands.forEach((x) => total(x.cards).total === 21 && (x.done = true));
      st.active = 0;
    }
    advance(st);
    return st;
  }

  function deal(st) {
    const players = st.seats.map((s, i) => i).filter((i) => !st.seats[i].out);
    players.forEach((i) => (st.seats[i].hands = [{ cards: [], bet: st.seats[i].bet }]));
    for (let r = 0; r < 2; r++) {
      players.forEach((i) => st.seats[i].hands[0].cards.push(draw(st)));
      st.dealer.push(draw(st));
    }
    E.emit(st, { text: `The dealer shows the ${K.name(st.dealer[0])}.`, sound: 'deal', count: players.length * 2 + 2 });
    players.forEach((i) => {
      const h = st.seats[i].hands[0];
      if (isBJ(h.cards)) {
        h.done = true;
        E.emit(st, { text: `${E.nm(st, i)} has blackjack!`, seat: i });
      }
    });
    // Peek for dealer blackjack.
    if ((st.dealer[0][0] === 'A' || ten(st.dealer[0])) && isBJ(st.dealer)) {
      st.revealed = true;
      E.emit(st, { text: 'The dealer checks the hole card... blackjack.', sound: 'flip' });
      return settle(st);
    }
    st.phase = 'play';
    st.turn = null;
    st.active = 0;
    advance(st, true);
  }

  /** Move to the next hand still to be played, or to the dealer. */
  function advance(st, fresh) {
    const order = st.seats.map((_, i) => i);
    let seat = fresh ? -1 : st.turn;
    if (!fresh) {
      const s = st.seats[seat];
      const next = s.hands.findIndex((h) => !h.done);
      if (next >= 0) {
        st.active = next;
        return;
      }
    }
    for (const i of order) {
      if (i <= seat) continue;
      const s = st.seats[i];
      if (s.out) continue;
      const k = s.hands.findIndex((h) => !h.done);
      if (k >= 0) {
        st.turn = i;
        st.active = k;
        return;
      }
    }
    dealerPlays(st);
  }

  function dealerPlays(st) {
    st.turn = null;
    st.revealed = true;
    E.emit(st, { text: `The dealer turns over the ${K.name(st.dealer[1])}: ${total(st.dealer).total}.`, sound: 'flip' });
    const live = st.seats.some((s) => s.hands.some((h) => total(h.cards).total <= 21 && !(isBJ(h.cards) && !h.split)));
    if (live) {
      for (;;) {
        const t = total(st.dealer);
        if (t.total < 17 || (t.total === 17 && t.soft && st.options.soft17 === 'hit')) {
          st.dealer.push(draw(st));
          E.emit(st, { text: `The dealer draws: ${total(st.dealer).total}.`, sound: 'shoe' });
        } else break;
      }
    }
    settle(st);
  }

  function settle(st) {
    st.revealed = true;
    const d = total(st.dealer).total;
    const dBJ = isBJ(st.dealer);
    const rows = [];
    const net = st.seats.map((s, i) => {
      if (s.out) {
        rows.push([st.names[i], 'Sitting out', '', st.chips[i]]);
        return 0;
      }
      let sum = 0;
      const notes = [];
      s.hands.forEach((h) => {
        const t = total(h.cards).total;
        const bj = isBJ(h.cards) && !h.split;
        let r;
        if (bj && !dBJ) {
          r = Math.floor(h.bet * 1.5);
          notes.push('Blackjack');
        } else if (dBJ) {
          r = bj ? 0 : -h.bet;
          notes.push(bj ? 'Push' : 'Dealer blackjack');
        } else if (t > 21) {
          r = -h.bet;
          notes.push('Bust ' + t);
        } else if (d > 21 || t > d) {
          r = h.bet;
          notes.push('Win ' + t);
        } else if (t === d) {
          r = 0;
          notes.push('Push ' + t);
        } else {
          r = -h.bet;
          notes.push('Lose ' + t);
        }
        sum += r;
      });
      st.chips[i] += sum;
      rows.push([st.names[i], notes.join(', '), (sum > 0 ? '+' : '') + sum, st.chips[i]]);
      return sum;
    });
    st.scores = st.chips.slice();
    st.history.push({ label: 'Hand ' + st.round, points: net });
    st.phase = 'roundover';
    st.turn = null;
    const allBroke = st.chips.every((c) => c < BETS[0]);
    const over = st.round >= st.limit || allBroke || st.chips[0] < BETS[0];
    if (over) {
      const hi = Math.max(...st.chips);
      st.phase = 'gameover';
      st.winners = st.chips.map((c, i) => (c === hi ? i : -1)).filter((i) => i >= 0);
    }
    st.summary = {
      title: over ? `${E.andList(st.winners.map((w) => E.nm(st, w)))} ${st.winners.length > 1 ? 'finish level on top' : 'leaves with the most chips'}` : `Dealer ${d > 21 ? 'busts with ' + d : dBJ ? 'has blackjack' : 'stands on ' + d}`,
      note: over ? (st.chips[0] < BETS[0] && st.round < st.limit ? 'You are out of chips.' : `After ${st.round} hands.`) : 'Blackjack pays 3 to 2.',
      head: ['', 'Result', 'Chips won', 'Chips'],
      rows,
    };
    if (net.some((x) => x > 0)) E.emit(st, { sound: 'rake', text: st.summary.title + '.' });
    else E.emit(st, { text: st.summary.title + '.' });
  }

  function view(st, seat) {
    const v = E.baseView(st, seat);
    v.hand = [];
    v.chips = st.chips.slice();
    v.dealer = st.revealed ? st.dealer.slice() : st.dealer.slice(0, 1);
    v.dealerHidden = !st.revealed && st.dealer.length > 1;
    v.dealerTotal = st.revealed ? total(st.dealer).total : st.dealer.length ? total(st.dealer.slice(0, 1)).total : null;
    v.seats = st.seats.map((s) => ({ out: s.out, bet: s.bet, hands: s.hands.map((h) => ({ cards: h.cards.slice(), bet: h.bet, done: !!h.done, split: !!h.split, total: total(h.cards).total, soft: total(h.cards).soft })) }));
    v.active = st.active;
    v.shoe = st.shoe.length;
    v.limit = st.limit;
    v.soft17 = st.options.soft17 || 'stand';
    v.bets = BETS;
    v.seen = st.used.slice(); // cards already played this deck (for counting)
    v.publicCards = [].concat(...st.seats.map((s) => [].concat(...s.hands.map((h) => h.cards))), v.dealer, st.used);
    return v;
  }

  const zones = (st) => [st.shoe, st.used, st.dealer, ...st.seats.map((s) => [].concat(...s.hands.map((h) => h.cards)))];

  C52.Games.register('blackjack', { options, setup, actions, apply, view, zones, total, isBJ });
})(typeof window !== 'undefined' ? window : globalThis);
