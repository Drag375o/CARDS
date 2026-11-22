/* Generic simulation for every registered engine: whole games between
 * computer players (and random movers), checking after every move that all
 * cards are accounted for, views never leak other hands, and games end. */
const K = C52.Cards;

function simulate(id, seed, opts) {
  const eng = C52.Games.engine(id);
  const ai = C52.AI[id];
  const meta = C52.Games.meta(id);
  const rng = K.seededRng(seed);
  const n = opts.n || meta.players[0] + Math.floor(rng() * (meta.players[1] - meta.players[0] + 1));
  const options = {};
  (eng.options || []).forEach((o) => (options[o.key] = o.default));
  Object.assign(options, opts.options || {});
  const st = eng.setup({ n, names: Array.from({ length: n }, (_, i) => 'P' + i), options }, rng);
  const levels = ['easy', 'medium', 'hard'];
  let steps = 0;
  const deck = eng.deck ? eng.deck(st) : K.makeDeck();
  while (st.phase !== 'gameover' && steps < (opts.maxSteps || 20000)) {
    let moved = false;
    for (let seat = 0; seat < n && !moved; seat++) {
      const acts = eng.actions(st, seat);
      if (!acts.length) continue;
      const v = eng.view(st, seat);
      let a = opts.random ? acts[Math.floor(rng() * acts.length)] : ai.decide(v, acts, levels[(seat + seed) % 3], rng);
      if (a === null) continue; // this player chooses to wait
      if (!a) a = acts[0];
      if (a.choose) a = ai.decide(v, acts, 'easy', rng); // "choose N cards" moves come from the computer player
      eng.apply(st, seat, a, rng);
      moved = true;
    }
    if (!moved && eng.tick) {
      eng.tick(st, rng); // real-time games advance on their own
      moved = true;
    }
    if (!moved) throw new Error(id + ': nobody can move in phase ' + st.phase);
    const audit = K.audit(eng.zones(st), deck);
    if (!audit.ok) throw new Error(id + ' card audit failed after step ' + steps + ': ' + JSON.stringify(audit));
    steps++;
  }
  if (st.phase !== 'gameover' && !opts.allowUnfinished) throw new Error(id + ' did not finish in ' + steps + ' steps');
  return { st, steps, n };
}
global.simulate = simulate;

/** Cards a view may legitimately show: your hand plus anything public. */
function hiddenLeak(eng, st, seat) {
  const v = eng.view(st, seat);
  const allowed = new Set([...(v.hand || []), ...(v.publicCards || [])]);
  const text = JSON.stringify(Object.assign({}, v, { events: [] }));
  const leaks = [];
  (st.hands || []).forEach((h, s) => {
    if (s === seat) return;
    h.forEach((c) => {
      if (!allowed.has(c) && text.includes('"' + c + '"')) leaks.push(c);
    });
  });
  return leaks;
}

for (const g of C52.Games.list()) {
  if (!C52.Games.engine(g.id) || !C52.AI[g.id]) continue;
  test(g.id + ': 40 computer games finish with every card accounted for', () => {
    for (let s = 1; s <= 40; s++) simulate(g.id, s, {});
  });
  // Random movers may never finish (they rarely meld or bid well); this checks robustness, not completion.
  test(g.id + ': 40 random-move games stay legal and keep every card', () => {
    for (let s = 101; s <= 140; s++) simulate(g.id, s, { random: true, allowUnfinished: true, maxSteps: 3000 });
  });
  test(g.id + ": views never show another player's hidden cards", () => {
    const eng = C52.Games.engine(g.id);
    const meta = C52.Games.meta(g.id);
    if (meta.players[1] < 2) return;
    const n = Math.max(meta.players[0], Math.min(4, meta.players[1]));
    const options = {};
    (eng.options || []).forEach((o) => (options[o.key] = o.default));
    const rng = K.seededRng(9);
    const st = eng.setup({ n, names: Array.from({ length: n }, (_, i) => 'P' + i), options }, rng);
    // Check at the start and after a handful of moves.
    for (let step = 0; step < 30 && st.phase !== 'gameover'; step++) {
      if (st.phase !== 'roundover') {
        const leaks = hiddenLeak(eng, st, 0);
        assert(!leaks.length, g.id + ' view leaks ' + leaks.join(' '));
      }
      for (let seat = 0; seat < n; seat++) {
        const acts = eng.actions(st, seat);
        if (acts.length) {
          const a = acts[0].choose ? C52.AI[g.id].decide(eng.view(st, seat), acts, 'easy', rng) : acts[0];
          eng.apply(st, seat, a, rng);
          break;
        }
      }
    }
  });
}
