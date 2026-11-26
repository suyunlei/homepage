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
  const radius = circle.getBoundingClientRect().width / 2 || 12;

  window.addEventListener(
    'mousemove',
    (ev) => {
      targetX = ev.clientX;
      targetY = ev.clientY;
    },
    { passive: true },
  );

  document.addEventListener('pointerover', (ev) => {
    const target = ev.target as Element | null;
    if (target?.closest('a, button, [data-cursor-hover]')) {
      targetScale = 1.5;
    }
  });

  document.addEventListener('pointerout', (ev) => {
    const target = ev.target as Element | null;
    if (target?.closest('a, button, [data-cursor-hover]')) {
      targetScale = 1;
    }
  });

  document.addEventListener('mousedown', () => {
    currentScale = 0.45;
  });

  const render = () => {
    currentX += (targetX - radius - currentX) * 0.16;
    currentY += (targetY - radius - currentY) * 0.16;
    currentScale += (targetScale - currentScale) * 0.16;
    circle.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0) scale(${currentScale.toFixed(3)})`;
    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);
}
