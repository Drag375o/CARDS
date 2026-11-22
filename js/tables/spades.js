/* 52 Cards — Spades at the table. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const TT = C52.TrickTable;

  const bidText = (b) => (b === null ? '' : b === 0 ? 'Nil' : 'Bid ' + b);

  C52.Tables.spades = {
    tilt: 14,
    center(v, ui) {
      let h = TT.trickCards(v, ui);
      if (v.phase === 'bid') h += `<div class="suit-badge" style="left:50%;top:50%">Bidding &middot; spades are trump</div>`;
      return h;
    },
    status(v) {
      const us = v.teamScore[v.me % 2];
      const them = v.teamScore[(v.me + 1) % 2];
      return `<b>Spades</b> &middot; Round ${v.round} &middot; Your team ${us} &middot; Opponents ${them} &middot; First to ${v.target} &middot; ${v.broken ? 'Spades broken' : 'Spades not broken'}`;
    },
    seatSub(v, s) {
      return (s % 2 === v.me % 2 ? 'Your team' : 'Opponents') + ' · ' + v.teamScore[s % 2];
    },
    seatInfo(v, s) {
      const b = bidText(v.bids[s]);
      if (v.phase === 'bid') return b || (v.turn === s ? 'Bidding…' : '');
      return `${b} · Won ${v.won[s]}`;
    },
    hint(v, actions) {
      if (v.phase === 'bid') return actions.length ? 'How many tricks will you take? Your partner sits opposite.' : `${v.names[v.turn]} is bidding`;
      if (v.phase !== 'play') return '';
      if (!actions.length) return `${v.names[v.turn]} to play`;
      const myBid = v.bids[v.me];
      return `${myBid === 0 ? 'You bid Nil.' : 'You bid ' + myBid + ', took ' + v.won[v.me] + '.'} ${v.trick.length ? 'Follow suit if you can.' : 'Your lead.'}`;
    },
    rail(v, actions) {
      if (v.phase === 'bid') {
        const partnerBid = v.bids[(v.me + 2) % 4];
        return TT.bidRail(v, actions, 'Your bid', partnerBid === null ? 'Nil means you will take no tricks at all.' : `Your partner bid ${partnerBid === 0 ? 'Nil' : partnerBid}. Nil means you take no tricks.`);
      }
      return [];
    },
    rules: `
      <h4>Objective</h4><p>Play in two partnerships (partners sit opposite). Win at least as many tricks as your team bid, and reach the target first.</p>
      <h4>Bidding</h4><p>Starting left of the dealer, everyone bids how many tricks they expect to take, 0 to 13. Partners' bids are added together. A bid of 0 is <b>Nil</b>: a promise to take no tricks at all.</p>
      <h4>Play</h4><ul>
        <li>The player left of the dealer leads. Follow suit if you can, otherwise play anything.</li>
        <li><b>Spades are always trump</b>: any spade beats any other suit.</li>
        <li>Spades can't be led until one has been played on another suit ("broken"), unless you hold only spades.</li>
        <li>Card order is A K Q J 10 9 8 7 6 5 4 3 2.</li></ul>
      <h4>Scoring</h4><ul>
        <li>Make your bid: 10 points per trick bid, plus 1 for each extra trick (a <b>bag</b>).</li>
        <li>Every 10 bags collected costs 100 points.</li>
        <li>Miss your bid: lose 10 points per trick bid.</li>
        <li>Nil: +100 if the bidder takes no tricks, −100 if they take any (their tricks count as bags).</li></ul>
      <h4>Winning</h4><p>The first team to reach the target (500 by default) wins. A team that falls to −200 loses.</p>`,
  };
})(window);
