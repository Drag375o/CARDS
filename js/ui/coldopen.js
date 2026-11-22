/* 52 Cards — cold open. A squared deck in the dark. Tap to cut: the deck
 * is riffled and squared, the title comes up, then the menu is dealt.
 * The first tap also unlocks audio, so the shuffle is heard. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const S = () => C52.Scene;

  let timers = [];
  let started = false;
  let onKey = null;

  const later = (ms, fn) => timers.push(setTimeout(fn, ms));

  function enter(stage) {
    started = false;
    root.document.documentElement.classList.add('lights-down');
    const back = S().cardHTML(null, { faceDown: true });
    const v = C52.Venues.get(C52.Prefs.get().venue);
    stage.innerHTML = `
      <div class="table-wrap"><div class="table"><div class="felt"><div class="felt-mark">${v.name}</div></div></div></div>
      <div class="coldopen" id="coldopen" role="button" tabindex="0" aria-label="Cut the deck to begin">
        <div class="deck-stage">
          <div class="packet left">${back}${back}${back}</div>
          <div class="packet right">${back}${back}${back}</div>
        </div>
        <h1 class="title"><span class="t52">52</span><span class="tcards">Cards</span></h1>
        <p class="tagline">Twelve games. One deck.</p>
        <p class="prompt">Tap anywhere to cut the deck</p>
      </div>`;
    const el = stage.querySelector('#coldopen');
    el.addEventListener('click', go);
    onKey = (e) => {
      if (e.key === 'Escape' || e.key.length === 1 || e.key === 'Enter') go();
    };
    root.addEventListener('keydown', onKey);
    el.focus({ preventScroll: true });
  }

  function go() {
    const el = root.document.getElementById('coldopen');
    if (!el) return;
    if (started) return finish(); // second tap skips ahead
    started = true;
    try {
      C52.Mixer.ensure();
    } catch (e) {
      /* sound unavailable: carry on */
    }
    const reduced = C52.Prefs.get().reducedMotion;
    el.classList.add('cut');
    C52.Sound.play('cut');
    if (reduced) {
      el.classList.add('titled');
      later(1200, finish);
      return;
    }
    later(260, () => {
      el.classList.add('riffle');
      C52.Sound.play('shuffle');
    });
    later(2700, () => el.classList.add('squared'));
    later(3000, () => el.classList.add('titled'));
    later(5200, finish);
  }

  function finish() {
    timers.forEach(clearTimeout);
    timers = [];
    root.document.documentElement.classList.remove('lights-down');
    C52.UI.show('menu', { deal: true });
  }

  function leave() {
    timers.forEach(clearTimeout);
    timers = [];
    if (onKey) root.removeEventListener('keydown', onKey);
    root.document.documentElement.classList.remove('lights-down');
  }

  C52.Screens.coldopen = { enter, leave };
})(window);
