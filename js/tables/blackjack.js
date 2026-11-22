/* 52 Cards — Blackjack at the table. The dealer stands across the felt;
 * players sit along the near curve with their cards face up in front. */
(function (root) {
  'use strict';
  const C52 = root.C52;

  /** You sit at the bottom centre; the others spread along the near curve on either side.
   *  Clockwise from you runs up the left side, then down the right. */
  function seatPos(rel, n) {
    if (rel === 0) return { x: 50, y: 102, a: Math.PI / 2 };
    const m = n - 1;
    const nl = Math.ceil(m / 2);
    const nr = m - nl;
    const spread = (k, cnt, near, far) => (cnt === 1 ? (near + far) / 2 : near + ((far - near) * k) / (cnt - 1));
    const deg = rel <= nl ? spread(rel - 1, nl, 128, 168) : spread(rel - nl - 1, nr, 12, 52);
    const a = (deg * Math.PI) / 180;
    return { x: +(50 + 47 * Math.cos(a)).toFixed(2), y: +(50 + 52 * Math.sin(a)).toFixed(2), a };
  }

  function handHTML(h, ui, x, y, small, active) {
    const n = h.cards.length;
    const step = small ? 2.4 : 3.4;
    const cards = h.cards
      .map((c, i) => `<div class="trick-card${small ? ' bj-small' : ''}" style="left:${x + (i - (n - 1) / 2) * step}%;top:${y - i * (small ? 1.2 : 1.6)}%;--rot:${(i - (n - 1) / 2) * 2}deg;z-index:${i + 1}">${ui.card(c)}</div>`)
      .join('');
    const label = `${h.total > 21 ? 'Bust ' : ''}${h.soft && h.total <= 21 ? 'Soft ' : ''}${h.total}${h.bet ? ' &middot; ' + h.bet : ''}`;
    return cards + `<div class="suit-badge${active ? ' bj-active' : ''}" style="left:${x}%;top:${y + (small ? 13 : 18)}%">${label}</div>`;
  }

  C52.Tables.blackjack = {
    tilt: 16,
    seatPos,
    center(v, ui) {
      let h = '';
      // Dealer.
      const dn = v.dealer.length + (v.dealerHidden ? 1 : 0);
      v.dealer.forEach((c, i) => {
        h += `<div class="trick-card" style="left:${50 + (i - (dn - 1) / 2) * 4.4}%;top:20%;z-index:${i + 1}">${ui.card(c)}</div>`;
      });
      if (v.dealerHidden) h += `<div class="trick-card" style="left:${50 + (dn - 1 - (dn - 1) / 2) * 4.4}%;top:20%;z-index:5">${ui.card(null, { faceDown: true })}</div>`;
      if (v.dealer.length) h += `<div class="suit-badge" style="left:50%;top:38%">Dealer ${v.dealerHidden ? 'shows ' + v.dealerTotal : v.dealerTotal > 21 ? 'busts ' + v.dealerTotal : v.dealerTotal}</div>`;
      else h += `<div class="suit-badge" style="left:50%;top:30%">Dealer &middot; blackjack pays 3 to 2 &middot; dealer ${v.soft17 === 'hit' ? 'hits' : 'stands on'} soft 17</div>`;
      h += ui.pile(84, 22, { faceDown: true, label: v.shoe + ' in the shoe' });
      // Players' hands.
      v.seats.forEach((s, seat) => {
        if (!s.hands.length) {
          if (s.bet && seat !== v.me) {
            const p = ui.toward(seat, 0.62);
            h += `<div class="suit-badge" style="left:${p.x}%;top:${p.y}%">Bet ${s.bet}</div>`;
          }
          return;
        }
        const mine = seat === v.me;
        const p = mine ? { x: 50, y: 62 } : ui.toward(seat, 0.6);
        const k = s.hands.length;
        s.hands.forEach((hand, i) => {
          const dx = (i - (k - 1) / 2) * (mine ? 16 : 9);
          h += handHTML(hand, ui, p.x + dx, p.y, !mine, v.turn === seat && v.active === i && v.phase === 'play');
        });
      });
      return h;
    },
    status(v) {
      return `<b>Blackjack</b> &middot; Hand ${v.round} of ${v.limit} &middot; Closer to 21 than the dealer &middot; Chips ${v.chips[v.me]}`;
    },
    seatSub: (v, s) => v.chips[s] + ' chips',
    seatInfo(v, s) {
      const st = v.seats[s];
      if (st.out) return 'Sitting out';
      if (v.phase === 'bet') return st.bet ? 'Bet ' + st.bet : 'Betting…';
      return '';
    },
    hint(v, actions) {
      if (v.phase === 'bet') return actions.length ? 'Place your bet.' : v.seats[v.me].out ? 'You are out of chips.' : 'Waiting for the other bets…';
      if (v.phase !== 'play') return '';
      if (!actions.length) return v.turn != null ? `${v.names[v.turn]} to play` : '';
      const h = v.seats[v.me].hands[v.active];
      return `${v.seats[v.me].hands.length > 1 ? 'Hand ' + (v.active + 1) + ': ' : ''}${h.soft ? 'soft ' : ''}${h.total} against the dealer's ${v.dealerTotal}.`;
    },
    rail(v, actions) {
      if (v.phase === 'bet') {
        const bets = actions.filter((a) => a.type === 'bet');
        return bets.length ? [{ row: bets.map((a) => ({ label: String(a.amount), action: a, primary: a.amount === 25 })) }] : [];
      }
      if (v.phase !== 'play' || !actions.length) return [];
      const f = (t) => actions.find((a) => a.type === t);
      const items = [{ label: 'Hit', action: f('hit'), primary: true }, { label: 'Stand', action: f('stand') }];
      if (f('double')) items.push({ label: 'Double down', action: f('double') });
      if (f('split')) items.push({ label: 'Split', action: f('split') });
      return items;
    },
    rules: `
      <h4>Objective</h4><p>Finish closer to 21 than the dealer without going over. Leave with the most chips.</p>
      <h4>Card values</h4><p>Number cards are worth their number; J, Q and K are 10; an ace is 1 or 11, whichever helps. A hand with an ace counted as 11 is "soft".</p>
      <h4>A hand</h4><ol>
        <li>Everyone bets. Each player gets two cards face up; the dealer gets one up and one face down.</li>
        <li>If the dealer shows an ace or a ten-value card, they check for blackjack at once.</li>
        <li>In turn, each player may <b>hit</b> (take a card), <b>stand</b>, <b>double down</b> (double the bet on the first two cards and take exactly one more card), or <b>split</b> a pair into two hands (once). Split aces get one card each, and 21 after a split is not a blackjack.</li>
        <li>Going over 21 is a bust: the bet is lost at once.</li>
        <li>The dealer then reveals the hidden card, hits on 16 or less and stands on 17 (on a soft 17 the dealer stands or hits, as chosen before play).</li></ol>
      <h4>Payouts</h4><p>A natural <b>blackjack</b> (ace + ten-value as your first two cards) pays <b>3 to 2</b>. A win pays 1 to 1. Equal totals are a push and the bet is returned. No insurance or surrender.</p>
      <h4>Winning</h4><p>After the agreed number of hands, the player with the most chips wins.</p>`,
  };
})(window);
