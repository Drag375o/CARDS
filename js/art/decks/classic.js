/* 52 Cards — Classic deck. White faces, standard pips and double-headed
 * court cards in red, gold, blue and black, after the traditional design. */
(function (root) {
  'use strict';
  const Art = root.C52.Art;

  const DARK = '#1A1A1A';
  const SKIN = '#F6DCC0';
  const STEEL = '#D9DEE3';
  const GOLD = '#E8B624';
  const RED = '#C8102E';
  const BLUE = '#1F4E9C';

  // Robe colours per suit, so each suit's courts read differently.
  const ROBES = {
    S: { robe: BLUE, trim: GOLD, accent: RED },
    H: { robe: RED, trim: GOLD, accent: BLUE },
    D: { robe: GOLD, trim: RED, accent: BLUE },
    C: { robe: '#232323', trim: GOLD, accent: RED },
  };
  const HAIR = { K: '#F3E9D2', Q: GOLD, J: '#9C5B2E' };

  const s = (w) => `stroke="${DARK}" stroke-width="${w || 1.6}" stroke-linejoin="round"`;

  /** One half of a court figure, drawn above the centre line (y < 175). */
  function half(rank, suit, ink) {
    const p = ROBES[suit];
    const hair = HAIR[rank];
    let g = '';

    // Held item, behind the figure.
    if (rank === 'K') {
      g += `<rect x="70" y="56" width="7" height="86" fill="${STEEL}" ${s(1.3)}/>`;
      g += `<path d="M73.5 46L77 56L70 56Z" fill="${STEEL}" ${s(1.3)}/>`;
      g += `<rect x="60" y="140" width="27" height="6" rx="2" fill="${p.trim}" ${s(1.3)}/>`;
      g += `<rect x="70.5" y="146" width="6" height="15" fill="${DARK}"/>`;
    } else if (rank === 'Q') {
      g += `<path d="M177 160Q171 118 178 84" fill="none" stroke="#2E6B3A" stroke-width="3"/>`;
      g += `<path d="M175 124Q160 116 158 104Q170 108 176 120Z" fill="#2E6B3A" ${s(1)}/>`;
      g += `<path d="M169 86Q170 64 178 70Q186 64 187 86Q178 94 169 86Z" fill="${p.accent}" ${s(1.3)}/>`;
    } else {
      g += `<path d="M74 44L74 164" stroke="#7A4A22" stroke-width="4.5" stroke-linecap="round"/>`;
      g += `<path d="M74 54L58 60Q53 70 58 80L74 72Z" fill="${STEEL}" ${s(1.3)}/>`;
      g += `<path d="M74 34L78 46L70 46Z" fill="${STEEL}" ${s(1.2)}/>`;
    }

    // Shoulders and robe.
    g += `<path d="M54 175L54 153Q56 133 90 124L160 124Q194 133 196 153L196 175Z" fill="${p.robe}" ${s()}/>`;
    g += `<path d="M104 128L146 128L152 175L98 175Z" fill="${p.trim}" ${s()}/>`;
    for (let y = 137; y < 172; y += 11) {
      g += `<path d="M106 ${y}L125 ${y + 7}L144 ${y}" fill="none" stroke="${p.accent}" stroke-width="3.2"/>`;
    }
    for (const [x, y] of [[90, 140], [160, 140], [88, 162], [162, 162]]) {
      g += `<circle cx="${x}" cy="${y}" r="4" fill="${p.trim}" ${s(1.1)}/>`;
    }
    // Hand gripping the item, with the item's shaft drawn over the knuckles.
    const handX = rank === 'Q' ? 176 : 73.5;
    g += `<path d="M${handX - 7} 147q7-5 14 0v8q-7 4-14 0Z" fill="${SKIN}" ${s(1.2)}/>`;
    if (rank === 'K') g += `<rect x="70.5" y="146" width="6" height="15" fill="${DARK}" opacity=".85"/>`;
    if (rank === 'J') g += `<path d="M74 145L74 157" stroke="#7A4A22" stroke-width="4.5"/>`;

    // Collar.
    const collar = rank === 'Q' ? '#FFFDF6' : p.trim;
    g += `<path d="M90 124Q125 152 160 124L155 117Q125 140 95 117Z" fill="${collar}" ${s()}/>`;

    // Hair behind the face.
    if (rank === 'Q') g += `<path d="M98 80Q92 118 104 126L146 126Q158 118 152 80Z" fill="${hair}" ${s()}/>`;
    else if (rank === 'K') g += `<path d="M101 80Q99 114 108 122L142 122Q151 114 149 80Z" fill="${hair}" ${s()}/>`;
    else g += `<path d="M103 84Q101 110 110 117L140 117Q149 110 147 84Z" fill="${hair}" ${s()}/>`;

    // Neck and face.
    g += `<rect x="116" y="106" width="18" height="18" fill="${SKIN}" ${s(1.3)}/>`;
    g += `<ellipse cx="125" cy="95" rx="18" ry="22" fill="${SKIN}" ${s()}/>`;
    g += `<path d="M113 88q5-3 9 0M128 88q5-3 9 0" fill="none" stroke="${DARK}" stroke-width="1.3"/>`;
    g += `<circle cx="117.5" cy="93" r="1.8" fill="${DARK}"/><circle cx="132.5" cy="93" r="1.8" fill="${DARK}"/>`;
    g += `<path d="M125 94L122 104L126.5 105" fill="none" stroke="${DARK}" stroke-width="1.2"/>`;
    if (rank === 'K') {
      g += `<path d="M108 103Q110 125 125 131Q140 125 142 103Q136 115 125 116Q114 115 108 103Z" fill="${hair}" ${s(1.3)}/>`;
      g += `<path d="M115 108Q125 103 135 108Q130 112 125 109Q120 112 115 108Z" fill="${hair}" ${s(1.1)}/>`;
    } else {
      g += `<path d="M119 110q6 3 12 0" fill="none" stroke="${RED}" stroke-width="1.8" stroke-linecap="round"/>`;
    }

    // Headwear.
    if (rank === 'K') {
      g += `<path d="M104 66L104 49L113 60L119 43L125 57L131 43L137 60L146 49L146 66Z" fill="${p.trim}" ${s()}/>`;
      g += `<rect x="103" y="65" width="44" height="11" fill="${p.trim}" ${s()}/>`;
      for (const x of [113, 125, 137]) g += `<circle cx="${x}" cy="70.5" r="3" fill="${p.accent}"/>`;
      for (const [x, y] of [[104, 48], [119, 42], [131, 42], [146, 48]]) g += `<circle cx="${x}" cy="${y}" r="2.5" fill="${p.trim}" ${s(1)}/>`;
    } else if (rank === 'Q') {
      g += `<path d="M102 74Q94 106 98 126L106 126Q103 100 110 76Z" fill="${p.accent}" ${s(1.3)}/>`;
      g += `<path d="M148 74Q156 106 152 126L144 126Q147 100 140 76Z" fill="${p.accent}" ${s(1.3)}/>`;
      g += `<path d="M107 74L107 61L114 53L119 61L125 48L131 61L136 53L143 61L143 74Z" fill="${GOLD}" ${s()}/>`;
      g += `<circle cx="125" cy="66" r="3.5" fill="${p.accent}"/>`;
    } else {
      g += `<path d="M98 82Q99 58 125 55Q151 58 152 82Q125 71 98 82Z" fill="${p.accent}" ${s()}/>`;
      g += `<path d="M97 82Q125 71 153 82L153 88Q125 77 97 88Z" fill="${p.trim}" ${s(1.3)}/>`;
      g += `<path d="M146 66Q166 44 180 54Q166 58 151 73Z" fill="${p.trim}" ${s(1.2)}/>`;
    }

    // Suit mark beside the head.
    const mark = { K: [176, 58], Q: [72, 58], J: [176, 100] }[rank];
    g += Art.pip(suit, mark[0], mark[1], 22, ink);
    return g;
  }

  function court(code, ink) {
    const top = half(code[0], code[1], ink);
    return (
      `<rect x="48" y="40" width="154" height="270" rx="4" fill="#FFFDF6" stroke="${ink}" stroke-width="2"/>` +
      top +
      `<g transform="rotate(180 125 175)">${top}</g>` +
      `<path d="M48 175H202" stroke="${ink}" stroke-width="1.5"/>`
    );
  }

  function ace(code, ink, a) {
    if (code[1] !== 'S') return a.pip(code[1], a.CX, a.CY, 92, ink);
    // Ace of spades: large ornamental spade inside a fine ring.
    return (
      `<circle cx="125" cy="175" r="78" fill="none" stroke="${ink}" stroke-width="1"/>` +
      `<circle cx="125" cy="175" r="72" fill="none" stroke="${ink}" stroke-width=".6"/>` +
      a.pip('S', 125, 172, 120, ink) +
      `<path d="M125 128C116 146 96 158 96 174C96 184 108 188 117 180" fill="none" stroke="#fff" stroke-width="2"/>` +
      `<path d="M125 128C134 146 154 158 154 174C154 184 142 188 133 180" fill="none" stroke="#fff" stroke-width="2"/>` +
      `<circle cx="125" cy="160" r="5" fill="#fff"/>`
    );
  }

  Art.registerDeck('classic', {
    name: 'Classic',
    back: 'lattice-red',
    paper: '#FFFFFF',
    pipSize: 46,
    court,
    ace,
  });
})(typeof window !== 'undefined' ? window : globalThis);
