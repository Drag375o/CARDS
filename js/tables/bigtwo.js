/* 52 Cards — Big Two at the table. Select cards, then play them or pass. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const K = C52.Cards;
  const B = () => C52.Games.engine('bigtwo');

  C52.Tables.bigtwo = {
    tilt: 12,
    center(v, ui) {
      if (!v.pile) {
        return v.startCard
          ? `<div class="suit-badge" style="left:50%;top:46%">First play must include the ${K.label(v.startCard)}</div>`
          : `<div class="suit-badge" style="left:50%;top:46%">${ui.name(v.turn)} leads anything</div>`;
      }
      const n = v.pile.cards.length;
      const cards = v.pile.cards
        .map((c, i) => {
          const x = 50 + (i - (n - 1) / 2) * 5.2;
          return `<div class="trick-card" style="left:${x}%;top:44%;--rot:${(i - (n - 1) / 2) * 3}deg">${ui.card(c, { attrs: `data-seat="${v.pile.seat}"` })}</div>`;
        })
        .join('');
      return cards + `<div class="suit-badge" style="left:50%;top:74%">${v.pile.combo.name} &middot; ${ui.name(v.pile.seat)}</div>`;
    },
    status(v) {
      return `<b>Big Two</b> &middot; Round ${v.round}${v.rounds > 1 ? ' of ' + v.rounds : ''} &middot; 3 low, 2 high &middot; ♦ &lt; ♣ &lt; ♥ &lt; ♠ &middot; First to empty their hand wins`;
    },
    seatSub: (v, s) => (v.rounds > 1 ? 'Penalty ' + v.scores[s] : v.counts[s] + ' cards'),
    seatInfo: (v, s) => (v.passed[s] ? 'Passed' : ''),
    hand(v, actions) {
      if (!actions.length || v.phase !== 'play') return { cards: v.hand, playable: new Set(), multi: false, dim: false };
      return { cards: v.hand, playable: new Set(v.hand), multi: true, max: 5 };
    },
    hint(v, actions, ui) {
      if (v.phase !== 'play') return '';
      if (!actions.length) return `${v.names[v.turn]} to play`;
      const sel = [...ui.selection];
      if (sel.length) {
        const r = B().check(v, sel);
        return r.ok ? `${r.combo.name}. Ready to play.` : r.why;
      }
      if (!v.pile) return v.startCard ? `Lead with the ${K.name(v.startCard)}.` : 'Your lead: play anything.';
      return `Beat the ${v.pile.combo.name.toLowerCase()}, or pass.`;
    },
    rail(v, actions, ui) {
      if (!actions.length || v.phase !== 'play') return [];
      const sel = [...ui.selection];
      const ok = sel.length && B().check(v, sel).ok;
      const items = [{ label: sel.length ? `Play ${sel.length}` : 'Play', primary: !!ok, disabled: !ok, action: { type: 'play', cards: sel } }];
      const pass = actions.find((a) => a.type === 'pass');
      if (pass) items.push({ label: 'Pass', action: pass });
      return items;
    },
    rules: `
      <h4>Objective</h4><p>Be the first to get rid of all your cards.</p>
      <h4>Card order</h4><p>3 is lowest, then 4 … K, A, and <b>2 is highest</b>. Suits break ties: ♦ &lt; ♣ &lt; ♥ &lt; ♠, so the 3♦ is the lowest card and the 2♠ the highest.</p>
      <h4>Combinations</h4><ul>
        <li>Single, pair, or three of a kind.</li>
        <li>Five-card hands, lowest to highest: <b>straight</b>, <b>flush</b>, <b>full house</b>, <b>four of a kind + any card</b>, <b>straight flush</b>.</li>
        <li>Straights don't wrap around and can't contain a 2. The highest straight is 10-J-Q-K-A. Equal straights and flushes are compared by their highest card.</li></ul>
      <h4>Play</h4><ul>
        <li>The player with the 3♦ leads, and the first play must include it. (With 2 players, the lowest card dealt.)</li>
        <li>Each player must play the same number of cards as the last play, but higher, or pass.</li>
        <li>Once you pass, you're out until the pile is won. When everyone else has passed, the last player to play leads anything.</li></ul>
      <h4>The deal</h4><p>13 each with 4 players; 17 each with 3 (whoever has the 3♦ also takes the last card); 13 each with 2.</p>
      <h4>Winning</h4><p>The first to empty their hand wins. In a five-round match, cards left in hand are penalty points and the lowest total wins.</p>`,
  };
})(window);
