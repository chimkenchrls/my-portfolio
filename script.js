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

  // Joins optional text parts, skipping missing ones so a bad data.js edit
  // never prints "undefined".
  const joinParts = (parts, separator = ' · ') => parts
    .filter((part) => typeof part === 'string' && part.trim() !== '')
    .join(separator);

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
      SECTIONS, padCount, safeUrl, computeTiles, revealDelays, joinParts,
      isTypingTarget, resolveShortcut, filterSections, validateData,
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

    const renderers = { social, stats, highlights, experience, education, stack, projects, certifications };

    const showLoadError = (container) => {
      if (container.dataset.render === 'social') return; // static github link stays
      if (container.tagName === 'DL') { container.hidden = true; return; }
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

  /* ==========================================================================
     99. Boot
     ========================================================================== */

  const init = () => {
    const data = typeof PORTFOLIO_DATA !== 'undefined' ? PORTFOLIO_DATA : null;
    render.init(data);
    theme.init();
    layout.init();
    nav.init();
    quickJump.init();
    keyboard.init();
    clipboard.init();
    pixelPhoto.init();
    reveal.init();
    visitors.init();
    const year = $('.footer-year');
    if (year) year.textContent = String(new Date().getFullYear());
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
