const eng = (id) => C52.Games.engine(id);
const mk = (id, n, opts, seed) => eng(id).setup({ n, names: Array.from({ length: n }, (_, i) => 'P' + i), options: opts || {} }, C52.Cards.seededRng(seed || 1));

/* ---------- shared ---------- */

test('tricks: winner honours trump and the suit led', () => {
  const W = C52.Tricks.winner;
  assertEq(W([{ seat: 0, card: 'KH' }, { seat: 1, card: 'AH' }, { seat: 2, card: '2S' }], 'S'), 2);
  assertEq(W([{ seat: 0, card: 'KH' }, { seat: 1, card: 'AD' }, { seat: 2, card: 'QH' }], null), 0);
});

/* ---------- Spades ---------- */

test('spades: making a bid scores 10 a trick plus bags; missing loses 10 a trick', () => {
  const st = mk('spades', 4);
  st.bids = [4, 3, 2, 3];
  st.won = [5, 2, 2, 3]; // team 0 bid 6 took 7; team 1 bid 6 took 5
  assertEq(eng('spades').scoreTeam(st, 0).pts, 61);
  assertEq(eng('spades').scoreTeam(st, 0).bags, 1);
  assertEq(eng('spades').scoreTeam(st, 1).pts, -60);
});

test('spades: nil is +100 when no tricks are taken and -100 otherwise', () => {
  const st = mk('spades', 4);
  st.bids = [0, 3, 4, 3];
  st.won = [0, 3, 5, 5];
  assertEq(eng('spades').scoreTeam(st, 0).pts, 100 + 41);
  st.won = [1, 3, 4, 5];
  const r = eng('spades').scoreTeam(st, 0);
  assertEq(r.pts, -99 + 40);
  assertEq(r.bags, 1);
});

test('spades: spades cannot be led until broken', () => {
  const st = mk('spades', 4);
  st.phase = 'play';
  st.turn = 0;
  st.trick = [];
  st.hands[0] = ['2S', 'AS', '4D'];
  assertEq(eng('spades').actions(st, 0).map((a) => a.card), ['4D']);
  st.hands[0] = ['2S', 'AS'];
  assertEq(eng('spades').actions(st, 0).length, 2);
});

test('spades: ten bags cost 100', () => {
  const st = mk('spades', 4);
  st.bags = [9, 0];
  st.bids = [1, 1, 1, 1];
  st.won = [6, 0, 6, 1];
  st.tricks = 13;
  st.trick = [];
  // Trigger scoring through the real path.
  const before = st.teamScore[0];
  // Play the last trick through the real path so scoring runs.
  st.tricks = 12;
  st.won = [6, 0, 5, 1];
  st.hands = [['2C'], ['3C'], ['4C'], ['AC']];
  st.phase = 'play';
  st.turn = 0;
  for (const s of [0, 1, 2, 3]) eng('spades').apply(st, s, eng('spades').actions(st, s)[0]);
  // The A♣ takes the last trick, so team 0 took 6+5 = 11 on a bid of 2: 9 bags, 18 in all → one penalty, 8 left.
  assertEq(st.bags[0], 8);
  assertEq(st.teamScore[0] - before, 20 + 9 - 100);
});

/* ---------- Oh Hell ---------- */

test('ohhell: maximum hand sizes per player count', () => {
  assertEq([3, 4, 5, 6, 7].map(eng('ohhell').maxHand), [17, 12, 10, 8, 7]);
});

test('ohhell: the dealer may not make the bids add up', () => {
  const st = mk('ohhell', 4, { length: 'full' }, 2);
  // Round 1: one card each.
  const order = [1, 2, 3, 0].map((k) => (st.dealer + k) % 4);
  eng('ohhell').apply(st, order[0], { type: 'bid', n: 0 });
  eng('ohhell').apply(st, order[1], { type: 'bid', n: 1 });
  eng('ohhell').apply(st, order[2], { type: 'bid', n: 0 });
  const dealerBids = eng('ohhell').actions(st, st.dealer).map((a) => a.n);
  assertEq(dealerBids, [1]); // 0 would make the total 1
});

test('ohhell: exact bids score 10 plus the bid', () => {
  const st = mk('ohhell', 3, { length: 7 }, 3);
  st.bids = [1, 0, 0];
  st.phase = 'play';
  st.hands = [['AS'], ['2S'], ['3S']];
  st.trump = 'H';
  st.turn = 0;
  st.trick = [];
  for (const s of [0, 1, 2]) eng('ohhell').apply(st, s, eng('ohhell').actions(st, s)[0]);
  assertEq(st.history[0].points, [11, 10, 10]);
});

/* ---------- Twenty-Five ---------- */

test('twentyfive: trump orders follow the Irish rules', () => {
  const G = eng('twentyfive');
  assertEq(G.trumpOrder('H').slice(0, 4), ['5H', 'JH', 'AH', 'KH']);
  assertEq(G.trumpOrder('D').slice(0, 5), ['5D', 'JD', 'AH', 'AD', 'KD']);
  assertEq(G.trumpOrder('S'), ['5S', 'JS', 'AH', 'AS', 'KS', 'QS', '2S', '3S', '4S', '6S', '7S', '8S', '9S', 'TS']);
});

test('twentyfive: plain suits are high in red, low in black', () => {
  const G = eng('twentyfive');
  assert(G.strength('2D', 'S') > G.strength('AD', 'S'), 'red ace is lowest');
  assert(G.strength('AC', 'H') > G.strength('2C', 'H'), 'black ace above the 2');
  assert(G.strength('2C', 'H') > G.strength('TC', 'H'), 'black 2 beats black 10');
});

test('twentyfive: the ace of hearts is a trump in every suit', () => {
  const G = eng('twentyfive');
  assertEq(G.winner([{ seat: 0, card: 'KC' }, { seat: 1, card: 'AH' }], 'C'), 1);
  assertEq(G.winner([{ seat: 0, card: 'AC' }, { seat: 1, card: 'AH' }], 'C'), 1); // A♥ is the third trump, A♣ the fourth
});

test('twentyfive: follow suit or trump on a plain lead', () => {
  const G = eng('twentyfive');
  const legal = G.legalCards(['3D', '9S', 'KC'], [{ seat: 0, card: '5D' }], 'S');
  assertEq(legal.sort(), ['3D', '9S']);
  assertEq(G.legalCards(['9S', 'KC'], [{ seat: 0, card: '5D' }], 'H').sort(), ['9S', 'KC']);
});

test('twentyfive: top trumps may renege against a lower trump lead', () => {
  const G = eng('twentyfive');
  // Spades trump. 7♠ led; holding only 5♠ (top) and a club: may play anything.
  assertEq(G.legalCards(['5S', 'KC'], [{ seat: 0, card: '7S' }], 'S').sort(), ['5S', 'KC']);
  // Holding a low trump too: must play a trump (either).
  assertEq(G.legalCards(['5S', '3S', 'KC'], [{ seat: 0, card: '7S' }], 'S').sort(), ['3S', '5S']);
  // J♠ led: the 5♠ outranks it and may renege, but the A♥ may not.
  assertEq(G.legalCards(['AH', 'KC'], [{ seat: 0, card: 'JS' }], 'S').sort(), ['AH']);
});
