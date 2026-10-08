/* Presentation/playback clock only. Never changes outcomes, RNG or wagers. */
(() => {
  let pausedAt = null, excludedTime = 0;
  let pageInactive = false, frozen = false, blurred = false;
  let resizePause = false, resizeActivity = () => false;
  const listeners = new Set();
  const emit = suspended => { for (const listener of listeners) listener(suspended); };
  const suspend = () => {
    if (pausedAt !== null) return;
    pausedAt = performance.now();
    emit(true);
  };
  const resume = () => {
    if (document.hidden || pageInactive || frozen || blurred || resizePause || pausedAt === null) return;
    excludedTime += Math.max(0, performance.now() - pausedAt);
    pausedAt = null;
    emit(false);
  };
  const sync = () => document.hidden || pageInactive || frozen || blurred || resizePause ? suspend() : resume();
  const pauseForResize = () => {
    if (!resizePause && !resizeActivity()) return false;
    resizePause = true;
    suspend();
    return true;
  };
  const hasFocus = () => document.hasFocus?.() === true;
  const resumeFromInteraction = () => {
    // A visible tap can repair a missed focus event, never a hidden/frozen page.
    // This resumes the existing clock/session, not the separate big-win hold.
    if (document.hidden || pageInactive || frozen || pausedAt === null) return false;
    blurred = false;
    resizePause = false;
    sync();
    return true;
  };
  window.BalloroGameLifecycle = {
    get suspended() { return pausedAt !== null || document.hidden; },
    get canResume() { return pausedAt !== null && !document.hidden && !pageInactive && !frozen; },
    get resizePaused() { return resizePause; },
    setResizeActivityCheck(check) { resizeActivity = check; },
    pauseForResize,
    now: () => (pausedAt === null ? performance.now() : pausedAt) - excludedTime,
    resumeFromInteraction,
    subscribe(listener) { listeners.add(listener); if (this.suspended) listener(true); }
  };
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) blurred = false;
    sync();
  });
  window.addEventListener('pagehide', () => { pageInactive = true; sync(); });
  window.addEventListener('pageshow', () => { pageInactive = false; blurred = false; sync(); });
  document.addEventListener('freeze', () => { frozen = true; sync(); });
  document.addEventListener('resume', () => { frozen = false; blurred = false; sync(); });
  // Fallback for OS/window focus loss. The play layer pauses timers and keeps
  // existing autoplay intent; the frozen clock prevents catch-up launches.
  window.addEventListener('blur', () => {
    // A stale/embedded-window blur is not evidence of inactivity if the
    // document is still focused. Do not pause a visible, active game.
    if (!document.hidden && hasFocus()) { blurred = false; sync(); return; }
    blurred = true; sync();
  });
  window.addEventListener('focus', () => { blurred = false; sync(); });
  document.addEventListener('focusin', () => { if (hasFocus()) { blurred = false; sync(); } });
  // First resize suspends before the game's layout handler. Focus/visibility
  // oscillation during a window drag cannot resume wagers; only a new contact.
  window.addEventListener('resize', pauseForResize);
  window.addEventListener('orientationchange', pauseForResize);
  const consumeResume = event => {
    if (!event.isTrusted || !window.BalloroGameLifecycle.canResume) return;
    event.preventDefault(); event.stopImmediatePropagation();
    resumeFromInteraction();
  };
  // The recovery contact confirms only. Never let it also place a paid bet,
  // change a setting, or confirm a big-win photo pause underneath the overlay.
  document.addEventListener('click', consumeResume, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') consumeResume(event);
  }, true);
  if (document.hidden) suspend();
})();
