import { copyText } from './clipboard';
import { getLang } from './i18n';

// Interactive accordion on Contact identity card
const accordionButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-accordion-btn]'));
const accordionPanels = Array.from(document.querySelectorAll<HTMLElement>('[data-accordion-panel]'));

accordionButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.accordionBtn;
    const panel = accordionPanels.find((p) => p.dataset.accordionPanel === key);
    if (!panel) return;

    const alreadyOpen = btn.getAttribute('aria-expanded') === 'true';
    accordionButtons.forEach((b) => b.setAttribute('aria-expanded', 'false'));
    accordionPanels.forEach((p) => p.classList.add('hidden'));

    if (!alreadyOpen) {
      btn.setAttribute('aria-expanded', 'true');
      panel.classList.remove('hidden');
    }
  });
});

// Anti-scrape email decode + copy
const emailRevealBtn = document.getElementById('contact-email-reveal') as HTMLButtonElement | null;
const emailOutput = document.getElementById('contact-email-output');
const emailCopyBtn = document.getElementById('contact-email-copy') as HTMLButtonElement | null;

let decodedEmail = '';

if (emailRevealBtn?.dataset.emailCodes && emailOutput) {
  emailRevealBtn.addEventListener('click', () => {
    const codes = JSON.parse(emailRevealBtn.dataset.emailCodes || '[]') as number[];
    decodedEmail = String.fromCharCode(...codes.map((c) => c - 3));
    emailOutput.textContent = decodedEmail;
    emailOutput.classList.remove('hidden');
    emailRevealBtn.classList.add('hidden');
    emailCopyBtn?.classList.remove('hidden');
  });
}

emailCopyBtn?.addEventListener('click', async () => {
  if (!decodedEmail) return;
  const ok = await copyText(decodedEmail);
  const prev = emailCopyBtn.textContent;
  const isZh = getLang() === 'zh';
  emailCopyBtn.textContent = ok ? (isZh ? '已复制 ✓' : 'Copied ✓') : 'Select & Copy';
  setTimeout(() => {
    emailCopyBtn.textContent = prev || 'Copy';
  }, 1800);
});

// WeChat QR Modal
const qrOpenBtn = document.getElementById('wechat-qr-open');
const qrModal = document.getElementById('wechat-qr-modal');
const qrCloseBtn = document.getElementById('wechat-qr-close');

const closeQrModal = () => {
  if (!qrModal) return;
  qrModal.classList.add('hidden');
  qrModal.classList.remove('flex');
};

qrOpenBtn?.addEventListener('click', () => {
  if (!qrModal) return;
  qrModal.classList.remove('hidden');
  qrModal.classList.add('flex');
  qrCloseBtn?.focus({ preventScroll: true });
});

qrCloseBtn?.addEventListener('click', closeQrModal);
qrModal?.addEventListener('click', (ev) => {
  if (ev.target === qrModal) closeQrModal();
});
window.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && qrModal && !qrModal.classList.contains('hidden')) {
    closeQrModal();
  }
});
