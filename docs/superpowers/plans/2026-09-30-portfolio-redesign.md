# Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the static portfolio with Kenneth's real content, the React portfolio's visual style and animations, and a GitHub Actions check-and-deploy pipeline.

**Architecture:** `index.html` is a static shell. The hero name, title, bio and nav are hard-coded in it. Every list section is an empty container marked `data-render="…"`. `assets/data.js` defines one `const PORTFOLIO_DATA`. `script.js` is one IIFE: pure helpers at the top (exported to Node for `node:test`), then DOM modules (render, theme, layout, nav, quickJump, keyboard, clipboard, reveal, pixelPhoto, visitors). Icons are local SVG files drawn with CSS `mask-image`, so they follow the theme color.

**Tech Stack:** HTML5, CSS3 (custom properties, grid, flex, View Transitions), vanilla ES2020, `node:test` (built into Node 22, no npm install), GitHub Actions + GitHub Pages, `html-validate` and `lychee` in CI only.

**Spec:** `docs/superpowers/specs/2026-09-30-portfolio-redesign-design.md`

## Global Constraints

- No frameworks, no npm/yarn in the site, no build step. `npx`/Actions tooling runs only in CI.
- Every internal reference uses a relative path (`./style.css`, `./assets/…`).
- Fonts: Geist and Geist Mono from Google Fonts `<link>`. Geist Pixel self-hosted at `./assets/fonts/GeistPixel-Square.woff2`.
- Light tokens: `--bg #ffffff`, `--bg-alt #fafafa`, `--fg #0a0a0a`, `--fg-muted #6d6d72`, `--border #e4e4e7`. Dark: `rgb(12, 12, 15)`, `#18181b`, `#fafafa`, `#a6a6ad`, `#27272a`.
- Breakpoints: mobile `< 640px` (drawer), tablet `640–1024px` (64px icon rail), desktop `> 1024px` (260px sidebar, collapsible).
- `script.js` adds nothing to the global scope. `assets/data.js` adds exactly `PORTFOLIO_DATA`.
- Nothing is invented. Missing content is `null` in data and renders as a "coming soon" state. No resume. The footer is exactly `© <year> Kenneth Charles`.
- All motion is disabled under `prefers-reduced-motion: reduce`.
- Storage access is always wrapped in try/catch.
- Work happens on branch `redesign`. `main` only receives the finished PR.

**Deliberate refinements of the spec** (same behavior, simpler mechanism):
- Stack icons are files in `assets/icons/stack/<slug>.svg` (simple-icons v16.33.0, CC0), referenced by slug in data, instead of SVG strings pasted into `data.js`.
- `PORTFOLIO_DATA.profile` holds only fields JS renders (email, github, linkedin, discord). Name, title, location and bio live only in `index.html`, so there's a single source for each piece of text.
- Rail tooltips use the native `title` attribute. A CSS tooltip would be clipped by the sidebar's scroll container.
- On mobile the drawer opens below the sticky top bar, so the hamburger stays clickable as the close button.

## Review Focus

1. **Blocked storage** (private windows, cookies disabled): the page must render, the theme must still toggle (just not persist), and there must be no uncaught errors. Pinned by the Task 5 manual check with `dom.storage.enabled=false`.
2. **Clipboard unavailable or denied** (non-secure origin, permission denied): clicking the email must select the address and show `press ctrl+c`. Pinned by the Task 5 manual check that deletes `navigator.clipboard`.
3. **Visitor API down, slow, or returning junk:** the row stays hidden with no visible error. Pinned by `padCount` unit tests (null/NaN/garbage → `null`) in Task 2 and the Task 6 manual block-URL check.
4. **Shortcuts pressed while typing or with modifiers:** typing "t" in quick-jump must not switch the theme, Ctrl+1 must stay the browser's tab switch, and macOS Alt+K (`key: "˚"`) must still open quick jump. Pinned by `resolveShortcut` unit tests in Task 2.
5. **Kenneth later edits `data.js` badly** (`""`, `"null"`, `javascript:` URLs, a missing field): the page must not print `undefined` or link to `null`. Pinned by `safeUrl`/`validateData` unit tests in Task 2 and the real-data test in Task 1.

---

### Task 1: Branch, content data, and assets

**Files:**
- Create: `assets/data.js`, `tests/data.test.js`
- Create: `assets/profile.jpg`, `assets/light.jpg` (copied), `assets/fonts/GeistPixel-Square.woff2`, `assets/fonts/OFL.txt` (downloaded)
- Create: `assets/icons/stack/*.svg` (24 downloaded), `assets/icons/{stack,pin,book,cloud,briefcase}.svg` (new)

**Interfaces:**
- Produces: global `PORTFOLIO_DATA` with keys `profile{email,github,linkedin,discord}`, `stats[{value,label}]`, `highlights[{icon,label}]`, `experience[{title,org,dates,current,bullets[]}]`, `education[{school,degree,dates,current}]`, `stack[{category,items[{name,icon}]}]`, `projects[{title,meta,status,description,tags[],links{source,live}}]`, `certifications[{title,issuer,date,link}]`, `certificationsPending`. In Node, `require('../assets/data.js')` returns the same object.

- [ ] **Step 1: Create the branch**

```bash
cd /mnt/heavy-data/my-portfolio
git switch -c redesign
```

- [ ] **Step 2: Copy photos, download font and icons**

```bash
cd /mnt/heavy-data/my-portfolio
cp /mnt/myfiles/portfolio/public/profile.jpg assets/profile.jpg
cp /mnt/myfiles/portfolio/public/light.jpg assets/light.jpg
mkdir -p assets/fonts assets/icons/stack
curl -fsSL -o assets/fonts/GeistPixel-Square.woff2 https://cdn.jsdelivr.net/gh/vercel/geist-pixel-font@main/fonts/webfonts/GeistPixel-Square.woff2
curl -fsSL -o assets/fonts/OFL.txt https://cdn.jsdelivr.net/gh/vercel/geist-pixel-font@main/OFL.txt
for s in docker caddy githubactions letsencrypt tailscale wireguard nodedotjs openjdk python php express mysql jsonwebtokens axios typescript nextdotjs react tailwindcss vite googlefonts ultralytics git github vitest; do
  curl -fsSL -o "assets/icons/stack/$s.svg" "https://cdn.jsdelivr.net/npm/simple-icons@16.33.0/icons/$s.svg" || echo "FAILED $s"
done
file assets/fonts/GeistPixel-Square.woff2
ls assets/icons/stack | wc -l
```
Expected: `Web Open Font Format (Version 2)`, `24`, and no `FAILED` lines. If a slug fails, set that item's `icon` to `null` in Step 4.

- [ ] **Step 3: Create the five new UI icons** (Feather style, matching the existing `assets/icons/*.svg`)

`assets/icons/stack.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="12 2 2 7 12 12 22 7 12 2"/>
  <polyline points="2 17 12 22 22 17"/>
  <polyline points="2 12 12 17 22 12"/>
</svg>
```
`assets/icons/pin.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
  <circle cx="12" cy="10" r="3"/>
</svg>
```
`assets/icons/book.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
</svg>
```
`assets/icons/cloud.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
</svg>
```
`assets/icons/briefcase.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
</svg>
```

- [ ] **Step 4: Write the failing data test**

`tests/data.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

test('data.js exports PORTFOLIO_DATA with every section', () => {
  const data = require('../assets/data.js');
  for (const key of ['profile', 'stats', 'highlights', 'experience', 'education', 'stack', 'projects', 'certifications', 'certificationsPending']) {
    assert.ok(key in data, `missing ${key}`);
  }
});

test('content matches the approved spec', () => {
  const data = require('../assets/data.js');
  assert.equal(data.profile.email, 'charleskenneth129@gmail.com');
  assert.equal(data.profile.linkedin, null);
  assert.deepEqual(data.projects.map((p) => [p.title, p.status]), [
    ['AmIgo', 'done'], ['Thready', 'in-progress'], ['Ambiancy', 'coming-soon'],
  ]);
  assert.equal(data.projects[2].description, null);
  assert.deepEqual(data.stack.map((g) => g.category), [
    'DevOps & Cloud', 'Security & Identity', 'Backend', 'Frontend', 'AI & Machine Learning', 'Developer Tools',
  ]);
  assert.equal(data.certifications.length, 0);
  assert.equal(data.stats[3].label, 'projects built & building');
});

test('every stack icon slug has a file on disk', () => {
  const data = require('../assets/data.js');
  for (const group of data.stack) {
    for (const item of group.items) {
      if (item.icon === null) continue;
      const file = path.join(ROOT, 'assets', 'icons', 'stack', `${item.icon}.svg`);
      assert.ok(fs.existsSync(file), `${item.name}: ${file} missing`);
    }
  }
});

test('every highlight icon has a file on disk', () => {
  const data = require('../assets/data.js');
  for (const h of data.highlights) {
    assert.ok(fs.existsSync(path.join(ROOT, 'assets', 'icons', `${h.icon}.svg`)), `${h.icon}.svg missing`);
  }
});
```

- [ ] **Step 5: Run it and confirm it fails**

Run: `node --test tests/data.test.js`
Expected: FAIL with `Cannot find module '../assets/data.js'`.

- [ ] **Step 6: Write `assets/data.js`**

