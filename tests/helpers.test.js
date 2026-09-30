const test = require('node:test');
const assert = require('node:assert/strict');
const {
  SECTIONS, padCount, safeUrl, computeTiles, revealDelays,
  isTypingTarget, resolveShortcut, filterSections, validateData,
} = require('../script.js');

const close = (actual, expected, eps = 1e-6) =>
  assert.ok(Math.abs(actual - expected) < eps, `${actual} !≈ ${expected}`);

test('SECTIONS lists the five nav targets in order', () => {
  assert.deepEqual(SECTIONS.map((s) => [s.id, s.key]), [
    ['home', '1'], ['about', '2'], ['stack', '3'], ['projects', '4'], ['certifications', '5'],
  ]);
});

test('padCount zero-pads valid counts', () => {
  assert.equal(padCount(42), '0042');
  assert.equal(padCount('7'), '0007');
  assert.equal(padCount(123456), '123456');
  assert.equal(padCount(3.9), '0003');
});

test('padCount rejects junk from the counter API', () => {
  for (const bad of [null, undefined, '', '   ', 'abc', NaN, Infinity, {}, []]) {
    assert.equal(padCount(bad), null, `expected null for ${String(bad)}`);
  }
  assert.equal(padCount(-5), '0000');
});

test('safeUrl allows only http(s) and mailto', () => {
  assert.equal(safeUrl('https://github.com/chimkenchrls'), 'https://github.com/chimkenchrls');
  assert.equal(safeUrl('  https://x.dev  '), 'https://x.dev');
  assert.equal(safeUrl('mailto:a@b.c'), 'mailto:a@b.c');
  for (const bad of [null, undefined, '', 'null', 'javascript:alert(1)', 'www.site.com', 'https://', 'https://has space.com']) {
    assert.equal(safeUrl(bad), null, `expected null for ${String(bad)}`);
  }
});

test('computeTiles replicates object-fit: cover for a portrait image', () => {
  const tiles = computeTiles(8, 639, 780);
  assert.equal(tiles.length, 64);
  close(tiles[0].top, 0);
  close(tiles[0].left, 0);
  close(tiles[0].size, 12.5);
  close(tiles[0].bgSize[0], 800);
  close(tiles[0].bgSize[1], (780 / 639) * 800);
  close(tiles[0].bgPos[0], 0);
  const topEdge = -((780 / 639) - 1) / 2;
  close(tiles[0].bgPos[1], (topEdge / (0.125 - 780 / 639)) * 100);
  close(tiles[7].bgPos[0], 100);
  close(tiles[63].top, 87.5);
  close(tiles[63].left, 87.5);
});

test('computeTiles on a square image maps corners to 0% and 100%', () => {
  const tiles = computeTiles(2, 100, 100);
  assert.equal(tiles.length, 4);
  close(tiles[0].bgPos[0], 0);
  close(tiles[0].bgPos[1], 0);
  close(tiles[3].bgPos[0], 100);
  close(tiles[3].bgPos[1], 100);
  close(tiles[3].bgSize[0], 200);
});

test('revealDelays is a shuffled permutation of step multiples', () => {
  let seed = 1;
  const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const delays = revealDelays(64, 6, rng);
  assert.equal(delays.length, 64);
  assert.deepEqual([...delays].sort((a, b) => a - b), Array.from({ length: 64 }, (_, i) => i * 6));
  assert.notDeepEqual(delays, Array.from({ length: 64 }, (_, i) => i * 6));
  assert.deepEqual(revealDelays(4, 0, rng), [0, 0, 0, 0]);
});

test('isTypingTarget detects form fields and contenteditable', () => {
  assert.equal(isTypingTarget({ tagName: 'INPUT' }), true);
  assert.equal(isTypingTarget({ tagName: 'TEXTAREA' }), true);
  assert.equal(isTypingTarget({ tagName: 'SELECT' }), true);
  assert.equal(isTypingTarget({ tagName: 'DIV', isContentEditable: true }), true);
  assert.equal(isTypingTarget({ tagName: 'BUTTON' }), false);
  assert.equal(isTypingTarget(null), false);
});

