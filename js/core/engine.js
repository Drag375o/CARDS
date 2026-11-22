/* 52 Cards — helpers shared by every rules engine.
 *
 * Engines keep a public event list on the state. The interface reads it to
 * narrate (subtitles), play sounds and animate; online guests receive it in
 * their view. Events must therefore never reveal hidden cards.
 *   { id, text, sound, seat, count, sting, card }
 */
(function (root) {
  'use strict';
  const C52 = (root.C52 = root.C52 || {});
  const K = () => C52.Cards;

  const MAX_EVENTS = 80;

  function emit(state, ev) {
    state.seq = (state.seq || 0) + 1;
    ev.id = state.seq;
    state.events.push(ev);
    if (state.events.length > MAX_EVENTS) state.events.splice(0, state.events.length - MAX_EVENTS);
    return ev;
  }

  const next = (state, seat, step) => (seat + (step || 1) + state.n * 4) % state.n;
  const nm = (state, seat) => state.names[seat];

  /** Base fields every match state carries. */
  function base(game, cfg) {
    return {
      game,
      n: cfg.n,
      names: cfg.names.slice(),
      options: Object.assign({}, cfg.options),
      events: [],
      seq: 0,
      round: 0,
      phase: 'deal',
      turn: null,
      scores: new Array(cfg.n).fill(0),
      history: [], // one row per finished round: { label, points: [] }
      summary: null, // shown by the debrief when a round or the game ends
      winners: null,
    };
  }

  /** Fields every view carries. */
  function baseView(state, seat) {
    return {
      game: state.game,
      me: seat,
      n: state.n,
      names: state.names,
      round: state.round,
      phase: state.phase,
      turn: state.turn,
      scores: state.scores,
      history: state.history,
      summary: state.summary,
      winners: state.winners,
      options: state.options,
      events: state.events,
      seq: state.seq,
    };
  }

  /** Require an action to be one of the legal ones (matched by fields). */
  function legal(actions, action) {
    const keys = Object.keys(action);
    const found = actions.find((a) => keys.every((k) => JSON.stringify(a[k]) === JSON.stringify(action[k])) && Object.keys(a).length === keys.length);
    if (!found) throw new Error('Illegal move: ' + JSON.stringify(action));
    return found;
  }

  /** "Ace of spades" with a capital. */
  const cardName = (c) => {
    const s = K().name(c);
    return s[0].toUpperCase() + s.slice(1);
  };

  /** List with "and": a, b and c */
  const andList = (xs) => (xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]);

  const clone = (x) => JSON.parse(JSON.stringify(x));

  C52.Engine = { emit, next, nm, base, baseView, legal, cardName, andList, clone };
})(typeof window !== 'undefined' ? window : globalThis);
