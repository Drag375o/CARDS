/* 52 Cards — boot. Mounts the scene and opens on the cold open.
 * URL hashes jump straight to a screen (handy when testing):
 *   #menu   the game hand     #brief:klondike   a game's briefing
 *   #seat:crazy8   seating        #play:crazy8&n:4   straight to a table
 *   #venue:lair  #deck:engraved   switch the look
 *   #house  also open the House drawer */
(function (root) {
  'use strict';
  const C52 = root.C52;

  /** Any unexpected error is shown on screen, so it can be reported instead of silently freezing play. */
  function showErrors() {
    const say = (msg) => {
      if (C52.Scene && C52.Scene.notice) C52.Scene.notice('Something went wrong: <b>' + String(msg).replace(/</g, '&lt;').slice(0, 160) + '</b>. Try Leave, or reload the page.', { ms: 12000 });
    };
    root.addEventListener('error', (e) => say(e.message || e.error));
    root.addEventListener('unhandledrejection', (e) => say((e.reason && e.reason.message) || e.reason));
  }

  // Shown in The House, so it's easy to check which version a browser is running.
  C52.VERSION = '2026.11.23d';

  function boot() {
    showErrors();
    C52.Scene.mount();
    C52.Scene.addDrawerSection(() => `<p class="lede" style="margin-top:28px;font-size:13px;font-style:normal">Version ${C52.VERSION}</p>`);
    if (root.console) console.info('52 Cards version ' + C52.VERSION);
    C52.Prefs.onChange((p, patch) => {
      if (patch.venue || patch.deck || 'back' in patch || 'fourColour' in patch || 'largeIndex' in patch) C52.UI.refresh();
    });
    root.addEventListener('resize', () => {
      const h = C52.Scene.$('#hand');
      if (h) C52.Scene.fan(h);
    });

    const hash = root.location.hash.slice(1).split('&');
    const arg = (k) => (hash.find((h) => h.startsWith(k + ':')) || '').slice(k.length + 1);
    if (arg('venue')) C52.Prefs.set({ venue: arg('venue') });
    if (arg('deck')) C52.Prefs.set({ deck: arg('deck') });
    if (arg('seat')) C52.UI.show('seating', { game: arg('seat') });
    else if (arg('play')) {
      // Straight to a table with computer opponents (used for testing).
      const meta = C52.Games.meta(arg('play'));
      const n = Number(arg('n')) || Math.max(meta.players[0], Math.min(4, meta.players[1]));
      const seats = [{ kind: 'you', name: 'You' }].concat(C52.Seating.CPU_NAMES.slice(0, n - 1).map((name) => ({ kind: 'cpu', level: 'medium', name })));
      C52.UI.show('table', { game: arg('play'), seats, options: {} });
    } else C52.UI.show(hash.includes('menu') || arg('brief') ? 'menu' : 'coldopen', { brief: arg('brief') });
    if (hash.includes('house')) C52.Scene.toggleDrawer(true);
  }

  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
