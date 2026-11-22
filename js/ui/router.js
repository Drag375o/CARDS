/* 52 Cards — screen router. A screen is { enter(stage, params), leave() };
 * screens register under C52.Screens and are shown with C52.UI.show(). */
(function (root) {
  'use strict';
  const C52 = root.C52;
  C52.Screens = C52.Screens || {};

  let current = null;
  let currentName = '';

  function show(name, params) {
    const next = C52.Screens[name];
    if (!next) throw new Error('No screen: ' + name);
    if (current && current.leave) current.leave();
    const stage = C52.Scene.$('#stage');
    stage.innerHTML = '';
    stage.dataset.screen = name;
    current = next;
    currentName = name;
    next.enter(stage, params || {});
  }

  /** Re-render the current screen (after a venue or deck change). */
  function refresh() {
    if (current && current.refresh) current.refresh();
  }

  C52.UI = { show, refresh, current: () => currentName };
})(window);
