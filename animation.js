// Frame loop with a capped time step and throttled UI refresh.

const MAX_DT = 100;
const MAX_STEPS = 50;
const UI_INTERVAL = 100;

export function createAnimator({ isActive, rate, advance, draw }) {
  let running = false;
  let last = 0;
  let acc = 0;
  let lastUI = 0;

  function loop(ts) {
    if (!isActive()) {
      running = false;
      return;
    }
    const dt = Math.min(ts - last, MAX_DT);
    last = ts;
    acc += (dt / 1000) * rate();
    const whole = Math.floor(acc);
    acc -= whole;
    const steps = Math.min(whole, MAX_STEPS);
    if (steps > 0) {
      advance(steps);
      const showUI = !isActive() || ts - lastUI > UI_INTERVAL;
      draw(showUI);
      if (showUI) lastUI = ts;
    }
    requestAnimationFrame(loop);
  }

  return {
    reset() {
      acc = 0;
    },
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(loop);
    },
  };
}
