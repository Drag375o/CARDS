/* 52 Cards — Hearts at the table. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const K = C52.Cards;
  const TT = C52.TrickTable;
  let lastReceived = '';

  C52.Tables.hearts = {
    tilt: 14,
    center(v, ui) {
      let h = TT.trickCards(v, ui);
      if (v.phase === 'pass' && v.pass) h += `<div class="suit-badge" style="left:50%;top:50%">Passing three cards ${v.pass.name}</div>`;
      // Tell the player what came in from the pass, once.
      const rec = (v.received || []).join(',');
      if (rec && rec !== lastReceived && v.phase === 'play') {
        lastReceived = rec;
        setTimeout(() => C52.Scene.subtitle('You received ' + C52.Engine.andList(v.received.map((c) => 'the ' + K.name(c))) + '.'), 900);
      }
      return h;
    },
    status(v) {
      return `<b>Hearts</b> &middot; Round ${v.round} &middot; Lowest score wins when someone reaches ${v.target} &middot; ${v.broken ? 'Hearts broken' : 'Hearts not yet broken'}`;
    },
    seatSub: (v, s) => 'Score ' + v.scores[s],
    seatInfo(v, s) {
      if (v.phase === 'pass') return v.passed && v.passed[s] ? 'Passed' : 'Choosing…';
      const t = v.tricksTaken[s];
      return t ? `${t} trick${t > 1 ? 's' : ''} · ${v.pointsTaken[s]} pts` : '';
    },
    hand(v, actions) {
      if (actions[0] && actions[0].type === 'pass') return { cards: v.hand, playable: new Set(v.hand), multi: true, max: 3 };
      return { cards: v.hand, playable: new Set(actions.filter((a) => a.card).map((a) => a.card)), multi: false };
    },
    hint(v, actions, ui) {
      if (v.phase === 'pass') return actions.length ? `Choose three cards to pass ${v.pass.name}.` : 'Waiting for the others to pass…';
      if (v.phase !== 'play') return '';
      if (!actions.length) return `${v.names[v.turn]} to play`;
      if (!v.trick.length && v.counts[v.me] === 13) return 'You lead the two of clubs.';
      return v.trick.length ? 'Follow suit if you can.' : 'Your lead.';
    },
    rail(v, actions, ui) {
      if (actions[0] && actions[0].type === 'pass') {
        const sel = [...ui.selection];
        return [{ label: sel.length === 3 ? `Pass ${v.pass.name}` : `Choose ${3 - sel.length} more`, primary: true, disabled: sel.length !== 3, action: { type: 'pass', cards: sel } }];
      }
      return [];
    },
    rules: `
      <h4>Objective</h4><p>Finish with the <b>lowest</b> score. Avoid taking Hearts and the Queen of Spades.</p>
      <h4>Passing</h4><p>Before each round, pass three cards: to the left, then the right, then across, then no pass, and repeat.</p>
      <h4>Play</h4><ul>
        <li>The player holding the <b>2♣</b> leads it to the first trick.</li>
        <li>Follow the suit led if you can. Otherwise play any card.</li>
        <li>On the first trick you may not play a Heart or the Q♠, unless you hold nothing else.</li>
        <li>Hearts can't be led until a Heart has been discarded ("broken"), unless you hold only Hearts. The Q♠ does not break Hearts.</li>
        <li>The highest card of the suit led wins the trick, and the winner leads the next.</li></ul>
      <h4>Scoring</h4><p>Each Heart you take costs 1 point, the Q♠ costs 13. <b>Shooting the moon:</b> take all 13 Hearts and the Q♠, and every other player takes 26 instead.</p>
      <h4>Winning</h4><p>When someone reaches the target (100 by default) at the end of a round, the lowest score wins. Tied low scores share the win.</p>`,
  };
})(window);
