/* 52 Cards — Contract Bridge at the table. You sit South; your partner
 * is North. The auction is written up on the felt; in play, dummy's hand
 * lies face up in front of dummy, and as declarer you play it by tapping. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const TT = C52.TrickTable;
  const SYM = { C: '♣', D: '♦', H: '♥', S: '♠', N: 'NT' };
  const red = (s) => s === 'H' || s === 'D';

  function auctionTable(v, ui) {
    // Columns West, North, East, South (seats 1, 2, 3, 0).
    const cols = [1, 2, 3, 0];
    const cells = [];
    const startCol = cols.indexOf(v.dealer);
    for (let i = 0; i < startCol; i++) cells.push('');
    v.auction.forEach((c) => {
      const t = c.type === 'bid' ? `${c.level}<span class="${red(c.strain) ? 'red-suit' : ''}">${SYM[c.strain]}</span>` : c.text === 'Pass' ? 'Pass' : c.text === 'Double' ? 'X' : 'XX';
      cells.push(t);
    });
    if (v.phase === 'auction') cells.push('?');
    let rows = '';
    for (let i = 0; i < cells.length; i += 4) rows += `<tr>${[0, 1, 2, 3].map((k) => `<td>${cells[i + k] == null ? '' : cells[i + k]}</td>`).join('')}</tr>`;
    return `<table class="auction"><thead><tr>${cols.map((s) => `<th>${v.compass[s]}<br><small>${ui.name(s).split(' ').pop()}</small></th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
  }

  function dummyRow(v, ui) {
    if (!v.dummyHand || v.dummy === v.me) return '';
    const mine = v.controller === v.me && v.declarer === v.me;
    const top = v.dummy === (v.me + 2) % 4;
    const tap = (c) => (mine && v.turn === v.dummy ? ui.actIndex((a) => a.card === c) : -1);
    const cardAt = (c, x, y, z, small) => {
      const idx = tap(c);
      return `<div class="trick-card${small ? ' bj-small' : ''}${idx >= 0 ? ' dummy-play' : ''}" style="left:${x}%;top:${y}%;z-index:${z}" ${idx >= 0 ? `data-act="${idx}"` : ''}>${ui.card(c)}</div>`;
    };
    if (top) {
      const n = v.dummyHand.length;
      return v.dummyHand.map((c, i) => cardAt(c, 50 + (i - (n - 1) / 2) * 4.6, 17, i + 1, false)).join('');
    }
    // A side dummy is laid out the classic way: one short row per suit, set in from the rail.
    const left = ((v.dummy - v.me + 4) % 4) === 1;
    const x0 = left ? 17 : 83;
    let h = '';
    let z = 1;
    ['S', 'H', 'D', 'C'].forEach((s, row) => {
      const cs = v.dummyHand.filter((c) => c[1] === s);
      cs.forEach((c, i) => {
        h += cardAt(c, x0 + (left ? i : -i) * 2.2, 24 + row * 13, z++, true);
      });
    });
    return h;
  }

  C52.Tables.bridge = {
    tilt: 12,
    center(v, ui) {
      if (v.phase === 'auction') return `<div class="auction-wrap">${auctionTable(v, ui)}</div>`;
      let h = TT.trickCards(v, ui) + dummyRow(v, ui);
      if (v.contract) {
        const ct = v.contract;
        h += `<div class="suit-badge" style="left:50%;top:84%">${ct.level}<span class="${red(ct.strain) ? 'red-suit' : ''}">${SYM[ct.strain]}</span>${ct.doubled === 2 ? ' X' : ct.doubled === 4 ? ' XX' : ''} by ${ui.name(v.declarer)} &middot; NS ${v.tricks[0]} &middot; EW ${v.tricks[1]}</div>`;
      }
      return h;
    },
    status(v) {
      const vul = { None: 'Nobody', NS: 'North–South', EW: 'East–West', Both: 'Both sides' }[v.vul];
      return `<b>Contract Bridge</b> &middot; Board ${v.board} of ${v.boards} &middot; Dealer ${v.compass[v.dealer]} &middot; Vulnerable: ${vul}${v.contract ? ` &middot; Contract ${v.contract.text} by ${v.compass[v.declarer]}` : ''}`;
    },
    seatSub(v, s) {
      const vul = v.vul === 'Both' || (v.vul === 'NS' && s % 2 === 0) || (v.vul === 'EW' && s % 2 === 1);
      return `${v.compass[s]}${vul ? ' · vulnerable' : ''}`;
    },
    seatInfo(v, s) {
      if (v.phase === 'auction') {
        const last = v.auction.filter((c) => c.seat === s).pop();
        return last ? last.text : '';
      }
      if (s === v.dummy) return 'Dummy';
      if (s === v.declarer) return 'Declarer';
      return '';
    },
    hand(v, actions) {
      // Your own hand is playable only on your own turn (dummy's cards are tapped on the felt).
      const mine = v.turn === v.me ? new Set(actions.filter((a) => a.card).map((a) => a.card)) : new Set();
      return { cards: v.hand, playable: mine, multi: false, dim: v.phase === 'play' && v.turn === v.me };
    },
    hint(v, actions) {
      if (v.phase === 'auction') return actions.length ? 'Your call. Your partner sits opposite (North).' : `${v.names[v.turn]} to call`;
      if (v.phase !== 'play') return '';
      if (v.me === v.dummy) return 'You are dummy: your partner plays your cards.';
      if (!actions.length) return `${v.names[v.turn]} to play`;
      if (v.turn === v.dummy) return "Play a card from dummy's hand on the table.";
      return v.trick.length ? 'Follow suit if you can.' : 'Your lead.';
    },
    rail(v, actions) {
      if (v.phase !== 'auction' || !actions.length) return [];
      const f = (t) => actions.find((a) => a.type === t);
      const grid = [];
      for (let l = 1; l <= 7; l++) {
        grid.push(['C', 'D', 'H', 'S', 'N'].map((s) => {
          const a = actions.find((x) => x.type === 'bid' && x.level === l && x.strain === s);
          return { label: `${l}<span class="${red(s) ? 'red-suit' : ''}">${SYM[s]}</span>`, action: a, disabled: !a };
        }));
      }
      const items = [{ label: 'Pass', action: f('pass') }, { label: 'Bid…', primary: true, chooser: { title: 'Your bid', note: 'A bid promises six tricks plus the level, in that suit as trump (or notrump).', grid } }];
      if (f('double')) items.push({ label: 'Double', action: f('double') });
      if (f('redouble')) items.push({ label: 'Redouble', action: f('redouble') });
      return items;
    },
    rules: `
      <h4>Objective</h4><p>Two partnerships (you and North against East and West) compete to win tricks. The side that wins the auction must make the contract it named; the other side tries to stop it.</p>
      <h4>The auction</h4><ul>
        <li>Starting with the dealer, each player calls in turn: a <b>bid</b> (a level 1–7 and a suit or notrump), <b>pass</b>, <b>double</b> an opponent's bid, or <b>redouble</b> an opponent's double.</li>
        <li>A bid of level N promises to win <b>6 + N</b> tricks with that suit as trump (or with no trump). Each bid must be higher than the last: by level, then ♣ &lt; ♦ &lt; ♥ &lt; ♠ &lt; NT.</li>
        <li>Three passes in a row after a bid end the auction. If all four players pass at the start, the board is thrown in.</li>
        <li>The <b>declarer</b> is the player on the winning side who first named the contract's strain. Their partner becomes <b>dummy</b>.</li></ul>
      <h4>Play</h4><ul>
        <li>The player to the declarer's left leads. Dummy then lays all 13 cards face up, and the declarer plays both hands.</li>
        <li>Follow suit if you can. The highest card of the suit led wins, unless a trump is played; then the highest trump wins. The winner leads next.</li></ul>
      <h4>Scoring (duplicate)</h4><ul>
        <li><b>Tricks bid and made:</b> ♣/♦ 20 each, ♥/♠ 30 each, notrump 40 for the first and 30 after; doubled ×2, redoubled ×4.</li>
        <li><b>Bonuses:</b> 100+ trick points is a game (300 not vulnerable, 500 vulnerable), otherwise a part-score (50). Small slam (12 tricks) 500/750, grand slam (13) 1000/1500. Making a doubled contract +50, redoubled +100.</li>
        <li><b>Overtricks:</b> trick value undoubled; doubled 100 (200 vulnerable) each; redoubled twice that.</li>
        <li><b>Undertricks:</b> undoubled 50 each (100 vulnerable). Doubled, not vulnerable: 100, 200, 200, then 300 each; vulnerable: 200, then 300 each. Redoubled: twice the doubled amount.</li></ul>
      <h4>Dealer and vulnerability</h4><p>These rotate through the standard 16-board cycle.</p>
      <h4>Winning</h4><p>After the agreed number of boards, the partnership with the higher total wins.</p>`,
  };
})(window);
