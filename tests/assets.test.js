const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

test('every relative src/href in index.html exists', () => {
  const html = read('index.html');
  const refs = [...html.matchAll(/\s(?:src|href)="(\.\/[^"#?]+)"/g)].map((m) => m[1]);
  assert.ok(refs.length >= 5, 'expected several local references');
  for (const ref of refs) assert.ok(fs.existsSync(path.join(ROOT, ref)), `${ref} missing`);
});

test('every url() in style.css exists', () => {
  const css = read('style.css');
  const refs = [...css.matchAll(/url\("(\.\/[^"]+)"\)/g)].map((m) => m[1]);
  assert.ok(refs.length >= 10, 'expected icon and font urls');
  for (const ref of refs) assert.ok(fs.existsSync(path.join(ROOT, ref)), `${ref} missing`);
});

test('no absolute-root paths that would break GitHub Pages subdirectory hosting', () => {
  assert.doesNotMatch(read('index.html'), /\s(?:src|href)="\/(?!\/)/);
  assert.doesNotMatch(read('style.css'), /url\("\/(?!\/)/);
});

test('index.html has one section per nav target', () => {
  const html = read('index.html');
  for (const id of ['home', 'about', 'stack', 'projects', 'certifications']) {
    assert.match(html, new RegExp(`<section[^>]*id="${id}"`), `section #${id} missing`);
    assert.match(html, new RegExp(`class="nav-link" href="#${id}"`), `nav link #${id} missing`);
  }
});

test('hero photo is web-sized (it is the LCP element)', () => {
  const bytes = fs.statSync(path.join(ROOT, 'assets', 'profile.jpg')).size;
  assert.ok(bytes < 200 * 1024, `profile.jpg is ${Math.round(bytes / 1024)} KB`);
});
