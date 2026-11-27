import { damp, frameDelta, prefersReducedMotion, stepSpring, type SpringState } from './spring';

const finePointer = window.matchMedia('(any-pointer: fine)').matches;

const root = document.querySelector<HTMLElement>('.custom-cursor');
const circle = document.querySelector<HTMLElement>('.custom-cursor__circle');

if (root && circle && finePointer && !prefersReducedMotion()) {
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;
  let targetScale = 1;
  const scaleState: SpringState = { pos: 1, vel: 0 };
  let rafId = 0;
  let prevTime = 0;
  const radius = circle.getBoundingClientRect().width / 2 || 12;

  const render = (now: number) => {
    const dt60 = frameDelta(now, prevTime);
    prevTime = now;

    currentX = damp(currentX, targetX - radius, 0.16, dt60);
    currentY = damp(currentY, targetY - radius, 0.16, dt60);

    const scaleMoving = stepSpring(scaleState, targetScale, dt60, 42, 0.002);
    const posMoving =
      Math.abs(targetX - radius - currentX) >= 0.05 ||
      Math.abs(targetY - radius - currentY) >= 0.05;

    if (!posMoving && !scaleMoving) {
      currentX = targetX - radius;
      currentY = targetY - radius;
      circle.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0) scale(${scaleState.pos.toFixed(3)})`;
      rafId = 0;
      prevTime = 0;
      return;
    }

    circle.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0) scale(${scaleState.pos.toFixed(3)})`;
    rafId = requestAnimationFrame(render);
  };

  const startLoop = () => {
    if (!rafId) {
      prevTime = 0;
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
    scaleState.pos = 0.55;
    scaleState.vel = -0.06;
    startLoop();
  });
}
