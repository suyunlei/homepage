const backdrop = document.getElementById('life-ambient-bg');
const cards = Array.from(document.querySelectorAll<HTMLElement>('.life-album-card'));
const track = document.getElementById('life-album-track');
const prevBtn = document.getElementById('life-prev-btn');
const nextBtn = document.getElementById('life-next-btn');
const dots = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-album-dot]'));
const counterEl = document.getElementById('life-mobile-counter');
const scrollRail = document.getElementById('life-scroll-rail');
const scrollThumb = document.getElementById('life-scroll-thumb');

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

if (track) {
  const updateScrollRail = () => {
    if (!scrollRail || !scrollThumb) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 2) {
      scrollThumb.style.width = '100%';
      scrollThumb.style.left = '0%';
      scrollRail.setAttribute('aria-valuenow', '0');
      return;
    }
    const thumbPct = Math.max(16, Math.min(100, (track.clientWidth / track.scrollWidth) * 100));
    const ratio = Math.max(0, Math.min(1, track.scrollLeft / maxScroll));
    const leftPct = ratio * (100 - thumbPct);
    scrollThumb.style.width = `${thumbPct.toFixed(2)}%`;
    scrollThumb.style.left = `${leftPct.toFixed(2)}%`;
    scrollRail.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
  };

  track.addEventListener('scroll', updateScrollRail, { passive: true });
  window.addEventListener('resize', updateScrollRail, { passive: true });
  requestAnimationFrame(updateScrollRail);

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

  // Click / drag directly on the editorial progress rail
  if (scrollRail) {
    let scrubbing = false;
    const scrubToClientX = (clientX: number) => {
      cards.forEach((card) => hydrateCardImage(card));
      const rect = scrollRail.getBoundingClientRect();
      if (rect.width <= 0) return;
      const maxScroll = track.scrollWidth - track.clientWidth;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      track.scrollLeft = ratio * maxScroll;
    };

    scrollRail.addEventListener('pointerdown', (ev) => {
      scrubbing = true;
      scrollRail.setPointerCapture(ev.pointerId);
      scrubToClientX(ev.clientX);
    });
    scrollRail.addEventListener('pointermove', (ev) => {
      if (scrubbing) scrubToClientX(ev.clientX);
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
      if (ev.key === 'ArrowRight') track.scrollBy({ left: maxScroll * 0.2, behavior: 'smooth' });
      if (ev.key === 'ArrowLeft') track.scrollBy({ left: -maxScroll * 0.2, behavior: 'smooth' });
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
    dragStartX = ev.clientX;
    dragStartLeft = track.scrollLeft;
  });

  window.addEventListener('pointermove', (ev) => {
    if (!mouseDown) return;
    const dx = ev.clientX - dragStartX;
    if (Math.abs(dx) > 6) {
      dragMoved = true;
      track.scrollLeft = dragStartLeft - dx;
    }
  });

  const endMouseDrag = () => {
    mouseDown = false;
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
