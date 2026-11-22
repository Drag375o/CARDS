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

  /** A steady low drone: two detuned oscillators through a lowpass. */
  function drone(state, f, level, lp) {
    const m = X();
    const ctx = m.ctx;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = lp || 300;
    const g = ctx.createGain();
    g.gain.value = level;
    filt.connect(g);
    g.connect(m.bus('ambience'));
    [f, f * 1.007].forEach((fr) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = fr;
      o.connect(filt);
      o.start();
      state.nodes.push(o);
    });
    state.nodes.push(g);
  }

  /** Noise bed with a fixed band and level (rain, rumble). */
  function bed(state, type, f, q, level, f2) {
    const m = X();
    const ctx = m.ctx;
    const src = ctx.createBufferSource();
    src.buffer = m.noise;
    src.loop = true;
    const a = ctx.createBiquadFilter();
    a.type = type;
    a.frequency.value = f;
    a.Q.value = q;
    let tail = a;
    if (f2) {
      const b = ctx.createBiquadFilter();
      b.type = 'lowpass';
      b.frequency.value = f2;
      a.connect(b);
      tail = b;
    }
    const g = ctx.createGain();
    g.gain.value = level;
    src.connect(a);
    tail.connect(g);
    g.connect(m.bus('ambience'));
    src.start(0, Math.random());
    state.nodes.push(src, g);
    return g;
  }

  function drip() {
    const m = X();
    const t = m.ctx.currentTime;
    m.tone({ t, f: m.rand(1400, 2200), f2: m.rand(700, 900), dur: 0.09, gain: 0.025, bus: 'ambience', pan: m.rand(-0.9, 0.9) });
  }

  /** A short, muted trumpet phrase two floors down. */
  function trumpet() {
    const m = X();
    const ctx = m.ctx;
    let t = ctx.currentTime;
    const notes = [[64, 0.5], [67, 0.25], [69, 0.25], [70, 0.5], [69, 0.4], [67, 0.9]];
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    lp.connect(m.bus('ambience'));
    notes.forEach(([n, d]) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = 440 * Math.pow(2, (n - 69) / 12);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.012, t + 0.06);
      g.gain.setTargetAtTime(0.0001, t + d * 0.8, 0.08);
      o.connect(g);
      g.connect(lp);
      o.start(t);
      o.stop(t + d + 0.3);
      t += d;
    });
  }

  function clink() {
    const m = X();
    const t = m.ctx.currentTime;
    const pan = m.rand(-0.7, 0.7);
    m.partials(t, [m.vary(3900, 0.05), m.vary(6100, 0.05), m.vary(8200, 0.05)], 0.25, 0.012, pan, 'ambience');
    if (Math.random() < 0.5) m.partials(t + 0.12, [m.vary(4300, 0.05), m.vary(6600, 0.05)], 0.2, 0.008, pan, 'ambience');
  }

  function shaker() {
    const m = X();
    const t = m.ctx.currentTime;
    for (let i = 0; i < 10; i++) m.burst({ t: t + i * 0.16, dur: 0.07, attack: 0.02, gain: 0.02, type: 'bandpass', f: 5200, q: 1.2, bus: 'ambience', pan: 0.5 });
  }

  /** Rail joints under the dining car: da-dum ... da-dum. */
  function clack(state) {
    const m = X();
    const loop = () => {
      const t = m.ctx.currentTime;
      [0, 0.16].forEach((dt) => m.burst({ t: t + dt, dur: 0.07, gain: 0.05, type: 'lowpass', f: 260, q: 0.8, bus: 'ambience' }));
      state.timers.push(setTimeout(loop, 1050 + Math.random() * 120));
    };
    loop();
  }

  function whistle() {
    const m = X();
    const ctx = m.ctx;
    const t = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    g.gain.setTargetAtTime(0.0001, t + 1.6, 0.4);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1500;
    g.connect(lp);
    lp.connect(m.bus('ambience'));
    [698, 880].forEach((f) => {
      const o = ctx.createOscillator();
      o.frequency.value = f;
      o.connect(g);
      o.start(t);
      o.stop(t + 3);
    });
  }

  /** A slow, heavy clock: tick, tock. */
  function clock(state) {
    const m = X();
    let odd = false;
    const loop = () => {
      const t = m.ctx.currentTime;
      m.burst({ t, dur: 0.012, gain: 0.05, type: 'bandpass', f: odd ? 2400 : 3000, q: 5, bus: 'ambience', pan: -0.4 });
      odd = !odd;
      state.timers.push(setTimeout(loop, 1000));
    };
    loop();
  }

  const BEDS = {
    lair(state) {
      drone(state, 41, 0.03, 160);
      state.nodes.push(...murmur(140, 0.6, 0.05, [0.05, 0.12]));
      every(state, 3, 9, drip);
    },
    noir(state) {
      bed(state, 'highpass', 900, 0.5, 0.03, 6500); // rain on the window
      const fan = bed(state, 'bandpass', 220, 0.9, 0.012);
      const ctx = X().ctx;
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.frequency.value = 3.6;
      og.gain.value = 0.006;
      o.connect(og);
      og.connect(fan.gain);
      o.start();
      state.nodes.push(o);
      every(state, 35, 70, trumpet);
    },
    mayfair(state) {
      state.nodes.push(...murmur(520, 0.8, 0.02, [0.13, 0.3]));
      quartet(state);
      every(state, 7, 16, clink);
      every(state, 45, 90, shaker);
    },
    train(state) {
      bed(state, 'lowpass', 180, 0.7, 0.05);
      clack(state);
      every(state, 60, 120, whistle);
    },
    vault(state) {
      drone(state, 60, 0.012, 180);
      clock(state);
    },
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
