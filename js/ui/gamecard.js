/* 52 Cards — the card that stands for a game in the menu hand: ivory
 * stock, a fine gilt frame, the game's number and name like a title card. */
(function (root) {
  'use strict';
  const C52 = root.C52;

  const pad = (n) => String(n).padStart(2, '0');
  const players = (g) => (g.players[0] === g.players[1] ? g.players[0] : g.players[0] + '–' + g.players[1]) + (g.players[1] === 1 ? ' player' : ' players');

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/'/g, '&#39;');
  }

  /** Split a title over two lines when it is long. */
  function titleLines(name) {
    if (name.length <= 12) return [name];
    const words = name.split(' ');
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  }

  function svg(g) {
    const ink = C52.Art.TWO_COLOUR[g.suit];
    const lines = titleLines(g.name);
    const ty = lines.length === 1 ? 236 : 222;
    return (
      `<svg class="c52-card gamecard" viewBox="0 0 250 350" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(g.name)}">` +
      `<rect x="1" y="1" width="248" height="348" rx="14" fill="#F6F0E2" stroke="#bdb6a6" stroke-width="2"/>` +
      `<rect x="13" y="13" width="224" height="324" rx="8" fill="none" stroke="#B8923F" stroke-width="1.6"/>` +
      `<rect x="19" y="19" width="212" height="312" rx="6" fill="none" stroke="#B8923F" stroke-width=".6"/>` +
      C52.Art.pip(g.suit, 125, 128, 150, ink, false, ' opacity=".07"') +
      `<text x="125" y="58" text-anchor="middle" class="gc-kicker">${g.group === 'niche' ? 'THE RARER GAMES' : 'THE CLASSICS'}</text>` +
      `<text x="125" y="146" text-anchor="middle" class="gc-num">${pad(g.num)}</text>` +
      C52.Art.pip(g.suit, 125, 176, 18, ink) +
      lines.map((l, i) => `<text x="125" y="${ty + i * 30}" text-anchor="middle" class="gc-title">${esc(l)}</text>`).join('') +
      `<path d="M95 274H155" stroke="#B8923F" stroke-width=".8"/>` +
      `<text x="125" y="298" text-anchor="middle" class="gc-meta">${esc(g.kind.toUpperCase())}</text>` +
      `<text x="125" y="316" text-anchor="middle" class="gc-meta">${players(g).toUpperCase()}</text>` +
      `</svg>`
    );
  }

  C52.GameCard = { svg, players, pad };
})(window);
