/* 52 Cards — Texas Hold'em at the table. */
(function (root) {
  'use strict';
  const C52 = root.C52;

  const fmt = (n) => n.toLocaleString('en-GB');

  C52.Tables.holdem = {
    tilt: 14,
    center(v, ui) {
      let h = '';
      for (let i = 0; i < 5; i++) {
        const x = 50 + (i - 2) * 8.4;
        const c = v.board[i];
        h += c ? `<div class="trick-card" style="left:${x}%;top:42%">${ui.card(c)}</div>` : `<div class="trick-card" style="left:${x}%;top:42%"><div class="slot"></div></div>`;
      }
      h += `<div class="suit-badge" style="left:50%;top:66%">Pot ${fmt(v.pot)}</div>`;
      // Bets in front of each seat, and hands shown at showdown.
      v.names.forEach((_, s) => {
        if (v.bet[s] && v.phase === 'play') {
          const p = s === v.me ? { x: 50, y: 82 } : ui.toward(s, 0.62);
          h += `<div class="suit-badge chips" style="left:${p.x}%;top:${p.y}%">${fmt(v.bet[s])}</div>`;
        }
        if (v.shown && v.shown[s] && s !== v.me) {
          const p = ui.toward(s, 0.66);
          v.shown[s].forEach((c, i) => {
            h += `<div class="trick-card bj-small" style="left:${p.x + (i - 0.5) * 3}%;top:${p.y}%;z-index:${i + 1}">${ui.card(c)}</div>`;
          });
        }
      });
      return h;
    },
    status(v) {
      return `<b>Texas Hold'em</b> &middot; Hand ${v.round} &middot; Blinds ${v.blinds[0]} / ${v.blinds[1]} &middot; ${v.street[0].toUpperCase() + v.street.slice(1)} &middot; Best five of seven cards wins`;
    },
    seatSub: (v, s) => (v.inHand[s] || v.chips[s] ? fmt(v.chips[s]) + ' chips' : 'Out'),
    seatInfo: (v, s) => v.last[s] || (s === v.sbSeat ? 'Small blind' : s === v.bbSeat ? 'Big blind' : ''),
    seatOut: (v, s) => v.folded[s],
    hand(v) {
      return { cards: v.hand, playable: new Set(), multi: false, dim: false };
    },
    hint(v, actions) {
      if (v.phase !== 'play') return '';
      if (!actions.length) return v.turn != null ? `${v.names[v.turn]} to act` : '';
      const best = v.board.length ? C52.Hands.best(v.hand.concat(v.board)).name : null;
      return (best ? best + '. ' : '') + (v.toCall ? `${fmt(v.toCall)} to call.` : 'No bet to you.');
    },
    rail(v, actions) {
      if (v.phase !== 'play' || !actions.length) return [];
      const f = (t) => actions.find((a) => a.type === t);
      const items = [];
      if (f('fold')) items.push({ label: 'Fold', action: f('fold') });
      if (f('check')) items.push({ label: 'Check', action: f('check') });
      if (f('call')) items.push({ label: `Call ${fmt(f('call').amount)}`, action: f('call'), primary: true });
      const r = f('raise');
      if (r) {
        const word = v.currentBet ? 'Raise' : 'Bet';
        const presets = [];
        const add = (label, to) => {
          to = Math.max(r.min, Math.min(r.max, Math.round(to)));
          if (!presets.some((p) => p.to === to)) presets.push({ label: `${label} &middot; to ${fmt(to)}`, to });
        };
        add('Minimum', r.min);
        add('Half the pot', v.currentBet + v.pot / 2);
        add('The pot', v.currentBet + v.pot);
        add('All in', r.max);
        items.push({
          label: word,
          chooser: { title: `${word} how much?`, note: `You have ${fmt(v.chips[v.me])} behind.`, options: presets.map((p) => ({ label: p.label, action: { type: 'raise', to: p.to } })) },
        });
      }
      return items;
    },
    rules: `
      <h4>Objective</h4><p>Win chips by holding the best five-card hand at showdown, or by making everyone else fold. The last player with chips wins.</p>
      <h4>A hand</h4><ol>
        <li>The two players left of the button post the <b>small</b> and <b>big blinds</b>. Each player gets two private cards.</li>
        <li><b>Pre-flop</b> betting, starting left of the big blind.</li>
        <li><b>The flop</b>: three community cards, then betting.</li>
        <li><b>The turn</b>: a fourth card, then betting.</li>
        <li><b>The river</b>: a fifth card, then the last betting round.</li>
        <li><b>Showdown</b>: the best five cards from your two plus the five on the board win.</li></ol>
      <h4>Actions</h4><p>Fold, check (when there's no bet to you), call, bet or raise (any amount from the minimum raise up to everything you have: no limit), or go all in. A player who is all in can still win the part of the pot they matched; side pots are made automatically.</p>
      <h4>Hand rankings (best first)</h4><p>Royal flush, straight flush, four of a kind, full house, flush, straight, three of a kind, two pair, one pair, high card. Aces are high, and also low in A-2-3-4-5.</p>
      <h4>Ties</h4><p>Equal hands split the pot; an odd chip goes to the first winner left of the button.</p>
      <h4>Heads-up</h4><p>With two players, the button posts the small blind and acts first before the flop.</p>
      <h4>Blinds</h4><p>By default the blinds double every ten hands, so the game always comes to an end.</p>`,
  };
})(window);
