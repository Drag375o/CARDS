/* 52 Cards — set the table. Empty chairs around the felt (every one a
 * computer player unless a friend takes it online), and the house rules
 * on a folded card in the middle. */
(function (root) {
  'use strict';
  const C52 = root.C52;

  const CPU_NAMES = [
    'Mr Valentine', 'Countess Rhee', 'Dr Okafor', 'Mme Duval', 'Colonel Brandt',
    'Signor Rossi', 'Miss Navarro', 'Baron Szabo', 'Mr Achterberg',
  ];
  const LEVELS = ['easy', 'medium', 'hard'];
  const LEVEL_NAME = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
  const DEFAULT_COUNT = { holdem: 6, blackjack: 3, rummy: 4, crazy8: 4, bigtwo: 4, ers: 4, ohhell: 4, twentyfive: 5 };

  const SAVE_KEY = '52cards:seating';
  let cfg = null;
  let stageEl = null;

  function loadSaved(game) {
    try {
      const all = JSON.parse(root.localStorage.getItem(SAVE_KEY) || '{}');
      return all[game] || null;
    } catch (e) {
      return null;
    }
  }
  function save() {
    try {
      const all = JSON.parse(root.localStorage.getItem(SAVE_KEY) || '{}');
      all[cfg.game] = { count: cfg.count, levels: cfg.seats.map((s) => s.level || 'medium'), options: cfg.options };
      root.localStorage.setItem(SAVE_KEY, JSON.stringify(all));
    } catch (e) {
      /* storage unavailable */
    }
  }

  function makeConfig(game) {
    const meta = C52.Games.meta(game);
    const engine = C52.Games.engine(game);
    const saved = loadSaved(game) || {};
    const [lo, hi] = meta.players;
    const count = Math.min(hi, Math.max(lo, saved.count || DEFAULT_COUNT[game] || lo));
    const options = {};
    (engine.options || []).forEach((o) => {
      const v = saved.options && saved.options[o.key];
      options[o.key] = o.values.some((x) => x.value === v) ? v : o.default;
    });
    const names = CPU_NAMES.slice();
    const seats = [{ kind: 'you', name: C52.Prefs.get().name || 'You' }];
    for (let i = 1; i < hi; i++) seats.push({ kind: 'cpu', level: (saved.levels && saved.levels[i]) || 'medium', name: names[(i - 1) % names.length] });
    return { game, meta, engine, count, options, seats };
  }

  const hosting = () => C52.Online && C52.Online.isHost() && C52.Online.state.cfg === cfg;

  function enter(stage, params) {
    stageEl = stage;
    cfg = makeConfig(params.game);
    render();
  }

  function render() {
    const v = C52.Venues.get(C52.Prefs.get().venue);
    const { meta, engine } = cfg;
    const n = cfg.count;
    const chairs = cfg.seats
      .slice(0, n)
      .map((s, i) => {
        if (i === 0) return '';
        const p = C52.Table.seatPos(i, n);
        if (s.kind === 'open') {
          const who = C52.Online.chairInfo(i);
          return `<button class="chair open-seat" data-seat="${i}" style="left:${p.x}%;top:${p.y}%" aria-label="${who ? who.name + ', online' : 'Open seat'}. Tap to change.">
            <span class="nm">${who ? esc(who.name) : 'Open seat'}</span><span class="sub">${who ? 'Online friend' : 'Waiting for a friend'}</span></button>`;
        }
        return `<button class="chair" data-seat="${i}" style="left:${p.x}%;top:${p.y}%" aria-label="${s.name}, computer, ${LEVEL_NAME[s.level]}. Tap to change.">
            <span class="nm">${s.name}</span><span class="sub">Computer &middot; ${LEVEL_NAME[s.level]}</span></button>`;
      })
      .join('');
    const [lo, hi] = meta.players;
    const countRow =
      lo === hi
        ? ''
        : `<div class="opt"><span>Players</span><span class="vals">${range(lo, hi)
            .map((k) => `<button data-count="${k}" aria-pressed="${k === n}">${k}</button>`)
            .join('')}</span></div>`;
    const opts = (engine.options || [])
      .map(
        (o) =>
          `<div class="opt"><span>${o.label}</span><span class="vals">${o.values
            .map((x) => `<button data-opt="${o.key}" data-val='${JSON.stringify(x.value)}' aria-pressed="${cfg.options[o.key] === x.value}">${x.label}</button>`)
            .join('')}</span></div>`
      )
      .join('');
    stageEl.innerHTML = `
      <div class="table-wrap"><div class="table"><div class="felt"><div class="felt-mark">${v.name}</div></div></div>
        <div class="seats" style="pointer-events:auto">${chairs}</div>
      </div>
      <div class="topline"><button class="chip-btn" id="back">&larr; The games</button></div>
      <section class="tent" aria-label="House rules">
        <h2>${meta.name}</h2>
        <p class="kicker">${hosting() ? 'Online table &middot; tap a chair to open it for a friend' : 'House rules &middot; tap a chair to change a computer player'}</p>
        ${hosting() ? `<div class="opt" style="display:block;text-align:center"><span class="room-code">${C52.Online.state.code || '·····'}</span><br><small>Share this code. Friends choose <b>Join a table</b> and type it in. Any chair still empty when you deal is played by the computer.</small></div>` : ''}
        <div class="opt"><span>Your name</span><input type="text" id="yourname" maxlength="16" value="${esc(cfg.seats[0].name === 'You' ? '' : cfg.seats[0].name)}" placeholder="You"></div>
        ${countRow}${opts}
        <div class="slip-actions"><button class="btn primary" id="deal">Deal</button>${meta.players[1] > 1 && !hosting() ? '<button class="btn ghost" id="host-online">Host online table</button>' : ''}</div>
      </section>`;

    stageEl.querySelector('#back').onclick = () => {
      C52.Sound.play('brush');
      if (hosting()) C52.Online.hostLeave();
      C52.UI.show('menu', { brief: cfg.game });
    };
    const hostBtn = stageEl.querySelector('#host-online');
    if (hostBtn) {
      hostBtn.onclick = () => {
        C52.Sound.play('latch');
        // Open every computer chair to friends to start with; the host can switch any back.
        cfg.seats.forEach((s, i) => i > 0 && i < cfg.count && (s.kind = 'open'));
        C52.Online.host(cfg, () => render());
        render();
      };
    }
    stageEl.querySelectorAll('.chair').forEach((b) => {
      b.onclick = () => {
        const i = Number(b.dataset.seat);
        const s = cfg.seats[i];
        C52.Sound.play('latch');
        if (hosting()) {
          // Easy → Medium → Hard → Open seat → Easy (a seat a friend has taken stays theirs).
          if (C52.Online.chairInfo(i)) return;
          if (s.kind === 'open') {
            s.kind = 'cpu';
            s.level = 'easy';
          } else if (s.level === 'hard') s.kind = 'open';
          else s.level = LEVELS[LEVELS.indexOf(s.level) + 1];
          C52.Online.lobbyChanged();
        } else s.level = LEVELS[(LEVELS.indexOf(s.level) + 1) % LEVELS.length];
        save();
        render();
      };
    });
    stageEl.querySelectorAll('[data-count]').forEach((b) => {
      b.onclick = () => {
        cfg.count = Number(b.dataset.count);
        C52.Sound.play('latch');
        save();
        render();
      };
    });
    stageEl.querySelectorAll('[data-opt]').forEach((b) => {
      b.onclick = () => {
        cfg.options[b.dataset.opt] = JSON.parse(b.dataset.val);
        C52.Sound.play('latch');
        save();
        render();
      };
    });
    const nameEl = stageEl.querySelector('#yourname');
    nameEl.onchange = () => {
      const name = nameEl.value.trim().slice(0, 16);
      C52.Prefs.set({ name });
      cfg.seats[0].name = name || 'You';
    };
    stageEl.querySelector('#deal').onclick = () => {
      nameEl.onchange();
      save();
      const params = {
        game: cfg.game,
        options: Object.assign({}, cfg.options),
        seats: cfg.seats.slice(0, cfg.count).map((s) => Object.assign({}, s)),
      };
      if (hosting()) return C52.Online.start(params);
      params.seats.forEach((s) => s.kind === 'open' && (s.kind = 'cpu'));
      C52.UI.show('table', params);
    };
    stageEl.querySelector('#deal').focus();
  }

  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  function refresh() {
    if (cfg) render();
  }

  C52.Screens.seating = { enter, refresh };
  C52.Seating = { CPU_NAMES, LEVEL_NAME };
})(window);
