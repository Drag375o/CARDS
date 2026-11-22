/* 52 Cards — venue registry. A venue is the room you play in: its look
 * lives in css/venues/<id>.css (scoped by [data-venue]); this file holds
 * the metadata the UI and the sound engine need. */
(function (root) {
  'use strict';
  const C52 = (root.C52 = root.C52 || {});
  const LIST = [];

  function register(v) {
    LIST.push(v);
  }

  register({
    id: 'riviera',
    name: 'Riviera Salon',
    setting: 'A private room at a 1960s seaside casino.',
    deck: 'classic',
    back: 'lattice-red',
    // Sound: a mid-sized, warm room with a little carpet damping.
    room: { size: 1.6, decay: 2.2, wet: 0.16, tone: 5200 },
    ambience: 'salon',
    swatch: ['#145236', '#c9a24a', '#2a1a12'],
  });

  C52.Venues = {
    list: () => LIST.slice(),
    get: (id) => LIST.find((v) => v.id === id) || LIST[0],
    register,
  };
})(typeof window !== 'undefined' ? window : globalThis);
