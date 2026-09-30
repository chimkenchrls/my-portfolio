/**
 * Kenneth Charles Valdez - Brutalist Monochromatic Portfolio Script
 * Terminal-inspired interactions, keyboard navigation listeners, theme toggle, and copy utilities
 * Plain ES6+ Vanilla JavaScript - Zero external dependencies
 */

(() => {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. Theme Switcher (Monochromatic Light / Dark Mode)
  // --------------------------------------------------------------------------
  const initTheme = () => {
    const themeBtn = document.getElementById('theme-toggle-btn');
    const themeLabel = document.getElementById('theme-mode-label');
    if (!themeBtn || !themeLabel) return;

    // Check saved theme or system preference
    const savedTheme = localStorage.getItem('kv-portfolio-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    const applyTheme = (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      themeBtn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      themeLabel.textContent = theme === 'dark' ? '[MODE: DARK]' : '[MODE: LIGHT]';
      localStorage.setItem('kv-portfolio-theme', theme);
    };

    applyTheme(initialTheme);

    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const target = current === 'dark' ? 'light' : 'dark';
      applyTheme(target);
    });
  };

  // --------------------------------------------------------------------------
  // 2. Mobile Sidebar Hamburger Menu
  // --------------------------------------------------------------------------
  const initMobileNav = () => {
    const toggleBtn = document.getElementById('mobile-nav-toggle');
    const sidebar = document.getElementById('sidebar');
    const navLinks = document.querySelectorAll('.nav-link');
    if (!toggleBtn || !sidebar) return;

    const toggleSidebar = () => {
      const isOpen = sidebar.classList.contains('mobile-open');
      if (isOpen) {
        sidebar.classList.remove('mobile-open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      } else {
        sidebar.classList.add('mobile-open');
        toggleBtn.setAttribute('aria-expanded', 'true');
      }
    };

    toggleBtn.addEventListener('click', toggleSidebar);

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (sidebar.classList.contains('mobile-open')) {
          toggleSidebar();
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && sidebar.classList.contains('mobile-open')) {
        toggleSidebar();
      }
    });
  };

  // --------------------------------------------------------------------------
  // 3. Plaintext Email Clipboard Copy Utility
  // --------------------------------------------------------------------------
  const initCopyEmail = () => {
    const copyBtn = document.getElementById('copy-email-btn');
    const feedback = document.getElementById('copy-feedback');
    const emailLink = document.getElementById('email-link');
    if (!copyBtn || !feedback || !emailLink) return;

    const email = emailLink.textContent.trim();

    copyBtn.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(email);
        } else {
          // Fallback
          const tempInput = document.createElement('input');
          tempInput.value = email;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
        }

        feedback.textContent = '[COPIED TO CLIPBOARD]';
        setTimeout(() => {
          feedback.textContent = '';
        }, 2200);
      } catch (err) {
        feedback.textContent = '[COPY FAILED]';
      }
    });
  };

  // --------------------------------------------------------------------------
  // 4. Quick Navigation Modal Dialog & Alt + K Shortcut
  // --------------------------------------------------------------------------
  const initQuickJumpDialog = () => {
    const dialog = document.getElementById('quick-jump-dialog');
    const triggerBtn = document.getElementById('search-trigger-btn');
    const closeBtn = document.getElementById('dialog-close-btn');
    const jumpLinks = document.querySelectorAll('.quick-jump-item');
    if (!dialog || !triggerBtn || !closeBtn) return;

    const openDialog = () => {
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
      triggerBtn.setAttribute('aria-expanded', 'true');
    };

    const closeDialog = () => {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
      triggerBtn.setAttribute('aria-expanded', 'false');
    };

    triggerBtn.addEventListener('click', openDialog);
    closeBtn.addEventListener('click', closeDialog);

    // Jump links close modal on click
    jumpLinks.forEach(link => {
      link.addEventListener('click', () => {
        closeDialog();
      });
    });

    // Close on backdrop click
    dialog.addEventListener('click', (e) => {
      const rect = dialog.getBoundingClientRect();
      const inDialog = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (!inDialog) {
        closeDialog();
      }
    });
  };

  // --------------------------------------------------------------------------
  // 5. Global Keyboard Shortcut Navigation Listeners
  // --------------------------------------------------------------------------
  const initKeyboardNavigation = () => {
    const dialog = document.getElementById('quick-jump-dialog');
    const sections = {
      '1': '#home',
      '2': '#about',
      '3': '#projects',
      '4': '#certifications',
      '5': '#contact'
    };

    document.addEventListener('keydown', (e) => {
      const activeElement = document.activeElement;
      const isInput = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
      );

      // Alt + K shortcut for Quick Navigation Dialog
      if ((e.altKey && (e.key === 'k' || e.key === 'K')) ||
          ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K'))) {
        e.preventDefault();
        if (dialog) {
          if (dialog.open) {
            dialog.close();
          } else {
            dialog.showModal();
          }
        }
        return;
      }

      // Ignore single number shortcuts if user is typing in a form
      if (isInput) return;

      // 1-5 keys for jumping between sections
      if (sections[e.key]) {
        const targetSection = document.querySelector(sections[e.key]);
        if (targetSection) {
          e.preventDefault();
          targetSection.scrollIntoView({ behavior: 'smooth' });
          if (dialog && dialog.open) {
            dialog.close();
          }
        }
      }
    });
  };

  // --------------------------------------------------------------------------
  // 6. ScrollSpy Active Navigation Highlighting
  // --------------------------------------------------------------------------
  const initScrollSpy = () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const sectionIds = ['home', 'about', 'projects', 'certifications', 'contact'];

    const onScroll = () => {
      const scrollPos = window.scrollY + 180;

      sectionIds.forEach(id => {
        const section = document.getElementById(id);
        if (!section) return;

        const top = section.offsetTop;
        const height = section.offsetHeight;

        if (scrollPos >= top && scrollPos < top + height) {
          navLinks.forEach(link => {
            if (link.getAttribute('data-nav') === id) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  };

  // --------------------------------------------------------------------------
  // 7. Brutalist Contact Form Validation & Feedback
  // --------------------------------------------------------------------------
  const initContactForm = () => {
    const form = document.getElementById('direct-message-form');
    const statusRegion = document.getElementById('form-response-status');
    const submitBtn = document.getElementById('form-submit-btn');
    if (!form || !statusRegion) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('form-sender-name');
      const email = document.getElementById('form-sender-email');
      const body = document.getElementById('form-sender-body');

      const nameErr = document.getElementById('name-error-msg');
      const emailErr = document.getElementById('email-error-msg');
      const bodyErr = document.getElementById('body-error-msg');

      // Clear errors
      nameErr.textContent = '';
      emailErr.textContent = '';
      bodyErr.textContent = '';
      statusRegion.className = 'form-status-region';
      statusRegion.textContent = '';

      let hasError = false;

      if (!name.value.trim()) {
        nameErr.textContent = 'err: name field required';
        hasError = true;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.value.trim() || !emailRegex.test(email.value.trim())) {
        emailErr.textContent = 'err: valid email address required';
        hasError = true;
      }

      if (!body.value.trim()) {
        bodyErr.textContent = 'err: message payload cannot be empty';
        hasError = true;
      }

      if (hasError) {
        statusRegion.className = 'form-status-region error';
        statusRegion.textContent = '[VALIDATION FAILED - CHECK REQUIRED FIELDS]';
        return;
      }

      // Simulate submission
      submitBtn.disabled = true;
      submitBtn.textContent = '[TRANSMITTING PAYLOAD...]';

      setTimeout(() => {
        statusRegion.className = 'form-status-region success';
        statusRegion.textContent = `[TRANSMISSION SUCCESSFUL - ACK RECEIVED FOR ${email.value.trim()}]`;
        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = '[SEND PAYLOAD]';
      }, 700);
    });
  };

  // --------------------------------------------------------------------------
  // 7b. Scroll Reveal Animations (IntersectionObserver)
  // --------------------------------------------------------------------------
  const initScrollReveal = () => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Elements to animate individually
    const singleTargets = [
      '.section-title-bar',
      '.about-body-text',
      '.toolchain-box',
      '.stats-grid',
      '.project-list-container',
      '.certifications-list-container',
      '.contact-box-grid',
      '.hero-name',
      '.hero-bio',
      '.hero-social-links',
      '.hero-portrait-col',
    ];

    // Elements to stagger per-child
    const staggerTargets = [
      { parent: '.stat-cell', selector: '.stats-grid' },
      { parent: '.project-list-item', selector: '.project-list-rows' },
      { parent: '.contact-box', selector: '.contact-box-grid' },
    ];

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.setAttribute('data-animate', 'visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    // Tag and observe single targets
    singleTargets.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        // Hero elements are above-fold — mark visible immediately
        const inHero = el.closest('#home');
        el.setAttribute('data-animate', inHero ? 'visible' : '');
        if (!inHero) observer.observe(el);
      });
    });

    // Tag stagger children
    staggerTargets.forEach(({ parent, selector }) => {
      document.querySelectorAll(selector).forEach(container => {
        const children = container.querySelectorAll(`:scope > ${parent.replace('.', '')}, :scope > li`);
        children.forEach((child, i) => {
          child.setAttribute('data-animate', '');
          child.setAttribute('data-animate-delay', String((i % 4) + 1));
          observer.observe(child);
        });
      });
    });
  };

  // --------------------------------------------------------------------------
  // 8. Desktop Sidebar Collapse Toggle
  // --------------------------------------------------------------------------
  const initSidebarCollapse = () => {
    const sidebar = document.getElementById('sidebar');
    const collapseBtn = document.getElementById('sidebar-collapse-btn');
    const collapseIcon = document.getElementById('collapse-icon');
    if (!sidebar || !collapseBtn || !collapseIcon) return;

    const STORAGE_KEY = 'kv-sidebar-collapsed';

    const applyCollapsed = (collapsed) => {
      if (collapsed) {
        sidebar.classList.add('sidebar--collapsed');
        collapseIcon.textContent = '[>>]';
        collapseBtn.setAttribute('aria-expanded', 'false');
      } else {
        sidebar.classList.remove('sidebar--collapsed');
        collapseIcon.textContent = '[<<]';
        collapseBtn.setAttribute('aria-expanded', 'true');
      }
    };

    // Restore saved state
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState === 'true') {
      applyCollapsed(true);
    }

    collapseBtn.addEventListener('click', () => {
      const isCollapsed = sidebar.classList.contains('sidebar--collapsed');
      applyCollapsed(!isCollapsed);
      localStorage.setItem(STORAGE_KEY, String(!isCollapsed));
    });
  };

  // --------------------------------------------------------------------------
  // Initialize Components on DOMContentLoaded
  // --------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileNav();
    initCopyEmail();
    initQuickJumpDialog();
    initKeyboardNavigation();
    initScrollSpy();
    initContactForm();
    initScrollReveal();
    initSidebarCollapse();
  });
})();
