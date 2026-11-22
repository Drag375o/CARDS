const B2 = () => C52.Games.engine('bigtwo');
const b2 = (n, seed) => B2().setup({ n, names: Array.from({ length: n }, (_, i) => 'P' + i), options: { rounds: 1 } }, C52.Cards.seededRng(seed || 1));

test('bigtwo: deal sizes and the 3 of diamonds leads', () => {
  const st4 = b2(4);
  assertEq(st4.hands.map((h) => h.length), [13, 13, 13, 13]);
  assert(st4.hands[st4.turn].includes('3D'));
  const st3 = b2(3, 2);
  assertEq(st3.hands.map((h) => h.length).sort(), [17, 17, 18]);
  assert(st3.hands.find((h) => h.length === 18).includes('3D'));
  const st2 = b2(2, 3);
  assertEq(st2.hands.map((h) => h.length), [13, 13]);
  assertEq(st2.out.length, 26);
});

test('bigtwo: card order is 3 low, 2 high, spades top suit', () => {
  const C = B2().combo;
  assert(C(['2D']).key > C(['AS']).key);
  assert(C(['3S']).key > C(['3H']).key);
  assert(C(['3D']).key < C(['3C']).key);
});

test('bigtwo: five-card hands rank straight < flush < full house < quads < straight flush', () => {
  const C = B2().combo;
  const s = C(['3D', '4C', '5H', '6S', '7D']);
  const f = C(['3H', '7H', '9H', 'JH', 'KH']);
  const fh = C(['4D', '4C', '4H', '9S', '9D']);
  const q = C(['5D', '5C', '5H', '5S', '3C']);
  const sf = C(['3C', '4C', '5C', '6C', '7C']);
  assertEq([s, f, fh, q, sf].map((x) => x.name), ['Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush']);
  assert(B2().beats(f, s) && B2().beats(fh, f) && B2().beats(q, fh) && B2().beats(sf, q));
});

test('bigtwo: straights cannot wrap or contain a 2', () => {
  const C = B2().combo;
  assert(C(['TD', 'JC', 'QH', 'KS', 'AD']), '10-J-Q-K-A is the top straight');
  assertEq(C(['JD', 'QC', 'KH', 'AS', '2D']), null);
  assertEq(C(['AD', '2C', '3H', '4S', '5D']), null);
});

test('bigtwo: first play must include the 3 of diamonds; plays must match size and beat', () => {
  const st = b2(4, 5);
  const s = st.turn;
  const other = st.hands[s].find((c) => c !== '3D');
  assertThrows(() => B2().apply(st, s, { type: 'play', cards: [other] }));
  B2().apply(st, s, { type: 'play', cards: ['3D'] });
  const n = st.turn;
  st.hands[n] = st.hands[n].filter((c) => c !== '4D').concat(['4D']);
  B2().apply(st, n, { type: 'play', cards: ['4D'] });
  assertEq(st.pile.cards, ['4D']);
});

test('bigtwo: when everyone passes, the last player leads again', () => {
  const st = b2(3, 6);
  const s = st.turn;
  B2().apply(st, s, { type: 'play', cards: ['3D'] });
  B2().apply(st, st.turn, { type: 'pass' });
  B2().apply(st, st.turn, { type: 'pass' });
  assertEq(st.pile, null);
  assertEq(st.turn, s);
});
