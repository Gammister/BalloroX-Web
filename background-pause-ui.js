/* Visible lifecycle pause only; independent of paid results and photo holds. */
(() => {
  const lifecycle = window.BalloroGameLifecycle;
  if (!lifecycle) return;
  const overlay = document.createElement('button');
  overlay.id = 'backgroundPauseOverlay';
  overlay.type = 'button';
  overlay.className = 'background-pause-overlay';
  overlay.hidden = true;
  const title = document.createElement('strong');
  title.dataset.i18n = 'backgroundPauseTitle';
  overlay.append(title);
  document.body.append(overlay);
  const sync = () => {
    const visible = lifecycle.suspended && !document.hidden;
    overlay.hidden = !visible;
    overlay.disabled = !lifecycle.canResume;
    overlay.tabIndex = lifecycle.canResume ? 0 : -1;
    title.textContent = t('backgroundPauseTitle');
  };
  lifecycle.subscribe(sync);
  for (const event of ['visibilitychange', 'freeze', 'resume']) document.addEventListener(event, sync);
  for (const event of ['blur', 'focus', 'pagehide', 'pageshow']) window.addEventListener(event, sync);
  sync();
})();