```js
/* ==========================================================================
   Portfolio content — the only file to edit when updating the site.
   - Use null (never "") for anything you don't have yet; the page shows a
     "coming soon" state instead.
   - URLs must start with https://.
   - Stack icons are slugs of files in ./assets/icons/stack/ (simple-icons).
   - After editing, run: node --test tests/*.test.js
   ========================================================================== */
const PORTFOLIO_DATA = {
  profile: {
    email: 'charleskenneth129@gmail.com',
    github: 'https://github.com/chimkenchrls',
    linkedin: null,
    discord: 'de4dicated',
  },

  stats: [
    { value: 'Champion', label: 'CodeFest Tagisan ng Talino 2026' },
    { value: '2023', label: 'coding since' },
    { value: '4th yr', label: 'BS Computer Science' },
    { value: '3', label: 'projects built & building' },
  ],

  highlights: [
    { icon: 'book', label: '4th-Year BS Computer Science' },
    { icon: 'cloud', label: 'Aspiring DevOps Engineer' },
    { icon: 'briefcase', label: 'Open to OJT / Internship' },
  ],

  experience: [
    {
      title: 'BS Computer Science',
      org: 'STI College Lucena',
      dates: '2023 — 2027',
      current: true,
      bullets: ['Champion in Local CodeFest Competition Tagisan ng Talino 2026.'],
    },
    {
      title: 'OJT / Internship',
      org: 'Actively Seeking',
      dates: '2026 — Present',
      current: true,
      bullets: ['Currently seeking internship opportunities to gain practical experience and contribute to real-world projects.'],
    },
    {
      title: 'Capstone Project',
      org: 'STI College Lucena',
      dates: '2026 — Present',
      current: true,
      bullets: ['Thready: An AI Enhanced Web-Based Production Management System with Computer Vision for Garments Monitoring for Shiela and Joel Garments'],
    },
  ],

  education: [
    { school: 'STI College Lucena', degree: 'Bachelor of Science in Computer Science', dates: '2023 — Current', current: true },
    { school: 'Sariaya Institute Inc.', degree: 'Senior High School', dates: '2021 — 2023', current: false },
    { school: 'Sariaya Institute Inc.', degree: 'Junior High School', dates: '2017 — 2023', current: false },
    { school: 'Jose Rizal Elementary School', degree: 'Elementary', dates: '2011 — 2017', current: false },
  ],

  stack: [
    {
      category: 'DevOps & Cloud',
      items: [
        { name: 'Docker + Compose', icon: 'docker' },
        { name: 'Azure', icon: null },
        { name: 'Caddy 2', icon: 'caddy' },
        { name: 'GitHub Actions', icon: 'githubactions' },
        { name: "Let's Encrypt (Lego ACME client)", icon: 'letsencrypt' },
      ],
    },
    {
      category: 'Security & Identity',
      items: [
        { name: 'Tailscale', icon: 'tailscale' },
        { name: 'WireGuard (wg-easy)', icon: 'wireguard' },
      ],
    },
    {
      category: 'Backend',
      items: [
        { name: 'Node.js 20 (Alpine)', icon: 'nodedotjs' },
        { name: 'Java', icon: 'openjdk' },
        { name: 'Python', icon: 'python' },
        { name: 'PHP', icon: 'php' },
        { name: 'Express 5', icon: 'express' },
        { name: 'MySQL 8 (mysql2)', icon: 'mysql' },
        { name: 'JWT', icon: 'jsonwebtokens' },
        { name: 'Axios', icon: 'axios' },
      ],
    },
    {
      category: 'Frontend',
      items: [
        { name: 'TypeScript', icon: 'typescript' },
        { name: 'Next.js 16 (App Router)', icon: 'nextdotjs' },
        { name: 'React 18.3', icon: 'react' },
        { name: 'Tailwind CSS 3', icon: 'tailwindcss' },
        { name: 'Vite', icon: 'vite' },
        { name: 'Google Fonts (Rubik)', icon: 'googlefonts' },
      ],
    },
    {
      category: 'AI & Machine Learning',
      items: [{ name: 'Ultralytics (YOLOv8)', icon: 'ultralytics' }],
    },
    {
      category: 'Developer Tools',
      items: [
        { name: 'Git', icon: 'git' },
        { name: 'GitHub', icon: 'github' },
        { name: 'VS Code', icon: null },
        { name: 'Vitest', icon: 'vitest' },
        { name: 'Playwright', icon: null },
        { name: 'Husky', icon: null },
      ],
    },
  ],

  projects: [
    {
      title: 'AmIgo',
      meta: '2026',
      status: 'done',
      description: "AmIgo is a Discord AI bot that acts like a chaotic, laid-back group chat friend — chatting in casual Taglish when mentioned, replied to, or called by name. Powered by Google's Gemini API with per-channel conversation memory, and rounding that out with a photo-roasting command, an English tutor mode, and a persistent-facts system so it can remember and recall things about the server over time.",
      tags: ['Discord.js', 'TypeScript', 'SQLite3', 'Google Gemini API'],
      links: { source: null, live: null },
    },
    {
      title: 'Thready',
      meta: 'in progress',
      status: 'in-progress',
      description: 'AI-enhanced, web-based production management system with computer vision for garment monitoring, built as a capstone project for Shiela and Joel Garments.',
      tags: ['JavaScript'],
      links: { source: null, live: null },
    },
    {
      title: 'Ambiancy',
      meta: 'coming soon',
      status: 'coming-soon',
      description: null,
      tags: ['Python'],
      links: { source: null, live: null },
    },
  ],

  certifications: [],
  certificationsPending: 'Currently working toward certifications. Check back soon.',
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PORTFOLIO_DATA;
}
```

- [ ] **Step 7: Run the tests and confirm they pass**

Run: `node --test tests/data.test.js`
Expected: `# pass 4`, `# fail 0`.

- [ ] **Step 8: Commit**

```bash
git add assets/data.js assets/profile.jpg assets/light.jpg assets/fonts assets/icons tests/data.test.js
git commit -m "feat: add real portfolio content data and assets

"
```

---

### Task 2: Pure helpers in `script.js` (unit-tested)

**Files:**
- Replace: `script.js` (whole file; the old script targets the old markup)
- Create: `tests/helpers.test.js`
- Modify: `tests/data.test.js` (append the `validateData` check)

**Interfaces:**
- Produces (Node `require('../script.js')` and in-IIFE constants):
  - `SECTIONS: {id, label, key}[]` for `home/about/stack/projects/certifications`, keys `'1'`–`'5'`
  - `padCount(value: number|string, width = 4): string|null`
  - `safeUrl(url: unknown): string|null`, which accepts only `https?://` or `mailto:`
  - `computeTiles(grid, imageWidth, imageHeight): {top,left,size,bgSize:[w,h],bgPos:[x,y]}[]`, with percentages
  - `revealDelays(count, stepMs, random = Math.random): number[]`, a delay per tile index
  - `isTypingTarget(el): boolean`
  - `resolveShortcut(event, typing = false): {type:'close'|'quick-jump'|'search'|'theme'} | {type:'jump', id} | null`
  - `filterSections(sections, query): section[]`
  - `validateData(data): string[]` (empty means valid)

- [ ] **Step 1: Write the failing tests**

`tests/helpers.test.js`:
```js
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
```

Append to `tests/data.test.js`:
```js
test('the real data passes validateData', () => {
  const data = require('../assets/data.js');
  const { validateData } = require('../script.js');
  assert.deepEqual(validateData(data), []);
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `node --test tests/*.test.js`
Expected: FAIL. The old `script.js` exports nothing, so the imports are `undefined` (`TypeError: ... is not a function`), or it throws `document is not defined`.

- [ ] **Step 3: Replace `script.js` with the helpers section**

```js
/**
 * Kenneth Charles Valdez — Portfolio
 * Vanilla ES2020 in a single IIFE; adds nothing to the global scope.
 * Content comes from PORTFOLIO_DATA (./assets/data.js).
 * Section 1 is pure (no DOM) and unit-tested: node --test tests/*.test.js
 */
