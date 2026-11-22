/* 52 Cards — sound controls in the House drawer, and keeping the mixer,
 * room reverb and ambience in step with preferences. */
(function (root) {
  'use strict';
  const C52 = root.C52;

  C52.Prefs.onChange((p, patch) => {
    if (patch.volume || 'muted' in patch) C52.Mixer.applyVolumes();
    if (patch.venue) C52.Mixer.setRoom();
    C52.Ambience.sync();
  });

  const SLIDERS = [
    ['master', 'Master'],
    ['fx', 'Table sounds'],
    ['music', 'Music stings'],
    ['ambience', 'Room ambience'],
  ];
  const PREVIEWS = [
    ['shuffle', 'Shuffle'],
    ['deal', 'Deal'],
    ['push', 'Chips'],
    ['turn', 'Your turn'],
    ['sting:win', 'Win'],
    ['sting:big', 'Big hand'],
  ];

  C52.Scene.addDrawerSection(
    (p) =>
      `<h3>Sound</h3>
      <label class="toggle">Mute everything<input type="checkbox" data-wire="mute" ${p.muted ? 'checked' : ''}></label>
      ${SLIDERS.map(
        ([k, label]) =>
          `<label class="toggle">${label}<input type="range" min="0" max="1" step="0.05" value="${p.volume[k]}" data-wire="vol" data-key="${k}" style="width:140px"></label>`
      ).join('')}
      <div class="choices" style="margin-top:12px;grid-template-columns:repeat(3,1fr)">
        ${PREVIEWS.map(([k, label]) => `<button class="choice" data-wire="preview" data-sound="${k}"><span class="label" style="margin:0">${label}</span></button>`).join('')}
      </div>`,
    null
  );

  // Drawer wiring by data-wire name.
  const wire = (name, fn) => C52.Scene.addDrawerSection(() => '', name, fn);
  wire('mute', (el) => (el.onchange = () => C52.Prefs.set({ muted: el.checked })));
  wire('vol', (el) => (el.oninput = () => C52.Prefs.set({ volume: { [el.dataset.key]: Number(el.value) } })));
  wire('preview', (el) => {
    el.onclick = () => {
      C52.Mixer.ensure();
      const s = el.dataset.sound;
      if (s.startsWith('sting:')) C52.Sound.sting(s.slice(6));
      else C52.Sound.play(s, { pan: s === 'deal' ? 0.5 : 0 });
    };
  });
})(window);
