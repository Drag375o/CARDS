/* 52 Cards — Crazy Eights at the table. */
(function (root) {
  'use strict';
  const C52 = root.C52;

  C52.Tables.crazy8 = {
    tilt: 14,
    center(v, ui) {
      const drawIdx = ui.actIndex((a) => a.type === 'draw');
      const stock = ui.pile(40, 44, { faceDown: v.stock > 0, empty: v.stock ? '' : '&nbsp;', label: v.stock + ' left', act: drawIdx >= 0 ? drawIdx : null });
      const last = v.events.slice().reverse().find((e) => e.card === v.top);
      const top = ui.pile(58, 44, { top: v.top, seat: last ? last.seat : null });
      const suitBadge = v.top[0] === '8' ? `<div class="suit-badge" style="left:58%;top:74%">Suit called ${ui.suitHTML(v.suit)}</div>` : '';
      return stock + top + suitBadge;
    },
    status(v) {
      return `<b>Crazy Eights</b> &middot; Round ${v.round} &middot; First to ${v.target} &middot; Match the suit or rank. Eights are wild.`;
    },
    seatSub(v, seat) {
      return 'Score ' + v.scores[seat];
    },
    hint(v, actions) {
      if (!actions.length || v.phase !== 'play') return v.phase === 'play' ? `${v.names[v.turn]} to play` : '';
      if (v.drawn) return 'You drew a card you can play.';
      if (actions.some((a) => a.type === 'draw')) return 'Nothing to play. Draw a card.';
      return 'Your turn. Play a card.';
    },
    rail(v, actions) {
      const items = [];
      const draw = actions.find((a) => a.type === 'draw');
      const pass = actions.find((a) => a.type === 'pass');
      if (draw) items.push({ label: 'Draw a card', action: draw, primary: true });
      if (pass) items.push({ label: v.drawn ? 'Keep it and pass' : 'Pass', action: pass });
      return items;
    },
    onCard(code, v, actions) {
      const eights = actions.filter((a) => a.card === code && a.suit);
      if (eights.length) return { chooser: { title: 'Call the next suit', note: 'Eights are wild. Which suit must be played next?', suits: eights } };
      return actions.find((a) => a.card === code) || null;
    },
    rules: `
      <h4>Objective</h4><p>Be the first to get rid of every card in your hand. Win rounds to reach the target score.</p>
      <h4>The deal</h4><p>Seven cards each with 2–4 players, five each with 5–7. One card is turned up to start the discard pile. If it's an eight, it goes back into the deck and another is turned.</p>
      <h4>Your turn</h4><ul>
        <li>Play a card that matches the top card's <b>suit</b> or <b>rank</b>.</li>
        <li><b>Eights are wild.</b> Play one at any time and name the suit that must be played next.</li>
        <li>If you can't play, draw <b>one</b> card. If it fits, you may play it straight away. Otherwise your turn ends.</li>
        <li>If the draw pile runs out, the discards (except the top card) are shuffled into a new one.</li></ul>
      <h4>Scoring</h4><p>The first player out scores the cards left in everyone else's hand: eights 50, kings, queens and jacks 10, aces 1, other cards their face value. If nobody can move, the lowest hand takes the round.</p>
      <h4>Winning</h4><p>The first player to reach the target (100 or 200) wins.</p>`,
  };
})(window);
