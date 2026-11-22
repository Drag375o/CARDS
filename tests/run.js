/* 52 Cards — headless test runner. No dependencies.
 *   node tests/run.js            run every *.test.js
 *   node tests/run.js cards      run only files whose name contains "cards"
 *
 * Browser scripts attach to a global C52 namespace, so they are loaded into
 * this process in the same order index.html uses (see SCRIPTS below).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

// Engine scripts only (no DOM). Keep in step with index.html.
const SCRIPTS = [
  'js/core/cards.js',
  'js/core/registry.js',
  'js/core/engine.js',
  'js/core/tricks.js',
  'js/core/hands.js',
  'js/art/cardsvg.js',
  'js/art/backs.js',
  'js/art/decks/classic.js',
  'js/art/decks/engraved.js',
  'js/art/decks/storybook.js',
  'js/art/decks/silhouette.js',
  'js/art/decks/inkline.js',
  'js/art/decks/pastel.js',
  'js/audio/mixer.js',
  'js/audio/foley.js',
  'js/audio/stings.js',
  'js/audio/ambience.js',
];

// Every rules engine and computer player in js/games and js/ai.
for (const dir of ['js/games', 'js/ai']) {
  const d = path.join(ROOT, dir);
  if (fs.existsSync(d)) fs.readdirSync(d).filter((f) => f.endsWith('.js')).sort().forEach((f) => SCRIPTS.push(dir + '/' + f));
}

for (const rel of SCRIPTS) {
  const file = path.join(ROOT, rel);
  if (fs.existsSync(file)) vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: rel });
}

const tests = [];
global.test = (name, fn) => tests.push({ name, fn });
global.assert = (cond, msg) => {
  if (!cond) throw new Error(msg || 'assertion failed');
};
global.assertEq = (a, b, msg) => {
  const ja = JSON.stringify(a);
  const jb = JSON.stringify(b);
  if (ja !== jb) throw new Error((msg ? msg + ': ' : '') + 'expected ' + jb + ', got ' + ja);
};
global.assertThrows = (fn, msg) => {
  try {
    fn();
  } catch (e) {
    return;
  }
  throw new Error(msg || 'expected an error');
};

const filter = process.argv[2] || '';
const files = fs
  .readdirSync(__dirname)
  .filter((f) => f.endsWith('.test.js') && f.includes(filter))
  .sort();

for (const f of files) {
  const before = tests.length;
  require(path.join(__dirname, f));
  for (let i = before; i < tests.length; i++) tests[i].file = f;
}

let pass = 0;
let fail = 0;
const timings = [];
for (const t of tests) {
  const t0 = Date.now();
  try {
    t.fn();
    pass++;
  } catch (e) {
    fail++;
    console.log('  ✗ ' + t.file + ' › ' + t.name + '\n      ' + e.message);
  }
  timings.push([Date.now() - t0, t.name]);
}
// SLOW=1 node tests/run.js  lists the slowest tests.
if (process.env.SLOW) timings.sort((a, b) => b[0] - a[0]).slice(0, 8).forEach(([ms, name]) => console.log('  ' + ms + ' ms  ' + name));
console.log((fail ? '✗' : '✓') + ' ' + pass + ' passed, ' + fail + ' failed (' + files.length + ' files)');
process.exit(fail ? 1 : 0);
