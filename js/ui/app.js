/* 52 Cards — boot. Mounts the scene and shows the current screen.
 * Until the menus land this shows a demo table so venues and decks can be
 * seen and changed. */
(function (root) {
  'use strict';
  const C52 = root.C52;
  const S = () => C52.Scene;
  const K = C52.Cards;

  const demo = { hand: [], discard: [], stock: [] };

  function newDemo() {
    const deck = K.shuffle(K.makeDeck());
    demo.hand = K.sortHand(K.draw(deck, 7));
    demo.discard = K.draw(deck, 1);
    demo.stock = deck;
  }

  function renderDemo() {
    const v = C52.Venues.get(C52.Prefs.get().venue);
    const stage = S().$('#stage');
    stage.innerHTML = `
      <div class="table-wrap"><div class="table"><div class="felt">
        <div class="felt-mark">${v.name}</div>
        <div class="zone" style="left:38%;top:34%">${S().cardHTML(null, { faceDown: true, cls: 'pile-depth' })}</div>
        <div class="zone" style="left:52%;top:34%">${S().cardHTML(demo.discard[demo.discard.length - 1])}</div>
      </div></div></div>
      <div class="hand" id="hand">${demo.hand.map((c) => S().cardHTML(c, { cls: 'playable', attrs: 'tabindex="0"' })).join('')}</div>`;
    const hand = S().$('#hand');
    S().fan(hand);
    hand.querySelectorAll('.card').forEach((el) => {
      const play = () => {
        const c = el.dataset.card;
        demo.hand.splice(demo.hand.indexOf(c), 1);
        demo.discard.push(c);
        if (!demo.hand.length) newDemo();
        if (C52.Sound) C52.Sound.play('place');
        S().subtitle('You lay down the ' + K.name(c) + '.');
        renderDemo();
      };
      el.addEventListener('click', play);
      el.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && play());
    });
  }

  function boot() {
    S().mount();
    newDemo();
    renderDemo();
    C52.Prefs.onChange(renderDemo);
    root.addEventListener('resize', () => {
      const h = S().$('#hand');
      if (h) S().fan(h);
    });
    S().subtitle('The ' + C52.Venues.get(C52.Prefs.get().venue).name + '. The table is yours.');
    if (root.location.hash === '#house') S().toggleDrawer(true);
  }

  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
