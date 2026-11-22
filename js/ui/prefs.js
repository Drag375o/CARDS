/* 52 Cards — player preferences, saved on this device. */
(function (root) {
  'use strict';
  const C52 = (root.C52 = root.C52 || {});
  const KEY = '52cards:prefs';

  const DEFAULTS = {
    venue: 'riviera',
    deck: null, // null = the venue's suggested deck
    back: null, // null = the deck's / venue's suggested back
    fourColour: false,
    largeIndex: false,
    reducedMotion: false,
    pace: 1, // computer players' thinking time: 1.5 relaxed, 1 normal, 0.55 brisk
    name: '',
    volume: { master: 0.8, fx: 0.9, music: 0.6, ambience: 0.35 },
    muted: false,
  };

  let prefs = load();
  const listeners = [];

  function load() {
    try {
      const raw = root.localStorage && root.localStorage.getItem(KEY);
      const saved = raw ? JSON.parse(raw) : {};
      return Object.assign({}, DEFAULTS, saved, { volume: Object.assign({}, DEFAULTS.volume, saved.volume) });
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULTS));
    }
  }

  function save() {
    try {
      root.localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch (e) {
      /* private mode or storage blocked: preferences last for this visit only */
    }
  }

  C52.Prefs = {
    get: () => prefs,
    set(patch) {
      prefs = Object.assign({}, prefs, patch);
      if (patch.volume) prefs.volume = Object.assign({}, prefs.volume, patch.volume);
      save();
      listeners.forEach((fn) => fn(prefs, patch));
    },
    onChange: (fn) => listeners.push(fn),
    /** The deck and back actually in use, after venue suggestions. */
    look() {
      const v = C52.Venues.get(prefs.venue);
      const deck = prefs.deck || v.deck;
      const d = C52.Art.deck(deck);
      return {
        venue: v.id,
        deck,
        back: prefs.back || v.back || (d && d.back),
        fourColour: prefs.fourColour,
        largeIndex: prefs.largeIndex,
      };
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
