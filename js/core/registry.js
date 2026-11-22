/* 52 Cards — the twelve games: metadata for menus and seating, plus the
 * rules engine each game registers once it exists.
 *
 * A rules engine is a plain object (see README › Architecture):
 *   { createMatch(players, options, rng), actionsFor(state, seat),
 *     apply(state, seat, action), view(state, seat), result(state),
 *     zones(state) }
 */
(function (root) {
  'use strict';
  const C52 = (root.C52 = root.C52 || {});

  const META = [
    { id: 'holdem', num: 1, name: "Texas Hold'em", suit: 'S', players: [2, 10], kind: 'Betting', group: 'renowned',
      line: 'Make the best five-card hand from two hole cards and five on the board.',
      length: '20–60 min', solo: false },
    { id: 'blackjack', num: 2, name: 'Blackjack', suit: 'H', players: [1, 7], kind: 'Banking', group: 'renowned',
      line: 'Closer to 21 than the dealer, without going over.',
      length: 'Hand by hand', solo: true },
    { id: 'klondike', num: 3, name: 'Klondike', suit: 'D', players: [1, 1], kind: 'Patience', group: 'renowned',
      line: 'Build all four suits from Ace to King.',
      length: '5–15 min', solo: true },
    { id: 'rummy', num: 4, name: 'Rummy', suit: 'C', players: [2, 6], kind: 'Draw & discard', group: 'renowned',
      line: 'Meld sets and runs until your hand is empty.',
      length: '20–40 min', solo: false },
    { id: 'hearts', num: 5, name: 'Hearts', suit: 'H', players: [4, 4], kind: 'Trick-avoidance', group: 'renowned',
      line: 'Avoid Hearts and the Queen of Spades, or take every one.',
      length: '20–30 min', solo: false },
    { id: 'spades', num: 6, name: 'Spades', suit: 'S', players: [4, 4], kind: 'Partnership tricks', group: 'renowned',
      line: 'Win exactly what your team bid. Spades are always trump.',
      length: '30–45 min', solo: false, teams: true },
    { id: 'bridge', num: 7, name: 'Contract Bridge', suit: 'C', players: [4, 4], kind: 'Auction & tricks', group: 'renowned',
      line: 'Win the auction for a contract, then make it.',
      length: '45–90 min', solo: false, teams: true },
    { id: 'crazy8', num: 8, name: 'Crazy Eights', suit: 'D', players: [2, 7], kind: 'Shedding', group: 'renowned',
      line: 'Match the suit or rank. Eights are wild.',
      length: '10–20 min', solo: false },
    { id: 'bigtwo', num: 9, name: 'Big Two', suit: 'S', players: [2, 4], kind: 'Climbing', group: 'niche',
      line: 'Beat the last play with a stronger one. Twos are highest.',
      length: '10–20 min', solo: false },
    { id: 'ers', num: 10, name: 'Egyptian Rat Screw', suit: 'C', players: [2, 6], kind: 'Reflex', group: 'niche',
      line: 'Win face-card challenges and slap doubles to take the pile.',
      length: '10–20 min', solo: false },
    { id: 'ohhell', num: 11, name: 'Oh Hell', suit: 'H', players: [3, 7], kind: 'Exact bidding', group: 'niche',
      line: 'Bid exactly how many tricks you will take. Not one more.',
      length: '30–45 min', solo: false },
    { id: 'twentyfive', num: 12, name: 'Twenty-Five', suit: 'D', players: [3, 9], kind: 'Irish tricks', group: 'niche',
      line: 'First to 25. The five of trumps beats everything.',
      length: '10–20 min', solo: false },
  ];

  const ENGINES = {};

  C52.Games = {
    list: () => META.slice(),
    meta: (id) => META.find((g) => g.id === id),
    register(id, engine) {
      ENGINES[id] = engine;
    },
    engine: (id) => ENGINES[id] || null,
    playable: (id) => !!ENGINES[id] && !!(C52.Tables && C52.Tables[id]),
  };
})(typeof window !== 'undefined' ? window : globalThis);
