const HO = () => C52.Games.engine('holdem');
const Hd = () => C52.Hands;

test('hands: categories rank correctly', () => {
  const s = (cs) => Hd().eval5(cs);
  const order = [
    ['2C', '5D', '9H', 'JS', 'KD'], ['2C', '2D', '9H', 'JS', 'KD'], ['2C', '2D', '9H', '9S', 'KD'],
    ['2C', '2D', '2H', '9S', 'KD'], ['5C', '6D', '7H', '8S', '9D'], ['2C', '5C', '9C', 'JC', 'KC'],
    ['2C', '2D', '2H', '9S', '9D'], ['2C', '2D', '2H', '2S', 'KD'], ['5C', '6C', '7C', '8C', '9C'],
  ].map(s);
  for (let i = 1; i < order.length; i++) assert(order[i].score > order[i - 1].score, order[i].name + ' should beat ' + order[i - 1].name);
  assertEq(s(['TH', 'JH', 'QH', 'KH', 'AH']).name, 'Royal flush');
});

test('hands: the wheel is a five-high straight', () => {
  const wheel = Hd().eval5(['AC', '2D', '3H', '4S', '5D']);
  const six = Hd().eval5(['2C', '3D', '4H', '5S', '6D']);
  assertEq(wheel.name, 'Straight');
  assert(six.score > wheel.score);
});

test('hands: kickers break ties; best five of seven', () => {
  const a = Hd().best(['AS', 'AD', 'KC', '7H', '4D', '3S', '2C']);
  const b = Hd().best(['AH', 'AC', 'QC', '7H', '4D', '3S', '2C']);
  assert(a.score > b.score);
  assertEq(Hd().best(['2H', '3H', '9H', 'KH', 'AH', '2C', '2D']).name, 'Flush');
});

function ho(n, seed) {
  return HO().setup({ n, names: Array.from({ length: n }, (_, i) => 'P' + i), options: { chips: 1000, blinds: 10, rising: true } }, C52.Cards.seededRng(seed || 1));
}

test('holdem: blinds are posted and the player left of the big blind acts first', () => {
  const st = ho(4, 2);
  assertEq(st.bet[st.sbSeat], 10);
  assertEq(st.bet[st.bbSeat], 20);
  assertEq(st.turn, (st.bbSeat + 1) % 4);
  assertEq(st.hands.map((h) => h.length), [2, 2, 2, 2]);
});

test('holdem: heads-up the button posts the small blind and acts first', () => {
  const st = ho(2, 3);
  assertEq(st.sbSeat, st.button);
  assertEq(st.turn, st.button);
});

test('holdem: everyone folding hands the pot to the last player', () => {
  const st = ho(3, 4);
  const start = st.chips.slice();
  const bb = st.bbSeat;
  while (st.phase === 'play') HO().apply(st, st.turn, { type: 'fold' });
  assertEq(st.chips[bb], start[bb] + 20 + 10);
});

test('holdem: side pots pay an all-in player only what they matched', () => {
  const st = ho(3, 5);
  const short = st.turn; // first to act: not a blind
  st.chips[short] = 30;
  const before = st.chips.reduce((a, b) => a + b, 0) + st.contrib.reduce((a, b) => a + b, 0);
  HO().apply(st, short, { type: 'raise', to: 30 });
  for (let guard = 0; st.phase === 'play' && guard < 40; guard++) {
    const acts = HO().actions(st, st.turn);
    HO().apply(st, st.turn, acts.find((a) => a.type === 'call') || acts.find((a) => a.type === 'check'));
  }
  const after = st.chips.reduce((a, b) => a + b, 0);
  assertEq(after, before, 'chips are conserved');
  // The short stack can win at most three times its 30.
  assert(st.chips[short] <= 90, 'all-in player won more than they matched: ' + st.chips[short]);
});
