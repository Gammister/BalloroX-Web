/* Isolated UI/presentation adapter. Settings are not part of the math model. */
let playControls = null;
const playPreferences = { pauseBigWin: false };
let playControlsWatch = null;
let pausedSpinAnimation = null;
const SPIN_ARROW_HOLD_CONFIRM_MS = 350;
const resumedWinPresentation = new Map();
function getResumedWinAlpha(puck, ball = false, now = (window.BalloroGameLifecycle?.now() ?? performance.now())) {
  const releasedAt = resumedWinPresentation.get(puck);
  if (releasedAt === undefined) return null;
  const multiplier = puck.result.multiplier * (puck.result.x10Boosted ? 10 : 1);
  const duration = ball ? window.BalloroV3Rules.resultFadeMs / 4
    : window.BalloroV3Rules.resultFadeMs * (0.9 + 0.13 * Math.log2(1 + multiplier));
  return Math.max(0, 1 - (now - releasedAt) / duration);
}
function freezeSpinArrowPosition() {
  const svg = els.betSlots[0]?.querySelector('.bet-action > svg');
  if (!svg || pausedSpinAnimation) return;
  const animation = svg.getAnimations()[0];
  const duration = Number.parseFloat(getComputedStyle(svg).animationDuration) * 1000;
  if (!animation || !duration) return;
  pausedSpinAnimation = { svg, fraction: (Number(animation.currentTime) % duration) / duration };
  // Retain the old duration while the held/autoplay classes are removed.
  svg.style.animationDuration = `${duration}ms`;
  svg.style.animationPlayState = 'paused';
}
function resumeSpinArrowPosition() {
  if (!pausedSpinAnimation) return;
  const { svg, fraction } = pausedSpinAnimation;
  svg.style.removeProperty('animation-duration');
  svg.style.removeProperty('animation-play-state');
  const animation = svg.getAnimations()[0];
  const duration = Number.parseFloat(getComputedStyle(svg).animationDuration) * 1000;
  if (animation && duration) animation.currentTime = fraction * duration;
  pausedSpinAnimation = null;
}
function syncSpinArrowSpeed() {
  if (pausedSpinAnimation) return;
  const duration = state.v3HoldFast || state.autoPlay ? 800 : 2400;
  for (const slot of els.betSlots) {
    const svg = slot.querySelector('.bet-action > svg');
    if (!svg || svg.style.animationDuration === `${duration}ms`) continue;
    const animation = svg.getAnimations()[0];
    const previousDuration = animation?.effect.getComputedTiming().duration;
    const elapsed = Number(animation?.currentTime);
    svg.style.animationDuration = `${duration}ms`;
    // Changing a CSS duration otherwise reinterprets the elapsed time and
    // jumps the arrows to a different angle, even when already paused.
    const updated = svg.getAnimations()[0];
    if (updated && previousDuration > 0 && Number.isFinite(elapsed)) {
      updated.currentTime = elapsed / previousDuration * duration;
    }
  }
}
function savePlayPreferences() {
  try { localStorage.setItem('balloro-x-play-controls', JSON.stringify(playPreferences)); } catch (_) { /* private browsing */ }
}
function syncPauseBigWinToggles() {
  for (const id of ['pauseBigWin', 'autoPauseBigWin']) {
    const input = document.getElementById(id);
    if (input) input.checked = playPreferences.pauseBigWin;
  }
}
function setPauseBigWinPreference(enabled) {
  playPreferences.pauseBigWin = enabled;
  savePlayPreferences();
  syncPauseBigWinToggles();
  // Disabling a photo hold does not authorize automatic paid launches.
  if (!enabled && playControls.pause.active) {
    stopControlledAuto('user');
    releaseBigWinPresentation();
  }
  updateBetButtons();
  render();
  if (playControls.pause.active) startResultRevealAnimation();
}
function stopHeldPaidLaunches() {
  if (state.v3HoldTimer) clearTimeout(state.v3HoldTimer);
  if (state.v3HoldSpeedTimer) clearTimeout(state.v3HoldSpeedTimer);
  state.v3HoldTimer = null;
  state.v3HoldSpeedTimer = null;
  state.v3HoldFast = false;
}
function startV3HeldLaunch(slot, { afterResume = false } = {}) {
  if (window.BalloroGameLifecycle?.suspended) return;
  stopHeldPaidLaunches();
  playControls?.press();
  const repeat = () => {
    if (window.BalloroGameLifecycle?.suspended) { stopHeldPaidLaunches(); return; }
    if (!state.v3HoldTimer || playControls?.pause.active) return;
    if (!isV3BonusLaunchBlocked()) {
      if (!requirePaidLaunchBalance(parseBet(slot))) return;
      if (canPrimeLaunch(slot)) launchV3Pucks(slot);
    }
    if (!state.v3HoldTimer || playControls?.pause.active) { stopHeldPaidLaunches(); return; }
    const delay = isV3BonusLaunchBlocked() || !canPrimeLaunch(slot) ? 50
      : Math.max(1, state.v3LastLaunchAt + getV3LaunchIntervalMs() - (window.BalloroGameLifecycle?.now() ?? performance.now()));
    state.v3HoldTimer = setTimeout(repeat, delay);
  };
  state.v3HoldTimer = setTimeout(repeat, afterResume ? getV3LaunchIntervalMs()
    : Math.max(1, state.v3LastLaunchAt + getV3LaunchIntervalMs() - (window.BalloroGameLifecycle?.now() ?? performance.now())));
  // Pressed artwork is immediate, but a tap never uses the fast hold speed.
  // This timer is visual-only: paid-shot scheduling retains its own cadence.
  state.v3HoldSpeedTimer = setTimeout(() => {
    state.v3HoldSpeedTimer = null;
    if (!state.v3HoldTimer || playControls?.pause.active) return;
    state.v3HoldFast = true;
    updateBetButtons();
  }, SPIN_ARROW_HOLD_CONFIRM_MS);
  updateBetButtons();
}
function stopControlledAuto(reason = 'user') {
  const releaseWin = reason === 'user' && state.autoPlay && playControls?.pause.active;
  playControls?.stop(reason);
  setAutoPlay(false);
  if (releaseWin) releaseBigWinPresentation();
  updateBetButtons();
}
function setupPlayControls() {
  try {
    const saved = JSON.parse(localStorage.getItem('balloro-x-play-controls') || '{}');
    playPreferences.pauseBigWin = saved.pauseBigWin === true;
  } catch (_) { /* defaults */ }
  playControls = BalloroPlayControls.create({
    onChange: () => updatePlayControlsUi(),
    onPause: () => {
      freezeSpinArrowPosition();
      stopHeldPaidLaunches();
      if (state.autoPlayTimer) clearTimeout(state.autoPlayTimer);
      state.autoPlayTimer = null;
    },
    onStop: () => {
      stopHeldPaidLaunches();
      setAutoPlay(false);
      if (playControlsWatch) clearInterval(playControlsWatch);
      playControlsWatch = null;
    }
  });
  const label = (id, key) => `<label class="menu-toggle-row"><span data-i18n="${key}"></span><input id="${id}" type="checkbox"><i aria-hidden="true"></i></label>`;
  const game = document.getElementById('quickPlay').closest('fieldset');
  game.insertAdjacentHTML('beforeend', label('pauseBigWin', 'pauseBigWin')
    + '<p class="slot-hint" data-i18n="pauseBigWinHint"></p>');
  const auto = document.querySelector('#autoDialog .slot-dialog-content');
  const start = document.getElementById('startAuto');
  const form = document.createElement('form');
  form.id = 'autoLimitsForm';
  form.className = 'auto-limits';
  form.innerHTML = '<details class="auto-limit-options"><summary data-i18n="autoStops"></summary><fieldset class="settings-group"><legend class="sr-only" data-i18n="autoStops"></legend>'
    + [['loss', 'autoLoss', 'USD'], ['profit', 'autoProfit', 'USD'], ['win', 'autoWin', 'x'], ['minutes', 'autoTime', 'min']].map(([key, text, unit]) =>
      `<div class="auto-limit-row"><label id="auto-${key}-caption" class="auto-limit-name" for="auto-${key}-enabled" data-i18n="${text}"></label><label class="auto-limit-value is-off" for="auto-${key}" aria-hidden="true"><input id="auto-${key}" aria-labelledby="auto-${key}-caption" type="number" inputmode="decimal" min="${key === 'minutes' ? 1 : '.01'}" step="${key === 'minutes' ? 1 : '.01'}"><b>${unit}</b></label><label class="menu-toggle-row auto-limit-toggle"><input id="auto-${key}-enabled" aria-labelledby="auto-${key}-caption" type="checkbox"><i aria-hidden="true"></i></label></div>`).join('')
    + label('auto-bonus-enabled', 'autoBonus') + '</fieldset>'
    + '<p class="slot-hint" data-i18n="autoLimitsHint"></p></details>'
    + label('autoPauseBigWin', 'pauseBigWin')
    + '<p id="autoSessionStatus" class="slot-hint" role="status"></p>';
  auto.prepend(form);
  // Keep frequent count/start actions outside the scrolling conditions area.
  const footer=document.createElement('div');footer.className='auto-play-footer';
  footer.append(auto.querySelector('.slot-caption'),document.getElementById('autoRoundChoices'),start);
  auto.closest('.slot-dialog-card').append(footer);
  for (const id of ['pauseBigWin', 'autoPauseBigWin']) {
    const input = document.getElementById(id);
    input.onchange = () => setPauseBigWinPreference(input.checked);
  }
  syncPauseBigWinToggles();
  start.setAttribute('form', 'autoLimitsForm');
  start.type = 'submit';
  start.onclick = null;
  // Native validation must be able to reveal/focus a required value even when
  // the optional rules accordion was closed before pressing Start.
  form.addEventListener('invalid',()=>{form.querySelector('.auto-limit-options').open=true;},true);
  form.onsubmit = event => {
    event.preventDefault();
    const limits = {};
    for (const key of ['loss', 'profit', 'win', 'minutes']) {
      const input = document.getElementById(`auto-${key}`);
      if (document.getElementById(`auto-${key}-enabled`).checked) {
        if (!input.reportValidity()) return;
        limits[key] = Number(input.value);
      }
    }
    limits.bonus = document.getElementById('auto-bonus-enabled').checked;
    if (playControls.pause.active || !BalloroPlayControls.policy.autoplay) return;
    playControls.start(selectedAutoRounds, limits);
    state.autoRoundsRemaining = selectedAutoRounds;
    closeSlotDialogs();
    setAutoPlay(true);
    if (playControlsWatch) clearInterval(playControlsWatch);
    playControlsWatch = setInterval(() => {
      playControls.check();
      if (!playControls.session?.active) { clearInterval(playControlsWatch); playControlsWatch = null; }
    }, 250);
    updateBetButtons();
  };
  for (const key of ['loss', 'profit', 'win', 'minutes']) {
    const check = document.getElementById(`auto-${key}-enabled`), input = document.getElementById(`auto-${key}`);
    check.onchange = () => {
      input.required = check.checked;
      input.disabled = !check.checked;
      input.closest('label').classList.toggle('is-off', !check.checked);
      input.closest('label').setAttribute('aria-hidden', String(!check.checked));
      if (check.checked) input.focus();
    };
    input.disabled = true;
  }
  const policy = BalloroPlayControls.policy;
  document.querySelectorAll('[data-rounds]').forEach(button => {
    const count = Number(button.dataset.rounds);
    if (count === Infinity ? !policy.infiniteAutoplay : count > policy.maxAutoCount) button.remove();
  });
  if (!document.querySelector('[data-rounds]')) {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.rounds = String(policy.maxAutoCount); button.textContent = String(policy.maxAutoCount);
    button.onclick = () => { selectedAutoRounds = policy.maxAutoCount; updateSlotUi(); };
    document.getElementById('autoRoundChoices').append(button);
  }
  selectedAutoRounds = Number(document.querySelector('[data-rounds]')?.dataset.rounds) || 1;
  if (policy.requireLossLimit) {
    const input = document.getElementById('auto-loss-enabled');
    form.querySelector('.auto-limit-options').open = true;
    input.checked = true; input.onchange(); input.disabled = true;
  }
  document.getElementById('quickPlay').disabled = !policy.quickPlay;
  if (!policy.quickPlay) state.quickPlay = false;
  const status = document.createElement('button');
  status.id = 'playControlStatus'; status.type = 'button'; status.className = 'play-control-status hidden';
  status.setAttribute('aria-live', 'polite');
  status.onclick = () => {
    if (playControls.pause.active) tryResumeBigWin();
    else if (!state.lineMaximumNotice) showSlotDialog('autoDialog');
  };
  els.roundWinLabel.parentElement.append(status);
  const release = () => { stopHeldPaidLaunches(); playControls.release(); updateBetButtons(); };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  window.BalloroGameLifecycle?.setResizeActivityCheck(() => Boolean(
    state.autoPlay || state.running || state.launchPrepared || state.v3HoldTimer
    || state.v3Shots.size || state.v3BonusLock || window.BalloroRoundTapes?.busy));
  window.BalloroGameLifecycle?.subscribe(setBackgroundPlaySuspended);
  updatePlayControlsUi();
}
let backgroundAudioWasRunning = false, backgroundMusicWasPlaying = false;
function setBackgroundPlaySuspended(suspended) {
  if (suspended) {
    stopHeldPaidLaunches();
    playControls?.release();
    // Suspend scheduling, not the session: counts, limits and committed shots
    // must survive a tab/app switch. Explicit Stop and real limits still end it.
    if (state.autoPlayTimer) clearTimeout(state.autoPlayTimer);
    state.autoPlayTimer = null;
    for (const key of ['physicsFrame', 'counterFlyInFrame', 'resultRevealFrame', 'collectibleIdleFrame', 'launchPrimeFrame', 'starEffectFrame']) {
      if (state[key] !== null) cancelAnimationFrame(state[key]);
      state[key] = null;
    }
    state.physicsFrameRoundId = null;
    if (v3FieldTransitionFrame !== null) cancelAnimationFrame(v3FieldTransitionFrame);
    v3FieldTransitionFrame = null;
    if (state.v3CooldownTimer) clearTimeout(state.v3CooldownTimer);
    state.v3CooldownTimer = null;
    backgroundAudioWasRunning = state.audioContext?.state === 'running';
    backgroundMusicWasPlaying = Boolean(state.backgroundMusic && !state.backgroundMusic.paused);
    stopBackgroundMusic();
    if (backgroundAudioWasRunning) state.audioContext.suspend().catch(() => {});
    updateBetButtons();
    return;
  }
  // Resume paid work on the frozen clock, then the same autoplay session.
  // Never revive a stopped session or the previous manual held contact.
  state.lastFrameAt = window.BalloroGameLifecycle.now();
  if (backgroundAudioWasRunning) state.audioContext?.resume().catch(() => {});
  if (backgroundMusicWasPlaying && state.musicEnabled) startBackgroundMusic();
  backgroundAudioWasRunning = backgroundMusicWasPlaying = false;
  if (state.counterFlyIns.length && state.counterFlyInFrame === null) {
    state.counterFlyInFrame = requestAnimationFrame(animateCounterFlyIns);
  }
  if (state.animationsEnabled && state.starBursts.length && state.starEffectFrame === null) {
    state.starEffectFrame = requestAnimationFrame(animateStarBursts);
  }
  if (state.running) scheduleGameTick(state.roundId);
  else { startResultRevealAnimation(); startCollectibleIdleAnimation(); }
  const cooldown = state.v3LastLaunchAt + getV3LaunchIntervalMs() - window.BalloroGameLifecycle.now();
  if (cooldown > 0) state.v3CooldownTimer = setTimeout(() => {
    state.v3CooldownTimer = null; updateBetButtons();
  }, cooldown);
  if (state.autoPlay) scheduleNextAutoPlayRound();
  updateBetButtons();
  render();
}
function isBigWinHeld(puck) { return Boolean(playControls?.pause.active && playControls.pause.winners.has(puck)); }
function getPresentationPucks() {
  for (const puck of resumedWinPresentation.keys()) {
    if (getResumedWinAlpha(puck) <= 0) resumedWinPresentation.delete(puck);
  }
  return [...new Set([...state.pucks, ...(playControls?.pause.active ? playControls.pause.winners : []), ...resumedWinPresentation.keys()])];
}
function releaseBigWinPresentation() {
  if (!playControls?.pause.active) return false;
  const winners = [...playControls.pause.winners];
  playControls.release();
  if (!playControls.resume()) return false;
  for (const puck of winners) resumedWinPresentation.set(puck, (window.BalloroGameLifecycle?.now() ?? performance.now()));
  updateBetButtons(); render(); startResultRevealAnimation();
  return true;
}
function tryResumeBigWin() {
  if (window.BalloroGameLifecycle?.suspended) return false;
  if (!playControls?.pause.active || playControls.pause.mustRelease
    || isV3BonusLaunchBlocked({ presentationOnly: true }) || state.v3Shots.size) return false;
  if (!releaseBigWinPresentation()) return false;
  // Resume autoplay on this press, not after another full shot interval.
  // The regular launch gate still enforces cadence, balance and session limits.
  if (state.autoPlay) runAutoPlayTick();
  return true; // Manual confirmation only dismisses the presentation.
}
function updatePlayControlsUi() {
  if (!playControls) return;
  const paused = playControls.pause.active;
  const ready = paused && !playControls.pause.mustRelease && !isV3BonusLaunchBlocked({ presentationOnly: true }) && !state.v3Shots.size;
  const session = playControls.session;
  const reason = session?.reason;
  // Release advice belongs only to a real held contact in manual play.
  const waitingKey = !state.autoPlay && playControls.pause.mustRelease
    ? 'winPauseWaiting' : 'winPauseFinishing';
  const lineMax = state.lineMaximumNotice && window.BalloroSavedPaths?.has(state.lineMaximumNotice)
    ? window.BalloroSavedPaths.mathModel(state.lineMaximumNotice)?.maximum?.total : null;
  const maxNotice = lineMax ? t('maximumWinNotice').replace('{value}',
    lineMax.toLocaleString(LOCALES[state.language] || 'en-US')) : '';
  const message = paused ? t(ready ? 'winPauseReady' : waitingKey)
    : maxNotice || (reason ? `${t('autoStopped')}: ${t(`autoStop_${reason}`)}` : '');
  const badge = document.getElementById('playControlStatus');
  if (badge) {
    const maximumNotice = Boolean(maxNotice && !paused);
    if (badge.textContent !== message || badge.classList.contains('is-maximum-notice') !== maximumNotice) {
      if (maximumNotice) {
        const parts = t('maximumWinNotice').split('{value}x');
        const value = document.createElement('span');
        value.className = 'maximum-win-value';
        value.textContent = `${lineMax.toLocaleString(LOCALES[state.language] || 'en-US')}x`;
        badge.replaceChildren(document.createTextNode(parts[0]), value, document.createTextNode(parts[1] || ''));
      } else badge.textContent = message;
    }
    badge.classList.toggle('is-maximum-notice', maximumNotice);
    badge.classList.toggle('hidden', !message);
    badge.disabled = paused && !ready;
  }
  syncPauseBigWinToggles();
  const summary = document.getElementById('autoSessionStatus');
  if (summary) {
    const total = playControls.totals();
    summary.textContent = session ? `${t('sessionNet')}: ${total.net.toFixed(2)} USD · ${t('sessionPending')}: ${total.pending.toFixed(2)} USD` : '';
  }
  const start = document.getElementById('startAuto');
  if (start) start.disabled = paused || !BalloroPlayControls.policy.autoplay;
  if (els.autoPlayToggle) {
    els.autoPlayToggle.disabled = !BalloroPlayControls.policy.autoplay;
    els.autoPlayToggle.setAttribute('aria-label', t(state.autoPlay ? 'stopAuto' : 'ruleAutoTitle'));
  }
  positionPlayControlStatus();
  fitSpinContinueLabel();
}

