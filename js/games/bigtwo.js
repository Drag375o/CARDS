/* 52 Cards — Big Two (game 09). 2–4 players.
 *
 * Ranks 3 (low) … K A 2 (high); suits ♦ < ♣ < ♥ < ♠. Play singles, pairs,
 * triples or five-card hands (straight < flush < full house < four of a
 * kind + 1 < straight flush). Straights don't wrap and can't contain a 2;
 * the highest is 10-J-Q-K-A. Beat the last play with the same number of
 * cards, or pass — once you pass you're out until the pile is won and a
 * new lead begins. The lowest card dealt (the 3♦ with 3–4 players) must be
 * in the first play. First to empty their hand wins the round.
 *
 * Deal: 13 each with 4 players; 17 each with 3 (the 3♦ holder also takes
 * the last card); 13 each with 2 (the rest stay out of play).
 */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const K = C52.Cards;
  const E = C52.Engine;

  const ORDER = '3456789TJQKA2';
  const SUITS = 'DCHS';
  const val = (c) => ORDER.indexOf(c[0]) * 4 + SUITS.indexOf(c[1]);
  const rnk = (c) => ORDER.indexOf(c[0]);
  const sortHand = (h) => h.slice().sort((a, b) => val(a) - val(b));
  const FIVE = ['', 'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush'];

  const options = [
    { key: 'rounds', label: 'Match', default: 1, values: [{ value: 1, label: 'One round' }, { value: 5, label: 'Five rounds' }] },
  ];

  /** Describe a set of cards as a Big Two combination, or null. */
  function combo(cards) {
    const n = cards.length;
    if (![1, 2, 3, 5].includes(n) || new Set(cards).size !== n) return null;
    const cs = sortHand(cards);
    const top = val(cs[n - 1]);
    const sameRank = cs.every((c) => c[0] === cs[0][0]);
    if (n === 1) return { size: 1, kind: 0, key: top, name: 'Single' };
    if (n === 2) return sameRank ? { size: 2, kind: 0, key: top, name: 'Pair' } : null;
    if (n === 3) return sameRank ? { size: 3, kind: 0, key: rnk(cs[0]), name: 'Three of a kind' } : null;
    // Five cards.
    const counts = {};
    cs.forEach((c) => (counts[c[0]] = (counts[c[0]] || 0) + 1));
    const groups = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const flush = cs.every((c) => c[1] === cs[0][1]);
    const rs = cs.map(rnk);
    const straight = groups.length === 5 && !cs.some((c) => c[0] === '2') && rs[4] - rs[0] === 4;
    let kind = 0;
    let key = top;
    if (straight && flush) kind = 5;
    else if (groups[0][1] === 4) {
      kind = 4;
      key = ORDER.indexOf(groups[0][0]);
    } else if (groups[0][1] === 3 && groups[1][1] === 2) {
      kind = 3;
      key = ORDER.indexOf(groups[0][0]);
    } else if (flush) kind = 2;
    else if (straight) kind = 1;
    else return null;
    return { size: 5, kind, key, name: FIVE[kind] };
  }

  function beats(a, b) {
    if (!b) return true;
    if (a.size !== b.size) return false;
    if (a.size === 5 && a.kind !== b.kind) return a.kind > b.kind;
    return a.key > b.key;
  }

  /** Can these cards be played now? Works from a view as well as the state. */
  function check(v, cards) {
    const c = combo(cards);
    if (!c) return { ok: false, why: 'That is not a valid combination.' };
    if (!cards.every((x) => v.hand.includes(x))) return { ok: false, why: 'Not your cards.' };
    if (v.startCard && !cards.includes(v.startCard)) return { ok: false, why: `The first play must include the ${K.name(v.startCard)}.` };
    if (v.pile && !beats(c, v.pile.combo)) return { ok: false, why: v.pile.combo.size !== c.size ? `Play ${v.pile.combo.size} card${v.pile.combo.size > 1 ? 's' : ''} to match.` : 'That does not beat the last play.' };
    return { ok: true, combo: c };
  }

  function setup(cfg, rng) {
    const st = E.base('bigtwo', cfg);
    st.penalty = new Array(cfg.n).fill(0);
    deal(st, rng);
    return st;
  }

  function deal(st, rng) {
    st.round += 1;
    const deck = K.shuffle(K.makeDeck(), rng);
    const size = st.n === 3 ? 17 : 13;
    st.hands = K.deal(deck, st.n, size);
    st.out = [];
    if (st.n === 3) {
      // The 3♦ holder takes the last card; if the last card is the 3♦, the holder of the lowest card does.
      let holder = st.hands.findIndex((h) => h.includes('3D'));
      if (holder < 0) {
        const low = sortHand([].concat(...st.hands))[0];
        holder = st.hands.findIndex((h) => h.includes(low));
      }
      st.hands[holder].push(K.draw(deck, 1)[0]);
    } else st.out = deck.splice(0);
    st.hands = st.hands.map(sortHand);
    // The lowest card dealt starts.
    const all = [].concat(...st.hands);
    st.startCard = sortHand(all)[0];
    st.turn = st.hands.findIndex((h) => h.includes(st.startCard));
    st.pile = null;
    st.passed = new Array(st.n).fill(false);
    st.played = [];
    st.summary = null;
    st.phase = 'play';
    E.emit(st, { text: `Round ${st.round}. ${E.nm(st, st.turn)} holds the ${K.name(st.startCard)} and leads.`, sound: 'deal', count: 52 - st.out.length });
  }

  function actions(st, seat) {
    if (st.phase === 'roundover') return seat === 0 ? [{ type: 'next' }] : [];
    if (st.phase !== 'play' || seat !== st.turn) return [];
    const out = [{ type: 'play', choose: 'cards' }];
    if (st.pile) out.push({ type: 'pass' });
    return out;
  }

  function nextActive(st, seat) {
    let s = seat;
    for (let i = 0; i < st.n; i++) {
      s = E.next(st, s);
      if (!st.passed[s]) return s;
    }
    return seat;
  }

  function apply(st, seat, action, rng) {
    if (action.type === 'play' && action.cards) {
      if (st.phase !== 'play' || seat !== st.turn) throw new Error('Not your turn');
      const res = check({ hand: st.hands[seat], startCard: st.startCard, pile: st.pile }, action.cards);
      if (!res.ok) throw new Error(res.why);
      const cards = sortHand(action.cards);
      cards.forEach((c) => K.take(st.hands[seat], c));
      if (st.pile) st.played.push(...st.pile.cards);
      st.pile = { cards, seat, combo: res.combo };
      st.startCard = null;
      const what = cards.length === 1 ? `the ${K.name(cards[0])}` : `${res.combo.name.toLowerCase()}: ${cards.map(K.label).join(' ')}`;
      E.emit(st, { text: `${E.nm(st, seat)} plays ${what}.`, sound: cards.length > 1 ? 'meld' : 'place', seat, card: cards[0] });
      if (!st.hands[seat].length) return roundOver(st, seat);
      if (st.hands[seat].length === 1) E.emit(st, { text: `${E.nm(st, seat)} has one card left.`, seat });
      st.turn = nextActive(st, seat);
      if (st.turn === seat) clearPile(st, seat);
      return st;
    }
    const a = E.legal(actions(st, seat), action);
    if (a.type === 'next') return deal(st, rng);
    // pass
    st.passed[seat] = true;
    E.emit(st, { text: `${E.nm(st, seat)} passes.`, seat });
    const nxt = nextActive(st, seat);
    if (nxt === st.pile.seat || st.passed.filter((p) => !p).length <= 1) clearPile(st, st.pile.seat);
    else st.turn = nxt;
    return st;
  }

  function clearPile(st, winner) {
    st.played.push(...st.pile.cards);
    st.pile = null;
    st.passed = st.passed.map(() => false);
    st.turn = winner;
    E.emit(st, { text: `Everyone passes. ${E.nm(st, winner)} leads again.`, sound: 'sweep', seat: winner, count: 3 });
  }

  function roundOver(st, w) {
    const left = st.hands.map((h) => h.length);
    st.penalty = st.penalty.map((p, i) => p + left[i]);
    st.scores = st.penalty.slice();
    st.history.push({ label: 'Round ' + st.round, points: left });
    st.turn = null;
    const total = st.options.rounds || 1;
    const over = st.round >= total;
    if (over) {
      const low = Math.min(...st.penalty);
      st.winners = total === 1 ? [w] : st.penalty.map((p, i) => (p === low ? i : -1)).filter((i) => i >= 0);
    }
    st.phase = over ? 'gameover' : 'roundover';
    st.summary = {
      title: over ? (total === 1 ? `${E.nm(st, w)} goes out first` : `${E.andList(st.winners.map((x) => E.nm(st, x)))} ${st.winners.length > 1 ? 'share the match' : 'wins the match'}`) : `${E.nm(st, w)} goes out`,
      note: total === 1 ? 'First to empty their hand wins.' : 'Each card left in hand is a penalty point. Lowest total wins the match.',
      head: ['', 'Cards left', 'Penalty total'],
      rows: st.names.map((nm, i) => [nm, left[i], st.penalty[i]]),
    };
    E.emit(st, { text: `${E.nm(st, w)} goes out.`, sound: 'sweep', seat: w, count: 3 });
    return st;
  }

  function view(st, seat) {
    const v = E.baseView(st, seat);
    v.hand = st.hands[seat].slice();
    v.counts = st.hands.map((h) => h.length);
    v.pile = st.pile ? { cards: st.pile.cards.slice(), seat: st.pile.seat, combo: st.pile.combo } : null;
    v.passed = st.passed.slice();
    v.startCard = st.startCard;
    v.played = st.played.slice();
    v.rounds = st.options.rounds || 1;
    v.publicCards = (st.pile ? st.pile.cards.slice() : []).concat(st.startCard ? [st.startCard] : []);
    v.scoreHead = st.names;
    return v;
  }

  const zones = (st) => [...st.hands, st.out, st.played, st.pile ? st.pile.cards : []];

  C52.Games.register('bigtwo', { options, setup, actions, apply, view, zones, combo, beats, check, val, sortHand });
})(typeof window !== 'undefined' ? window : globalThis);
