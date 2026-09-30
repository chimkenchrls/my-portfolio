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

  /* chimken vs ck: the site owner's fixed high score (data.js `game`) is the
     score to beat. Beating it unlocks a crown, fireworks, and a brag to copy. */
  const gameOverSummary = (state, rival, crownUnlocked) => {
    const lines = ['GAME OVER', `score ${padCount(state.score, 5)} · best ${padCount(state.hi, 5)}`];
    const beat = Boolean(rival) && state.score > rival.highScore;
    if (rival) {
      lines.push(beat
        ? `you beat ${rival.owner}'s high score: ${rival.highScore}${crownUnlocked ? ' · crown unlocked' : ''}`
        : `you didn't beat ${rival.owner}'s high score: ${rival.highScore}`);
    }
    lines.push('space / tap to retry');
    return { beat, lines };
  };

  const passedRival = (previousScore, score, rival) => Boolean(rival)
    && previousScore <= rival.highScore && score > rival.highScore;

  const bragText = (score, rival, url) => `I scored ${score} on chimken and beat ${rival.owner}'s ${rival.highScore} 🐔 ${url}`;

  const SPARK_GRAVITY = 400;
  const spawnSparks = (x, y, count, random = Math.random) => Array.from({ length: count }, () => {
    const angle = random() * Math.PI * 2;
    const speed = 80 + random() * 160;
    return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 60, life: 0.8 + random() * 0.6 };
  });

  const stepSparks = (sparks, dt) => sparks
    .map((spark) => ({
      ...spark,
      x: spark.x + spark.vx * dt,
      y: spark.y + spark.vy * dt,
      vy: spark.vy + SPARK_GRAVITY * dt,
      life: spark.life - dt,
    }))
    .filter((spark) => spark.life > 0);

  /* chimken view + sky (pure). The playfield keeps its pixel size: wide
     screens show the full 600px world, phones show a narrower, taller slice
     with the ground pinned to the bottom and extra room for sky. */
  const chimkenView = (cssWidth, cssHeight) => {
    const scale = Math.max(1, cssWidth / CHIMKEN.width);
    const width = cssWidth / scale;
    const height = cssHeight / scale;
    return { scale, width, height, groundY: height - (CHIMKEN.height - CHIMKEN.groundY) };
  };

  const buildSky = (width, groundY, random = Math.random) => {
    const skyBottom = groundY - 36;
    const count = Math.max(8, Math.round((width * skyBottom) / 1800));
    const stars = Array.from({ length: count }, () => ({
      x: Math.floor(random() * width),
      y: 6 + Math.floor(random() * (skyBottom - 6)),
      size: random() < 0.2 ? 4 : 2,
      phase: random() * Math.PI * 2,
    }));
    const bodyY = 6 + Math.floor((skyBottom - 6) * 0.15);
    const clouds = Array.from({ length: Math.max(2, Math.round(width / 200)) }, () => ({
      x: Math.floor(random() * width),
      y: 10 + Math.floor(random() * Math.max(1, skyBottom - 30)),
    }));
    return {
      width, groundY, stars, clouds,
      moon: { x: Math.round(width * 0.72), y: bodyY },
      sun: { x: Math.round(width * 0.72), y: bodyY },
    };
  };

  // Parallax: a layer moves `factor` as fast as the ground, wrapping at `wrap`.
  const skyOffset = (distance, factor, wrap) => (((distance * factor) % wrap) + wrap) % wrap;

  const starAlpha = (phase, t, reduced) => (reduced
    ? 0.55
    : 0.3 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.6 + phase)));

  const resolveShortcut = (event, typing = false) => {
    const key = String(event.key || '');
    if (key === 'Escape') return { type: 'close' };
    if (event.altKey && !event.ctrlKey && !event.metaKey
      && (event.code === 'KeyK' || key.toLowerCase() === 'k')) {
      return { type: 'game' };
    }
    if (typing || event.altKey || event.ctrlKey || event.metaKey) return null;
    if (key === 't' || key === 'T') return { type: 'theme' };
    const section = SECTIONS.find((s) => s.key === key);
    return section ? { type: 'jump', id: section.id } : null;
  };

  // Joins optional text parts, skipping missing ones so a bad data.js edit
  // never prints "undefined".
  const joinParts = (parts, separator = ' · ') => parts
    .filter((part) => typeof part === 'string' && part.trim() !== '')
    .join(separator);

  // GitHub contributions payload → { days, total }, or null if unusable.
  const parseContributions = (payload) => {
    const days = payload && payload.contributions;
    if (!Array.isArray(days) || !days.length) return null;
    const valid = days.every((d) => d
      && /^\d{4}-\d{2}-\d{2}$/.test(d.date)
      && Number.isInteger(d.level) && d.level >= 0 && d.level <= 4
      && Number.isFinite(d.count));
    if (!valid) return null;
    const reported = payload.total && payload.total.lastYear;
    const total = Number.isFinite(reported) ? reported : days.reduce((sum, d) => sum + d.count, 0);
    return { days, total };
  };

  // Groups consecutive days into Sunday-first weeks; the first week is padded
  // with nulls so each day lands in its weekday row.
  const buildContributionWeeks = (days) => {
    const weeks = [];
    let week = new Array(new Date(`${days[0].date}T00:00:00Z`).getUTCDay()).fill(null);
    days.forEach((d) => {
      week.push(d);
      if (week.length === 7) { weeks.push(week); week = []; }
    });
    if (week.length) weeks.push(week);
    return weeks;
  };

  // Month label per column, GitHub-style: a week is labeled by the month of
  // its first day. A cramped first label (< 3 weeks wide) is dropped.
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthLabels = (weeks) => {
    const labels = [];
    let previous = -1;
    weeks.forEach((week, col) => {
      const first = week.find(Boolean);
      if (!first) return;
      const month = Number(first.date.slice(5, 7)) - 1;
      if (month !== previous) labels.push({ col, label: MONTHS[month] });
      previous = month;
    });
    if (labels.length > 1 && labels[1].col - labels[0].col < 3) labels.shift();
    return labels;
  };

  // Dot radius for an activity level (0–4), scaled like react-github-calendar.
  const dotRadius = (level, cellSize) => {
    const clamped = Math.min(Math.max(level, 0), 4);
    return (cellSize * (0.3 + (clamped / 4) * 0.7)) / 2;
  };

  /* chimken — a tiny endless runner (pure logic; drawing lives in the DOM section).
     Units: px and seconds. `y` is chimken's height above the ground. */
  const CHIMKEN = {
    width: 600,
    height: 150,
    groundY: 128,
    chimkenX: 36,
    chimkenSize: 24,
    gravity: 2400,
    holdGravity: 0.55,
    jumpVelocity: 700,
    startSpeed: 300,
    maxSpeed: 720,
    acceleration: 7,
    restartDelay: 0.5,
    bugs: {
      small: { w: 14, h: 12 },
      large: { w: 18, h: 16 },
      pair: { w: 32, h: 12 },
    },
  };

  const createChimkenState = (hi = 0) => ({
    status: 'ready',
    speed: CHIMKEN.startSpeed,
    distance: 0,
    score: 0,
    hi,
    overFor: 0,
    nextSpawnIn: CHIMKEN.width * 0.8,
    chimken: { y: 0, vy: 0, onGround: true },
    obstacles: [],
  });

  // Distance until the next bug: always long enough to land and jump again.
  const spawnGap = (speed, random = Math.random) => speed * (0.8 + random() * 0.9);

  const spawnBug = (random) => {
    const r = random();
    const kind = r < 0.5 ? 'small' : r < 0.8 ? 'large' : 'pair';
    return { x: CHIMKEN.width, ...CHIMKEN.bugs[kind], kind };
  };

  const hitsBug = (chimken, bug) => {
    const left = CHIMKEN.chimkenX + 4;
    const right = left + CHIMKEN.chimkenSize - 8;
    return left < bug.x + bug.w && right > bug.x && chimken.y < bug.h - 2;
  };

  const stepChimken = (state, dt, input, random = Math.random) => {
    if (state.status === 'ready') {
      if (!input.jump) return state;
      return stepChimken({ ...state, status: 'running' }, dt, input, random);
    }
    if (state.status === 'over') {
      const overFor = state.overFor + dt;
      if (input.jump && overFor >= CHIMKEN.restartDelay) {
        return stepChimken({ ...createChimkenState(state.hi), status: 'running' }, dt, input, random);
      }
      return { ...state, overFor };
    }

    const speed = Math.min(CHIMKEN.maxSpeed, state.speed + CHIMKEN.acceleration * dt);
    let { y, vy, onGround } = state.chimken;
    if (input.jump && onGround) { vy = CHIMKEN.jumpVelocity; onGround = false; }
    if (!onGround) {
      const gravity = input.holding && vy > 0 ? CHIMKEN.gravity * CHIMKEN.holdGravity : CHIMKEN.gravity;
      vy -= gravity * dt;
      y += vy * dt;
      if (y <= 0) { y = 0; vy = 0; onGround = true; }
    }
    const chimken = { y, vy, onGround };

    const moved = speed * dt;
    const obstacles = state.obstacles
      .map((bug) => ({ ...bug, x: bug.x - moved }))
      .filter((bug) => bug.x + bug.w > 0);
    let nextSpawnIn = state.nextSpawnIn - moved;
    if (nextSpawnIn <= 0) {
      obstacles.push(spawnBug(random));
      nextSpawnIn = spawnGap(speed, random);
    }

    const distance = state.distance + moved;
    const score = Math.floor(distance / 10);
    const next = { ...state, speed, distance, score, chimken, obstacles, nextSpawnIn };
    if (obstacles.some((bug) => hitsBug(chimken, bug))) {
      return { ...next, status: 'over', overFor: 0, hi: Math.max(state.hi, score) };
    }
    return next;
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
      if (!isOptionalText(profile.githubUsername)) errors.push('profile.githubUsername: text or null');
    }

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
    if (data.game !== undefined && data.game !== null) {
      const { owner, highScore } = data.game;
      if (!isText(owner) || !Number.isInteger(highScore) || highScore < 0) {
        errors.push('game: owner text and a non-negative integer highScore required');
      }
    }
    return errors;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      SECTIONS, padCount, safeUrl, computeTiles, revealDelays, joinParts,
      parseContributions, buildContributionWeeks, dotRadius, monthLabels,
      isTypingTarget, resolveShortcut, validateData,
      CHIMKEN, createChimkenState, stepChimken, spawnGap,
      chimkenView, buildSky, skyOffset, starAlpha,
      gameOverSummary, passedRival, bragText, spawnSparks, stepSparks,
    };
  }
  if (typeof document === 'undefined') return;

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
      titleEl.append(document.createTextNode(joinParts([title])));
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
        li.append(rowHead(cert.title, joinParts([cert.issuer, cert.date]), false));
        const link = safeUrl(cert.link);
        if (link) li.append(externalLink(link, 'view credential ↗', 'text-link row-link'));
        return li;
      });
    };

    const renderers = { social, highlights, experience, education, stack, projects, certifications };

    const showLoadError = (container) => {
      if (container.dataset.render === 'social') return; // static github link stays
      const tag = container.tagName === 'UL' || container.tagName === 'OL' ? 'li' : 'p';
      container.replaceChildren(pendingEl(tag, 'Content failed to load.'));
    };

    // The static markup carries the email as a no-JS fallback; data.js wins.
    const applyEmail = ({ profile = {} }) => {
      const email = typeof profile.email === 'string' ? profile.email.trim() : '';
      if (!safeUrl(`mailto:${email}`)) return;
      $$('a[data-email]').forEach((link) => { link.href = `mailto:${email}`; });
      $$('button[data-email]').forEach((button) => {
        button.dataset.copy = email;
        button.setAttribute('aria-label', `Copy email address ${email}`);
        const label = $('[data-copy-label]', button);
        if (label) label.textContent = email;
      });
    };

    const init = (data) => {
      const containers = $$('[data-render]');
      const errors = validateData(data);
      if (errors.length) console.warn('[portfolio] data.js problems:', errors);
      if (!data) { containers.forEach(showLoadError); return; }
      applyEmail(data);
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

    // The last section is short and may never cross the band; pin it at page bottom.
    const atBottom = () => window.innerHeight + window.scrollY >= root.scrollHeight - 4;
    const lastId = SECTIONS[SECTIONS.length - 1].id;

    const init = () => {
      setActive(SECTIONS[0].id);
      if (!('IntersectionObserver' in window)) return;
      const observer = new IntersectionObserver((entries) => {
        if (atBottom()) { setActive(lastId); return; }
        entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id); });
      }, { rootMargin: '-35% 0px -60% 0px' });
      SECTIONS.forEach(({ id }) => {
        const section = document.getElementById(id);
        if (section) observer.observe(section);
      });

      let ticking = false;
      window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
          ticking = false;
          if (atBottom()) setActive(lastId);
        });
      }, { passive: true });
    };

    return { init, jumpTo };
  })();

  /* ==========================================================================
     7. chimken — Alt+K mini game drawn over the pure engine in section 1
     ========================================================================== */

  const game = (() => {
    const dialog = $('.game');
    const canvas = $('.game-canvas');
    const scoreEl = $('.game-score');
    const closeButton = $('.game-close');
    const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
    const HI_KEY = 'chimken-hi';
    const PIXEL = 2;
    const SPRITES = {
      runA: [
        '......X.X...', '.....XXXX...', '.....X.XXX..', '.....XXXXXXX',
        'X....XXXXX..', 'XX..XXXXXX..', 'XXXXXXXXXX..', 'XXXXXXXXXX..',
        '.XXXXXXXXX..', '..XXXXXXX...', '...X...X....', '..XX..XX....',
      ],
      runB: [
        '......X.X...', '.....XXXX...', '.....X.XXX..', '.....XXXXXXX',
        'X....XXXXX..', 'XX..XXXXXX..', 'XXXXXXXXXX..', 'XXXXXXXXXX..',
        '.XXXXXXXXX..', '..XXXXXXX...', '....X.X.....', '....XX.XX...',
      ],
      air: [
        '......X.X...', '.....XXXX...', '.....X.XXX..', '.....XXXXXXX',
        'X....XXXXX..', 'XX..XXXXXX..', 'XXXXXXXXXX..', 'XXXXXXXXXX..',
        '.XXXXXXXXX..', '..XXXXXXX...', '...XX.XX....', '............',
      ],
      bugSmall: ['X.....X', '.X...X.', '..XXX..', '.XXXXX.', 'XXXXXXX', '.X.X.X.'],
      moon: [
        '..XXXX...', '.XXX.....', 'XXX......', 'XX.......', 'XX.......',
        'XX.......', 'XXX......', '.XXX.....', '..XXXX...',
      ],
      sun: [
        '....X....', '.X.....X.', '...XXX...', '..X...X..', 'X.X...X.X',
        '..X...X..', '...XXX...', '.X.....X.', '....X....',
      ],
      crown: ['X.X.X', 'XXXXX'],
      cloud: ['....XXXX......', '..XX....XX....', '.X........XXX.', 'X.............X', 'XXXXXXXXXXXXXXX'],
      bugLarge: [
        'X.......X', '.X.....X.', '..XXXXX..', '.XX.X.XX.',
        'XXXXXXXXX', 'XXX.X.XXX', '.XXXXXXX.', 'X.X.X.X.X',
      ],
    };
    let state = createChimkenState();
    let input = { jump: false, holding: false };
    let raf = 0;
    let last = 0;
    let shownScore = '';
    let returnFocus = null;
    let view = chimkenView(CHIMKEN.width, CHIMKEN.height);
    const bragButton = $('.game-brag');
    const CROWN_KEY = 'chimken-crown';
    let rival = null;
    let crowned = false;
    let newlyCrowned = false;
    let crownedThisRun = false;
    let sparks = [];
    let flashUntil = 0;
    let sky = null;
    let clock = 0;

    const pad = (n) => String(n).padStart(5, '0');
    const token = (name) => getComputedStyle(root).getPropertyValue(name).trim();

    // Same seed every time so the sky layout is stable between opens.
    const seededRandom = (seed) => () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const fitCanvas = () => {
      const ratio = window.devicePixelRatio || 1;
      const cssWidth = canvas.clientWidth || CHIMKEN.width;
      const cssHeight = canvas.clientHeight || CHIMKEN.height;
      const w = Math.max(1, Math.round(cssWidth * ratio));
      const h = Math.max(1, Math.round(cssHeight * ratio));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      view = chimkenView(cssWidth, cssHeight);
      if (!sky || sky.width !== view.width || sky.groundY !== view.groundY) {
        sky = buildSky(view.width, view.groundY, seededRandom(7));
      }
      const unit = (w / cssWidth) * view.scale;
      ctx.setTransform(unit, 0, 0, unit, 0, 0);
    };

    const drawSprite = (rows, x, bottom) => {
      const top = bottom - rows.length * PIXEL;
      rows.forEach((row, r) => {
        for (let c = 0; c < row.length; c += 1) {
          if (row[c] === 'X') ctx.fillRect(Math.round(x) + c * PIXEL, Math.round(top) + r * PIXEL, PIXEL, PIXEL);
        }
      });
    };

    // Faint plate behind a message block so stars don't twinkle through the text.
    const drawPlate = (top, bottom, width) => {
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = token('--bg');
      ctx.fillRect(Math.round((view.width - width) / 2), Math.round(top), Math.round(width), Math.round(bottom - top));
      ctx.globalAlpha = 1;
    };

    const drawText = (text, y, font, fill) => {
      ctx.font = font;
      ctx.fillStyle = fill;
      ctx.textAlign = 'center';
      ctx.fillText(text, view.width / 2, y);
    };

    // Wraps a drifting x back to the right edge once it leaves on the left.
    const drift = (x, factor, travel, margin) => {
      const span = view.width + margin * 2;
      return ((((x + margin - travel * factor) % span) + span) % span) - margin;
    };

    const drawSky = (fg, muted) => {
      const dark = root.getAttribute('data-theme') === 'dark';
      const reduced = prefersReducedMotion();
      const travel = reduced ? 0 : state.distance;
      const bottomOf = (body, rows) => body.y + rows.length * PIXEL;
      if (dark) {
        ctx.fillStyle = fg;
        const shift = skyOffset(travel, 0.08, view.width);
        sky.stars.forEach((star) => {
          ctx.globalAlpha = starAlpha(star.phase, clock, reduced);
          const x = (star.x - shift + view.width) % view.width;
          ctx.fillRect(Math.round(x), star.y, star.size, star.size);
        });
        ctx.globalAlpha = 0.85;
        drawSprite(SPRITES.moon, drift(sky.moon.x, 0.02, travel, 30), bottomOf(sky.moon, SPRITES.moon));
      } else {
        ctx.fillStyle = muted;
        ctx.globalAlpha = 0.5;
        drawSprite(SPRITES.sun, drift(sky.sun.x, 0.02, travel, 30), bottomOf(sky.sun, SPRITES.sun));
        ctx.globalAlpha = 0.35;
        sky.clouds.forEach((cloud) => {
          drawSprite(SPRITES.cloud, drift(cloud.x, 0.25, travel, 40), bottomOf(cloud, SPRITES.cloud));
        });
      }
      ctx.globalAlpha = 1;
    };

    const draw = () => {
      fitCanvas();
      const fg = token('--fg');
      const muted = token('--fg-muted');
      const ground = view.groundY;
      ctx.clearRect(0, 0, view.width, view.height);

      drawSky(fg, muted);

      ctx.fillStyle = muted;
      ctx.fillRect(0, ground, view.width, 1);
      const offset = state.distance % 12;
      for (let x = -offset; x < view.width; x += 12) ctx.fillRect(x, ground + 5, 2, 1);

      ctx.fillStyle = fg;
      state.obstacles.forEach((bug) => {
        if (bug.kind === 'pair') {
          drawSprite(SPRITES.bugSmall, bug.x, ground);
          drawSprite(SPRITES.bugSmall, bug.x + 18, ground);
        } else {
          drawSprite(bug.kind === 'large' ? SPRITES.bugLarge : SPRITES.bugSmall, bug.x, ground);
        }
      });

      const { chimken } = state;
      let sprite = SPRITES.runA;
      if (!chimken.onGround) sprite = SPRITES.air;
      else if (state.status === 'running' && Math.floor(state.distance / 30) % 2) sprite = SPRITES.runB;
      drawSprite(sprite, CHIMKEN.chimkenX, ground - chimken.y);
      if (crowned) {
        const headTop = ground - chimken.y - sprite.length * PIXEL;
        drawSprite(SPRITES.crown, CHIMKEN.chimkenX + 5 * PIXEL, headTop - 1);
      }

      sparks.forEach((spark) => {
        ctx.globalAlpha = Math.min(1, spark.life);
        ctx.fillRect(Math.round(spark.x), Math.round(spark.y), 2, 2);
      });
      ctx.globalAlpha = 1;

      // Messages sit in the middle of the playfield (tall on phones).
      const mid = Math.min(view.height / 2, ground - 60);
      const mono = '12px "Geist Mono", ui-monospace, monospace';
      const pixel = '18px "Geist Pixel", "Geist Mono", monospace';
      if (state.status === 'ready') {
        drawText('press space or tap to start', mid, mono, muted);
        if (rival) drawText(`beat ${rival.owner}'s high score: ${rival.highScore}`, mid + 20, mono, muted);
      }
      if (state.status === 'running' && clock < flashUntil && rival) {
        drawText(`passed ${rival.owner}!`, mid - 20, '14px "Geist Pixel", "Geist Mono", monospace', fg);
      }
      if (state.status === 'over') {
        const { beat, lines } = gameOverSummary(state, rival, crownedThisRun);
        const [title, stats, ...rest] = lines;
        const hint = rest.pop();
        ctx.font = mono;
        const widest = Math.max(...lines.map((text) => ctx.measureText(text).width));
        drawPlate(mid - 54, mid + 46, Math.min(view.width, widest + 32));
        drawText(title, mid - 32, pixel, fg);
        drawText(stats, mid - 8, mono, muted);
        if (rest.length) drawText(rest[0], mid + 12, mono, beat ? fg : muted);
        drawText(hint, mid + 36, mono, muted);
      }

      const score = `${pad(state.score)}  HI ${pad(state.hi)}`;
      if (score !== shownScore) { scoreEl.textContent = score; shownScore = score; }
    };

    const frame = (now) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      clock = now / 1000;
      const wasOver = state.status === 'over';
      const previousScore = state.score;
      state = stepChimken(state, dt, input);
      input.jump = false;
      if (wasOver && state.status === 'running') { bragButton.hidden = true; crownedThisRun = false; }
      if (passedRival(previousScore, state.score, rival)) {
        sparks = sparks.concat(spawnSparks(view.width / 2, view.height * 0.3, 28));
        flashUntil = clock + 1.6;
        if (!crowned) {
          crowned = true;
          newlyCrowned = true;
          storage.set('localStorage', CROWN_KEY, '1');
        }
      }
      sparks = stepSparks(sparks, dt);
      if (!wasOver && state.status === 'over') {
        storage.set('localStorage', HI_KEY, String(state.hi));
        crownedThisRun = newlyCrowned;
        newlyCrowned = false;
        const summary = gameOverSummary(state, rival, crownedThisRun);
        announce(summary.lines.slice(0, -1).join('. '));
        if (summary.beat) {
          bragButton.dataset.copy = bragText(state.score, rival, `${window.location.origin}${window.location.pathname}`);
          bragButton.hidden = false;
        }
      }
      draw();
      raf = window.requestAnimationFrame(frame);
    };

    const stop = () => {
      window.cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
      input = { jump: false, holding: false };
    };

    const isOpen = () => Boolean(dialog && dialog.open);

    const open = () => {
      if (!dialog || !ctx || typeof dialog.showModal !== 'function' || isOpen()) return;
      returnFocus = document.activeElement;
      layout.closeDrawer({ restoreFocus: false });
      const saved = Math.floor(Number(storage.get('localStorage', HI_KEY)));
      state = createChimkenState(Number.isFinite(saved) && saved > 0 ? saved : 0);
      shownScore = '';
      crowned = storage.get('localStorage', CROWN_KEY) === '1';
      newlyCrowned = false;
      crownedThisRun = false;
      sparks = [];
      flashUntil = 0;
      bragButton.hidden = true;
      dialog.showModal();
      canvas.focus();
      stop();
      raf = window.requestAnimationFrame(frame);
    };

    const close = () => { if (isOpen()) dialog.close(); };

    const press = () => { input.jump = true; input.holding = true; };
    const release = () => { input.holding = false; };
    const isJumpKey = (event) => event.key === ' ' || event.key === 'ArrowUp' || event.code === 'Space';

    const init = (data) => {
      const game = data && data.game;
      if (game && typeof game.owner === 'string' && Number.isInteger(game.highScore) && game.highScore >= 0) {
        rival = { owner: game.owner, highScore: game.highScore };
      }
      const triggers = $$('.game-trigger, .topbar-game');
      if (!dialog || !ctx || typeof dialog.showModal !== 'function') {
        triggers.forEach((button) => { button.hidden = true; });
        return;
      }
      triggers.forEach((button) => button.addEventListener('click', open));
      closeButton.addEventListener('click', close);
      dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
      dialog.addEventListener('keydown', (event) => {
        if (!isJumpKey(event) || event.target === closeButton) return;
        event.preventDefault();
        if (!event.repeat) press();
      });
      dialog.addEventListener('keyup', (event) => { if (isJumpKey(event)) release(); });
      canvas.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        canvas.focus();
        press();
      });
      ['pointerup', 'pointercancel'].forEach((type) => dialog.addEventListener(type, release));
      dialog.addEventListener('close', () => {
        stop();
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
            game.close();
            layout.closeDrawer();
            break;
          case 'game':
            event.preventDefault();
            game.open();
            break;
          case 'theme':
            theme.toggle();
            break;
          case 'jump':
            event.preventDefault();
            game.close();
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
    const toast = $('.toast');
    const toastText = $('.toast-text');
    const toastInput = $('.toast-input');
    let toastTimer = 0;
    let returnFocus = null;

    const isVisible = (node) => Boolean(node) && node.getClientRects().length > 0;

    const hideToast = () => {
      toast.hidden = true;
      if (document.activeElement === toastInput && returnFocus && isVisible(returnFocus)) {
        returnFocus.focus({ preventScroll: true });
      }
      returnFocus = null;
    };

    // Visible feedback that works in rail mode, where button labels are hidden.
    // With copyText, shows a pre-selected read-only field (text inside a
    // <button> can't be selected in Firefox).
    const showToast = (message, copyText, ms, button) => {
      toastText.textContent = message;
      toastInput.hidden = !copyText;
      toast.hidden = false;
      if (copyText) {
        returnFocus = button;
        toastInput.value = copyText;
        toastInput.focus();
        toastInput.select();
      }
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(hideToast, ms);
    };

    const flashLabel = (button, message) => {
      const label = $('[data-copy-label]', button);
      if (!isVisible(label)) return false;
      if (label.dataset.original === undefined) label.dataset.original = label.textContent;
      label.textContent = message;
      window.clearTimeout(Number(button.dataset.timer));
      button.dataset.timer = String(window.setTimeout(() => {
        label.textContent = label.dataset.original;
      }, 1500));
      return true;
    };

    const copy = async (button) => {
      const text = button.dataset.copy;
      try {
        if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard API unavailable');
        await navigator.clipboard.writeText(text);
        if (!flashLabel(button, 'copied!')) showToast(`copied ${text}`, null, 1500, button);
        announce(`Copied ${text} to clipboard`);
      } catch {
        showToast('press ctrl+c to copy', text, 6000, button);
        announce(`Press Control plus C to copy ${text}`);
      }
    };

    const init = () => {
      if (!toast || !toastText || !toastInput) return;
      document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-copy]');
        if (button) copy(button);
      });
      toastInput.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') hideToast();
      });
    };

    return { init };
  })();

  /* ==========================================================================
     10. Scroll reveal — fade + slide up once, staggered in lists
     ========================================================================== */

  const reveal = (() => {
    const SINGLE = ['.github-panel', '.divider', '.about-bio', '.chips', '.timeline-block', '.list-head'];
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

  /* ==========================================================================
     13. GitHub contributions — dot calendar under the stack, hidden on failure
     ========================================================================== */

  const githubGraph = (() => {
    const API = 'https://github-contributions-api.jogruber.de/v4';
    const CELL = 14;
    const DOT = 10;
    const TIMEOUT_MS = 5000;
    const SVG_NS = 'http://www.w3.org/2000/svg';

    const svgEl = (tag, attrs) => {
      const node = document.createElementNS(SVG_NS, tag);
      Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
      return node;
    };

    const draw = (graph, days) => {
      const weeks = buildContributionWeeks(days);
      const width = weeks.length * CELL;
      const height = 7 * CELL;
      // Scales to the panel width: the whole year always fits, never scrolls.
      const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img' });
      svg.setAttribute('aria-label', 'GitHub contribution activity over the last year');
      weeks.forEach((week, col) => {
        week.forEach((d, row) => {
          if (!d) return;
          const dot = svgEl('circle', {
            cx: col * CELL + CELL / 2,
            cy: row * CELL + CELL / 2,
            r: dotRadius(d.level, DOT),
            fill: 'currentColor',
          });
          if (d.level === 0) dot.setAttribute('class', 'github-dot-empty');
          const title = svgEl('title', {});
          title.textContent = `${d.count} contribution${d.count === 1 ? '' : 's'} on ${d.date}`;
          dot.append(title);
          svg.append(dot);
        });
      });
      const months = el('div', 'github-months');
      months.setAttribute('aria-hidden', 'true');
      monthLabels(weeks).forEach(({ col, label }) => {
        const tag = el('span', 'github-month', label);
        tag.style.left = `${(col / weeks.length) * 100}%`;
        months.append(tag);
      });
      graph.replaceChildren(months, svg);
    };

    const load = async (panel, username) => {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const response = await fetch(`${API}/${encodeURIComponent(username)}?y=last`, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const parsed = parseContributions(await response.json());
        if (!parsed) throw new Error('Unusable contributions payload');
        panel.hidden = false;
        draw($('.github-graph', panel), parsed.days);
        $('.github-total', panel).textContent =
          `${parsed.total.toLocaleString('en-US')} contribution${parsed.total === 1 ? '' : 's'} in the last year`;
      } catch {
        panel.hidden = true;
      } finally {
        window.clearTimeout(timer);
      }
    };

    const init = (data) => {
      const panel = $('.github-panel');
      const profile = (data && data.profile) || {};
      const username = typeof profile.githubUsername === 'string' ? profile.githubUsername.trim() : '';
      if (!panel || !username || typeof fetch !== 'function' || typeof AbortController !== 'function') return;

      const link = $('.github-user', panel);
      link.href = `https://github.com/${encodeURIComponent(username)}`;
      link.textContent = `@${username} ↗`;

      const section = document.getElementById('stack');
      if (!('IntersectionObserver' in window) || !section) { load(panel, username); return; }
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        load(panel, username);
      }, { rootMargin: '400px 0px' });
      observer.observe(section);
    };

    return { init };
  })();

  /* ==========================================================================
     99. Boot
     ========================================================================== */

  const init = () => {
    const data = typeof PORTFOLIO_DATA !== 'undefined' ? PORTFOLIO_DATA : null;
    render.init(data);
    theme.init();
    layout.init();
    nav.init();
    game.init(data);
    keyboard.init();
    clipboard.init();
    pixelPhoto.init();
    reveal.init();
    visitors.init();
    githubGraph.init(data);
    const year = $('.footer-year');
    if (year) year.textContent = String(new Date().getFullYear());
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