function positionPlayControlStatus() {
  const badge = document.getElementById('playControlStatus');
  if (!badge || !els.roundWinLabel) return;
  const style = getComputedStyle(els.roundWinLabel);
  const bottom = (Number.parseFloat(style.bottom) || 0)
    + (Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) || 25) + 8;
  const value = `${bottom}px`;
  if (badge.style.bottom !== value) badge.style.bottom = value;
}

function fitSpinContinueLabel() {
  for (const slot of els.betSlots) {
    const button = slot.querySelector('.bet-action');
    const label = button.querySelector('small');
    if (!button.classList.contains('is-win-paused')) {
      label.style.removeProperty('font-size');
      delete label.dataset.fitKey;
      continue;
    }
    const width = button.clientWidth, height = button.clientHeight;
    const key = `${width}/${height}/${label.textContent}`;
    if (label.dataset.fitKey === key || !width) continue;
    // Measure the actual rendered font, including native optical sizing. Cache
    // the result so this small binary fit runs only on pause/locale/size changes.
    let lower = 8, upper = Math.max(8, Math.floor(height * .45));
    while (lower < upper) {
      const size = Math.ceil((lower + upper) / 2);
      label.style.fontSize = `${size}px`;
      if (label.scrollWidth <= label.clientWidth && label.scrollHeight <= height * .62) lower = size;
      else upper = size - 1;
    }
    label.style.fontSize = `${lower}px`;
    label.dataset.fitKey = key;
  }
}
