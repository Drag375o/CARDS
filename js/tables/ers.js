/* 52 Cards — Egyptian Rat Screw at the table. Space flips, S slaps. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  let keysBound = false;

  function bindKeys() {
    if (keysBound) return;
    keysBound = true;
    root.addEventListener('keydown', (e) => {
      const R = C52.Table.R;
      if (R.game !== 'ers' || !R.view || e.repeat) return;
      if (e.target && /input|textarea/i.test(e.target.tagName)) return;
      const find = (t) => R.actions.find((a) => a.type === t);
      if (e.key === ' ' || e.key === 'Enter') {
        const a = find('flip') || find('collect');
        if (a) {
          e.preventDefault();
          C52.Table.ui.submit(a);
        }
      } else if (e.key === 's' || e.key === 'S') {
        const a = find('slap');
        if (a) C52.Table.ui.submit(a);
      }
    });
  }

  C52.Tables.ers = {
    tilt: 12,
    center(v, ui) {
      bindKeys();
      let h = '';
      const slapI = ui.actIndex((a) => a.type === 'slap');
      const n = v.pile.length;
      h += `<div class="ers-pile" ${slapI >= 0 ? `data-act="${slapI}"` : ''}>`;
      if (!n) h += `<div class="slot"></div>`;
      v.pile.forEach((c, i) => {
        const k = i - (n - 1);
        h += `<div class="trick-card" style="left:${50 + k * 2.6}%;top:${46 + k * 1.2}%;--rot:${(c.charCodeAt(0) % 9) - 4 + k * 3}deg;z-index:${i + 1}">${ui.card(c, { attrs: i === n - 1 ? `data-seat="${(v.events.slice().reverse().find((e) => e.card === c) || {}).seat}"` : '' })}</div>`;
      });
      h += `</div>`;
      if (v.pileCount) h += `<div class="suit-badge" style="left:50%;top:62%">${v.pileCount} in the pile</div>`;
      // Your own face-down stack, in front of you: tap it to flip.
      const flipI = ui.actIndex((a) => a.type === 'flip' || a.type === 'collect');
      // Kept well inside the oval so the felt's curved edge doesn't clip it.
      h += ui.pile(50, 78, { faceDown: v.counts[v.me] > 0, empty: v.counts[v.me] ? '' : '&nbsp;', label: '', act: flipI >= 0 ? flipI : null });
      if (v.challenge && v.pendingWin === null && v.turn != null) {
        h += `<div class="suit-badge" style="left:50%;top:29%">${ui.name(v.turn)}: ${v.challenge.left} chance${v.challenge.left > 1 ? 's' : ''} to answer</div>`;
      }
      if (v.pendingWin !== null) h += `<div class="suit-badge" style="left:50%;top:29%">${ui.name(v.pendingWin)} wins the challenge</div>`;
      return h;
    },
    status(v) {
      return `<b>Egyptian Rat Screw</b> &middot; Slap doubles and sandwiches &middot; J 1, Q 2, K 3, A 4 chances &middot; <b>Space</b> flip, <b>S</b> slap`;
    },
    seatSub: (v, s) => v.counts[s] + ' cards',
    seatInfo: (v, s) => (v.counts[s] ? '' : 'Out (can slap in)'),
    hint(v, actions) {
      if (v.phase !== 'play') return '';
      if (actions.some((a) => a.type === 'collect')) return 'You won the challenge. Take the pile before someone slaps it.';
      if (actions.some((a) => a.type === 'flip')) return v.challenge ? `Answer with a face card or ace: ${v.challenge.left} left.` : 'Your flip.';
      return v.counts[v.me] ? `${v.names[v.turn] || ''} to flip` : 'You are out of cards. Slap back in!';
    },
    rail(v, actions) {
      const f = (t) => actions.find((a) => a.type === t);
      const items = [];
      if (f('collect')) items.push({ label: 'Take the pile', action: f('collect'), primary: true });
      if (f('flip')) items.push({ label: 'Flip (Space)', action: f('flip'), primary: true });
      items.push({ label: 'Slap! (S)', action: f('slap'), disabled: !f('slap') });
      return items;
    },
    rules: `
      <h4>Objective</h4><p>Win all 52 cards.</p>
      <h4>The deal</h4><p>All the cards are dealt face down. Don't look at your stack.</p>
      <h4>Flipping</h4><p>In turn, flip the top card of your stack face up onto the centre pile.</p>
      <h4>Face-card challenges</h4><p>When a face card or ace appears, the next player must answer with another face card or ace within a set number of cards: <b>J 1, Q 2, K 3, A 4</b>. Answering passes the challenge on to the next player. If they fail, whoever played the last face card takes the pile.</p>
      <h4>Slapping</h4><ul>
        <li><b>Double:</b> two cards of the same rank in a row (5, 5).</li>
        <li><b>Sandwich:</b> two cards of the same rank with one card between (5, K, 5).</li>
        <li>The first correct slap takes the whole pile, even in the middle of a challenge.</li>
        <li>A wrong slap costs one card, placed face down under the pile.</li>
        <li>A player with no cards can still slap back in.</li></ul>
      <h4>Controls</h4><p><b>Space</b> or Enter flips (or takes a pile you've won); <b>S</b> slaps. You can also tap the pile to slap.</p>
      <h4>Winning</h4><p>Collect every card to win.</p>`,
  };
})(window);
