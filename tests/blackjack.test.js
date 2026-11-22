const BJE = () => C52.Games.engine('blackjack');
const bj = (n, seed, opts) => BJE().setup({ n, names: Array.from({ length: n }, (_, i) => 'P' + i), options: Object.assign({ soft17: 'stand', hands: 10, chips: 1000 }, opts || {}) }, C52.Cards.seededRng(seed || 1));

test('blackjack: totals count aces as 1 or 11', () => {
  const T = BJE().total;
  assertEq(T(['AS', '6D']), { total: 17, soft: true });
  assertEq(T(['AS', '6D', 'TC']), { total: 17, soft: false });
  assertEq(T(['AS', 'AD', '9C']), { total: 21, soft: true });
  assert(BJE().isBJ(['AH', 'KD']) && !BJE().isBJ(['AH', '5D', '5C']));
});

function rig(st, playerCards, dealerCards, rest) {
  // Stack the shoe so the deal gives these cards (deal order: each player, dealer; twice).
  const n = st.n;
  const order = [];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < n; i++) order.push(playerCards[i][r]);
    order.push(dealerCards[r]);
  }
  const top = order.concat(rest || []);
  const used = new Set(top);
  st.shoe = C52.Cards.makeDeck().filter((c) => !used.has(c)).concat(top.slice().reverse());
}

test('blackjack: blackjack pays 3 to 2', () => {
  const st = bj(1, 2);
  rig(st, [['AS', 'KD']], ['9C', '7H'], ['2D']);
  BJE().apply(st, 0, { type: 'bet', amount: 100 });
  assertEq(st.chips[0], 1150);
});

test('blackjack: dealer blackjack is checked at once; a player blackjack pushes', () => {
  const st = bj(2, 3);
  rig(st, [['AS', 'KD'], ['9S', '8D']], ['AC', 'QH']);
  BJE().apply(st, 0, { type: 'bet', amount: 50 });
  BJE().apply(st, 1, { type: 'bet', amount: 50 });
  assertEq(st.phase, 'roundover');
  assertEq(st.chips, [1000, 950]);
});

test('blackjack: dealer stands on soft 17 or hits it, as chosen', () => {
  const a = bj(1, 4, { soft17: 'stand' });
  rig(a, [['TS', '8D']], ['AC', '6H'], ['5C']);
  BJE().apply(a, 0, { type: 'bet', amount: 10 });
  BJE().apply(a, 0, { type: 'stand' });
  assertEq(a.dealer.length, 2);
  const b = bj(1, 4, { soft17: 'hit' });
  rig(b, [['TS', '8D']], ['AC', '6H'], ['5C']);
  BJE().apply(b, 0, { type: 'bet', amount: 10 });
  BJE().apply(b, 0, { type: 'stand' });
  assert(b.dealer.length >= 3, 'dealer should hit soft 17');
});

test('blackjack: split aces get one card each and 21 after a split is not blackjack', () => {
  const st = bj(1, 5);
  rig(st, [['AS', 'AD']], ['9C', '7H'], ['KC', 'TD']);
  BJE().apply(st, 0, { type: 'bet', amount: 10 });
  BJE().apply(st, 0, { type: 'split' });
  assertEq(st.phase, 'roundover');
  assertEq(st.chips[0], 1020); // two 21s beat the dealer's 16→ draws; paid 1:1 each, not 3:2
});

test('blackjack: double down takes exactly one card at double the bet', () => {
  const st = bj(1, 6);
  rig(st, [['6S', '5D']], ['TC', '7H'], ['9C']);
  BJE().apply(st, 0, { type: 'bet', amount: 25 });
  BJE().apply(st, 0, { type: 'double' });
  assertEq(st.chips[0], 1050);
});
