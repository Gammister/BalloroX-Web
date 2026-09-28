/* Reversible desktop-only presentation. Never uses the gameplay RNG or changes payouts. */
const desktopUi = {enabled:false, rounds:[], visibleRounds:20, demo:[], seed:0x729ab3f1};
function loadMoreDesktopRounds() {
  desktopUi.visibleRounds=Math.min(desktopUi.rounds.length,desktopUi.visibleRounds+20);
  renderDesktopRounds();
}
function desktopCounterCascade(sizes, {cx,cy,radius,leftLimit}) {
  for(let scale=1.12;scale>=.59;scale-=.01) {
    const gap=10;
    const heights=sizes.map(size=>size.height*scale);
    const middleHeight=Math.max(heights[1],heights[2]);
    const bottom=cy-radius-18;
    const top=bottom-heights[3]-middleHeight-heights[0]-gap*2;
    const middle=top+heights[0]+gap;
    const positions=[
      {x:cx-sizes[0].width*scale/2,y:top,scale},
      {x:cx+gap/2,y:middle,scale},
      {x:cx-gap/2-sizes[2].width*scale,y:middle,scale},
      {x:cx-sizes[3].width*scale/2,y:middle+middleHeight+gap,scale}
    ];
    if(top>=78 && positions.every(p=>p.x>=leftLimit))return positions;
  }
  return null; // Very short/narrow desktop: retain the compact vertical layout.
}
function desktopMoney(value, signed=false) {
  return `${signed && value>0 ? '+' : ''}${value.toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
}
function desktopRoundRecord({id, timestamp, balls, stake, payout}) {
  if (!desktopUi.enabled || desktopUi.rounds.some(row=>row.id===id)) return;
  desktopUi.rounds.unshift({id,timestamp,balls,stake,payout,profit:Math.round((payout-stake)*100)/100});
  const scroller=typeof document==='undefined'?null:document.querySelector('#desktopRounds .desktop-table-scroll');
  const readingOlder=scroller && scroller.scrollTop>0;
  const previousHeight=scroller?.scrollHeight||0;
  if(readingOlder)desktopUi.visibleRounds++;
  renderDesktopRounds();
  if(readingOlder)scroller.scrollTop+=scroller.scrollHeight-previousHeight;
}
function desktopCell(row, text, className='') {
  const cell=document.createElement('td');cell.textContent=text;cell.className=className;row.append(cell);
}
function renderDesktopRounds() {
  const body=document.getElementById('desktopRoundRows');if(!body)return;
  body.replaceChildren();
  for(const entry of desktopUi.rounds.slice(0,desktopUi.visibleRounds)) {
    const row=document.createElement('tr');
    desktopCell(row,new Date(entry.timestamp).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),'desk-time');
    desktopCell(row,String(entry.balls),'desk-balls');
    desktopCell(row,desktopMoney(entry.stake));
    desktopCell(row,desktopMoney(entry.profit,true),entry.profit>0?'desk-positive':entry.profit<0?'desk-negative':'desk-neutral');
    row.title=`Выигрыш: ${desktopMoney(entry.payout)} USD. Профит = выигрыш − общая ставка.`;
    body.append(row);
  }
  document.getElementById('desktopRoundsEmpty').hidden=desktopUi.rounds.length>0;
  const scroller=body.closest('.desktop-table-scroll');
  if(scroller.clientHeight>0 && scroller.scrollHeight<=scroller.clientHeight && desktopUi.visibleRounds<desktopUi.rounds.length)
    requestAnimationFrame(loadMoreDesktopRounds);
}
function refreshDesktopTop() {
  const list=document.getElementById('desktopTopRows');if(!list)return;
  list.replaceChildren(...[...document.querySelectorAll('#purpleLeaderboard > li')].map(row=>row.cloneNode(true)));
  requestAnimationFrame(updatePinnedTopPlayer);
}
function updatePinnedTopPlayer() {
  const list=document.getElementById('desktopTopRows');
  const pinned=document.getElementById('desktopTopPinned');
  if(!list||!pinned)return;
  const player=list.querySelector('.is-real');
  if(!player){pinned.hidden=true;pinned.replaceChildren();return;}
  const listRect=list.getBoundingClientRect(),playerRect=player.getBoundingClientRect();
  const edge=playerRect.bottom<=listRect.top?'top':playerRect.top>=listRect.bottom?'bottom':'';
  if(!edge){pinned.hidden=true;pinned.replaceChildren();return;}
  pinned.className='desktop-top-pinned is-'+edge;
  pinned.replaceChildren(player.cloneNode(true));
  pinned.hidden=false;
}
function mobilePlayerCenterScrollTop(rowTop,rowHeight,viewportHeight,maxScroll) {
  return Math.max(0,Math.min(maxScroll,rowTop-(viewportHeight-rowHeight)/2));
}
function centerMobileTopPlayer(event) {
  if(!matchMedia('(max-width:720px)').matches||!event.target.closest('.is-real'))return;
  const list=document.getElementById('desktopTopRows');
  const player=list?.querySelector('.is-real');
  if(!list||!player)return;
  event.preventDefault();event.stopPropagation();
  const top=mobilePlayerCenterScrollTop(player.offsetTop,player.offsetHeight,list.clientHeight,
    Math.max(0,list.scrollHeight-list.clientHeight));
  list.scrollTo({top,behavior:'smooth'});
}
function desktopRandom() {
  let x=desktopUi.seed;x^=x<<13;x^=x>>>17;x^=x<<5;desktopUi.seed=x>>>0;
  return desktopUi.seed/4294967296;
}
function addDesktopDemoWin() {
  const names=['Luna742','Mateo081','Sofi309','Kiro503','Mina202','Diego417','Zara615','Noah274'];
  const pick=items=>items[Math.floor(desktopRandom()*items.length)];
  const balls=pick([1,2,3]),stake=pick([.2,.5,1,2,3])*balls;
  desktopUi.demo.unshift({name:pick(names),balls,stake,payout:stake*pick([1.5,2,3.6,6,15,20,30])});
  desktopUi.demo.length=Math.min(desktopUi.demo.length,18);
  const body=document.getElementById('desktopDemoRows');body.replaceChildren();
  for(const entry of desktopUi.demo) {
    const row=document.createElement('tr');desktopCell(row,entry.name,'desk-player');
    desktopCell(row,desktopMoney(entry.stake));desktopCell(row,String(entry.balls),'desk-balls');
    desktopCell(row,desktopMoney(entry.payout),'desk-positive');body.append(row);
  }
}
function makeDesktopPanel(id,title,side,content) {
  const panel=document.createElement('aside');panel.id=id;panel.className=`desktop-panel desktop-${side}`;
  panel.setAttribute('aria-label',title);
  panel.innerHTML=`<div class="desktop-panel-content"><header><h2>${title}</h2></header>${content}</div><button type="button" class="desktop-panel-tab" aria-label="Свернуть: ${title}" aria-expanded="true">${side==='left'?'‹':'›'}</button>`;
  const button=panel.querySelector('button');
  button.setAttribute('aria-controls',`${id}Content`);panel.firstElementChild.id=`${id}Content`;
  panel.addEventListener('click',()=>{
    if(matchMedia('(max-width:720px)').matches)return;
    if(document.body.classList.contains('history-open')){
      document.body.classList.remove('history-open');return;
    }
    const closed=panel.classList.toggle('is-collapsed');
    panel.firstElementChild.inert=closed;
    button.setAttribute('aria-expanded',String(!closed));
    button.setAttribute('aria-label',`${closed?'Развернуть':'Свернуть'}: ${title}`);
    button.textContent=(side==='left')!==closed?'‹':'›';
  });
  document.querySelector('.game-shell').append(panel);
}
function setupDesktopUi() {
  if(new URLSearchParams(location.search).get('desktopUi')==='0')return;
  desktopUi.enabled=true;document.body.classList.add('desktop-ui-experiment');
  const logo=document.querySelector('.balloro-logo').cloneNode(true);
  logo.classList.add('desktop-logo');document.querySelector('.mine-stage').append(logo);
  makeDesktopPanel('desktopRounds','Мои раунды','left',
    '<div class="desktop-table-scroll"><table><thead><tr><th>Время</th><th>Шары</th><th>Ставка</th><th>Профит</th></tr></thead><tbody id="desktopRoundRows"></tbody></table><p id="desktopRoundsEmpty" class="desktop-empty">Запустите первый раунд.<br>Здесь появится его результат.</p></div>');
  makeDesktopPanel('desktopTop','Топ дня','right','<ol id="desktopTopPinned" class="desktop-top-pinned" hidden></ol><ol id="desktopTopRows"></ol>');
  makeDesktopPanel('desktopWins','Выигрыши · ДЕМО','right',
    '<div class="desktop-table-scroll"><table><thead><tr><th>Игрок</th><th>Ставка</th><th>Шары</th><th>Выигрыш</th></tr></thead><tbody id="desktopDemoRows"></tbody></table></div>');
  new MutationObserver(refreshDesktopTop).observe(document.getElementById('purpleLeaderboard'),{childList:true,subtree:true,characterData:true});
  refreshDesktopTop();
  document.getElementById('desktopTopRows').addEventListener('scroll',updatePinnedTopPlayer,{passive:true});
  document.getElementById('desktopTopRows').addEventListener('click',centerMobileTopPlayer);
  document.getElementById('desktopTopPinned').addEventListener('click',centerMobileTopPlayer);
  setupMobileTables();
  document.querySelector('#desktopRounds .desktop-table-scroll').addEventListener('scroll',event=>{
    const node=event.currentTarget;
    if(node.scrollTop+node.clientHeight>=node.scrollHeight-80 && desktopUi.visibleRounds<desktopUi.rounds.length)
      loadMoreDesktopRounds();
  },{passive:true});
  setupMobileWinScrollbar();
  const media=matchMedia('(min-width:1360px) and (min-height:650px)');
  let timer;
  const updateDemo=()=>{
    clearInterval(timer);
    if((!media.matches&&!matchMedia('(max-width:720px)').matches)||document.hidden)return;
    if(!desktopUi.demo.length)for(let i=0;i<6;i++)addDesktopDemoWin();
    timer=setInterval(addDesktopDemoWin,4200);
  };
  media.addEventListener('change',updateDemo);document.addEventListener('visibilitychange',updateDemo);updateDemo();
}

function mobileSwipeDestination(page,dx,dy) {
  if(Math.abs(dx)<55 || Math.abs(dx)<Math.abs(dy)*1.4)return page;
  return Math.max(-1,Math.min(1,page+(dx<0?1:-1)));
}
function setupMobileWinScrollbar() {
  const scroller=document.querySelector('#desktopWins .desktop-table-scroll');
  const track=document.createElement('div');
  track.className='mobile-win-scrollbar';track.setAttribute('aria-hidden','true');
  const thumb=document.createElement('span');track.append(thumb);
  scroller.parentElement.append(track);
  const update=()=>{
    const height=scroller.clientHeight, total=scroller.scrollHeight;
    track.hidden=total<=height || !height;
    track.style.top=scroller.offsetTop+'px';track.style.height=height+'px';
    const size=Math.min(height,Math.max(24,height*height/total));
    thumb.style.height=size+'px';
    thumb.style.transform='translateY('+((height-size)*scroller.scrollTop/Math.max(1,total-height))+'px)';
  };
  scroller.addEventListener('scroll',update,{passive:true});
  new ResizeObserver(update).observe(scroller);
  new MutationObserver(update).observe(scroller,{childList:true,subtree:true});
  update();
}
function setupMobileTables() {
  const mobile=matchMedia('(max-width:720px)');
  let page=0, start=null;
  const game=document.getElementById('gameScreen');
  const panels=[...document.querySelectorAll('.desktop-panel')];
  const nav=document.createElement('nav');
  nav.className='mobile-table-nav';
  nav.innerHTML='<button type="button" class="mobile-table-left" aria-label="Мои раунды">‹</button><button type="button" class="mobile-table-right" aria-label="Топ дня и выигрыши">›</button><button type="button" class="mobile-table-back" aria-label="Вернуться к игре">‹</button>';
  document.querySelector('.game-shell').append(nav);
  const show=(next)=>{
    page=mobile.matches?next:0;
    document.body.dataset.tablePage=String(page);
    game.inert=page!==0;
    panels.forEach(panel=>{
      const visible=!mobile.matches || (panel.id==='desktopRounds'?page===-1:page===1);
      panel.inert=!visible;
      if(mobile.matches)panel.setAttribute('aria-hidden',String(!visible));
      else {panel.removeAttribute('aria-hidden');panel.firstElementChild.inert=panel.classList.contains('is-collapsed');}
      if(mobile.matches)panel.firstElementChild.inert=false;
    });
    nav.querySelector('.mobile-table-back').hidden=page===0;
    nav.querySelector('.mobile-table-back').textContent=page===-1?'›':'‹';
    nav.querySelector('.mobile-table-left').hidden=page!==0;
    nav.querySelector('.mobile-table-right').hidden=page!==0;
  };
  nav.querySelector('.mobile-table-left').onclick=()=>show(-1);
  nav.querySelector('.mobile-table-right').onclick=()=>show(1);
  nav.querySelector('.mobile-table-back').onclick=()=>show(0);
  // Reuse the same page transition for UI outside this module, such as the
  // rank-promotion message shown over the mobile logo.
  desktopUi.openTop=()=>{
    if(mobile.matches){show(1);return;}
    document.body.classList.remove('history-open');
    ['desktopTop','desktopWins'].forEach(id=>{
      const panel=document.getElementById(id);
      panel.classList.remove('is-collapsed');panel.inert=false;panel.firstElementChild.inert=false;
      const tab=panel.querySelector('.desktop-panel-tab');
      tab.textContent='›';tab.setAttribute('aria-expanded','true');
      tab.setAttribute('aria-label','Свернуть: '+panel.getAttribute('aria-label'));
    });
  };
  desktopUi.openRounds=()=>{
    desktopUi.visibleRounds=20;
    renderDesktopRounds();
    const panel=document.getElementById('desktopRounds');
    panel.querySelector('.desktop-table-scroll').scrollTop=0;
    if(mobile.matches)show(-1);
    else {
      panel.classList.remove('is-collapsed');panel.inert=false;panel.firstElementChild.inert=false;
      const tab=panel.querySelector('.desktop-panel-tab');
      tab.textContent='‹';tab.setAttribute('aria-expanded','true');
      if(!matchMedia('(min-width:1360px) and (min-height:650px)').matches)
        document.body.classList.add('history-open');
    }
  };
  document.addEventListener('touchstart',event=>{
    if(!mobile.matches || event.touches.length!==1 || event.target.closest('button,input,a,.slot-dialog,[role="dialog"],[data-bonus-help]')) {start=null;return;}
    start={x:event.touches[0].clientX,y:event.touches[0].clientY,axis:null};
  },{passive:true,capture:true});
  document.addEventListener('touchmove',event=>{
    if(!start || event.touches.length!==1)return;
    const dx=event.touches[0].clientX-start.x,dy=event.touches[0].clientY-start.y;
    if(!start.axis && Math.max(Math.abs(dx),Math.abs(dy))>10)
      start.axis=Math.abs(dx)>Math.abs(dy)*1.4?'horizontal':'vertical';
    // Keep a horizontal return swipe out of the table's native scroll gesture.
    if(start.axis==='horizontal' && event.cancelable)event.preventDefault();
  },{passive:false,capture:true});
  document.addEventListener('touchend',event=>{
    if(!start)return;
    const end=event.changedTouches[0];
    if(start.axis!=='vertical')show(mobileSwipeDestination(page,end.clientX-start.x,end.clientY-start.y));
    start=null;
  },{passive:true,capture:true});
  document.addEventListener('touchcancel',()=>{start=null;},{passive:true});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(page)show(0);document.body.classList.remove('history-open');}});
  mobile.addEventListener('change',()=>{document.body.classList.remove('history-open');show(0);});show(0);
}
