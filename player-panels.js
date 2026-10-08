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
  // Rare profile edits stay out of the everyday sound/play controls.
  const profile=document.createElement('details');profile.className='settings-profile';
  profile.innerHTML='<summary data-i18n="profileSection"></summary><div class="settings-profile-content"></div>';
  profile.querySelector('div').append(document.querySelector('.slot-profile-row'),els.menuLanguageButton);
  settings.append(profile);
  const rules=document.createElement('button');rules.type='button';rules.className='slot-wide';playerLabel(rules,'gameRules');
  rules.onclick=()=>{closeSlotDialogs();openPopup(els.rulesScreen);};
  const links=document.createElement('div');links.className='settings-links';
  links.append(rules,document.getElementById('openHistory'),document.getElementById('openRightTables'));settings.append(links);
  const audioToggles=document.createElement('div');audioToggles.className='settings-audio-toggles';
  audioToggles.append(els.menuMusicToggle.closest('label'),els.menuSoundToggle.closest('label'));
  group('audioSection',[volume,audioToggles]);
  group('playSection',[quick,hint]);
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
  const body=els.rulesScreen.querySelector('.rules-body');
  const table=document.createElement('section');table.className='rules-values';
  table.innerHTML='<h3 data-i18n="multiplierTable"></h3><div class="rules-table-scroll"><table><thead><tr><th data-i18n="lines"></th><th data-i18n="mainField"></th><th data-i18n="leftRoom"></th><th data-i18n="rightRoom"></th></tr></thead><tbody></tbody></table></div>';
  const pictures=['launch','win','balls','boost','multi','chance','lines','auto'];
  const cards=[...body.querySelectorAll('.rule-card')];
  cards.forEach((card,index)=>{
    card.querySelector('.rule-art')?.remove();
    const art=document.createElement('div');art.className='current-rule-art';art.setAttribute('aria-hidden','true');
    art.innerHTML=currentRulePicture(pictures[index]);card.prepend(art);
    if(['balls','boost','multi','chance'].includes(pictures[index])){
      const button=document.createElement('button');button.type='button';button.className='rule-demo-link';playerLabel(button,'bonusDemo');
      button.onclick=()=>openBonusHelp(pictures[index]);card.append(button);
    }
  });
  const tabs=document.createElement('div');tabs.className='rules-tabs';tabs.setAttribute('role','tablist');
  const panels=['how','bonuses','payouts'].map((name,index)=>{
    const panel=document.createElement('div');panel.id=`rules-${name}`;panel.className='rules-tab-panel';
    panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',`rules-tab-${name}`);panel.hidden=index!==0;
    const button=document.createElement('button');button.type='button';button.id=`rules-tab-${name}`;
    button.setAttribute('role','tab');button.setAttribute('aria-controls',panel.id);button.setAttribute('aria-selected',String(index===0));
    button.tabIndex=index===0?0:-1;playerLabel(button,`rulesTab${index}`);
    const select=()=>{
      [...tabs.children].forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
      panels.forEach((part,i)=>part.hidden=i!==index);body.scrollTop=0;
    };
    button.onclick=select;
    button.onkeydown=event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?2:(index+(event.key==='ArrowRight'?1:2))%3;
      tabs.children[next].click();tabs.children[next].focus();
    };
    tabs.append(button);return panel;
  });
  const basics=document.createElement('div');basics.className='rules-grid rules-basics';
  basics.append(cards[0],cards[1],cards[6],cards[7]);panels[0].append(basics);
  const bonusList=document.createElement('div');bonusList.className='rules-bonus-list';
  for(const index of [3,5,4,2]){
    const card=cards[index],detail=document.createElement('details');detail.className='rules-bonus-item';
    const summary=document.createElement('summary');summary.append(card.querySelector('h3'));detail.append(summary,card);
    detail.addEventListener('toggle',()=>{if(detail.open)bonusList.querySelectorAll('details').forEach(other=>{if(other!==detail)other.open=false;});});
    bonusList.append(detail);
  }
  const bonusIntro=document.createElement('p');bonusIntro.className='slot-hint';playerLabel(bonusIntro,'rulesBonusIntro');
  panels[1].append(bonusIntro,bonusList);
  panels[2].append(legend,table,body.querySelector('.rules-about'));
  body.querySelector('.rules-grid')?.remove();body.replaceChildren(...panels);
  header.after(tabs);
}
function currentRulePicture(kind) {
  if(kind==='lines'||kind==='auto')return `<span>${kind==='lines'?'5 · 7 · 9':'▶ · ∞'}</span>`;
  return `<canvas width="560" height="480" data-rule-picture="${kind}"></canvas>`;
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
  document.querySelectorAll('[data-rule-picture]').forEach(canvas=>drawBonusHelp(canvas,canvas.dataset.rulePicture,7));
}
function playerPopupOpened(popup,focus) {
  playerPanels.focus=focus;
  if(popup===els.rulesScreen)localizePlayerPanels();
  popup.querySelector('button,input')?.focus();
}
