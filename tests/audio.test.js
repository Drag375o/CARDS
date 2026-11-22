// Node has no Web Audio: every sound call must be a silent no-op, never a crash.
test('sound calls are safe without an AudioContext', () => {
  assertEq(C52.Sound.play('shuffle'), 0);
  assertEq(C52.Sound.play('deal', { pan: 0.5 }), 0);
  assertEq(C52.Sound.play('no-such-sound'), 0);
  assertEq(C52.Sound.sting('win'), 0);
  assertEq(C52.Mixer.ensure(), null);
});

test('every table sound named in the README exists', () => {
  const names = C52.Sound.names();
  for (const n of ['shuffle', 'cut', 'deal', 'draw', 'place', 'flip', 'sweep', 'chips', 'push', 'allin', 'rake', 'shoe', 'bid', 'slap', 'turn', 'tick', 'brush', 'latch']) {
    assert(names.includes(n), 'missing sound: ' + n);
  }
});
