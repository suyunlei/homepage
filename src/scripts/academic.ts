import { copyText } from './clipboard';
import { getLang } from './i18n';

const typeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-filter-type]'));
const yearSelect = document.getElementById('pub-year-select') as HTMLSelectElement | null;
const searchInput = document.getElementById('pub-search-input') as HTMLInputElement | null;
const cards = Array.from(document.querySelectorAll<HTMLElement>('.pub-card'));
const emptyState = document.getElementById('pub-empty-state');
const countDisplay = document.getElementById('pub-visible-count');

let activeType = 'all';
let activeYear = 'all';
let query = '';

function applyFilters() {
  let visible = 0;
  for (const card of cards) {
    const type = card.dataset.pubType || '';
    const year = card.dataset.pubYear || '';
    const haystack = card.dataset.pubSearch || '';

    const matchType = activeType === 'all' || type === activeType;
    const matchYear = activeYear === 'all' || year === activeYear;
    const matchQuery = !query || haystack.includes(query);

    const show = matchType && matchYear && matchQuery;
    card.classList.toggle('hidden', !show);
    if (show) visible += 1;
  }

  if (countDisplay) {
    countDisplay.textContent = String(visible);
  }
  if (emptyState) {
    emptyState.classList.toggle('hidden', visible > 0);
  }
}

typeButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    activeType = btn.dataset.filterType || 'all';
    typeButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    applyFilters();
  });
});

yearSelect?.addEventListener('change', () => {
  activeYear = yearSelect.value || 'all';
  applyFilters();
});

searchInput?.addEventListener('input', () => {
  query = searchInput.value.trim().toLowerCase();
  applyFilters();
});

// Toggle Abstract / BibTeX drawers and copy BibTeX
cards.forEach((card) => {
  const toggleBtns = Array.from(card.querySelectorAll<HTMLButtonElement>('[data-toggle-drawer]'));
  const drawers = Array.from(card.querySelectorAll<HTMLElement>('[data-drawer]'));

  toggleBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetName = btn.dataset.toggleDrawer;
      const targetDrawer = drawers.find((d) => d.dataset.drawer === targetName);
      if (!targetDrawer) return;

      const isCurrentlyOpen = !targetDrawer.classList.contains('hidden');
      drawers.forEach((d) => d.classList.add('hidden'));
      toggleBtns.forEach((b) => b.setAttribute('aria-expanded', 'false'));

      if (!isCurrentlyOpen) {
        targetDrawer.classList.remove('hidden');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  const copyBtn = card.querySelector<HTMLButtonElement>('[data-copy-bibtex]');
  const preEl = card.querySelector<HTMLElement>('pre');
  if (copyBtn && preEl) {
    copyBtn.addEventListener('click', async () => {
      const ok = await copyText(preEl.textContent || '');
      const original = copyBtn.textContent;
      const isZh = getLang() === 'zh';
      copyBtn.textContent = ok ? (isZh ? '已复制 ✓' : 'Copied ✓') : 'Copy manually';
      setTimeout(() => {
        copyBtn.textContent = original || 'Copy BibTeX';
      }, 1800);
    });
  }
});

// Optional obfuscated email reveal button on Scholar hero
const academicEmailBtn = document.getElementById('academic-email-btn') as HTMLButtonElement | null;
if (academicEmailBtn?.dataset.emailCodes) {
  academicEmailBtn.addEventListener('click', async () => {
    const codes = JSON.parse(academicEmailBtn.dataset.emailCodes || '[]') as number[];
    const decoded = String.fromCharCode(...codes.map((c) => c - 3));
    const copied = await copyText(decoded);
    const suffix = getLang() === 'zh' ? ' (已复制)' : ' (Copied)';
    academicEmailBtn.textContent = copied ? `${decoded}${suffix}` : decoded;
  });
}
