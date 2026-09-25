/**
 * PillNav Component — Vanilla JS / ES Module
 * Replicates React Bits PillNav with 100% fidelity using GSAP.
 */

export class PillNav {
  constructor(options = {}) {
    this.container = typeof options.container === 'string'
      ? document.querySelector(options.container)
      : options.container;

    if (!this.container) {
      console.warn('PillNav: target container not found');
      return;
    }

    this.logo = options.logo || '📐';
    this.logoAlt = options.logoAlt || 'Craft Your Archi';
    this.items = options.items || [];
    this.activeHref = options.activeHref || (this.items[0]?.href || '');
    this.className = options.className || '';
    this.ease = options.ease || 'power3.out';
    this.baseColor = options.baseColor || '#38bdf8';
    this.pillColor = options.pillColor || '#0f172a';
    this.hoveredPillTextColor = options.hoveredPillTextColor || '#030712';
    this.pillTextColor = options.pillTextColor || '#cbd5e1';
    this.initialLoadAnimation = options.initialLoadAnimation !== false;
    this.onItemClick = options.onItemClick || null;
    this.onMobileMenuClick = options.onMobileMenuClick || null;

    this.isMobileMenuOpen = false;
    this.circleRefs = [];
    this.tlRefs = [];
    this.activeTweenRefs = [];
    this.logoTween = null;

    this.render();
    this.initGSAP();
  }

  render() {
    const cssVars = `
      --base: ${this.baseColor};
      --pill-bg: ${this.pillColor};
      --hover-text: ${this.hoveredPillTextColor};
      --pill-text: ${this.pillTextColor};
    `;

    const isLogoImg = typeof this.logo === 'string' && (this.logo.includes('/') || this.logo.includes('.'));

    this.container.innerHTML = `
      <div class="pill-nav-container">
        <nav class="pill-nav ${this.className}" aria-label="Primary" style="${cssVars}">
          <a class="pill-logo" href="${this.items[0]?.href || '#'}" aria-label="Home">
            ${isLogoImg 
              ? `<img src="${this.logo}" alt="${this.logoAlt}" class="pill-logo-target"/>`
              : `<span class="logo-icon pill-logo-target">${this.logo}</span>`
            }
          </a>

          <div class="pill-nav-items desktop-only">
            <ul class="pill-list" role="menubar">
              ${this.items.map((item, i) => `
                <li role="none">
                  <a role="menuitem"
                     href="${item.href || '#'}"
                     data-index="${i}"
                     data-tab="${item.tab || ''}"
                     class="pill${this.activeHref === item.href ? ' is-active' : ''}"
                     aria-label="${item.ariaLabel || item.label}">
                    <span class="hover-circle" aria-hidden="true"></span>
                    <span class="label-stack">
                      <span class="pill-label">${item.label}</span>
                      <span class="pill-label-hover" aria-hidden="true">${item.label}</span>
                    </span>
                  </a>
                </li>
              `).join('')}
            </ul>
          </div>

          <button class="mobile-menu-button mobile-only" aria-label="Toggle menu">
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
          </button>
        </nav>

        <div class="mobile-menu-popover mobile-only" style="${cssVars}">
          <ul class="mobile-menu-list">
            ${this.items.map(item => `
              <li>
                <a href="${item.href || '#'}"
                   data-tab="${item.tab || ''}"
                   class="mobile-menu-link${this.activeHref === item.href ? ' is-active' : ''}">
                  ${item.label}
                </a>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;

    // Query DOM Elements
    this.navElement = this.container.querySelector('.pill-nav');
    this.logoElement = this.container.querySelector('.pill-logo');
    this.logoTarget = this.container.querySelector('.pill-logo-target');
    this.navItemsContainer = this.container.querySelector('.pill-nav-items');
    this.circleRefs = Array.from(this.container.querySelectorAll('.hover-circle'));
    this.pillElements = Array.from(this.container.querySelectorAll('.pill'));
    this.hamburgerBtn = this.container.querySelector('.mobile-menu-button');
    this.mobileMenu = this.container.querySelector('.mobile-menu-popover');
  }