(() => {
  'use strict';

  /* ==========================================================================
     1. Constants & pure helpers
     ========================================================================== */

  const SECTIONS = [
    { id: 'home', label: 'Home', key: '1' },
    { id: 'about', label: 'About', key: '2' },
    { id: 'stack', label: 'Stack', key: '3' },
    { id: 'projects', label: 'Projects', key: '4' },
    { id: 'certifications', label: 'Certifications', key: '5' },
  ];

  const PROJECT_STATUSES = ['done', 'in-progress', 'coming-soon'];

  const padCount = (value, width = 4) => {
    if (typeof value !== 'number' && typeof value !== 'string') return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return null;
    return String(Math.max(0, n)).padStart(width, '0');
  };

  const safeUrl = (url) => {
    if (typeof url !== 'string') return null;
    const trimmed = url.trim();
    return /^(https?:\/\/|mailto:)\S+$/i.test(trimmed) ? trimmed : null;
  };

  // Slices one image across a grid×grid set of tiles while replicating
  // `object-fit: cover` (uniform scale, centred crop) for a square box.
  const computeTiles = (grid, imageWidth, imageHeight) => {
    const scale = 1 / Math.min(imageWidth, imageHeight);
    const renderedW = imageWidth * scale;
    const renderedH = imageHeight * scale;
    const leftEdge = -(renderedW - 1) / 2;
    const topEdge = -(renderedH - 1) / 2;
    const size = 1 / grid;
    const tiles = [];
    for (let i = 0; i < grid * grid; i += 1) {
      const top = Math.floor(i / grid) * size;
      const left = (i % grid) * size;
      tiles.push({
        top: top * 100,
        left: left * 100,
        size: size * 100,
        bgSize: [renderedW * grid * 100, renderedH * grid * 100],
        bgPos: [
          ((leftEdge - left) / (size - renderedW)) * 100 + 0,
          ((topEdge - top) / (size - renderedH)) * 100 + 0,
        ],
      });
    }
    return tiles;
  };

  // Shuffled reveal order → delay (ms) for each tile index.
  const revealDelays = (count, stepMs, random = Math.random) => {
    const order = Array.from({ length: count }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const delays = new Array(count);
    order.forEach((tileIndex, position) => { delays[tileIndex] = position * stepMs; });
    return delays;
  };

  const isTypingTarget = (el) => {
    if (!el) return false;
    if (el.isContentEditable) return true;
    const tag = String(el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select';
  };

  const resolveShortcut = (event, typing = false) => {
    const key = String(event.key || '');
    if (key === 'Escape') return { type: 'close' };
    if (event.altKey && !event.ctrlKey && !event.metaKey
      && (event.code === 'KeyK' || key.toLowerCase() === 'k')) {
      return { type: 'quick-jump' };
    }
    if (typing || event.altKey || event.ctrlKey || event.metaKey) return null;
    if (key === '/') return { type: 'search' };
    if (key === 't' || key === 'T') return { type: 'theme' };
    const section = SECTIONS.find((s) => s.key === key);
    return section ? { type: 'jump', id: section.id } : null;
  };

  const filterSections = (sections, query) => {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return sections.slice();
    return sections.filter((s) => s.label.toLowerCase().includes(q) || s.id.includes(q) || s.key === q);
  };

  const validateData = (data) => {
    if (!data || typeof data !== 'object') return ['data: missing'];
    const errors = [];
    const isText = (v) => typeof v === 'string' && v.trim() !== '';
    const isOptionalText = (v) => v === null || isText(v);
    const isOptionalUrl = (v) => v === null || safeUrl(v) !== null;
    const checkList = (name, list, check) => {
      if (!Array.isArray(list)) { errors.push(`${name}: must be an array`); return; }
      list.forEach((item, i) => check(item || {}, `${name}[${i}]`));
    };

    const profile = data.profile;
    if (!profile) {
      errors.push('profile: missing');
    } else {
      if (!isText(profile.email)) errors.push('profile.email: required text');
      ['github', 'linkedin'].forEach((k) => {
        if (!isOptionalUrl(profile[k])) errors.push(`profile.${k}: must be an https URL or null`);
      });
      if (!isOptionalText(profile.discord)) errors.push('profile.discord: text or null');
    }

    checkList('stats', data.stats, (s, p) => {
      if (!isText(s.value) || !isText(s.label)) errors.push(`${p}: value and label required`);
    });
    checkList('highlights', data.highlights, (h, p) => {
      if (!isText(h.icon) || !isText(h.label)) errors.push(`${p}: icon and label required`);
    });
    checkList('experience', data.experience, (e, p) => {
      if (!isText(e.title) || !isText(e.org) || !isText(e.dates)) errors.push(`${p}: title, org, dates required`);
      if (!Array.isArray(e.bullets)) errors.push(`${p}.bullets: must be an array`);
    });
    checkList('education', data.education, (e, p) => {
      if (!isText(e.school) || !isText(e.degree) || !isText(e.dates)) errors.push(`${p}: school, degree, dates required`);
    });
    checkList('stack', data.stack, (g, p) => {
      if (!isText(g.category)) errors.push(`${p}.category: required text`);
      checkList(`${p}.items`, g.items, (item, ip) => {
        if (!isText(item.name)) errors.push(`${ip}.name: required text`);
        if (!isOptionalText(item.icon)) errors.push(`${ip}.icon: slug or null`);
      });
    });
    checkList('projects', data.projects, (pr, p) => {
      if (!isText(pr.title)) errors.push(`${p}.title: required text`);
      if (!isText(pr.meta)) errors.push(`${p}.meta: required text`);
      if (!PROJECT_STATUSES.includes(pr.status)) errors.push(`${p}.status: one of ${PROJECT_STATUSES.join(', ')}`);
      if (!isOptionalText(pr.description)) errors.push(`${p}.description: text or null`);
      if (!Array.isArray(pr.tags)) errors.push(`${p}.tags: must be an array`);
      const links = pr.links || {};
      ['source', 'live'].forEach((k) => {
        if (links[k] !== undefined && !isOptionalUrl(links[k])) errors.push(`${p}.links.${k}: https URL or null`);
      });
    });
    checkList('certifications', data.certifications, (c, p) => {
      if (!isText(c.title) || !isText(c.issuer) || !isText(c.date)) errors.push(`${p}: title, issuer, date required`);
      if (c.link !== undefined && !isOptionalUrl(c.link)) errors.push(`${p}.link: https URL or null`);
    });
    if (!isText(data.certificationsPending)) errors.push('certificationsPending: required text');
    return errors;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      SECTIONS, padCount, safeUrl, computeTiles, revealDelays,
      isTypingTarget, resolveShortcut, filterSections, validateData,
    };
  }
  if (typeof document === 'undefined') return;

  /* DOM modules are added below in Tasks 4–6. */
})();
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `node --test tests/*.test.js`
Expected: all pass, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add script.js tests/
git commit -m "feat: add unit-tested pure helpers for the redesign

"
```

---

### Task 3: Static shell (`index.html`) and visual system (`style.css`)

**Files:**
- Replace: `index.html`, `style.css` (whole files)
- Create: `tests/assets.test.js`

**Interfaces:**
- Produces the DOM contract used by Tasks 4–6: `#sidebar`, `.menu-toggle`, `.backdrop`, `.collapse-toggle`, `.nav-link[data-section]`, `.quick-jump-trigger`, `.theme-toggle > .theme-icon + .theme-label`, `[data-copy]` with `[data-copy-label]`, `.visitors[hidden] > .visitors-count`, `.hero-photo`, `[data-render="social|stats|highlights|experience|education|stack|projects|certifications"]`, `.divider`, `.about-bio`, `.chips`, `.timeline-block`, `.list-head`, `dialog.quick-jump > .quick-jump-input + ul.quick-jump-list`, `.sr-status`, `.footer-year`. Section ids match `SECTIONS`.
- Produces CSS state classes: `body.is-rail`, `body.drawer-open`, `.sidebar.is-open`, `.nav-link.is-active`, `.hero-photo.is-revealed`, `.reveal`/`.reveal-visible`, `[data-copy-hint]`, and the `--stagger`, `--delay`, `--ripple-x/y/radius`, `--icon` custom properties.

- [ ] **Step 1: Write the failing asset-reference test**

`tests/assets.test.js`:
```js
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
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --test tests/assets.test.js`
Expected: FAIL. The old HTML has no `#stack` section and the old CSS has no icon `url()`s.

- [ ] **Step 3: Write `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kenneth Charles Valdez — Aspiring DevOps &amp; Cloud Engineer</title>
  <meta name="description" content="Kenneth Charles Valdez — 4th-year BS Computer Science student and aspiring DevOps / Cloud Engineer from Sariaya, Quezon, Philippines. Open to OJT / internship.">
  <meta name="color-scheme" content="light dark">
  <link rel="icon" type="image/svg+xml" href="./assets/logo.svg">
  <script>
    (function () {
      var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      var theme = dark ? 'dark' : 'light';
      try {
        var stored = localStorage.getItem('theme');
        if (stored === 'light' || stored === 'dark') theme = stored;
      } catch (e) { /* storage blocked: keep system preference */ }
      document.documentElement.setAttribute('data-theme', theme);
    })();
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300..700&amp;family=Geist+Mono:wght@400..600&amp;display=swap">
  <link rel="preload" href="./assets/fonts/GeistPixel-Square.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="./style.css">
  <script src="./assets/data.js" defer></script>
  <script src="./script.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to main content</a>

  <header class="topbar">
    <a class="topbar-brand" href="#home">kenneth charles</a>
    <button class="menu-toggle" type="button" aria-controls="sidebar" aria-expanded="false" aria-label="Open navigation">
      <span class="menu-bar"></span>
      <span class="menu-bar"></span>
    </button>
  </header>

  <div class="backdrop" hidden></div>

  <aside class="sidebar" id="sidebar" aria-label="Sidebar">
    <a class="brand" href="#home">
      <span class="brand-mark" aria-hidden="true">KC</span>
      <span class="brand-name">Kenneth Charles Valdez</span>
      <span class="brand-sub">&gt; aspiring devops · cloud</span>
    </a>

    <nav class="nav" aria-label="Sections">
      <p class="nav-label">menu</p>
      <ul class="nav-list">
        <li><a class="nav-link" href="#home" data-section="home" title="Home"><span class="icon icon-home" aria-hidden="true"></span><span class="nav-text">Home</span><kbd class="kbd">1</kbd></a></li>
        <li><a class="nav-link" href="#about" data-section="about" title="About"><span class="icon icon-about" aria-hidden="true"></span><span class="nav-text">About</span><kbd class="kbd">2</kbd></a></li>
        <li><a class="nav-link" href="#stack" data-section="stack" title="Stack"><span class="icon icon-stack" aria-hidden="true"></span><span class="nav-text">Stack</span><kbd class="kbd">3</kbd></a></li>
        <li><a class="nav-link" href="#projects" data-section="projects" title="Projects"><span class="icon icon-projects" aria-hidden="true"></span><span class="nav-text">Projects</span><kbd class="kbd">4</kbd></a></li>
        <li><a class="nav-link" href="#certifications" data-section="certifications" title="Certifications"><span class="icon icon-certifications" aria-hidden="true"></span><span class="nav-text">Certifications</span><kbd class="kbd">5</kbd></a></li>
      </ul>
      <button class="quick-jump-trigger" type="button" aria-haspopup="dialog" title="Quick jump (Alt + K)">
        <span class="icon icon-search" aria-hidden="true"></span><span class="nav-text">quick jump…</span><kbd class="kbd">Alt + K</kbd>
      </button>
    </nav>

    <div class="sidebar-bottom">
      <p class="status" title="Open to OJT / internship"><span class="status-dot" aria-hidden="true"></span><span class="nav-text">open to OJT / internship</span></p>
      <button class="copy-email" type="button" data-copy="charleskenneth129@gmail.com" aria-label="Copy email address charleskenneth129@gmail.com" title="Copy email">
        <span class="icon icon-sm icon-copy" aria-hidden="true"></span><span class="nav-text" data-copy-label>charleskenneth129@gmail.com</span>
      </button>
      <p class="visitors" hidden><span class="meta-label">visitors</span><span class="visitors-count">0000</span></p>
      <div class="sidebar-controls">
        <button class="theme-toggle" type="button" aria-label="Toggle color theme" title="Toggle theme (T)">
          <span class="icon icon-sm icon-sun theme-icon" aria-hidden="true"></span><span class="theme-label">[MODE: LIGHT]</span><kbd class="kbd">T</kbd>
        </button>
        <button class="collapse-toggle" type="button" aria-controls="sidebar" aria-expanded="true" aria-label="Collapse sidebar">[&lt;&lt;]</button>
      </div>
    </div>
  </aside>

  <main class="main" id="main" tabindex="-1">
    <section class="section hero" id="home" aria-labelledby="hero-name">
      <div class="hero-photo" role="img" tabindex="0" aria-label="Black-and-white portrait of Kenneth Charles Valdez. Hover, focus, or tap to reveal a pixelated alternate image.">
        <img class="hero-photo-img" src="./assets/profile.jpg" alt="" width="1336" height="1339">
      </div>
      <div class="hero-text">
        <p class="eyebrow">Building. Learning. Shipping.</p>
        <h1 class="hero-name" id="hero-name">Kenneth Charles Valdez</h1>
        <p class="hero-title">Aspiring DevOps Engineer | Cloud Engineer</p>
        <p class="hero-location"><span class="icon icon-sm icon-pin" aria-hidden="true"></span>Sariaya, Quezon, Philippines</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="mailto:charleskenneth129@gmail.com">Email me</a>
        </div>
        <p class="social" data-render="social"><a href="https://github.com/chimkenchrls" target="_blank" rel="noopener noreferrer">github</a></p>
      </div>
    </section>

    <noscript><p class="noscript-note">Enable JavaScript to see experience, stack, projects, and certifications.</p></noscript>

    <dl class="stats" data-render="stats"></dl>

    <section class="section" id="about" aria-labelledby="about-heading">
      <div class="divider">
        <span class="divider-line"></span>
        <h2 class="divider-label" id="about-heading"><span class="divider-index" aria-hidden="true">02 //</span> About</h2>
        <span class="divider-line"></span>
      </div>
      <div class="about-bio">
        <p>I’m a 4th-year BS Computer Science student at STI College Lucena with a real passion for tech. I got into DevOps and Cloud Engineering because I love figuring out how systems fit together and making deployments smooth and scalable.</p>
        <p>Right now, I’m just building side projects to sharpen my skills. I really enjoy turning rough ideas into practical tools that people can actually use.</p>
      </div>
      <ul class="chips" data-render="highlights"></ul>
      <div class="about-grid">
        <div class="timeline-block">
          <h3 class="block-title">Experience</h3>
          <ul class="rows" data-render="experience"></ul>
        </div>
        <div class="timeline-block">
          <h3 class="block-title">Education</h3>
          <ul class="rows" data-render="education"></ul>
        </div>
      </div>
    </section>

    <section class="section" id="stack" aria-labelledby="stack-heading">
      <div class="divider">
        <span class="divider-line"></span>
        <h2 class="divider-label" id="stack-heading"><span class="divider-index" aria-hidden="true">03 //</span> Stack</h2>
        <span class="divider-line"></span>
      </div>
      <div class="stack-grid" data-render="stack"></div>
    </section>

    <section class="section" id="projects" aria-labelledby="projects-heading">
      <div class="divider">
        <span class="divider-line"></span>
        <h2 class="divider-label" id="projects-heading"><span class="divider-index" aria-hidden="true">04 //</span> Projects</h2>
        <span class="divider-line"></span>
      </div>
      <div class="list-head" aria-hidden="true"><span>project</span><span>status // year</span></div>
      <ol class="project-list" data-render="projects"></ol>
    </section>

    <section class="section" id="certifications" aria-labelledby="certifications-heading">
      <div class="divider">
        <span class="divider-line"></span>
        <h2 class="divider-label" id="certifications-heading"><span class="divider-index" aria-hidden="true">05 //</span> Certifications</h2>
        <span class="divider-line"></span>
      </div>
      <ul class="rows" data-render="certifications"></ul>
    </section>

    <footer class="footer">
      <p>© <span class="footer-year">2026</span> Kenneth Charles</p>
    </footer>
  </main>

  <dialog class="quick-jump" aria-labelledby="quick-jump-title">
    <p class="quick-jump-title" id="quick-jump-title">quick jump</p>
    <label class="visually-hidden" for="quick-jump-input">Filter sections</label>
    <input class="quick-jump-input" id="quick-jump-input" type="text" autocomplete="off" spellcheck="false" placeholder="type a section…">
    <ul class="quick-jump-list"></ul>
    <p class="quick-jump-hint">↑↓ navigate · enter jump · esc close</p>
  </dialog>

  <p class="sr-status visually-hidden" role="status" aria-live="polite"></p>
</body>
</html>
```

- [ ] **Step 4: Write `style.css`**

```css
/* ==========================================================================
   Kenneth Charles Valdez — Portfolio
   1. Fonts        2. Tokens        3. Base          4. Utilities
   5. Icons        6. Layout        7. Sidebar       8. Rail mode
   9. Hero        10. Pixel photo  11. Stats        12. Dividers & sections
   13. About      14. Stack        15. Projects     16. Pending states
   17. Quick jump 18. Footer       19. Motion       20. Responsive
   ========================================================================== */

/* 1. Fonts ================================================================ */
@font-face {
  font-family: "Geist Pixel";
  src: url("./assets/fonts/GeistPixel-Square.woff2") format("woff2");
  font-display: swap;
}

/* 2. Tokens =============================================================== */
:root {
  --bg: #ffffff;
  --bg-alt: #fafafa;
  --fg: #0a0a0a;
  --fg-muted: #6d6d72;
  --border: #e4e4e7;
  --accent: var(--fg);
  --accent-fg: var(--bg);
  --dot: rgba(10, 10, 10, 0.07);
  --status: #16a34a;

  --font-sans: "Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "Geist Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  --font-pixel: "Geist Pixel", "Geist Mono", ui-monospace, monospace;

  --sidebar-w: 260px;
  --rail-w: 64px;
  --topbar-h: 56px;
  --radius: 6px;
  --ease: cubic-bezier(0.2, 0.7, 0.2, 1);
  --t-fast: 150ms;
  --t: 200ms;

  color-scheme: light;
}

:root[data-theme="dark"] {
  --bg: rgb(12, 12, 15);
  --bg-alt: #18181b;
  --fg: #fafafa;
  --fg-muted: #a6a6ad;
  --border: #27272a;
  --dot: rgba(250, 250, 250, 0.06);
  --status: #22c55e;
  color-scheme: dark;
}

/* No-JS fallback: the head script normally sets data-theme. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --bg: rgb(12, 12, 15);
    --bg-alt: #18181b;
    --fg: #fafafa;
    --fg-muted: #a6a6ad;
    --border: #27272a;
    --dot: rgba(250, 250, 250, 0.06);
    --status: #22c55e;
    color-scheme: dark;
  }
}

/* 3. Base ================================================================= */
*, *::before, *::after { box-sizing: border-box; }

[hidden] { display: none !important; }

html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  min-height: 100vh;
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.65;
  color: var(--fg);
  background-color: var(--bg);
  background-image: radial-gradient(var(--dot) 1px, transparent 1px);
  background-size: 20px 20px;
  background-attachment: fixed;
  -webkit-font-smoothing: antialiased;
  transition: background-color var(--t) ease, color var(--t) ease;
}

img { display: block; max-width: 100%; height: auto; }
a { color: inherit; text-decoration: none; }
button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
ul, ol { list-style: none; margin: 0; padding: 0; }
h1, h2, h3, p, dl, dd { margin: 0; }
kbd { font: inherit; }

:focus-visible { outline: 2px solid var(--fg); outline-offset: 2px; }
::selection { background: var(--fg); color: var(--bg); }

/* 4. Utilities ============================================================ */
.visually-hidden {
  position: absolute !important;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.skip-link {
  position: fixed;
  top: 8px;
  left: 8px;
  z-index: 100;
  padding: 8px 12px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--bg);
  background: var(--fg);
  transform: translateY(-200%);
  transition: transform var(--t-fast) ease;
}
.skip-link:focus { transform: translateY(0); }

.kbd {
  display: inline-flex;
  align-items: center;
  padding: 0 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1.8;
  color: var(--fg-muted);
  white-space: nowrap;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
}

.meta-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--fg-muted);
}

.text-link {
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: var(--border);
  transition: text-decoration-color var(--t-fast) ease;
}
.text-link:hover { text-decoration-color: var(--fg); }

.noscript-note {
  margin-bottom: 32px;
  padding: 12px 14px;
  font-family: var(--font-mono);
  font-size: 12px;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
}

/* 5. Icons (local SVGs as masks so they inherit currentColor) ============= */
.icon {
  display: inline-block;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  background-color: currentColor;
  -webkit-mask: var(--icon) center / contain no-repeat;
  mask: var(--icon) center / contain no-repeat;
}
.icon-sm { width: 14px; height: 14px; }

.icon-home { --icon: url("./assets/icons/home.svg"); }
.icon-about { --icon: url("./assets/icons/about.svg"); }
.icon-stack { --icon: url("./assets/icons/stack.svg"); }
.icon-projects { --icon: url("./assets/icons/projects.svg"); }
.icon-certifications { --icon: url("./assets/icons/certifications.svg"); }
.icon-search { --icon: url("./assets/icons/search.svg"); }
.icon-copy { --icon: url("./assets/icons/copy.svg"); }
.icon-sun { --icon: url("./assets/icons/sun.svg"); }
.icon-moon { --icon: url("./assets/icons/moon.svg"); }
.icon-pin { --icon: url("./assets/icons/pin.svg"); }
.icon-book { --icon: url("./assets/icons/book.svg"); }
.icon-cloud { --icon: url("./assets/icons/cloud.svg"); }
.icon-briefcase { --icon: url("./assets/icons/briefcase.svg"); }

/* 6. Layout =============================================================== */
.topbar { display: none; }
.backdrop { display: none; }

.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 28px;
  width: var(--sidebar-w);
  padding: 28px 18px 20px;
  overflow-y: auto;
  background: var(--bg);
  border-right: 1px solid var(--border);
  transition: width var(--t) var(--ease), padding var(--t) var(--ease);
}

.main {
  margin-left: var(--sidebar-w);
  padding: 48px clamp(24px, 5vw, 64px) 32px;
  outline: none;
  transition: margin-left var(--t) var(--ease);
}
.main > * { max-width: 880px; }

/* 7. Sidebar ============================================================== */
.brand { display: flex; flex-direction: column; gap: 4px; }
.brand-mark { display: none; font-family: var(--font-pixel); font-size: 20px; line-height: 1; }
.brand-name { font-family: var(--font-mono); font-size: 13px; font-weight: 600; letter-spacing: 0.02em; }
.brand-sub { font-family: var(--font-mono); font-size: 11px; color: var(--fg-muted); }

.nav { display: flex; flex-direction: column; gap: 6px; }
.nav-label {
  margin-bottom: 4px;
  padding-left: 10px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--fg-muted);
}
.nav-list { display: flex; flex-direction: column; gap: 2px; }

.nav-link,
.quick-jump-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  font-family: var(--font-mono);
  font-size: 12px;
  text-align: left;
  text-transform: lowercase;
  color: var(--fg-muted);
  border: 1px solid transparent;
  border-radius: var(--radius);
  transition: color var(--t-fast) ease, background-color var(--t-fast) ease, border-color var(--t-fast) ease;
}
.nav-link:hover,
.quick-jump-trigger:hover { color: var(--fg); background: var(--bg-alt); }
.nav-link.is-active { color: var(--fg); background: var(--bg-alt); border-color: var(--border); }
.quick-jump-trigger { margin-top: 10px; border-color: var(--border); border-style: dashed; }
.nav-link .kbd,
.quick-jump-trigger .kbd { margin-left: auto; }

.nav-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.sidebar-bottom {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: auto;
  padding-top: 18px;
  font-family: var(--font-mono);
  font-size: 11px;
  border-top: 1px solid var(--border);
}

.status { display: flex; align-items: center; gap: 8px; }
.status-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  background: var(--status);
  border-radius: 50%;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--status) 22%, transparent);
}

.copy-email {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 4px 0;
  text-align: left;
}
.copy-email:hover [data-copy-label] { text-decoration: underline; text-underline-offset: 3px; }

[data-copy-hint]::after {
  content: attr(data-copy-hint);
  margin-left: 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--fg-muted);
  white-space: nowrap;
}

.visitors { display: flex; align-items: baseline; gap: 10px; }
.visitors-count { font-variant-numeric: tabular-nums; }

.sidebar-controls { display: flex; align-items: center; justify-content: space-between; gap: 8px; }

.theme-toggle,
.collapse-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: background-color var(--t-fast) ease;
}
.collapse-toggle { color: var(--fg-muted); }
.theme-toggle:hover,
.collapse-toggle:hover { background: var(--bg-alt); }

/* 8. Rail mode (tablet, or desktop collapsed) — body.is-rail set by JS ===== */
body.is-rail .sidebar { width: var(--rail-w); padding: 20px 10px; align-items: center; }
body.is-rail .main { margin-left: var(--rail-w); }
body.is-rail :is(.brand-name, .brand-sub, .nav-label, .nav-text, .theme-label, .visitors, .sidebar .kbd) { display: none; }
body.is-rail .brand-mark { display: block; }
body.is-rail :is(.nav-link, .quick-jump-trigger, .copy-email, .status) { justify-content: center; padding: 10px; }
body.is-rail .sidebar-controls { flex-direction: column; }

/* 9. Hero ================================================================= */
.section { padding-bottom: 64px; scroll-margin-top: 24px; }

.hero {
  display: flex;
  align-items: center;
  gap: 44px;
  min-height: min(620px, calc(100vh - 96px));
  padding-top: 8px;
}

.hero-text { display: flex; flex-direction: column; gap: 12px; min-width: 0; }

.eyebrow {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--accent);
}

.hero-name {
  font-family: var(--font-pixel);
  font-size: clamp(2.25rem, 4.6vw, 3.75rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.01em;
}

.hero-title {
  font-family: var(--font-mono);
  font-size: clamp(11px, 1.3vw, 14px);
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--fg-muted);
}

.hero-location { display: flex; align-items: center; gap: 6px; font-size: 14px; color: var(--fg-muted); }

.hero-actions { display: flex; flex-wrap: wrap; gap: 12px; padding-top: 14px; }

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 28px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  border: 1px solid var(--border);
  border-radius: 2px;
  transition: opacity var(--t-fast) ease, background-color var(--t-fast) ease;
}
.btn-primary { color: var(--accent-fg); background: var(--accent); border-color: var(--accent); }
.btn-primary:hover { opacity: 0.88; }

.social { padding-top: 10px; font-family: var(--font-mono); font-size: 13px; color: var(--fg-muted); }
.social a,
.social-copy {
  color: var(--fg);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: var(--border);
  transition: text-decoration-color var(--t-fast) ease;
}
.social a:hover,
.social-copy:hover { text-decoration-color: var(--fg); }
.social-sep { padding-inline: 8px; }
.social-pending { cursor: default; }

/* 10. Pixel photo ========================================================= */
.hero-photo {
  position: relative;
  flex-shrink: 0;
  width: 288px;
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--bg-alt);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: crosshair;
}
.hero-photo-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

.pixel-tile {
  position: absolute;
  background-repeat: no-repeat;
  opacity: 0;
  pointer-events: none;
  transition: opacity 220ms ease-out var(--delay, 0ms);
}
.hero-photo:focus-visible .pixel-tile,
.hero-photo.is-revealed .pixel-tile { opacity: 1; }
@media (hover: hover) {
  .hero-photo:hover .pixel-tile { opacity: 1; }
}

/* 11. Stats =============================================================== */
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  margin-bottom: 64px;
  overflow: hidden;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.stat { display: flex; flex-direction: column; gap: 6px; padding: 20px; background: var(--bg); }
.stat-value { font-family: var(--font-pixel); font-size: 22px; line-height: 1.2; }
.stat-label { font-family: var(--font-mono); font-size: 11px; line-height: 1.5; color: var(--fg-muted); }

/* 12. Dividers & section heads ============================================ */
.divider { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--accent));
  opacity: 0.8;
}
.divider-line:last-child { background: linear-gradient(to left, transparent, var(--accent)); }
.divider-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  white-space: nowrap;
}
.divider-index { color: var(--fg-muted); }

.block-title,
.list-head {
  padding-bottom: 10px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--fg-muted);
  border-bottom: 1px solid var(--fg);
}
.list-head { display: flex; justify-content: space-between; gap: 16px; }

/* 13. About =============================================================== */
.about-bio { display: flex; flex-direction: column; gap: 14px; max-width: 64ch; font-size: 16px; }

.chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 24px 0 40px; }
.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px 5px 5px;
  font-family: var(--font-mono);
  font-size: 11px;
  background: var(--bg-alt);
  border: 1px solid var(--border);
  border-radius: 8px;
}
.chip-icon {
  display: inline-grid;
  place-items: center;
  width: 26px;
  height: 26px;
  color: var(--bg);
  background: var(--fg);
  border-radius: 6px;
}

.about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }

.rows > li { padding: 14px 0; border-bottom: 1px solid var(--border); }
.row-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 4px 16px; }
.row-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 500; }
.row-meta { font-family: var(--font-mono); font-size: 11px; color: var(--fg-muted); white-space: nowrap; }
.row-sub { font-size: 13px; color: var(--fg-muted); }
.row-bullets { margin-top: 6px; font-size: 13px; }
.row-bullets li::before { content: "> "; font-family: var(--font-mono); color: var(--fg-muted); }
.row-link { display: inline-block; margin-top: 6px; font-family: var(--font-mono); font-size: 12px; }
.live-dot { flex-shrink: 0; width: 6px; height: 6px; background: var(--status); border-radius: 50%; }

/* 14. Stack =============================================================== */
.stack-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
  overflow: hidden;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.stack-group { padding: 20px; background: var(--bg); }
.stack-group-title {
  margin-bottom: 14px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--fg-muted);
}
.stack-items { display: flex; flex-wrap: wrap; gap: 8px; }
.stack-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  font-family: var(--font-mono);
  font-size: 12px;
  background: var(--bg-alt);
  border: 1px solid var(--border);
  border-radius: 4px;
  transition: border-color var(--t-fast) ease;
}
.stack-item:hover { border-color: var(--fg); }

/* 15. Projects ============================================================ */
.project { padding: 22px 0; border-bottom: 1px solid var(--border); }
.project-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 4px 16px; }
.project-title { display: flex; align-items: center; gap: 10px; font-size: 18px; font-weight: 600; letter-spacing: -0.01em; }
.project-title::before {
  content: ">";
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--fg-muted);
  transition: transform var(--t-fast) ease, color var(--t-fast) ease;
}
.project:hover .project-title::before { color: var(--fg); transform: translateX(3px); }
.project-meta { font-family: var(--font-mono); font-size: 11px; color: var(--fg-muted); white-space: nowrap; }
.badge {
  display: inline-flex;
  padding: 1px 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--fg-muted);
  white-space: nowrap;
  border: 1px dashed var(--fg-muted);
  border-radius: 999px;
}
.project-desc { max-width: 68ch; margin-top: 8px; font-size: 14px; color: var(--fg-muted); }
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.tag {
  padding: 2px 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--fg-muted);
  border: 1px solid var(--border);
  border-radius: 999px;
}
.project-links { display: flex; gap: 16px; margin-top: 12px; font-family: var(--font-mono); font-size: 12px; }

/* 16. Pending ("coming soon") states ====================================== */
.pending {
  margin-top: 10px;
  padding: 12px 14px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-style: italic;
  color: var(--fg-muted);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
}
.rows > li.pending { margin-top: 0; padding: 14px; border: 1px dashed var(--border); }

/* 17. Quick jump dialog =================================================== */
.quick-jump {
  width: min(440px, calc(100vw - 32px));
  margin: 15vh auto auto;
  padding: 0;
  color: var(--fg);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
}
.quick-jump::backdrop { background: rgba(0, 0, 0, 0.35); }
.quick-jump-title {
  padding: 14px 16px 0;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--fg-muted);
}
.quick-jump-input {
  width: 100%;
  padding: 12px 16px;
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--fg);
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--border);
}
.quick-jump-input:focus-visible { outline: none; background: var(--bg-alt); }
.quick-jump-list { max-height: 50vh; padding: 8px; overflow-y: auto; }
.quick-jump-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  font-family: var(--font-mono);
  font-size: 13px;
  text-align: left;
  border-radius: var(--radius);
}
.quick-jump-item:hover,
.quick-jump-item:focus-visible { outline: none; background: var(--bg-alt); box-shadow: inset 0 0 0 1px var(--border); }
.quick-jump-index { color: var(--fg-muted); }
.quick-jump-item .kbd { margin-left: auto; }
.quick-jump-empty { padding: 10px 12px; font-family: var(--font-mono); font-size: 12px; color: var(--fg-muted); }
.quick-jump-hint {
  padding: 10px 16px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--fg-muted);
  border-top: 1px solid var(--border);
}

/* 18. Footer ============================================================== */
.footer {
  margin-top: 8px;
  padding: 24px 0 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  text-align: center;
  color: var(--fg-muted);
  border-top: 1px solid var(--border);
}

/* 19. Motion ============================================================== */
@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }

  .reveal {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 600ms ease-out, transform 600ms ease-out;
    transition-delay: var(--stagger, 0ms);
  }
  .reveal.reveal-visible { opacity: 1; transform: none; }

  .status-dot { animation: status-pulse 2.4s ease-in-out infinite; }
}

@keyframes status-pulse {
  50% { box-shadow: 0 0 0 6px color-mix(in srgb, var(--status) 0%, transparent); }
}

@media (prefers-reduced-motion: reduce) {
  .pixel-tile { transition: none; }
}

::view-transition-old(root) { animation: none; }
::view-transition-new(root) { animation: ripple-reveal 600ms ease-in-out; }

@keyframes ripple-reveal {
  from { clip-path: circle(0 at var(--ripple-x) var(--ripple-y)); }
  to { clip-path: circle(var(--ripple-radius) at var(--ripple-x) var(--ripple-y)); }
}

/* 20. Responsive ========================================================== */
@media (min-width: 1280px) {
  .hero-photo { width: 320px; }
}

@media (max-width: 1024px) {
  .collapse-toggle { display: none; }
  .main { padding: 40px 32px 28px; }
  .hero-photo { width: 256px; }
  .about-grid { grid-template-columns: 1fr; }
}

@media (max-width: 860px) {
  .hero { flex-direction: column; align-items: flex-start; gap: 28px; min-height: 0; }
}

@media (max-width: 639.98px) {
  .topbar {
    position: sticky;
    top: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--topbar-h);
    padding: 0 16px;
    background: color-mix(in srgb, var(--bg) 92%, transparent);
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(8px);
  }
  .topbar-brand { font-family: var(--font-mono); font-size: 13px; font-weight: 600; }
  .menu-toggle {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 40px;
    height: 40px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .menu-bar { width: 18px; height: 1.5px; background: var(--fg); transition: transform var(--t) var(--ease); }
  .menu-toggle[aria-expanded="true"] .menu-bar:first-child { transform: translateY(3.75px) rotate(45deg); }
  .menu-toggle[aria-expanded="true"] .menu-bar:last-child { transform: translateY(-3.75px) rotate(-45deg); }

  .sidebar {
    top: var(--topbar-h);
    width: min(300px, 85vw);
    visibility: hidden;
    transform: translateX(-100%);
    transition: transform var(--t) var(--ease), visibility 0s linear var(--t);
  }
  .sidebar.is-open { visibility: visible; transform: none; transition: transform var(--t) var(--ease); }

  .backdrop { position: fixed; inset: var(--topbar-h) 0 0 0; z-index: 25; display: block; background: rgba(0, 0, 0, 0.4); }
  body.drawer-open { overflow: hidden; }

  .main { margin-left: 0; padding: 28px 16px 24px; }
  .section { padding-bottom: 48px; scroll-margin-top: calc(var(--topbar-h) + 16px); }
  .hero-photo { width: 224px; }
  .stats { grid-template-columns: repeat(2, 1fr); margin-bottom: 48px; }
  .stack-grid { grid-template-columns: 1fr; }
  .divider-label { letter-spacing: 0.25em; }
}
```

- [ ] **Step 5: Run the asset test and confirm it passes**

Run: `node --test tests/*.test.js`
Expected: all pass.

- [ ] **Step 6: Visual smoke check of the static shell**

```bash
cd /mnt/heavy-data/my-portfolio
python3 -m http.server 8000 >/dev/null 2>&1 &
SHOTS=/tmp/claude-1000/-mnt-heavy-data-my-portfolio/shots; mkdir -p $SHOTS
firefox --headless --profile "$(mktemp -d)" --screenshot $SHOTS/t3-desktop.png --window-size=1280,900 http://localhost:8000/
firefox --headless --profile "$(mktemp -d)" --screenshot $SHOTS/t3-mobile.png --window-size=375,812 http://localhost:8000/
```
Read both PNGs. Expected on desktop: sidebar on the left with icons, dotted background, photo beside a pixel-font name, and empty list sections. Expected on mobile: top bar with the hamburger, no sidebar, photo stacked above the name. Leave the server running for later tasks.

- [ ] **Step 7: Commit**

```bash
git add index.html style.css tests/assets.test.js
git commit -m "feat: new static shell and visual system

"
```

---

### Task 4: Render module and footer year

**Files:**
- Modify: `script.js` (replace the line `/* DOM modules are added below in Tasks 4–6. */` with the code below; keep the closing `})();`)

**Interfaces:**
- Consumes: `safeUrl`, `validateData` (Task 2), and the `data-render` containers (Task 3)
- Produces: `$`, `$$`, `el`, `iconEl`, `storage`, `announce`, `prefersReducedMotion`, `root`, and `render.init(data)`. At the bottom of the IIFE is an `init()` that calls `render.init` and sets the footer year. Tasks 5–6 add module calls inside `init()` at the marked line.

- [ ] **Step 1: Add the environment helpers, render module and init**

```js
  /* ==========================================================================
     2. DOM environment
     ========================================================================== */

  const root = document.documentElement;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = () => motionQuery.matches;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const storage = {
    get(area, key) {
      try { return window[area].getItem(key); } catch { return null; }
    },
    set(area, key, value) {
      try { window[area].setItem(key, value); } catch { /* storage blocked — keep going */ }
    },
  };

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  };

  const iconEl = (name, extraClass = '') => {
    const span = el('span', `icon icon-${name}${extraClass ? ` ${extraClass}` : ''}`);
    span.setAttribute('aria-hidden', 'true');
    return span;
  };

  const stackIconEl = (slug) => {
    const span = el('span', 'icon icon-sm');
    span.setAttribute('aria-hidden', 'true');
    span.style.setProperty('--icon', `url("./assets/icons/stack/${slug}.svg")`);
    return span;
  };

  const externalLink = (href, text, className = 'text-link') => {
    const a = el('a', className, text);
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    return a;
  };

  const announce = (message) => {
    const region = $('.sr-status');
    if (!region) return;
    region.textContent = '';
    window.setTimeout(() => { region.textContent = message; }, 50);
  };

  /* ==========================================================================
     3. Render — builds list sections from PORTFOLIO_DATA
     ========================================================================== */

  const render = (() => {
    const pendingEl = (tag, text) => el(tag, 'pending', text);

    const social = ({ profile = {} }) => {
      const parts = [];
      const github = safeUrl(profile.github);
      if (github) parts.push(externalLink(github, 'github', ''));

      const linkedin = safeUrl(profile.linkedin);
      if (linkedin) {
        parts.push(externalLink(linkedin, 'linkedin', ''));
      } else {
        const pending = el('span', 'social-pending', 'linkedin');
        pending.title = 'coming soon';
        pending.append(el('span', 'visually-hidden', ' (coming soon)'));
        parts.push(pending);
      }

      if (profile.discord) {
        const button = el('button', 'social-copy');
        button.type = 'button';
        button.dataset.copy = profile.discord;
        button.setAttribute('aria-label', `Copy Discord username ${profile.discord}`);
        const label = el('span', null, 'discord');
        label.setAttribute('data-copy-label', '');
        button.append(label);
        parts.push(button);
      }

      return parts.flatMap((node, i) => {
        if (i === 0) return [node];
        const sep = el('span', 'social-sep', '/');
        sep.setAttribute('aria-hidden', 'true');
        return [sep, node];
      });
    };

    const stats = ({ stats: items = [] }) => items.map(({ value, label }) => {
      const group = el('div', 'stat');
      group.append(el('dt', 'stat-value', value), el('dd', 'stat-label', label));
      return group;
    });

    const highlights = ({ highlights: items = [] }) => items.map(({ icon, label }) => {
      const li = el('li', 'chip');
      const badge = el('span', 'chip-icon');
      badge.append(iconEl(icon, 'icon-sm'));
      li.append(badge, el('span', null, label));
      return li;
    });

    const rowHead = (title, meta, current) => {
      const head = el('div', 'row-head');
      const titleEl = el('p', 'row-title');
      if (current) {
        const dot = el('span', 'live-dot');
        dot.title = 'current';
        titleEl.append(dot);
      }
      titleEl.append(document.createTextNode(title));
      head.append(titleEl, el('span', 'row-meta', meta));
      return head;
    };

    const experience = ({ experience: items = [] }) => items.map((item) => {
      const li = el('li');
      li.append(rowHead(item.title, item.dates, item.current), el('p', 'row-sub', item.org));
      const bullets = (item.bullets || []).filter(Boolean);
      if (bullets.length) {
        const ul = el('ul', 'row-bullets');
        bullets.forEach((text) => ul.append(el('li', null, text)));
        li.append(ul);
      }
      return li;
    });

    const education = ({ education: items = [] }) => items.map((item) => {
      const li = el('li');
      li.append(rowHead(item.school, item.dates, item.current), el('p', 'row-sub', item.degree));
      return li;
    });

    const stack = ({ stack: groups = [] }) => groups.map((group) => {
      const box = el('div', 'stack-group');
      const list = el('ul', 'stack-items');
      (group.items || []).forEach((item) => {
        const li = el('li', 'stack-item');
        if (item.icon) li.append(stackIconEl(item.icon));
        li.append(el('span', null, item.name));
        list.append(li);
      });
      box.append(el('h3', 'stack-group-title', group.category), list);
      return box;
    });

    const projects = ({ projects: items = [] }) => items.map((project) => {
      const li = el('li', 'project');
      const head = el('div', 'project-head');
      const metaClass = project.status === 'done' ? 'project-meta' : 'badge';
      head.append(el('h3', 'project-title', project.title), el('span', metaClass, project.meta));
      li.append(head);

      li.append(project.description
        ? el('p', 'project-desc', project.description)
        : pendingEl('p', 'Details coming soon.'));

      const tags = (project.tags || []).filter(Boolean);
      if (tags.length) {
        const ul = el('ul', 'tags');
        ul.setAttribute('aria-label', 'Technologies');
        tags.forEach((tag) => ul.append(el('li', 'tag', tag)));
        li.append(ul);
      }

      const links = project.links || {};
      const source = safeUrl(links.source);
      const live = safeUrl(links.live);
      if (source || live) {
        const row = el('p', 'project-links');
        if (source) row.append(externalLink(source, 'source ↗'));
        if (live) row.append(externalLink(live, 'live ↗'));
        li.append(row);
      }
      return li;
    });

    const certifications = ({ certifications: items = [], certificationsPending }) => {
      if (!items.length) return [pendingEl('li', certificationsPending || 'Coming soon.')];
      return items.map((cert) => {
        const li = el('li');
        li.append(rowHead(cert.title, `${cert.issuer} · ${cert.date}`, false));
        const link = safeUrl(cert.link);
        if (link) li.append(externalLink(link, 'view credential ↗', 'text-link row-link'));
        return li;
      });
    };

    const renderers = { social, stats, highlights, experience, education, stack, projects, certifications };

    const showLoadError = (container) => {
      if (container.dataset.render === 'social') return; // static github link stays
      if (container.tagName === 'DL') { container.hidden = true; return; }
      const tag = container.tagName === 'UL' || container.tagName === 'OL' ? 'li' : 'p';
      container.replaceChildren(pendingEl(tag, 'Content failed to load.'));
    };

    const init = (data) => {
      const containers = $$('[data-render]');
      const errors = validateData(data);
      if (errors.length) console.warn('[portfolio] data.js problems:', errors);
      if (!data) { containers.forEach(showLoadError); return; }
      containers.forEach((container) => {
        const build = renderers[container.dataset.render];
        if (!build) return;
        try {
          container.replaceChildren(...build(data));
        } catch (error) {
          console.error(`[portfolio] failed to render ${container.dataset.render}`, error);
          showLoadError(container);
        }
      });
    };

    return { init };
  })();

  /* ==========================================================================
     99. Boot
     ========================================================================== */

  const init = () => {
    const data = typeof PORTFOLIO_DATA !== 'undefined' ? PORTFOLIO_DATA : null;
    render.init(data);
    /* module inits (Tasks 5–6) go here */
    const year = $('.footer-year');
    if (year) year.textContent = String(new Date().getFullYear());
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
```

`PORTFOLIO_DATA` is a top-level `const` in a classic script. It lives in the shared global lexical scope, so `typeof PORTFOLIO_DATA` works here without it being a `window` property.

- [ ] **Step 2: Run unit tests and syntax check**

Run: `node --check script.js && node --test tests/*.test.js`
Expected: no syntax error and all tests pass (the Node path still returns before section 2).

- [ ] **Step 3: Visual check with content**

```bash
SHOTS=/tmp/claude-1000/-mnt-heavy-data-my-portfolio/shots
firefox --headless --profile "$(mktemp -d)" --screenshot $SHOTS/t4-desktop-full.png --window-size=1280,4000 http://localhost:8000/
```
Read the PNG. Expected: the stats row with 4 cells, About with 3 chips and Experience/Education side by side, 6 stack groups with monochrome brand icons, 3 projects (Ambiancy shows a dashed "Details coming soon."), the dashed certifications slot, and the footer `© 2026 Kenneth Charles`. There should be no `undefined` or `null` text anywhere.

- [ ] **Step 4: Check the failure path**

```bash
mv assets/data.js assets/data.js.bak
firefox --headless --profile "$(mktemp -d)" --screenshot $SHOTS/t4-nodata.png --window-size=1280,2400 http://localhost:8000/
mv assets/data.js.bak assets/data.js
```
Read the PNG. Expected: the hero, bio and github link still show, the stats row is hidden, and each list shows "Content failed to load."

- [ ] **Step 5: Commit**

```bash
git add script.js
git commit -m "feat: render portfolio sections from data.js

"
```

---

### Task 5: Theme ripple, layout (rail/collapse/drawer), nav, quick jump, keyboard, clipboard

**Files:**
- Modify: `script.js`. Insert the modules below after the render module (before `99. Boot`), and replace `/* module inits (Tasks 5–6) go here */` with the init calls in Step 2.

**Interfaces:**
- Consumes: `SECTIONS`, `resolveShortcut`, `isTypingTarget`, `filterSections` (Task 2); `$`, `$$`, `el`, `storage`, `announce`, `prefersReducedMotion`, `root` (Task 4)
- Produces: `theme.toggle(origin?)`, `layout.closeDrawer({restoreFocus})`, `nav.jumpTo(id)`, `quickJump.open()`, `quickJump.close()`

- [ ] **Step 1: Add the modules**

```js
  /* ==========================================================================
     4. Theme — light/dark with a circular View Transition ripple
     ========================================================================== */

  const theme = (() => {
    const button = $('.theme-toggle');
    const current = () => (root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

    const syncButton = () => {
      if (!button) return;
      const t = current();
      $('.theme-label', button).textContent = `[MODE: ${t.toUpperCase()}]`;
      const icon = $('.theme-icon', button);
      icon.classList.toggle('icon-sun', t === 'light');
      icon.classList.toggle('icon-moon', t === 'dark');
      button.setAttribute('aria-label', `Switch to ${t === 'dark' ? 'light' : 'dark'} mode`);
    };

    const apply = (t) => {
      root.setAttribute('data-theme', t);
      storage.set('localStorage', 'theme', t);
      syncButton();
    };

    const toggle = (origin = button) => {
      const next = current() === 'dark' ? 'light' : 'dark';
      if (typeof document.startViewTransition !== 'function' || prefersReducedMotion()) {
        apply(next);
        return;
      }
      const rect = origin ? origin.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      root.style.setProperty('--ripple-x', `${x}px`);
      root.style.setProperty('--ripple-y', `${y}px`);
      root.style.setProperty('--ripple-radius', `${radius}px`);
      document.startViewTransition(() => apply(next));
    };

    const init = () => {
      syncButton();
      if (button) button.addEventListener('click', () => toggle(button));
    };

    return { init, toggle };
  })();

  /* ==========================================================================
     5. Layout — tablet rail, desktop collapse, mobile drawer
     ========================================================================== */

  const layout = (() => {
    const body = document.body;
    const sidebar = $('#sidebar');
    const menuToggle = $('.menu-toggle');
    const backdrop = $('.backdrop');
    const collapseToggle = $('.collapse-toggle');
    const mobileQuery = window.matchMedia('(max-width: 639.98px)');
    const tabletQuery = window.matchMedia('(min-width: 640px) and (max-width: 1024px)');
    let collapsed = storage.get('localStorage', 'sidebar-collapsed') === 'true';

    const updateRail = () => {
      body.classList.toggle('is-rail', tabletQuery.matches || (!mobileQuery.matches && collapsed));
      if (!collapseToggle) return;
      collapseToggle.textContent = collapsed ? '[>>]' : '[<<]';
      collapseToggle.setAttribute('aria-expanded', String(!collapsed));
      collapseToggle.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    };

    const isDrawerOpen = () => sidebar.classList.contains('is-open');

    const openDrawer = () => {
      sidebar.classList.add('is-open');
      backdrop.hidden = false;
      body.classList.add('drawer-open');
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', 'Close navigation');
      const first = $('.nav-link', sidebar);
      if (first) first.focus();
    };

    const closeDrawer = ({ restoreFocus = true } = {}) => {
      if (!isDrawerOpen()) return;
      sidebar.classList.remove('is-open');
      backdrop.hidden = true;
      body.classList.remove('drawer-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
      if (restoreFocus) menuToggle.focus();
    };

    const trapFocus = (event) => {
      if (event.key !== 'Tab' || !isDrawerOpen() || !mobileQuery.matches) return;
      const focusables = [menuToggle, ...$$('a[href], button:not([disabled])', sidebar)]
        .filter((node) => node.getClientRects().length > 0);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const init = () => {
      updateRail();
      tabletQuery.addEventListener('change', updateRail);
      mobileQuery.addEventListener('change', () => {
        updateRail();
        if (!mobileQuery.matches) closeDrawer({ restoreFocus: false });
      });
      if (collapseToggle) {
        collapseToggle.addEventListener('click', () => {
          collapsed = !collapsed;
          storage.set('localStorage', 'sidebar-collapsed', String(collapsed));
          updateRail();
        });
      }
      menuToggle.addEventListener('click', () => (isDrawerOpen() ? closeDrawer() : openDrawer()));
      backdrop.addEventListener('click', () => closeDrawer());
      sidebar.addEventListener('click', (event) => {
        if (mobileQuery.matches && event.target.closest('a[href^="#"]')) closeDrawer({ restoreFocus: false });
      });
      document.addEventListener('keydown', trapFocus);
    };

    return { init, closeDrawer };
  })();

  /* ==========================================================================
     6. Nav — active section tracking and programmatic jumps
     ========================================================================== */

  const nav = (() => {
    const links = $$('.nav-link');

    const setActive = (id) => {
      links.forEach((link) => {
        const on = link.dataset.section === id;
        link.classList.toggle('is-active', on);
        if (on) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };

    const jumpTo = (id) => {
      const target = document.getElementById(id);
      if (!target) return;
      target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', `#${id}`);
      setActive(id);
    };

    const init = () => {
      setActive(SECTIONS[0].id);
      if (!('IntersectionObserver' in window)) return;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id); });
      }, { rootMargin: '-35% 0px -60% 0px' });
      SECTIONS.forEach(({ id }) => {
        const section = document.getElementById(id);
        if (section) observer.observe(section);
      });

      // The last section is short and may never cross the band; pin it at page bottom.
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
          ticking = false;
          if (window.innerHeight + window.scrollY >= root.scrollHeight - 4) {
            setActive(SECTIONS[SECTIONS.length - 1].id);
          }
        });
      }, { passive: true });
    };

    return { init, jumpTo };
  })();

  /* ==========================================================================
     7. Quick jump — Alt+K / "/" section switcher
     ========================================================================== */

  const quickJump = (() => {
    const dialog = $('.quick-jump');
    const input = $('.quick-jump-input');
    const list = $('.quick-jump-list');
    const trigger = $('.quick-jump-trigger');
    let returnFocus = null;

    const items = () => $$('.quick-jump-item', list);

    const renderList = () => {
      const matches = filterSections(SECTIONS, input.value);
      if (!matches.length) {
        list.replaceChildren(el('li', 'quick-jump-empty', 'no matching section'));
        return;
      }
      list.replaceChildren(...matches.map((section) => {
        const li = el('li');
        const button = el('button', 'quick-jump-item');
        button.type = 'button';
        button.dataset.target = section.id;
        button.append(
          el('span', 'quick-jump-index', `0${section.key}`),
          el('span', null, section.label),
          el('kbd', 'kbd', section.key),
        );
        li.append(button);
        return li;
      }));
    };

    const isOpen = () => Boolean(dialog && dialog.open);

    const open = () => {
      if (!dialog || typeof dialog.showModal !== 'function') return;
      if (isOpen()) { input.focus(); return; }
      returnFocus = document.activeElement;
      layout.closeDrawer({ restoreFocus: false });
      input.value = '';
      renderList();
      dialog.showModal();
      input.focus();
    };

    const close = () => { if (isOpen()) dialog.close(); };

    const go = (id) => {
      close();
      nav.jumpTo(id);
    };

    const init = () => {
      if (!dialog || typeof dialog.showModal !== 'function') {
        if (trigger) trigger.hidden = true;
        return;
      }
      if (trigger) trigger.addEventListener('click', open);
      input.addEventListener('input', renderList);
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          const first = items()[0];
          if (first) go(first.dataset.target);
        } else if (event.key === 'ArrowDown') {
          event.preventDefault();
          const first = items()[0];
          if (first) first.focus();
        }
      });
      list.addEventListener('click', (event) => {
        const button = event.target.closest('.quick-jump-item');
        if (button) go(button.dataset.target);
      });
      list.addEventListener('keydown', (event) => {
        const all = items();
        const index = all.indexOf(document.activeElement);
        if (index === -1) return;
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          all[Math.min(index + 1, all.length - 1)].focus();
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          (index === 0 ? input : all[index - 1]).focus();
        }
      });
      dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
      dialog.addEventListener('close', () => {
        if (returnFocus && returnFocus.isConnected && returnFocus.getClientRects().length) {
          returnFocus.focus({ preventScroll: true });
        }
        returnFocus = null;
      });
    };

    return { init, open, close };
  })();

  /* ==========================================================================
     8. Keyboard shortcuts
     ========================================================================== */

  const keyboard = (() => {
    const init = () => {
      document.addEventListener('keydown', (event) => {
        if (event.defaultPrevented || event.repeat) return;
        const action = resolveShortcut(event, isTypingTarget(event.target));
        if (!action) return;
        switch (action.type) {
          case 'close':
            quickJump.close();
            layout.closeDrawer();
            break;
          case 'quick-jump':
          case 'search':
            event.preventDefault();
            quickJump.open();
            break;
          case 'theme':
            theme.toggle();
            break;
          case 'jump':
            event.preventDefault();
            quickJump.close();
            nav.jumpTo(action.id);
            break;
          default:
            break;
        }
      });
    };
    return { init };
  })();

  /* ==========================================================================
     9. Clipboard — copy email / discord with a manual-copy fallback
     ========================================================================== */

  const clipboard = (() => {
    const labelOf = (button) => $('[data-copy-label]', button) || button;

    const restoreLater = (button, label, ms) => {
      window.clearTimeout(Number(button.dataset.timer));
      button.dataset.timer = String(window.setTimeout(() => {
        label.textContent = label.dataset.original;
        delete button.dataset.copyHint;
      }, ms));
    };

    const remember = (label) => {
      if (label.dataset.original === undefined) label.dataset.original = label.textContent;
    };

    const copy = async (button) => {
      const text = button.dataset.copy;
      const label = labelOf(button);
      remember(label);
      try {
        if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard API unavailable');
        await navigator.clipboard.writeText(text);
        delete button.dataset.copyHint;
        label.textContent = 'copied!';
        announce(`Copied ${text} to clipboard`);
        restoreLater(button, label, 1500);
      } catch {
        label.textContent = text;
        const range = document.createRange();
        range.selectNodeContents(label);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        button.dataset.copyHint = 'press ctrl+c';
        announce(`Press Control plus C to copy ${text}`);
        restoreLater(button, label, 4000);
      }
    };

    const init = () => {
      document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-copy]');
        if (button) copy(button);
      });
    };

    return { init };
  })();
