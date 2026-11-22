/* 52 Cards — the menu. The twelve games are dealt to you as a hand.
 * Lift a card to read its briefing; play it to take a seat. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const S = () => C52.Scene;

  let stageEl = null;
  let timers = [];
  let selected = null;
  let onKey = null;

  function tableHTML(inner) {
    const v = C52.Venues.get(C52.Prefs.get().venue);
    return `<div class="table-wrap"><div class="table"><div class="felt">
      <div class="felt-mark">${v.name}</div>${inner || ''}
    </div></div></div>`;
  }

  function enter(stage, params) {
    stageEl = stage;
    selected = null;
    render(params && params.deal);
    if (params && params.brief && C52.Games.meta(params.brief)) openBriefing(params.brief);
    onKey = (e) => {
      if (e.key === 'Escape' && selected) closeBriefing();
    };
    root.addEventListener('keydown', onKey);
  }

  function render(deal) {
    const games = C52.Games.list();
    stageEl.innerHTML =
      tableHTML() +
      `<div class="hand game-hand" id="hand" role="listbox" aria-label="Choose a game">${games
        .map(
          (g) =>
            `<div class="card playable${deal ? ' undealt' : ''}" role="option" tabindex="0" data-game="${g.id}" aria-label="${g.name}, ${C52.GameCard.players(g)}">${C52.GameCard.svg(g)}</div>`
        )
        .join('')}</div>` +
      `<div class="briefing" id="briefing" aria-hidden="true"></div>`;

    const hand = stageEl.querySelector('#hand');
    S().fan(hand);
    const cards = [...hand.children];
    cards.forEach((el, i) => {
      el.addEventListener('click', () => openBriefing(el.dataset.game));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openBriefing(el.dataset.game);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const n = cards[(i + (e.key === 'ArrowRight' ? 1 : cards.length - 1)) % cards.length];
          n.focus();
          C52.Sound.play('brush');
        }
      });
    });

    if (deal) {
      cards.forEach((el, i) => {
        timers.push(
          setTimeout(() => {
            el.classList.remove('undealt');
            C52.Sound.play('deal', { pan: ((i - 5.5) / 5.5) * 0.6 });
          }, 120 + i * 95)
        );
      });
      timers.push(setTimeout(() => S().subtitle('Twelve games on the table. Lift a card to read its briefing.'), 1400));
    }
  }

  function openBriefing(id) {
    const g = C52.Games.meta(id);
    const playable = C52.Games.playable(id);
    selected = id;
    C52.Sound.play('flip');
    const b = stageEl.querySelector('#briefing');
    b.innerHTML = `
      <div class="briefing-card">${C52.GameCard.svg(g)}</div>
      <article class="slip" aria-labelledby="slip-title">
        <p class="slip-file">FILE No. ${C52.GameCard.pad(g.num)} &middot; ${g.group === 'niche' ? 'THE RARER GAMES' : 'THE CLASSICS'}</p>
        <h2 id="slip-title">${g.name}</h2>
        <p class="slip-line">${g.line}</p>
        <dl>
          <dt>Players</dt><dd>${C52.GameCard.players(g)}${g.teams ? ', in two partnerships' : ''}</dd>
          <dt>Type</dt><dd>${g.kind}</dd>
          <dt>Length</dt><dd>${g.length}</dd>
          <dt>Opponents</dt><dd>${g.solo && g.players[1] === 1 ? 'Just you and the deck' : 'Computer players or friends online'}</dd>
        </dl>
        ${playable ? '' : '<p class="stamp" aria-label="In preparation">In preparation</p>'}
        <div class="slip-actions">
          <button class="btn primary" id="take-seat" ${playable ? '' : 'disabled'}>Take a seat</button>
          <button class="btn ghost" id="back-to-hand">Back to the hand</button>
        </div>
      </article>`;
    b.classList.add('open');
    b.setAttribute('aria-hidden', 'false');
    stageEl.querySelector('#hand').classList.add('lowered');
    b.querySelector('#back-to-hand').onclick = closeBriefing;
    const seat = b.querySelector('#take-seat');
    seat.onclick = () => {
      C52.Sound.play('latch');
      C52.UI.show('table', { game: id });
    };
    (playable ? seat : b.querySelector('#back-to-hand')).focus();
  }

  function closeBriefing() {
    selected = null;
    C52.Sound.play('brush');
    const b = stageEl.querySelector('#briefing');
    b.classList.remove('open');
    b.setAttribute('aria-hidden', 'true');
    stageEl.querySelector('#hand').classList.remove('lowered');
    const card = stageEl.querySelector('.game-hand .card');
    if (card) card.focus();
  }

  function leave() {
    timers.forEach(clearTimeout);
    timers = [];
    if (onKey) root.removeEventListener('keydown', onKey);
  }

  function refresh() {
    const sel = selected;
    render(false);
    if (sel) openBriefing(sel);
  }

  C52.Screens.menu = { enter, leave, refresh };
})(window);
