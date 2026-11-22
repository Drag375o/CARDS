/* 52 Cards — the scene: backdrop, table, your hand, subtitles and the
 * House drawer (venue, deck, back, readability, sound). Screens render
 * into #stage; everything else here persists between screens. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const doc = root.document;
  const $ = (sel, el) => (el || doc).querySelector(sel);

  let subtitleTimer = 0;
  const drawerSections = []; // other modules (e.g. sound) add sections here

  function mount() {
    doc.body.insertAdjacentHTML('afterbegin', C52.Art.defs());
    doc.body.insertAdjacentHTML(
      'beforeend',
      `<div id="scene">
        <div class="backdrop"></div>
        <main id="stage" aria-live="off"></main>
        <div class="vignette"></div>
        <div class="grain"></div>
        <p class="subtitle" id="subtitle" role="status" aria-live="polite"></p>
        <div class="notice" id="notice" role="status" aria-live="polite"></div>
        <button class="house-btn" id="house-btn" aria-label="The House: venue, deck and sound" title="The House">52</button>
        <aside class="drawer" id="drawer" aria-label="The House" aria-hidden="true"></aside>
      </div>`
    );
    $('#house-btn').addEventListener('click', () => toggleDrawer());
    doc.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && $('#drawer').classList.contains('open')) toggleDrawer(false);
    });
    applyPrefs();
    C52.Prefs.onChange(() => {
      applyPrefs();
      if ($('#drawer').classList.contains('open')) renderDrawer();
    });
  }

  function applyPrefs() {
    const p = C52.Prefs.get();
    doc.documentElement.dataset.venue = C52.Venues.get(p.venue).id;
    doc.documentElement.classList.toggle('reduced-motion', !!p.reducedMotion);
  }

  /* ---------- cards ---------- */

  /** Markup for one card on the table. o.faceDown, o.cls, o.attrs */
  function cardHTML(code, o) {
    const opt = o || {};
    const look = C52.Prefs.look();
    const svg = C52.Art.card(opt.faceDown ? null : code, Object.assign({}, look, { faceDown: opt.faceDown }));
    const data = code && !opt.faceDown ? ` data-card="${code}"` : '';
    return `<div class="card ${opt.cls || ''}"${data} ${opt.attrs || ''}>${svg}</div>`;
  }

  /** Lay the children of a .hand out as a fan held in front of you.
   *  Freshly rendered cards are placed instantly; cards already on screen glide. */
  function fan(handEl) {
    const cards = [...handEl.children];
    const n = cards.length;
    if (!n) return;
    const fresh = cards.filter((el) => !el.dataset.placed);
    fresh.forEach((el) => {
      el.style.transition = 'none';
      el.dataset.placed = '1';
    });
    root.requestAnimationFrame(() => root.requestAnimationFrame(() => fresh.forEach((el) => (el.style.transition = ''))));
    const cw = cards[0].getBoundingClientRect().width || 80;
    const maxWidth = Math.min(root.innerWidth * 0.86, cw * 0.62 * n + cw);
    const step = n > 1 ? Math.min(cw * 0.62, (maxWidth - cw) / (n - 1)) : 0;
    const arc = Math.min(3.2, 34 / n);
    cards.forEach((el, i) => {
      const k = i - (n - 1) / 2;
      el.style.setProperty('--x', (k * step).toFixed(1) + 'px');
      el.style.setProperty('--y', (Math.abs(k) * Math.abs(k) * 0.9).toFixed(1) + 'px');
      el.style.setProperty('--r', (k * arc).toFixed(2) + 'deg');
      el.style.zIndex = String(i + 1);
    });
  }

  /* ---------- subtitles ---------- */

  function subtitle(text, ms) {
    const el = $('#subtitle');
    clearTimeout(subtitleTimer);
    el.textContent = text;
    el.classList.add('on');
    subtitleTimer = setTimeout(() => el.classList.remove('on'), ms || Math.max(2600, text.length * 70));
  }

  /* ---------- notices (online status, countdowns) ---------- */

  let noticeTimer = 0;
  let noticeId = '';
  /** Show a notice under the top line. opts: { ms, sticky, id } */
  function notice(html, opts) {
    const o = opts || {};
    const el = $('#notice');
    if (!el) return;
    clearTimeout(noticeTimer);
    noticeId = o.id || '';
    el.innerHTML = html;
    el.classList.add('on');
    if (!o.sticky) noticeTimer = setTimeout(() => el.classList.remove('on'), o.ms || 5000);
  }
  /** Hide the notice (only if it is the one with this id, when an id is given). */
  function clearNotice(id) {
    const el = $('#notice');
    if (!el || (id && id !== noticeId)) return;
    el.classList.remove('on');
  }

  /* ---------- the House drawer ---------- */

  function toggleDrawer(force) {
    const d = $('#drawer');
    const open = force == null ? !d.classList.contains('open') : force;
    if (open) renderDrawer();
    d.classList.toggle('open', open);
    d.setAttribute('aria-hidden', String(!open));
    if (C52.Sound) C52.Sound.play(open ? 'latch' : 'brush');
  }

  const pressed = (b) => `aria-pressed="${b ? 'true' : 'false'}"`;

  function renderDrawer() {
    const p = C52.Prefs.get();
    const look = C52.Prefs.look();
    const venues = C52.Venues.list()
      .map(
        (v) =>
          `<button class="choice" data-venue="${v.id}" ${pressed(v.id === look.venue)}>
            <span class="swatch" style="display:block;background:linear-gradient(135deg,${v.swatch[2]} 0 30%,${v.swatch[0]} 30% 75%,${v.swatch[1]} 75%)"></span>
            <span class="label">${v.name}</span><span class="sub">${v.setting}</span>
          </button>`
      )
      .join('');
    const decks = C52.Art.decks()
      .map((d) => {
        const o = { deck: d.id, fourColour: p.fourColour };
        const mini = ['AS', 'KH', 'QD']
          .map((c, i) => `<div style="transform:rotate(${(i - 1) * 12}deg)">${C52.Art.card(c, o)}</div>`)
          .join('');
        return `<button class="choice" data-deck="${d.id}" ${pressed(d.id === look.deck)}>
            <div class="mini-fan">${mini}</div><span class="label">${d.name}</span>
          </button>`;
      })
      .join('');
    const backs = [{ id: null, name: 'Match the venue' }]
      .concat(C52.Art.backs())
      .map((b) => {
        const shown = b.id || C52.Venues.get(p.venue).back;
        return `<button class="choice" data-back="${b.id || ''}" ${pressed((p.back || null) === b.id)}>
            <div class="mini-back">${C52.Art.card(null, { deck: look.deck, back: shown })}</div><span class="label">${b.name}</span>
          </button>`;
      })
      .join('');
    const toggle = (key, label) =>
      `<label class="toggle">${label}<input type="checkbox" data-pref="${key}" ${p[key] ? 'checked' : ''}></label>`;

    const d = $('#drawer');
    d.innerHTML =
      `<button class="close" aria-label="Close">&times;</button>
      <h2>The House</h2>
      <p class="lede">Choose your room and your cards. Changes take effect at once.</p>
      <h3>Venue</h3><div class="choices">${venues}</div>
      <h3>Deck</h3><div class="choices">${decks}</div>
      <h3>Card back</h3><div class="choices">${backs}</div>
      <h3>Readability</h3>
      ${toggle('fourColour', 'Four-colour suits')}
      ${toggle('largeIndex', 'Large corner indices')}
      ${toggle('reducedMotion', 'Reduce motion')}` +
      drawerSections.map((fn) => fn(p)).join('');

    d.querySelector('.close').onclick = () => toggleDrawer(false);
    d.querySelectorAll('[data-venue]').forEach((b) => (b.onclick = () => pick({ venue: b.dataset.venue })));
    d.querySelectorAll('[data-deck]').forEach((b) => (b.onclick = () => pick({ deck: b.dataset.deck })));
    d.querySelectorAll('[data-back]').forEach((b) => (b.onclick = () => pick({ back: b.dataset.back || null })));
    d.querySelectorAll('[data-pref]').forEach((i) => (i.onchange = () => C52.Prefs.set({ [i.dataset.pref]: i.checked })));
    d.querySelectorAll('[data-wire]').forEach((el) => drawerWires[el.dataset.wire] && drawerWires[el.dataset.wire](el));
  }
  const drawerWires = {};

  function pick(patch) {
    if (C52.Sound) C52.Sound.play('latch');
    C52.Prefs.set(patch);
  }

  C52.Scene = {
    mount, cardHTML, fan, subtitle, toggleDrawer, $, notice, clearNotice,
    /** Add a drawer section: html(prefs) -> markup; wire(el) binds elements with data-wire=name. */
    addDrawerSection(html, name, wire) {
      drawerSections.push(html);
      if (name) drawerWires[name] = wire;
    },
  };
})(window);
