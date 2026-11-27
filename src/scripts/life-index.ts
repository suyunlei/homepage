import {
  clamp,
  frameDelta,
  mix,
  prefersReducedMotion,
  stepSpring,
  type SpringState,
} from './spring';

const backdrop = document.getElementById('life-ambient-bg');
const cards = Array.from(document.querySelectorAll<HTMLElement>('.life-album-card'));
const track = document.getElementById('life-album-track');
const prevBtn = document.getElementById('life-prev-btn');
const nextBtn = document.getElementById('life-next-btn');
const dots = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-album-dot]'));
const counterEl = document.getElementById('life-mobile-counter');
const scrollRail = document.getElementById('life-scroll-rail');
const wakeBars = scrollRail
  ? Array.from(scrollRail.querySelectorAll<HTMLElement>('[data-wake-bar]'))
  : [];

let isDraggingTrack = false;
let releaseAllTilts: () => void = () => {};

const warmedCards = new WeakSet<HTMLElement>();
let avifSupported: boolean | null = null;
let avifProbePromise: Promise<boolean> | null = null;

const detectAvif = (): Promise<boolean> => {
  if (avifSupported !== null) return Promise.resolve(avifSupported);
  if (!avifProbePromise) {
    avifProbePromise = new Promise((resolve) => {
      const probe = new Image();
      probe.onload = () => {
        avifSupported = probe.width > 0 && probe.height > 0;
        resolve(avifSupported);
      };
      probe.onerror = () => {
        avifSupported = false;
        resolve(false);
      };
      probe.src =
        'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    });
  }
  return avifProbePromise;
};

const hydrateCardImage = (card: HTMLElement | undefined) => {
  if (!card) return;
  const img = card.querySelector<HTMLImageElement>('img[data-src]');
  if (!img) return;
  const src = img.dataset.src;
  if (!src) return;
  const pic = img.parentElement;
  if (pic && pic.tagName === 'PICTURE') {
    pic.querySelectorAll<HTMLSourceElement>('source[data-srcset]').forEach((source) => {
      const sUrl = source.dataset.srcset;
      if (sUrl) {
        source.srcset = sUrl;
        delete source.dataset.srcset;
      }
    });
  }
  delete img.dataset.src;
  const show = () => img.classList.remove('opacity-0');
  img.addEventListener('load', show, { once: true });
  img.addEventListener('error', show, { once: true });
  img.src = src;
  if (img.complete) show();
};

const warmChapterThumbs = (card: HTMLElement) => {
  if (warmedCards.has(card)) return;
  warmedCards.add(card);
  void detectAvif().then((useAvif) => {
    const raw = (useAvif ? card.dataset.preloadThumbsAvif : null) || card.dataset.preloadThumbs;
    if (!raw) return;
    try {
      const urls = JSON.parse(raw) as string[];
      for (const url of urls) {
        if (url) {
          const pre = new Image();
          pre.src = url;
        }
      }
    } catch {
      // ignore invalid preload payload
    }
  });
};

if (backdrop) {
  let ambientHydrated = false;
  const revealInitialAmbient = () => {
    if (ambientHydrated) return;
    ambientHydrated = true;
    void detectAvif().then((useAvif) => {
      const initialCover =
        (useAvif ? backdrop.dataset.initialCoverAvif : null) || backdrop.dataset.initialCover;
      if (initialCover && !backdrop.style.backgroundImage) {
        backdrop.style.backgroundImage = `url('${initialCover}')`;
      }
      backdrop.classList.remove('opacity-0');
      backdrop.classList.add('opacity-15');
    });
  };

  const firstCardImg = cards[0]?.querySelector<HTMLImageElement>('img');
  if (firstCardImg && !firstCardImg.complete) {
    firstCardImg.addEventListener('load', revealInitialAmbient, { once: true });
    firstCardImg.addEventListener('error', revealInitialAmbient, { once: true });
    window.setTimeout(revealInitialAmbient, 250);
  } else {
    revealInitialAmbient();
  }
}

if (cards.length > 0) {
  const getPreferredCover = (card: HTMLElement | undefined) =>
    card ? ((avifSupported ? card.dataset.coverAvif : null) || card.dataset.cover) : undefined;

  const setAmbient = (card: HTMLElement | undefined) => {
    const cover = getPreferredCover(card);
    if (backdrop && cover) {
      backdrop.style.backgroundImage = `url('${cover}')`;
      backdrop.classList.remove('opacity-0');
      backdrop.classList.add('opacity-15');
    }
  };

  const setActiveCard = (activeIndex: number) => {
    hydrateCardImage(cards[activeIndex]);
    hydrateCardImage(cards[activeIndex + 1]);
    cards.forEach((card, i) => card.classList.toggle('is-active-card', i === activeIndex));
    dots.forEach((dot, i) => {
      const isCurrent = i === activeIndex;
      dot.setAttribute('aria-pressed', String(isCurrent));
      dot.classList.toggle('w-6', isCurrent);
      dot.classList.toggle('bg-[#252528]', isCurrent);
      dot.classList.toggle('w-1.5', !isCurrent);
      dot.classList.toggle('bg-[#252528]/25', !isCurrent);
    });
    if (counterEl) {
      counterEl.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    }
  };

  cards.forEach((card, idx) => {
    const activate = () => {
      hydrateCardImage(card);
      warmChapterThumbs(card);
      setAmbient(card);
      setActiveCard(idx);
    };
    card.addEventListener('mouseenter', activate);
    card.addEventListener('focusin', activate);
    card.addEventListener(
      'touchstart',
      () => {
        hydrateCardImage(card);
        warmChapterThumbs(card);
      },
      { passive: true },
    );
  });

  if (track && 'IntersectionObserver' in window) {
    const hydrateObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const card = entry.target as HTMLElement;
          hydrateCardImage(card);
          hydrateObserver.unobserve(card);
        }
      },
      {
        root: track,
        rootMargin: '0px 480px 0px 0px',
        threshold: 0.01,
      },
    );
    cards.forEach((card) => hydrateObserver.observe(card));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = cards.indexOf(entry.target as HTMLElement);
          if (idx >= 0) {
            setAmbient(cards[idx]);
            setActiveCard(idx);
          }
        }
      },
      {
        root: track,
        threshold: 0.6,
      },
    );
    cards.forEach((card) => observer.observe(card));
  } else {
    cards.forEach((card) => hydrateCardImage(card));
  }

  const hydrateAllIdle = () => {
    const run = () => {
      cards.forEach((card) => hydrateCardImage(card));
    };
    const requestIdle = (
      window as unknown as {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      }
    ).requestIdleCallback;
    if (typeof requestIdle === 'function') {
      requestIdle(run, { timeout: 1500 });
    } else {
      window.setTimeout(run, 800);
    }
  };

  if (document.readyState === 'complete') {
    hydrateAllIdle();
  } else {
    window.addEventListener('load', hydrateAllIdle, { once: true });
  }

  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      hydrateCardImage(cards[idx]);
      setAmbient(cards[idx]);
      setActiveCard(idx);
      cards[idx]?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    });
  });

  setActiveCard(0);
}

