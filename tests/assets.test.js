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
  for (const id of ['home', 'about', 'stack', 'projects', 'certifications', 'contact']) {
    assert.match(html, new RegExp(`<section[^>]*id="${id}"`), `section #${id} missing`);
    assert.match(html, new RegExp(`<a[^>]*class="nav-link"[^>]*href="#${id}"`), `nav link #${id} missing`);
  }
});

test('hero photo is web-sized (it is the LCP element)', () => {
  const bytes = fs.statSync(path.join(ROOT, 'assets', 'profile.jpg')).size;
  assert.ok(bytes < 200 * 1024, `profile.jpg is ${Math.round(bytes / 1024)} KB`);
});

test('stats row is removed and the main column is centered', () => {
  assert.doesNotMatch(read('index.html'), /data-render="stats"/);
  assert.doesNotMatch(read('style.css'), /\.stats?\b/);
  assert.match(read('style.css'), /\.main > \* \{ max-width: 880px; margin-inline: auto; \}/);
});

test('sidebar labels are in title case, not forced lowercase', () => {
  const css = read('style.css');
  const navRule = css.slice(css.indexOf('.nav-link,\n.quick-jump-trigger {'), css.indexOf('.nav-link:hover'));
  assert.doesNotMatch(navRule, /text-transform:\s*lowercase/);
  const html = read('index.html');
  for (const text of ['Play chimken', '>Kenneth Charles</a>']) {
    assert.ok(html.includes(text), `missing "${text}"`);
  }
});

test('GitHub contributions panel sits inside the Stack section', () => {
  const html = read('index.html');
  const stack = html.slice(html.indexOf('id="stack"'), html.indexOf('id="projects"'));
  assert.match(stack, /class="github-panel"/);
});

test('quick jump is replaced by the chimken game', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /quick-jump/);
  assert.match(html, /<dialog[^>]*class="game"/);
  assert.match(html, /<canvas[^>]*class="game-canvas"/);
  assert.match(html, /class="game-trigger"[\s\S]*?Play chimken/);
  assert.match(html, /class="topbar-game"/, 'mobile top bar needs a game button');
  assert.match(html, /class="game-close"/, 'touch users need a close button');
  assert.ok(fs.existsSync(path.join(ROOT, 'assets', 'icons', 'chimken.svg')));
  assert.doesNotMatch(read('style.css'), /quick-jump/);
});

test('sidebar shows the full name on desktop; rail keeps the KC mark', () => {
  const html = read('index.html');
  assert.match(html, /class="brand-name"[^>]*>Kenneth Charles Valdez</);
  assert.match(html, /<a[^>]*class="brand"[^>]*aria-label="Kenneth Charles Valdez/);
  assert.match(html, /class="brand-mark"[^>]*>KC</);
  assert.match(html, /class="topbar-brand"[^>]*>Kenneth Charles</);
});

test('"Outside the IDE" is the last section before the footer and is not in the nav', () => {
  const html = read('index.html');
  const outside = html.indexOf('id="outside"');
  assert.ok(outside > html.indexOf('id="certifications"'), 'after certifications');
  assert.ok(outside < html.indexOf('<footer'), 'before the footer');
  assert.match(html, /Outside the IDE/);
  assert.doesNotMatch(html, /href="#outside"/);
  assert.match(html, /data-render="outside"/);
  assert.doesNotMatch(html, /deck-caption/, 'no per-photo caption');
});

test('photo deck is its own stacking context (cards never cover the drawer or top bar)', () => {
  const css = read('style.css');
  const deckRule = css.slice(css.indexOf('\n.deck {'), css.indexOf('}', css.indexOf('\n.deck {')));
  assert.match(deckRule, /isolation:\s*isolate/);
});

test('"Get in touch" terminal is the last section, with a no-JS contact fallback', () => {
  const html = read('index.html');
  const contact = html.indexOf('id="contact"');
  assert.ok(contact > html.indexOf('id="outside"') && contact < html.indexOf('<footer'));
  assert.match(html, /Get in touch/);
  const section = html.slice(contact, html.indexOf('<footer'));
  assert.match(section, /class="terminal-screen"[^>]*role="log"/);
  assert.match(section, /mailto:charleskenneth129@gmail\.com/, 'email is readable without JavaScript');
  assert.match(section, /https:\/\/github\.com\/chimkenchrls/);
  for (const chip of ['email', 'github', 'whoami', 'projects', 'help']) {
    assert.match(section, new RegExp(`data-command="${chip}"`), `chip ${chip}`);
  }
  assert.ok(fs.existsSync(path.join(ROOT, 'assets', 'icons', 'contact.svg')));
});

test('sidebar has no visible shortcut badges; keys live in hover tooltips', () => {
  const html = read('index.html');
  const sidebar = html.slice(html.indexOf('<aside'), html.indexOf('</aside>'));
  assert.doesNotMatch(sidebar, /<kbd/, 'no kbd badges in the sidebar');
  for (const [id, label, key] of [['home', 'Home', 1], ['about', 'About', 2], ['stack', 'Stack', 3], ['projects', 'Projects', 4], ['certifications', 'Certifications', 5], ['contact', 'Contact', 6]]) {
    assert.match(sidebar, new RegExp(`data-section="${id}"\\s+title="${label} \\(${key}\\)"`), `${label} tooltip`);
  }
  assert.match(sidebar, /title="Play chimken \(Alt \+ K\)"/);
  assert.match(sidebar, /title="Toggle theme \(T\)"/);
  assert.doesNotMatch(read('style.css'), /\.kbd\b/, 'unused badge styles removed');
});