```

- [ ] **Step 2: Wire the inits**

In `init()`, replace `/* module inits (Tasks 5–6) go here */` with:
```js
    theme.init();
    layout.init();
    nav.init();
    quickJump.init();
    keyboard.init();
    clipboard.init();
    /* motion inits (Task 6) go here */
```

- [ ] **Step 3: Syntax and unit tests**

Run: `node --check script.js && node --test tests/*.test.js`
Expected: pass.

- [ ] **Step 4: Manual interaction check** (Firefox at `http://localhost:8000/` with DevTools open; the Console must stay free of errors)

Check each item and record pass/fail:
1. Press `1`–`5`: the page scrolls to each section and the matching nav link gets the active style.
2. Scroll with the mouse: the active nav link follows the section in view, and `Certifications` becomes active at the very bottom.
3. `Alt+K` opens quick jump with the input focused. Typing `pro` leaves only Projects, and Enter jumps there. `/` also opens it. `↓`/`↑` move between items. Esc closes it and focus returns.
4. Typing `t` or `1` inside the quick-jump input doesn't change the theme or scroll.
5. `Ctrl+1` still switches browser tabs.
6. `T` and the theme button toggle the theme with a circular ripple from the button, the label reads `[MODE: DARK]`/`[MODE: LIGHT]`, and after a reload the theme persists.
7. At a desktop width, `[<<]` collapses to the 64px rail (showing `KC`). After a reload it's still collapsed, and `[>>]` expands it.
8. Responsive mode at 800px: rail with no collapse button, and hovering a nav icon shows its title tooltip.
9. Responsive mode at 375px: the hamburger opens the drawer below the top bar and focuses the first link. Tab cycles through the drawer plus the hamburger only. Esc, the backdrop, and clicking a link each close it. The page doesn't scroll behind it.
10. Click the email: the label shows `copied!` for 1.5s and the clipboard holds the address. Click `discord` in the hero: it copies `de4dicated`.
11. **Clipboard fallback:** in the Console run `Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })`, then click the email. The address is selected and `press ctrl+c` appears next to it.
12. **Blocked storage:** in `about:config` set `dom.storage.enabled` to `false` and reload. The page renders, the theme toggles, collapse works, and there are no console errors. Set it back to `true` afterwards.
13. **Reduced motion:** in `about:config` set `ui.prefersReducedMotion` to `1`. The theme switches instantly with no ripple, and jumps don't animate. Reset to default.

Fix any failures before committing.

- [ ] **Step 5: Commit**

```bash
git add script.js
git commit -m "feat: theme ripple, responsive sidebar, quick jump, shortcuts, copy

"
```

---

### Task 6: Scroll reveal, pixel-reveal photo, visitor counter

**Files:**
- Modify: `script.js` (insert modules before `99. Boot`, and replace `/* motion inits (Task 6) go here */`)

**Interfaces:**
- Consumes: `computeTiles`, `revealDelays`, `padCount` (Task 2); `$`, `$$`, `el`, `storage`, `prefersReducedMotion` (Task 4); rendered nodes `.stack-group`, `.project`, `#certifications .rows > li` (Task 4)

