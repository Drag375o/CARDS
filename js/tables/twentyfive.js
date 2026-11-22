/* 52 Cards — Twenty-Five at the table. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const TT = C52.TrickTable;
  const K = C52.Cards;

  C52.Tables.twentyfive = {
    tilt: 14,
    center(v, ui) {
      let h = TT.trickCards(v, ui);
      if (v.turned) h += TT.trumpCard(v, ui, v.turned, 'Turned: ' + K.SUIT_NAME[v.trump] + ' trump');
      else h += `<div class="suit-badge" style="left:25%;top:44%">Trump ${ui.suitHTML(v.trump)}</div>`;
      if (v.phase === 'rob' && v.robber !== v.me) h += `<div class="suit-badge" style="left:50%;top:50%">${ui.name(v.robber)} may rob the pack</div>`;
      return h;
    },
    status(v) {
      const top = v.topTrumps.join(' ');
      return `<b>Twenty-Five</b> &middot; Hand ${v.round} &middot; Trump ${K.SUIT_SYMBOL[v.trump]} &middot; Top trumps ${top} &middot; First to 25`;
    },
    seatSub: (v, s) => v.scores[s] + ' points',
    seatInfo: (v, s) => (v.won[s] ? `${v.won[s]} trick${v.won[s] > 1 ? 's' : ''}` : ''),
    hint(v, actions) {
      if (v.phase === 'rob') return actions.length ? 'You hold the ace of trumps. Rob the pack: tap a card to throw away, or keep your hand.' : '';
      if (v.phase !== 'play') return '';
      if (!actions.length) return `${v.names[v.turn]} to play`;
      if (!v.trick.length) return 'Your lead.';
      return 'Follow suit or trump. With neither, play anything.';
    },
    hand(v, actions) {
      if (v.phase === 'rob' && actions.length) return { cards: v.hand, playable: new Set(v.hand), multi: false };
      return { cards: v.hand, playable: new Set(actions.filter((a) => a.type === 'play').map((a) => a.card)), multi: false };
    },
    onCard(code, v, actions) {
      if (v.phase === 'rob') return actions.find((a) => a.type === 'rob' && a.card === code);
      return actions.find((a) => a.card === code);
    },
    rail(v, actions) {
      if (v.phase === 'rob') {
        const no = actions.find((a) => a.type === 'norob');
        return no ? [{ label: 'Keep my hand', action: no }] : [];
      }
      return [];
    },
    rules: `
      <h4>Objective</h4><p>Be the first to <b>25 points</b>. Every trick is worth 5.</p>
      <h4>The deal</h4><p>Five cards each. The next card is turned face up: its suit is trump. The <b>A♥ is always a trump</b>, whatever suit is turned.</p>
      <h4>Robbing the pack</h4><p>Whoever holds the ace of trumps may throw away any card and take the turned card. If the turned card is itself an ace, the dealer may rob it.</p>
      <h4>Trump order (highest first)</h4><ul>
        <li><b>Hearts:</b> 5♥ J♥ A♥ K Q 10 9 8 7 6 4 3 2</li>
        <li><b>Diamonds:</b> 5♦ J♦ A♥ A♦ K Q 10 9 8 7 6 4 3 2</li>
        <li><b>Clubs or Spades:</b> 5 J A♥ A K Q 2 3 4 6 7 8 9 10</li></ul>
      <h4>Plain suits ("highest in red, lowest in black")</h4><ul>
        <li><b>Red:</b> K Q J 10 9 8 7 6 5 4 3 2 A</li>
        <li><b>Black:</b> K Q J A 2 3 4 5 6 7 8 9 10</li></ul>
      <h4>Following</h4><ul>
        <li>When a plain suit is led, you may <b>follow suit or play a trump</b>. Only if you can do neither may you play anything else.</li>
        <li>When trump is led, you must play a trump, except that the 5, the J and the A♥ need not be played to a <b>lower</b> trump lead ("reneging").</li></ul>
      <h4>Winning</h4><p>The highest trump wins the trick; with no trump, the highest card of the suit led. The first player to 25 wins at once, even mid-hand. If nobody reaches 25 in a hand, deal again and keep the scores.</p>`,
  };
})(window);
