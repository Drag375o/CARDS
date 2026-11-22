const ER = () => C52.Games.engine('ers');
const er = (n, seed) => ER().setup({ n, names: Array.from({ length: n }, (_, i) => 'P' + i), options: {} }, C52.Cards.seededRng(seed || 1));

test('ers: the whole deck is dealt out', () => {
  const st = er(3);
  assertEq(st.decks.map((d) => d.length), [18, 17, 17]);
});

test('ers: doubles and sandwiches can be slapped', () => {
  assertEq(ER().slapKind(['2C', '9H', '9S']), 'double');
  assertEq(ER().slapKind(['9H', 'KD', '9S']), 'sandwich');
  assertEq(ER().slapKind(['9H', 'KD', '8S']), null);
});

test('ers: a correct slap takes the pile; a wrong one burns a card', () => {
  const st = er(2, 2);
  st.pile = ['4C', '7H', '7S'];
  const before = st.decks[1].length;
  ER().apply(st, 1, { type: 'slap' });
  assertEq(st.decks[1].length, before + 3);
  assertEq(st.pile.length, 0);
  assertEq(st.turn, 1);
  st.pile = ['4C', '8H'];
  const n0 = st.decks[0].length;
  ER().apply(st, 0, { type: 'slap' });
  assertEq(st.decks[0].length, n0 - 1);
  assertEq(st.pile.length, 3);
});

test('ers: a king gives the next player three chances, then the challenger wins', () => {
  const st = er(2, 3);
  const s = st.turn;
  const o = 1 - s;
  st.decks[s].push('KH');
  st.decks[o].push('2C', '3C', '4C');
  st.decks[o] = st.decks[o].filter((c) => !'JQKA'.includes(c[0])).concat(['2C', '3C', '4C']);
  ER().apply(st, s, { type: 'flip' });
  assertEq(st.turn, o);
  for (let i = 0; i < 3; i++) ER().apply(st, o, { type: 'flip' });
  assertEq(st.pendingWin, s);
  ER().apply(st, s, { type: 'collect' });
  assertEq(st.pile.length, 0);
});
