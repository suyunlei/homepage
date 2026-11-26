export interface LightboxSlide {
  src: string;
  title: string;
  subtitle?: string;
  caption?: string;
}

const modal = document.getElementById('gallery-lightbox');
const dataHolder = document.getElementById('lightbox-slides-data');
const imgEl = document.getElementById('lightbox-img') as HTMLImageElement | null;
const titleEl = document.getElementById('lightbox-title');
const subtitleEl = document.getElementById('lightbox-subtitle');
const captionEl = document.getElementById('lightbox-caption');
const counterEl = document.getElementById('lightbox-counter');
const closeBtn = document.getElementById('lightbox-close');
const prevBtn = document.getElementById('lightbox-prev');
const nextBtn = document.getElementById('lightbox-next');
const mobilePrevBtn = document.getElementById('lightbox-mobile-prev');
const mobileNextBtn = document.getElementById('lightbox-mobile-next');

if (modal && dataHolder && imgEl) {
  let slides: LightboxSlide[] = [];
  try {
    slides = JSON.parse(dataHolder.dataset.slides || '[]') as LightboxSlide[];
  } catch {
    slides = [];
  }

  let current = 0;

  const renderSlide = (index: number) => {
    if (slides.length === 0) return;
    current = (index + slides.length) % slides.length;
    const item = slides[current];
    imgEl.src = item.src;
    imgEl.alt = item.title;
    if (titleEl) titleEl.textContent = item.title;
    if (subtitleEl) subtitleEl.textContent = item.subtitle || '';
    if (captionEl) captionEl.textContent = item.caption || '';
    if (counterEl) counterEl.textContent = `${current + 1} / ${slides.length}`;
  };

  const openModal = (index: number) => {
    renderSlide(index);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
    closeBtn?.focus({ preventScroll: true });
  };

  const closeModal = () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  };

  document.querySelectorAll<HTMLElement>('[data-lightbox-trigger]').forEach((el) => {
    el.addEventListener('click', () => {
      const idx = Number(el.dataset.lightboxIndex || '0');
      openModal(Number.isNaN(idx) ? 0 : idx);
    });
  });

  closeBtn?.addEventListener('click', closeModal);
  prevBtn?.addEventListener('click', () => renderSlide(current - 1));
  nextBtn?.addEventListener('click', () => renderSlide(current + 1));
  mobilePrevBtn?.addEventListener('click', () => renderSlide(current - 1));
  mobileNextBtn?.addEventListener('click', () => renderSlide(current + 1));

  // Touch horizontal swipe navigation inside lightbox
  let swipeStart = { x: 0, y: 0 };
  modal.addEventListener(
    'touchstart',
    (ev) => {
      if (ev.touches.length !== 1) return;
      swipeStart = { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
    },
    { passive: true },
  );
  modal.addEventListener(
    'touchend',
    (ev) => {
      if (ev.changedTouches.length !== 1) return;
      const dx = ev.changedTouches[0].clientX - swipeStart.x;
      const dy = ev.changedTouches[0].clientY - swipeStart.y;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        renderSlide(dx < 0 ? current + 1 : current - 1);
      }
    },
    { passive: true },
  );

  modal.addEventListener('click', (ev) => {
    if (ev.target === modal) {
      closeModal();
    }
  });

  window.addEventListener('keydown', (ev) => {
    if (modal.classList.contains('hidden')) return;
    if (ev.key === 'Escape') closeModal();
    if (ev.key === 'ArrowLeft') renderSlide(current - 1);
    if (ev.key === 'ArrowRight') renderSlide(current + 1);
  });
}

// Optional gallery tag filtering (e.g., 05-food album)
const tagBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-album-tag]'));
const tagCards = Array.from(document.querySelectorAll<HTMLElement>('[data-item-tags]'));

if (tagBtns.length > 0 && tagCards.length > 0) {
  tagBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const chosen = btn.dataset.albumTag || 'all';
      tagBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));

      tagCards.forEach((card) => {
        const raw = card.dataset.itemTags || '';
        const list = raw ? raw.split('|') : [];
        const match = chosen === 'all' || list.includes(chosen);
        card.classList.toggle('hidden', !match);
      });
    });
  });
}
