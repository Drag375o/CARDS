/* 52 Cards — shared table pieces for trick-taking games.
 *
 * A finished trick stays on the felt briefly before it is swept to the
 * winner, so everyone sees what took it. Bidding opens a number picker. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const K = C52.Cards;

  const HOLD_MS = 1500;
  let shownTrickKey = '';
  let shownAt = 0;
  let timer = 0;

  /** Cards to show in the middle: the live trick, or the last finished one for a moment. */
  function trickCards(v, ui) {
    if (v.trick && v.trick.length) return ui.trick(v.trick);
    const lt = v.lastTrick;
    if (!lt) return '';
    const key = v.round + ':' + lt.plays.map((p) => p.card).join('');
    const now = Date.now();
    if (key !== shownTrickKey) {
      shownTrickKey = key;
      shownAt = now;
    }
    if (now - shownAt < HOLD_MS) {
      clearTimeout(timer);
      timer = setTimeout(() => ui.rerender(), HOLD_MS - (now - shownAt) + 30);
      return ui.trick(lt.plays) + `<div class="suit-badge" style="left:50%;top:78%">${ui.name(lt.winner)} takes it</div>`;
    }
    return '';
  }

  /** Trump indicator: the turned card in a corner of the felt. */
  function trumpCard(v, ui, card, label) {
    return (
      ui.pile(25, 44, { top: card, depth: false, label: label || "Trump" }) +
      ''
    );
  }

  /** Rail button that opens a bid picker. bids: actions with .n */
  function bidRail(v, actions, title, note) {
    const bids = actions.filter((a) => a.type === 'bid');
    if (!bids.length) return [];
    const max = Math.max(...bids.map((b) => b.n), v.handSize || 13);
    const nums = [];
    for (let n = 0; n <= max; n++) {
      const a = bids.find((b) => b.n === n);
      nums.push({ text: n === 0 && v.game === 'spades' ? 'Nil' : String(n), action: a, disabled: !a });
    }
    return [{ label: 'Make your bid', primary: true, chooser: { title, note, nums } }];
  }

  const suitName = (s) => K.SUIT_NAME[s];

  C52.TrickTable = { trickCards, trumpCard, bidRail, suitName };
})(window);
