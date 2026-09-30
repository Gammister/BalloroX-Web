/* Local-only UI experiment. Existing controls keep their IDs and game handlers. */
let slotDialogTrigger = null;
let selectedAutoRounds = 10;
let playerNickname = null;
function getPlayerNickname() {
  if(playerNickname===null){
    try {playerNickname=localStorage.getItem('balloro-x-test-nickname');} catch {}
    if(!playerNickname){
      // Profile randomness is separate from the game's random sequence.
      const random=new Uint32Array(1);
      const limit=Math.floor(4294967296/90545)*90545;
      do {crypto.getRandomValues(random);} while(random[0]>=limit);
      playerNickname='Player'+(1+random[0]%90545);
      try {localStorage.setItem('balloro-x-test-nickname',playerNickname);} catch {}
    }
  }
  return playerNickname;
}
function closeSlotDialogs() {
  if (typeof stopBonusHelpAnimation === 'function') stopBonusHelpAnimation();
  document.querySelectorAll('.slot-dialog').forEach(node => node.classList.add('hidden'));
  slotDialogTrigger?.focus();
}
function showSlotDialog(id) {
  const trigger = document.activeElement;
  closeSlotDialogs();
  slotDialogTrigger = trigger;
  const dialog = document.getElementById(id);
  dialog.classList.remove('hidden');
  updateSlotUi();
  dialog.querySelector('button, input')?.focus();
}
function makeSlotDialog(id, title, parent = document.querySelector('.game-shell')) {
  const node = document.createElement('section');
  node.id = id;
  node.className = 'slot-dialog hidden';
  node.setAttribute('role', 'dialog');
  node.setAttribute('aria-modal', 'true');
  node.setAttribute('aria-labelledby', `${id}Title`);
  node.innerHTML = `<div class="slot-dialog-card"><header><h2 id="${id}Title">${title}</h2><button class="slot-close" type="button" aria-label="Закрыть">×</button></header><div class="slot-dialog-content"></div></div>`;
  parent.append(node);
  node.querySelector('.slot-close').onclick = closeSlotDialogs;
  node.addEventListener('click', event => { if (event.target === node) closeSlotDialogs(); });
  node.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); closeSlotDialogs(); }
    if (event.key !== 'Tab') return;
    const focusable = [...node.querySelectorAll('button:not(:disabled),input:not(:disabled)')].filter(el => el.getClientRects().length);
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  return node.querySelector('.slot-dialog-content');
}
function slotIcon(path) {
  return `<svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}
function setupSlotUi() {
  document.body.classList.add('slot-ui');
  const stage = document.querySelector('.mine-stage');
  stage.append(els.soundButton);
  const panel = document.querySelector('.bet-panel');
  const slot = els.betSlots[0];
  const settings = makeSlotDialog('settingsDialog', 'Настройки');
  const bets = makeSlotDialog('betDialog', 'Ставка', slot);
  const auto = makeSlotDialog('autoDialog', 'Автоигра');
  const history = makeSlotDialog('historyDialog', 'История раундов');
  setupBonusHelp();

  const bank = document.querySelector('.bank');
  const bankLabel = document.createElement('span'); bankLabel.textContent = 'Баланс'; bank.prepend(bankLabel);
  panel.prepend(bank);
  const total = document.createElement('div'); total.className = 'slot-total';
  total.innerHTML = '<span>Общая ставка</span><strong id="slotTotalBet"></strong>';
  panel.prepend(total);

  // The betting modal stays inside the original slot, preserving scoped game queries.
  bets.innerHTML = '<p class="slot-caption">Ставка на шар · USD</p><div id="stakeChoices" class="slot-choices stake-choices"></div>';
  bets.append(slot.querySelector('.bet-box'), slot.querySelector('.puck-count-control'), document.querySelector('.field-options'));
  const betOpen = document.createElement('button'); betOpen.id = 'betPickerButton'; betOpen.type = 'button';
  betOpen.className = 'slot-circle'; betOpen.setAttribute('aria-label', 'Выбрать ставку');
  betOpen.innerHTML = slotIcon('<ellipse cx="24" cy="13" rx="13" ry="6"/><path d="M11 13v22c0 8 26 8 26 0V13M11 23c0 8 26 8 26 0M11 30c0 8 26 8 26 0M19 20v21M29 20v21"/>');
  betOpen.onclick = () => showSlotDialog('betDialog');
  const info = document.createElement('button'); info.type = 'button'; info.className = 'slot-circle'; info.id = 'slotInfo';
  info.setAttribute('aria-label', 'Правила игры'); info.innerHTML = slotIcon('<path d="M24 22v14M19 36h10"/><circle cx="24" cy="12" r="2" fill="currentColor"/>');
  info.onclick = () => { closeSlotDialogs(); openPopup(els.rulesScreen); };
  els.menuButton.className = 'slot-circle'; els.menuButton.setAttribute('aria-label', 'Настройки');
  els.menuButton.innerHTML = slotIcon('<path d="M12 14h24M12 24h24M12 34h24"/>');
  els.autoPlayToggle.className = 'slot-circle'; els.autoPlayToggle.setAttribute('aria-label', 'Автоигра');
  els.autoPlayToggle.innerHTML = slotIcon('<path d="M14 10a17 17 0 1 1-7 15M7 12v13h12"/><path d="m21 16 12 8-12 8z"/>') + '<b id="autoRemaining"></b>';
  const controls = document.createElement('nav'); controls.className = 'slot-controls'; controls.setAttribute('aria-label', 'Управление игрой');
  // Keep the action inside the bet-slot: place the entire slot in the centre.
  controls.append(els.menuButton, els.autoPlayToggle, slot, betOpen, info);
  panel.append(controls);
  slot.querySelector('.bet-side-controls').remove();
  document.querySelector('.bet-slots').remove();
  const action = slot.querySelector('.bet-action'); action.setAttribute('aria-label', 'Запустить шары');
  action.insertAdjacentHTML('afterbegin', slotIcon('<path d="M37 17A15 15 0 0 0 11 12l-4 5M7 7v10h10M11 31a15 15 0 0 0 26 5l4-5M31 31h10v10"/>'));

  settings.innerHTML = '<label class="slot-volume">Громкость<input id="masterVolume" aria-label="Громкость" type="range" min="0" max="100" value="100"></label>';
  settings.append(els.menuMusicToggle.closest('label'), els.menuSoundToggle.closest('label'));
  settings.insertAdjacentHTML('beforeend', '<label class="menu-toggle-row"><span>Quick Play · ×3</span><input id="quickPlay" type="checkbox"><i aria-hidden="true"></i></label><button id="openHistory" class="slot-wide" type="button">◷ &nbsp; История раундов</button><button id="openRightTables" class="slot-wide" type="button">★ &nbsp; Топ дня и выигрыши</button>');
  settings.append(els.menuLanguageButton, els.menuAvatarButton);
  els.menuLanguageButton.classList.add('slot-wide'); els.menuAvatarButton.classList.add('slot-wide');
  const profileRow=document.createElement('div');profileRow.className='slot-profile-row';
  const nicknameButton=document.createElement('button');
  nicknameButton.type='button';nicknameButton.className='slot-wide';nicknameButton.textContent='Сменить ник';
  settings.append(profileRow);profileRow.append(els.menuAvatarButton,nicknameButton);
  const nicknameDialog=makeSlotDialog('nicknameDialog','Сменить ник');
  nicknameDialog.innerHTML='<form id="nicknameForm"><label for="nicknameInput">Ваш ник</label><input id="nicknameInput" type="text" maxlength="20" required autocomplete="nickname" spellcheck="false"><p class="slot-hint">От 1 до 20 символов. Ник отображается в топе дня.</p><button class="slot-start" type="submit">Сохранить</button></form>';
  const nicknameInput=nicknameDialog.querySelector('input');
  nicknameButton.onclick=()=>{
    nicknameInput.value=getPlayerNickname();nicknameInput.setCustomValidity('');
    showSlotDialog('nicknameDialog');nicknameInput.focus();nicknameInput.select();
  };
  nicknameInput.oninput=()=>nicknameInput.setCustomValidity('');
  nicknameDialog.querySelector('form').onsubmit=event=>{
    event.preventDefault();
    const value=nicknameInput.value.trim();
    if(!value){nicknameInput.setCustomValidity('Введите ник');nicknameInput.reportValidity();return;}
    playerNickname=value;
    try {localStorage.setItem('balloro-x-test-nickname',value);} catch {}
    renderPurpleLeaderboard();
    closeSlotDialogs();
  };
  document.getElementById('quickPlay').onchange = event => { state.quickPlay = event.target.checked; };
  document.getElementById('masterVolume').oninput = event => {
    state.masterVolume = Number(event.target.value) / 100;
    const audio = getAudioContext();
    if (audio) getAudioOutput(audio).gain.setTargetAtTime(state.masterVolume, audio.currentTime, .025);
  };
  document.getElementById('openHistory').onclick = () => {
    if(typeof desktopUi!=='undefined' && desktopUi.openRounds){
      closeSlotDialogs();desktopUi.openRounds();
    } else showSlotDialog('historyDialog');
  };
  document.getElementById('openRightTables').onclick = () => {
    if (typeof desktopUi !== 'undefined' && desktopUi.openTop) {
      closeSlotDialogs();
      desktopUi.openTop();
    }
  };
  history.append(els.historyPanel);
  els.historyPanel.classList.add('expanded');
  els.historyToggle.classList.add('hidden');
  auto.innerHTML = '<p class="slot-caption">Количество раундов</p><div id="autoRoundChoices" class="slot-choices auto-choices"></div>'
    + '<p class="slot-hint">Нажмите кнопку автоигры ещё раз, чтобы остановить её.</p><button id="startAuto" class="slot-start" type="button">Начать автоигру</button>';
  for (const count of [10,25,50,100,250,500,750,1000,Infinity]) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = count === Infinity ? '∞' : String(count);
    button.dataset.rounds = String(count);
    button.onclick = () => { selectedAutoRounds = count; updateSlotUi(); };
    document.getElementById('autoRoundChoices').append(button);
  }
  document.getElementById('startAuto').onclick = () => {
    state.autoRoundsRemaining = selectedAutoRounds;
    closeSlotDialogs(); setAutoPlay(true); updateSlotUi();
  };
  for (const value of BET_STEPS) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = value.toLocaleString('ru-RU'); button.dataset.stake = String(value);
    button.onclick = () => {
      if (state.running || state.launchPrepared || state.autoPlay) return;
      const betInput = slot.querySelector('.bet-value');
      betInput.value = value.toFixed(2);
      betInput.dispatchEvent(new Event('input', { bubbles: true }));
      updateBetButtons();
    };
    document.getElementById('stakeChoices').append(button);
  }
  bets.insertAdjacentHTML('beforeend', '<button class="slot-start" id="confirmStake" type="button">Готово</button>');
  if (window.BalloroPocketExperiment) {
    bets.insertAdjacentHTML('afterbegin', '<p class="slot-hint pocket-experiment-note">Тестовые правила · RTP ещё не рассчитан</p>');
  }
  document.getElementById('confirmStake').onclick = closeSlotDialogs;
  document.querySelector('.topbar').classList.add('hidden');
}
function updateSlotUi() {
  const total = document.getElementById('slotTotalBet');
  if (!total) return;
  const bet = parseBet(els.betSlots[0]);
  total.textContent = `${formatStake(bet * state.puckCount)} USD`;
  const locked = state.running || state.launchPrepared || state.autoPlay;
  document.querySelectorAll('[data-stake]').forEach(button => {
    button.disabled = locked;
    button.classList.toggle('active', Math.abs(Number(button.dataset.stake) - bet) < .0001);
  });
  document.querySelectorAll('[data-rounds]').forEach(button => button.classList.toggle('active', Number(button.dataset.rounds) === selectedAutoRounds));
  const remaining = document.getElementById('autoRemaining');
  remaining.textContent = state.autoPlay ? (Number.isFinite(state.autoRoundsRemaining) ? state.autoRoundsRemaining : '∞') : '';
  els.autoPlayToggle.classList.toggle('active', state.autoPlay);
}
