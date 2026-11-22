const BR = () => C52.Games.engine('bridge');

test('bridge: duplicate scores for made contracts', () => {
  const S = BR().score;
  assertEq(S(2, 'S', 1, false, 8), 110); // 2♠ made: 60 + 50
  assertEq(S(3, 'N', 1, false, 9), 400); // 3NT nv: 100 + 300
  assertEq(S(3, 'N', 1, true, 9), 600); // 3NT vul
  assertEq(S(4, 'H', 1, false, 11), 450); // 4♥ +1: 120 + 300 + 30
  assertEq(S(6, 'S', 1, false, 12), 980); // small slam nv: 180 + 300 + 500
  assertEq(S(7, 'N', 1, true, 13), 2220); // grand slam vul: 220 + 500 + 1500
  assertEq(S(1, 'C', 1, false, 7), 70);
});

test('bridge: doubled and redoubled contracts', () => {
  const S = BR().score;
  assertEq(S(2, 'H', 2, false, 8), 470); // 120 → game 300 + insult 50
  assertEq(S(1, 'N', 2, false, 8), 280); // 80 + 50 + 50 + one doubled overtrick 100
  assertEq(S(2, 'D', 4, false, 8), 560); // 160 trick points (a game: 300) + 100 for making it redoubled
});

test('bridge: undertricks', () => {
  const S = BR().score;
  assertEq(S(4, 'S', 1, false, 8), -100);
  assertEq(S(4, 'S', 1, true, 8), -200);
  assertEq([1, 2, 3, 4].map((d) => S(4, 'S', 2, false, 10 - d)), [-100, -300, -500, -800]);
  assertEq([1, 2, 3].map((d) => S(4, 'S', 2, true, 10 - d)), [-200, -500, -800]);
  assertEq(S(4, 'S', 4, false, 8), -600);
});

test('bridge: dealer and vulnerability follow the 16-board cycle', () => {
  assertEq([1, 2, 3, 4, 5].map(BR().dealerOf), [2, 3, 0, 1, 2]); // N E S W N
  assertEq([1, 2, 3, 4, 5, 9, 13, 16].map(BR().vulOf), ['None', 'NS', 'EW', 'Both', 'NS', 'EW', 'Both', 'EW']);
});

function br(seed) {
  return BR().setup({ n: 4, names: ['S', 'W', 'N', 'E'], options: { boards: 4 } }, C52.Cards.seededRng(seed || 1));
}

test('bridge: four passes throw the board in', () => {
  const st = br(2);
  for (let i = 0; i < 4; i++) BR().apply(st, st.turn, { type: 'pass' });
  assertEq(st.phase, 'roundover');
  assertEq(st.history[0].points, [0, 0]);
});

test('bridge: the first of the side to name the strain declares; dummy is partner; LHO leads', () => {
  const st = br(3); // board 1: North (seat 2) deals
  const call = (a) => BR().apply(st, st.turn, a);
  call({ type: 'bid', level: 1, strain: 'H' }); // N
  call({ type: 'pass' }); // E
  call({ type: 'bid', level: 4, strain: 'H' }); // S raises
  call({ type: 'pass' });
  call({ type: 'pass' });
  call({ type: 'pass' });
  assertEq(st.declarer, 2);
  assertEq(st.dummy, 0);
  assertEq(st.turn, 3); // East leads
  // Declarer (North) controls dummy's (South's) cards.
  BR().apply(st, 3, BR().actions(st, 3)[0]);
  assertEq(st.turn, 0);
  assertEq(BR().actions(st, 0).length, 0);
  assert(BR().actions(st, 2).length > 0);
});

test('bridge: doubles only on opponents, redoubles only on our doubled bid', () => {
  const st = br(4);
  BR().apply(st, st.turn, { type: 'bid', level: 1, strain: 'S' }); // N
  const e = st.turn;
  assert(BR().actions(st, e).some((a) => a.type === 'double'));
  BR().apply(st, e, { type: 'double' });
  assert(BR().actions(st, st.turn).some((a) => a.type === 'redouble')); // South, partner of the bidder
});
