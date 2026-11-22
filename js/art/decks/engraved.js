/* 52 Cards — Engraved deck. Teal ink on pale green paper, like a
 * banknote: fine double rules, hatched court figures, a rosette ace. */
(function (root) {
  'use strict';
  const Art = root.C52.Art;

  const TEAL = '#1E5A53';
  const PAPER = '#EEF3DC';

  // Engraving hatch laid over each court half.
  // Diagonals clipped to the half-frame (x 48–202, y 40–175).
  let hatch = '';
  for (let x0 = -87; x0 < 202; x0 += 5) {
    const t0 = Math.max(0, 48 - x0);
    const t1 = Math.min(135, 202 - x0);
    if (t1 > t0) hatch += `M${x0 + t0} ${40 + t0}L${x0 + t1} ${40 + t1}`;
  }
  const overlay = `<path d="${hatch}" stroke="${TEAL}" stroke-width=".55" opacity=".22"/>`;

  const court = Art.makeClassicCourt({
    dark: '#163F3A',
    skin: '#F6F9EC',
    steel: '#DCE7CF',
    shaft: '#2F6E66',
    leaf: '#2F6E66',
    lips: TEAL,
    crown: '#CFE2B4',
    frame: '#F3F7E6',
    collarQ: '#F6F9EC',
    robes: {
      S: { robe: '#2F7A70', trim: '#DCEBC0', accent: TEAL },
      H: { robe: '#5E9E92', trim: '#F0F5E2', accent: TEAL },
      D: { robe: '#CFE2B4', trim: '#2F7A70', accent: TEAL },
      C: { robe: TEAL, trim: '#DCEBC0', accent: '#8FC1B5' },
    },
    hair: { K: '#E4EED2', Q: '#BBD49A', J: '#7FAF9F' },
    overlay,
  });

  function rosette(r, petals, phase) {
    let d = '';
    for (let i = 0; i <= 360; i++) {
      const t = (i / 360) * Math.PI * 2;
      const rr = r * (0.7 + 0.3 * Math.cos(petals * t + phase));
      d += (i ? 'L' : 'M') + (125 + rr * Math.cos(t)).toFixed(1) + ' ' + (175 + rr * Math.sin(t)).toFixed(1);
    }
    return d + 'Z';
  }
  const ROSETTE = [0, 0.6, 1.2, 1.8].map((ph) => `<path d="${rosette(70, 10, ph)}" fill="none" stroke="${TEAL}" stroke-width=".7" opacity=".55"/>`).join('');

  Art.registerDeck('engraved', {
    name: 'Engraved',
    back: 'guilloche',
    paper: PAPER,
    edge: '#9FB38F',
    ink: { S: TEAL, H: TEAL, D: TEAL, C: TEAL },
    indexFont: "'Cormorant Garamond', Georgia, serif",
    indexWeight: 700,
    pipSize: 44,
    decor: () =>
      `<rect x="10" y="10" width="230" height="330" rx="9" fill="none" stroke="${TEAL}" stroke-width=".9" opacity=".7"/>` +
      `<rect x="14" y="14" width="222" height="322" rx="7" fill="none" stroke="${TEAL}" stroke-width=".4" opacity=".7"/>`,
    court,
    ace: (code, ink, a) => ROSETTE + `<circle cx="125" cy="175" r="46" fill="${PAPER}"/>` + a.pip(code[1], 125, 175, 70, ink),
  });
})(typeof window !== 'undefined' ? window : globalThis);
