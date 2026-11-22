/* 52 Cards — online tables (host-authoritative), after Auction XI.
 *
 * Host: opens a room from the seating screen. Chairs can be left open for
 * friends; any chair still open when the host deals is played by a
 * computer. The host's browser runs the game and sends each guest only
 * that guest's view.
 *
 * Messages
 *   guest → host   hello {name, token} · act {action} · bye
 *   host → guest   welcome {seat, game} · lobby {…} · state {seat, view, actions, seats}
 *                  full · reserved {name} · closed · away
 *
 * Leaving and coming back
 *   - A guest who leaves on purpose is replaced by a computer at once and
 *     their seat is opened to anyone with the code.
 *   - A guest who loses connection has 60 seconds to come back before a
 *     computer stands in. Either way, their seat pass gets the seat back.
 *   - The host can let someone else take a waiting seat.
 *   - The host can resume a saved game for 12 hours; guests can rejoin.
 */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const Net = () => C52.Net;

  const TAKEOVER_SECONDS = 60;
  const RECONNECT_GAP = 3000;
  const RECONNECT_TRIES = 40;
  const SAVE_HOURS = 12;
  const KEY_HOST = '52cards:hosted-game';
  const KEY_GUEST = '52cards:joined-room';

  const O = {
    role: null, // 'host' | 'guest' | null
    code: '',
    game: null,
    // host
    cfg: null, // seating config while in the lobby
    seats: null, // seat descriptors once dealt
    guests: [], // { token, name, conn, seat, connected, countdown, timer, seatOpen }
    started: false,
    // guest
    token: '',
    seat: null,
    name: '',
    tries: 0,
    reconnecting: false,
  };

  /* ---------- storage ---------- */

  function save(key, data) {
    try {
      root.localStorage.setItem(key, JSON.stringify(Object.assign({ savedAt: Date.now() }, data)));
    } catch (e) {
      /* storage unavailable */
    }
  }
  function load(key) {
    try {
      const d = JSON.parse(root.localStorage.getItem(key) || 'null');
      if (!d || Date.now() - d.savedAt > SAVE_HOURS * 3600 * 1000) return null;
      return d;
    } catch (e) {
      return null;
    }
  }
  function forget(key) {
    try {
      root.localStorage.removeItem(key);
    } catch (e) {
      /* storage unavailable */
    }
  }

  const notice = (html, opts) => C52.Scene.notice(html, opts);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  /* =================================================================
   *  HOST
   * ================================================================= */

  /** Open a room for the seating screen's config. Chairs marked 'open' wait for friends. */
  function host(cfg, onReady) {
    O.role = 'host';
    O.game = cfg.game;
    O.cfg = cfg;
    O.started = false;
    O.guests = [];
    notice('Opening a room…');
    Net().openRoom(null, hostHandlers(onReady));
  }

  function hostHandlers(onReady, resumed) {
    return {
      onOpen(code) {
        const old = O.code;
        O.code = code;
        if (resumed && old && old !== code) notice(`Room ${old} was still busy, so your game reopened as room <b>${code}</b>. Send your friends the new code.`, { ms: 12000 });
        else if (resumed) notice(`Room <b>${code}</b> is open again. Your friends can rejoin.`, { ms: 6000 });
        else C52.Scene.clearNotice();
        if (onReady) onReady(code);
        lobbyChanged();
      },
      onData: hostData,
      onLeft: hostLeft,
      onError(text) {
        notice(esc(text), { ms: 8000 });
      },
    };
  }

  function guestFor(conn) {
    return O.guests.find((g) => g.conn === conn);
  }

  function hostData(conn, msg) {
    if (msg.t === 'hello') return hello(conn, msg);
    const g = guestFor(conn);
    if (!g) return;
    if (msg.t === 'act' && O.started) {
      const s = O.seats[g.seat];
      if (s && !s.standIn) C52.Table.Host.act(g.seat, msg.action);
    }
  }

  function hello(conn, msg) {
    const token = String(msg.token || '');
    const name = String(msg.name || 'Guest').slice(0, 16) || 'Guest';
    let g = O.guests.find((x) => x.token === token);
    if (!O.started) {
      if (g) {
        // Same device again: the new connection replaces the old one.
        g.conn = conn;
        g.name = name;
        g.connected = true;
      } else {
        const seat = openChairs().find((i) => !O.guests.some((x) => x.seat === i));
        if (seat == null) return Net().reject(conn, { t: 'full' });
        g = { token, name, conn, seat, connected: true };
        O.guests.push(g);
        notice(`${esc(name)} joins the table.`, { ms: 3500 });
      }
      Net().accept(conn);
      Net().send(conn, { t: 'welcome', seat: g.seat, game: O.game, code: O.code });
      lobbyChanged();
      return;
    }
    // Game under way.
    if (!g) {
      const open = O.guests.find((x) => x.seatOpen && !x.connected);
      if (!open) {
        const holder = O.guests.find((x) => !x.connected) || O.guests[0];
        return Net().reject(conn, { t: 'reserved', name: holder ? holder.name : '' });
      }
      const was = open.name;
      open.token = token;
      open.name = name;
      g = open;
      O.seats[g.seat].name = name;
      C52.Table.Host.st.names[g.seat] = name;
      notice(`${esc(name)} joined and takes over ${esc(was)}'s seat.`, { ms: 4000 });
    } else notice(`${esc(name)} is back.`, { ms: 4000 });
    g.conn = conn;
    g.connected = true;
    g.seatOpen = false;
    clearInterval(g.timer);
    g.countdown = null;
    O.seats[g.seat].standIn = false;
    O.seats[g.seat].offline = false;
    O.seats[g.seat].kind = 'remote';
    Net().accept(conn);
    Net().send(conn, { t: 'welcome', seat: g.seat, game: O.game, code: O.code });
    C52.Table.Host.changed();
  }

  function hostLeft(conn, info) {
    const g = guestFor(conn);
    if (!g) return;
    g.connected = false;
    if (!O.started) {
      O.guests = O.guests.filter((x) => x !== g);
      notice(`${esc(g.name)} left the table.`, { ms: 3500 });
      lobbyChanged();
      return;
    }
    const s = O.seats[g.seat];
    s.offline = true;
    const over = C52.Table.Host.st && C52.Table.Host.st.phase === 'gameover';
    if (info.bye) {
      s.standIn = true;
      g.seatOpen = true;
      notice(`${esc(g.name)} left the game, so the computer is playing for them. Anyone with code <b>${O.code}</b> can take the seat.`, { ms: 9000 });
      C52.Table.Host.changed();
    } else if (s.standIn || over) {
      s.standIn = true;
      notice(`${esc(g.name)} left. They can rejoin with code <b>${O.code}</b>; until then the computer plays for them.`, { ms: 9000 });
      C52.Table.Host.changed();
    } else startCountdown(g);
    saveHost();
  }

  function startCountdown(g) {
    g.countdown = TAKEOVER_SECONDS;
    const tick = () => {
      if (g.connected) return clearInterval(g.timer);
      if (g.countdown <= 0) {
        clearInterval(g.timer);
        g.countdown = null;
        O.seats[g.seat].standIn = true;
        notice(`The computer is now playing for ${esc(g.name)}. If they rejoin with code <b>${O.code}</b>, they get their seat back.`, { ms: 8000 });
        C52.Table.Host.changed();
        return;
      }
      notice(
        `<b>${esc(g.name)}</b> lost connection. The computer takes over in <b>${g.countdown}</b>s unless they rejoin with code <b>${O.code}</b>.` +
          (g.seatOpen ? ` <span class="dim">Seat open to anyone.</span>` : ` <button class="notice-btn" data-open-seat="${g.seat}">Let someone else join</button>`),
        { sticky: true, id: 'countdown-' + g.seat }
      );
      g.countdown -= 1;
    };
    clearInterval(g.timer);
    tick();
    g.timer = setInterval(tick, 1000);
  }

  /** The host lets anyone with the code take a waiting seat. */
  function openSeat(seat) {
    const g = O.guests.find((x) => x.seat === seat);
    if (!g) return;
    g.seatOpen = true;
    notice(`Seat ${seat + 1} is open. Anyone with code <b>${O.code}</b> can join and take over ${esc(g.name)}'s seat.`, { ms: 6000 });
  }

  /** Chairs left open for friends in the lobby. */
  function openChairs() {
    if (!O.cfg) return [];
    const out = [];
    for (let i = 1; i < O.cfg.count; i++) if (O.cfg.seats[i].kind === 'open') out.push(i);
    return out;
  }

  function lobbyChanged() {
    if (O.role !== 'host' || O.started) return;
    const seats = O.cfg.seats.slice(0, O.cfg.count).map((s, i) => {
      const g = O.guests.find((x) => x.seat === i);
      return { name: g ? g.name : s.kind === 'open' ? 'Open seat' : s.name, kind: g ? 'remote' : s.kind, level: s.level };
    });
    O.guests.forEach((g) => Net().send(g.conn, { t: 'lobby', game: O.game, code: O.code, seats, you: g.seat, host: O.cfg.seats[0].name }));
    if (C52.UI.current() === 'seating') C52.UI.refresh();
  }

  /** Lobby label for a chair (used by the seating screen). */
  function chairInfo(i) {
    const g = O.guests.find((x) => x.seat === i);
    if (g) return { name: g.name, sub: 'Online friend', joined: true };
    return null;
  }

  /** Deal: guests take their chairs, every other empty chair gets a computer. */
  function start(params) {
    O.started = true;
    O.seats = params.seats.map((s, i) => {
      const g = O.guests.find((x) => x.seat === i);
      if (g) return { kind: 'remote', name: g.name, level: 'medium' };
      if (s.kind === 'open') return { kind: 'cpu', level: 'medium', name: C52.Seating.CPU_NAMES[(i - 1) % 9] };
      return s;
    });
    params.seats = O.seats;
    params.online = true;
    C52.UI.show('table', params);
  }

  /** Called by the table's host after every change: send each guest their view, and save. */
  function publish() {
    if (O.role !== 'host' || !O.started) return;
    const H = C52.Table.Host;
    const meta = O.seats.map((s) => ({ kind: s.kind, level: s.level, standIn: !!s.standIn, offline: !!s.offline, name: s.name }));
    O.guests.forEach((g) => {
      if (!g.connected) return;
      const { view, actions } = H.viewFor(g.seat);
      Net().send(g.conn, { t: 'state', seat: g.seat, view, actions, seats: meta });
    });
    saveHost();
  }

  function saveHost() {
    const H = C52.Table.Host;
    if (O.role !== 'host' || !O.started || !H.st) return;
    save(KEY_HOST, {
      code: O.code,
      game: O.game,
      params: { game: O.game, options: H.options, seats: O.seats.map((s) => ({ kind: s.kind, level: s.level, name: s.name })) },
      st: H.st,
      guests: O.guests.map((g) => ({ token: g.token, name: g.name, seat: g.seat, seatOpen: !!g.seatOpen })),
      round: H.st.round,
    });
  }

  /** Re-open a saved hosted game. Every remote seat starts its 60-second countdown. */
  function resume(saved) {
    O.role = 'host';
    O.game = saved.game;
    O.code = saved.code;
    O.started = true;
    O.cfg = null;
    O.seats = saved.params.seats;
    O.guests = saved.guests.map((g) => Object.assign({}, g, { conn: null, connected: false }));
    notice(`Reopening room <b>${saved.code}</b>…`, { sticky: true, id: 'reopen' });
    Net().openRoom(saved.code, hostHandlers(null, true), true);
    C52.UI.show('table', Object.assign({}, saved.params, { online: true, restore: saved.st }));
    O.guests.forEach((g) => {
      if (O.seats[g.seat].kind === 'remote') {
        O.seats[g.seat].offline = true;
        startCountdown(g);
      }
    });
  }

  /** Host plays again with the same seats. */
  function restart() {
    const H = C52.Table.Host;
    H.start(O.game, O.seats, H.options);
  }

  function hostLeave() {
    O.guests.forEach((g) => g.conn && Net().send(g.conn, { t: 'closed' }));
    O.guests.forEach((g) => clearInterval(g.timer));
    forget(KEY_HOST);
    Net().close(300);
    reset();
  }

  /* =================================================================
   *  GUEST
   * ================================================================= */

  function join(code, name, onFail) {
    const saved = load(KEY_GUEST);
    const c = Net().cleanCode(code);
    O.role = 'guest';
    O.code = c;
    O.name = name;
    // Reuse the seat pass only for the same room.
    O.token = saved && saved.code === c ? saved.token : Net().makeToken();
    O.tries = 0;
    connectGuest(onFail);
  }

  function connectGuest(onFail) {
    Net().join(O.code, {
      onOpen() {
        O.reconnecting = false;
        O.tries = 0;
        save(KEY_GUEST, { code: O.code, token: O.token, name: O.name });
        Net().sendHost({ t: 'hello', name: O.name, token: O.token });
      },
      onData: guestData,
      onLeft() {
        if (O.role === 'guest') reconnect('Lost connection to the room.');
      },
      onError(text) {
        if (O.reconnecting) return; // keep trying quietly
        if (onFail) onFail(text);
        else notice(esc(text), { ms: 8000 });
      },
    });
  }

  function guestData(msg) {
    if (msg.t === 'welcome') {
      O.seat = msg.seat;
      O.game = msg.game;
      if (C52.UI.current() !== 'table') C52.UI.show('lobby', { game: msg.game, code: O.code });
      return;
    }
    if (msg.t === 'lobby') {
      O.lobby = msg;
      if (C52.UI.current() === 'lobby') C52.UI.refresh();
      return;
    }
    if (msg.t === 'state') {
      save(KEY_GUEST, { code: O.code, token: O.token, name: O.name });
      if (C52.UI.current() !== 'table' || C52.Table.R.game !== msg.view.game) {
        C52.UI.show('table', { game: msg.view.game, guest: { seat: msg.seat }, seats: msg.seats });
      }
      C52.Table.R.seatsCfg = msg.seats;
      C52.Table.receive(msg.view, msg.actions);
      return;
    }
    if (msg.t === 'full' || msg.t === 'reserved') {
      forget(KEY_GUEST);
      const text =
        msg.t === 'full'
          ? 'That room is full.'
          : `That game is already under way, and your seat isn't saved on this device. If you were playing on another device or browser, ask the room creator to tap "Let someone else join".`;
      reset();
      Net().close(0);
      C52.UI.show('menu', {});
      notice(esc(text), { ms: 10000 });
      return;
    }
    if (msg.t === 'closed') {
      forget(KEY_GUEST);
      reset();
      Net().close(0);
      C52.UI.show('menu', {});
      notice('The room creator left, so the room is closed.', { ms: 8000 });
      return;
    }
    if (msg.t === 'away') reconnect('The room creator dropped out.');
  }

  function reconnect(why) {
    if (O.reconnecting) return;
    O.reconnecting = true;
    O.tries = 0;
    Net().dropGuestConn();
    const attempt = () => {
      if (O.role !== 'guest' || !O.reconnecting) return;
      O.tries += 1;
      if (O.tries > RECONNECT_TRIES) {
        O.reconnecting = false;
        notice(`Couldn't reconnect to room <b>${O.code}</b>. You can rejoin from the games screen once it's back.`, { ms: 12000 });
        return;
      }
      notice(`${esc(why)} Reconnecting…`, { sticky: true, id: 'reconnect' });
      Net().dropGuestConn();
      connectGuest();
      setTimeout(() => {
        if (O.reconnecting) attempt();
        else C52.Scene.clearNotice('reconnect');
      }, RECONNECT_GAP);
    };
    setTimeout(attempt, 1000);
  }

  function guestSend(action) {
    Net().sendHost({ t: 'act', action });
  }

  function guestLeave() {
    Net().sendHost({ t: 'bye' });
    forget(KEY_GUEST);
    Net().close(300);
    reset();
  }

  function reset() {
    O.guests.forEach((g) => clearInterval(g.timer));
    Object.assign(O, { role: null, code: '', game: null, cfg: null, seats: null, guests: [], started: false, seat: null, reconnecting: false, lobby: null });
    C52.Scene.clearNotice();
  }

  // Tell guests the host is going (they'll start reconnecting rather than waiting 10 s).
  root.addEventListener('beforeunload', () => {
    if (O.role === 'host') O.guests.forEach((g) => g.conn && Net().send(g.conn, { t: 'away' }));
  });

  // "Let someone else join" buttons inside notices.
  root.document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open-seat]');
    if (b) openSeat(Number(b.dataset.openSeat));
  });

  /* =================================================================
   *  Guest lobby screen
   * ================================================================= */

  C52.Screens.lobby = {
    enter(stage, params) {
      this.stage = stage;
      this.params = params;
      this.render();
    },
    refresh() {
      this.render();
    },
    render() {
      const l = O.lobby;
      const meta = C52.Games.meta(O.game || this.params.game);
      const v = C52.Venues.get(C52.Prefs.get().venue);
      const seats = l
        ? l.seats.map((s, i) => `<div class="opt"><span>${i === l.you ? '<b>You</b>' : esc(s.name)}</span><span>${i === 0 ? 'Host' : s.kind === 'remote' ? 'Online' : s.kind === 'open' ? 'Waiting…' : 'Computer'}</span></div>`).join('')
        : '<p class="slip-line">Joining…</p>';
      this.stage.innerHTML = `
        <div class="table-wrap"><div class="table"><div class="felt"><div class="felt-mark">${v.name}</div></div></div></div>
        <div class="topline"><button class="chip-btn" id="lobby-leave">&larr; Leave</button></div>
        <section class="tent"><h2>${meta ? meta.name : 'Online table'}</h2>
          <p class="kicker">Room ${O.code} &middot; waiting for the host to deal</p>${seats}
          <p class="slip-line" style="margin-top:12px">Empty chairs will be played by the computer.</p></section>`;
      this.stage.querySelector('#lobby-leave').onclick = () => {
        guestLeave();
        C52.UI.show('menu', {});
      };
    },
  };

  C52.Online = {
    get state() {
      return O;
    },
    host, start, publish, chairInfo, lobbyChanged, restart, hostLeave, resume, openSeat,
    join, guestSend, guestLeave,
    savedHost: () => load(KEY_HOST),
    savedGuest: () => load(KEY_GUEST),
    forgetHost: () => forget(KEY_HOST),
    forgetGuest: () => forget(KEY_GUEST),
    isHost: () => O.role === 'host',
    isGuest: () => O.role === 'guest',
  };
})(window);