- [ ] **Step 1: Add the modules**

```js
  /* ==========================================================================
     10. Scroll reveal — fade + slide up once, staggered in lists
     ========================================================================== */

  const reveal = (() => {
    const SINGLE = ['.stats', '.divider', '.about-bio', '.chips', '.timeline-block', '.list-head'];
    const STAGGERED = ['.stack-group', '.project', '#certifications .rows > li'];
    const STAGGER_MS = 60;
    const STAGGER_CAP = 8;

    const init = () => {
      if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -10% 0px' });

      const track = (node, delay = 0) => {
        node.classList.add('reveal');
        if (delay) node.style.setProperty('--stagger', `${delay}ms`);
        observer.observe(node);
      };

      $$(SINGLE.join(',')).forEach((node) => track(node));
      STAGGERED.forEach((selector) => {
        $$(selector).forEach((node, i) => track(node, Math.min(i, STAGGER_CAP) * STAGGER_MS));
      });
    };

    return { init };
  })();

  /* ==========================================================================
     11. Pixel photo — 8×8 tiles dissolve profile.jpg into light.jpg
     ========================================================================== */

  const pixelPhoto = (() => {
    const GRID = 8;
    const STEP_MS = 6;
    const IMAGE = './assets/light.jpg';
    const IMAGE_W = 639;
    const IMAGE_H = 780;

    const init = () => {
      const photo = $('.hero-photo');
      if (!photo) return;
      const delays = revealDelays(GRID * GRID, prefersReducedMotion() ? 0 : STEP_MS);
      const fragment = document.createDocumentFragment();
      computeTiles(GRID, IMAGE_W, IMAGE_H).forEach((tile, i) => {
        const node = el('span', 'pixel-tile');
        node.setAttribute('aria-hidden', 'true');
        node.style.top = `${tile.top}%`;
        node.style.left = `${tile.left}%`;
        node.style.width = `${tile.size}%`;
        node.style.height = `${tile.size}%`;
        node.style.backgroundImage = `url("${IMAGE}")`;
        node.style.backgroundSize = `${tile.bgSize[0]}% ${tile.bgSize[1]}%`;
        node.style.backgroundPosition = `${tile.bgPos[0]}% ${tile.bgPos[1]}%`;
        node.style.setProperty('--delay', `${delays[i]}ms`);
        fragment.append(node);
      });
      photo.append(fragment);

      // Touch devices have no hover: tap toggles the reveal.
      const noHover = window.matchMedia('(hover: none)');
      photo.addEventListener('click', () => {
        if (noHover.matches) photo.classList.toggle('is-revealed');
      });

      const preload = () => { const img = new Image(); img.src = IMAGE; };
      if (document.readyState === 'complete') preload();
      else window.addEventListener('load', preload, { once: true });
    };

    return { init };
  })();

  /* ==========================================================================
     12. Visitor counter — abacus.jasoncameron.dev, hidden on any failure
     ========================================================================== */

  const visitors = (() => {
    const BASE = 'https://abacus.jasoncameron.dev';
    const NAMESPACE = 'kenneth-valdez-portfolio';
    const KEY = 'visits';
    const TIMEOUT_MS = 3000;

    const init = async () => {
      const row = $('.visitors');
      const out = $('.visitors-count');
      if (!row || !out || typeof fetch !== 'function' || typeof AbortController !== 'function') return;

      const counted = storage.get('sessionStorage', 'visit-counted') === 'true';
      const url = `${BASE}/${counted ? 'get' : 'hit'}/${NAMESPACE}/${KEY}`;
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        const text = padCount(payload && payload.value);
        if (text === null) throw new Error('No counter value');
        out.textContent = text;
        row.hidden = false;
        if (!counted) storage.set('sessionStorage', 'visit-counted', 'true');
      } catch {
        row.hidden = true;
      } finally {
        window.clearTimeout(timer);
      }
    };

    return { init };
  })();
```

