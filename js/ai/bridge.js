/* 52 Cards — Bridge computer players.
 *
 * Bidding is a simple natural system:
 *   open 1NT with 15–17 balanced, 2NT with 20–21 balanced, otherwise one
 *   of your longest suit (five-card majors first) with 12+ points;
 *   respond by raising a fit, showing a new suit, or bidding notrump;
 *   then place the contract from the partnership's combined points
 *   (25 for game, 33 for a small slam, 37 for a grand) in the best fit.
 *   Overcall a good five-card suit; double opponents who overreach.
 * Play uses the shared trick-taking brain, with declarer playing dummy. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  C52.AI = C52.AI || {};
  const STRAINS = ['C', 'D', 'H', 'S', 'N'];

  const HCP = { A: 4, K: 3, Q: 2, J: 1 };
  const hcp = (hand) => hand.reduce((s, c) => s + (HCP[c[0]] || 0), 0);
  const lengths = (hand) => {
    const n = { S: 0, H: 0, D: 0, C: 0 };
    hand.forEach((c) => n[c[1]]++);
    return n;
  };
  const balanced = (L) => {
    const v = Object.values(L).sort((a, b) => a - b);
    return v[0] >= 2 && v[1] >= 3 - (v[0] === 2 ? 1 : 0) && !(v[0] === 2 && v[1] === 2);
  };
  const points = (hand) => hcp(hand) + Object.values(lengths(hand)).reduce((s, n) => s + Math.max(0, n - 4), 0);
  const rank = (l, s) => (l - 1) * 5 + STRAINS.indexOf(s);

  /** What partner has shown so far: points and suit lengths (rough). */
  function partnerShows(v, p) {
    const calls = v.auction.filter((c) => c.seat === p && c.type === 'bid');
    let pts = 0;
    let min = 0; // the least partner can hold for what they've bid
    const len = { S: 0, H: 0, D: 0, C: 0 };
    const partnerOfP = (p + 2) % 4;
    calls.forEach((c, i) => {
      const lvl = c.level;
      const strain = c.strain;
      const isOpen = v.auction.findIndex((x) => x.type === 'bid') === v.auction.indexOf(c);
      const partnerBidFirst = v.auction.some((x) => x.type === 'bid' && x.seat === partnerOfP && v.auction.indexOf(x) < v.auction.indexOf(c));
      if (i === 0) {
        // Notrump shows different strength as an opening, a response or an overcall.
        if (strain === 'N') pts = isOpen ? (lvl === 1 ? 16 : lvl === 2 ? 20.5 : 25) : partnerBidFirst ? (lvl === 1 ? 7.5 : lvl === 2 ? 11.5 : 14) : 16;
        else if (isOpen) pts = 13.5;
        else if (partnerBidFirst) pts = lvl >= 3 ? 11 : lvl === 2 ? 9 : 8;
        else pts = 11; // overcall
        if (strain === 'N') min = isOpen ? (lvl === 1 ? 15 : 20) : partnerBidFirst ? (lvl === 1 ? 6 : lvl === 2 ? 10 : 6) : 15;
        else min = isOpen ? 12 : partnerBidFirst ? (lvl >= 2 ? 10 : 6) : 8;
      } else pts = Math.max(pts, pts + (lvl >= 3 ? 2 : 1));
      if (strain !== 'N') len[strain] = Math.max(len[strain], i === 0 && isOpen && 'HS'.includes(strain) ? 5 : 4);
    });
    return { pts, min, len, bid: calls.length > 0 };
  }

  function bid(v, actions, level, rng) {
    const me = v.me;
    const hand = v.hand;
    const L = lengths(hand);
    const h = hcp(hand);
    const p = points(hand);
    const partner = (me + 2) % 4;
    const has = (l, s) => actions.find((a) => a.type === 'bid' && a.level === l && a.strain === s);
    const pass = { type: 'pass' };
    const bids = v.auction.filter((c) => c.type === 'bid');
    const ours = (seat) => seat % 2 === me % 2;
    const opened = bids.length > 0;
    const S = C52.Games.engine('bridge');

    // Current contract.
    let cur = null;
    v.auction.forEach((c) => {
      if (c.type === 'bid') cur = c;
    });
    const cheapest = (s) => {
      for (let l = 1; l <= 7; l++) if (has(l, s)) return l;
      return 8;
    };
    const tryBid = (l, s) => (l <= 7 && has(l, s) ? has(l, s) : null);
    const longest = () => ['S', 'H', 'D', 'C'].sort((a, b) => L[b] - L[a] || 'SHDC'.indexOf(a) - 'SHDC'.indexOf(b))[0];

    if (level === 'easy' && rng() < 0.15) return pass;

    // Opening.
    if (!opened) {
      if (h >= 15 && h <= 17 && balanced(L)) return tryBid(1, 'N') || pass;
      if (h >= 20 && h <= 21 && balanced(L)) return tryBid(2, 'N') || pass;
      if (p >= 12 || (h >= 11 && Math.max(...Object.values(L)) >= 6)) {
        let s;
        if (L.S >= 5 || L.H >= 5) s = L.S >= L.H ? 'S' : 'H';
        else s = L.D >= 4 && L.D >= L.C ? 'D' : 'C';
        return tryBid(1, s) || pass;
      }
      return pass;
    }

    const partnerInfo = partnerShows(v, partner);
    const oppOpened = bids[0] && !ours(bids[0].seat);

    // Competitive: opponents opened and partner hasn't bid.
    if (oppOpened && !partnerInfo.bid) {
      const myBids = bids.filter((b) => b.seat === me);
      if (myBids.length) return pass;
      if (h >= 15 && h <= 18 && balanced(L)) {
        const l = cheapest('N');
        if (l <= 1) return tryBid(l, 'N') || pass;
      }
      const s = longest();
      if (L[s] >= 5 && h >= 8 && h <= 17) {
        const l = cheapest(s);
        if (l <= 2) return tryBid(l, s) || pass;
      }
      // Penalty double of a high contract with trump length and strength.
      const st = S.auctionState({ auction: v.auction });
      const dbl = actions.find((a) => a.type === 'double');
      if (dbl && st.lastBid && st.lastBid.level >= 4 && h >= 13 && st.lastBid.strain !== 'N' && L[st.lastBid.strain] >= 4) return dbl;
      return pass;
    }

    // Our side's auction: respond / rebid towards the best contract.
    if (!partnerInfo.bid && bids.every((b) => !ours(b.seat))) return pass;
    if (!partnerInfo.bid) {
      // We opened and partner passed: only rebid with extra values.
      if (p >= 17) {
        const s = longest();
        const l = cheapest(s);
        if (l <= 2) return tryBid(l, s) || pass;
      }
      return pass;
    }
    if (p < 6 && !bids.some((b) => b.seat === me)) return pass;

    const total = p + partnerInfo.pts;
    // Choose the strain: an 8-card major fit, then notrump if balanced, then a minor fit, then our longest.
    const fit = (s) => L[s] + partnerInfo.len[s];
    let strain;
    if (fit('S') >= 8 || fit('H') >= 8) strain = fit('S') >= fit('H') ? 'S' : 'H';
    else if (balanced(L) || partnerInfo.len.S + partnerInfo.len.H + partnerInfo.len.D + partnerInfo.len.C === 0) strain = 'N';
    else if (fit('D') >= 8 || fit('C') >= 8) strain = fit('D') >= fit('C') ? 'D' : 'C';
    else strain = L[longest()] >= 5 ? longest() : 'N';
    // Target level from combined points.
    let target;
    if (total >= 37) target = 7;
    else if (total >= 33) target = 6;
    else if (total >= 25) target = strain === 'N' ? 3 : strain === 'H' || strain === 'S' ? 4 : total >= 28 ? 5 : 3;
    else if (total >= 22) target = strain === 'N' ? 2 : 3;
    else target = strain === 'N' ? 1 : 2;
    if (target === 3 && (strain === 'C' || strain === 'D') && total >= 25) strain = 'N';
    // Slams need to be safe on partner's minimum, not just their average.
    if (target >= 6 && p + partnerInfo.min < 33) target = strain === 'N' ? 3 : strain === 'H' || strain === 'S' ? 4 : 5;
    // First response: show a new four-card suit cheaply rather than jumping, unless a fit is clear.
    const myCalls = bids.filter((b) => b.seat === me).length;
    if (myCalls === 0 && strain === 'N' && !partnerInfo.len.S && !partnerInfo.len.H && !partnerInfo.len.D && !partnerInfo.len.C) {
      // Partner opened notrump.
      if (L.S >= 6 && total >= 25) return tryBid(4, 'S') || pass;
      if (L.H >= 6 && total >= 25) return tryBid(4, 'H') || pass;
    }
    const contractOurs = cur && ours(cur.seat);
    const curRank = cur ? rank(cur.level, cur.strain) : -1;
    if (contractOurs && curRank >= rank(target, strain)) return pass;
    const l = Math.max(cheapest(strain), Math.min(target, 7));
    if (l > target && contractOurs) return pass;
    if (l > target + (level === 'hard' ? 0 : 1)) return pass;
    return tryBid(l, strain) || pass;
  }

  function play(v, actions, level, rng) {
    const legal = actions.map((a) => a.card);
    const playing = v.turn; // may be dummy, played by declarer
    const trump = v.contract.strain === 'N' ? null : v.contract.strain;
    const partner = (playing + 2) % 4;
    const hand = playing === v.me ? v.hand : v.dummyHand || [];
    const card = C52.TrickAI.choose({
      legal, trick: v.trick, trump, me: playing, partner, n: 4, want: 'win', level, rng, played: v.played, hand,
    });
    return { type: 'play', card };
  }

  function decide(v, actions, level, rng) {
    if (actions[0].type === 'next') return actions[0];
    if (v.phase === 'auction') return bid(v, actions, level, rng);
    return play(v, actions, level, rng);
  }

  C52.AI.bridge = { decide, hcp, points, balanced, lengths, delay: C52.TrickAI.delay };
})(typeof window !== 'undefined' ? window : globalThis);