const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if (cards.length > 0 && fineHover && !prefersReducedMotion()) {
  const MAX_TILT = 7.5;
  const SINK = 10;
  const SHADE = 52;

  interface TiltCardState {
    card: HTMLElement;
    surface: HTMLElement;
    sheen: HTMLElement;
    tx: number;
    ty: number;
    on: boolean;
    sx: SpringState;
    sy: SpringState;
    lit: SpringState;
  }

  const activeTilts = new Set<TiltCardState>();
  const tiltStates: TiltCardState[] = [];
  let tiltRaf = 0;
  let tiltPrev = 0;

  const tiltTick = (now: number) => {
    const dt60 = frameDelta(now, tiltPrev);
    tiltPrev = now;

    for (const s of activeTilts) {
      const targetX = s.on ? s.tx : 0;
      const targetY = s.on ? s.ty : 0;
      const targetLit = s.on ? 1 : 0;

      const mx = stepSpring(s.sx, targetX, dt60, 48, 0.002);
      const my = stepSpring(s.sy, targetY, dt60, 48, 0.002);
      const ml = stepSpring(s.lit, targetLit, dt60, 48, 0.002);
      const moving = mx || my || ml;

      const lit = clamp(s.lit.pos, 0, 1);

      if (!s.on && !moving && lit < 0.003) {
        s.surface.style.transform = '';
        s.surface.style.boxShadow = '';
        s.sheen.style.backgroundImage = '';
        activeTilts.delete(s);
        continue;
      }

      const rx = -s.sy.pos * MAX_TILT;
      const ry = s.sx.pos * MAX_TILT;
      const px = ((s.sx.pos + 1) / 2) * 100;
      const py = ((s.sy.pos + 1) / 2) * 100;
      const dark = (SHADE / 100) * 0.58 * lit;
      const rim = (SHADE / 100) * 0.34 * lit;

      s.surface.style.transform = `translateZ(${(-SINK * lit).toFixed(2)}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      s.surface.style.boxShadow = `0 ${mix(20, 8, lit).toFixed(1)}px ${mix(40, 20, lit).toFixed(1)}px -8px rgba(15, 23, 42, ${mix(0.28, 0.16, lit).toFixed(3)})`;
      s.sheen.style.backgroundImage = `radial-gradient(42% 34% at ${px.toFixed(1)}% ${py.toFixed(1)}%, rgba(9, 14, 28, ${dark.toFixed(3)}) 0%, rgba(9, 14, 28, 0) 100%), radial-gradient(52% 42% at ${(100 - px).toFixed(1)}% ${(100 - py).toFixed(1)}%, rgba(255, 255, 255, ${rim.toFixed(3)}) 0%, rgba(255, 255, 255, 0) 100%)`;
    }

    if (activeTilts.size > 0) {
      tiltRaf = requestAnimationFrame(tiltTick);
    } else {
      tiltRaf = 0;
      tiltPrev = 0;
    }
  };

  const startTiltLoop = () => {
    if (!tiltRaf && activeTilts.size > 0) {
      tiltPrev = 0;
      tiltRaf = requestAnimationFrame(tiltTick);
    }
  };

  releaseAllTilts = () => {
    let any = false;
    for (const s of tiltStates) {
      if (s.on) {
        s.on = false;
        activeTilts.add(s);
        any = true;
      }
    }
    if (any) startTiltLoop();
  };

  for (const card of cards) {
    const surface = card.querySelector<HTMLElement>('.life-album-card__surface');
    const sheen = card.querySelector<HTMLElement>('.life-tilt-sheen');
    if (!surface || !sheen) continue;

    const state: TiltCardState = {
      card,
      surface,
      sheen,
      tx: 0,
      ty: 0,
      on: false,
      sx: { pos: 0, vel: 0 },
      sy: { pos: 0, vel: 0 },
      lit: { pos: 0, vel: 0 },
    };
    tiltStates.push(state);

    card.addEventListener('pointermove', (ev) => {
      if (ev.pointerType !== 'mouse' || isDraggingTrack) return;
      const r = card.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      state.tx = clamp(((ev.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      state.ty = clamp(((ev.clientY - r.top) / r.height) * 2 - 1, -1, 1);
      state.on = true;
      activeTilts.add(state);
      startTiltLoop();
    });

    card.addEventListener('pointerout', (ev) => {
      const to = ev.relatedTarget as Node | null;
      if (!to || !card.contains(to)) {
        state.on = false;
        if (activeTilts.has(state)) startTiltLoop();
      }
    });

    const releaseCard = () => {
      state.on = false;
      if (activeTilts.has(state)) startTiltLoop();
    };
    card.addEventListener('pointercancel', releaseCard);
    card.addEventListener('blur', releaseCard);
  }
}

if (track) {
  const wakeCount = wakeBars.length;
  const wakeEnergy = new Float32Array(wakeCount);
  let wakeRaf = 0;
  let wakePrev = 0;
  let wakeFrac = 0;
  let scrubbing = false;
  let scrubLastX = 0;
  let scrubLastT = 0;
  let scrubSpeed = 0;
  let lastScrollLeft = track.scrollLeft;
  let lastScrollTime = performance.now();
  let scrollSpeed = 0;
  let keyWakeBoostUntil = 0;

  const paintWakeLit = (ratio: number) => {
    if (!scrollRail || wakeCount === 0) return;
    const clamped = clamp(ratio, 0, 1);
    const litIdx = Math.round(clamped * (wakeCount - 1));
    for (let i = 0; i < wakeCount; i++) {
      const bar = wakeBars[i];
      if (i <= litIdx) {
        bar.dataset.on = 'true';
      } else {
        delete bar.dataset.on;
      }
      if (i === litIdx) {
        bar.dataset.head = 'true';
      } else {
        delete bar.dataset.head;
      }
    }
    scrollRail.setAttribute('aria-valuenow', String(Math.round(clamped * 100)));
  };

  const wakeLoop = () => {
    if (wakeRaf || wakeCount === 0) return;
    wakePrev = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - wakePrev) / 1000));
      wakePrev = now;
      const fall = Math.exp(-dt * 6.5);
      let live = false;

      for (let i = 0; i < wakeCount; i++) {
        wakeEnergy[i] *= fall;
        if (wakeEnergy[i] < 0.002) {
          wakeEnergy[i] = 0;
          if (wakeBars[i].style.transform) {
            wakeBars[i].style.transform = '';
          }
        } else {
          live = true;
          wakeBars[i].style.transform = `scaleY(${(1 + wakeEnergy[i] * 1.45).toFixed(3)})`;
        }
      }

      if (live || scrubbing) {
        wakeRaf = requestAnimationFrame(tick);
      } else {
        wakeRaf = 0;
      }
    };
    wakeRaf = requestAnimationFrame(tick);
  };

  const wakeTo = (ratio: number, speedPxPerSec: number) => {
    if (wakeCount === 0) return;
    const f = clamp(ratio, 0, 1);
    const a = Math.round(wakeFrac * (wakeCount - 1));
    const b = Math.round(f * (wakeCount - 1));
    wakeFrac = f;
    paintWakeLit(f);

    if (!prefersReducedMotion() && speedPxPerSec > 0) {
      const push = (1 - Math.exp(-speedPxPerSec / 900)) * 0.95;
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      for (let i = lo; i <= hi; i++) {
        wakeEnergy[i] = Math.max(wakeEnergy[i], push);
      }
      wakeLoop();
    }
  };

  const updateScrollRail = (withWake = false) => {
    if (!scrollRail || wakeCount === 0) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 2) {
      wakeFrac = 0;
      paintWakeLit(0);
      return;
    }
    const ratio = clamp(track.scrollLeft / maxScroll, 0, 1);
    if (!withWake) {
      wakeFrac = ratio;
      paintWakeLit(ratio);
      return;
    }
    const now = performance.now();
    const dx = Math.abs(track.scrollLeft - lastScrollLeft);
    const dt = Math.max(0.008, (now - lastScrollTime) / 1000);
    lastScrollLeft = track.scrollLeft;
    lastScrollTime = now;

    if (scrubbing) return;

    const instant = dx < 0.5 ? 0 : dx / dt;
    scrollSpeed = scrollSpeed * 0.5 + instant * 0.5;
    const effectiveSpeed = now < keyWakeBoostUntil ? Math.max(scrollSpeed, 550) : scrollSpeed;
    wakeTo(ratio, effectiveSpeed);
  };

  track.addEventListener('scroll', () => updateScrollRail(true), { passive: true });
  window.addEventListener('resize', () => updateScrollRail(false), { passive: true });
  requestAnimationFrame(() => updateScrollRail(false));

  if (prevBtn && nextBtn) {
    const scrollByCard = (direction: number) => {
      cards.forEach((card) => hydrateCardImage(card));
      const firstCard = track.querySelector<HTMLElement>('.life-album-card');
      const step = firstCard ? firstCard.getBoundingClientRect().width + 20 : 340;
      track.scrollBy({ left: direction * step, behavior: 'smooth' });
    };

    prevBtn.addEventListener('click', () => scrollByCard(-1));
    nextBtn.addEventListener('click', () => scrollByCard(1));
  }

  // Click / drag directly on the editorial wake rail
  if (scrollRail) {
    const scrubToClientX = (clientX: number, speed: number) => {
      cards.forEach((card) => hydrateCardImage(card));
      const rect = scrollRail.getBoundingClientRect();
      if (rect.width <= 0) return;
      const maxScroll = track.scrollWidth - track.clientWidth;
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      wakeTo(ratio, speed);
      if (maxScroll > 0) {
        track.scrollLeft = ratio * maxScroll;
      }
      lastScrollLeft = track.scrollLeft;
      lastScrollTime = performance.now();
    };

    scrollRail.addEventListener('pointerdown', (ev) => {
      scrubbing = true;
      scrubLastX = ev.clientX;
      scrubLastT = performance.now();
      scrubSpeed = 0;
      try {
        scrollRail.setPointerCapture(ev.pointerId);
      } catch {}
      scrubToClientX(ev.clientX, 0);
    });
    scrollRail.addEventListener('pointermove', (ev) => {
      if (!scrubbing) return;
      const now = performance.now();
      const dt = Math.max(0.008, (now - scrubLastT) / 1000);
      const v = Math.abs(ev.clientX - scrubLastX) / dt;
      scrubSpeed = scrubSpeed * 0.5 + v * 0.5;
      scrubLastX = ev.clientX;
      scrubLastT = now;
      scrubToClientX(ev.clientX, scrubSpeed);
    });
    const endScrub = (ev: PointerEvent) => {
      if (!scrubbing) return;
      scrubbing = false;
      try {
        scrollRail.releasePointerCapture(ev.pointerId);
      } catch {}
    };
    scrollRail.addEventListener('pointerup', endScrub);
    scrollRail.addEventListener('pointercancel', endScrub);
    scrollRail.addEventListener('keydown', (ev) => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll <= 0) return;
      const step = ev.shiftKey ? 0.25 : 0.1;
      const curRatio = clamp(track.scrollLeft / maxScroll, 0, 1);
      let nextRatio: number | null = null;
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') nextRatio = curRatio + step;
      if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') nextRatio = curRatio - step;
      if (ev.key === 'Home') nextRatio = 0;
      if (ev.key === 'End') nextRatio = 1;
      if (nextRatio === null) return;
      ev.preventDefault();
      nextRatio = clamp(nextRatio, 0, 1);
      cards.forEach((card) => hydrateCardImage(card));
      if (prefersReducedMotion()) {
        track.scrollLeft = nextRatio * maxScroll;
        paintWakeLit(nextRatio);
      } else {
        keyWakeBoostUntil = performance.now() + 350;
        track.scrollTo({ left: nextRatio * maxScroll, behavior: 'smooth' });
      }
    });
  }

  // Desktop mouse-drag horizontal scrolling on track
  let mouseDown = false;
  let dragMoved = false;
  let dragStartX = 0;
  let dragStartLeft = 0;

  track.addEventListener('pointerdown', (ev) => {
    if (ev.pointerType !== 'mouse' || ev.button !== 0) return;
    mouseDown = true;
    dragMoved = false;
    isDraggingTrack = false;
    dragStartX = ev.clientX;
    dragStartLeft = track.scrollLeft;
  });

  window.addEventListener('pointermove', (ev) => {
    if (!mouseDown) return;
    const dx = ev.clientX - dragStartX;
    if (Math.abs(dx) > 6) {
      if (!dragMoved) {
        dragMoved = true;
        isDraggingTrack = true;
        releaseAllTilts();
      }
      track.scrollLeft = dragStartLeft - dx;
    }
  });

  const endMouseDrag = () => {
    mouseDown = false;
    isDraggingTrack = false;
  };
  window.addEventListener('pointerup', endMouseDrag);
  window.addEventListener('pointercancel', endMouseDrag);

  track.addEventListener(
    'click',
    (ev) => {
      if (dragMoved) {
        ev.preventDefault();
        ev.stopPropagation();
        dragMoved = false;
      }
    },
    true,
  );
}

export {};
