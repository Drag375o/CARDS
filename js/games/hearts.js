/* 52 Cards — Hearts (game 05). Four players, no partners.
 *
 * Pass three cards (left, right, across, then no pass, repeating). The 2♣
 * leads the first trick. Follow suit if you can. No Hearts or Q♠ on the
 * first trick unless you hold nothing else. Hearts can't be led until one
 * has been discarded (the Q♠ doesn't break them) unless you hold only
 * Hearts. Each Heart costs 1, the Q♠ 13. Take all 26 and everyone else
 * gets 26 instead. When someone reaches the target, the lowest score wins.
 */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const K = C52.Cards;
  const E = C52.Engine;
  const TR = C52.Tricks;

  const PASS = [
    { step: 1, name: 'left' },
    { step: 3, name: 'right' },
    { step: 2, name: 'across' },
    null,
  ];
  const points = (c) => (c[1] === 'H' ? 1 : c === 'QS' ? 13 : 0);
  const isPenalty = (c) => points(c) > 0;

  const options = [
    { key: 'target', label: 'Game ends at', default: 100, values: [{ value: 50, label: '50' }, { value: 100, label: '100' }] },
  ];

  function setup(cfg, rng) {
    const st = E.base('hearts', cfg);
    st.dealer = Math.floor(rng() * 4);
    deal(st, rng);
    return st;
  }

  function deal(st, rng) {
    st.round += 1;
    if (st.round > 1) st.dealer = E.next(st, st.dealer);
    const deck = K.shuffle(K.makeDeck(), rng);
    st.hands = K.deal(deck, 4, 13).map((h) => TR.sortHand(h));
    st.taken = [[], [], [], []];
    st.trick = [];
    st.lastTrick = null;
    st.tricks = 0;
    st.broken = false;
    st.received = [null, null, null, null];
    st.summary = null;
    st.pass = PASS[(st.round - 1) % 4];
    E.emit(st, { text: `Round ${st.round}. ${st.pass ? 'Pass three cards ' + st.pass.name + '.' : 'No passing this round.'}`, sound: 'deal', count: 52 });
    if (st.pass) {
      st.phase = 'pass';
      st.passes = [null, null, null, null];
      st.turn = null;
    } else startPlay(st);
  }

  function startPlay(st) {
    st.phase = 'play';
    st.turn = st.hands.findIndex((h) => h.includes('2C'));
    st.leader = st.turn;
    E.emit(st, { text: `${E.nm(st, st.turn)} holds the two of clubs and leads.` });
  }

  function legalCards(st, seat) {
    const hand = st.hands[seat];
    const first = st.tricks === 0;
    if (!st.trick.length) {
      if (first) return hand.includes('2C') ? ['2C'] : [];
      if (!st.broken) {
        const nonHearts = hand.filter((c) => c[1] !== 'H');
        if (nonHearts.length) return nonHearts;
      }
      return hand.slice();
    }
    let ok = TR.follow(hand, st.trick[0].card[1]);
    if (first) {
      const clean = ok.filter((c) => !isPenalty(c));
      if (clean.length) ok = clean;
    }
    return ok;
  }

  function actions(st, seat) {
    if (st.phase === 'roundover') return seat === 0 ? [{ type: 'next' }] : [];
    if (st.phase === 'pass') return st.passes[seat] ? [] : [{ type: 'pass', choose: 3 }];
    if (st.phase !== 'play' || seat !== st.turn) return [];
    return legalCards(st, seat).map((c) => ({ type: 'play', card: c }));
  }

  function apply(st, seat, action, rng) {
    if (action.type === 'pass' && st.phase === 'pass') {
      const cards = action.cards || [];
      if (st.passes[seat] || cards.length !== 3 || new Set(cards).size !== 3 || !cards.every((c) => st.hands[seat].includes(c))) throw new Error('Illegal pass');
      st.passes[seat] = cards.slice();
      E.emit(st, { text: `${E.nm(st, seat)} passes three cards.`, sound: 'draw', seat });
      if (st.passes.every(Boolean)) {
        st.passes.forEach((cs, s) => cs.forEach((c) => K.take(st.hands[s], c)));
        st.passes.forEach((cs, s) => {
          const to = E.next(st, s, st.pass.step);
          st.hands[to].push(...cs);
          st.received[to] = cs.slice();
        });
        st.hands = st.hands.map((h) => TR.sortHand(h));
        E.emit(st, { text: 'The passed cards change hands.', sound: 'deal', count: 12 });
        startPlay(st);
      }
      return st;
    }
    const a = E.legal(actions(st, seat), action);
    if (a.type === 'next') {
      deal(st, rng);
      return st;
    }
    K.take(st.hands[seat], a.card);
    st.trick.push({ seat, card: a.card });
    if (a.card[1] === 'H' && !st.broken) {
      st.broken = true;
      E.emit(st, { text: `${E.nm(st, seat)} plays the ${K.name(a.card)}. Hearts are broken.`, sound: 'place', seat, card: a.card });
    } else {
      E.emit(st, { text: `${E.nm(st, seat)} plays the ${K.name(a.card)}.`, sound: 'place', seat, card: a.card });
    }
    if (st.trick.length < 4) {
      st.turn = E.next(st, seat);
      return st;
    }
    const w = TR.winner(st.trick, null);
    const cards = st.trick.map((p) => p.card);
    st.taken[w].push(...cards);
    st.lastTrick = { plays: st.trick, winner: w };
    st.trick = [];
    st.tricks += 1;
    const pts = cards.reduce((s, c) => s + points(c), 0);
    E.emit(st, { text: `${E.nm(st, w)} takes the trick${pts ? ` (${pts} point${pts > 1 ? 's' : ''})` : ''}.`, sound: 'sweep', seat: w, count: 4 });
    st.turn = w;
    if (st.tricks === 13) roundOver(st);
    return st;
  }

  function roundOver(st) {
    let pts = st.taken.map((cs) => cs.reduce((s, c) => s + points(c), 0));
    const moon = pts.indexOf(26);
    let note = 'Hearts cost a point each, the queen of spades thirteen.';
    if (moon >= 0) {
      pts = pts.map((_, i) => (i === moon ? 0 : 26));
      note = `${E.nm(st, moon)} shot the moon! Everyone else takes 26.`;
      E.emit(st, { text: `${E.nm(st, moon)} shoots the moon.`, sting: 'big' });
    }
    st.scores = st.scores.map((s, i) => s + pts[i]);
    st.history.push({ label: 'Round ' + st.round, points: pts });
    st.turn = null;
    const target = st.options.target || 100;
    const over = st.scores.some((s) => s >= target);
    const low = Math.min(...st.scores);
    st.winners = over ? st.scores.map((s, i) => (s === low ? i : -1)).filter((i) => i >= 0) : null;
    st.phase = over ? 'gameover' : 'roundover';
    st.summary = {
      title: over ? `${E.andList(st.winners.map((w) => E.nm(st, w)))} ${st.winners.length > 1 ? 'share the win' : 'wins with the lowest score'}` : `Round ${st.round} scored`,
      note,
      head: ['', 'Hearts', 'Q♠', 'This round', 'Total'],
      rows: st.names.map((nm, i) => [nm, st.taken[i].filter((c) => c[1] === 'H').length, st.taken[i].includes('QS') ? 'Yes' : '', pts[i], st.scores[i]]),
    };
  }

  function view(st, seat) {
    const v = E.baseView(st, seat);
    v.hand = st.hands[seat].slice();
    v.counts = st.hands.map((h) => h.length);
    v.trick = st.trick.slice();
    v.lastTrick = st.lastTrick;
    v.broken = st.broken;
    v.pass = st.pass;
    v.passed = st.phase === 'pass' ? st.passes.map(Boolean) : null;
    v.received = st.received[seat];
    v.tricksTaken = st.taken.map((t) => t.length / 4);
    v.pointsTaken = st.taken.map((cs) => cs.reduce((s, c) => s + points(c), 0));
    v.played = [].concat(...st.taken, st.trick.map((p) => p.card));
    v.dealer = st.dealer;
    v.target = st.options.target || 100;
    return v;
  }

  const zones = (st) => [...st.hands, ...st.taken, st.trick.map((p) => p.card)];

  C52.Games.register('hearts', { options, setup, actions, apply, view, zones, points });
})(typeof window !== 'undefined' ? window : globalThis);
