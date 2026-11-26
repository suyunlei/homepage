const backdrop = document.getElementById('life-ambient-bg');
const cards = Array.from(document.querySelectorAll<HTMLElement>('.life-album-card'));
const track = document.getElementById('life-album-track');
const prevBtn = document.getElementById('life-prev-btn');
const nextBtn = document.getElementById('life-next-btn');

if (backdrop && cards.length > 0) {
  const setAmbient = (cover: string | undefined) => {
    if (!cover) return;
    backdrop.style.backgroundImage = `url('${cover}')`;
  };

  cards.forEach((card) => {
    const activate = () => setAmbient(card.dataset.cover);
    card.addEventListener('mouseenter', activate);
    card.addEventListener('focusin', activate);
  });
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
