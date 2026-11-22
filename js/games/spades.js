/* 52 Cards — Spades (game 06). Four players in two partnerships: seats
 * 0 & 2 against 1 & 3. Spades are always trump.
 *
 * Everyone bids 0–13 tricks (0 = Nil). The player left of the dealer leads;
 * spades can't be led until broken unless you hold only spades. A team
 * that makes its combined bid scores 10 per trick bid plus 1 per overtrick
 * ("bag"); every 10 bags costs 100. A missed bid loses 10 per trick bid.
 * Nil scores +100 if the bidder takes no tricks, −100 otherwise. First team
 * to the target wins; a team that falls to −200 loses.
 */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const K = C52.Cards;
  const E = C52.Engine;
  const TR = C52.Tricks;

  const options = [
    { key: 'target', label: 'Play to', default: 500, values: [{ value: 300, label: '300' }, { value: 500, label: '500' }] },
  ];

  const team = (seat) => seat % 2;
  const partner = (seat) => (seat + 2) % 4;

  function setup(cfg, rng) {
    const st = E.base('spades', cfg);
    st.teamScore = [0, 0];
    st.bags = [0, 0];
    st.dealer = Math.floor(rng() * 4);
    deal(st, rng);
    return st;
  }

  function deal(st, rng) {
    st.round += 1;
    if (st.round > 1) st.dealer = E.next(st, st.dealer);
    const deck = K.shuffle(K.makeDeck(), rng);
    st.hands = K.deal(deck, 4, 13).map((h) => TR.sortHand(h, 'S'));
    st.bids = [null, null, null, null];
    st.won = [0, 0, 0, 0];
    st.taken = [[], [], [], []];
    st.trick = [];
    st.lastTrick = null;
    st.tricks = 0;
    st.broken = false;
    st.summary = null;
    st.phase = 'bid';
    st.turn = E.next(st, st.dealer);
    E.emit(st, { text: `Round ${st.round}. ${E.nm(st, st.turn)} bids first.`, sound: 'deal', count: 52 });
  }

  function legalCards(st, seat) {
    const hand = st.hands[seat];
    if (!st.trick.length) {
      if (!st.broken) {
        const plain = hand.filter((c) => c[1] !== 'S');
        if (plain.length) return plain;
      }
      return hand.slice();
    }
    return TR.follow(hand, st.trick[0].card[1]);
  }

  function actions(st, seat) {
    if (st.phase === 'roundover') return seat === 0 ? [{ type: 'next' }] : [];
    if (seat !== st.turn) return [];
    if (st.phase === 'bid') return Array.from({ length: 14 }, (_, n) => ({ type: 'bid', n }));
    if (st.phase === 'play') return legalCards(st, seat).map((c) => ({ type: 'play', card: c }));
    return [];
  }

  function apply(st, seat, action, rng) {
    const a = E.legal(actions(st, seat), action);
    if (a.type === 'next') return deal(st, rng);
    if (a.type === 'bid') {
      st.bids[seat] = a.n;
      E.emit(st, { text: `${E.nm(st, seat)} bids ${a.n === 0 ? 'Nil' : a.n}.`, sound: 'bid', seat });
      st.turn = E.next(st, seat);
      if (st.bids.every((b) => b !== null)) {
        st.phase = 'play';
        st.turn = E.next(st, st.dealer);
        E.emit(st, { text: `Bidding is done. ${E.nm(st, st.turn)} leads.` });
      }
      return st;
    }
    K.take(st.hands[seat], a.card);
    st.trick.push({ seat, card: a.card });
    let text = `${E.nm(st, seat)} plays the ${K.name(a.card)}.`;
    if (a.card[1] === 'S' && !st.broken) {
      st.broken = true;
      text = `${E.nm(st, seat)} plays the ${K.name(a.card)}. Spades are broken.`;
    }
    E.emit(st, { text, sound: 'place', seat, card: a.card });
    if (st.trick.length < 4) {
      st.turn = E.next(st, seat);
      return st;
    }
    const w = TR.winner(st.trick, 'S');
    st.won[w] += 1;
    st.taken[w].push(...st.trick.map((p) => p.card));
    st.lastTrick = { plays: st.trick, winner: w };
    st.trick = [];
    st.tricks += 1;
    st.turn = w;
    E.emit(st, { text: `${E.nm(st, w)} takes the trick.`, sound: 'sweep', seat: w, count: 4 });
    if (st.tricks === 13) roundOver(st);
    return st;
  }

  /** Score one team's round. Returns { pts, bags, detail }. */
  function scoreTeam(st, t) {
    const seats = [t, t + 2];
    let pts = 0;
    let bags = 0;
    const notes = [];
    const contract = seats.filter((s) => st.bids[s] > 0);
    const bid = contract.reduce((s, x) => s + st.bids[x], 0);
    const made = contract.reduce((s, x) => s + st.won[x], 0);
    seats.forEach((s) => {
      if (st.bids[s] === 0) {
        if (st.won[s] === 0) {
          pts += 100;
          notes.push(`${E.nm(st, s)} makes Nil`);
        } else {
          pts -= 100 - st.won[s]; // a failed Nil's tricks still count as bags
          bags += st.won[s];
          notes.push(`${E.nm(st, s)} fails Nil`);
        }
      }
    });
    if (bid > 0) {
      if (made >= bid) {
        pts += bid * 10 + (made - bid);
        bags += made - bid;
      } else {
        pts -= bid * 10;
        notes.push('set');
      }
    }
    return { pts, bags, bid, made, notes };
  }

  function roundOver(st) {
    const res = [0, 1].map((t) => scoreTeam(st, t));
    const notes = [];
    res.forEach((r, t) => {
      st.bags[t] += r.bags;
      let pts = r.pts;
      if (st.bags[t] >= 10) {
        st.bags[t] -= 10;
        pts -= 100;
        notes.push(`${teamName(st, t)} lose 100 for ten bags.`);
      }
      r.total = pts;
      st.teamScore[t] += pts;
    });
    st.history.push({ label: 'Round ' + st.round, points: res.map((r) => r.total) });
    st.scores = [0, 1, 2, 3].map((s) => st.teamScore[team(s)]);
    st.turn = null;
    const target = st.options.target || 500;
    const [a, b] = st.teamScore;
    let winner = null;
    if (a <= -200 && b > a) winner = 1;
    else if (b <= -200 && a > b) winner = 0;
    else if ((a >= target || b >= target) && a !== b) winner = a > b ? 0 : 1;
    st.phase = winner === null ? 'roundover' : 'gameover';
    st.winners = winner === null ? null : [winner, winner + 2];
    st.summary = {
      title: winner === null ? `Round ${st.round} scored` : `${teamName(st, winner)} win the game`,
      note: notes.concat(res.flatMap((r) => r.notes.filter((n) => n !== 'set'))).join(' ') || 'Ten points a trick bid, one for each bag.',
      head: ['', 'Bid', 'Took', 'Round', 'Bags', 'Total'],
      rows: [0, 1].map((t) => [teamName(st, t), bidText(st, t), st.won[t] + st.won[t + 2], res[t].total, st.bags[t], st.teamScore[t]]),
    };
    if (res.some((r) => r.notes.some((n) => n.includes('makes Nil')))) E.emit(st, { text: 'A Nil bid is made.', sting: 'big' });
  }

  const teamName = (st, t) => `${st.names[t]} & ${st.names[t + 2]}`;
  const bidText = (st, t) => [t, t + 2].map((s) => (st.bids[s] === 0 ? 'Nil' : st.bids[s])).join(' + ');

  function view(st, seat) {
    const v = E.baseView(st, seat);
    v.hand = st.hands[seat].slice();
    v.counts = st.hands.map((h) => h.length);
    v.trick = st.trick.slice();
    v.lastTrick = st.lastTrick;
    v.bids = st.bids.slice();
    v.won = st.won.slice();
    v.broken = st.broken;
    v.teamScore = st.teamScore.slice();
    v.bags = st.bags.slice();
    v.dealer = st.dealer;
    v.target = st.options.target || 500;
    v.played = [].concat(...st.taken, st.trick.map((p) => p.card));
    v.scoreHead = [teamName(st, 0), teamName(st, 1)];
    v.scoreTotals = st.teamScore.slice();
    v.handSize = 13;
    return v;
  }

  const zones = (st) => [...st.hands, ...st.taken, st.trick.map((p) => p.card)];

  C52.Games.register('spades', { options, setup, actions, apply, view, zones, scoreTeam, team, partner });
})(typeof window !== 'undefined' ? window : globalThis);
