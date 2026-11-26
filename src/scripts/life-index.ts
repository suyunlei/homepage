const backdrop = document.getElementById('life-ambient-bg');
const cards = Array.from(document.querySelectorAll<HTMLElement>('.life-album-card'));
const track = document.getElementById('life-album-track');
const prevBtn = document.getElementById('life-prev-btn');
const nextBtn = document.getElementById('life-next-btn');
const dots = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-album-dot]'));
const counterEl = document.getElementById('life-mobile-counter');

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
      dot.classList.toggle('w-2', !isCurrent);
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
      cards[idx]?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    });
  });

  setActiveCard(0);
}

if (track && prevBtn && nextBtn) {
  const scrollByCard = (direction: number) => {
    const firstCard = track.querySelector<HTMLElement>('.life-album-card');
    const step = firstCard ? firstCard.getBoundingClientRect().width + 20 : 340;
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  prevBtn.addEventListener('click', () => scrollByCard(-1));
  nextBtn.addEventListener('click', () => scrollByCard(1));
}
