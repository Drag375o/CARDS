/* 52 Cards — trick-taking helpers shared by Hearts, Spades, Oh Hell,
 * Twenty-Five and Bridge. A trick is a list of plays [{ seat, card }]. */
(function (root) {
  'use strict';
  const C52 = (root.C52 = root.C52 || {});

  const HIGH = '23456789TJQKA'; // ordinary order, ace high

  /** Cards a player may play: must follow the led suit if able. */
  function follow(hand, led) {
    if (!led) return hand.slice();
    const same = hand.filter((c) => c[1] === led);
    return same.length ? same : hand.slice();
  }

  /** Winning seat of a finished trick with an optional trump suit. */
  function winner(plays, trump, order) {
    const o = order || HIGH;
    const led = plays[0].card[1];
    let best = plays[0];
    for (const p of plays.slice(1)) {
      const c = p.card;
      const b = best.card;
      const cTrump = trump && c[1] === trump;
      const bTrump = trump && b[1] === trump;
      if (cTrump && !bTrump) best = p;
      else if (cTrump === bTrump && c[1] === b[1] && o.indexOf(c[0]) > o.indexOf(b[0])) best = p;
      else if (!cTrump && !bTrump && c[1] === led && b[1] !== led) best = p;
    }
    return best.seat;
  }

  /** Sort a hand for trick games: suits grouped (alternating colours), high cards to the right. */
  const sortHand = (hand, trump) => {
    const suits = trump === 'H' || trump === 'D' ? 'CHSD' : 'HSDC';
    return C52.Cards.sortHand(hand, HIGH, trump ? suits.replace(trump, '') + trump : 'SHCD');
  };

  C52.Tricks = { HIGH, follow, winner, sortHand };
})(typeof window !== 'undefined' ? window : globalThis);