  initGSAP() {
    const gsap = window.gsap;
    if (!gsap) {
      console.warn('PillNav: GSAP library not found on window. Ensure gsap is loaded.');
      return;
    }

    const ease = this.ease;

    const layout = () => {
      this.circleRefs.forEach((circle, index) => {
        const pill = circle.parentElement;
        if (!pill) return;

        const rect = pill.getBoundingClientRect();
        const { width: w, height: h } = rect;
        if (w === 0 || h === 0) return;

        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`
        });

        const label = pill.querySelector('.pill-label');
        const white = pill.querySelector('.pill-label-hover');

        if (label) gsap.set(label, { y: 0 });
        if (white) gsap.set(white, { y: h + 12, opacity: 0 });

        this.tlRefs[index]?.kill();
        const tl = gsap.timeline({ paused: true });

        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: 'auto' }, 0);

        if (label) {
          tl.to(label, { y: -(h + 8), duration: 2, ease, overwrite: 'auto' }, 0);
        }

        if (white) {
          gsap.set(white, { y: Math.ceil(h + 100), opacity: 0 });
          tl.to(white, { y: 0, opacity: 1, duration: 2, ease, overwrite: 'auto' }, 0);
        }

        this.tlRefs[index] = tl;
      });
    };

    // Calculate layout after fonts are loaded and DOM has rendered
    if (document.fonts?.ready) {
      document.fonts.ready.then(layout).catch(layout);
    } else {
      setTimeout(layout, 50);
    }

    window.addEventListener('resize', layout);

    // Initial load animations
    if (this.mobileMenu) {
      gsap.set(this.mobileMenu, { visibility: 'hidden', opacity: 0, scaleY: 1 });
    }

    if (this.initialLoadAnimation) {
      if (this.logoElement) {
        gsap.set(this.logoElement, { scale: 0 });
        gsap.to(this.logoElement, {
          scale: 1,
          duration: 0.6,
          ease
        });
      }

      if (this.navItemsContainer) {
        gsap.set(this.navItemsContainer, { width: 0, overflow: 'hidden' });
        gsap.to(this.navItemsContainer, {
          width: 'auto',
          duration: 0.6,
          ease
        });
      }
    }

    // Attach Event Listeners to each Pill
    this.pillElements.forEach((pill, i) => {
      pill.addEventListener('mouseenter', () => this.handleEnter(i));
      pill.addEventListener('mouseleave', () => this.handleLeave(i));
      pill.addEventListener('click', (e) => {
        const item = this.items[i];
        this.setActiveHref(item.href);
        if (this.onItemClick) {
          this.onItemClick(item, e);
        }
      });
    });

    // Mobile link clicks
    this.container.querySelectorAll('.mobile-menu-link').forEach((link, i) => {
      link.addEventListener('click', (e) => {
        const item = this.items[i];
        this.setActiveHref(item.href);
        this.toggleMobileMenu(false);
        if (this.onItemClick) {
          this.onItemClick(item, e);
        }
      });
    });

    // Logo hover spin
    if (this.logoElement) {
      this.logoElement.addEventListener('mouseenter', () => this.handleLogoEnter());
    }

    // Mobile hamburger click
    if (this.hamburgerBtn) {
      this.hamburgerBtn.addEventListener('click', () => this.toggleMobileMenu());
    }
  }

  handleEnter(i) {
    const gsap = window.gsap;
    if (!gsap) return;
    const tl = this.tlRefs[i];
    if (!tl) return;
    this.activeTweenRefs[i]?.kill();
    this.activeTweenRefs[i] = tl.tweenTo(tl.duration(), {
      duration: 0.3,
      ease: this.ease,
      overwrite: 'auto'
    });
  }

  handleLeave(i) {
    const gsap = window.gsap;
    if (!gsap) return;
    const tl = this.tlRefs[i];
    if (!tl) return;
    this.activeTweenRefs[i]?.kill();
    this.activeTweenRefs[i] = tl.tweenTo(0, {
      duration: 0.2,
      ease: this.ease,
      overwrite: 'auto'
    });
  }

  handleLogoEnter() {
    const gsap = window.gsap;
    if (!gsap || !this.logoTarget) return;
    this.logoTween?.kill();
    gsap.set(this.logoTarget, { rotate: 0 });
    this.logoTween = gsap.to(this.logoTarget, {
      rotate: 360,
      duration: 0.35,
      ease: this.ease,
      overwrite: 'auto'
    });
  }

  toggleMobileMenu(forceState) {
    const gsap = window.gsap;
    const newState = typeof forceState === 'boolean' ? forceState : !this.isMobileMenuOpen;
    this.isMobileMenuOpen = newState;

    const hamburger = this.hamburgerBtn;
    const menu = this.mobileMenu;

    if (hamburger && gsap) {
      const lines = hamburger.querySelectorAll('.hamburger-line');
      if (lines.length >= 2) {
        if (newState) {
          gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease: this.ease });
          gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease: this.ease });
        } else {
          gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease: this.ease });
          gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease: this.ease });
        }
      }
    }

    if (menu && gsap) {
      if (newState) {
        gsap.set(menu, { visibility: 'visible' });
        gsap.fromTo(
          menu,
          { opacity: 0, y: 10, scaleY: 1 },
          {
            opacity: 1,
            y: 0,
            scaleY: 1,
            duration: 0.3,
            ease: this.ease,
            transformOrigin: 'top center'
          }
        );
      } else {
        gsap.to(menu, {
          opacity: 0,
          y: 10,
          scaleY: 1,
          duration: 0.2,
          ease: this.ease,
          transformOrigin: 'top center',
          onComplete: () => {
            gsap.set(menu, { visibility: 'hidden' });
          }
        });
      }
    }

    if (this.onMobileMenuClick) {
      this.onMobileMenuClick(newState);
    }
  }

  setActiveHref(href) {
    this.activeHref = href;

    this.container.querySelectorAll('.pill').forEach(pill => {
      if (pill.getAttribute('href') === href) {
        pill.classList.add('is-active');
      } else {
        pill.classList.remove('is-active');
      }
    });

    this.container.querySelectorAll('.mobile-menu-link').forEach(link => {
      if (link.getAttribute('href') === href) {
        link.classList.add('is-active');
      } else {
        link.classList.remove('is-active');
      }
    });
  }
}
