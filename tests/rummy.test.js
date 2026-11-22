const RU = () => C52.Games.engine('rummy');
const ru = (n, seed) => RU().setup({ n, names: Array.from({ length: n }, (_, i) => 'P' + i), options: { target: 100 } }, C52.Cards.seededRng(seed || 1));

test('rummy: deal sizes', () => {
  assertEq(ru(2).hands.map((h) => h.length), [10, 10]);
  assertEq(ru(4).hands.map((h) => h.length), [7, 7, 7, 7]);
  assertEq(ru(6).hands.map((h) => h.length), [6, 6, 6, 6, 6, 6]);
});

test('rummy: sets and runs, ace low only', () => {
  const R = RU();
  assert(R.isSet(['7H', '7D', '7C']) && R.isSet(['7H', '7D', '7C', '7S']));
  assert(!R.isSet(['7H', '7D']) && !R.isSet(['7H', '7H', '7C']));
  assert(R.isRun(['4S', '5S', '6S']) && R.isRun(['AD', '2D', '3D']));
  assert(!R.isRun(['QD', 'KD', 'AD']), 'Q-K-A is not a run');
  assert(!R.isRun(['4S', '5S', '6H']));
});

test('rummy: cannot throw back the card just taken from the discards', () => {
  const st = ru(3, 2);
  const me = st.turn;
  st.discard = ['9C'];
  RU().apply(st, me, { type: 'draw', from: 'discard' });
  const discards = RU().actions(st, me).filter((a) => a.type === 'discard').map((a) => a.card);
  assert(!discards.includes('9C'));
});

test('rummy: melding the last card goes out and scores the others\' deadwood', () => {
  const st = ru(2, 3);
  const me = st.turn;
  st.step = 'play';
  st.hands[me] = ['5H', '5D', '5C'];
  st.hands[1 - me] = ['KS', 'AH'];
  RU().apply(st, me, { type: 'meld', cards: ['5H', '5D', '5C'] });
  assertEq(st.scores[me], 11);
  assertEq(st.phase, 'roundover');
});

test('rummy: invalid melds are refused', () => {
  const st = ru(2, 4);
  st.step = 'play';
  st.hands[st.turn] = ['5H', '6D', '7C', '2S'];
  assertThrows(() => RU().apply(st, st.turn, { type: 'meld', cards: ['5H', '6D', '7C'] }));
});