- [ ] **Step 2: Wire the inits**

Replace `/* motion inits (Task 6) go here */` with:
```js
    pixelPhoto.init();
    reveal.init();
    visitors.init();
```

- [ ] **Step 3: Syntax and unit tests**

Run: `node --check script.js && node --test tests/*.test.js`
Expected: pass.

- [ ] **Step 4: Manual motion check** (Firefox, DevTools open)

1. Hovering the photo dissolves it tile by tile, in random order, into the manga portrait. Moving the mouse away dissolves it back. Tab-focusing the photo reveals it too.
2. In responsive mode with touch simulation, tapping toggles the reveal.
3. Scrolling down fades in dividers, the stats row, blocks, stack groups and projects. Stack groups and projects are staggered. Scrolling back up doesn't hide them again.
4. With `ui.prefersReducedMotion=1`, everything is visible immediately and the photo swaps without a stagger. Reset afterwards.
5. The sidebar shows `VISITORS 000N` (fresh tab: the Network panel shows `/hit/`; reload in the same tab: `/get/`).
6. **Counter down:** in the Network panel, block the URL pattern `abacus.jasoncameron.dev` and reload. The VISITORS row is absent and the console has no uncaught error. Remove the block afterwards.

- [ ] **Step 5: Commit**

```bash
git add script.js
git commit -m "feat: scroll reveal, pixel-reveal portrait, visitor counter

"
```

