/* 52 Cards — Twenty-Five (game 12), traditional Irish rules. 3–9 players.
 *
 * Five cards each; the next card is turned for trump. The A♥ is always a
 * trump. Trump order (high to low):
 *   Hearts:   5♥ J♥ A♥ K Q 10 9 8 7 6 4 3 2
 *   Diamonds: 5♦ J♦ A♥ A♦ K Q 10 9 8 7 6 4 3 2
 *   Black:    5 J A♥ A K Q 2 3 4 6 7 8 9 10
 * Plain suits: red K Q J 10 … 2 A; black K Q J A 2 … 10.
 *
 * Robbing: the holder of the trump ace may swap any card for the turned
 * card (the dealer may, if the turned card is an ace). Following: when a
 * plain suit is led you may follow suit or trump, and may play anything
 * only if you can do neither. When trump is led you must play a trump —
 * except that the 5, J and A♥ need not be played to a lower trump lead
 * ("reneging"). Each trick is worth 5; first to 25 wins at once.
 */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const K = C52.Cards;
  const E = C52.Engine;

  const options = [];

  function trumpOrder(t) {
    if (t === 'H') return ['5H', 'JH', 'AH', 'KH', 'QH', 'TH', '9H', '8H', '7H', '6H', '4H', '3H', '2H'];
    if (t === 'D') return ['5D', 'JD', 'AH', 'AD', 'KD', 'QD', 'TD', '9D', '8D', '7D', '6D', '4D', '3D', '2D'];
    return ['5', 'J', 'AH', 'A', 'K', 'Q', '2', '3', '4', '6', '7', '8', '9', 'T'].map((r) => (r === 'AH' ? 'AH' : r + t));
  }
  const PLAIN_RED = 'KQJT98765432A'; // high → low
  const PLAIN_BLACK = 'KQJA23456789T';

  const isTrump = (c, t) => c[1] === t || c === 'AH';
  const effSuit = (c, t) => (isTrump(c, t) ? t : c[1]);

  /** Strength for comparison: trumps 100+, plain cards by their suit's order. */
  function strength(c, t) {
    if (isTrump(c, t)) {
      const o = trumpOrder(t);
      return 100 + (o.length - o.indexOf(c));
    }
    const order = c[1] === 'H' || c[1] === 'D' ? PLAIN_RED : PLAIN_BLACK;
    return order.length - order.indexOf(c[0]);
  }

  function winner(plays, t) {
    const led = effSuit(plays[0].card, t);
    let best = plays[0];
    for (const p of plays.slice(1)) {
      const pt = isTrump(p.card, t);
      const bt = isTrump(best.card, t);
      if (pt && !bt) best = p;
      else if (pt === bt && effSuit(p.card, t) === effSuit(best.card, t) && strength(p.card, t) > strength(best.card, t)) best = p;
      else if (!pt && !bt && effSuit(p.card, t) === led && effSuit(best.card, t) !== led) best = p;
    }
    return best.seat;
  }

  const TOP3 = (t) => ['5' + t, 'J' + t, 'AH'];

  function legalCards(hand, trick, t) {
    if (!trick.length) return hand.slice();
    const lead = trick[0].card;
    const led = effSuit(lead, t);
    const trumps = hand.filter((c) => isTrump(c, t));
    if (led !== t) {
      const follow = hand.filter((c) => !isTrump(c, t) && c[1] === led);
      if (follow.length) return follow.concat(trumps);
      return hand.slice();
    }
    // Trump led: reneging cards that outrank the led card may be held back.
    const top = TOP3(t);
    const obliged = trumps.filter((c) => !(top.includes(c) && strength(c, t) > strength(lead, t)));
    if (obliged.length) return trumps;
    return hand.slice();
  }

  function setup(cfg, rng) {
    const st = E.base('twentyfive', cfg);
    st.dealer = Math.floor(rng() * cfg.n);
    st.out = [];
    deal(st, rng);
    return st;
  }

  function deal(st, rng) {
    st.round += 1;
    if (st.round > 1) st.dealer = E.next(st, st.dealer);
    const deck = K.shuffle(K.makeDeck(), rng);
    st.hands = K.deal(deck, st.n, 5);
    st.turned = K.draw(deck, 1)[0];
    st.trump = st.turned[1];
    st.stock = deck;
    st.out = [];
    st.hands = st.hands.map((h) => sortHand(h, st.trump));
    st.won = new Array(st.n).fill(0);
    st.taken = st.hands.map(() => []);
    st.trick = [];
    st.lastTrick = null;
    st.tricks = 0;
    st.summary = null;
    E.emit(st, { text: `Hand ${st.round}. The ${K.name(st.turned)} is turned: ${K.SUIT_NAME[st.trump]} are trump.`, sound: 'deal', count: st.n * 5 });
    // Who may rob?
    const ace = st.trump === 'H' ? 'AH' : 'A' + st.trump;
    st.robber = st.turned[0] === 'A' ? st.dealer : st.hands.findIndex((h) => h.includes(ace));
    if (st.robber >= 0) {
      st.phase = 'rob';
      st.turn = st.robber;
    } else startPlay(st);
  }

  function startPlay(st) {
    st.phase = 'play';
    st.turn = E.next(st, st.dealer);
  }

  function sortHand(h, t) {
    return h.slice().sort((a, b) => {
      const sa = effSuit(a, t) === t ? 'Z' : effSuit(a, t);
      const sb = effSuit(b, t) === t ? 'Z' : effSuit(b, t);
      return sa < sb ? -1 : sa > sb ? 1 : strength(a, t) - strength(b, t);
    });
  }

  function actions(st, seat) {
    if (st.phase === 'roundover') return seat === 0 ? [{ type: 'next' }] : [];
    if (seat !== st.turn) return [];
    if (st.phase === 'rob') return st.hands[seat].map((c) => ({ type: 'rob', card: c })).concat([{ type: 'norob' }]);
    if (st.phase === 'play') return legalCards(st.hands[seat], st.trick, st.trump).map((c) => ({ type: 'play', card: c }));
    return [];
  }

  function apply(st, seat, action, rng) {
    const a = E.legal(actions(st, seat), action);
    if (a.type === 'next') return deal(st, rng);
    if (a.type === 'norob') {
      E.emit(st, { text: `${E.nm(st, seat)} declines to rob.`, seat });
      startPlay(st);
      return st;
    }
    if (a.type === 'rob') {
      K.take(st.hands[seat], a.card);
      st.out.push(a.card);
      st.hands[seat].push(st.turned);
      st.hands[seat] = sortHand(st.hands[seat], st.trump);
      E.emit(st, { text: `${E.nm(st, seat)} robs the pack and takes the ${K.name(st.turned)}.`, sound: 'draw', seat });
      st.turned = null;
      startPlay(st);
      return st;
    }
    K.take(st.hands[seat], a.card);
    st.trick.push({ seat, card: a.card });
    E.emit(st, { text: `${E.nm(st, seat)} plays the ${K.name(a.card)}.`, sound: 'place', seat, card: a.card });
    if (st.trick.length < st.n) {
      st.turn = E.next(st, seat);
      return st;
    }
    const w = winner(st.trick, st.trump);
    st.won[w] += 1;
    st.scores[w] += 5;
    st.taken[w].push(...st.trick.map((p) => p.card));
    st.lastTrick = { plays: st.trick, winner: w };
    st.trick = [];
    st.tricks += 1;
    st.turn = w;
    E.emit(st, { text: `${E.nm(st, w)} takes the trick. ${st.scores[w]} points.`, sound: 'sweep', seat: w, count: st.n });
    if (st.scores[w] >= 25) return finish(st, w, true);
    if (st.tricks === 5) return finish(st, null, false);
    return st;
  }

  function finish(st, w, over) {
    const pts = st.won.map((n) => n * 5);
    st.history.push({ label: 'Hand ' + st.round, points: pts });
    st.turn = null;
    st.phase = over ? 'gameover' : 'roundover';
    st.winners = over ? [w] : null;
    st.summary = {
      title: over ? `${E.nm(st, w)} reaches 25` : `Hand ${st.round}: nobody has 25 yet`,
      note: over ? (st.won[w] === 5 ? 'All five tricks in one hand.' : 'Five points a trick.') : 'Deal again. Scores carry over.',
      head: ['', 'Tricks', 'This hand', 'Total'],
      rows: st.names.map((nm, i) => [nm, st.won[i], pts[i], st.scores[i]]),
    };
    if (over && st.won[w] === 5) E.emit(st, { sting: 'big' });
    return st;
  }

  function view(st, seat) {
    const v = E.baseView(st, seat);
    v.hand = st.hands[seat].slice();
    v.counts = st.hands.map((h) => h.length);
    v.trick = st.trick.slice();
    v.lastTrick = st.lastTrick;
    v.won = st.won.slice();
    v.trump = st.trump;
    v.turned = st.turned;
    v.robber = st.phase === 'rob' ? st.robber : null;
    v.dealer = st.dealer;
    v.played = [].concat(...st.taken, st.trick.map((p) => p.card));
    v.publicCards = st.turned ? [st.turned] : [];
    v.topTrumps = trumpOrder(st.trump).slice(0, 3).map(K.label);
    return v;
  }

  const zones = (st) => [...st.hands, ...st.taken, st.trick.map((p) => p.card), st.stock, st.out, st.turned ? [st.turned] : []];

  C52.Games.register('twentyfive', { options, setup, actions, apply, view, zones, trumpOrder, strength, isTrump, effSuit, winner, legalCards });
})(typeof window !== 'undefined' ? window : globalThis);
