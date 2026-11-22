const K = C52.Cards;

test('full deck has 52 unique valid cards', () => {
  const d = K.makeDeck();
  assertEq(d.length, 52);
  assertEq(new Set(d).size, 52);
  assert(d.every(K.isValid));
});

test('deck can exclude cards', () => {
  const d = K.makeDeck({ exclude: ['2C', '2D'] });
  assertEq(d.length, 50);
  assert(!d.includes('2C') && !d.includes('2D'));
});

test('labels and names', () => {
  assertEq(K.label('TH'), '10♥');
  assertEq(K.label('AS'), 'A♠');
  assertEq(K.name('QS'), 'queen of spades');
  assert(K.isRed('KD') && !K.isRed('KC'));
  assert(K.isFace('JH') && !K.isFace('AH'));
});

test('rank order is per game', () => {
  assert(K.rankIndex('AS', '23456789TJQKA') > K.rankIndex('KS', '23456789TJQKA'));
  assert(K.rankIndex('2S', '3456789TJQKA2') > K.rankIndex('AS', '3456789TJQKA2'));
});

test('pip values', () => {
  assertEq(['AH', '7C', 'TD', 'KS'].map(K.pipValue), [1, 7, 10, 10]);
});

test('seeded shuffle is deterministic and a permutation', () => {
  const a = K.shuffle(K.makeDeck(), K.seededRng(42));
  const b = K.shuffle(K.makeDeck(), K.seededRng(42));
  const c = K.shuffle(K.makeDeck(), K.seededRng(7));
  assertEq(a, b);
  assert(JSON.stringify(a) !== JSON.stringify(c));
  assert(K.audit([a], K.makeDeck()).ok);
});

test('shuffle is roughly uniform (first slot)', () => {
  const rng = K.seededRng(1);
  const counts = {};
  const N = 52000;
  for (let i = 0; i < N; i++) {
    const c = K.shuffle(K.makeDeck(), rng)[0];
    counts[c] = (counts[c] || 0) + 1;
  }
  const vals = Object.values(counts);
  assertEq(vals.length, 52);
  assert(Math.min(...vals) > 800 && Math.max(...vals) < 1200, 'distribution skewed');
});

test('secure rng returns floats in [0,1)', () => {
  const r = K.secureRng();
  for (let i = 0; i < 1000; i++) {
    const x = r();
    assert(x >= 0 && x < 1);
  }
});

test('deal goes round the table one card at a time', () => {
  const pile = K.makeDeck(); // top of pile = end of array
  const hands = K.deal(pile, 4, 13);
  assertEq(pile.length, 0);
  assertEq(hands.map((h) => h.length), [13, 13, 13, 13]);
  assertEq(hands[0][0], 'KC'); // last card in the array is the top, dealt first
  assertEq(hands[1][0], 'QC');
  assert(K.audit(hands, K.makeDeck()).ok);
});

test('draw refuses to overdraw; take removes a named card', () => {
  const pile = ['AS', 'KH'];
  assertThrows(() => K.draw(pile, 3));
  K.take(pile, 'AS');
  assertEq(pile, ['KH']);
  assertThrows(() => K.take(pile, 'AS'));
});

test('audit finds missing, duplicate and unknown cards', () => {
  const d = K.makeDeck();
  const bad = d.slice(1).concat(['KH', 'ZZ']);
  const r = K.audit([bad], d);
  assert(!r.ok);
  assertEq(r.missing, ['AS']);
  assertEq(r.duplicates, ['KH']);
  assertEq(r.unknown, ['ZZ']);
});

test('sortHand groups by suit then rank', () => {
  assertEq(K.sortHand(['2H', 'AS', 'KH', '3S'], '23456789TJQKA', 'SH'), ['3S', 'AS', '2H', 'KH']);
});

test('youify conjugates narration for the viewer', () => {
  const Y = C52.Engine.youify;
  assertEq(Y('You draws from the stock.'), 'You draw from the stock.');
  assertEq(Y('You passes. Bidding is done. You leads.'), 'You pass. Bidding is done. You lead.');
  assertEq(Y('You is down to one card.'), 'You are down to one card.');
  assertEq(Y('You wins the game'), 'You win the game');
  assertEq(Y('You reaches 25'), 'You reach 25');
  assertEq(Y('You and Mr Valentine win'), 'You and Mr Valentine win');
});
