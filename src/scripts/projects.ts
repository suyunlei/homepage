const filterButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-project-filter]'));
const projectCards = Array.from(document.querySelectorAll<HTMLElement>('.project-card'));
const countEl = document.getElementById('project-visible-count');

filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const selected = btn.dataset.projectFilter || 'all';
    filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));

    let visible = 0;
    for (const card of projectCards) {
      const match = selected === 'all' || card.dataset.projectCategory === selected;
      card.classList.toggle('hidden', !match);
      if (match) visible += 1;
    }

    if (countEl) {
      countEl.textContent = String(visible);
    }
  });
});
