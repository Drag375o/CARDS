/* 52 Cards — shared table pieces for trick-taking games.
 *
 * A finished trick stays on the felt briefly before it is swept to the
 * winner, so everyone sees what took it. Bidding opens a number picker. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const K = C52.Cards;

  const HOLD_MS = 1500; // a finished trick stays visible this long in all
  const SWEEP_MS = 480; // ...ending with the cards gliding to the winner and fading
  let shownTrickKey = '';
  let shownAt = 0;
  let timer = 0;

  const tilt = (c) => ((c.charCodeAt(0) * 7 + c.charCodeAt(1) * 3) % 13) - 6; // same as ui.trick

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
    const elapsed = now - shownAt;
    if (elapsed >= HOLD_MS) return '';
    clearTimeout(timer);
    timer = setTimeout(() => ui.rerender(), HOLD_MS - elapsed + 30);
    // The sweep starts after a pause; a redraw mid-way resumes it rather than restarting it.
    const delay = Math.max(0, HOLD_MS - SWEEP_MS - elapsed);
    const to = ui.toward(lt.winner, 1.08);
    const cards = lt.plays
      .map((p, i) => {
        const at = ui.toward(p.seat);
        return (
          `<div class="trick-card sweeping" style="left:${at.x}%;top:${at.y}%;--rot:${tilt(p.card)}deg;--to-l:${to.x}%;--to-t:${to.y}%;` +
          `animation-duration:${SWEEP_MS}ms;animation-delay:${delay}ms;z-index:${i + 1}">${ui.card(p.card, { attrs: `data-seat="${p.seat}"` })}</div>`
        );
      })
      .join('');
    return cards + `<div class="suit-badge sweeping-badge" style="left:50%;top:78%;animation-delay:${delay}ms">${ui.name(lt.winner)} takes it</div>`;
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
