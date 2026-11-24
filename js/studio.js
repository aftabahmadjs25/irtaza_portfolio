/* ==========================================================================
   IRTAZA KHALID — HALDOREN STUDIO INTERACTIONS
   Entrance choreography, lanyard physics, punched-ticket case switcher
   ========================================================================== */
(function () {
  'use strict';

  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE_OUT = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
  const EASE_SPRING = 'cubic-bezier(0.3, 1.5, 0.5, 1)';
  const EASE_IN = 'cubic-bezier(0.5, 0, 0.75, 0)';

  /* ------------------------------------------------------------------------
     1. HERO ENTRANCE & LANYARD PHYSICS
     ------------------------------------------------------------------------ */
  const wordmark = document.getElementById('heroWordmark');
  const scriptEl = document.getElementById('heroScript');
  const badge = document.getElementById('lanyardBadge');
  const scrollHint = document.getElementById('scrollHint');
  const navTags = Array.from(document.querySelectorAll('.studio-header .tag.pre'));

  let entered = false;

  function revealImmediately() {
    document.querySelectorAll('.pre').forEach((el) => {
      el.classList.remove('pre');
      el.style.opacity = '';
    });
  }

  function startBadgeSway() {
    if (!badge || RM) return;
    badge.animate(
      [{ transform: 'rotate(-1.2deg)' }, { transform: 'rotate(1.2deg)' }],
      {
        duration: 3200,
        iterations: Infinity,
        direction: 'alternate',
        easing: 'ease-in-out',
      }
    );

    const triggerSwing = () => {
      badge.animate(
        [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(-6deg)' },
          { transform: 'rotate(4deg)' },
          { transform: 'rotate(-2deg)' },
          { transform: 'rotate(0deg)' },
        ],
        {
          duration: 1300,
          easing: 'ease-out',
          composite: 'add',
        }
      );
    };

    badge.addEventListener('pointerenter', triggerSwing);
    badge.addEventListener('click', triggerSwing);
  }

  function runEntrance() {
    if (entered) return;
    entered = true;

    if (RM || typeof Element.prototype.animate !== 'function') {
      revealImmediately();
      return;
    }

    requestAnimationFrame(() => {
      navTags.forEach((tag, i) => {
        tag.classList.remove('pre');
        tag.animate(
          [
            { opacity: 0, transform: 'translateY(-36px) rotate(-4deg)' },
            { opacity: 1, transform: 'translateY(0) rotate(0deg)' },
          ],
          {
            duration: 680,
            delay: 100 + i * 65,
            easing: EASE_SPRING,
            fill: 'both',
          }
        );
      });

      if (wordmark) {
        wordmark.classList.remove('pre');
        wordmark.animate(
          [
            { opacity: 0, transform: 'translateY(54px)', clipPath: 'inset(100% 0 0 0)' },
            { opacity: 1, transform: 'translateY(0)', clipPath: 'inset(0 0 0 0)' },
          ],
          {
            duration: 1050,
            delay: 220,
            easing: EASE_OUT,
            fill: 'both',
          }
        );
      }

      if (scriptEl) {
        scriptEl.classList.remove('pre');
        scriptEl.animate(
          [
            { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
            { opacity: 1, clipPath: 'inset(0 0 0 0)' },
          ],
          {
            duration: 850,
            delay: 920,
            easing: 'cubic-bezier(0.5, 0, 0.3, 1)',
            fill: 'both',
          }
        );
      }

      if (badge) {
        badge.classList.remove('pre');
        const drop = badge.animate(
          [
            { opacity: 0, transform: 'translateY(-110%) rotate(8deg)', offset: 0 },
            { opacity: 1, transform: 'translateY(0) rotate(-3deg)', offset: 0.6 },
            { opacity: 1, transform: 'translateY(0) rotate(1.6deg)', offset: 0.8 },
            { opacity: 1, transform: 'translateY(0) rotate(0deg)', offset: 1 },
          ],
          {
            duration: 1400,
            delay: 620,
            easing: EASE_OUT,
            fill: 'both',
          }
        );
        drop.onfinish = () => {
          drop.cancel();
          startBadgeSway();
        };
      }

      if (scrollHint) {
        scrollHint.classList.remove('pre');
        scrollHint.animate([{ opacity: 0 }, { opacity: 0.88 }], {
          duration: 600,
          delay: 1450,
          easing: EASE_OUT,
          fill: 'both',
        });
      }
    });
  }

  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2000))]).then(runEntrance);
  setTimeout(runEntrance, 3500);

  /* ------------------------------------------------------------------------
     2. INTERACTIVE PROJECT CASE SWITCHER (8 Flutter Apps)
     ------------------------------------------------------------------------ */
  const CASES = [
    {
      title: 'FORMA LIVING',
      rows: [
        ['CLIENT', 'FORMA LIVING'],
        ['CATEGORY', 'E-COMMERCE APP'],
        ['STACK', 'FLUTTER • 2025'],
      ],
      key: '// forma living',
      text: '— furniture discovery, customization & guided checkout crafted with clean Flutter architecture.',
      image: 'images/furniture-ecommerce/00_Portfolio_Cover_Showcase.jpg',
      href: 'furniture-ecommerce.html',
    },
    {
      title: 'SOLESTEP',
      rows: [
        ['CLIENT', 'SOLESTEP'],
        ['CATEGORY', 'SNEAKER RETAIL'],
        ['STACK', 'FLUTTER • 2025'],
      ],
      key: '// solestep',
      text: '— sneaker discovery, size selection & live order tracking built for speed and polish.',
      image: 'images/shoe-store/0_portfolio_cover_banner.jpg',
      href: 'shoe-store.html',
    },
    {
      title: 'JOBSNAP',
      rows: [
        ['CLIENT', 'JOBSNAP'],
        ['CATEGORY', 'HOME SERVICES'],
        ['STACK', 'FLUTTER • FIREBASE'],
      ],
      key: '// jobsnap',
      text: '— an on-demand local home services marketplace connecting customers and pros in real time.',
      image: 'images/js_images/1.PNG',
      href: 'jobsnap.html',
    },
    {
      title: 'RUNG KING',
      rows: [
        ['CLIENT', 'RUNG KING'],
        ['CATEGORY', '2D CARD GAME'],
        ['STACK', 'FLAME • MULTIPLAYER'],
      ],
      key: '// rung king',
      text: '— classic 2D multiplayer card game supporting online matches and smart AI opponents.',
      image: 'images/Rung/1.PNG',
      href: 'rung-king.html',
    },
    {
      title: 'RIDE HOPPY',
      rows: [
        ['CLIENT', 'RIDE HOPPY'],
        ['CATEGORY', 'RIDE SHARING'],
        ['STACK', 'FLUTTER • REST API'],
      ],
      key: '// ride hoppy',
      text: '— a free corporate ride-sharing platform streamlining daily team commutes.',
      image: 'images/rh_hero.png',
      href: 'ride-hoppy.html',
    },
    {
      title: 'B2B CABS',
      rows: [
        ['CLIENT', 'B2B CABS'],
        ['CATEGORY', 'ENTERPRISE FLEET'],
        ['STACK', 'FLUTTER • PROVIDER'],
      ],
      key: '// b2b cabs',
      text: '— corporate employee transportation system with route tracking and scheduling.',
      image: 'images/B2B/1.PNG',
      href: 'b2b-cabs.html',
    },
    {
      title: 'CURIO CAMPUS',
      rows: [
        ['CLIENT', 'CURIO CAMPUS'],
        ['CATEGORY', 'STUDENT NETWORK'],
        ['STACK', 'FLUTTER • FIREBASE'],
      ],
      key: '// curio campus',
      text: '— peer-to-peer student collaboration and campus emergency support platform.',
      image: 'images/cc_screen_1.jpg',
      href: 'curio-campus.html',
    },
    {
      title: 'PC GENIUS',
      rows: [
        ['CLIENT', 'PC GENIUS'],
        ['CATEGORY', 'BUILD ESTIMATOR'],
        ['STACK', 'FLUTTER • ENGINE'],
      ],
      key: '// pc genius',
      text: '— smart PC recommendation and custom hardware build estimator for enthusiasts.',
      image: 'images/pc_genius_hero.png',
      href: 'pc-genius.html',
    },
  ];

  let currentIdx = 0;
  let busy = false;

  const caseKeyEl = document.getElementById('caseKey');
  const caseTextEl = document.getElementById('caseText');
  const caseCounterEl = document.getElementById('caseCounter');
  const caseStudyLinkEl = document.getElementById('caseStudyLink');
  const previewImgEl = document.getElementById('casePreviewImg');
  const flashEl = document.getElementById('deviceFlash');
  const ticketEl = document.getElementById('caseTicket');
  const ticketTitleEl = document.getElementById('ticketTitle');
  const ticketRowsEl = document.getElementById('ticketRows');
  const caseDescEl = document.getElementById('caseDesc');
  const prevBtn = document.getElementById('prevCaseBtn');
  const nextBtn = document.getElementById('nextCaseBtn');
  const screenHit = document.getElementById('deviceScreenHit');
  const miniCards = Array.from(document.querySelectorAll('.project-mini-ticket'));

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function renderCaseContent(idx) {
    const item = CASES[idx];
    if (!item) return;

    caseKeyEl.textContent = item.key;
    caseTextEl.textContent = item.text;
    caseCounterEl.textContent = `${pad2(idx + 1)} / ${pad2(CASES.length)}`;
    caseStudyLinkEl.href = item.href;
    previewImgEl.src = item.image;
    previewImgEl.alt = `${item.title} preview`;

    ticketTitleEl.textContent = item.title;
    ticketRowsEl.innerHTML = item.rows
      .map(([label, value]) => `<div class="ticket-row"><span>${label}</span><b>${value}</b></div>`)
      .join('');

    if (prevBtn) {
      prevBtn.classList.toggle('dim', idx === 0);
    }

    miniCards.forEach((card, i) => {
      card.classList.toggle('is-active', i === idx);
    });
  }

  function switchCase(nextIdx) {
    const targetIdx = (nextIdx + CASES.length) % CASES.length;
    if (busy || targetIdx === currentIdx) return;

    if (RM || typeof Element.prototype.animate !== 'function') {
      currentIdx = targetIdx;
      renderCaseContent(currentIdx);
      return;
    }

    busy = true;

    // Preload next image cleanly
    const preload = new Image();
    preload.src = CASES[targetIdx].image;

    // 1. Out animation
    const ticketOut = ticketEl.animate(
      [
        { opacity: 1, transform: 'translateY(0) rotate(0deg)' },
        { opacity: 0, transform: 'translateY(-28px) rotate(3deg)' },
      ],
      { duration: 240, easing: EASE_IN, fill: 'forwards' }
    );

    const descOut = caseDescEl.animate(
      [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(-10px)' },
      ],
      { duration: 200, easing: EASE_IN, fill: 'forwards' }
    );

    previewImgEl.animate([{ opacity: 1 }, { opacity: 0.15 }], {
      duration: 220,
      easing: 'ease-in',
      fill: 'forwards',
    });

    ticketOut.onfinish = () => {
      currentIdx = targetIdx;
      renderCaseContent(currentIdx);

      // Flash the device screen like Haldoren
      if (flashEl) {
        flashEl.animate(
          [{ opacity: 0 }, { opacity: 0.42, offset: 0.3 }, { opacity: 0 }],
          { duration: 420, easing: 'ease-out' }
        );
      }

      // New preview image settles in
      previewImgEl.animate(
        [
          { opacity: 0, transform: 'scale(1.05)' },
          { opacity: 1, transform: 'scale(1)' },
        ],
        { duration: 460, easing: EASE_OUT, fill: 'forwards' }
      );

      // Ticket drops in like a hung tag
      const ticketIn = ticketEl.animate(
        [
          { opacity: 0, transform: 'translateY(-44px) rotate(-4deg)', offset: 0 },
          { opacity: 1, transform: 'translateY(5px) rotate(1deg)', offset: 0.7 },
          { opacity: 1, transform: 'translateY(0) rotate(0deg)', offset: 1 },
        ],
        { duration: 600, easing: EASE_OUT, fill: 'forwards' }
      );

      const descIn = caseDescEl.animate(
        [
          { opacity: 0, transform: 'translateY(14px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 440, delay: 70, easing: EASE_OUT, fill: 'forwards' }
      );

      ticketIn.onfinish = () => {
        ticketOut.cancel();
        ticketIn.cancel();
        descOut.cancel();
        descIn.cancel();
        busy = false;
      };
    };
  }

  if (prevBtn) prevBtn.addEventListener('click', () => switchCase(currentIdx - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => switchCase(currentIdx + 1));

  if (screenHit) {
    screenHit.addEventListener('click', () => switchCase(currentIdx + 1));
    screenHit.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        switchCase(currentIdx + 1);
      }
    });
  }

  document.querySelectorAll('[data-select-case]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-select-case'));
      switchCase(idx);
      const stage = document.getElementById('caseStage');
      if (stage) {
        stage.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
      }
    });
  });

  // Keyboard navigation when Projects section is visible
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const portfolioSection = document.getElementById('portfolio');
    if (!portfolioSection) return;
    const rect = portfolioSection.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 0.7 && rect.bottom > window.innerHeight * 0.3;
    if (!inView) return;

    if (e.key === 'ArrowRight') switchCase(currentIdx + 1);
    if (e.key === 'ArrowLeft') switchCase(currentIdx - 1);
  });

  /* ------------------------------------------------------------------------
     3. HEADER SCROLL STATE, ACTIVE NAV TAG & MOBILE DRAWER
     ------------------------------------------------------------------------ */
  const header = document.getElementById('studioHeader');
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const navMap = new Map();
  document.querySelectorAll('[data-nav]').forEach((link) => {
    navMap.set(link.getAttribute('data-nav'), link);
  });

  function onScroll() {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 60);

    let activeId = 'home';
    sections.forEach((sec) => {
      if (y >= sec.offsetTop - 220) {
        activeId = sec.id;
      }
    });

    navMap.forEach((link, id) => {
      link.classList.toggle('active', id === activeId);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (mobileBtn && mobileDrawer) {
    mobileBtn.addEventListener('click', () => {
      const open = mobileDrawer.classList.toggle('open');
      mobileBtn.setAttribute('aria-expanded', String(open));
    });

    mobileDrawer.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
        mobileBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ------------------------------------------------------------------------
     4. SCROLL REVEALS
     ------------------------------------------------------------------------ */
  const reveals = document.querySelectorAll('.reveal');
  if (RM || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach((el) => io.observe(el));
  }
})();
