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

  function startBadgePhysics() {
    const strap = document.getElementById('lanyardStrap');
    const body = document.getElementById('lanyardBody');
    if (!badge || !strap || !body || RM) return;

    let dx = 0;
    let dy = 0;
    let vx = 0;
    let vy = 0;
    let tilt = 0;
    let vtilt = 0;

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startDx = 0;
    let startDy = 0;
    let lastClientX = 0;
    let lastClientY = 0;
    let lastMoveTime = 0;

    // Spring constants for snappy elastic lanyard snap-back
    const K_POS = 170;
    const D_POS = 11.5;
    const K_ROT = 140;
    const D_ROT = 9.5;

    let lastTime = performance.now();
    let swayTime = 0;

    // Soft resistance only when pulled very far so you can drag freely across the hero
    function softClamp(val, limit) {
      const abs = Math.abs(val);
      if (abs <= limit) return val;
      return Math.sign(val) * (limit + (abs - limit) * 0.35);
    }

    body.addEventListener('pointerdown', (e) => {
      dragging = true;
      body.classList.add('is-dragging');
      body.setPointerCapture(e.pointerId);
      startX = e.clientX;
      startY = e.clientY;
      startDx = dx;
      startDy = dy;
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      lastMoveTime = performance.now();
      vx = 0;
      vy = 0;
      e.preventDefault();
    });

    body.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const now = performance.now();
      const dt = Math.max(0.004, (now - lastMoveTime) / 1000);

      const rawDx = startDx + (e.clientX - startX);
      const rawDy = startDy + (e.clientY - startY);
      const nextDx = softClamp(rawDx, Math.min(window.innerWidth * 0.65, 680));
      const nextDy = Math.max(-75, softClamp(rawDy, Math.min(window.innerHeight * 0.5, 360)));

      // Smoothly track throw velocity on release
      const instVx = (e.clientX - lastClientX) / dt;
      const instVy = (e.clientY - lastClientY) / dt;
      vx = vx * 0.55 + instVx * 0.45;
      vy = vy * 0.55 + instVy * 0.45;

      dx = nextDx;
      dy = nextDy;
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      lastMoveTime = now;
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      body.classList.remove('is-dragging');
      if (e && body.hasPointerCapture(e.pointerId)) {
        body.releasePointerCapture(e.pointerId);
      }
      // Clamp extreme flick speeds for smooth feel
      vx = Math.max(-1800, Math.min(1800, vx));
      vy = Math.max(-1400, Math.min(1400, vy));
    }

    body.addEventListener('pointerup', endDrag);
    body.addEventListener('pointercancel', endDrag);

    // Subtle playful nudge when hovering over the resting badge
    body.addEventListener('pointerenter', (e) => {
      if (dragging) return;
      const rect = body.getBoundingClientRect();
      const fromLeft = e.clientX < rect.left + rect.width / 2;
      vx += fromLeft ? 190 : -190;
    });

    function tick(now) {
      const dt = Math.min(0.032, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const L0 = strap.offsetHeight || 118;

      if (!dragging) {
        // Elastic spring-back force toward (0, 0)
        const ax = -K_POS * dx - D_POS * vx;
        const ay = -K_POS * dy - D_POS * vy;
        vx += ax * dt;
        vy += ay * dt;
        dx += vx * dt;
        dy += vy * dt;

        // Snap tiny floating-point jitter cleanly to rest
        if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05 && Math.abs(vx) < 0.2 && Math.abs(vy) < 0.2) {
          dx = 0;
          dy = 0;
          vx = 0;
          vy = 0;
        }
      }

      // Compute gentle idle sway when near rest
      const motionMag = Math.hypot(dx, dy) + Math.hypot(vx, vy) * 0.05;
      const idleBlend = Math.max(0, 1 - motionMag / 18);
      swayTime += dt;
      const idleAngle = Math.sin(swayTime * 1.95) * 1.25 * idleBlend;

      // Strap vector from ceiling anchor (0, 0) to clip (dx, L0 + dy)
      const clipX = dx;
      const clipY = Math.max(24, L0 + dy);
      const strapDist = Math.hypot(clipX, clipY);
      const strapAngleDeg = (Math.atan2(-clipX, clipY) * 180) / Math.PI + idleAngle;
      const strapScaleY = strapDist / L0;

      // Card tilts along strap angle + velocity-driven swivel lag
      const targetTilt = strapAngleDeg * 0.85 + Math.max(-28, Math.min(28, -vx * 0.018));
      const arot = K_ROT * (targetTilt - tilt) - D_ROT * vtilt;
      vtilt += arot * dt;
      tilt += vtilt * dt;

      strap.style.transform = `rotate(${strapAngleDeg.toFixed(2)}deg) scaleY(${strapScaleY.toFixed(4)})`;
      body.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${tilt.toFixed(2)}deg)`;

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
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
          startBadgePhysics();
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
     2. INTERACTIVE PROJECT CASE SWITCHER (10 Flutter Apps)
     ------------------------------------------------------------------------ */
  const CASES = [
    {
      title: 'SMARTAGRO',
      rows: [
        ['CLIENT', 'SMARTAGRO'],
        ['CATEGORY', 'DESKTOP ERP & GIS'],
        ['STACK', 'FLUTTER DESKTOP'],
      ],
      key: '// smartagro',
      text: '— desktop enterprise farm & estate ERP featuring GIS satellite land mapping, crop planning, inventory & farm finance.',
      image: 'images/smart-agro/cover-16x9.jpg',
      href: 'smart-agro.html',
    },
    {
      title: 'TAJ SUPPORT',
      rows: [
        ['CLIENT', 'TAJ TECHNOLOGY'],
        ['CATEGORY', 'LIVE SUPPORT DESK'],
        ['STACK', 'FLUTTER • REAL-TIME'],
      ],
      key: '// taj support',
      text: '— real-time customer support & team messaging with department queues, voice notes and rich file sharing.',
      image: 'images/taj-support/cover-16x9.jpg',
      href: 'taj-support.html',
    },
    {
      title: 'OPENPOOL',
      rows: [
        ['CLIENT', 'OPENPOOL'],
        ['CATEGORY', 'COMMUTE & FLEET'],
        ['STACK', 'FLUTTER • PROVIDER'],
      ],
      key: '// openpool',
      text: '— office commutes, school rides & corporate transportation with dedicated employee and driver apps.',
      image: 'images/openpool/openpool-cover-16x9.jpg',
      href: 'b2b-cabs.html',
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
      image: 'images/covers/jobsnap-cover.png',
      href: 'jobsnap.html',
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
      image: 'images/covers/ride-hoppy-cover.jpg',
      href: 'ride-hoppy.html',
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
      image: 'images/covers/rung-king-cover.jpg',
      href: 'rung-king.html',
    },
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
    /* Hidden for now: Curio Campus & PC Genius
    {
      title: 'CURIO CAMPUS',
      rows: [
        ['CLIENT', 'CURIO CAMPUS'],
        ['CATEGORY', 'STUDENT NETWORK'],
        ['STACK', 'FLUTTER • FIREBASE'],
      ],
      key: '// curio campus',
      text: '— peer-to-peer student collaboration and campus emergency support platform.',
      image: 'images/covers/curio-campus-cover.png',
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
      image: 'images/covers/pc-genius-cover.png',
      href: 'pc-genius.html',
    },
    */
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
  const screenLinkEl = document.getElementById('deviceScreenLink');
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
    if (screenLinkEl) {
      screenLinkEl.href = item.href;
      screenLinkEl.setAttribute('aria-label', `Open ${item.title} case study`);
    }
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

  // Mobile horizontal carousel prev/next buttons for All 08 Case Studies
  const gridEl = document.getElementById('projectsGrid');
  const gridPrevBtn = document.getElementById('gridPrevBtn');
  const gridNextBtn = document.getElementById('gridNextBtn');
  if (gridEl && gridPrevBtn && gridNextBtn) {
    const scrollGridBy = (dir) => {
      const card = gridEl.querySelector('.project-mini-ticket');
      const step = card ? card.offsetWidth + 14 : 280;
      gridEl.scrollBy({ left: dir * step, behavior: RM ? 'auto' : 'smooth' });
    };
    gridPrevBtn.addEventListener('click', () => scrollGridBy(-1));
    gridNextBtn.addEventListener('click', () => scrollGridBy(1));
  }

  document.querySelectorAll('[data-select-case]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = Number(btn.getAttribute('data-select-case'));
      switchCase(idx);
      const stage = document.getElementById('caseStage');
      if (stage) {
        stage.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
      }
    });
  });

  // Clicking or tapping anywhere on a project card opens its case study
  miniCards.forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button, a')) return;
      const link = card.querySelector('a.mini-link');
      if (link && link.href) {
        window.location.href = link.href;
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
     4. SCROLL REVEALS & 3D LAPTOP-OPENING CHOREOGRAPHY
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

  // 3D Laptop Lid Open + Screen Power-On + Ticket Drop when scrolling to #portfolio
  const caseStageEl = document.getElementById('caseStage');
  const chassisEl = caseStageEl ? caseStageEl.querySelector('.device-chassis') : null;
  const navControlsEl = caseStageEl ? caseStageEl.querySelector('.case-nav-controls') : null;

  if (caseStageEl && chassisEl && !RM && typeof Element.prototype.animate === 'function') {
    let laptopOpened = false;
    let stageAnims = [];

    const closeLaptopStage = () => {
      stageAnims.forEach((a) => a.cancel());
      stageAnims = [];
      laptopOpened = false;
      caseStageEl.classList.add('stage-closed');
    };

    const openLaptopStage = () => {
      if (laptopOpened) return;
      laptopOpened = true;
      caseStageEl.classList.remove('stage-closed');

      // 1. 3D Laptop lid swings open on its bottom hinge
      const lidAnim = chassisEl.animate(
        [
          { transform: 'rotateX(-86deg) scale(0.96)', offset: 0 },
          { transform: 'rotateX(3.5deg) scale(1)', offset: 0.74 },
          { transform: 'rotateX(0deg) scale(1)', offset: 1 },
        ],
        { duration: 920, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' }
      );

      // 2. Screen powers on with Haldoren glass flash
      const flashAnim = flashEl
        ? flashEl.animate(
            [{ opacity: 0 }, { opacity: 0.52, offset: 0.3 }, { opacity: 0 }],
            { duration: 540, delay: 480, easing: 'ease-out', fill: 'both' }
          )
        : null;

      const imgAnim = previewImgEl
        ? previewImgEl.animate(
            [
              { opacity: 0, transform: 'scale(1.07)' },
              { opacity: 1, transform: 'scale(1)' },
            ],
            { duration: 640, delay: 500, easing: EASE_OUT, fill: 'both' }
          )
        : null;

      // 3. Punched paper ticket drops in & settles like a hung tag
      const ticketAnim = ticketEl
        ? ticketEl.animate(
            [
              { opacity: 0, transform: 'translateY(-54px) rotate(-5deg)', offset: 0 },
              { opacity: 1, transform: 'translateY(6px) rotate(1.2deg)', offset: 0.72 },
              { opacity: 1, transform: 'translateY(0) rotate(0deg)', offset: 1 },
            ],
            { duration: 760, delay: 560, easing: EASE_OUT, fill: 'both' }
          )
        : null;

      // 4. Editorial description staggers in
      const descKids = caseDescEl ? Array.from(caseDescEl.children) : [];
      const descAnims = descKids.map((child, idx) =>
        child.animate(
          [
            { opacity: 0, transform: 'translateY(16px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: 520, delay: 580 + idx * 75, easing: EASE_OUT, fill: 'both' }
        )
      );

      // 5. Round Prev/Next buttons fade in
      const navAnim = navControlsEl
        ? navControlsEl.animate(
            [
              { opacity: 0, transform: 'translateY(12px)' },
              { opacity: 1, transform: 'translateY(0)' },
            ],
            { duration: 480, delay: 720, easing: EASE_OUT, fill: 'both' }
          )
        : null;

      stageAnims = [lidAnim, flashAnim, imgAnim, ticketAnim, ...descAnims, navAnim].filter(Boolean);

      // Release fill:both once finished so switchCase() animations never conflict
      lidAnim.onfinish = () => {
        setTimeout(() => {
          if (laptopOpened) {
            stageAnims.forEach((a) => a.cancel());
            stageAnims = [];
          }
        }, 450);
      };
    };

    // Start folded shut before scrolling into Featured Projects
    closeLaptopStage();

    const laptopIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
            openLaptopStage();
          } else if (!entry.isIntersecting && entry.boundingClientRect.top > window.innerHeight * 0.9) {
            // Reset cleanly when user scrolls back up to the Hero so it replays on next visit
            closeLaptopStage();
          }
        });
      },
      { threshold: [0, 0.3] }
    );
    laptopIO.observe(caseStageEl);
  }

  /* ------------------------------------------------------------------------
     5. ABOUT SECTION CHOREOGRAPHY (Script Write-On, Stagger, Counter & Ticket Drop)
     ------------------------------------------------------------------------ */
  const aboutSec = document.getElementById('about');
  if (aboutSec && !RM && typeof Element.prototype.animate === 'function') {
    const aboutEyebrow = aboutSec.querySelector('.section-eyebrow');
    const aboutTitle = aboutSec.querySelector('.section-title');
    const aboutCopyKids = Array.from(aboutSec.querySelectorAll('.about-copy h3, .about-copy p'));
    const statPills = Array.from(aboutSec.querySelectorAll('.stat-pill'));
    const aboutTicket = document.getElementById('aboutTicket');
    const counterEl = aboutSec.querySelector('[data-count-to]');

    let aboutPlayed = false;
    let aboutAnims = [];

    const resetAbout = () => {
      aboutAnims.forEach((a) => a.cancel());
      aboutAnims = [];
      aboutPlayed = false;
      [aboutEyebrow, aboutTitle, ...aboutCopyKids, ...statPills, aboutTicket]
        .filter(Boolean)
        .forEach((el) => {
          el.style.opacity = '0';
        });
    };

    const animateCounter = (el) => {
      if (!el) return;
      const target = Number(el.getAttribute('data-count-to')) || 10;
      const suffix = el.getAttribute('data-count-suffix') || '';
      const dur = 850;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = Math.round(eased * target);
        el.textContent = `${String(val).padStart(2, '0')}${suffix}`;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const playAbout = () => {
      if (aboutPlayed) return;
      aboutPlayed = true;

      [aboutEyebrow, aboutTitle, ...aboutCopyKids, ...statPills, aboutTicket]
        .filter(Boolean)
        .forEach((el) => {
          el.style.opacity = '';
        });

      const anims = [];

      if (aboutEyebrow) {
        anims.push(
          aboutEyebrow.animate(
            [
              { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
              { opacity: 1, clipPath: 'inset(0 0 0 0)' },
            ],
            { duration: 680, easing: 'cubic-bezier(0.5, 0, 0.3, 1)', fill: 'both' }
          )
        );
      }

      if (aboutTitle) {
        anims.push(
          aboutTitle.animate(
            [
              { opacity: 0, transform: 'translateY(36px)', clipPath: 'inset(100% 0 0 0)' },
              { opacity: 1, transform: 'translateY(0)', clipPath: 'inset(0 0 0 0)' },
            ],
            { duration: 720, delay: 90, easing: EASE_OUT, fill: 'both' }
          )
        );
      }

      aboutCopyKids.forEach((el, i) => {
        anims.push(
          el.animate(
            [
              { opacity: 0, transform: 'translateY(22px)' },
              { opacity: 1, transform: 'translateY(0)' },
            ],
            { duration: 620, delay: 180 + i * 95, easing: EASE_OUT, fill: 'both' }
          )
        );
      });

      statPills.forEach((pill, i) => {
        anims.push(
          pill.animate(
            [
              { opacity: 0, transform: 'translateY(24px) scale(0.95)' },
              { opacity: 1, transform: 'translateY(0) scale(1)' },
            ],
            { duration: 560, delay: 420 + i * 90, easing: EASE_SPRING, fill: 'both' }
          )
        );
      });

      if (counterEl) {
        setTimeout(() => animateCounter(counterEl), 440);
      }

      if (aboutTicket) {
        anims.push(
          aboutTicket.animate(
            [
              { opacity: 0, transform: 'translateY(-54px) rotate(-4.5deg)', offset: 0 },
              { opacity: 1, transform: 'translateY(6px) rotate(1.1deg)', offset: 0.72 },
              { opacity: 1, transform: 'translateY(0) rotate(0deg)', offset: 1 },
            ],
            { duration: 820, delay: 320, easing: EASE_OUT, fill: 'both' }
          )
        );
      }

      aboutAnims = anims;
    };

    resetAbout();

    const aboutIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
            playAbout();
          } else if (!entry.isIntersecting && (entry.boundingClientRect.top > window.innerHeight * 0.9 || entry.boundingClientRect.bottom < 0)) {
            resetAbout();
          }
        });
      },
      { threshold: [0, 0.25] }
    );
    aboutIO.observe(aboutSec);
  }

  /* ------------------------------------------------------------------------
     6. UNIFIED CHOREOGRAPHY FOR PROJECTS GRID, EXPERIENCE, PROCESS, SKILLS & CONTACT
     ------------------------------------------------------------------------ */
  if (!RM && typeof Element.prototype.animate === 'function') {
    function wireSectionChoreography(rootEl, getTargets, playFn, threshold = 0.2) {
      if (!rootEl) return;
      let played = false;
      let anims = [];

      const reset = () => {
        anims.forEach((a) => a.cancel());
        anims = [];
        played = false;
        getTargets().forEach((el) => {
          el.style.opacity = '0';
        });
      };

      const play = () => {
        if (played) return;
        played = true;
        getTargets().forEach((el) => {
          el.style.opacity = '';
        });
        anims = playFn().filter(Boolean);
        // Release fill:both after settle so CSS hover transforms stay crisp
        const longest = anims.reduce((max, a) => {
          const t = a.effect ? a.effect.getTiming() : {};
          const end = (t.delay || 0) + (t.duration || 0);
          return end > max ? end : max;
        }, 0);
        setTimeout(() => {
          if (played) {
            anims.forEach((a) => a.cancel());
            anims = [];
          }
        }, longest + 80);
      };

      reset();

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
              play();
            } else if (
              !entry.isIntersecting &&
              (entry.boundingClientRect.top > window.innerHeight * 0.92 ||
                entry.boundingClientRect.bottom < 0)
            ) {
              reset();
            }
          });
        },
        { threshold: [0, threshold] }
      );
      observer.observe(rootEl);
    }

    function animateSectionHeader(sec) {
      const eyebrow = sec.querySelector('.section-eyebrow');
      const title = sec.querySelector('.section-title');
      const sub = sec.querySelector('.section-sub');
      const out = [];
      if (eyebrow) {
        out.push(
          eyebrow.animate(
            [
              { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
              { opacity: 1, clipPath: 'inset(0 0 0 0)' },
            ],
            { duration: 640, easing: 'cubic-bezier(0.5, 0, 0.3, 1)', fill: 'both' }
          )
        );
      }
      if (title) {
        out.push(
          title.animate(
            [
              { opacity: 0, transform: 'translateY(34px)', clipPath: 'inset(100% 0 0 0)' },
              { opacity: 1, transform: 'translateY(0)', clipPath: 'inset(0 0 0 0)' },
            ],
            { duration: 680, delay: 80, easing: EASE_OUT, fill: 'both' }
          )
        );
      }
      if (sub) {
        out.push(
          sub.animate(
            [
              { opacity: 0, transform: 'translateY(16px)' },
              { opacity: 1, transform: 'translateY(0)' },
            ],
            { duration: 540, delay: 180, easing: EASE_OUT, fill: 'both' }
          )
        );
      }
      return out;
    }

    // 6A. All 08 Case Studies mini-ticket deck
    const projectsGrid = document.getElementById('projectsGrid');
    const projectsIndexHead = document.querySelector('.projects-index-head');
    if (projectsGrid) {
      const cards = Array.from(projectsGrid.querySelectorAll('.project-mini-ticket'));
      wireSectionChoreography(
        projectsGrid,
        () => [projectsIndexHead, ...cards].filter(Boolean),
        () => {
          const out = [];
          if (projectsIndexHead) {
            out.push(
              projectsIndexHead.animate(
                [
                  { opacity: 0, transform: 'translateY(16px)' },
                  { opacity: 1, transform: 'translateY(0)' },
                ],
                { duration: 480, easing: EASE_OUT, fill: 'both' }
              )
            );
          }
          cards.forEach((card, i) => {
            const tilt = i % 2 === 0 ? -2.4 : 2.4;
            out.push(
              card.animate(
                [
                  { opacity: 0, transform: `translateY(38px) rotate(${tilt}deg) scale(0.95)`, offset: 0 },
                  { opacity: 1, transform: 'translateY(-3px) rotate(0deg) scale(1)', offset: 0.75 },
                  { opacity: 1, transform: 'translateY(0) rotate(0deg) scale(1)', offset: 1 },
                ],
                { duration: 640, delay: 90 + i * 65, easing: EASE_OUT, fill: 'both' }
              )
            );
          });
          return out;
        },
        0.16
      );
    }

    // 6B. Experience punched paper tickets
    const expSec = document.getElementById('services');
    if (expSec) {
      const expCards = Array.from(expSec.querySelectorAll('.exp-card'));
      wireSectionChoreography(
        expSec,
        () => [expSec.querySelector('.section-eyebrow'), expSec.querySelector('.section-title'), expSec.querySelector('.section-sub'), ...expCards].filter(Boolean),
        () => [
          ...animateSectionHeader(expSec),
          ...expCards.map((card, i) =>
            card.animate(
              [
                { opacity: 0, transform: 'translateY(-44px) rotate(-3deg)', offset: 0 },
                { opacity: 1, transform: 'translateY(6px) rotate(0.9deg)', offset: 0.72 },
                { opacity: 1, transform: 'translateY(0) rotate(0deg)', offset: 1 },
              ],
              { duration: 760, delay: 200 + i * 110, easing: EASE_OUT, fill: 'both' }
            )
          ),
        ],
        0.18
      );
    }

    // 6C. My Process 4 steps
    const procSec = document.getElementById('lifecycle');
    if (procSec) {
      const procCards = Array.from(procSec.querySelectorAll('.process-card'));
      wireSectionChoreography(
        procSec,
        () => [procSec.querySelector('.section-eyebrow'), procSec.querySelector('.section-title'), ...procCards].filter(Boolean),
        () => [
          ...animateSectionHeader(procSec),
          ...procCards.map((card, i) =>
            card.animate(
              [
                { opacity: 0, transform: 'translateY(32px) scale(0.95)' },
                { opacity: 1, transform: 'translateY(0) scale(1)' },
              ],
              { duration: 580, delay: 180 + i * 95, easing: EASE_SPRING, fill: 'both' }
            )
          ),
        ],
        0.2
      );
    }

    // 6D. Skills & Education cards + chip pop
    const skillsSec = document.getElementById('skills');
    if (skillsSec) {
      const skillCards = Array.from(skillsSec.querySelectorAll('.skill-card'));
      const skillChips = Array.from(skillsSec.querySelectorAll('.skill-chip'));
      wireSectionChoreography(
        skillsSec,
        () => [skillsSec.querySelector('.section-eyebrow'), skillsSec.querySelector('.section-title'), ...skillCards, ...skillChips].filter(Boolean),
        () => [
          ...animateSectionHeader(skillsSec),
          ...skillCards.map((card, i) =>
            card.animate(
              [
                { opacity: 0, transform: 'translateY(34px)' },
                { opacity: 1, transform: 'translateY(0)' },
              ],
              { duration: 600, delay: 160 + i * 85, easing: EASE_OUT, fill: 'both' }
            )
          ),
          ...skillChips.map((chip, i) =>
            chip.animate(
              [
                { opacity: 0, transform: 'translateY(10px) scale(0.9)' },
                { opacity: 1, transform: 'translateY(0) scale(1)' },
              ],
              { duration: 380, delay: 360 + i * 32, easing: EASE_SPRING, fill: 'both' }
            )
          ),
        ],
        0.18
      );
    }

    // 6E. Contact section + punched form ticket
    const contactSec = document.getElementById('contact');
    if (contactSec) {
      const contactLinks = Array.from(contactSec.querySelectorAll('.contact-link-card'));
      const contactForm = contactSec.querySelector('.contact-form-card');
      const contactCopy = Array.from(contactSec.querySelectorAll('.contact-left h3, .contact-left p'));
      wireSectionChoreography(
        contactSec,
        () => [contactSec.querySelector('.section-eyebrow'), contactSec.querySelector('.section-title'), ...contactCopy, ...contactLinks, contactForm].filter(Boolean),
        () => [
          ...animateSectionHeader(contactSec),
          ...contactCopy.map((el, i) =>
            el.animate(
              [
                { opacity: 0, transform: 'translateY(18px)' },
                { opacity: 1, transform: 'translateY(0)' },
              ],
              { duration: 540, delay: 160 + i * 80, easing: EASE_OUT, fill: 'both' }
            )
          ),
          ...contactLinks.map((card, i) =>
            card.animate(
              [
                { opacity: 0, transform: 'translateX(-24px)' },
                { opacity: 1, transform: 'translateX(0)' },
              ],
              { duration: 520, delay: 280 + i * 85, easing: EASE_OUT, fill: 'both' }
            )
          ),
          contactForm
            ? contactForm.animate(
                [
                  { opacity: 0, transform: 'translateY(-48px) rotate(-3.5deg)', offset: 0 },
                  { opacity: 1, transform: 'translateY(5px) rotate(0.9deg)', offset: 0.72 },
                  { opacity: 1, transform: 'translateY(0) rotate(0deg)', offset: 1 },
                ],
                { duration: 780, delay: 260, easing: EASE_OUT, fill: 'both' }
              )
            : null,
        ],
        0.18
      );
    }
  }
})();
