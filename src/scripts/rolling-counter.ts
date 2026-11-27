import { clamp, frameDelta, prefersReducedMotion, stepSpring } from './spring';

const PLACES = 4;
const MAX = 10 ** PLACES - 1;

interface DigitCol {
  pos: number;
  vel: number;
  target: number;
  due: number[];
  next: number[];
  colEl: HTMLSpanElement;
  stripEl: HTMLSpanElement;
}

export interface RollingCounterOptions {
  bounce?: number;
  stagger?: number;
  blur?: number;
  initial?: number;
}

export interface RollingCounterController {
  set(value: number, instant?: boolean): void;
  get(): number;
}

const instances = new WeakMap<HTMLElement, RollingCounterController>();

function parseCount(raw: unknown, fallback = 0): number {
  const num = Number(raw);
  return clamp(Math.round(Number.isFinite(num) ? num : fallback), 0, MAX);
}

function createDigitStrip(): HTMLSpanElement {
  const strip = document.createElement('span');
  strip.className = 'roll-strip';
  for (let d = 0; d <= 10; d++) {
    const cell = document.createElement('span');
    cell.textContent = String(d % 10);
    strip.appendChild(cell);
  }
  return strip;
}

/**
 * Attaches an odometer-style rolling digit counter to a numeric element.
 * Keeps screen-reader value synced in `.sr-only` and parks rAF when settled.
 */
export function initRollingCounter(
  el: HTMLElement,
  opts: RollingCounterOptions = {},
): RollingCounterController {
  const existing = instances.get(el);
  if (existing) return existing;

  const bounce = opts.bounce ?? 42;
  const stagger = opts.stagger ?? 40;
  const blur = opts.blur ?? 45;
  let currentValue = parseCount(
    opts.initial ?? el.dataset.rollValue ?? el.textContent?.trim(),
    0,
  );

  const srEl = document.createElement('span');
  srEl.className = 'sr-only';
  srEl.textContent = String(currentValue);

  const digitsWrap = document.createElement('span');
  digitsWrap.className = 'roll-digits';
  digitsWrap.setAttribute('aria-hidden', 'true');
  digitsWrap.dataset.rolling = 'false';

  const cols: DigitCol[] = new Array(PLACES);
  const shown = Math.max(1, String(currentValue).length);

  for (let p = PLACES - 1; p >= 0; p--) {
    const colEl = document.createElement('span');
    colEl.className = 'roll-col';
    colEl.dataset.on = String(p < shown);

    const stripEl = createDigitStrip();
    colEl.appendChild(stripEl);
    digitsWrap.appendChild(colEl);

    const n = Math.floor(currentValue / 10 ** p);
    cols[p] = {
      pos: n,
      vel: 0,
      target: n,
      due: [],
      next: [],
      colEl,
      stripEl,
    };
  }

  el.textContent = '';
  el.appendChild(srEl);
  el.appendChild(digitsWrap);
  el.dataset.rollValue = String(currentValue);

  let raf = 0;
  let prevTime = 0;

  const paint = (isRolling: boolean) => {
    digitsWrap.dataset.rolling = isRolling ? 'true' : 'false';
    for (let p = 0; p < PLACES; p++) {
      const c = cols[p];
      const m = ((c.pos % 10) + 10) % 10;
      c.stripEl.style.transform = `translate3d(0, ${(-m * (100 / 11)).toFixed(4)}%, 0)`;
      const smear = Math.min(2.2, Math.abs(c.vel) * 2.0) * (blur / 50);
      c.stripEl.style.filter = isRolling && smear > 0.14 ? `blur(${smear.toFixed(2)}px)` : '';
    }
  };

  const stopLoop = () => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    prevTime = 0;
  };

  const run = () => {
    if (raf) return;
    prevTime = 0;
    const tick = (t: number) => {
      const dt60 = frameDelta(t, prevTime);
      prevTime = t;
      const now = performance.now();
      let busy = false;

      for (let p = 0; p < PLACES; p++) {
        const c = cols[p];
        while (c.due.length && c.due[0] <= now) {
          c.due.shift();
          c.target = c.next.shift()!;
        }
        if (c.due.length) busy = true;

        const gap = c.target - c.pos;
        if (Math.abs(gap) > 24) {
          c.pos += Math.round((gap - Math.sign(gap) * 24) / 10) * 10;
        }

        if (stepSpring(c, c.target, dt60, bounce, 0.004)) {
          busy = true;
        }
      }

      paint(busy);
      if (busy) {
        raf = requestAnimationFrame(tick);
      } else {
        stopLoop();
      }
    };
    raf = requestAnimationFrame(tick);
  };

  const set = (nextVal: number, instant = false) => {
    const v = parseCount(nextVal, currentValue);
    const allSettledAtV =
      !raf &&
      v === currentValue &&
      cols.every((c, p) => c.target === Math.floor(v / 10 ** p) && c.due.length === 0);
    if (allSettledAtV) return;

    currentValue = v;
    srEl.textContent = String(v);
    el.dataset.rollValue = String(v);

    const nextShown = Math.max(1, String(v).length);
    const now = performance.now();
    const still = instant || prefersReducedMotion();

    for (let p = 0; p < PLACES; p++) {
      const c = cols[p];
      c.colEl.dataset.on = String(p < nextShown);
      const to = Math.floor(v / 10 ** p);
      if (still) {
        c.pos = to;
        c.target = to;
        c.vel = 0;
        c.due = [];
        c.next = [];
      } else {
        c.due = [now + p * stagger];
        c.next = [to];
      }
    }

    if (still) {
      stopLoop();
      paint(false);
    } else {
      run();
    }
  };

  paint(false);

  const controller: RollingCounterController = {
    set,
    get: () => currentValue,
  };
  instances.set(el, controller);
  return controller;
}

export function setRollingCounter(el: HTMLElement | null, value: number): void {
  if (!el) return;
  const ctrl = initRollingCounter(el);
  ctrl.set(value);
}

/** Rolls Hero metric counters from 0 to their SSR value on load unless reduced-motion is active. */
export function initRollingMetrics(selector = '[data-roll-metric]'): void {
  const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
  if (els.length === 0 || prefersReducedMotion()) return;

  els.forEach((el, idx) => {
    const raw = el.dataset.rollValue ?? el.textContent?.trim();
    const num = Number(raw);
    if (!Number.isFinite(num) || num <= 0) return;

    const target = parseCount(num, 0);
    const ctrl = initRollingCounter(el, {
      initial: 0,
      bounce: 36,
      stagger: 45,
      blur: 40,
    });
    window.setTimeout(() => {
      ctrl.set(target);
    }, 80 + idx * 70);
  });
}
