/* 52 Cards — music stings. Short original phrases in a 1960s spy-jazz
 * idiom, built around the minor-major ninth chord (E G B D# F#):
 * vibraphone, a twangy baritone guitar, brushed snare, muted brass.
 *
 *   C52.Sound.sting('win' | 'lose' | 'big')
 */
(function (root) {
  'use strict';
  const C52 = (root.C52 = root.C52 || {});
  const X = () => C52.Mixer;

  const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
  // E2 = 40. The chord tones used below, as MIDI note numbers.
  const E2 = 40, B2 = 47, E3 = 52, G3 = 55, B3 = 59, Ds4 = 63, E4 = 64, Fs4 = 66, G4 = 67, B4 = 71, Ds5 = 75, Fs5 = 78, G5 = 79, B5 = 83;

  /* Vibraphone: FM bar tone with the motor's slow tremolo. */
  function vibe(t, midi, dur, gain, pan) {
    const m = X();
    const ctx = m.ctx;
    const f = hz(midi);
    const car = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modG = ctx.createGain();
    car.frequency.value = f;
    mod.frequency.value = f * 4;
    modG.gain.setValueAtTime(f * 1.4, t);
    modG.gain.exponentialRampToValueAtTime(1, t + 0.35);
    mod.connect(modG);
    modG.connect(car.frequency);
    const trem = ctx.createOscillator();
    const tremG = ctx.createGain();
    trem.frequency.value = 5.2;
    tremG.gain.value = 0.22;
    const amp = ctx.createGain();
    m.env(amp, t, 0.003, gain, dur);
    const depth = ctx.createGain();
    depth.gain.value = 0.78;
    trem.connect(tremG);
    tremG.connect(depth.gain);
    car.connect(amp);
    amp.connect(depth);
    depth.connect(m.out('music', pan));
    [car, mod, trem].forEach((o) => {
      o.start(t);
      o.stop(t + dur + 0.1);
    });
  }

  /* Baritone guitar: Karplus–Strong pluck, rendered once per pitch. */
  const ksCache = {};
  function ksBuffer(midi, dur) {
    const m = X();
    const ctx = m.ctx;
    const key = midi + ':' + dur;
    if (ksCache[key]) return ksCache[key];
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * dur);
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    const N = Math.round(sr / hz(midi));
    let prev = 0;
    for (let i = 0; i < N; i++) {
      const w = Math.random() * 2 - 1; // bright pick: lightly filtered noise
      prev = prev * 0.25 + w * 0.75;
      d[i] = prev;
    }
    for (let i = N; i < len; i++) d[i] = 0.996 * 0.5 * (d[i - N] + d[i - N - 1]);
    return (ksCache[key] = buf);
  }
  function guitar(t, midi, dur, gain, pan) {
    const m = X();
    const ctx = m.ctx;
    const src = ctx.createBufferSource();
    src.buffer = ksBuffer(midi, dur);
    src.detune.setValueAtTime(-18, t); // a little pre-bend into the note: the twang
    src.detune.linearRampToValueAtTime(0, t + 0.09);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2600;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.setTargetAtTime(0.0001, t + dur * 0.6, dur * 0.2);
    src.connect(lp);
    lp.connect(g);
    g.connect(m.out('music', pan));
    src.start(t);
    src.stop(t + dur);
  }

  /* Muted brass: detuned saws behind a lowpass that opens and closes. */
  function brass(t, notes, dur, gain, open, fall) {
    const m = X();
    const ctx = m.ctx;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 1.2;
    lp.frequency.setValueAtTime(260, t);
    lp.frequency.exponentialRampToValueAtTime(open || 1300, t + Math.min(0.25, dur * 0.3));
    lp.frequency.exponentialRampToValueAtTime(220, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.12, dur * 0.25));
    g.gain.setTargetAtTime(0.0001, t + dur * 0.55, dur * 0.18);
    lp.connect(g);
    g.connect(m.out('music', 0));
    notes.forEach((n) => {
      [-7, 7].forEach((cents) => {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(hz(n), t);
        if (fall) o.frequency.exponentialRampToValueAtTime(hz(n - fall), t + dur);
        o.detune.value = cents;
        o.connect(lp);
        o.start(t);
        o.stop(t + dur + 0.2);
      });
    });
  }

  function brushSwish(t, dur, gain) {
    X().burst({ t, dur, attack: dur * 0.4, gain, type: 'bandpass', f: 3200, f2: 5200, q: 0.7, bus: 'music' });
  }
  function bass(t, midi, dur, gain) {
    X().tone({ t, f: hz(midi), dur, gain, type: 'triangle', lp: 500, bus: 'music' });
  }

  const STINGS = {
    // A cool, unhurried resolution.
    win(t) {
      brushSwish(t, 0.18, 0.08);
      bass(t, E2, 1.2, 0.28);
      guitar(t, E2 + 12, 1.6, 0.5, -0.2);
      [E4, G4, B4, Ds5, Fs5].forEach((n, i) => vibe(t + 0.14 + i * 0.085, n, 1.6, 0.11, 0.25));
      brass(t + 0.55, [E3, G3, B3, Ds4], 1.6, 0.05, 1100);
      vibe(t + 0.62, B4, 2.2, 0.07, 0.3);
      vibe(t + 0.62, Fs5, 2.2, 0.06, 0.3);
      return 2.6;
    },
    // A low swell that sinks a semitone and fades.
    lose(t) {
      bass(t, E2, 1.8, 0.22);
      guitar(t, E2, 1.8, 0.32, -0.25);
      brass(t + 0.05, [E3, G3, B3], 2.0, 0.055, 800, 1);
      vibe(t + 0.4, G4, 1.6, 0.05, 0.3);
      vibe(t + 0.4, Ds5 - 1, 1.6, 0.04, 0.3);
      return 2.4;
    },
    // Royal flush, grand slam, shooting the moon, a Klondike clear.
    big(t) {
      for (let i = 0; i < 6; i++) brushSwish(t + i * 0.09, 0.12, 0.05 + i * 0.012);
      const t1 = t + 0.6;
      bass(t1, E2, 1.6, 0.32);
      guitar(t1, E2, 2.2, 0.55, -0.25);
      guitar(t1 + 0.18, B2, 2.0, 0.35, -0.2);
      brass(t1, [E3, B3, Ds4, Fs4, G4], 0.5, 0.075, 2400);
      [E4, G4, B4, Ds5, Fs5, G5, B5].forEach((n, i) => vibe(t1 + 0.25 + i * 0.07, n, 1.8, 0.1, 0.2));
      brass(t1 + 0.9, [E3, G3, B3, Ds4], 2.4, 0.05, 1200);
      [B4, Ds5, Fs5].forEach((n) => vibe(t1 + 0.95, n, 3, 0.06, 0.3));
      return 4;
    },
  };

  function sting(name) {
    const m = X();
    if (!m || !m.ready() || !STINGS[name]) return 0;
    try {
      return STINGS[name](m.ctx.currentTime + 0.02);
    } catch (e) {
      return 0;
    }
  }

  C52.Sound = Object.assign(C52.Sound || {}, { sting });
})(typeof window !== 'undefined' ? window : globalThis);
