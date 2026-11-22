const C8 = () => C52.Games.engine('crazy8');
function c8(n, seed) {
  return C8().setup({ n, names: Array.from({ length: n }, (_, i) => 'P' + i), options: { target: 100 } }, C52.Cards.seededRng(seed || 3));
}

test('crazy8: deal sizes follow the player count', () => {
  assertEq(c8(4).hands.map((h) => h.length), [7, 7, 7, 7]);
  assertEq(c8(5).hands.map((h) => h.length), [5, 5, 5, 5, 5]);
});

test('crazy8: starter is never an eight; first player is left of dealer', () => {
  for (let s = 1; s < 60; s++) {
    const st = c8(3, s);
    assert(st.discard[0][0] !== '8');
    assertEq(st.turn, (st.dealer + 1) % 3);
  }
});

test('crazy8: only matching cards and eights are playable; eights name a suit', () => {
  const st = c8(2, 5);
  st.discard = ['7H'];
  st.suit = 'H';
  st.hands[st.turn] = ['7C', '2H', '8S', 'KD'];
  const acts = C8().actions(st, st.turn);
  const cards = [...new Set(acts.map((a) => a.card))].sort();
  assertEq(cards, ['2H', '7C', '8S']);
  assertEq(acts.filter((a) => a.card === '8S').map((a) => a.suit), ['S', 'H', 'D', 'C']);
  assertThrows(() => C8().apply(st, st.turn, { type: 'play', card: 'KD' }));
});

test('crazy8: draw is only offered when nothing fits; a playable draw may be played', () => {
  const st = c8(2, 6);
  const me = st.turn;
  st.discard = ['7H'];
  st.suit = 'H';
  st.hands[me] = ['2C', '3C'];
  st.stock.push('9H');
  assertEq(C8().actions(st, me), [{ type: 'draw' }]);
  C8().apply(st, me, { type: 'draw' });
  assertEq(C8().actions(st, me), [{ type: 'play', card: '9H' }, { type: 'pass' }]);
});

test('crazy8: scoring counts eights as 50 and faces as 10', () => {
  const st = c8(3, 8);
  const me = st.turn;
  st.discard = ['5S'];
  st.suit = 'S';
  st.hands = [[], [], []];
  st.hands[me] = ['9S'];
  st.hands[(me + 1) % 3] = ['8D', 'KC'];
  st.hands[(me + 2) % 3] = ['AH', '4C'];
  C8().apply(st, me, { type: 'play', card: '9S' });
  assertEq(st.scores[me], 50 + 10 + 1 + 4);
  assertEq(st.phase, 'roundover');
});
