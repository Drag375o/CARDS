/* 52 Cards — audio mixer. One AudioContext, created on the first tap or
 * key press (browsers block sound before that).
 *
 *   effects ─┐
 *   music   ─┼─► master ─► compressor ─► speakers
 *   ambience┘      ▲
 *        └─ send ─► room reverb (per venue) ─┘
 *
 * Also holds the small synthesis helpers the foley, stings and ambience
 * modules share: filtered noise bursts, enveloped tones, metallic partials.
 */
(function (root) {
  'use strict';
  const C52 = (root.C52 = root.C52 || {});

  const M = {
    ctx: null,
    bus: {},
    noise: null,
    roomKey: '',
  };

  function ensure() {
    if (M.ctx) return M.ctx;
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    const ctx = (M.ctx = new AC());

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 12;
    comp.ratio.value = 3;
    comp.attack.value = 0.004;
    comp.release.value = 0.2;
    comp.connect(ctx.destination);

    const master = ctx.createGain();
    master.connect(comp);
    const send = ctx.createGain();
    const verb = ctx.createConvolver();
    const wet = ctx.createGain();
    send.connect(verb);
    verb.connect(wet);
    wet.connect(master);

    const mk = (sendAmt) => {
      const g = ctx.createGain();
      g.connect(master);
      const s = ctx.createGain();
      s.gain.value = sendAmt;
      g.connect(s);
      s.connect(send);
      return g;
    };
    M.bus = { master, fx: mk(1), music: mk(0.85), ambience: mk(0.35), verb, wet };

    // Two seconds of white noise, shared by every noise-based sound.
    const len = ctx.sampleRate * 2;
    M.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = M.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    applyVolumes();
    setRoom();
    return ctx;
  }

  /** Synthetic impulse response: decaying stereo noise, darkened by `tone`. */
  function impulse(size, decay, tone) {
    const ctx = M.ctx;
    const len = Math.floor(ctx.sampleRate * size);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    const a = Math.exp((-2 * Math.PI * tone) / ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const env = Math.pow(1 - i / len, decay);
        lp = lp * a + (Math.random() * 2 - 1) * (1 - a);
        d[i] = lp * env * 3;
      }
    }
    return buf;
  }

  function setRoom() {
    if (!M.ctx || !C52.Venues || !C52.Prefs) return;
    const v = C52.Venues.get(C52.Prefs.get().venue);
    const r = v.room || { size: 1.4, decay: 2.4, wet: 0.14, tone: 5000 };
    const key = v.id;
    if (key === M.roomKey) return;
    M.roomKey = key;
    M.bus.verb.buffer = impulse(r.size, r.decay, r.tone);
    M.bus.wet.gain.setTargetAtTime(r.wet, M.ctx.currentTime, 0.2);
  }

  function applyVolumes() {
    if (!M.ctx || !C52.Prefs) return;
    const p = C52.Prefs.get();
    const t = M.ctx.currentTime;
    const v = p.volume;
    M.bus.master.gain.setTargetAtTime(p.muted ? 0 : v.master, t, 0.05);
    M.bus.fx.gain.setTargetAtTime(v.fx, t, 0.05);
    M.bus.music.gain.setTargetAtTime(v.music, t, 0.05);
    M.bus.ambience.gain.setTargetAtTime(v.ambience, t, 0.3);
  }

  /* ---------- synthesis helpers ---------- */

  const rand = (a, b) => a + Math.random() * (b - a);
  /** Slight random variation so repeated sounds never match exactly. */
  const vary = (x, amt) => x * (1 + rand(-amt, amt));

  /** Panner on a bus. */
  function out(bus, pan) {
    const ctx = M.ctx;
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    if (p.pan) p.pan.value = Math.max(-1, Math.min(1, pan || 0));
    p.connect(M.bus[bus || 'fx']);
    return p;
  }

  /** Exponential attack/decay envelope on a GainNode. */
  function env(g, t, attack, peak, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  /**
   * Filtered noise burst.
   * o: { t, dur, attack, gain, type, f, f2, q, pan, bus, rate }
   */
  function burst(o) {
    const ctx = M.ctx;
    const t = o.t || ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = M.noise;
    src.playbackRate.value = o.rate || 1;
    const filt = ctx.createBiquadFilter();
    filt.type = o.type || 'bandpass';
    filt.frequency.setValueAtTime(o.f || 2000, t);
    if (o.f2) filt.frequency.exponentialRampToValueAtTime(o.f2, t + (o.attack || 0.005) + o.dur);
    filt.Q.value = o.q == null ? 1 : o.q;
    const g = ctx.createGain();
    env(g, t, o.attack || 0.004, o.gain || 0.3, o.dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(out(o.bus, o.pan));
    const off = Math.random() * 1.5;
    src.start(t, off, (o.attack || 0.005) + o.dur + 0.05);
    return g;
  }

  /**
   * Enveloped oscillator.
   * o: { t, f, f2, dur, attack, gain, type, pan, bus, lp }
   */
  function tone(o) {
    const ctx = M.ctx;
    const t = o.t || ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + o.dur);
    const g = ctx.createGain();
    env(g, t, o.attack || 0.004, o.gain || 0.2, o.dur);
    let node = osc;
    if (o.lp) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.lp;
      osc.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(out(o.bus, o.pan));
    osc.start(t);
    osc.stop(t + (o.attack || 0.004) + o.dur + 0.05);
    return osc;
  }

  /** Inharmonic partials with fast decay: the ring of metal or clay. */
  function partials(t, freqs, decay, gain, pan, bus) {
    freqs.forEach((f, i) => tone({ t, f: vary(f, 0.02), dur: decay * (1 - i * 0.15), gain: gain / (1 + i * 0.6), pan, bus }));
  }

  // Unlock audio on the first gesture; pause it while the tab is hidden.
  function unlock() {
    const ctx = ensure();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    if (ctx && C52.Ambience) C52.Ambience.sync();
  }
  if (root.addEventListener && root.document) {
    ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => root.addEventListener(ev, unlock, { passive: true }));
    root.document.addEventListener('visibilitychange', () => {
      if (!M.ctx) return;
      if (root.document.hidden) M.ctx.suspend();
      else M.ctx.resume();
    });
  }

  C52.Mixer = {
    ensure,
    // A context still resuming counts as ready: sounds scheduled now play the moment it starts.
    ready: () => !!M.ctx && M.ctx.state !== 'closed',
    get ctx() { return M.ctx; },
    get noise() { return M.noise; },
    bus: (name) => M.bus[name],
    setRoom, applyVolumes, out, env, burst, tone, partials, rand, vary,
  };
})(typeof window !== 'undefined' ? window : globalThis);
