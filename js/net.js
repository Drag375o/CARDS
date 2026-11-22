/* 52 Cards — network transport (PeerJS over WebRTC).
 *
 * Browsers connect directly; the public PeerJS server only introduces
 * them. The host registers the peer id PREFIX + room code. All transport
 * details live here, so another transport could replace this file without
 * touching the games.
 *
 *   Net.openRoom(code | null, handlers)   host: { onOpen(code), onVisitor(conn), onData(conn, msg), onLeft(conn, {bye}), onError(text) }
 *   Net.join(code, handlers)              guest: { onOpen(), onData(msg), onLeft({reason}), onError(text) }
 *   Net.send(conn, msg) / Net.sendHost(msg) / Net.close()
 */
(function (root) {
  'use strict';
  const C52 = root.C52;

  const PEERJS = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
  const PREFIX = 'cards52-room-';
  const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O
  const CODE_LENGTH = 5;
  const CONNECT_TIMEOUT = 15000;
  const PING_EVERY = 2000;
  const DROP_AFTER = 10000;

  const FRIENDLY = {
    'peer-unavailable': 'Room not found. Check the code, or ask your friend to create a new room.',
    network: 'Lost contact with the connection server. Check your internet connection.',
    'server-error': "The connection server isn't responding. Try again in a moment.",
    'browser-incompatible': "This browser can't make direct connections. Try Chrome, Edge, Firefox or Safari.",
    'socket-error': 'Lost contact with the connection server.',
    'socket-closed': 'Lost contact with the connection server.',
  };
  const friendly = (e) => FRIENDLY[e && e.type] || (e && e.message) || 'Something went wrong with the connection.';

  const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, CODE_LENGTH);
  function randomCode() {
    const buf = new Uint32Array(CODE_LENGTH);
    (root.crypto || {}).getRandomValues ? root.crypto.getRandomValues(buf) : buf.forEach((_, i) => (buf[i] = Math.random() * 1e9));
    return Array.from(buf, (n) => LETTERS[n % LETTERS.length]).join('');
  }
  /** Seat pass: 12 random bytes as hex. */
  function makeToken() {
    const b = new Uint8Array(12);
    root.crypto.getRandomValues(b);
    return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  }

  /* ---------- loading PeerJS on demand ---------- */

  let loading = null;
  function loadPeer() {
    if (root.Peer) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const s = root.document.createElement('script');
      s.src = PEERJS;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        loading = null;
        reject(new Error("Couldn't load online play. Check your internet connection."));
      };
      root.document.head.appendChild(s);
    });
    return loading;
  }

  /* ---------- heartbeat ---------- */

  function watch(conn, onDrop) {
    conn._lastSeen = Date.now();
    conn._ping = setInterval(() => {
      if (Date.now() - conn._lastSeen > DROP_AFTER) {
        clearInterval(conn._ping);
        try {
          conn.close();
        } catch (e) {
          /* already closed */
        }
        onDrop();
        return;
      }
      try {
        conn.send({ t: 'ping' });
      } catch (e) {
        /* the drop timer will catch it */
      }
    }, PING_EVERY);
  }
  const unwatch = (conn) => conn && clearInterval(conn._ping);

  /* ---------- host ---------- */

  const H = { peer: null, conns: new Set(), handlers: null };

  function openRoom(code, handlers, resume) {
    H.handlers = handlers;
    return loadPeer().then(
      () => {
        let attempt = 0;
        const tryCode = (c) => {
          const peer = new root.Peer(PREFIX + c);
          peer.on('open', () => {
            H.peer = peer;
            handlers.onOpen(c);
          });
          peer.on('connection', (conn) => hostConn(conn));
          peer.on('disconnected', () => {
            try {
              peer.reconnect();
            } catch (e) {
              /* will retry on next disconnect */
            }
          });
          peer.on('error', (e) => {
            if (e.type === 'unavailable-id' && attempt < 12) {
              attempt++;
              peer.destroy();
              // Resuming: keep trying the saved code for a while, then give up on it.
              const again = resume && attempt <= 6 ? c : randomCode();
              setTimeout(() => tryCode(again), resume && attempt <= 6 ? 2000 : 0);
              return;
            }
            handlers.onError(friendly(e));
          });
        };
        tryCode(cleanCode(code) || randomCode());
      },
      (err) => handlers.onError(err.message)
    );
  }

  function hostConn(conn) {
    conn.on('open', () => {
      H.conns.add(conn);
      H.handlers.onVisitor && H.handlers.onVisitor(conn);
    });
    conn.on('data', (msg) => {
      conn._lastSeen = Date.now();
      if (!msg || msg.t === 'ping') return;
      if (msg.t === 'bye') conn._bye = true;
      H.handlers.onData(conn, msg);
    });
    conn.on('close', () => left(conn));
    conn.on('error', () => left(conn));
  }

  function left(conn) {
    if (conn._gone) return;
    conn._gone = true;
    unwatch(conn);
    H.conns.delete(conn);
    if (conn._accepted) H.handlers.onLeft(conn, { bye: !!conn._bye });
  }

  /** Accept a visitor: from now on it is heartbeat-watched and can raise onLeft. */
  function accept(conn) {
    if (conn._accepted) return;
    conn._accepted = true;
    watch(conn, () => left(conn));
  }

  /** Turn a visitor away with a message, then close. */
  function reject(conn, msg) {
    send(conn, msg);
    setTimeout(() => {
      try {
        conn.close();
      } catch (e) {
        /* gone */
      }
    }, 400);
  }

  function send(conn, msg) {
    try {
      if (conn && conn.open) conn.send(msg);
    } catch (e) {
      /* the heartbeat handles broken connections */
    }
  }

  /* ---------- guest ---------- */

  const G = { peer: null, conn: null, handlers: null, timer: 0 };

  function join(code, handlers) {
    G.handlers = handlers;
    const c = cleanCode(code);
    return loadPeer().then(
      () => {
        if (!G.peer || G.peer.destroyed) {
          G.peer = new root.Peer();
          G.peer.on('error', (e) => {
            clearTimeout(G.timer);
            handlers.onError(friendly(e));
          });
        }
        const go = () => {
          const conn = G.peer.connect(PREFIX + c, { reliable: true, serialization: 'json' });
          G.conn = conn;
          G.timer = setTimeout(() => {
            if (!conn.open) {
              try {
                conn.close();
              } catch (e) {
                /* gone */
              }
              handlers.onError("Couldn't reach that room. Check the code and try again.");
            }
          }, CONNECT_TIMEOUT);
          conn.on('open', () => {
            clearTimeout(G.timer);
            watch(conn, () => guestLeft('lost'));
            handlers.onOpen();
          });
          conn.on('data', (msg) => {
            conn._lastSeen = Date.now();
            if (!msg || msg.t === 'ping') return;
            handlers.onData(msg);
          });
          conn.on('close', () => guestLeft('lost'));
        };
        if (G.peer.open) go();
        else G.peer.on('open', go);
      },
      (err) => handlers.onError(err.message)
    );
  }

  function guestLeft(reason) {
    const conn = G.conn;
    if (!conn || conn._gone) return;
    conn._gone = true;
    unwatch(conn);
    G.handlers && G.handlers.onLeft({ reason });
  }

  const sendHost = (msg) => send(G.conn, msg);

  /** Close everything, after `delay` ms so a goodbye message can get out. */
  function close(delay) {
    setTimeout(() => {
      H.conns.forEach((c) => {
        unwatch(c);
        c._gone = true;
        try {
          c.close();
        } catch (e) {
          /* gone */
        }
      });
      H.conns.clear();
      if (H.peer) H.peer.destroy();
      H.peer = null;
      if (G.conn) {
        G.conn._gone = true;
        unwatch(G.conn);
        try {
          G.conn.close();
        } catch (e) {
          /* gone */
        }
      }
      G.conn = null;
      if (G.peer) G.peer.destroy();
      G.peer = null;
    }, delay || 0);
  }

  /** Drop just the guest connection (keeping the peer) before a reconnect attempt. */
  function dropGuestConn() {
    if (G.conn) {
      G.conn._gone = true;
      unwatch(G.conn);
      try {
        G.conn.close();
      } catch (e) {
        /* gone */
      }
    }
    G.conn = null;
  }

  C52.Net = { openRoom, accept, reject, send, join, sendHost, close, dropGuestConn, makeToken, cleanCode, CODE_LENGTH };
})(window);
