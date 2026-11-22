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

  register({
    id: 'lair',
    name: 'The Lair',
    setting: "A villain's private table, carved into volcanic rock.",
    deck: 'silhouette',
    back: 'noir',
    room: { size: 2.8, decay: 3, wet: 0.24, tone: 3200 },
    ambience: 'lair',
    swatch: ['#121418', '#c0282d', '#3a3f47'],
  });

  register({
    id: 'noir62',
    name: "Noir '62",
    setting: 'A back room after midnight, in black and white.',
    deck: 'inkline',
    back: 'monogram',
    room: { size: 1.0, decay: 2.6, wet: 0.13, tone: 4200 },
    ambience: 'noir',
    swatch: ['#2a2a2a', '#d8d8d8', '#0c0c0c'],
  });

  register({
    id: 'mayfair',
    name: 'Mayfair Bar',
    setting: 'A modern cocktail bar after closing.',
    deck: 'classic',
    back: 'lattice-blue',
    room: { size: 1.3, decay: 2.2, wet: 0.14, tone: 6000 },
    ambience: 'mayfair',
    swatch: ['#5a1f1d', '#e0b060', '#2b1a10'],
  });

  register({
    id: 'nighttrain',
    name: 'Night Train',
    setting: 'A dining car crossing the Alps.',
    deck: 'storybook',
    back: 'lattice-red',
    room: { size: 0.7, decay: 2.8, wet: 0.1, tone: 3800 },
    ambience: 'train',
    swatch: ['#5d1a26', '#e0c088', '#2a160c'],
  });

  register({
    id: 'vault',
    name: 'The Vault',
    setting: "A Swiss bank's private room.",
    deck: 'engraved',
    back: 'guilloche',
    room: { size: 2.2, decay: 2.0, wet: 0.24, tone: 7000 },
    ambience: 'vault',
    swatch: ['#d6dfc0', '#1e5a53', '#4b5257'],
  });

  C52.Venues = {
    list: () => LIST.slice(),
    get: (id) => LIST.find((v) => v.id === id) || LIST[0],
    register,
  };
})(typeof window !== 'undefined' ? window : globalThis);
