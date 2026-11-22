/* 52 Cards — Klondike at the table. A rectangular card table: stock,
 * waste and foundations across the top, seven columns below.
 *
 * Click a card to send it to its best destination (home first), or drag
 * it (and the cards on top of it) to the pile you want. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const K = C52.Cards;

  const COLX = (i) => 9 + i * 13.66; // column centres, % of felt width
  const TOP_Y = 5;
  const TAB_Y = 33;

  // Tableau overlap (in card heights), squeezed when a column gets long.
  function offsets(col) {
    const n = col.down + col.up.length;
    let down = 0.1;
    let up = 0.27;
    const budget = 2.55; // card heights available below the first card
    const need = col.down * down + Math.max(0, col.up.length - 1) * up;
    if (need > budget && n > 1) {
      const k = budget / need;
      down *= k;
      up *= k;
    }
    return { down, up };
  }

  function cardAt(code, x, y, attrs, faceDown) {
    return `<div class="kl-card" style="left:${x}%;top:${y}" ${attrs || ''}>${C52.Scene.cardHTML(faceDown ? null : code, { faceDown, attrs: code && !faceDown ? `data-c="${code}"` : '' })}</div>`;
  }

  const T = {
    shape: 'rect',
    tilt: 0,
    center(v, ui) {
      let h = '';
      // Stock.
      const drawI = ui.actIndex((a) => a.type === 'draw' || a.type === 'recycle');
      h += `<div class="kl-pile" data-pile="stock" style="left:${COLX(0)}%;top:${TOP_Y}%" ${drawI >= 0 ? `data-act="${drawI}"` : ''}>
        ${v.stock ? C52.Scene.cardHTML(null, { faceDown: true, cls: 'pile-depth' }) : `<div class="slot">&#8635;</div>`}</div>`;
      // Waste: up to three fanned when drawing three.
      h += `<div class="kl-pile" data-pile="waste" style="left:${COLX(1)}%;top:${TOP_Y}%"><div class="slot"></div></div>`;
      const shown = v.draw === 3 ? v.waste : v.waste.slice(-1);
      shown.forEach((c, i) => {
        const top = i === shown.length - 1;
        h += `<div class="kl-card${top ? ' kl-src' : ''}" data-from="waste" data-idx="0" style="left:calc(${COLX(1)}% + ${i * 1.6}vmin);top:${TOP_Y}%">${C52.Scene.cardHTML(c, { attrs: `data-c="${c}"` })}</div>`;
      });
      // Foundations.
      for (let f = 0; f < 4; f++) {
        const pile = v.found[f];
        const suit = 'SHDC'[f];
        h += `<div class="kl-pile kl-drop" data-pile="f${f}" style="left:${COLX(3 + f)}%;top:${TOP_Y}%"><div class="slot">${ui.suitHTML(suit)}</div></div>`;
        if (pile.length) h += `<div class="kl-card kl-src" data-from="f${f}" data-idx="0" style="left:${COLX(3 + f)}%;top:${TOP_Y}%">${C52.Scene.cardHTML(pile[pile.length - 1], { attrs: `data-c="${pile[pile.length - 1]}"` })}</div>`;
      }
      // Tableau.
      v.tableau.forEach((col, i) => {
        const x = COLX(i);
        h += `<div class="kl-pile kl-drop kl-col" data-pile="t${i}" style="left:${x}%;top:${TAB_Y}%"><div class="slot">${col.down || col.up.length ? '' : 'K'}</div></div>`;
        const off = offsets(col);
        let y = 0;
        for (let d = 0; d < col.down; d++) {
          h += cardAt(null, x, `calc(${TAB_Y}% + ${y.toFixed(3)} * var(--card-h))`, `data-pile-of="t${i}"`, true);
          y += off.down;
        }
        col.up.forEach((c, k) => {
          h += `<div class="kl-card kl-src" data-from="t${i}" data-idx="${k}" style="left:${x}%;top:calc(${TAB_Y}% + ${y.toFixed(3)} * var(--card-h))">${C52.Scene.cardHTML(c, { attrs: `data-c="${c}"` })}</div>`;
          y += off.up;
        });
      });
      return h;
    },

    afterRender(center, v, actions, ui) {
      center.querySelectorAll('.kl-src').forEach((el) => {
        el.addEventListener('pointerdown', (e) => startDrag(e, el, v, actions, ui));
      });
    },

    status(v) {
      return `<b>Klondike</b> &middot; Draw ${v.draw === 3 ? 'three' : 'one'} &middot; ${v.home} of 52 home &middot; ${v.moves} moves &middot; Stock ${v.stock}`;
    },
    seatSub: (v) => `${v.home} of 52 home`,
    hint(v, actions) {
      if (actions.some((a) => a.type === 'finish')) return 'Everything is face up.';
      return '';
    },
    rail(v, actions) {
      const items = [];
      const finish = actions.find((a) => a.type === 'finish');
      if (finish) items.push({ label: 'Send all home', action: finish, primary: true });
      const undo = actions.find((a) => a.type === 'undo');
      items.push({ label: 'Undo', action: undo, disabled: !undo });
      items.push({
        label: 'Hint',
        fn: () => {
          const a = C52.AI.klondike.decide(v, actions, 'hard', Math.random);
          if (!a || a.type === 'concede') return C52.Scene.subtitle('No useful moves left. Try the stock, or concede.');
          if (a.type === 'draw') return C52.Scene.subtitle('Nothing to move. Draw from the stock.');
          if (a.type === 'recycle') return C52.Scene.subtitle('Turn the waste back over to the stock.');
          const src = a.from === 'waste' ? v.waste[v.waste.length - 1] : a.from[0] === 'f' ? v.found[a.from[1]].slice(-1)[0] : v.tableau[a.from[1]].up[v.tableau[a.from[1]].up.length - a.count];
          const dest = a.to[0] === 'f' ? 'its foundation' : 'column ' + (Number(a.to[1]) + 1);
          C52.Scene.subtitle(`Try the ${K.name(src)} to ${dest}.`);
        },
      });
      items.push({ label: 'Concede', action: actions.find((a) => a.type === 'concede') });
      items.push({ label: 'Leave the table', fn: () => C52.Table.confirmLeave() });
      return items;
    },
    rules: `
      <h4>Objective</h4><p>Move all 52 cards onto the four foundations, one per suit, in order from Ace up to King.</p>
      <h4>The layout</h4><p>Seven columns of 1 to 7 cards, with only the top card of each face up. The other 24 cards form the stock.</p>
      <h4>Moves</h4><ul>
        <li>Build columns <b>down</b> in <b>alternating colours</b>: a red 6 on a black 7.</li>
        <li>Move a face-up card together with everything on top of it.</li>
        <li>Only a <b>King</b> (or a run starting with a King) may go into an empty column.</li>
        <li>When a face-down card is uncovered, it turns face up.</li>
        <li>Build foundations <b>up by suit</b>, starting with the Ace. Cards may come back down to the columns.</li>
        <li>Tap the stock to turn one card (or three, in draw-three) onto the waste. When the stock runs out, turn the waste back over. There is no limit on passes.</li></ul>
      <h4>Controls</h4><p>Tap a card to send it to its best spot, or drag it where you want it. Undo takes back a move.</p>
      <h4>Winning</h4><p>You win when every suit is home, from Ace to King.</p>`,
  };

  /* ---------- click and drag ---------- */

  function legalMoves(actions, from, idx, v) {
    const count = from[0] === 't' ? v.tableau[Number(from[1])].up.length - idx : 1;
    return actions.filter((a) => a.type === 'move' && a.from === from && a.count === count);
  }

  function bestMove(ms) {
    return ms.find((a) => a.to[0] === 'f') || ms.find((a) => a.to[0] === 't') || null;
  }

  function startDrag(e, el, v, actions, ui) {
    if (e.button !== 0) return;
    const from = el.dataset.from;
    const idx = Number(el.dataset.idx);
    const ms = legalMoves(actions, from, idx, v);
    const center = el.parentElement;
    // The dragged group: this card and everything above it in the same column.
    const group = [...center.querySelectorAll(`.kl-src[data-from="${from}"]`)].filter((x) => Number(x.dataset.idx) >= idx);
    const sx = e.clientX;
    const sy = e.clientY;
    let moved = false;
    el.setPointerCapture(e.pointerId);

    const move = (ev) => {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 6) return;
      moved = true;
      group.forEach((g) => {
        g.style.transform = `translate(${dx}px, ${dy}px)`;
        g.style.zIndex = 500;
        g.classList.add('dragging');
      });
    };
    const up = (ev) => {
      el.releasePointerCapture(e.pointerId);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      if (!moved) {
        // A tap on a foundation card does nothing: taking a card back down is a deliberate drag.
        const a = from[0] === 'f' ? null : bestMove(ms);
        if (a) return ui.submit(a);
        C52.Sound.play('brush');
        return;
      }
      group.forEach((g) => (g.style.visibility = 'hidden'));
      const under = root.document.elementFromPoint(ev.clientX, ev.clientY);
      group.forEach((g) => (g.style.visibility = ''));
      const target = dropTarget(under, center, ev);
      const a = target && ms.find((m) => m.to === target);
      if (a) return ui.submit(a);
      group.forEach((g) => {
        g.style.transition = 'transform .25s var(--ease)';
        g.style.transform = '';
        g.classList.remove('dragging');
        setTimeout(() => (g.style.transition = ''), 260);
      });
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  /** Which pile is under the pointer: a card in a column counts as that column. */
  function dropTarget(under, center, ev) {
    if (!under) return null;
    const card = under.closest('.kl-card, .kl-pile');
    if (card) {
      if (card.dataset.from) return card.dataset.from === 'waste' ? null : card.dataset.from;
      if (card.dataset.pileOf) return card.dataset.pileOf;
      if (card.dataset.pile) return card.dataset.pile;
    }
    // Fallback: nearest column by x when dropped in the lower area.
    const r = center.getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * 100;
    const py = ((ev.clientY - r.top) / r.height) * 100;
    if (py < TAB_Y - 4) return null;
    let best = 0;
    for (let i = 1; i < 7; i++) if (Math.abs(COLX(i) - px) < Math.abs(COLX(best) - px)) best = i;
    return 't' + best;
  }

  C52.Tables.klondike = T;
})(window);
