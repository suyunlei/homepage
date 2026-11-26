const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(any-pointer: fine)').matches;

const root = document.querySelector<HTMLElement>('.custom-cursor');
const circle = document.querySelector<HTMLElement>('.custom-cursor__circle');

if (root && circle && finePointer && !prefersReducedMotion) {
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;
  let targetScale = 1;
  let currentScale = 1;
  let rafId = 0;
  const radius = circle.getBoundingClientRect().width / 2 || 12;

  const render = () => {
    const dx = targetX - radius - currentX;
    const dy = targetY - radius - currentY;
    const ds = targetScale - currentScale;

    currentX += dx * 0.16;
    currentY += dy * 0.16;
    currentScale += ds * 0.16;
    circle.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0) scale(${currentScale.toFixed(3)})`;

    if (
      Math.abs(targetX - radius - currentX) < 0.05 &&
      Math.abs(targetY - radius - currentY) < 0.05 &&
      Math.abs(targetScale - currentScale) < 0.005
    ) {
      rafId = 0;
      return;
    }

    rafId = requestAnimationFrame(render);
  };

  const startLoop = () => {
    if (!rafId) {
      rafId = requestAnimationFrame(render);
    }
  };

  window.addEventListener(
    'mousemove',
    (ev) => {
      targetX = ev.clientX;
      targetY = ev.clientY;
      startLoop();
    },
    { passive: true },
  );

  document.addEventListener('pointerover', (ev) => {
    const target = ev.target as Element | null;
    if (target?.closest('a, button, [data-cursor-hover]')) {
      targetScale = 1.5;
      startLoop();
    }
  });

  document.addEventListener('pointerout', (ev) => {
    const target = ev.target as Element | null;
    if (target?.closest('a, button, [data-cursor-hover]')) {
      targetScale = 1;
      startLoop();
    }
  });

  document.addEventListener('mousedown', () => {
    currentScale = 0.45;
    startLoop();
  });
}