test('resolveShortcut maps plain keys', () => {
  const k = (key, extra = {}) => ({ key, code: '', altKey: false, ctrlKey: false, metaKey: false, ...extra });
  assert.deepEqual(resolveShortcut(k('1')), { type: 'jump', id: 'home' });
  assert.deepEqual(resolveShortcut(k('5')), { type: 'jump', id: 'certifications' });
  assert.deepEqual(resolveShortcut(k('t')), { type: 'theme' });
  assert.deepEqual(resolveShortcut(k('T')), { type: 'theme' });
  assert.deepEqual(resolveShortcut(k('/')), { type: 'search' });
  assert.deepEqual(resolveShortcut(k('Escape')), { type: 'close' });
  assert.equal(resolveShortcut(k('6')), null);
  assert.equal(resolveShortcut(k('x')), null);
});

test('resolveShortcut handles Alt+K on every layout, including macOS', () => {
  assert.deepEqual(resolveShortcut({ key: 'k', code: 'KeyK', altKey: true }), { type: 'quick-jump' });
  assert.deepEqual(resolveShortcut({ key: '˚', code: 'KeyK', altKey: true }), { type: 'quick-jump' });
  assert.deepEqual(resolveShortcut({ key: 'k', code: 'KeyK', altKey: true }, true), { type: 'quick-jump' });
});

test('resolveShortcut ignores keys while typing or with modifiers', () => {
  assert.equal(resolveShortcut({ key: 't' }, true), null);
  assert.equal(resolveShortcut({ key: '1' }, true), null);
  assert.equal(resolveShortcut({ key: '/' }, true), null);
  assert.equal(resolveShortcut({ key: '1', ctrlKey: true }), null);
  assert.equal(resolveShortcut({ key: '1', metaKey: true }), null);
  assert.equal(resolveShortcut({ key: 't', altKey: true }), null);
  assert.equal(resolveShortcut({ key: 'k', code: 'KeyK', altKey: true, ctrlKey: true }), null);
  assert.deepEqual(resolveShortcut({ key: 'Escape' }, true), { type: 'close' });
});

test('filterSections matches label, id, or key', () => {
  assert.equal(filterSections(SECTIONS, '').length, 5);
  assert.equal(filterSections(SECTIONS, '   ').length, 5);
  assert.deepEqual(filterSections(SECTIONS, 'PRO').map((s) => s.id), ['projects']);
  assert.deepEqual(filterSections(SECTIONS, '3').map((s) => s.id), ['stack']);
  assert.deepEqual(filterSections(SECTIONS, 'zzz'), []);
});

test('validateData flags the mistakes a later edit is likely to make', () => {
  const good = require('../assets/data.js');
  const bad = JSON.parse(JSON.stringify(good));
  bad.profile.linkedin = 'null';
  bad.projects[0].links.source = 'javascript:alert(1)';
  bad.projects[1].status = 'wip';
  bad.projects[2].description = '';
  bad.stack[0].items[0].name = '';
  bad.certifications.push({ title: 'AZ-900', issuer: '', date: '2027', link: null });
  const errors = validateData(bad);
  for (const fragment of ['profile.linkedin', 'projects[0].links.source', 'projects[1].status', 'projects[2].description', 'stack[0].items[0].name', 'certifications[0]']) {
    assert.ok(errors.some((e) => e.startsWith(fragment)), `no error for ${fragment}: ${errors.join(' | ')}`);
  }
  assert.deepEqual(validateData(null), ['data: missing']);
});

test('joinParts drops missing pieces instead of printing undefined', () => {
  const { joinParts } = require('../script.js');
  assert.equal(joinParts(['AWS', '2027']), 'AWS · 2027');
  assert.equal(joinParts([undefined, '2027']), '2027');
  assert.equal(joinParts([null, '', '  ']), '');
});
