const KL = () => C52.Games.engine('klondike');
const kl = (seed, draw) => KL().setup({ n: 1, names: ['You'], options: { draw: draw || 1 } }, C52.Cards.seededRng(seed || 1));

test('klondike: layout is 1–7 with one face-up card per column and 24 in stock', () => {
  const st = kl(2);
  assertEq(st.tableau.map((c) => c.down.length), [0, 1, 2, 3, 4, 5, 6]);
  assert(st.tableau.every((c) => c.up.length === 1));
  assertEq(st.stock.length, 24);
});

test('klondike: alternating colours, one lower; only kings on empty columns', () => {
  const col = { down: [], up: ['8S'] };
  assert(KL().onTableauOk(col, '7H'));
  assert(!KL().onTableauOk(col, '7C'));
  assert(!KL().onTableauOk(col, '6H'));
  assert(KL().onTableauOk({ down: [], up: [] }, 'KD'));
  assert(!KL().onTableauOk({ down: [], up: [] }, 'QD'));
});

test('klondike: foundations build up by suit from the ace', () => {
  const st = kl(3);
  st.found = [[], [], [], []];
  assert(KL().toFoundationOk(st, 'AS'));
  assert(!KL().toFoundationOk(st, '2S'));
  st.found[0] = ['AS'];
  assert(KL().toFoundationOk(st, '2S'));
  assert(!KL().toFoundationOk(st, '2H'));
});

test('klondike: moving the last face-up card turns the next one over', () => {
  const st = kl(4);
  st.tableau[1] = { down: ['3C'], up: ['7H'] };
  st.tableau[2] = { down: [], up: ['8S'] };
  KL().apply(st, 0, { type: 'move', from: 't1', to: 't2', count: 1 });
  assertEq(st.tableau[1], { down: [], up: ['3C'] });
  assertEq(st.tableau[2].up, ['8S', '7H']);
});

test('klondike: draw three takes three, recycle restores order, undo reverts', () => {
  const st = kl(5, 3);
  const before = st.stock.slice();
  KL().apply(st, 0, { type: 'draw' });
  assertEq(st.waste, before.slice(-3).reverse());
  KL().apply(st, 0, { type: 'undo' });
  assertEq(st.stock, before);
  while (st.stock.length) KL().apply(st, 0, { type: 'draw' });
  KL().apply(st, 0, { type: 'recycle' });
  assertEq(st.stock, before);
});

test('klondike: the autoplayer wins a fair share of draw-one deals', () => {
  let wins = 0;
  for (let s = 1; s <= 60; s++) if (simulate('klondike', s, { options: { draw: 1 } }).st.winners.length) wins++;
  assert(wins >= 6, 'only ' + wins + ' of 60 won');
});
