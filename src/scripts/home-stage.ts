import gsap from 'gsap';

const MathUtils = {
  lineEq: (y2: number, y1: number, x2: number, x1: number, currentVal: number) => {
    const m = (y2 - y1) / (x2 - x1);
    const b = y1 - m * x1;
    return m * currentVal + b;
  },
  lerp: (a: number, b: number, n: number) => (1 - n) * a + n * b,
  rand: (min: number, max: number) => Math.random() * (max - min) + min,
};

function splitLetters(el: HTMLElement): HTMLSpanElement[] {
  const text = el.textContent ?? '';
  el.textContent = '';
  const spans: HTMLSpanElement[] = [];
  for (const ch of Array.from(text)) {
    const span = document.createElement('span');
    span.textContent = ch;
    el.appendChild(span);
    spans.push(span);
  }
  return spans;
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const contentFirst = document.querySelector<HTMLElement>('.content--first');
const contentMove = document.querySelector<HTMLElement>('.content__move');
const columnsWrap = document.querySelector<HTMLElement>('.columns');
const columnEls = Array.from(document.querySelectorAll<HTMLElement>('.column'));
const menuBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('.menu > .menu__item'));
const stageItems = Array.from(document.querySelectorAll<HTMLElement>('.stage-item'));

if (contentFirst && contentMove && columnsWrap && menuBtns.length > 0 && stageItems.length > 0) {
  let winsize = { width: window.innerWidth, height: window.innerHeight };
  let mousePos = { x: winsize.width / 2, y: winsize.height / 2 };

  const activeTilt = {
    columns: !prefersReducedMotion,
    letters: !prefersReducedMotion,
  };

  window.addEventListener(
    'resize',
    () => {
      winsize = { width: window.innerWidth, height: window.innerHeight };
    },
    { passive: true },
  );

  window.addEventListener(
    'mousemove',
    (ev) => {
      mousePos = { x: ev.clientX, y: ev.clientY };
    },
    { passive: true },
  );

  // Column parallax state
  const columnStates = columnEls.map((el) => {
    const rect = el.getBoundingClientRect();
    const isBottom = el.classList.contains('column--bottom');
    return {
      el,
      height: rect.height || winsize.height,
      isBottom,
      tx: 0,
      ty: 0,
      randX: MathUtils.rand(6, 18),
      rY1: isBottom ? MathUtils.rand(10, 28) : MathUtils.rand(26, 68),
      rY2: isBottom ? MathUtils.rand(26, 68) : MathUtils.rand(10, 28),
    };
  });

  if (!prefersReducedMotion && columnStates.length > 0) {
    gsap.ticker.add(() => {
      if (!activeTilt.columns) return;
      for (const col of columnStates) {
        col.tx = MathUtils.lerp(
          col.tx,
          MathUtils.lineEq(-col.randX, col.randX, winsize.width, 0, mousePos.x),
          0.035,
        );
        col.ty = MathUtils.lerp(
          col.ty,
          MathUtils.lineEq(-col.rY1, col.rY2, winsize.height, 0, mousePos.y),
          0.035,
        );
        gsap.set(col.el, {
          x: col.tx,
          y: col.ty,
          rotation: 0.01,
        });
      }
    });
  }

  // Split letters separately for ZH and EN title variants so toggling never concatenates languages
  const stageMeta = stageItems.map((el) => {
    const titleEl = el.querySelector<HTMLElement>('.stage-title');
    const backEl = el.querySelector<HTMLButtonElement>('.stage-back');
    let titleLetters: HTMLSpanElement[] = [];
    if (titleEl) {
      const variants = Array.from(titleEl.querySelectorAll<HTMLElement>('.stage-title__zh, .stage-title__en'));
      if (variants.length > 0) {
        titleLetters = variants.flatMap((v) => splitLetters(v));
      } else {
        titleLetters = splitLetters(titleEl);
      }
    }
    return { el, backEl, titleLetters };
  });

  const menuMeta = menuBtns.map((el) => {
    const letters = splitLetters(el);
    const totalRand = Math.min(3, letters.length);
    const translations = Array.from({ length: totalRand }, () => {
      const tr = MathUtils.rand(10, 42);
      return [-tr, tr] as const;
    });
    const rotations = Array.from({ length: totalRand }, () => {
      const rr = MathUtils.rand(0, 6);
      return [-rr, rr] as const;
    });
    let randLetters: HTMLSpanElement[] = [];

    if (!prefersReducedMotion) {
      el.addEventListener('mouseenter', () => {
        const shuffled = [...letters].sort(() => 0.5 - Math.random());
        randLetters = shuffled.slice(0, totalRand);
      });

      el.addEventListener('mousemove', () => {
        if (!activeTilt.letters || randLetters.length === 0) return;
        const bounds = el.getBoundingClientRect();
        const relY = mousePos.y - bounds.top;
        randLetters.forEach((letter, idx) => {
          gsap.to(letter, {
            duration: 1.5,
            ease: 'expo.out',
            y: MathUtils.lineEq(translations[idx][1], translations[idx][0], bounds.height, 0, relY),
            rotation: MathUtils.lineEq(rotations[idx][1], rotations[idx][0], bounds.height, 0, relY),
            overwrite: 'auto',
          });
        });
      });

      el.addEventListener('mouseleave', () => {
        if (!activeTilt.letters || randLetters.length === 0) return;
        gsap
          .timeline()
          .to(
            randLetters,
            {
              duration: 0.18,
              ease: 'quad.out',
              y: '-=40%',
              opacity: 0,
            },
            0,
          )
          .to(
            randLetters,
            {
              duration: 0.55,
              ease: 'elastic.out(1, 0.45)',
              startAt: { y: '50%', opacity: 0 },
              y: '0%',
              rotation: 0,
              opacity: 1,
              stagger: 0.02,
            },
            0.18,
          );
      });
    }

    return { el, letters };
  });

  let isAnimating = false;
  let currentIndex = -1;

  function openItem(index: number) {
    if (isAnimating || index < 0 || index >= stageMeta.length) return;
    currentIndex = index;
    const activeStage = stageMeta[index];
    const activeMenu = menuMeta[index];

    stageMeta.forEach((s, i) => s.el.classList.toggle('is-current', i === index));
    document.body.classList.add('stage-panel-open');

    if (prefersReducedMotion) {
      gsap.set(contentFirst, { y: '100%' });
      gsap.set(contentMove, { y: '-100%' });
      activeStage.backEl?.focus({ preventScroll: true });
      return;
    }

    isAnimating = true;
    activeTilt.columns = false;
    activeTilt.letters = false;

    const duration = 0.95;
    const otherMenus = menuMeta.filter((_, i) => i !== index).map((m) => m.el);

    gsap
      .timeline({
        onComplete: () => {
          isAnimating = false;
          activeStage.backEl?.focus({ preventScroll: true });
        },
      })
      .to(
        columnEls,
        {
          duration,
          ease: 'power3.inOut',
          y: (i, target: HTMLElement) => {
            const h = columnStates[i]?.height || winsize.height;
            return target.classList.contains('column--bottom')
              ? h + winsize.height * 0.2
              : -h - winsize.height * 0.2;
          },
          opacity: 0,
        },
        0,
      )
      .to(columnsWrap, { duration, ease: 'power3.inOut', rotation: -2 }, 0)
      .to(
        activeMenu.letters,
        {
          duration: duration * 0.65,
          ease: 'power3.inOut',
          y: (i: number) => (i % 2 === 0 ? MathUtils.rand(-220, -130) : MathUtils.rand(130, 220)),
          rotation: () => MathUtils.rand(-16, 16),
          opacity: 0,
          stagger: -0.012,
        },
        0,
      )
      .to(otherMenus, { duration: duration * 0.45, ease: 'power2.inOut', opacity: 0 }, 0)
      .to(contentFirst, { duration: 0.72, ease: 'expo.out', y: '100%' }, duration * 0.75)
      .to(contentMove, { duration: 0.72, ease: 'expo.out', y: '-100%' }, duration * 0.75)
      .fromTo(
        activeStage.titleLetters,
        {
          opacity: 0,
          y: (i: number) => (i % 2 === 0 ? MathUtils.rand(-32, -14) : MathUtils.rand(14, 32)),
          rotation: () => MathUtils.rand(-16, 16),
        },
        {
          duration: 0.85,
          ease: 'expo.out',
          y: 0,
          rotation: 0,
          opacity: 1,
          stagger: 0.015,
        },
        duration * 0.8,
      );
  }

  function closeItem() {
    if (isAnimating || currentIndex < 0) return;
    const activeStage = stageMeta[currentIndex];
    const activeMenu = menuMeta[currentIndex];
    const closingIndex = currentIndex;

    if (prefersReducedMotion) {
      activeStage.el.classList.remove('is-current');
      document.body.classList.remove('stage-panel-open');
      gsap.set([contentFirst, contentMove], { y: '0%' });
      currentIndex = -1;
      menuMeta[closingIndex]?.el.focus({ preventScroll: true });
      return;
    }

    isAnimating = true;
    const duration = 0.85;

    gsap
      .timeline({
        onComplete: () => {
          activeTilt.columns = true;
          activeTilt.letters = true;
          isAnimating = false;
          currentIndex = -1;
          document.body.classList.remove('stage-panel-open');
          menuMeta[closingIndex]?.el.focus({ preventScroll: true });
        },
      })
      .to(
        activeStage.titleLetters,
        {
          duration: duration * 0.5,
          ease: 'power2.in',
          y: (i: number) => (i % 2 === 0 ? MathUtils.rand(-28, -12) : MathUtils.rand(12, 28)),
          opacity: 0,
          stagger: 0.01,
        },
        0,
      )
      .to(
        [contentFirst, contentMove],
        {
          duration: duration * 0.55,
          ease: 'power3.inOut',
          y: '0%',
          onComplete: () => {
            activeStage.el.classList.remove('is-current');
          },
        },
        0.15,
      )
      .to(
        columnEls,
        {
          duration: duration * 0.9,
          ease: 'sine.out',
          y: 0,
          x: 0,
          opacity: 1,
          stagger: 0.02,
        },
        duration * 0.45,
      )
      .to(columnsWrap, { duration: duration * 0.9, ease: 'sine.out', rotation: 0 }, duration * 0.45)
      .to(
        activeMenu.letters,
        {
          duration: duration * 0.55,
          ease: 'quint.out',
          y: 0,
          rotation: 0,
          opacity: 1,
        },
        duration * 0.78,
      )
      .to(
        menuMeta.map((m) => m.el),
        {
          duration: duration * 0.55,
          ease: 'sine.out',
          opacity: 1,
        },
        duration * 0.78,
      );
  }

  menuMeta.forEach((m, idx) => {
    m.el.addEventListener('click', () => openItem(idx));
  });

  stageMeta.forEach((s) => {
    s.backEl?.addEventListener('click', () => closeItem());
  });

  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && currentIndex >= 0) {
      closeItem();
    }
  });
}
