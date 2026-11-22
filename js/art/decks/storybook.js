/* 52 Cards — Storybook deck. Rounded corners, pips set in decorative
 * rings, and soft illustrated royals with golden hair and closed eyes. */
(function (root) {
  'use strict';
  const Art = root.C52.Art;

  const RED = '#E8392F';
  const BROWN = '#3B1D14';
  const SKIN = '#FBE3CF';
  const HAIR = '#F3C64A';
  const LINE = '#4A2A1A';

  /** Pip spots: 2–5 as usual, 6–10 arranged in a ring (9 adds a centre pip). */
  function layout(n) {
    if (n <= 5) return null;
    const ring = n === 9 ? 8 : n;
    const out = [];
    for (let i = 0; i < ring; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / ring;
      const x = 125 + 58 * Math.cos(a);
      const y = 175 + 92 * Math.sin(a);
      out.push([+x.toFixed(1), +y.toFixed(1), Math.round((a * 180) / Math.PI + 90) % 360]);
    }
    if (n === 9) out.push([125, 175, 0]);
    return out;
  }

  const ROBES = {
    H: ['#E8392F', '#F28C28', '#FCD9A8'],
    D: ['#F28C28', '#E8392F', '#FCE3B8'],
    S: ['#5A1E22', '#C9A24A', '#EBD9B0'],
    C: ['#3B1D14', '#C9A24A', '#E8D2A0'],
  };

  function court(code, ink) {
    const r = code[0];
    const [robe, trim, light] = ROBES[code[1]];
    const s = `stroke="${LINE}" stroke-width="2" stroke-linejoin="round"`;
    let g = '';
    // Spear for the jack, behind the figure.
    if (r === 'J') g += `<path d="M178 70L178 300" stroke="${LINE}" stroke-width="4" stroke-linecap="round"/><path d="M178 52L186 74L170 74Z" fill="#cfd6dc" ${s}/><path d="M172 80L184 86L172 92Z" fill="${RED}"/>`;
    // Robe.
    g += `<path d="M78 300Q84 214 125 196Q166 214 172 300Z" fill="${robe}" ${s}/>`;
    g += `<path d="M112 200L138 200L146 300L104 300Z" fill="${trim}" ${s}/>`;
    for (let y = 222; y < 296; y += 18) g += `<circle cx="125" cy="${y}" r="4" fill="${light}" ${s.replace('2"', '1.4"')}/>`;
    if (r === 'Q') g += `<path d="M90 300Q96 240 116 214" fill="none" stroke="${light}" stroke-width="5"/><path d="M160 300Q154 240 134 214" fill="none" stroke="${light}" stroke-width="5"/>`;
    // Hair, head and face.
    g += r === 'Q'
      ? `<path d="M88 150Q84 210 104 214L146 214Q166 210 162 150Q160 104 125 102Q90 104 88 150Z" fill="${HAIR}" ${s}/>`
      : `<path d="M92 146Q90 190 106 196L144 196Q160 190 158 146Q156 106 125 104Q94 106 92 146Z" fill="${HAIR}" ${s}/>`;
    g += `<ellipse cx="125" cy="152" rx="27" ry="31" fill="${SKIN}" ${s}/>`;
    g += `<path d="M98 136Q110 112 125 118Q140 112 152 136Q140 124 125 128Q110 124 98 136Z" fill="${HAIR}" ${s}/>`;
    g += `<path d="M110 152q5 4 10 0M130 152q5 4 10 0" fill="none" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>`;
    g += `<circle cx="108" cy="162" r="4" fill="#F7A9A0" opacity=".7"/><circle cx="142" cy="162" r="4" fill="#F7A9A0" opacity=".7"/>`;
    g += `<path d="M120 168q5 3 10 0" fill="none" stroke="${RED}" stroke-width="2" stroke-linecap="round"/>`;
    // Headwear.
    if (r === 'K') g += `<path d="M100 116L102 92L113 104L125 86L137 104L148 92L150 116Z" fill="#F5C842" ${s}/><circle cx="125" cy="108" r="4" fill="${RED}"/>`;
    else if (r === 'Q') g += `<path d="M106 112L109 96L118 104L125 92L132 104L141 96L144 112Z" fill="#F5C842" ${s}/>`;
    else g += `<path d="M98 120Q100 100 125 98Q150 100 152 120Q125 112 98 120Z" fill="${BROWN === robe ? '#5A1E22' : '#3B1D14'}" ${s}/><path d="M142 104Q150 84 164 88Q154 96 148 112Z" fill="#6DBE6D" ${s}/>`;
    // A suit mark at the hem.
    g += Art.pip(code[1], 125, 268, 26, ink === BROWN ? light : '#fff');
    return g;
  }

  Art.registerDeck('storybook', {
    name: 'Storybook',
    back: 'lattice-red',
    paper: '#FFFDF8',
    edge: '#C9B8A6',
    radius: 22,
    ink: { H: RED, D: RED, S: BROWN, C: BROWN },
    indexFont: "'Jost', 'Futura', sans-serif",
    indexWeight: 600,
    pipSize: 40,
    layout,
    court,
  });
})(typeof window !== 'undefined' ? window : globalThis);
