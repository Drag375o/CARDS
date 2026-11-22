/* 52 Cards — Contract Bridge (game 07), duplicate scoring.
 *
 * Seats: 0 South (you), 1 West, 2 North, 3 East — clockwise. North–South
 * (0 & 2) play against East–West (1 & 3). Dealer and vulnerability follow
 * the standard 16-board cycle.
 *
 * Auction: bid a level 1–7 and a strain (♣ ♦ ♥ ♠ NT), pass, double an
 * opponent's bid or redouble an opponent's double. Three passes after a
 * bid end it; four opening passes throw the board in. The declarer is the
 * player on the winning side who first named the strain. The player to
 * the declarer's left leads, then dummy (declarer's partner) lays down
 * their hand and declarer plays both. Score each board with standard
 * duplicate scoring; after the agreed number of boards the higher total
 * wins.
 */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const K = C52.Cards;
  const E = C52.Engine;
  const TR = C52.Tricks;

  const STRAINS = ['C', 'D', 'H', 'S', 'N'];
  const COMPASS = ['South', 'West', 'North', 'East'];
  const SYM = { C: '♣', D: '♦', H: '♥', S: '♠', N: 'NT' };
  const options = [
    { key: 'boards', label: 'Boards', default: 8, values: [{ value: 4, label: '4' }, { value: 8, label: '8' }, { value: 16, label: '16' }] },
  ];

  const side = (seat) => seat % 2; // 0 = North–South, 1 = East–West
  const partner = (seat) => (seat + 2) % 4;
  // Board 1: North deals, then East, South, West.
  const dealerOf = (b) => [2, 3, 0, 1][(b - 1) % 4];
  const VUL = ['None', 'NS', 'EW', 'Both', 'NS', 'EW', 'Both', 'None', 'EW', 'Both', 'None', 'NS', 'Both', 'None', 'NS', 'EW'];
  const vulOf = (b) => VUL[(b - 1) % 16];
  const isVul = (b, s) => {
    const v = vulOf(b);
    return v === 'Both' || (v === 'NS' && s === 0) || (v === 'EW' && s === 1);
  };
  const callText = (c) => (c.type === 'bid' ? c.level + SYM[c.strain] : c.type === 'pass' ? 'Pass' : c.type === 'double' ? 'Double' : 'Redouble');
  const contractText = (ct) => (ct ? `${ct.level}${SYM[ct.strain]}${ct.doubled === 2 ? ' doubled' : ct.doubled === 4 ? ' redoubled' : ''}` : '');

  /** Duplicate score for the declaring side (negative when the contract fails). */
  function score(level, strain, doubled, vul, tricks) {
    const need = 6 + level;
    const x = doubled || 1;
    if (tricks >= need) {
      const per = strain === 'C' || strain === 'D' ? 20 : 30;
      const trickScore = (strain === 'N' ? 40 + 30 * (level - 1) : per * level) * x;
      let s = trickScore;
      s += trickScore >= 100 ? (vul ? 500 : 300) : 50;
      if (level === 6) s += vul ? 750 : 500;
      if (level === 7) s += vul ? 1500 : 1000;
      if (x === 2) s += 50;
      if (x === 4) s += 100;
      const over = tricks - need;
      if (x === 1) s += over * (strain === 'N' ? 30 : per);
      else s += over * (vul ? 200 : 100) * (x / 2);
      return s;
    }
    const down = need - tricks;
    if (x === 1) return -down * (vul ? 100 : 50);
    let pen = 0;
    for (let i = 1; i <= down; i++) {
      if (vul) pen += i === 1 ? 200 : 300;
      else pen += i === 1 ? 100 : i <= 3 ? 200 : 300;
    }
    return -pen * (x / 2);
  }

  function setup(cfg, rng) {
    const st = E.base('bridge', cfg);
    st.boards = cfg.options.boards || 8;
    st.totals = [0, 0];
    newBoard(st, rng);
    return st;
  }

  function newBoard(st, rng) {
    st.round += 1;
    st.board = st.round;
    st.dealer = dealerOf(st.board);
    const deck = K.shuffle(K.makeDeck(), rng);
    st.hands = K.deal(deck, 4, 13).map((h) => TR.sortHand(h));
    st.auction = [];
    st.contract = null;
    st.declarer = null;
    st.dummy = null;
    st.dummyShown = false;
    st.trick = [];
    st.lastTrick = null;
    st.tricks = [0, 0];
    st.played = [];
    st.taken = [[], []];
    st.summary = null;
    st.phase = 'auction';
    st.turn = st.dealer;
    E.emit(st, { text: `Board ${st.board}. ${COMPASS[st.dealer]} deals. Vulnerable: ${vulOf(st.board) === 'None' ? 'nobody' : vulOf(st.board) === 'Both' ? 'both sides' : vulOf(st.board) === 'NS' ? 'North–South' : 'East–West'}.`, sound: 'deal', count: 52 });
  }

  /** The last bid, and the state of doubling on it. */
  function auctionState(st) {
    let lastBid = null;
    let lastBidder = null;
    let doubled = 1;
    st.auction.forEach((c) => {
      if (c.type === 'bid') {
        lastBid = c;
        lastBidder = c.seat;
        doubled = 1;
      } else if (c.type === 'double') doubled = 2;
      else if (c.type === 'redouble') doubled = 4;
    });
    return { lastBid, lastBidder, doubled };
  }

  const bidRank = (b) => (b.level - 1) * 5 + STRAINS.indexOf(b.strain);

  function controller(st) {
    if (st.phase !== 'play') return st.turn;
    return st.turn === st.dummy ? st.declarer : st.turn;
  }

  function actions(st, seat) {
    if (st.phase === 'roundover') return seat === 0 ? [{ type: 'next' }] : [];
    if (st.phase === 'auction') {
      if (seat !== st.turn) return [];
      const { lastBid, lastBidder, doubled } = auctionState(st);
      const out = [{ type: 'pass' }];
      const floor = lastBid ? bidRank(lastBid) : -1;
      for (let l = 1; l <= 7; l++) for (const s of STRAINS) if ((l - 1) * 5 + STRAINS.indexOf(s) > floor) out.push({ type: 'bid', level: l, strain: s });
      if (lastBid && side(lastBidder) !== side(seat) && doubled === 1) out.push({ type: 'double' });
      if (lastBid && side(lastBidder) === side(seat) && doubled === 2) out.push({ type: 'redouble' });
      return out;
    }
    if (st.phase === 'play') {
      if (seat !== controller(st)) return [];
      const hand = st.hands[st.turn];
      const led = st.trick.length ? st.trick[0].card[1] : null;
      return TR.follow(hand, led).map((c) => ({ type: 'play', card: c }));
    }
    return [];
  }

  function apply(st, seat, action, rng) {
    const a = E.legal(actions(st, seat), action);
    if (a.type === 'next') return newBoard(st, rng);
    if (st.phase === 'auction') {
      st.auction.push(Object.assign({ seat }, a));
      E.emit(st, { text: `${E.nm(st, seat)}: ${callText(a)}.`, sound: 'bid', seat });
      const calls = st.auction;
      const passesAtEnd = (() => {
        let n = 0;
        for (let i = calls.length - 1; i >= 0 && calls[i].type === 'pass'; i--) n++;
        return n;
      })();
      const anyBid = calls.some((c) => c.type === 'bid');
      if (!anyBid && calls.length === 4) return passedOut(st);
      if (anyBid && passesAtEnd === 3) return startPlay(st);
      st.turn = E.next(st, seat);
      return st;
    }
    // play
    const who = st.turn;
    K.take(st.hands[who], a.card);
    st.trick.push({ seat: who, card: a.card });
    E.emit(st, { text: `${E.nm(st, who)} plays the ${K.name(a.card)}.`, sound: 'place', seat: who, card: a.card });
    if (!st.dummyShown) {
      st.dummyShown = true;
      E.emit(st, { text: `${E.nm(st, st.dummy)} lays down the dummy.`, sound: 'meld', seat: st.dummy });
    }
    if (st.trick.length < 4) {
      st.turn = E.next(st, who);
      return st;
    }
    const trump = st.contract.strain === 'N' ? null : st.contract.strain;
    const w = TR.winner(st.trick, trump);
    st.tricks[side(w)] += 1;
    st.taken[side(w)].push(...st.trick.map((p) => p.card));
    st.played.push(...st.trick.map((p) => p.card));
    st.lastTrick = { plays: st.trick, winner: w };
    st.trick = [];
    st.turn = w;
    E.emit(st, { text: `${E.nm(st, w)} wins the trick.`, sound: 'sweep', seat: w, count: 4 });
    if (st.tricks[0] + st.tricks[1] === 13) boardOver(st);
    return st;
  }

  function startPlay(st) {
    const { lastBid, lastBidder, doubled } = auctionState(st);
    const s = side(lastBidder);
    const first = st.auction.find((c) => c.type === 'bid' && c.strain === lastBid.strain && side(c.seat) === s);
    st.declarer = first.seat;
    st.dummy = partner(st.declarer);
    st.contract = { level: lastBid.level, strain: lastBid.strain, doubled, by: st.declarer };
    st.phase = 'play';
    st.turn = E.next(st, st.declarer);
    E.emit(st, { text: `The contract is ${contractText(st.contract)} by ${E.nm(st, st.declarer)}. ${E.nm(st, st.turn)} leads.` });
  }

  function passedOut(st) {
    st.history.push({ label: 'Board ' + st.board, points: [0, 0] });
    E.emit(st, { text: 'All four pass. The board is thrown in.' });
    return finishBoard(st, { title: `Board ${st.board} is passed out`, note: 'Nobody opened the bidding, so the board scores nothing.', lines: [] });
  }

  function boardOver(st) {
    const ct = st.contract;
    const ds = side(st.declarer);
    const vul = isVul(st.board, ds);
    const taken = st.tricks[ds];
    const s = score(ct.level, ct.strain, ct.doubled, vul, taken);
    const pts = [0, 0];
    if (s >= 0) pts[ds] = s;
    else pts[1 - ds] = -s;
    st.totals = st.totals.map((t, i) => t + pts[i]);
    st.history.push({ label: 'Board ' + st.board, points: pts });
    const need = 6 + ct.level;
    const result = taken >= need ? (taken === need ? 'made exactly' : `made with ${taken - need} overtrick${taken - need > 1 ? 's' : ''}`) : `down ${need - taken}`;
    if (taken >= need && ct.level >= 6) E.emit(st, { text: `${ct.level === 7 ? 'A grand slam' : 'A small slam'} is made.`, sting: 'big' });
    E.emit(st, { text: `${contractText(ct)} ${result}.` });
    return finishBoard(st, {
      title: `${contractText(ct)} by ${E.nm(st, st.declarer)}: ${result}`,
      note: `${vul ? 'Vulnerable' : 'Not vulnerable'}. Declarer's side took ${taken} trick${taken === 1 ? '' : 's'}.`,
    });
  }

  function finishBoard(st, info) {
    st.turn = null;
    st.scores = [0, 1, 2, 3].map((s) => st.totals[side(s)]);
    const over = st.board >= st.boards;
    st.phase = over ? 'gameover' : 'roundover';
    if (over) {
      if (st.totals[0] === st.totals[1]) st.winners = [0, 1, 2, 3];
      else {
        const w = st.totals[0] > st.totals[1] ? 0 : 1;
        st.winners = [w, w + 2];
      }
    }
    const last = st.history[st.history.length - 1].points;
    st.summary = {
      title: over ? (st.totals[0] === st.totals[1] ? 'The match is drawn' : `${sideName(st, st.totals[0] > st.totals[1] ? 0 : 1)} win the match`) : info.title,
      note: over ? `${info.title}. Final totals after ${st.boards} boards.` : info.note,
      head: ['', 'This board', 'Total'],
      rows: [0, 1].map((s) => [sideName(st, s), last[s], st.totals[s]]),
      nextLabel: 'Next board',
    };
    return st;
  }

  const sideName = (st, s) => `${st.names[s]} & ${st.names[s + 2]}`;

  function view(st, seat) {
    const v = E.baseView(st, seat);
    v.hand = st.hands[seat].slice();
    v.counts = st.hands.map((h, i) => (st.dummyShown && i === st.dummy ? 0 : h.length));
    v.auction = st.auction.map((c) => ({ seat: c.seat, type: c.type, level: c.level || 0, strain: c.strain || null, text: callText(c) }));
    v.contract = st.contract ? Object.assign({}, st.contract, { text: contractText(st.contract) }) : null;
    v.declarer = st.declarer;
    v.dummy = st.dummy;
    v.dummyHand = st.dummyShown ? st.hands[st.dummy].slice() : null;
    v.trick = st.trick.slice();
    v.lastTrick = st.lastTrick;
    v.tricks = st.tricks.slice();
    v.board = st.board;
    v.boards = st.boards;
    v.dealer = st.dealer;
    v.vul = vulOf(st.board);
    v.compass = COMPASS;
    v.controller = controller(st);
    v.played = st.played.concat(st.trick.map((p) => p.card));
    v.publicCards = v.dummyHand || [];
    v.scoreHead = [sideName(st, 0), sideName(st, 1)];
    v.scoreTotals = st.totals.slice();
    return v;
  }

  const zones = (st) => [...st.hands, ...st.taken, st.trick.map((p) => p.card)];

  C52.Games.register('bridge', { options, setup, actions, apply, view, zones, score, auctionState, dealerOf, vulOf, isVul, SYM, STRAINS, side, partner });
})(typeof window !== 'undefined' ? window : globalThis);
