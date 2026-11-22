/* 52 Cards — table foley. Close-mic'd and dry, the sounds of a real
 * high-stakes table: cards on felt, clay chips, a lighter lid.
 *
 *   C52.Sound.play(name, { pan, count, delay })
 *
 * pan:   -1 (left) … 1 (right); deals pan toward the receiving seat
 * count: chips in a bet, cards in a sweep
 * delay: seconds from now
 */
(function (root) {
  'use strict';
  const C52 = (root.C52 = root.C52 || {});
  const X = () => C52.Mixer;

  /* A card's edge sliding across felt, then settling. */
  function slide(t, pan, len) {
    const m = X();
    const d = m.vary(len || 0.13, 0.15);
    m.burst({ t, dur: d, attack: 0.012, gain: m.vary(0.22, 0.2), type: 'bandpass', f: m.vary(3200, 0.12), f2: 1300, q: 0.9, pan });
    m.burst({ t: t + d * 0.85, dur: 0.05, gain: 0.25, type: 'lowpass', f: 520, q: 0.7, pan });
  }

  /* Card laid down: a soft clap of air and paper on cloth. */
  function place(t, pan, firm) {
    const m = X();
    m.burst({ t, dur: 0.035, gain: firm ? 0.42 : 0.28, type: 'bandpass', f: m.vary(2600, 0.15), q: 1.2, pan });
    m.burst({ t, dur: 0.06, gain: firm ? 0.5 : 0.32, type: 'lowpass', f: 380, q: 0.8, pan });
  }

  /* A card turned over: quick, bright snap. */
  function flip(t, pan) {
    const m = X();
    m.burst({ t, dur: 0.018, gain: 0.3, type: 'bandpass', f: m.vary(4200, 0.1), q: 2.2, pan });
    m.burst({ t: t + 0.03, dur: 0.03, gain: 0.18, type: 'highpass', f: 2400, q: 0.7, pan });
  }

  /* Riffle, bridge (cards cascading together), then squared on the felt. */
  function shuffle(t) {
    const m = X();
    for (let half = 0; half < 2; half++) {
      const t0 = t + half * 1.25;
      const n = 38;
      for (let i = 0; i < n; i++) {
        const k = i / n;
        const ti = t0 + 0.62 * Math.pow(k, 0.85) + m.rand(-0.004, 0.004);
        m.burst({ t: ti, dur: 0.01, gain: m.rand(0.08, 0.17) * (0.6 + 0.4 * Math.sin(Math.PI * k)), type: 'bandpass', f: m.rand(2400, 5600), q: 1.6, pan: -0.35 + 0.7 * k });
      }
      // The bridge: a quick fluttering cascade.
      for (let i = 0; i < 12; i++) {
        m.burst({ t: t0 + 0.72 + i * 0.017, dur: 0.03, gain: 0.1 + 0.06 * Math.sin((Math.PI * i) / 12), type: 'bandpass', f: m.rand(1600, 2600), q: 0.8, pan: m.rand(-0.15, 0.15) });
      }
    }
    // Squared: two taps on the table.
    place(t + 2.35, 0, true);
    place(t + 2.5, 0.05, false);
    return 2.6;
  }

  /* Clay chip on chip: short inharmonic ring. */
  function clink(t, pan, g) {
    const m = X();
    m.partials(t, [m.vary(3300, 0.06), m.vary(5100, 0.06), m.vary(7400, 0.05)], 0.07, (g || 0.07), pan);
    m.burst({ t, dur: 0.012, gain: (g || 0.07) * 2.2, type: 'highpass', f: 3000, q: 0.6, pan });
  }

  function chips(t, pan, count) {
    const m = X();
    const n = Math.max(1, Math.min(count || 2, 8));
    for (let i = 0; i < n; i++) clink(t + i * m.rand(0.03, 0.06), pan, m.rand(0.05, 0.09));
  }

  /* A stack pushed across the felt. */
  function push(t, pan, big) {
    const m = X();
    m.burst({ t, dur: big ? 0.45 : 0.25, attack: 0.03, gain: big ? 0.3 : 0.2, type: 'lowpass', f: 900, f2: 300, q: 0.6, pan });
    chips(t + (big ? 0.3 : 0.18), pan, big ? 7 : 4);
  }

  /* The pot raked to the winner. */
  function rake(t, pan) {
    const m = X();
    m.burst({ t, dur: 0.55, attack: 0.05, gain: 0.26, type: 'lowpass', f: 700, f2: 260, q: 0.5, pan });
    for (let i = 0; i < 6; i++) clink(t + 0.1 + i * m.rand(0.05, 0.09), pan, 0.05);
  }

  /* A flat palm on felt. Firm, not comic. */
  function slap(t, pan) {
    const m = X();
    m.burst({ t, dur: 0.09, gain: 0.7, type: 'lowpass', f: 320, q: 0.9, pan });
    m.tone({ t, f: 95, f2: 60, dur: 0.12, gain: 0.35, pan });
    m.burst({ t, dur: 0.025, gain: 0.3, type: 'bandpass', f: 1600, q: 0.8, pan });
  }

  /* Trick swept together and squared. */
  function sweep(t, pan, count) {
    const n = Math.max(2, Math.min(count || 4, 6));
    for (let i = 0; i < n; i++) slide(t + i * 0.045, pan * (i / n), 0.07);
    place(t + n * 0.045 + 0.08, pan, false);
  }

  /* Card drawn from a dealing shoe: slide with a plastic edge. */
  function shoe(t, pan) {
    const m = X();
    m.burst({ t, dur: 0.1, attack: 0.008, gain: 0.22, type: 'bandpass', f: 1900, f2: 1100, q: 3, pan: -0.2 });
    slide(t + 0.08, pan, 0.11);
  }

  /* Bidding-box card: small plastic click. */
  function bid(t, pan) {
    const m = X();
    m.burst({ t, dur: 0.012, gain: 0.3, type: 'bandpass', f: 3600, q: 3, pan });
    m.tone({ t, f: 1450, dur: 0.03, gain: 0.04, pan });
  }

  /* Lighter lid flicked open: two hard clicks and a brief metallic ring. */
  function lighter(t) {
    const m = X();
    m.burst({ t, dur: 0.008, gain: 0.35, type: 'highpass', f: 3500, q: 0.8, pan: 0.15 });
    m.partials(t + 0.002, [2150, 3420, 5230], 0.09, 0.05, 0.15);
    m.burst({ t: t + 0.055, dur: 0.01, gain: 0.25, type: 'bandpass', f: 2600, q: 2, pan: 0.15 });
    m.partials(t + 0.056, [1780, 2960], 0.14, 0.035, 0.15);
  }

  /* Wristwatch tick. */
  function tick(t) {
    X().burst({ t, dur: 0.006, gain: 0.12, type: 'bandpass', f: 4300, q: 4, pan: 0.3 });
  }

  /* Interface: felt brush (hover/close) and a small metal latch (select). */
  function brush(t) {
    X().burst({ t, dur: 0.14, attack: 0.03, gain: 0.07, type: 'lowpass', f: 1300, q: 0.5 });
  }
  function latch(t) {
    const m = X();
    m.burst({ t, dur: 0.008, gain: 0.2, type: 'highpass', f: 2800, q: 0.7 });
    m.partials(t + 0.004, [1840, 2770], 0.06, 0.035, 0);
  }

  const SOUNDS = {
    deal: (t, o) => slide(t, o.pan, 0.14),
    draw: (t, o) => slide(t, o.pan, 0.09),
    place: (t, o) => place(t, o.pan, false),
    meld: (t, o) => place(t, o.pan, true),
    flip: (t, o) => flip(t, o.pan),
    shuffle: (t) => shuffle(t),
    cut: (t) => { slide(t, -0.1, 0.06); place(t + 0.12, 0.1, false); },
    chips: (t, o) => chips(t, o.pan, o.count),
    push: (t, o) => push(t, o.pan, false),
    allin: (t, o) => push(t, o.pan, true),
    rake: (t, o) => rake(t, o.pan),
    slap: (t, o) => slap(t, o.pan),
    sweep: (t, o) => sweep(t, o.pan || 0, o.count),
    shoe: (t, o) => shoe(t, o.pan),
    bid: (t, o) => bid(t, o.pan),
    turn: (t) => lighter(t),
    tick: (t) => tick(t),
    brush: (t) => brush(t),
    latch: (t) => latch(t),
  };

  function play(name, opts) {
    const m = X();
    if (!m || !m.ready()) return 0;
    const fn = SOUNDS[name];
    if (!fn) return 0;
    const o = opts || {};
    return fn(m.ctx.currentTime + 0.005 + (o.delay || 0), o) || 0;
  }

  C52.Sound = Object.assign(C52.Sound || {}, { play, names: () => Object.keys(SOUNDS) });
})(typeof window !== 'undefined' ? window : globalThis);
