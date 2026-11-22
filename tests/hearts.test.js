const HE = () => C52.Games.engine('hearts');
const he = (seed) => HE().setup({ n: 4, names: ['A', 'B', 'C', 'D'], options: { target: 100 } }, C52.Cards.seededRng(seed || 1));

function skipPass(st) {
  if (st.phase !== 'pass') return;
  for (let s = 0; s < 4; s++) HE().apply(st, s, { type: 'pass', cards: st.hands[s].slice(0, 3) });
}

test('hearts: passes rotate left, right, across, none', () => {
  const st = he(1);
  const names = [];
  for (let r = 0; r < 5; r++) {
    names.push(st.pass ? st.pass.name : 'none');
    st.phase = 'roundover';
    HE().apply(st, 0, { type: 'next' });
  }
  assertEq(names, ['left', 'right', 'across', 'none', 'left']);
});

test('hearts: passing moves three cards to the left', () => {
  const st = he(2);
  const give = st.hands.map((h) => h.slice(0, 3));
  skipPass(st);
  for (let s = 0; s < 4; s++) give[s].forEach((c) => assert(st.hands[(s + 1) % 4].includes(c), 'card did not arrive'));
  assertEq(st.hands.map((h) => h.length), [13, 13, 13, 13]);
});

test('hearts: two of clubs leads; no points on the first trick', () => {
  const st = he(3);
  skipPass(st);
  const leader = st.turn;
  assertEq(HE().actions(st, leader), [{ type: 'play', card: '2C' }]);
  HE().apply(st, leader, { type: 'play', card: '2C' });
  const nxt = st.turn;
  st.hands[nxt] = ['QS', 'AH', '5D'];
  assertEq(HE().actions(st, nxt).map((a) => a.card), ['5D']);
  st.hands[nxt] = ['QS', 'AH'];
  assertEq(HE().actions(st, nxt).map((a) => a.card).sort(), ['AH', 'QS']);
});

test('hearts: hearts cannot be led until broken', () => {
  const st = he(4);
  skipPass(st);
  st.tricks = 3;
  st.trick = [];
  st.turn = 0;
  st.hands[0] = ['2H', '9H', '4C'];
  assertEq(HE().actions(st, 0).map((a) => a.card), ['4C']);
  st.hands[0] = ['2H', '9H'];
  assertEq(HE().actions(st, 0).length, 2);
});

test('hearts: shooting the moon gives everyone else 26', () => {
  const st = he(5);
  skipPass(st);
  st.taken = [C52.Cards.makeDeck().filter((c) => c[1] === 'H').concat(['QS']), [], [], []];
  st.tricks = 12;
  st.hands = [['2C'], ['3C'], ['4C'], ['5C']];
  st.trick = [];
  st.turn = 1;
  st.broken = true;
  for (const s of [1, 2, 3, 0]) HE().apply(st, s, HE().actions(st, s)[0]);
  assertEq(st.history[0].points, [0, 26, 26, 26]);
});
