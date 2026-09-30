# Portfolio Redesign — Design Spec

- **Date:** 2026-09-30
- **Status:** Approved in conversation, pending written-spec review
- **Repo:** `/mnt/heavy-data/my-portfolio` (static site, GitHub Pages)
- **Content source:** `/mnt/myfiles/portfolio` (React + Vite + Tailwind portfolio, `src/data/*`)

## 1. Goal

Redesign this static portfolio so it presents Kenneth's **real** profile (replacing the placeholder projects and fabricated stats) with the React portfolio's visual style and animations, while keeping the `AGENTS.md` constraints: plain HTML/CSS/vanilla JS, no frameworks, no build step, relative paths, sidebar + main-column layout.

**Audience:** hiring managers and technical recruiters looking for junior/associate DevOps or cloud talent, or OJT/internship candidates.

**Success criteria**
- Every item on the site is true. Nothing is invented. Missing content appears as clearly marked "coming soon" slots.
- The site looks and feels like the React portfolio: same tokens, fonts, dividers, scroll reveal, theme ripple and pixel-reveal photo.
- Content is edited in a single data file.
- Each push to `main` is checked and deployed by a GitHub Actions workflow, which becomes a DevOps artifact recruiters can inspect.
- Works at mobile, tablet and desktop widths, in light and dark mode, and with reduced motion.

**Out of scope:** resume download (dropped for now), GitHub contributions calendar, contact form, sound toggle.

## 2. Decisions log

| Decision | Choice |
|---|---|
| Visual direction | Keep the `AGENTS.md` sidebar/dotted-grid layout, restyled with the React site's tokens, fonts and animations |
| "GitHub Actions" | A CI/CD workflow that deploys to GitHub Pages (not the contributions calendar) |
| Missing content | Visible "coming soon" slots |
| Resume | Dropped for now |
| Content architecture | `assets/data.js` (JS object) rendered by `script.js`, with name/title/bio also hard-coded in HTML |
| Geist Pixel font | Self-hosted in `assets/fonts/` |
| Visitor count | abacus.jasoncameron.dev counter API, hidden on failure |
| Footer | Only `© <current year> Kenneth Charles` |

## 3. File structure

```text
my-portfolio/
├── AGENTS.md                    updated to reflect this design
├── README.md                    new: short description + CI badge
├── index.html
├── style.css
├── script.js
├── assets/
│   ├── data.js                  all portfolio content (PORTFOLIO_DATA)
│   ├── profile.jpg              copied from /mnt/myfiles/portfolio/public/profile.jpg
│   ├── light.jpg                copied from /mnt/myfiles/portfolio/public/light.jpg
│   ├── fonts/GeistPixel-Square.woff2
│   ├── logo.svg                 kept (favicon)
│   └── icons/*.svg              kept where still used; new inline SVGs in markup/data
├── .github/workflows/deploy.yml
└── docs/superpowers/specs/2026-09-30-portfolio-redesign-design.md
```

**Deleted (no longer used):** `assets/project-*.svg`, `assets/hero-devops.svg`, `assets/profile.png`, `assets/profile.svg`, `assets/lawliet.jpg`, plus any `assets/icons/*` left unreferenced after the rebuild.

**Globals:** `assets/data.js` declares one top-level `const PORTFOLIO_DATA` (loaded as a classic script before `script.js`). `script.js` is a single IIFE and adds nothing else to the global scope. `AGENTS.md` records this exception.

## 4. Visual system

### Tokens (`:root`, dark under `[data-theme="dark"]`)

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#ffffff` | `rgb(12, 12, 15)` |
| `--bg-alt` | `#fafafa` | `#18181b` |
| `--fg` | `#0a0a0a` | `#fafafa` |
| `--fg-muted` | `#6d6d72` | `#a6a6ad` |
| `--border` | `#e4e4e7` | `#27272a` |
| `--accent` | `var(--fg)` | `var(--fg)` |
| `--accent-fg` | `var(--bg)` | `var(--bg)` |
| `--dot` (grid) | `rgba(10,10,10,0.07)` | `rgba(250,250,250,0.06)` |
| `--status` | `#16a34a` | `#22c55e` |

Before first paint, an inline `<head>` script chooses the theme: the saved choice, otherwise `prefers-color-scheme`, otherwise light. This prevents a flash of the wrong theme.

