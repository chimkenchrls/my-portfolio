# Agent Instructions: Static Website Project
1. Project Overview
Project Name: Kenneth Charles Valdez Portfolio

Category: Personal Portfolio

Description: This portfolio showcases hands-on expertise in cloud infrastructure automation, CI/CD pipeline construction, and containerized deployments designed for hiring managers and technical recruiters looking for junior or associate DevOps talent. It bridges the gap between software development and operations by demonstrating practical experience with modern cloud architectures, infrastructure as code, and system reliability monitoring.

Primary Goal: Showcase portfolio

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

Typography: Geist (body), Geist Mono (nav, labels, metadata, dates, tags; uppercase with wide letter-spacing for section labels; sidebar nav and actions in Title Case), Geist Pixel (hero name only).

Layout: fixed 260px sidebar + scrolling main column (max 880px) on desktop (>1024px, collapsible to a 64px rail); 64px icon rail on tablet (640–1024px); sticky top bar + slide-in drawer on mobile (<640px).

Visual Style: 1px `var(--border)` dividers; gradient-line section dividers with mono labels; list rows with the title on the left and the date/status on the right in small muted mono; dashed borders mark "coming soon" content. Imagery is black-and-white.

Motion (all disabled under `prefers-reduced-motion`): one-shot scroll reveal (fade + 16px slide, 60ms stagger); 8×8 pixel-tile photo reveal on hover/focus/tap; circular View Transition ripple on theme toggle.

## 5. Sections
Sidebar: name, nav (Home, About, Stack, Projects, Certifications, keys 1–5), "Play chimken" mini game (Alt+K; also a chicken button in the mobile top bar — endless runner in a <dialog>/<canvas>, pure engine tested in tests/chimken.test.js; ck's score to beat is `game.highScore` in data.js — beating it unlocks a saved crown, pixel fireworks, and a copy-brag button), status "open to OJT / internship", copyable email, visitor count (abacus API, hidden on failure), theme toggle (T), collapse.
Main (centered column): hero (pixel photo, tagline, name, title, location, Email me, github / linkedin / discord) → About (bio, highlight chips, Experience + Education) → Stack (+ GitHub contributions dot calendar from github-contributions-api.jogruber.de, lazy-loaded, hidden on failure) → Projects → Certifications → 06 // Outside the IDE (not in the nav: intro text beside a tap/swipe/arrow-key photo deck; photos in assets/outside/, list in data.js `outside` + `outsideIntro`; B&W, hold for color) → footer `© <year> Kenneth Charles`.

## 6. Agent Rules of Engagement
- Content changes go in `assets/data.js` only; use `null` for missing items (never `""`), and never invent metrics, projects, or credentials.
- Run `node --test tests/*.test.js` before committing; CI runs the same tests plus html-validate and lychee.
- Generate complete code with no placeholders or truncated snippets. Prefer semantic HTML (`aside`, `nav`, `main`, `section`, `dl`, `dialog`, `footer`).
- Keep CSS organized under the numbered section headers using the tokens above. Keep JS modular inside the IIFE; pure logic goes in section 1 with tests.
- Wrap all storage access in try/catch; build DOM with `textContent`, never `innerHTML` with data.
