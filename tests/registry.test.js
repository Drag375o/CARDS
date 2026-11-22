test('registry lists all twelve games in order with valid metadata', () => {
  const g = C52.Games.list();
  assertEq(g.length, 12);
  assertEq(g.map((x) => x.num), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  assertEq(new Set(g.map((x) => x.id)).size, 12);
  for (const x of g) {
    assert(x.players[0] >= 1 && x.players[0] <= x.players[1], x.id + ' player range');
    assert('SHDC'.includes(x.suit) && x.name && x.line && x.kind, x.id + ' metadata');
  }
  assertEq(g.filter((x) => x.group === 'niche').map((x) => x.id), ['bigtwo', 'ers', 'ohhell', 'twentyfive']);
});

test('player counts match the rulebook', () => {
  const p = (id) => C52.Games.meta(id).players;
  assertEq(p('holdem'), [2, 10]);
  assertEq(p('hearts'), [4, 4]);
  assertEq(p('crazy8'), [2, 7]);
  assertEq(p('twentyfive'), [3, 9]);
  assertEq(p('ohhell'), [3, 7]);
});
