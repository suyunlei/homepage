const backdrop = document.getElementById('life-ambient-bg');
const cards = Array.from(document.querySelectorAll<HTMLElement>('.life-album-card'));
const track = document.getElementById('life-album-track');
const prevBtn = document.getElementById('life-prev-btn');
const nextBtn = document.getElementById('life-next-btn');
const dots = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-album-dot]'));
const counterEl = document.getElementById('life-mobile-counter');
const scrollRail = document.getElementById('life-scroll-rail');
const scrollThumb = document.getElementById('life-scroll-thumb');

if (cards.length > 0) {
  const setAmbient = (cover: string | undefined) => {
    if (backdrop && cover) {
      backdrop.style.backgroundImage = `url('${cover}')`;
    }
  };

  const setActiveCard = (activeIndex: number) => {
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
      setAmbient(card.dataset.cover);
      setActiveCard(idx);
    };
    card.addEventListener('mouseenter', activate);
    card.addEventListener('focusin', activate);
  });

  if (track && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = cards.indexOf(entry.target as HTMLElement);
          if (idx >= 0) {
            setAmbient(cards[idx].dataset.cover);
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
  }

  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      setAmbient(cards[idx]?.dataset.cover);
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
