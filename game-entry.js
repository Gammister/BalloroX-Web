/* Loading completion is not consent to play. This gate never places a bet. */
(() => {
  const splash = document.getElementById('loadingSplash');
  const button = document.getElementById('splashPlayButton');
  const track = document.getElementById('splashLoadingTrack');
  const status = document.getElementById('splashLoadStatus');
  const shell = document.querySelector('.game-shell');
  const actions = splash.querySelector('.splash-actions');
  const control = splash.querySelector('.splash-control');
  let loaded = false, entered = false;
  let layoutFrame = null;
  const listeners = new Set();
  function alignSplashControls() {
    if (entered) return;
    // The inert game keeps its layout while loading. Use its real Spin centre,
    // rather than a viewport-specific bottom offset, for mouse and touch alike.
    const spin = shell.querySelector('.bet-action')?.getBoundingClientRect();
    if (!spin?.width || !spin.height) return;
    const top = spin.y + spin.height / 2 - control.offsetTop - control.offsetHeight / 2;
    actions.style.bottom = 'auto';
    actions.style.top = `${top}px`;
    actions.style.left = `${spin.x + spin.width / 2}px`;
    actions.style.transform = 'translateX(-50%)';
    splash.style.setProperty('--splash-actions-clearance', `${Math.max(0, splash.clientHeight - top + 24)}px`);
  }
  function scheduleSplashLayout() {
    if (entered || layoutFrame !== null) return;
    layoutFrame = requestAnimationFrame(() => { layoutFrame = null; alignSplashControls(); });
  }
  const layoutObserver = new ResizeObserver(scheduleSplashLayout);
  layoutObserver.observe(shell);
  window.addEventListener('resize', scheduleSplashLayout);
  window.visualViewport?.addEventListener('resize', scheduleSplashLayout);
  window.BalloroGameEntry = {
    get blocked() { return !entered; },
    progress(fraction) {
      if (loaded || entered) return;
      const percent = Math.round(Math.max(0, Math.min(1, fraction)) * 100);
      track.setAttribute('aria-valuenow', String(percent));
      track.firstElementChild.style.width = `${percent}%`;
    },
    ready() {
      if (loaded || entered) return;
      this.progress(1);
      loaded = true;
      document.documentElement.classList.add('game-loaded');
      track.hidden = true;
      button.hidden = false;
      button.disabled = false;
      status.textContent = 'Ready to play';
      alignSplashControls();
      scheduleSplashLayout();
      if (document.hasFocus() && (document.activeElement === document.body
        || splash.contains(document.activeElement))) button.focus({ preventScroll: true });
    },
    fail() {
      if (loaded || entered) return;
      track.hidden = true;
      status.className = 'splash-error';
      status.textContent = 'Could not load the game. Please refresh to try again.';
    },
    onPlay(listener) { listeners.add(listener); }
  };
  button.addEventListener('click', () => {
    if (!loaded || entered || document.hidden || window.BalloroGameLifecycle?.suspended) return;
    entered = true;
    layoutObserver.disconnect();
    window.removeEventListener('resize', scheduleSplashLayout);
    window.visualViewport?.removeEventListener('resize', scheduleSplashLayout);
    if (layoutFrame !== null) cancelAnimationFrame(layoutFrame);
    button.disabled = true;
    shell.inert = false;
    shell.removeAttribute('aria-hidden');
    document.documentElement.classList.add('game-ready');
    for (const listener of listeners) listener();
    // Move focus out of the fading dialog without firing a wager action.
    document.getElementById('menuButton')?.focus({ preventScroll: true });
    window.setTimeout(() => splash.remove(), 300);
  });
})();
