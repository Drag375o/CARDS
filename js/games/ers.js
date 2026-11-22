/* 52 Cards — Egyptian Rat Screw (game 10). 2–6 players, real time.
 *
 * All cards are dealt face down. In turn, players flip the top card of
 * their stack onto the centre pile. A face card or ace challenges the next
 * player to answer with another face card or ace within 1 (J), 2 (Q),
 * 3 (K) or 4 (A) cards; a new face card passes the challenge on. If the
 * challenge runs out, the challenger takes the pile.
 *
 * Anyone may slap the pile on a double (two of a rank in a row) or a
 * sandwich (two of a rank with one card between): the first correct slap
 * takes the pile. A wrong slap costs one card, put under the pile. Players
 * with no cards may slap back in. Collect all 52 to win.
 */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const K = C52.Cards;
  const E = C52.Engine;

  const CHANCES = { J: 1, Q: 2, K: 3, A: 4 };
  const MAX_FLIPS = 4000;
  const options = [];

  function setup(cfg, rng) {
    const st = E.base('ers', cfg);
    const deck = K.shuffle(K.makeDeck(), rng);
    st.decks = st.names.map(() => []);
    deck.forEach((c, i) => st.decks[i % cfg.n].push(c));
    st.pile = [];
    st.challenge = null; // { by, left }
    st.pendingWin = null;
    st.flips = 0;
    st.dealer = Math.floor(rng() * cfg.n);
    st.turn = E.next(st, st.dealer);
    st.phase = 'play';
    st.round = 1;
    E.emit(st, { text: `The deck is dealt out face down. ${E.nm(st, st.turn)} flips first.`, sound: 'deal', count: 52 });
    return st;
  }

  function slapKind(pile) {
    const n = pile.length;
    if (n >= 2 && pile[n - 1][0] === pile[n - 2][0]) return 'double';
    if (n >= 3 && pile[n - 1][0] === pile[n - 3][0]) return 'sandwich';
    return null;
  }

  function actions(st, seat) {
    if (st.phase !== 'play') return [];
    const out = [];
    if (st.pendingWin === seat) out.push({ type: 'collect' });
    else if (st.pendingWin === null && seat === st.turn && st.decks[seat].length) out.push({ type: 'flip' });
    if (st.pile.length) out.push({ type: 'slap' });
    return out;
  }

  const holding = (st) => st.decks.map((d, i) => (d.length ? i : -1)).filter((i) => i >= 0);
  function nextWithCards(st, seat) {
    let s = seat;
    for (let i = 0; i < st.n; i++) {
      s = E.next(st, s);
      if (st.decks[s].length) return s;
    }
    return -1;
  }

  function takePile(st, seat, how) {
    const n = st.pile.length;
    st.decks[seat].unshift(...st.pile); // to the bottom of their stack
    st.pile = [];
    st.challenge = null;
    st.pendingWin = null;
    st.turn = seat;
    E.emit(st, { text: `${E.nm(st, seat)} ${how} and takes ${n} cards.`, sound: how.startsWith('slaps') ? 'slap' : 'sweep', seat, count: 4 });
    checkEnd(st);
  }

  function checkEnd(st) {
    const h = holding(st);
    if (h.length === 1 && !st.pile.length && st.pendingWin === null) {
      st.phase = 'gameover';
      st.winners = h;
      st.turn = null;
      finish(st, `${E.nm(st, h[0])} holds all 52 cards`);
    } else if (st.flips >= MAX_FLIPS) {
      const counts = st.decks.map((d) => d.length);
      const hi = Math.max(...counts);
      st.phase = 'gameover';
      st.winners = counts.map((c, i) => (c === hi ? i : -1)).filter((i) => i >= 0);
      st.turn = null;
      finish(st, 'Time is called: the biggest stack wins');
    }
  }

  function finish(st, title) {
    st.scores = st.decks.map((d) => d.length);
    st.summary = { title, note: 'Slap doubles and sandwiches, win face-card challenges.', head: ['', 'Cards'], rows: st.names.map((nm, i) => [nm, st.decks[i].length]) };
    E.emit(st, { text: title + '.', sting: 'big' });
  }

  function apply(st, seat, action) {
    const a = E.legal(actions(st, seat), action);
    const name = E.nm(st, seat);
    if (a.type === 'slap') {
      const kind = slapKind(st.pile);
      if (kind) {
        takePile(st, seat, `slaps the ${kind}`);
        return st;
      }
      // Wrong slap: burn a card under the pile.
      if (st.decks[seat].length) {
        st.pile.unshift(st.decks[seat].pop());
        E.emit(st, { text: `${name} slaps wrongly and burns a card.`, sound: 'slap', seat });
      } else E.emit(st, { text: `${name} slaps wrongly.`, sound: 'slap', seat });
      if (!st.decks[seat].length && seat === st.turn && st.pendingWin === null) moveOn(st, seat);
      return st;
    }
    if (a.type === 'collect') {
      takePile(st, seat, 'wins the challenge');
      return st;
    }
    // flip
    const c = st.decks[seat].pop();
    st.pile.push(c);
    st.flips += 1;
    const chances = CHANCES[c[0]];
    let text = `${name} flips the ${K.name(c)}.`;
    if (chances) {
      st.challenge = { by: seat, left: chances };
      const nxt = nextWithCards(st, seat);
      if (nxt < 0 || nxt === seat) {
        st.pendingWin = seat;
        st.turn = null;
      } else {
        st.turn = nxt;
        text = `${name} flips the ${K.name(c)}. ${E.nm(st, nxt)} has ${chances} chance${chances > 1 ? 's' : ''}.`;
      }
    } else if (st.challenge) {
      st.challenge.left -= 1;
      if (st.challenge.left <= 0) {
        st.pendingWin = st.challenge.by;
        st.turn = null;
      } else if (!st.decks[seat].length) moveOn(st, seat);
    } else moveOn(st, seat);
    E.emit(st, { text, sound: 'flip', seat, card: c });
    if (st.flips >= MAX_FLIPS) checkEnd(st);
    return st;
  }

  /** Pass the turn on; with nobody left holding cards, the last player to flip takes the pile. */
  function moveOn(st, seat) {
    const nxt = nextWithCards(st, seat);
    if (nxt >= 0) {
      st.turn = nxt;
      return;
    }
    st.pendingWin = st.challenge ? st.challenge.by : seat;
    st.turn = null;
  }

  function view(st, seat) {
    const v = E.baseView(st, seat);
    v.hand = [];
    v.counts = st.decks.map((d) => d.length);
    v.pile = st.pile.slice(-4);
    v.pileCount = st.pile.length;
    v.challenge = st.challenge ? Object.assign({}, st.challenge) : null;
    v.pendingWin = st.pendingWin;
    v.slap = slapKind(st.pile);
    v.dealer = st.dealer;
    v.publicCards = st.pile.slice();
    return v;
  }

  const zones = (st) => [st.pile, ...st.decks];

  C52.Games.register('ers', { options, setup, actions, apply, view, zones, slapKind, realtime: true });
})(typeof window !== 'undefined' ? window : globalThis);