---

### Task 7: GitHub Actions check & deploy pipeline

**Files:**
- Create: `.github/workflows/deploy.yml`, `.htmlvalidate.json`, `README.md`

**Interfaces:**
- Consumes: `tests/*.test.js`, `index.html`, `script.js`, `assets/data.js`

- [ ] **Step 1: Write `.htmlvalidate.json`**

```json
{
  "extends": ["html-validate:recommended"],
  "rules": {
    "require-sri": "off"
  }
}
```
(Google Fonts serves CSS that varies per browser, so SRI hashes are impossible there.)

- [ ] **Step 2: Run the validators locally and confirm they're clean**

```bash
cd /mnt/heavy-data/my-portfolio
npx --yes html-validate@9 index.html
docker run --rm -v "$PWD":/input:ro -w /input lycheeverse/lychee:latest --offline --no-progress index.html
```
Expected: html-validate prints nothing and exits 0. lychee reports `0 Errors`. If html-validate reports an issue, fix the markup in `index.html`, not the config. Only `require-sri` may be disabled. Then re-run `node --test tests/*.test.js`.

- [ ] **Step 3: Write `.github/workflows/deploy.yml`**

```yaml
name: Check & Deploy

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: pages-${{ github.ref }}
  cancel-in-progress: false

jobs:
  check:
    name: Validate & test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Unit tests (node:test, zero dependencies)
        run: node --test tests/*.test.js

      - name: Syntax-check JavaScript
        run: node --check script.js && node --check assets/data.js

      - name: Validate HTML
        run: npx --yes html-validate@9 index.html

      - name: Check links and asset paths
        uses: lycheeverse/lychee-action@v2
        with:
          args: --offline --no-progress index.html
          fail: true

  deploy:
    name: Deploy to GitHub Pages
    if: github.event_name != 'pull_request' && github.ref == 'refs/heads/main'
    needs: check
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/configure-pages@v5

      - name: Stage runtime files only
        run: |
          mkdir _site
          cp -r index.html style.css script.js assets _site/

      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site

      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 4: Write `README.md`**

```markdown
# Kenneth Charles Valdez — Portfolio

