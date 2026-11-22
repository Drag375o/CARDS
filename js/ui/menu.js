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
      `<div class="briefing" id="briefing" aria-hidden="true"></div>` +
      `<div class="topline"><button class="chip-btn" id="join-btn">Join a table</button></div>` +
      savedCards();

    stageEl.querySelector('#join-btn').onclick = openJoin;
    wireSaved();
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
          n.focus({ preventScroll: true });
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
      C52.UI.show('seating', { game: id });
    };
    (playable ? seat : b.querySelector('#back-to-hand')).focus({ preventScroll: true });
  }

  /* ---------- online: join, resume, rejoin ---------- */

  function savedCards() {
    const h = C52.Online.savedHost();
    const g = C52.Online.savedGuest();
    let out = '';
    if (h) {
      const meta = C52.Games.meta(h.game);
      out += `<div class="saved-card"><b>Your online game is saved</b><span>Room ${h.code} &middot; ${meta ? meta.name : ''} &middot; round ${h.round}</span>
        <button class="btn primary" id="resume-host">Resume game</button><button class="btn ghost" id="discard-host">Discard</button></div>`;
    } else if (g) {
      out += `<div class="saved-card"><b>Rejoin your online game?</b><span>Room ${g.code}. Your seat is saved for you.</span>
        <button class="btn primary" id="rejoin">Rejoin</button><button class="btn ghost" id="dismiss-guest">Dismiss</button></div>`;
    }
    return out;
  }

  function wireSaved() {
    const q = (id) => stageEl.querySelector(id);
    if (q('#resume-host')) q('#resume-host').onclick = () => C52.Online.resume(C52.Online.savedHost());
    if (q('#discard-host')) q('#discard-host').onclick = () => (C52.Online.forgetHost(), render(false));
    if (q('#rejoin')) q('#rejoin').onclick = () => {
      const g = C52.Online.savedGuest();
      C52.Scene.notice(`Rejoining room <b>${g.code}</b>…`, { ms: 15000 });
      C52.Online.join(g.code, g.name || C52.Prefs.get().name || 'Guest', (text) => C52.Scene.notice(text, { ms: 8000 }));
    };
    if (q('#dismiss-guest')) q('#dismiss-guest').onclick = () => (C52.Online.forgetGuest(), render(false));
  }

  function openJoin() {
    C52.Sound.play('flip');
    const b = stageEl.querySelector('#briefing');
    const name = C52.Prefs.get().name || '';
    b.innerHTML = `<article class="slip" aria-labelledby="join-title">
        <p class="slip-file">ONLINE &middot; JOIN A FRIEND'S TABLE</p>
        <h2 id="join-title">Join a table</h2>
        <p class="slip-line">Type the five-letter room code your friend sees on their table.</p>
        <div class="opt"><span>Room code</span><input type="text" id="join-code" maxlength="5" autocomplete="off" spellcheck="false" style="text-transform:uppercase;letter-spacing:.3em;width:120px"></div>
        <div class="opt"><span>Your name</span><input type="text" id="join-name" maxlength="16" value="${name.replace(/"/g, '&quot;')}" placeholder="Guest"></div>
        <p class="slip-line" id="join-msg" style="min-height:1.4em;margin-top:10px"></p>
        <div class="slip-actions"><button class="btn primary" id="join-go">Join</button><button class="btn ghost" id="back-to-hand">Back to the hand</button></div>
      </article>`;
    b.classList.add('open');
    b.setAttribute('aria-hidden', 'false');
    stageEl.querySelector('#hand').classList.add('lowered');
    const code = b.querySelector('#join-code');
    code.focus({ preventScroll: true });
    b.querySelector('#back-to-hand').onclick = closeBriefing;
    const go = () => {
      const c = C52.Net.cleanCode(code.value);
      const nm = b.querySelector('#join-name').value.trim().slice(0, 16) || 'Guest';
      if (c.length !== C52.Net.CODE_LENGTH) return (b.querySelector('#join-msg').textContent = 'Room codes have five letters.');
      C52.Prefs.set({ name: nm });
      b.querySelector('#join-msg').textContent = 'Connecting…';
      C52.Online.join(c, nm, (text) => (b.querySelector('#join-msg').textContent = text));
    };
    b.querySelector('#join-go').onclick = go;
    code.onkeydown = (e) => e.key === 'Enter' && go();
  }

  function closeBriefing() {
    selected = null;
    C52.Sound.play('brush');
    const b = stageEl.querySelector('#briefing');
    b.classList.remove('open');
    b.setAttribute('aria-hidden', 'true');
    stageEl.querySelector('#hand').classList.remove('lowered');
    const card = stageEl.querySelector('.game-hand .card');
    if (card) card.focus({ preventScroll: true });
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
