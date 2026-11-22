const Art = C52.Art;

test('every deck renders all 52 faces as clean SVG', () => {
  for (const d of Art.decks()) {
    for (const c of C52.Cards.makeDeck()) {
      const svg = Art.card(c, { deck: d.id });
      assert(svg.startsWith('<svg') && svg.endsWith('</svg>'), d.id + ' ' + c + ' not an svg');
      assert(!/undefined|NaN|null/.test(svg), d.id + ' ' + c + ' has a bad value');
    }
  }
});

test('four-colour and large-index options change the output', () => {
  const plain = Art.card('2D');
  assert(Art.card('2D', { fourColour: true }) !== plain);
  assert(Art.card('2D', { largeIndex: true }) !== plain);
  assert(Art.card('2D', { fourColour: true }).includes(Art.FOUR_COLOUR.D));
});

test('every back renders, and face-down hides the card', () => {
  for (const b of Art.backs()) {
    const svg = Art.card('AS', { faceDown: true, back: b.id });
    assert(svg.includes('c52-back'));
    assert(!svg.includes('ace of spades'), 'face-down card leaks its identity');
  }
});

test('shared defs include every back pattern', () => {
  const defs = Art.defs();
  assert(defs.includes('c52-pat-lattice-red') && defs.includes('c52-pat-guilloche'));
});
