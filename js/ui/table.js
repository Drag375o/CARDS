/* 52 Cards — the game table.
 *
 * Host:     owns the match state, applies moves, runs computer players and
 *           publishes each seat's view. Locally it publishes to this screen;
 *           online it also sends views to guests (see net.js).
 * Renderer: draws one seat's view and turns clicks into actions. It never
 *           sees the full state, so a guest's screen works the same way.
 *
 * Each game supplies a table description in C52.Tables[id]:
 *   center(view, ui)        markup for the middle of the felt
 *   seatInfo(view, seat)    short line under a seat's plaque
 *   status(view)            the top line (objective, round, piles)
 *   hand(view, actions, ui) { cards, playable:Set, multi } (default: view.hand)
 *   onCard(code, view, actions, ui)  -> action | 'chooser' | null
 *   rail(view, actions, ui) [{ label, action, primary, disabled, fn }]
 *   label(action)           text for a generic button
 *   rules                   markup for the How to play panel
 *   tilt                    table tilt in degrees
 */
(function (root) {
  'use strict';
  const C52 = root.C52;
  C52.Tables = C52.Tables || {};
  const $ = (s, el) => (el || root.document).querySelector(s);

  /* ---------- seat geometry ---------- */

  /** Seat position around the table, relative to the viewer at the bottom. Percent of .table-wrap. */
  function seatPos(rel, n) {
    const a = ((90 + (rel * 360) / n) * Math.PI) / 180;
    const s = Math.sin(a);
    // Seats across the far side sit a little inside the rail so they clear the top line.
    return { x: +(50 + 47 * Math.cos(a)).toFixed(2), y: +(50 + (s < 0 ? 40 : 52) * s).toFixed(2), a };
  }
  const relSeat = (seat, me, n) => (seat - me + n) % n;
  /** Seat position for the current game (a table description may lay seats out its own way). */
  const pos = (rel, n) => (R.T && R.T.seatPos ? R.T.seatPos(rel, n) : seatPos(rel, n));

  /* =================================================================
   *  HOST
   * ================================================================= */

  const Host = {
    st: null,
    engine: null,
    ai: null,
    seats: null,
    rng: null,
    timers: [],
    listeners: [],

    start(game, seats, options, restore) {
      this.stop();
      this.game = game;
      this.engine = C52.Games.engine(game);
      this.ai = (C52.AI && C52.AI[game]) || null;
      this.seats = seats;
      this.options = options;
      this.rng = C52.Cards.secureRng();
      this.st = restore || this.engine.setup({ n: seats.length, names: seats.map((s) => s.name), options }, this.rng);
      this.changed();
    },

    stop() {
      this.timers.forEach(clearTimeout);
      this.timers = [];
    },

    /** Apply a move for a seat. Returns false (and changes nothing) if it is illegal. */
    act(seat, action) {
      if (!this.st) return false;
      try {
        this.engine.apply(this.st, seat, action, this.rng);
      } catch (e) {
        if (root.console) console.warn(e.message);
        return false;
      }
      this.changed();
      return true;
    },

    changed() {
      this.publish();
      this.scheduleCPUs();
    },

    viewFor(seat) {
      return { view: this.engine.view(this.st, seat), actions: this.engine.actions(this.st, seat) };
    },

    publish() {
      this.listeners.forEach((fn) => fn());
      if (C52.Online && C52.Online.isHost()) C52.Online.publish();
    },

    /** Every computer seat with something to do gets its own timer; any change cancels them all. */
    scheduleCPUs() {
      this.timers.forEach(clearTimeout);
      this.timers = [];
      if (!this.ai) return;
      this.seats.forEach((s, seat) => {
        if (s.kind !== 'cpu' && !s.standIn) return; // a dropped online player has a computer standing in
        const actions = this.engine.actions(this.st, seat);
        if (!actions.length) return;
        const view = this.engine.view(this.st, seat);
        const level = s.level || 'medium';
        const base = this.ai.delay ? this.ai.delay(view, actions, level, this.rng) : 650 + this.rng() * 550;
        const ms = base * (root.C52_SPEED || 1); // C52_SPEED: test hook to fast-forward computer players
        this.timers.push(
          setTimeout(() => {
            const fresh = this.engine.actions(this.st, seat);
            if (!fresh.length) return;
            if (s.kind !== 'cpu' && !s.standIn) return; // the player came back
            const a = this.ai.decide(this.engine.view(this.st, seat), fresh, level, this.rng);
            if (a === null) return; // the computer chooses to do nothing (e.g. no slap worth making)
            if (!a || !this.act(seat, a)) this.act(seat, fresh[0]);
          }, ms)
        );
      });
    },
  };

  /* =================================================================
   *  RENDERER
   * ================================================================= */

  const R = {
    stage: null,
    me: 0,
    game: null,
    T: null,
    view: null,
    actions: [],
    lastSeq: 0,
    prevTurn: null,
    prevPhase: null,
    handKey: '',
    centerCards: new Set(),
    selection: new Set(),
    ledger: [],
    submit: null, // (action) => void
    seatsCfg: null,
  };

  // Helpers handed to table descriptions.
  const ui = {
    card(code, o) {
      return C52.Scene.cardHTML(code, o);
    },
    /** A pile at x%,y% of the felt. o: { top, faceDown, label, act, empty, seat (who put the top card there), depth } */
    pile(x, y, o) {
      const act = o.act != null ? ` data-act="${o.act}"` : '';
      const attrs = o.seat != null ? `data-seat="${o.seat}"` : '';
      const inner = o.empty || (!o.top && !o.faceDown) ? `<div class="slot">${o.empty || ''}</div>` : ui.card(o.top || null, { faceDown: !!o.faceDown, cls: o.depth !== false ? 'pile-depth' : '', attrs });
      const label = o.label != null ? `<span class="count">${o.label}</span>` : '';
      return `<div class="pile${o.act != null ? ' clickable' : ''}" style="left:${x}%;top:${y}%"${act}>${inner}${label}</div>`;
    },
    /** Position on the felt between the centre and a seat (for trick cards). */
    toward(seat, dist) {
      const p = pos(relSeat(seat, R.me, R.view.n), R.view.n);
      const d = dist == null ? 0.38 : dist;
      return { x: +(50 + (p.x - 50) * d).toFixed(2), y: +(50 + (p.y - 50) * d * 1.05).toFixed(2), a: p.a };
    },
    /** Cards played to a trick, each nudged toward the seat that played it. plays: [{seat, card}] */
    trick(plays, dist) {
      return plays
        .map((p, i) => {
          const pos = ui.toward(p.seat, dist);
          const rot = ((p.card.charCodeAt(0) * 7 + p.card.charCodeAt(1) * 3) % 13) - 6;
          return `<div class="trick-card" style="left:${pos.x}%;top:${pos.y}%;--rot:${rot}deg;z-index:${i + 1}">${ui.card(p.card, { attrs: `data-seat="${p.seat}"` })}</div>`;
        })
        .join('');
    },
    actIndex(pred) {
      return R.actions.findIndex(pred);
    },
    get selection() {
      return R.selection;
    },
    name: (seat) => (R.view ? R.view.names[seat] : ''),
    suitHTML: (s) => `<span class="s${s === 'H' || s === 'D' ? ' red-suit' : ''}">${C52.Cards.SUIT_SYMBOL[s]}</span>`,
    rerender: () => draw(),
    submit: (a) => submit(a),
  };

  function skeleton() {
    const v = C52.Venues.get(C52.Prefs.get().venue);
    R.stage.innerHTML = `
      <div class="table-wrap" id="tw"><div class="table" id="tbl"><div class="felt" id="felt">
        <div class="felt-mark">${v.name}</div>
        <div class="center" id="center"></div>
      </div></div>
      <div class="seats" id="seats"></div></div>
      <div class="topline">
        <button class="chip-btn" id="leave">&larr; Leave</button>
        <div class="status-line" id="status"></div>
        <button class="chip-btn" id="pad">Scorepad</button>
        <button class="chip-btn" id="rules">Rules</button>
      </div>
      <div class="my-plaque" id="myplaque"></div>
      <div class="hand" id="hand"></div>
      <div class="rail" id="rail"></div>
      <div class="overlay" id="overlay"></div>`;
    $('#leave').onclick = confirmLeave;
    $('#pad').onclick = () => openPad('scores');
    $('#rules').onclick = openRules;
    $('#center').addEventListener('click', onCenterClick);
    $('#rail').addEventListener('click', onRailClick);
    $('#hand').addEventListener('click', onHandClick);
    $('#hand').addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset.card) {
        e.preventDefault();
        cardChosen(e.target.dataset.card);
      }
    });
  }

  function receive(view, actions) {
    R.view = view;
    R.actions = actions;
    // Drop selections that are no longer in the hand.
    const hand = new Set(view.hand || []);
    [...R.selection].forEach((c) => !hand.has(c) && R.selection.delete(c));
    draw();
    playEvents(view);
    cues(view);
  }

  function draw() {
    const view = R.view;
    if (!view || !R.stage.querySelector('#center')) return;
    const T = R.T;
    $('#tbl').style.setProperty('--tilt', (T.tilt == null ? 12 : T.tilt) + 'deg');
    $('#tbl').classList.toggle('rect', T.shape === 'rect');
    R.stage.dataset.game = R.game;

    // Seats.
    $('#seats').innerHTML = view.names
      .map((nm, seat) => {
        if (seat === R.me) return '';
        const p = pos(relSeat(seat, R.me, view.n), view.n);
        return seatHTML(view, seat, p);
      })
      .join('');
    $('#myplaque').innerHTML = seatPlaque(view, R.me);

    // Lamp toward the active seat.
    if (view.turn != null) {
      const p = pos(relSeat(view.turn, R.me, view.n), view.n);
      $('#felt').style.setProperty('--lamp-x', p.x * 0.6 - 10 + '%');
      $('#felt').style.setProperty('--lamp-y', p.y * 0.6 - 15 + '%');
    }

    // Centre, with arrival animation for cards that are new.
    const center = $('#center');
    center.innerHTML = T.center(view, ui);
    const now = new Set();
    center.querySelectorAll('[data-card]').forEach((el) => {
      const c = el.dataset.card;
      now.add(c);
      if (!R.centerCards.has(c) && R.prevPhase != null) {
        const seat = el.dataset.seat != null ? Number(el.dataset.seat) : null;
        if (seat != null) {
          const p = pos(relSeat(seat, R.me, view.n), view.n);
          el.style.setProperty('--from-x', (Math.cos(p.a) * 30).toFixed(1) + 'vw');
          el.style.setProperty('--from-y', (Math.sin(p.a) * 34).toFixed(1) + 'vh');
        }
        el.classList.add('arrive');
      }
    });
    R.centerCards = now;
    if (T.afterRender) T.afterRender(center, view, R.actions, ui);

    $('#status').innerHTML = T.status ? T.status(view) : '';
    drawHand();
    drawRail();
    drawPhaseOverlay();
  }

  function seatPlaque(view, seat) {
    const cfg = R.seatsCfg && R.seatsCfg[seat];
    const tag = !cfg ? '' : cfg.standIn ? '<span class="tag">Computer standing in</span>' : cfg.offline ? '<span class="tag">Waiting to rejoin</span>' : cfg.kind === 'cpu' ? `<span class="tag">${C52.Seating.LEVEL_NAME[cfg.level] || ''}</span>` : cfg.kind === 'remote' ? '<span class="tag">Online</span>' : '';
    const sub = R.T.seatSub ? R.T.seatSub(view, seat) : view.scores ? 'Score ' + view.scores[seat] : '';
    const dealer = view.dealer === seat ? '<span class="dealer-puck" title="Dealer">D</span>' : '';
    return `<div class="plaque">${dealer}<span class="nm">${esc(view.names[seat])}${tag}</span><span class="sub">${sub}</span></div>`;
  }

  function seatHTML(view, seat, p) {
    const count = view.counts ? view.counts[seat] : 0;
    const shown = Math.min(count, 9);
    let mini = '';
    for (let i = 0; i < shown; i++) {
      const k = i - (shown - 1) / 2;
      mini += `<div class="card" style="transform:translateX(calc(-50% + ${k * 9}px)) rotate(${k * 5}deg)">${C52.Art.card(null, Object.assign({}, C52.Prefs.look(), { faceDown: true }))}</div>`;
    }
    const info = R.T.seatInfo ? R.T.seatInfo(view, seat) : count ? count + (count === 1 ? ' card' : ' cards') : '';
    const cls = ['seat', view.turn === seat ? 'active' : '', R.T.seatOut && R.T.seatOut(view, seat) ? 'out' : ''].join(' ');
    return `<div class="${cls}" style="left:${p.x}%;top:${p.y}%">
      ${count ? `<div class="mini-hand">${mini}</div>` : ''}
      ${seatPlaque(view, seat)}
      <div class="info">${info || ''}</div></div>`;
  }

  function handSpec() {
    const T = R.T;
    if (T.hand) return T.hand(R.view, R.actions, ui);
    const cards = R.view.hand || [];
    const playable = new Set(R.actions.filter((a) => a.card).map((a) => a.card));
    return { cards, playable, multi: false };
  }

  function drawHand() {
    const spec = handSpec();
    const sel = [...R.selection].sort().join(',');
    const key = spec.cards.join(',') + '|' + [...spec.playable].sort().join(',') + '|' + sel + '|' + (spec.faceDown ? 1 : 0) + '|' + C52.Prefs.look().deck;
    const hand = $('#hand');
    if (key === R.handKey) return;
    // Keep existing card elements where possible so they glide into place.
    const old = new Map([...hand.children].map((el) => [el.dataset.card, el]));
    hand.innerHTML = '';
    spec.cards.forEach((c, i) => {
      let el = old.get(c);
      const cls = 'card' + (spec.playable.has(c) ? ' playable' : spec.dim === false ? '' : ' muted') + (R.selection.has(c) ? ' selected' : '');
      if (!el || R.handKey.split('|')[4] !== C52.Prefs.look().deck) {
        const tmp = root.document.createElement('div');
        tmp.innerHTML = C52.Scene.cardHTML(spec.faceDown ? null : c, { faceDown: !!spec.faceDown });
        el = tmp.firstChild;
        el.dataset.card = c;
      }
      el.className = cls;
      el.tabIndex = spec.playable.has(c) ? 0 : -1;
      if (R.selection.has(c)) el.style.setProperty('--y', '-18px');
      hand.appendChild(el);
    });
    R.handKey = key;
    C52.Scene.fan(hand);
    // Selected cards stand a little proud of the fan.
    [...hand.children].forEach((el) => {
      if (R.selection.has(el.dataset.card)) el.style.setProperty('--y', parseFloat(el.style.getPropertyValue('--y') || 0) - 22 + 'px');
    });
  }

  function drawRail() {
    const T = R.T;
    let items;
    if (T.rail) items = T.rail(R.view, R.actions, ui);
    else {
      items = R.actions
        .map((a, i) => ({ a, i }))
        .filter(({ a }) => !a.card && a.type !== 'next')
        .map(({ a }) => ({ label: T.label ? T.label(a) : a.type, action: a }));
    }
    const hint = T.hint ? fixYou(T.hint(R.view, R.actions, ui)) : '';
    R.railItems = items || [];
    $('#rail').innerHTML =
      (hint ? `<div class="hint">${hint}</div>` : '') +
      R.railItems
        .map((it, i) => {
          if (it.row) return `<div class="act-row">${it.row.map((r, j) => `<button class="act${r.primary ? ' primary' : ''}" data-rail="${i}:${j}" ${r.disabled ? 'disabled' : ''}>${r.label}</button>`).join('')}</div>`;
          return `<button class="act${it.primary ? ' primary' : ''}" data-rail="${i}" ${it.disabled ? 'disabled' : ''}>${it.label}</button>`;
        })
        .join('');
  }

  /* ---------- input ---------- */

  function submit(action) {
    if (!action) return;
    R.selection.clear();
    R.submit(action);
  }

  function onHandClick(e) {
    const el = e.target.closest('.card');
    if (!el || !el.dataset.card) return;
    cardChosen(el.dataset.card);
  }

  function cardChosen(code) {
    const spec = handSpec();
    if (spec.multi) {
      if (!spec.playable.has(code) && !R.selection.has(code)) return;
      if (R.selection.has(code)) R.selection.delete(code);
      else {
        if (spec.max && R.selection.size >= spec.max) return;
        R.selection.add(code);
      }
      C52.Sound.play('flip');
      draw();
      return;
    }
    if (!spec.playable.has(code)) return;
    const T = R.T;
    const res = T.onCard ? T.onCard(code, R.view, R.actions, ui) : null;
    if (res && res.chooser) return openChooser(res.chooser);
    if (res) return submit(res);
    const matches = R.actions.filter((a) => a.card === code);
    if (matches.length === 1) submit(matches[0]);
    else if (matches.length > 1 && matches.every((a) => a.suit)) {
      openChooser({ title: 'Choose the next suit', suits: matches });
    }
  }

  function onCenterClick(e) {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const a = R.actions[Number(el.dataset.act)];
    if (a) submit(a);
    else if (R.T.onCenter) R.T.onCenter(el.dataset.act, R.view, R.actions, ui);
  }

  function onRailClick(e) {
    const b = e.target.closest('[data-rail]');
    if (!b || b.disabled) return;
    const [i, j] = b.dataset.rail.split(':').map(Number);
    const it = j == null || isNaN(j) ? R.railItems[i] : R.railItems[i].row[j];
    if (it.fn) return it.fn();
    if (it.chooser) return openChooser(it.chooser);
    submit(it.action);
  }

  /* ---------- overlays ---------- */

  function overlay(html, onWire) {
    const o = $('#overlay');
    o.innerHTML = html;
    o.classList.add('open');
    o.onclick = (e) => {
      if (e.target === o && !o.dataset.sticky) closeOverlay();
    };
    if (onWire) onWire(o);
    const f = o.querySelector('button.btn.primary, button');
    if (f) f.focus();
  }
  function closeOverlay() {
    const o = $('#overlay');
    if (!o) return;
    o.classList.remove('open');
    o.dataset.sticky = '';
    o.dataset.kind = '';
  }

  /** chooser: { title, suits: [actions with .suit] } or { title, nums: [actions], numKey } or { title, options: [{label, action}] } */
  function openChooser(ch) {
    let body = '';
    if (ch.suits) {
      body = `<div class="suit-picker">${ch.suits
        .map((a, i) => `<button data-i="${i}" class="${a.suit === 'H' || a.suit === 'D' ? 'red-suit' : ''}" aria-label="${C52.Cards.SUIT_NAME[a.suit]}">${C52.Cards.SUIT_SYMBOL[a.suit]}</button>`)
        .join('')}</div>`;
    } else if (ch.grid) {
      // Rows of buttons (the Bridge bidding box). Items are numbered across rows.
      let k = 0;
      ch.flat = [];
      body = `<div class="bid-grid">${ch.grid
        .map((row) => `<div class="bid-row">${row.map((it) => {
          ch.flat.push(it);
          return `<button data-i="${k++}" class="${it.cls || ''}" ${it.disabled ? 'disabled' : ''}>${it.label}</button>`;
        }).join('')}</div>`)
        .join('')}</div>`;
    } else if (ch.nums) {
      body = `<div class="num-picker">${ch.nums.map((a, i) => `<button data-i="${i}" ${a.disabled ? 'disabled' : ''}>${a.text}</button>`).join('')}</div>`;
    } else {
      body = `<div class="slip-actions" style="flex-direction:column">${ch.options.map((o, i) => `<button class="btn ${i ? 'ghost' : 'primary'}" data-i="${i}">${o.label}</button>`).join('')}</div>`;
    }
    overlay(
      `<article class="slip"><h2>${ch.title}</h2>${ch.note ? `<p class="slip-line">${ch.note}</p>` : ''}${body}
        <div class="slip-actions"><button class="btn ghost" id="ch-cancel">Cancel</button></div></article>`,
      (o) => {
        o.querySelectorAll('[data-i]').forEach((b) => {
          b.onclick = () => {
            const i = Number(b.dataset.i);
            const pick = ch.suits ? ch.suits[i] : ch.grid ? ch.flat[i].action : ch.nums ? ch.nums[i].action : ch.options[i].action;
            closeOverlay();
            if (ch.options && ch.options[i].fn) ch.options[i].fn();
            else submit(pick);
          };
        });
        o.querySelector('#ch-cancel').onclick = closeOverlay;
      }
    );
  }

  function scoreTable(view) {
    const head = view.scoreHead || view.names;
    const rows = (view.history || [])
      .map((h) => `<tr><td>${h.label}</td>${h.points.map((p) => `<td>${p}</td>`).join('')}</tr>`)
      .join('');
    const totals = view.scoreTotals || view.scores;
    return `<table><thead><tr><th></th>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${rows || `<tr><td colspan="${head.length + 1}" style="text-align:left;color:#7a6b52">No rounds finished yet.</td></tr>`}
      <tr class="total"><td>Total</td>${(totals || []).map((t) => `<td>${t}</td>`).join('')}</tr></tbody></table>`;
  }

  function openPad(tab) {
    const view = R.view;
    const body =
      tab === 'ledger'
        ? `<ul class="ledger">${R.ledger.slice().reverse().map((l) => `<li>${esc(l)}</li>`).join('') || '<li>Nothing yet.</li>'}</ul>`
        : scoreTable(view);
    overlay(
      `<article class="slip wide"><p class="slip-file">SCOREPAD &middot; ${esc(C52.Games.meta(R.game).name.toUpperCase())}</p>
        <div class="tabs" role="tablist"><button role="tab" aria-selected="${tab !== 'ledger'}" data-tab="scores">Scores</button><button role="tab" aria-selected="${tab === 'ledger'}" data-tab="ledger">Ledger</button></div>
        ${body}<div class="slip-actions"><button class="btn primary" id="pad-close">Close</button></div></article>`,
      (o) => {
        o.querySelector('#pad-close').onclick = closeOverlay;
        o.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => openPad(b.dataset.tab)));
      }
    );
    $('#overlay').dataset.kind = 'pad';
  }

  function openRules() {
    const meta = C52.Games.meta(R.game);
    overlay(
      `<article class="slip wide"><p class="slip-file">HOW TO PLAY &middot; FILE No. ${C52.GameCard.pad(meta.num)}</p>
        <h2>${meta.name}</h2><p class="slip-line">${meta.line}</p>
        <div class="rules">${R.T.rules || ''}</div>
        <div class="slip-actions"><button class="btn primary" id="rules-close">Back to the table</button></div></article>`,
      (o) => (o.querySelector('#rules-close').onclick = closeOverlay)
    );
    $('#overlay').dataset.kind = 'rules';
  }

  function confirmLeave() {
    const host = C52.Online && C52.Online.isHost();
    const guest = C52.Online && C52.Online.isGuest();
    const line = host ? 'Leave this online game? It ends for everyone.' : guest ? 'Leave this online game? The computer will play for you.' : 'This game will end.';
    overlay(
      `<article class="slip"><h2>Leave the table?</h2><p class="slip-line">${line}</p>
        <div class="slip-actions"><button class="btn primary" id="lv-yes">Leave</button><button class="btn ghost" id="lv-no">Stay</button></div></article>`,
      (o) => {
        o.querySelector('#lv-yes').onclick = () => {
          closeOverlay();
          if (host) C52.Online.hostLeave();
          if (guest) C52.Online.guestLeave();
          C52.Sound.play('brush');
          C52.UI.show('menu', { brief: R.game });
        };
        o.querySelector('#lv-no').onclick = closeOverlay;
      }
    );
  }

  /** Round and game debriefs, shown automatically when the phase calls for one. */
  function drawPhaseOverlay() {
    const view = R.view;
    const o = $('#overlay');
    const ended = view.phase === 'roundover' || view.phase === 'gameover';
    if (!ended) {
      if (o.dataset.kind === 'debrief') closeOverlay();
      return;
    }
    if (o.dataset.kind === 'debrief' && o.dataset.seq === String(view.seq)) return;
    const s = view.summary || {};
    const won = view.winners && view.winners.includes(R.me);
    const next = R.actions.find((a) => a.type === 'next');
    const over = view.phase === 'gameover';
    const table =
      s.head && s.rows
        ? `<table><thead><tr>${s.head.map((h, i) => `<th>${i ? esc(h) : ''}</th>`).join('')}</tr></thead><tbody>${s.rows
            .map((r, ri) => `<tr${r.total ? ' class="total"' : ''}>${(r.cells || r).map((c) => `<td>${c}</td>`).join('')}</tr>`)
            .join('')}</tbody></table>`
        : '';
    const stamp = over && view.winners && view.winners.length ? `<p class="winner-stamp">${esc(fixYou(C52.Engine.andList(view.winners.map((w) => view.names[w])) + (view.winners.length > 1 ? ' win' : ' wins')))}</p>` : '';
    const isGuest = C52.Online && C52.Online.isGuest();
    const buttons = over
      ? isGuest
        ? `<p class="slip-line">Waiting for the host to deal again…</p><button class="btn ghost" id="db-leave">Leave the table</button>`
        : `<button class="btn primary" id="db-again">Deal again</button><button class="btn ghost" id="db-leave">Leave the table</button>`
      : next
      ? `<button class="btn primary" id="db-next">${s.nextLabel || 'Next round'}</button><button class="btn ghost" id="db-pad">Scorepad</button>`
      : `<p class="slip-line">Waiting for the host to deal the next round…</p>`;
    overlay(
      `<article class="slip wide"><p class="slip-file">${over ? 'DEBRIEF' : 'ROUND ' + view.round} &middot; ${esc(C52.Games.meta(R.game).name.toUpperCase())}</p>
        <h2>${esc(fixYou(s.title || (over ? 'Game over' : 'Round over')))}</h2>${s.note ? `<p class="slip-line">${fixYou(s.note)}</p>` : ''}
        ${stamp}${table}<div class="slip-actions">${buttons}</div></article>`,
      (el) => {
        const q = (id) => el.querySelector(id);
        if (q('#db-next')) q('#db-next').onclick = () => submit(next);
        if (q('#db-pad')) q('#db-pad').onclick = () => openPad('scores');
        if (q('#db-again')) q('#db-again').onclick = () => (C52.Online && C52.Online.isHost() ? C52.Online.restart() : C52.UI.show('table', R.params));
        if (q('#db-leave')) q('#db-leave').onclick = () => (C52.Online && (C52.Online.isHost() || C52.Online.isGuest()) ? confirmLeave() : C52.UI.show('menu', { brief: R.game }));
      }
    );
    o.dataset.kind = 'debrief';
    o.dataset.sticky = '1';
    o.dataset.seq = String(view.seq);
    if (over && R.prevPhase !== 'gameover') C52.Sound.sting(won ? 'win' : 'lose');
  }

  /* ---------- sound and narration ---------- */

  function panFor(seat) {
    if (seat == null || !R.view) return 0;
    const p = pos(relSeat(seat, R.me, R.view.n), R.view.n);
    return +(Math.cos(p.a) * 0.7).toFixed(2);
  }

  function playEvents(view) {
    const fresh = (view.events || []).filter((e) => e.id > R.lastSeq);
    if (!fresh.length) return;
    // On first sight of a match (or a guest joining late) don't replay history.
    if (R.lastSeq === 0 && fresh.length > 12) {
      R.lastSeq = view.seq;
      return;
    }
    R.lastSeq = view.seq;
    let delay = 0;
    let text = '';
    fresh.forEach((ev) => {
      if (ev.text) {
        text = fixYou(ev.text);
        R.ledger.push(text);
      }
      if (ev.sound === 'deal' && ev.count) {
        const n = Math.min(ev.count, 14);
        for (let i = 0; i < n; i++) C52.Sound.play('deal', { pan: panFor(i % view.n), delay: delay + i * 0.07 });
        delay += n * 0.07;
      } else if (ev.sound) {
        C52.Sound.play(ev.sound, { pan: panFor(ev.seat), count: ev.count, delay });
        delay += 0.08;
      }
      if (ev.sting) C52.Sound.sting(ev.sting);
    });
    if (R.ledger.length > 400) R.ledger.splice(0, R.ledger.length - 400);
    if (text) C52.Scene.subtitle(text);
  }

  function cues(view) {
    const myTurn = R.actions.length > 0 && view.phase !== 'roundover' && view.phase !== 'gameover';
    if (myTurn && !R.prevMyTurn && R.prevPhase != null) C52.Sound.play('turn', { delay: 0.25 });
    R.prevMyTurn = myTurn;
    R.prevTurn = view.turn;
    R.prevPhase = view.phase;
  }

  /* ---------- screen ---------- */

  let unlisten = null;

  function enter(stage, params) {
    R.stage = stage;
    R.params = params;
    R.game = params.game;
    R.T = C52.Tables[params.game];
    R.me = 0;
    R.lastSeq = 0;
    R.prevPhase = null;
    R.prevMyTurn = false;
    R.handKey = '';
    R.centerCards = new Set();
    R.selection = new Set();
    R.ledger = [];
    R.seatsCfg = params.seats;
    skeleton();

    if (params.guest) {
      // Online guest: views arrive from the host over the network.
      R.me = params.guest.seat;
      R.submit = (a) => C52.Online.guestSend(a);
      return;
    }
    R.submit = (a) => Host.act(R.me, a);
    const listener = () => {
      const { view, actions } = Host.viewFor(R.me);
      receive(view, actions);
    };
    Host.listeners = [listener];
    unlisten = () => (Host.listeners = []);
    Host.start(params.game, params.seats, params.options || {}, params.restore || null);
  }

  function leave() {
    Host.stop();
    if (unlisten) unlisten();
    unlisten = null;
  }

  function refresh() {
    if (!R.view) return;
    const ov = $('#overlay');
    const kind = ov && ov.dataset.kind;
    R.handKey = '';
    $('#hand').innerHTML = '';
    draw();
    if (kind && kind !== 'debrief' && ov) ov.classList.add('open');
  }

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  /** Only the viewer's own seat can be "You". */
  const fixYou = (s) => (R.view && R.view.names[R.me] === 'You' ? C52.Engine.youify(s) : s);

  C52.Screens.table = { enter, leave, refresh };
  C52.Table = { seatPos, relSeat, Host, receive, ui, openChooser, closeOverlay, R };
})(window);
