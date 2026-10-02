/* Player-facing panels only; no outcome, path or wallet selection. */
const playerPanels = { focus: null };
function playerLabel(node, key, attribute = null) {
  if (!node) return;
  if (attribute) node.dataset.i18nAria = key;
  else node.dataset.i18n = key;
}
function setupPlayerPanels() {
  const bind = (selector, key, attr = null) => playerLabel(document.querySelector(selector), key, attr);
  for (const [id,key] of Object.entries({settingsDialog:'settings',betDialog:'bet',autoDialog:'ruleAutoTitle',historyDialog:'openHistory',nicknameDialog:'changeNickname'}))
    bind(`#${id}Title`,key);
  const settings = document.querySelector('#settingsDialog .slot-dialog-content');
  const volume = document.querySelector('.slot-volume');
  volume.firstChild.textContent = '';
  const volumeTitle = document.createElement('span'); playerLabel(volumeTitle,'volume');
  const output = document.createElement('output'); output.id='volumeValue';output.textContent='100%';
  const volumeHeading = document.createElement('span');volumeHeading.className='volume-heading';volumeHeading.append(volumeTitle,output);
  volume.prepend(volumeHeading);
  document.getElementById('masterVolume').addEventListener('input',event=>{output.value=`${event.target.value}%`;});
  const quick = document.getElementById('quickPlay').closest('label');
  playerLabel(quick.querySelector('span'),'quickPlay');
  const hint=document.createElement('p');hint.className='slot-hint';playerLabel(hint,'quickHint');
  function group(key,nodes) {
    const section=document.createElement('fieldset');section.className='settings-group';
    const legend=document.createElement('legend');playerLabel(legend,key);section.append(legend,...nodes);settings.append(section);
  }
  group('audioSection',[volume,els.menuMusicToggle.closest('label'),els.menuSoundToggle.closest('label')]);
  group('playSection',[quick,hint]);
  group('profileSection',[document.querySelector('.slot-profile-row')]);
  const rules=document.createElement('button');rules.type='button';rules.className='slot-wide';playerLabel(rules,'gameRules');
  rules.onclick=()=>openPopup(els.rulesScreen);
  group('moreSection',[els.menuLanguageButton,document.getElementById('openHistory'),document.getElementById('openRightTables'),rules]);
  bind('#openHistory','openHistory');bind('#openRightTables','openTop');
  bind('.slot-profile-row button:last-child','changeNickname');
  bind('#nicknameForm label','yourNickname');bind('#nicknameForm .slot-hint','nicknameHint');bind('#nicknameForm button','save');
  bind('#betDialog .slot-caption','betPerBall');bind('#confirmStake','done');
  document.querySelector('.pocket-experiment-note')?.remove();
  bind('.bank > span','balance');bind('.slot-total > span','totalBet');
  bind('#autoDialog .slot-caption','autoCount');bind('#autoDialog .slot-hint','autoHint');bind('#startAuto','startAuto');
  bind('#slotInfo','gameRules','aria-label');bind('#menuButton','settings','aria-label');
  bind('#autoPlayToggle','ruleAutoTitle','aria-label');bind('#betPickerButton','bet','aria-label');bind('.bet-action','launchBall','aria-label');
  bind('#masterVolume','volume','aria-label');bind('.slot-controls','controls','aria-label');
  bind('#mineCanvas','fieldLabel','aria-label');bind('#loadingSplash','loading','aria-label');
  document.querySelectorAll('.slot-close,#closeRulesButton,#closeLanguageButton,#closeAvatarButton').forEach(node=>playerLabel(node,'close','aria-label'));
  setupCurrentRules();
  for (const popup of [els.rulesScreen,els.languagePopup,els.avatarPopup,els.topUpPopup]) {
    popup.setAttribute('role','dialog');popup.setAttribute('aria-modal','true');popup.tabIndex=-1;
    popup.setAttribute('aria-labelledby',popup===els.rulesScreen?'currentRulesTitle':popup.querySelector('h2').id);
    popup.addEventListener('click',event=>{if(event.target===popup)closePopup(popup);});
    popup.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();closePopup(popup);}
      if(event.key!=='Tab')return;
      const nodes=[...popup.querySelectorAll('button,input,a,summary')].filter(n=>!n.disabled&&n.getClientRects().length);
      const first=nodes[0],last=nodes.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    });
  }
}
function setupCurrentRules() {
  const header=els.rulesScreen.querySelector('.rules-header');
  header.querySelector('.eyebrow').id='currentRulesTitle';
  const legend=document.createElement('section');legend.className='multiplier-legend';
  legend.innerHTML='<h3 data-i18n="colorsTitle"></h3>'+['green','yellow','red','purple'].map(color=>`<span class="legend-${color}" data-i18n="${color}Label"></span>`).join('');
  const body=els.rulesScreen.querySelector('.rules-body');body.prepend(legend);
  const table=document.createElement('section');table.className='rules-values';
  table.innerHTML='<h3 data-i18n="multiplierTable"></h3><div class="rules-table-scroll"><table><thead><tr><th data-i18n="lines"></th><th data-i18n="mainField"></th><th data-i18n="leftRoom"></th><th data-i18n="rightRoom"></th></tr></thead><tbody></tbody></table></div>';
  body.append(table);
  const pictures=['launch','win','balls','boost','multi','chance','lines','auto'];
  [...body.querySelectorAll('.rule-card')].forEach((card,index)=>{
    card.querySelector('.rule-art')?.remove();
    const art=document.createElement('div');art.className='current-rule-art';art.setAttribute('aria-hidden','true');
    art.innerHTML=currentRulePicture(pictures[index]);card.prepend(art);
    if(['balls','boost','multi','chance'].includes(pictures[index])){
      const button=document.createElement('button');button.type='button';button.className='rule-demo-link';playerLabel(button,'bonusDemo');
      button.onclick=()=>openBonusHelp(pictures[index]);card.append(button);
    }
  });
}
function currentRulePicture(kind) {
  const gem='<path d="M-18 -7L-9 -16H9L18 -7L0 18Z" fill="#d8a4ff" stroke="#9439d0" stroke-width="2"/><path d="M-18 -7H18L0 18M-9 -16L0 -7L9 -16" fill="none" stroke="#ffe3ff" stroke-width="1.5"/>';
  if(kind==='lines'||kind==='auto')return `<span>${kind==='lines'?'5 · 7 · 9':'1 s / 0.5 s'}</span>`;
  const color={balls:'#43ed60',multi:'#ffd53d',chance:'#ff4b4b',boost:'#ca68ff'}[kind];
  const symbol=kind==='boost'?gem:kind==='balls'||kind==='multi'||kind==='chance'
    ? `<image href="assets/duckies-${{balls:'cactus.svg',multi:'star.svg',chance:'fire.png'}[kind]}" x="-18" y="-18" width="36" height="36"/>`:'';
  return `<svg viewBox="0 0 180 124"><path d="M90 6L145 61L90 116L35 61Z" fill="#080e12" stroke="#1bb866" stroke-width="4"/><path d="M62 34L117 89M117 34L62 89M76 20L131 75M48 47L103 103M103 20L48 75M131 47L76 103" stroke="#164534" fill="none" stroke-width="1.5"/>${color?`<g transform="translate(${kind==='balls'?47:kind==='multi'?133:90},${kind==='boost'?19:kind==='chance'?103:61})"><circle r="20" fill="#0a0d10" stroke="${color}" stroke-width="4"/>${symbol}</g>`:'<text x="90" y="57" text-anchor="middle" fill="#ff4b4b" font-size="24" font-weight="900">40<tspan font-size="14">x</tspan></text>'}<circle cx="90" cy="80" r="10" fill="#fafdf9" stroke="#303935" stroke-width="2"/></svg>`;
}
function localizePlayerPanels() {
  document.querySelectorAll('[data-i18n-aria]').forEach(node=>node.setAttribute('aria-label',t(node.dataset.i18nAria)));
  const nickname=document.getElementById('nicknameInput');if(nickname?.validity.customError)nickname.setCustomValidity(t('nicknameRequired'));
  document.querySelectorAll('[data-bonus-help]').forEach(node=>node.setAttribute('aria-label',`${BONUS_HELP[node.dataset.bonusHelp].title}: ${t('bonusHelpLabel')}`));
  const rules=window.BalloroV4Rules;
  const table=document.querySelector('.rules-values tbody');
  if(table&&rules){
    table.replaceChildren(...[5,7,9].map(lines=>{
      const row=document.createElement('tr');
      const values=[lines,rules.rings[lines].map(v=>`${v}x`).join(' / '),
        `${rules.roomSideMultipliers[lines]['bottom-left'][0]}x / ${rules.roomMultipliers[lines]['bottom-left']}x`,
        `${rules.roomSideMultipliers[lines]['bottom-right'][0]}x / ${rules.roomMultipliers[lines]['bottom-right']}x`];
      values.forEach(value=>{const cell=document.createElement('td');cell.textContent=String(value);row.append(cell);});return row;
    }));
  }
  if(typeof localizeDesktopUi==='function')localizeDesktopUi();
  if(typeof refreshBonusHelpCopy==='function')refreshBonusHelpCopy();
}
function playerPopupOpened(popup,focus) {
  playerPanels.focus=focus;
  if(popup===els.rulesScreen)localizePlayerPanels();
  popup.querySelector('button,input')?.focus();
}
