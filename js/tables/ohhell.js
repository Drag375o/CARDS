/* 52 Cards — Oh Hell at the table. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const TT = C52.TrickTable;
  const K = C52.Cards;

  C52.Tables.ohhell = {
    tilt: 14,
    center(v, ui) {
      let h = TT.trickCards(v, ui) + TT.trumpCard(v, ui, v.trumpCard, 'Trump: ' + K.SUIT_NAME[v.trump]);
      if (v.phase === 'bid') {
        const sum = v.bids.reduce((s, b) => s + (b || 0), 0);
        h += `<div class="suit-badge" style="left:50%;top:50%">${v.size} trick${v.size > 1 ? 's' : ''} &middot; bids so far ${sum}</div>`;
      }
      return h;
    },
    status(v) {
      return `<b>Oh Hell</b> &middot; Round ${v.round} of ${v.rounds} &middot; ${v.size} card${v.size > 1 ? 's' : ''} &middot; Trump ${K.SUIT_SYMBOL[v.trump]} &middot; Exact bids score 10 + the bid`;
    },
    seatSub: (v, s) => 'Score ' + v.scores[s],
    seatInfo(v, s) {
      if (v.bids[s] === null) return v.phase === 'bid' && v.turn === s ? 'Bidding…' : '';
      return v.phase === 'bid' ? `Bid ${v.bids[s]}` : `Bid ${v.bids[s]} · Won ${v.won[s]}`;
    },
    hint(v, actions) {
      if (v.phase === 'bid') {
        if (!actions.length) return `${v.names[v.turn]} is bidding`;
        return v.me === v.dealer ? 'You deal, so you bid last: the bids may not add up to the tricks.' : 'Bid exactly the tricks you will take.';
      }
      if (v.phase !== 'play') return '';
      if (!actions.length) return `${v.names[v.turn]} to play`;
      const need = v.bids[v.me] - v.won[v.me];
      return need > 0 ? `You need ${need} more.` : need === 0 ? 'You have your bid. Take no more.' : 'You are over your bid.';
    },
    rail(v, actions) {
      if (v.phase !== 'bid') return [];
      const sum = v.bids.reduce((s, b) => s + (b || 0), 0);
      const banned = v.me === v.dealer ? v.size - sum : null;
      return TT.bidRail(v, actions, 'Your bid', banned != null && banned >= 0 ? `As dealer you can't bid ${banned}.` : `There ${v.size > 1 ? 'are' : 'is'} ${v.size} trick${v.size > 1 ? 's' : ''} this round.`);
    },
    rules: `
      <h4>Objective</h4><p>Predict <b>exactly</b> how many tricks you will take each round. One too many scores as badly as one too few.</p>
      <h4>Rounds</h4><p>Round 1 deals one card each, round 2 two cards, and so on up to the largest hand the deck allows with one card left over: 17 with 3 players, 12 with 4, 10 with 5, 8 with 6, 7 with 7. The next card is turned up: its suit is <b>trump</b> for that round.</p>
      <h4>Bidding</h4><p>Starting left of the dealer, each player bids how many tricks they will take. The dealer bids last and <b>may not</b> make the total of all bids equal the number of tricks.</p>
      <h4>Play</h4><ul><li>The player left of the dealer leads. Follow suit if you can, otherwise play anything.</li><li>The highest trump wins; if no trump is played, the highest card of the suit led wins. Aces are high.</li></ul>
      <h4>Scoring</h4><p>Take exactly your bid: 10 points plus the bid. Otherwise: nothing.</p>
      <h4>Winning</h4><p>After the last round, the highest total wins. Ties share the win.</p>`,
  };
})(window);
