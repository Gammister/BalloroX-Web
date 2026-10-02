/* Visual-only clock: 5 Hz at pickup, easing to 1.5 Hz over 2.5 seconds. */
(() => {
  const clocks = new WeakMap();
  let nextId = 0;
  function sample(owner, ready, now, fast = false) {
    if (!ready) { clocks.delete(owner); return { alpha: 1, ready: false }; }
    let clock = clocks.get(owner);
    if (!clock) { clock = { start: now, id: ++nextId }; clocks.set(owner, clock); }
    const t = Math.max(0, (now - clock.start) / 1000);
    // Integrate the falling frequency so the phase never jumps backwards.
    const ramp = Math.min(t, 2.5);
    const cycles = fast ? 5 * t
      : 5 * ramp - 0.7 * ramp * ramp + Math.max(0, t - 2.5) * 1.5;
    const step = Math.floor(cycles);
    return { ready: true, alpha: cycles - step < 0.5 ? 1 : 0, soundKey: `${clock.id}:${step}` };
  }
  window.BalloroReadyBlink = { sample };
})();
