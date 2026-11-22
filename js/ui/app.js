/* 52 Cards — boot. Mounts the scene and opens on the cold open.
 * URL hashes jump straight to a screen (handy when testing):
 *   #menu   the game hand     #brief:klondike   a game's briefing
 *   #house  also open the House drawer */
(function (root) {
  'use strict';
  const C52 = root.C52;

  function boot() {
    C52.Scene.mount();
    C52.Prefs.onChange((p, patch) => {
      if (patch.venue || patch.deck || 'back' in patch || 'fourColour' in patch || 'largeIndex' in patch) C52.UI.refresh();
    });
    root.addEventListener('resize', () => {
      const h = C52.Scene.$('#hand');
      if (h) C52.Scene.fan(h);
    });

    const hash = root.location.hash.slice(1).split('&');
    const brief = hash.find((h) => h.startsWith('brief:'));
    C52.UI.show(hash.includes('menu') || brief ? 'menu' : 'coldopen', { brief: brief && brief.slice(6) });
    if (hash.includes('house')) C52.Scene.toggleDrawer(true);
  }

  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
