/* 52 Cards — Rummy at the table. Select cards in your hand, then meld,
 * lay off or discard from the rail. Melds lie in a band across the felt. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const K = C52.Cards;
  const R = () => C52.Games.engine('rummy');

  function fits(meld, card) {
    return R().isMeld(meld.cards.concat([card]));
  }

  C52.Tables.rummy = {
    tilt: 12,
    center(v, ui) {
      const drawI = ui.actIndex((a) => a.type === 'draw' && a.from === 'stock');
      const takeI = ui.actIndex((a) => a.type === 'draw' && a.from === 'discard');
      let h = ui.pile(40, 30, { faceDown: v.stock > 0, empty: v.stock ? '' : '&nbsp;', label: v.stock + ' left', act: drawI >= 0 ? drawI : null });
      const last = v.events.slice().reverse().find((e) => e.card === v.top);
      h += ui.pile(58, 30, { top: v.top, seat: last ? last.seat : null, label: 'Discards', act: takeI >= 0 ? takeI : null });
      const sel = [...ui.selection];
      h += `<div class="melds">${v.melds
        .map((m, i) => {
          const target = sel.length === 1 && fits(m, sel[0]) ? ' target' : '';
          return `<div class="meld${target}" data-meld="${i}" title="${ui.name(m.owner)}">${m.cards.map((c) => ui.card(c)).join('')}<span class="who">${ui.name(m.owner).split(' ').pop()}</span></div>`;
        })
        .join('')}</div>`;
      return h;
    },
    afterRender(center, v, actions, ui) {
      center.querySelectorAll('.meld.target').forEach((el) => {
        el.onclick = () => {
          const card = [...ui.selection][0];
          const a = actions.find((x) => x.type === 'layoff' && x.card === card && x.meld === Number(el.dataset.meld));
          if (a) ui.submit(a);
        };
      });
    },
    status(v) {
      return `<b>Rummy</b> &middot; Round ${v.round} &middot; First to ${v.target} &middot; Sets of a rank, runs in a suit (ace low)${v.turnedOver ? ' &middot; Last pass through the stock' : ''}`;
    },
    seatSub: (v, s) => 'Score ' + v.scores[s],
    hand(v, actions) {
      if (v.phase !== 'play' || !actions.length || v.step === 'draw') return { cards: v.hand, playable: new Set(), multi: false, dim: false };
      return { cards: v.hand, playable: new Set(v.hand), multi: true };
    },
    hint(v, actions, ui) {
      if (v.phase !== 'play') return '';
      if (!actions.length) return `${v.names[v.turn]} to play`;
      if (v.step === 'draw') return 'Draw from the stock or take the top discard.';
      return v.took ? `Meld or lay off, then discard. You can't throw back the ${K.name(v.took)}.` : 'Meld or lay off if you can, then discard.';
    },
    rail(v, actions, ui) {
      if (v.phase !== 'play' || !actions.length) return [];
      if (v.step === 'draw') {
        const items = [];
        const s = actions.find((a) => a.from === 'stock');
        const d = actions.find((a) => a.from === 'discard');
        if (s) items.push({ label: 'Draw from stock', action: s, primary: true });
        if (d) items.push({ label: `Take the ${K.label(v.top)}`, action: d });
        return items;
      }
      const sel = [...ui.selection];
      const canMeld = sel.length >= 3 && R().isMeld(sel);
      const lay = sel.length === 1 ? actions.find((a) => a.type === 'layoff' && a.card === sel[0]) : null;
      const disc = sel.length === 1 ? actions.find((a) => a.type === 'discard' && a.card === sel[0]) : null;
      return [
        { label: sel.length ? `Meld ${sel.length} card${sel.length > 1 ? 's' : ''}` : 'Meld', action: { type: 'meld', cards: sel }, disabled: !canMeld, primary: canMeld },
        { label: 'Lay off', action: lay, disabled: !lay },
        { label: 'Discard', action: disc, disabled: !disc, primary: !canMeld && !!disc },
      ];
    },
    rules: `
      <h4>Objective</h4><p>Get rid of every card in your hand by forming <b>sets</b> and <b>runs</b>. Win rounds to reach the target.</p>
      <h4>Melds</h4><ul><li><b>Set:</b> three or four cards of the same rank, e.g. 7♥ 7♦ 7♣.</li><li><b>Run:</b> three or more cards in sequence in one suit, e.g. 4♠ 5♠ 6♠. Aces are <b>low only</b>: A-2-3 is a run, Q-K-A is not.</li></ul>
      <h4>The deal</h4><p>10 cards each with 2 players, 7 with 3–4, 6 with 5–6. The rest form the stock; one card starts the discard pile.</p>
      <h4>Your turn</h4><ol>
        <li><b>Draw</b> the top card of the stock, or take the top discard.</li>
        <li>Optionally <b>meld</b> sets and runs from your hand, and <b>lay off</b> single cards onto any meld on the table (yours or anyone's).</li>
        <li><b>Discard</b> one card to end your turn. You can't discard the card you just took from the discard pile.</li></ol>
      <h4>Going out</h4><p>Meld, lay off or discard your last card to go out. If the stock runs out, the discards (except the top card) are turned over once. If it runs out a second time, the round ends with no score.</p>
      <h4>Scoring</h4><p>The player who goes out scores the cards left in everyone else's hands: aces 1, number cards their value, J Q K 10. First to the target (100 by default) wins.</p>`,
  };
})(window);
