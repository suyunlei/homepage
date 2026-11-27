export interface SpringState {
  pos: number;
  vel: number;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

/** Frame delta normalized to 60fps units (capped at 2.5 frames across tab switches). */
export function frameDelta(now: number, prev: number): number {
  return prev ? clamp((now - prev) / 16.67, 0, 2.5) : 1;
}

/** Frame-rate-independent exponential damping matched to a 60fps factor. */
export function damp(current: number, target: number, factorAt60fps: number, dt60: number): number {
  return current + (target - current) * (1 - Math.pow(1 - factorAt60fps, dt60));
}

/**
 * Calibrated damping-ratio spring parameters from Bencho (0..100 tune).
 * 0 -> heavy (~0.85 zeta), 50 -> balanced (~0.41 zeta), 100 -> lively (~0.20 zeta).
 */
export function springOf(tune = 50): { k: number; d: number } {
  const t = clamp(tune, 0, 100) / 100;
  return {
    k: 0.08 + t * 0.16,
    d: 0.62 + t * 0.2,
  };
}

/** Advances one spring state toward target; returns true while still moving. */
export function stepSpring(
  state: SpringState,
  target: number,
  dt60: number,
  tune = 50,
  eps = 0.02,
): boolean {
  const { k, d } = springOf(tune);
  state.vel += (target - state.pos) * k * dt60;
  state.vel *= Math.pow(d, dt60);
  state.pos += state.vel * dt60;
  if (Math.abs(target - state.pos) < eps && Math.abs(state.vel) < eps) {
    state.pos = target;
    state.vel = 0;
    return false;
  }
  return true;
}
