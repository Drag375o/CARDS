/* 52 Cards — Texas Hold'em (game 01), no-limit. 2–10 players.
 *
 * Two hole cards each, five community cards (flop, turn, river) with a
 * betting round before each and after the river. Make the best five-card
 * hand from any of your seven cards. Fold, check, call, bet/raise (any
 * amount from the minimum raise up to all-in). Side pots form when a
 * player is all-in; equal hands split the pot (odd chip to the first
 * winner left of the button). Heads-up, the button posts the small blind
 * and acts first before the flop. Blinds double every ten hands (optional)
 * so the game reaches an end. The last player with chips wins.
 */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const K = C52.Cards;
  const E = C52.Engine;
  const H = () => C52.Hands;

  const options = [
    { key: 'chips', label: 'Starting chips', default: 1000, values: [{ value: 1000, label: '1,000' }, { value: 2000, label: '2,000' }] },
    { key: 'blinds', label: 'Blinds', default: 10, values: [{ value: 10, label: '10 / 20' }, { value: 25, label: '25 / 50' }] },
    { key: 'rising', label: 'Blinds double every 10 hands', default: true, values: [{ value: true, label: 'Yes' }, { value: false, label: 'No' }] },
  ];

  const STREETS = ['preflop', 'flop', 'turn', 'river'];

  function setup(cfg, rng) {
    const st = E.base('holdem', cfg);
    st.chips = new Array(cfg.n).fill(cfg.options.chips || 1000);
    st.button = Math.floor(rng() * cfg.n);
    st.sb = cfg.options.blinds || 10;
    st.hands = st.names.map(() => []);
    st.board = [];
    st.deck = [];
    st.muck = [];
    st.burned = [];
    newHand(st, rng, true);
    return st;
  }

  const live = (st) => st.chips.map((c, i) => (c > 0 ? i : -1)).filter((i) => i >= 0);
  function nextLive(st, seat, list) {
    const ok = list || live(st);
    for (let k = 1; k <= st.n; k++) {
      const s = (seat + k) % st.n;
      if (ok.includes(s)) return s;
    }
    return seat;
  }

  function newHand(st, rng, first) {
    st.round += 1;
    // Return every card to the deck and shuffle.
    st.deck = K.shuffle(K.makeDeck(), rng);
    st.muck = [];
    st.burned = [];
    st.board = [];
    const players = live(st);
    if (!first) st.button = nextLive(st, st.button, players);
    else if (!players.includes(st.button)) st.button = nextLive(st, st.button, players);
    if (st.options.rising !== false && st.round > 1 && (st.round - 1) % 10 === 0) {
      st.sb *= 2;
      E.emit(st, { text: `The blinds go up to ${st.sb} / ${st.sb * 2}.` });
    }
    st.inHand = st.names.map((_, i) => players.includes(i));
    st.folded = st.names.map((_, i) => !players.includes(i));
    st.allin = st.names.map(() => false);
    st.bet = st.names.map(() => 0);
    st.contrib = st.names.map(() => 0);
    st.acted = st.names.map(() => false);
    st.last = st.names.map(() => '');
    st.hands = st.names.map(() => []);
    st.revealed = null;
    st.summary = null;
    st.street = 'preflop';
    st.phase = 'play';

    const heads = players.length === 2;
    const sbSeat = heads ? st.button : nextLive(st, st.button, players);
    const bbSeat = nextLive(st, sbSeat, players);
    st.sbSeat = sbSeat;
    st.bbSeat = bbSeat;
    post(st, sbSeat, st.sb, 'Small blind');
    post(st, bbSeat, st.sb * 2, 'Big blind');
    st.currentBet = st.sb * 2;
    st.minRaise = st.sb * 2;
    // Deal two cards each, one at a time, starting left of the button.
    for (let r = 0; r < 2; r++) {
      let s = st.button;
      for (let k = 0; k < players.length; k++) {
        s = nextLive(st, s, players);
        st.hands[s].push(st.deck.pop());
      }
    }
    E.emit(st, { text: `Hand ${st.round}. Blinds ${st.sb} / ${st.sb * 2}.`, sound: 'deal', count: players.length * 2 });
    st.turn = firstToAct(st, true);
    if (st.turn === null) runOut(st);
  }

  function post(st, seat, amount, label) {
    const a = Math.min(amount, st.chips[seat]);
    st.chips[seat] -= a;
    st.bet[seat] += a;
    st.contrib[seat] += a;
    if (!st.chips[seat]) st.allin[seat] = true;
    st.last[seat] = `${label} ${a}`;
  }

  const canAct = (st, s) => st.inHand[s] && !st.folded[s] && !st.allin[s];
  const inPlay = (st) => st.names.map((_, i) => i).filter((i) => st.inHand[i] && !st.folded[i]);

  function firstToAct(st, preflop) {
    const start = preflop ? st.bbSeat : st.button;
    for (let k = 1; k <= st.n; k++) {
      const s = (start + k) % st.n;
      if (canAct(st, s)) {
        // Preflop with only one player able to act and nothing to call: no action needed.
        return s;
      }
    }
    return null;
  }

  function actions(st, seat) {
    if (st.phase === 'roundover') return seat === 0 ? [{ type: 'next' }] : [];
    if (st.phase !== 'play' || seat !== st.turn) return [];
    const toCall = st.currentBet - st.bet[seat];
    const out = [];
    if (toCall > 0) out.push({ type: 'fold' });
    if (toCall <= 0) out.push({ type: 'check' });
    else out.push({ type: 'call', amount: Math.min(toCall, st.chips[seat]) });
    const max = st.bet[seat] + st.chips[seat];
    if (max > st.currentBet) {
      const min = Math.min(st.currentBet + st.minRaise, max);
      out.push({ type: 'raise', min, max, choose: 'amount' });
    }
    return out;
  }

  function apply(st, seat, action, rng) {
    if (action.type === 'next') {
      E.legal(actions(st, seat), action);
      newHand(st, rng);
      return st;
    }
    const acts = actions(st, seat);
    const name = E.nm(st, seat);
    if (action.type === 'raise') {
      const r = acts.find((a) => a.type === 'raise');
      const to = Math.floor(action.to);
      if (!r || !(to === r.max || (to >= r.min && to <= r.max))) throw new Error('Illegal raise');
      const add = to - st.bet[seat];
      const raiseBy = to - st.currentBet;
      st.chips[seat] -= add;
      st.bet[seat] = to;
      st.contrib[seat] += add;
      if (raiseBy >= st.minRaise) {
        st.minRaise = raiseBy;
        st.names.forEach((_, i) => (st.acted[i] = false)); // a full raise reopens the betting
      }
      const word = st.currentBet === 0 ? 'bets' : 'raises to';
      st.currentBet = Math.max(st.currentBet, to);
      if (!st.chips[seat]) st.allin[seat] = true;
      st.last[seat] = st.allin[seat] ? `All-in ${to}` : `${word === 'bets' ? 'Bet' : 'Raise'} ${to}`;
      E.emit(st, { text: `${name} ${st.allin[seat] ? 'is all-in for' : word} ${to}.`, sound: st.allin[seat] ? 'allin' : 'push', seat });
    } else {
      const a = E.legal(acts, action);
      if (a.type === 'fold') {
        st.folded[seat] = true;
        st.muck.push(...st.hands[seat]);
        st.hands[seat] = [];
        st.last[seat] = 'Fold';
        E.emit(st, { text: `${name} folds.`, seat, sound: 'draw' });
      } else if (a.type === 'check') {
        st.last[seat] = 'Check';
        E.emit(st, { text: `${name} checks.`, seat });
      } else {
        st.chips[seat] -= a.amount;
        st.bet[seat] += a.amount;
        st.contrib[seat] += a.amount;
        if (!st.chips[seat]) st.allin[seat] = true;
        st.last[seat] = st.allin[seat] ? `All-in ${st.bet[seat]}` : `Call ${st.bet[seat]}`;
        E.emit(st, { text: `${name} ${st.allin[seat] ? 'calls all-in' : 'calls'} ${a.amount}.`, sound: 'chips', seat, count: 3 });
      }
    }
    st.acted[seat] = true;
    progress(st, seat);
    return st;
  }

  function progress(st, seat) {
    const playing = inPlay(st);
    if (playing.length === 1) return award(st, false);
    const pending = playing.filter((s) => canAct(st, s) && (!st.acted[s] || st.bet[s] < st.currentBet));
    if (pending.length) {
      for (let k = 1; k <= st.n; k++) {
        const s = (seat + k) % st.n;
        if (pending.includes(s)) {
          st.turn = s;
          return;
        }
      }
    }
    // Betting round complete.
    const able = playing.filter((s) => canAct(st, s));
    if (st.street === 'river') return award(st, true);
    if (able.length <= 1) return runOut(st);
    nextStreet(st);
  }

  function nextStreet(st) {
    st.street = STREETS[STREETS.indexOf(st.street) + 1];
    st.bet = st.bet.map(() => 0);
    st.acted = st.acted.map(() => false);
    st.currentBet = 0;
    st.minRaise = st.sb * 2;
    st.names.forEach((_, i) => st.last[i] !== 'Fold' && !st.allin[i] && (st.last[i] = ''));
    const n = st.street === 'flop' ? 3 : 1;
    st.burned.push(st.deck.pop());
    const cards = [];
    for (let i = 0; i < n; i++) cards.push(st.deck.pop());
    st.board.push(...cards);
    E.emit(st, { text: `The ${st.street}: ${cards.map(K.label).join(' ')}.`, sound: 'flip' });
    st.turn = firstToAct(st, false);
  }

  /** Everyone left is all-in (or only one can still bet): deal the rest and show down. */
  function runOut(st) {
    while (st.board.length < 5) {
      st.street = STREETS[Math.min(3, STREETS.indexOf(st.street) + 1)];
      st.burned.push(st.deck.pop());
      const n = st.board.length === 0 ? 3 : 1;
      const cards = [];
      for (let i = 0; i < n; i++) cards.push(st.deck.pop());
      st.board.push(...cards);
      E.emit(st, { text: `${st.board.length === 3 ? 'The flop' : st.board.length === 4 ? 'The turn' : 'The river'}: ${cards.map(K.label).join(' ')}.`, sound: 'flip' });
    }
    award(st, true);
  }

  function award(st, showdown) {
    st.turn = null;
    const playing = inPlay(st);
    const results = {};
    const won = st.names.map(() => 0);
    if (!showdown || playing.length === 1) {
      const w = playing[0];
      const pot = st.contrib.reduce((a, b) => a + b, 0);
      won[w] = pot;
      E.emit(st, { text: `${E.nm(st, w)} takes the pot of ${pot}.`, sound: 'rake', seat: w });
    } else {
      playing.forEach((s) => (results[s] = H().best(st.hands[s].concat(st.board))));
      st.revealed = playing.slice();
      // Side pots, from the smallest all-in level up.
      const levels = [...new Set(playing.map((s) => st.contrib[s]))].sort((a, b) => a - b);
      let prev = 0;
      levels.forEach((lvl) => {
        let amount = 0;
        st.contrib.forEach((c) => (amount += Math.max(0, Math.min(c, lvl) - prev)));
        const eligible = playing.filter((s) => st.contrib[s] >= lvl);
        const top = Math.max(...eligible.map((s) => results[s].score));
        const winners = eligible.filter((s) => results[s].score === top);
        const share = Math.floor(amount / winners.length);
        let odd = amount - share * winners.length;
        // Odd chips go to the first winners left of the button.
        const order = winners.slice().sort((a, b) => ((a - st.button + st.n) % st.n) - ((b - st.button + st.n) % st.n));
        order.forEach((s) => {
          won[s] += share + (odd > 0 ? 1 : 0);
          odd--;
        });
        prev = lvl;
      });
      const best = Math.max(...playing.map((s) => results[s].score));
      const champs = playing.filter((s) => results[s].score === best);
      E.emit(st, { text: `${E.andList(champs.map((s) => E.nm(st, s)))} ${champs.length > 1 ? 'split the pot' : 'wins'} with ${results[champs[0]].name.toLowerCase()}.`, sound: 'rake', seat: champs[0], sting: results[champs[0]].cat >= 8 ? 'big' : null });
    }
    st.chips = st.chips.map((c, i) => c + won[i]);
    const net = st.names.map((_, i) => won[i] - st.contrib[i]);
    st.history.push({ label: 'Hand ' + st.round, points: net });
    st.scores = st.chips.slice();
    const alive = live(st);
    const over = alive.length <= 1 || st.chips[0] === 0;
    st.phase = over ? 'gameover' : 'roundover';
    if (over) {
      const hi = Math.max(...st.chips);
      st.winners = st.chips.map((c, i) => (c === hi ? i : -1)).filter((i) => i >= 0);
    }
    st.summary = {
      title: over ? (alive.length <= 1 ? `${E.nm(st, alive[0])} has every chip` : 'You are out of chips') : st.events[st.events.length - 1].text.replace(/\.$/, ''),
      note: showdown && st.revealed ? 'Best five cards from the two in hand and five on the board.' : 'Everyone else folded.',
      head: ['', 'Hand', 'Won', 'Chips'],
      rows: st.names.map((nm, i) => [
        nm,
        results[i] ? `${st.hands[i].map(K.label).join(' ')} · ${results[i].name}` : st.folded[i] && st.inHand[i] ? 'Folded' : st.inHand[i] ? '—' : 'Out',
        won[i] ? '+' + (won[i] - st.contrib[i]) : st.contrib[i] ? '−' + st.contrib[i] : '',
        st.chips[i],
      ]),
    };
  }

  function view(st, seat) {
    const v = E.baseView(st, seat);
    v.hand = st.hands[seat].slice();
    v.counts = st.names.map((_, i) => (st.inHand[i] && !st.folded[i] && i !== seat && !(st.revealed && st.revealed.includes(i)) ? st.hands[i].length : 0));
    v.board = st.board.slice();
    v.chips = st.chips.slice();
    v.bet = st.bet.slice();
    v.pot = st.contrib.reduce((a, b) => a + b, 0);
    v.folded = st.folded.slice();
    v.inHand = st.inHand.slice();
    v.allin = st.allin.slice();
    v.last = st.last.slice();
    v.dealer = st.button;
    v.sbSeat = st.sbSeat;
    v.bbSeat = st.bbSeat;
    v.street = st.street;
    v.currentBet = st.currentBet;
    v.toCall = Math.max(0, st.currentBet - st.bet[seat]);
    v.minRaise = st.minRaise;
    v.blinds = [st.sb, st.sb * 2];
    v.shown = st.revealed ? Object.fromEntries(st.revealed.map((s) => [s, st.hands[s].slice()])) : null;
    v.publicCards = st.board.concat(...(st.revealed || []).map((s) => st.hands[s]));
    return v;
  }

  const zones = (st) => [st.deck, st.board, st.muck, st.burned, ...st.hands];

  C52.Games.register('holdem', { options, setup, actions, apply, view, zones });
})(typeof window !== 'undefined' ? window : globalThis);
