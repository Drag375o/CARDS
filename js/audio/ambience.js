/* 52 Cards — venue ambience. Quiet room tone under the game, chosen by
 * the venue's `ambience` id. Each bed is a continuous layer plus
 * occasional distant events, all on the ambience bus. */
(function (root) {
  'use strict';
  const C52 = (root.C52 = root.C52 || {});
  const X = () => C52.Mixer;

  let current = null; // { id, nodes: [], timers: [] }

  /* A looping, filtered noise bed whose level drifts slowly: room murmur. */
  function murmur(f, q, level, rates) {
    const m = X();
    const ctx = m.ctx;
    const src = ctx.createBufferSource();
    src.buffer = m.noise;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f;
    bp.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = level;
    const lfos = rates.map((r) => {
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.frequency.value = r;
      og.gain.value = level * 0.35;
      o.connect(og);
      og.connect(g.gain);
      o.start();
      return o;
    });
    src.connect(bp);
    bp.connect(g);
    g.connect(m.bus('ambience'));
    src.start(0, Math.random() * 1.5);
    return [src, g, ...lfos];
  }

  /* Soft sustained pad, very low: a string quartet in the next room. */
  function quartet(state) {
    const m = X();
    const ctx = m.ctx;
    const chords = [
      [52, 55, 59, 66], // Em9
      [48, 52, 55, 59], // Cmaj7
      [45, 48, 52, 59], // Am(add9)
      [47, 52, 54, 57], // B7sus
    ];
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 650;
    lp.connect(m.bus('ambience'));
    state.nodes.push(lp);
    let i = 0;
    const next = () => {
      const t = ctx.currentTime;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.016, t + 3);
      g.gain.setTargetAtTime(0.0001, t + 7, 1.4);
      g.connect(lp);
      chords[i++ % chords.length].forEach((n) => {
        [-5, 5].forEach((c) => {
          const o = ctx.createOscillator();
          o.type = 'sawtooth';
          o.frequency.value = 440 * Math.pow(2, (n - 69) / 12);
          o.detune.value = c;
          o.connect(g);
          o.start(t);
          o.stop(t + 12);
        });
      });
      state.timers.push(setTimeout(next, 8000));
    };
    next();
  }

  /* Distant roulette: a ball rattling round and settling. */
  function roulette() {
    const m = X();
    const t = m.ctx.currentTime;
    let dt = 0.05;
    let tt = t;
    for (let i = 0; i < 34; i++) {
      m.burst({ t: tt, dur: 0.008, gain: 0.05, type: 'bandpass', f: m.rand(2600, 3800), q: 3, bus: 'ambience', pan: 0.6 });
      tt += dt;
      dt *= 1.07;
    }
    m.burst({ t: tt + 0.1, dur: 0.02, gain: 0.07, type: 'bandpass', f: 2200, q: 2, bus: 'ambience', pan: 0.6 });
  }

  /* Distant chips at another table. */
  function farChips() {
    const m = X();
    const t = m.ctx.currentTime;
    const pan = m.rand(-0.8, 0.8);
    for (let i = 0; i < 3; i++) {
      m.partials(t + i * m.rand(0.04, 0.08), [m.vary(3300, 0.05), m.vary(5100, 0.05)], 0.06, 0.012, pan, 'ambience');
    }
  }

  function every(state, minS, maxS, fn) {
    const loop = () => {
      fn();
      state.timers.push(setTimeout(loop, 1000 * X().rand(minS, maxS)));
    };
    state.timers.push(setTimeout(loop, 1000 * X().rand(minS * 0.4, maxS * 0.6)));
  }

  const BEDS = {
    salon(state) {
      state.nodes.push(...murmur(480, 0.7, 0.05, [0.11, 0.29, 0.07]));
      state.nodes.push(...murmur(1150, 1.1, 0.018, [0.17, 0.41]));
      quartet(state);
      every(state, 28, 50, roulette);
      every(state, 6, 15, farChips);
    },
  };

  function stop() {
    if (!current) return;
    current.timers.forEach(clearTimeout);
    const ctx = X().ctx;
    current.nodes.forEach((n) => {
      try {
        if (n.gain && n.gain.setTargetAtTime) n.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
        if (n.stop) n.stop(ctx.currentTime + 1.5);
      } catch (e) {
        /* already stopped */
      }
    });
    current = null;
  }

  /** Start, switch or stop the bed to match the current venue and volume. */
  function sync() {
    const m = X();
    if (!m || !m.ready() || !C52.Prefs) return;
    const p = C52.Prefs.get();
    const id = C52.Venues.get(p.venue).ambience;
    const want = p.muted || p.volume.ambience <= 0.001 ? null : id;
    if (current && current.id === want) return;
    stop();
    if (want && BEDS[want]) {
      current = { id: want, nodes: [], timers: [] };
      BEDS[want](current);
    }
  }

  C52.Ambience = { sync, stop };
})(typeof window !== 'undefined' ? window : globalThis);