### Typography
- `--font-sans`: "Geist", ui-sans-serif, system-ui, sans-serif (body text)
- `--font-mono`: "Geist Mono", ui-monospace, "SF Mono", monospace (nav, labels, metadata, dates, tags)
- `--font-pixel`: "Geist Pixel", "Geist Mono", monospace (hero name only)
- Geist and Geist Mono come from Google Fonts via `<link>`. Geist Pixel is loaded with `@font-face` from `./assets/fonts/GeistPixel-Square.woff2` using `font-display: swap`.
- Labels are uppercase mono at 10–12px with `letter-spacing: 0.25–0.4em`.

### Visual elements
- Faint dotted-grid background: `radial-gradient` 1px dots on a 20px grid, across the whole page.
- 1px `var(--border)` lines for dividers, grid cells and list rows.
- Section divider: gradient line + mono label + gradient line, as in the React `SectionDivider`.
- Photos are already black-and-white, so no extra filter is needed.

### Layout & breakpoints
- **Desktop (>1024px):** fixed 260px sidebar next to a scrolling main column (max-width 880px, side padding 48px).
- **Tablet (640–1024px):** the sidebar shrinks to a 64px rail with icons only. Labels show as tooltips on hover and focus. The collapse button is hidden.
- **Mobile (<640px):** a sticky top bar with the name and a hamburger button. The sidebar becomes a drawer that slides in from the left with a backdrop, and focus is trapped while it is open.

## 5. Sections & content

All content lives in `assets/data.js`. The wording below is final.

### 5.1 Sidebar
- Brand: `Kenneth Charles Valdez`, subline `> aspiring devops · cloud`
- Nav (icon + label + key hint): `01 Home`, `02 About`, `03 Stack`, `04 Projects`, `05 Certifications`. The active section is highlighted using an IntersectionObserver.
- Quick jump button: `quick jump…` with `Alt + K` hint
- Bottom block:
  - Status: green dot + `open to OJT / internship`
  - Email button: `charleskenneth129@gmail.com`, copies on click and shows `copied` for 1.5s
  - `VISITORS` + zero-padded count (hidden if the API fails)
  - Theme toggle `[MODE: LIGHT]` / `[MODE: DARK]` with `T` hint
  - Collapse button `[<<]` (desktop only)