[![Check & Deploy](https://github.com/chimkenchrls/my-portfolio/actions/workflows/deploy.yml/badge.svg)](https://github.com/chimkenchrls/my-portfolio/actions/workflows/deploy.yml)

Static portfolio in plain HTML, CSS, and vanilla JavaScript: no framework, no build step.
Live at **https://chimkenchrls.github.io/my-portfolio/**.

## Updating content

All content lives in [`assets/data.js`](./assets/data.js). Use `null` for anything not ready yet;
the page shows a "coming soon" state. Then validate:

```bash
node --test tests/*.test.js
```

## Running locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Pipeline

Every push and pull request runs [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml):

1. Unit tests for the helpers and the content file (`node:test`, zero dependencies)
2. JavaScript syntax check
3. HTML validation (`html-validate`)
4. Offline link and asset-path check (`lychee`)

Pushes to `main` that pass all checks are deployed to GitHub Pages. Only runtime files
(`index.html`, `style.css`, `script.js`, `assets/`) are published.
```

- [ ] **Step 5: Lint the workflow**

Run: `docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:latest -color`
Expected: no output (exit 0).

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/deploy.yml .htmlvalidate.json README.md
git commit -m "ci: add check and GitHub Pages deploy workflow

"
```

---

### Task 8: Clean up, update AGENTS.md, full verification, PR

**Files:**
- Delete: every `assets/project-*.svg`, `assets/hero-devops.svg`, `assets/profile.png`, `assets/profile.svg`, `assets/lawliet.jpg`, `assets/icons/{aws,docker,kubernetes,terraform,contact,email,github,linkedin}.svg`
- Modify: `AGENTS.md`

- [ ] **Step 1: Confirm the files are unreferenced, then delete them**

```bash
cd /mnt/heavy-data/my-portfolio
for f in assets/project-*.svg assets/hero-devops.svg assets/profile.png assets/profile.svg assets/lawliet.jpg assets/icons/{aws,docker,kubernetes,terraform,contact,email,github,linkedin}.svg; do
  name=$(basename "$f")
  grep -q "$name" index.html style.css script.js assets/data.js && echo "STILL USED: $f"
done
```
Expected: no `STILL USED` lines. (`docker.svg` and `github.svg` only match inside `assets/icons/stack/` through `data.js` slugs, which don't contain `.svg`, so no false positive.) Then:
```bash
git rm -q assets/project-*.svg assets/hero-devops.svg assets/profile.png assets/profile.svg assets/lawliet.jpg assets/icons/{aws,docker,kubernetes,terraform,contact,email,github,linkedin}.svg
node --test tests/*.test.js
```
Expected: all pass (the asset tests prove nothing still points at a deleted file).

- [ ] **Step 2: Update `AGENTS.md` sections 2–6** so future agents follow the new design. Replace everything from `2. Technical Stack & Constraints` to the end of the file with:

````markdown
## 2. Technical Stack & Constraints
Core Stack: Plain HTML5, CSS3, Vanilla JavaScript (ES2020+).

Zero External Dependencies: No build tools, package managers, or third-party CSS/JS frameworks in the site. Tooling that runs only in CI via `npx`/Actions (html-validate, lychee) is allowed. Tests use Node's built-in `node:test`.

Fonts & Icons: Geist and Geist Mono via Google Fonts `<link>`; Geist Pixel self-hosted at `./assets/fonts/`. Icons are local SVGs in `./assets/icons/` (UI) and `./assets/icons/stack/` (simple-icons brand marks), drawn via CSS `mask-image` so they follow the theme color.

Paths: All internal references use relative paths (`./style.css`, `./assets/...`) for GitHub Pages subdirectory hosting.

Globals: `assets/data.js` defines exactly one global, `PORTFOLIO_DATA`. `script.js` is a single IIFE and adds nothing to the global scope.

## 3. Directory Layout
```text
my-portfolio/
├── AGENTS.md
├── README.md
├── index.html              static shell; hero/bio hard-coded, lists rendered from data
├── style.css               tokens → base → layout → sections → motion → responsive
├── script.js               pure helpers (tested) + DOM modules
├── assets/
│   ├── data.js             ALL editable content (PORTFOLIO_DATA)
│   ├── profile.jpg         hero portrait (B&W)
│   ├── light.jpg           pixel-reveal alternate image
│   ├── logo.svg            favicon
│   ├── fonts/              GeistPixel-Square.woff2 + OFL.txt
│   └── icons/              UI icons; icons/stack/ brand icons
├── tests/                  node:test suites (data, helpers, assets)
├── .github/workflows/deploy.yml
└── docs/superpowers/       specs and plans
```

## 4. UI/UX & Design Guidelines
Tokens (`:root`, dark under `[data-theme="dark"]`):
- Light: `--bg #ffffff`, `--bg-alt #fafafa`, `--fg #0a0a0a`, `--fg-muted #6d6d72`, `--border #e4e4e7`
- Dark: `--bg rgb(12,12,15)`, `--bg-alt #18181b`, `--fg #fafafa`, `--fg-muted #a6a6ad`, `--border #27272a`
- A faint dotted grid (`--dot`) covers the whole canvas in both themes.

Typography: Geist (body), Geist Mono (nav, labels, metadata, dates, tags; uppercase with wide letter-spacing for labels), Geist Pixel (hero name and stat values only).

Layout: fixed 260px sidebar + scrolling main column (max 880px) on desktop (>1024px, collapsible to a 64px rail); 64px icon rail on tablet (640–1024px); sticky top bar + slide-in drawer on mobile (<640px).

Visual Style: 1px `var(--border)` dividers; gradient-line section dividers with mono labels; list rows with the title on the left and the date/status on the right in small muted mono; dashed borders mark "coming soon" content. Imagery is black-and-white.

Motion (all disabled under `prefers-reduced-motion`): one-shot scroll reveal (fade + 16px slide, 60ms stagger); 8×8 pixel-tile photo reveal on hover/focus/tap; circular View Transition ripple on theme toggle.

## 5. Sections
Sidebar: name, nav (Home, About, Stack, Projects, Certifications, keys 1–5), quick jump (Alt+K or /), status "open to OJT / internship", copyable email, visitor count (abacus API, hidden on failure), theme toggle (T), collapse.
Main: hero (pixel photo, tagline, name, title, location, Email me, github / linkedin / discord) → stats row → About (bio, highlight chips, Experience + Education) → Stack → Projects → Certifications → footer `© <year> Kenneth Charles`.

## 6. Agent Rules of Engagement
- Content changes go in `assets/data.js` only; use `null` for missing items (never `""`), and never invent metrics, projects, or credentials.
- Run `node --test tests/*.test.js` before committing; CI runs the same tests plus html-validate and lychee.
- Generate complete code with no placeholders or truncated snippets. Prefer semantic HTML (`aside`, `nav`, `main`, `section`, `dl`, `dialog`, `footer`).
- Keep CSS organized under the numbered section headers using the tokens above. Keep JS modular inside the IIFE; pure logic goes in section 1 with tests.
- Wrap all storage access in try/catch; build DOM with `textContent`, never `innerHTML` with data.
````

- [ ] **Step 3: Full verification pass**

```bash
cd /mnt/heavy-data/my-portfolio
node --test tests/*.test.js
node --check script.js && node --check assets/data.js
npx --yes html-validate@9 index.html
docker run --rm -v "$PWD":/input:ro -w /input lycheeverse/lychee:latest --offline --no-progress index.html
docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:latest -color
```
Expected: all green.

Screenshots in both themes at three widths (reduced motion forced so the reveals don't catch mid-animation):
```bash
SHOTS=/tmp/claude-1000/-mnt-heavy-data-my-portfolio/shots
for scheme in 1 0; do   # 1 = light, 0 = dark
  P=$(mktemp -d); printf 'user_pref("layout.css.prefers-color-scheme.content-override", %s);\nuser_pref("ui.prefersReducedMotion", 1);\n' $scheme > $P/user.js
  name=$([ $scheme = 1 ] && echo light || echo dark)
  for w in 375 800 1280; do
    firefox --headless --profile $P --screenshot $SHOTS/final-$name-$w.png --window-size=$w,3600 http://localhost:8000/
  done
done
```
Read all six PNGs and check: nothing overflows horizontally at 375px; dark mode has readable muted text, visible brand icons (masks follow `--fg`), and a visible dotted grid; rail at 800px; full sidebar at 1280px; no `undefined`/`null` text anywhere.

Re-run the Task 5 Step 4 and Task 6 Step 4 checklists end to end once more.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove unused assets and update AGENTS.md for the redesign

"
```

- [ ] **Step 5: Push and open the PR** (only after Kenneth confirms pushing)

```bash
kill %1 2>/dev/null   # stop the local http.server
git push -u origin redesign
gh pr create --base main --head redesign --title "Redesign portfolio with real content, new visual system, and CI/CD" --body "$(cat <<'EOF'
## Summary
- Rebuilds the site around real content (AmIgo, Thready, Ambiancy; CodeFest 2026 win; education & experience) and removes placeholder projects and invented stats
- Adopts the React portfolio's visual system: Geist / Geist Mono / Geist Pixel, zinc tokens, gradient dividers, scroll reveal, theme ripple, pixel-reveal portrait
- Content lives in `assets/data.js`; missing items render as "coming soon"
- Adds `.github/workflows/deploy.yml`: unit tests, JS syntax check, html-validate, lychee, then GitHub Pages deploy on `main`

## Test plan
- [x] `node --test tests/*.test.js`
- [x] html-validate, lychee (offline), actionlint
- [x] Screenshots at 375 / 800 / 1280 in light and dark
- [x] Manual keyboard, drawer, clipboard fallback, blocked storage, reduced motion, counter-down checks
- [ ] After merge: Settings → Pages → Source: GitHub Actions, then confirm the deploy job publishes

EOF
)"
gh pr checks --watch
```
Expected: the `Validate & test` check passes on the PR, and `deploy` is skipped (PRs don't deploy).
