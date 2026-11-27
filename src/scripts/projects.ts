import { initRollingCounter, setRollingCounter } from './rolling-counter';

const filterButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-project-filter]'));
const projectCards = Array.from(document.querySelectorAll<HTMLElement>('.project-card'));
const countEl = document.getElementById('project-visible-count');

if (countEl) {
  initRollingCounter(countEl, { bounce: 42, stagger: 40, blur: 45 });
}

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

    setRollingCounter(countEl, visible);
  });
});
