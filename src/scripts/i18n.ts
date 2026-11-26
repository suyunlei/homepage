export type SiteLang = 'zh' | 'en';

const STORAGE_KEY = 'site-lang';

export function getLang(): SiteLang {
  return document.documentElement.dataset.lang === 'en' ? 'en' : 'zh';
}

function syncDomForLang(lang: SiteLang): void {
  const root = document.documentElement;
  root.dataset.lang = lang;
  root.lang = lang === 'en' ? 'en' : 'zh-CN';

  const nextTitle = lang === 'en' ? root.dataset.titleEn : root.dataset.titleZh;
  if (nextTitle) {
    document.title = nextTitle;
  }

  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-placeholder-zh][data-placeholder-en]').forEach((el) => {
    const ph = lang === 'en' ? el.dataset.placeholderEn : el.dataset.placeholderZh;
    if (ph) el.placeholder = ph;
  });

  document.querySelectorAll<HTMLButtonElement>('[data-lang-option]').forEach((btn) => {
    const active = btn.dataset.langOption === lang;
    btn.setAttribute('aria-pressed', String(active));
    btn.classList.toggle('bg-[#252528]', active);
    btn.classList.toggle('text-[#f4f6f8]', active);
    btn.classList.toggle('text-[#4a4f57]', !active);
  });
}

export function setLang(lang: SiteLang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Ignore storage errors in restricted browsing contexts.
  }
  syncDomForLang(lang);
  window.dispatchEvent(new CustomEvent('site:lang-change', { detail: { lang } }));
}

function initI18n(): void {
  const current = getLang();
  syncDomForLang(current);

  document.querySelectorAll<HTMLButtonElement>('[data-lang-option]').forEach((btn) => {
    if (btn.dataset.langBound === 'true') return;
    btn.dataset.langBound = 'true';
    btn.addEventListener('click', () => {
      const target = btn.dataset.langOption === 'en' ? 'en' : 'zh';
      setLang(target);
    });
  });
}

initI18n();