### 5.2 01 Home (hero)
- Pixel-reveal photo (§6.2)
- Mono label: `BUILDING. LEARNING. SHIPPING.`
- `<h1>` in Geist Pixel: `Kenneth Charles Valdez` (hard-coded in HTML)
- Mono subtitle: `ASPIRING DEVOPS ENGINEER | CLOUD ENGINEER` (hard-coded)
- Location with pin icon: `Sariaya, Quezon, Philippines`
- Primary button: `Email me` → `mailto:charleskenneth129@gmail.com`
- Social links in lowercase separated by slashes: `github` (https://github.com/chimkenchrls) / `linkedin` (grayed, no link, `title="coming soon"`, until a URL is set) / `discord` (copies `de4dicated` on click, confirmation shown on the link)

### 5.3 Stats row
A 4-cell grid with 1px borders (2×2 on mobile):
1. `Champion`: CodeFest Tagisan ng Talino 2026
2. `2023`: coding since
3. `4th yr`: BS Computer Science
4. `3`: projects built & building (AmIgo is done, the other two are in progress, so "in progress" would be inaccurate)

### 5.4 02 About
- Bio (hard-coded in HTML, also in data):
  - "I'm a 4th-year BS Computer Science student at STI College Lucena with a real passion for tech. I got into DevOps and Cloud Engineering because I love figuring out how systems fit together and making deployments smooth and scalable."
  - "Right now, I'm just building side projects to sharpen my skills. I really enjoy turning rough ideas into practical tools that people can actually use."
- Highlight chips (icon + label): `4th-Year BS Computer Science`, `Aspiring DevOps Engineer`, `Open to OJT / Internship`
- Two columns (stacked below 1024px):
  - **Experience** rows (title left, dates right, bullets underneath):
    - BS Computer Science: STI College Lucena, `2023 — 2027`, current. "Champion in Local CodeFest Competition Tagisan ng Talino 2026."
    - OJT / Internship: Actively Seeking, `2026 — Present`, ongoing. "Currently seeking internship opportunities to gain practical experience and contribute to real-world projects."
    - Capstone Project: STI College Lucena, `2026 — Present`, ongoing. "Thready: An AI Enhanced Web-Based Production Management System with Computer Vision for Garments Monitoring for Shiela and Joel Garments"
  - **Education** rows:
    - STI College Lucena: Bachelor of Science in Computer Science, `2023 — Current`, current
    - Sariaya Institute Inc.: Senior High School, `2021 — 2023`
    - Sariaya Institute Inc.: Junior High School, `2017 — 2023` (copied as-is from the source data; flagged for Kenneth to confirm)
    - Jose Rizal Elementary School: Elementary, `2011 — 2017`
- Entries marked current or ongoing get a small status dot.

### 5.5 03 Stack
Category groups in this order. Each item shows a monochrome inline SVG icon (`currentColor`) where one exists, otherwise just the name:
1. **DevOps & Cloud:** Docker + Compose, Azure, Caddy 2, GitHub Actions, Let's Encrypt (Lego ACME client)
2. **Security & Identity:** Tailscale, WireGuard (wg-easy)
3. **Backend:** Node.js 20 (Alpine), Java, Python, PHP, Express 5, MySQL 8 (mysql2), JWT, Axios
4. **Frontend:** TypeScript, Next.js 16 (App Router), React 18.3, Tailwind CSS 3, Vite, Google Fonts (Rubik)
5. **AI & Machine Learning:** Ultralytics (YOLOv8)
6. **Developer Tools:** Git, GitHub, VS Code, Vitest, Playwright, Husky

Icons are simple-icons SVG paths (CC0) placed inline in `data.js`. Items without an icon in the source (Azure, VS Code, Playwright, Husky) show the name only.

### 5.6 04 Projects
List rows: title left, status/year right in mono, then description and mono tags. Source and live links appear only when set.
- **AmIgo**, `2026`: "AmIgo is a Discord AI bot that acts like a chaotic, laid-back group chat friend — chatting in casual Taglish when mentioned, replied to, or called by name. Powered by Google's Gemini API with per-channel conversation memory, and rounding that out with a photo-roasting command, an English tutor mode, and a persistent-facts system so it can remember and recall things about the server over time." Tags: Discord.js, TypeScript, SQLite3, Google Gemini API
- **Thready**, `in progress`: "AI-enhanced, web-based production management system with computer vision for garment monitoring, built as a capstone project for Shiela and Joel Garments." Tags: JavaScript
- **Ambiancy**, `coming soon`: description slot shown as "Details coming soon." in muted italic mono inside a dashed-border block. Tags: Python

### 5.7 05 Certifications
A single dashed-border "coming soon" slot: "Currently working toward certifications. Check back soon." When real entries are added, each renders as a row: title left, issuer and date right, optional credential link.

### 5.8 Footer
`© <current year> Kenneth Charles` (year set by JS; HTML fallback `2026`).

## 6. Behavior

### 6.1 Rendering (`script.js` → `render` module)
- Reads `PORTFOLIO_DATA` and fills the section containers (`[data-render="stats"]`, `experience`, `education`, `stack`, `projects`, `certifications`, `social`, `highlights`).
- Builds all DOM with `document.createElement` / `textContent`, never `innerHTML` with data (except the trusted inline SVG icon strings from `data.js`, inserted via a template element).
- Empty or `null` fields are skipped, so no `undefined` text and no `href="null"`. Items flagged as coming soon use the dashed "coming soon" style.
- If `PORTFOLIO_DATA` is missing, the hard-coded hero and bio still show and the rendered sections show one muted line: "Content failed to load."
- A `<noscript>` note says the full content needs JavaScript.

### 6.2 Pixel-reveal photo (`pixelPhoto` module)
- Container: square (224/256/288/320px at the breakpoints), `border-radius: 6px`, 1px border, showing `assets/profile.jpg` with `object-fit: cover`.
- JS creates an 8×8 grid of absolutely positioned tiles. Each tile shows a slice of `assets/light.jpg` (639×780) using the React implementation's cover-crop math: `renderedW = 1`, `renderedH = 780/639`, with background-size and position computed per tile.
- Reveal order is shuffled once at page load. Each tile gets a `--delay` of `order × 6ms`, and tiles fade `opacity 0→1` over 220ms.
- Triggered by `:hover` and `:focus-visible` on the container (`tabindex="0"`, `aria-label`). On touch devices a tap toggles a `.revealed` class.
- `light.jpg` is preloaded after the page finishes loading.
- With reduced motion, delays are 0 and the swap happens instantly.

### 6.3 Theme (`theme` module)
- Toggles `data-theme` on `<html>` and saves the choice (`localStorage`, key `theme`, wrapped in try/catch).
- If `document.startViewTransition` exists and motion is allowed, CSS variables `--ripple-x/y/radius` are set from the toggle button's position and the change runs inside a view transition. The `ripple-reveal` keyframes animate `clip-path: circle()` over 600ms. Otherwise the theme switches instantly.
- Body background and text colors transition over 200ms.

### 6.4 Scroll reveal (`reveal` module)
- `.reveal` elements start at `opacity 0; translateY(16px)` and gain `.reveal-visible` when they intersect (`threshold 0.1`, `rootMargin 0 0 -10% 0`). Each is revealed once, then unobserved.
- List children get a staggered `transition-delay` of 60ms each, capped at 8 items.
- All of this only applies inside `@media (prefers-reduced-motion: no-preference)`. Otherwise content is simply visible.
- `html { scroll-behavior: smooth }` applies only when motion is allowed.

### 6.5 Navigation & keyboard (`nav`, `keyboard` modules)
- Keys `1`–`5` jump to sections. `Alt+K` opens the quick-jump `<dialog>` with a filter input. `/` opens it and focuses the input. `T` toggles the theme. `Esc` closes the dialog or drawer.
- Shortcuts are ignored when the target is an `input`, `textarea`, `select` or `contenteditable`, or when Ctrl/Meta is held (except the Alt+K combo).
- Quick jump: typing filters the section list, arrow keys move, Enter jumps.
- Mobile drawer: the hamburger toggles `aria-expanded`. It closes on nav click, backdrop click or Esc, and focus returns to the hamburger.
- Desktop collapse state is saved (`localStorage` key `sidebar-collapsed`, try/catch).

### 6.6 Clipboard (`clipboard` module)
- Email and Discord use `navigator.clipboard.writeText`. If that's unavailable or rejected, the text is selected in an element so the user can copy it manually, and the button shows `press ctrl+c`.
- Feedback is announced to screen readers through a `role="status"` live region.

### 6.7 Visitor counter (`visitors` module)
- Once per browser session (`sessionStorage` flag), it calls `https://abacus.jasoncameron.dev/hit/kenneth-valdez-portfolio/visits`. Later page views that session call `/get/...` instead.
- Uses a 3s timeout via `AbortController`. If there's no JSON `value` or anything fails, the counter row stays hidden (`hidden` attribute).
- The value is shown zero-padded to 4 digits.

## 7. CI/CD — `.github/workflows/deploy.yml`

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
  group: pages
  cancel-in-progress: false

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Validate HTML
        run: npx --yes html-validate@9 index.html
      - name: Syntax-check JavaScript
        run: node --check script.js && node --check assets/data.js
      - name: Check links and asset paths
        uses: lycheeverse/lychee-action@v2
        with:
          args: --offline --no-progress index.html
          fail: true

  deploy:
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
      - name: Stage site
        run: |
          mkdir _site
          cp -r index.html style.css script.js assets _site/
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site
      - id: deployment
        uses: actions/deploy-pages@v4
```

- An `.htmlvalidate.json` at the repo root extends `html-validate:recommended`, with rules relaxed only where the design needs it (e.g. inline SVG attributes).
- Only runtime files are deployed. `docs/`, `AGENTS.md` and `.github/` are not published.
- **Manual step for Kenneth:** repo Settings → Pages → Source: **GitHub Actions**.
- The README shows the workflow status badge.

## 8. Accessibility
- Semantic landmarks: `<aside>` + `<nav>` for the sidebar, `<main>`, one `<section>` per nav target with an `aria-labelledby` heading, and `<footer>`.
- Skip link to `#main`.
- Every icon-only control has an `aria-label`. Decorative SVGs have `aria-hidden="true"`.
- Visible `:focus-visible` outlines (2px `var(--fg)`, offset 2px).
- Muted text keeps at least 4.5:1 contrast on both backgrounds (`#6d6d72` on `#fff` ≈ 5.1:1; `#a6a6ad` on `rgb(12,12,15)` ≈ 8:1).

## 9. Testing & verification
1. `node --check script.js assets/data.js`
2. `npx --yes html-validate@9 index.html` and `lychee --offline index.html` (or the Docker image) run locally.
3. Serve with `python -m http.server`. Take screenshots at 375, 800 and 1280px widths in both themes, and compare against the React site's look.
4. Manual checklist: every keyboard shortcut; quick-jump filtering; drawer open/close/focus; email and Discord copy (including the fallback); pixel reveal by hover, focus and tap; theme ripple plus the no-View-Transitions fallback; reduced motion (DevTools emulation); visitor counter success and the forced-failure hide; the "Content failed to load" path with `data.js` removed.
5. Push a branch and confirm the `check` job passes on the PR before merging to `main`, then confirm the deploy job publishes the site.

## 10. Open items for Kenneth
- Confirm Junior High years (`2017 — 2023` overlaps Senior High `2021 — 2023`).
- Provide LinkedIn URL, Ambiancy description, AmIgo/Thready source links, and certifications when available. Each is a one-line edit in `assets/data.js`.
- Enable Pages → Source: GitHub Actions.
