// Lightweight current-game explanations. No gameplay state or RNG is changed.
let bonusHelpFrame = null;
let bonusHelpDemo = null;
const BONUS_HELP = Object.freeze({
  boost: { title:'10X BOOST',color:'#ca68ff',kind:'diamond',copy:'ruleBoostText' },
  chance: { title:'LUCKY SHOT',color:'#ff4b4b',kind:'crown',copy:'ruleLuckyText' },
  multi: { title:'EX MULTI',color:'#ffd53d',kind:'lemon',copy:'ruleMultiText' },
  balls: { title:'3X BALLS',color:'#43ed60',kind:'blue',copy:'rulePocketFieldText' }
});
function stopBonusHelpAnimation() {
  if (bonusHelpFrame !== null) cancelAnimationFrame(bonusHelpFrame);
  bonusHelpFrame = null;
  bonusHelpDemo = null;
}
function setupBonusHelp() {
  const body = makeSlotDialog('bonusHelpDialog','');
  body.innerHTML='<canvas class="bonus-help-canvas" width="560" height="480" role="img"></canvas>'
    +'<div class="bonus-help-steps"><span data-i18n="stepCapture"></span><span data-i18n="stepPrepare"></span><span data-i18n="stepRelease"></span></div>'
    +'<p class="bonus-help-copy"></p><div class="bonus-demo-controls"><p class="bonus-help-note" data-i18n="demoNote"></p><button id="pauseBonusDemo" type="button"></button></div>';
  for (const [counter,key] of [[els.crownCounter.closest('.crown-bonus-counter'),'boost'],[els.chanceBonusCounter,'chance'],[els.multiPlusCounter,'multi'],[els.pocketBonusCounter,'balls']]) {
    counter.dataset.bonusHelp=key;counter.setAttribute('role','button');counter.tabIndex=0;counter.setAttribute('aria-haspopup','dialog');
    counter.addEventListener('click',()=>openBonusHelp(key));
    counter.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openBonusHelp(key);}});
  }
  document.getElementById('pauseBonusDemo').onclick=()=>{
    if (!bonusHelpDemo) return;
    const demo=bonusHelpDemo;
    demo.paused=!demo.paused;demo.lastAt=performance.now();
    refreshBonusHelpCopy();
    if(!demo.paused)runBonusHelpFrame(demo.lastAt);
    else {if(bonusHelpFrame!==null)cancelAnimationFrame(bonusHelpFrame);bonusHelpFrame=null;}
  };
  // No animation work while the page is hidden; resume without a time jump.
  document.addEventListener('visibilitychange',()=>{
    if(!bonusHelpDemo)return;
    if(document.hidden){if(bonusHelpFrame!==null)cancelAnimationFrame(bonusHelpFrame);bonusHelpFrame=null;}
    else if(!bonusHelpDemo.paused){bonusHelpDemo.lastAt=performance.now();runBonusHelpFrame(bonusHelpDemo.lastAt);}
  });
}
function refreshBonusHelpCopy() {
  if(!bonusHelpDemo)return;
  const config=BONUS_HELP[bonusHelpDemo.key],dialog=document.getElementById('bonusHelpDialog');
  dialog.querySelector('h2').textContent=config.title;dialog.querySelector('h2').style.color=config.color;
  dialog.querySelector('.bonus-help-copy').textContent=t(config.copy);
  dialog.querySelector('canvas').setAttribute('aria-label',t(config.copy));
  const button=document.getElementById('pauseBonusDemo');
  button.textContent=t(bonusHelpDemo.paused?'playDemo':'pauseDemo');
  button.setAttribute('aria-pressed',String(bonusHelpDemo.paused));
}
function openBonusHelp(key) {
  if(!BONUS_HELP[key])return;
  showSlotDialog('bonusHelpDialog');
  const paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
  bonusHelpDemo={key,elapsed:paused?7.2:0,lastAt:performance.now(),lastDraw:-Infinity,paused};
  refreshBonusHelpCopy();
  runBonusHelpFrame(bonusHelpDemo.lastAt);
}
function runBonusHelpFrame(now) {
  const demo=bonusHelpDemo;if(!demo||document.getElementById('bonusHelpDialog').classList.contains('hidden'))return;
  if(!demo.paused&&!document.hidden)demo.elapsed+=(now-demo.lastAt)/1000;
  demo.lastAt=now;
  if(!document.hidden&&now-demo.lastDraw>=33){
    demo.lastDraw=now;
    drawBonusHelp(document.querySelector('#bonusHelpDialog canvas'),demo.key,demo.elapsed%9);
    const phase=demo.elapsed%9<2.7?0:demo.elapsed%9<5.5?1:2;
    document.querySelectorAll('.bonus-help-steps span').forEach((node,i)=>node.classList.toggle('active',i===phase));
  }
  if(!demo.paused&&!document.hidden)bonusHelpFrame=requestAnimationFrame(runBonusHelpFrame);
}
function drawBonusHelp(canvas,key,time) {
  const c=canvas.getContext('2d'),config=BONUS_HELP[key],rules=window.BalloroV4Rules;
  const color=config?.color||'#79ddf5',purple=key==='boost'&&time>=3;
  // One recognisable board, four pockets, two bonus fields. Only the few
  // relevant cells carry numbers. Crop unused horizontal space, not artwork.
  c.setTransform(canvas.width/280,0,0,canvas.height/240,-40*canvas.width/280,0);
  c.clearRect(0,0,360,240);c.fillStyle='#090e15';c.fillRect(0,0,360,240);
  const clamp=p=>Math.max(0,Math.min(1,p)),lerp=(a,b,p)=>a+(b-a)*clamp(p);
  function diamond(x,y,r,stroke,fill='#090e15',width=1.5) {
    c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r,y);c.lineTo(x,y+r);c.lineTo(x-r,y);c.closePath();
    c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=width;c.stroke();
  }
  function label(value,x,y,fill,size=18) {
    c.save();c.font='850 '+size+'px system-ui';const text=String(value),w=c.measureText(text).width;
    c.font='700 '+size*.6+'px system-ui';const suffix=c.measureText('x').width;
    const left=x-(w+suffix+2)/2;c.fillStyle=fill;c.textAlign='left';c.textBaseline='middle';
    c.font='850 '+size+'px system-ui';c.fillText(text,left,y);
    c.font='700 '+size*.6+'px system-ui';c.fillText('x',left+w+2,y);c.restore();
  }
  function ball(x,y,r=7,alpha=1) {
    if(r<.1)return;c.save();c.globalAlpha=alpha;
    const g=c.createRadialGradient(x-r*.28,y-r*.32,1,x,y,r);g.addColorStop(0,'#fff');g.addColorStop(.7,'#edf2ec');g.addColorStop(1,'#9aa59e');
    c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.lineWidth=1.5;c.strokeStyle='#303934';c.stroke();c.restore();
  }
  function symbol(kind,x,y,r) {
    c.save();
    if(kind==='diamond'){
      c.translate(x,y);c.beginPath();c.moveTo(-r*.92,-r*.28);c.lineTo(-r*.48,-r*.74);c.lineTo(r*.48,-r*.74);c.lineTo(r*.92,-r*.28);c.lineTo(0,r*.86);c.closePath();
      c.fillStyle='#d8a4ff';c.fill();c.strokeStyle='#9439d0';c.lineWidth=1.5;c.stroke();
      c.beginPath();c.moveTo(-r*.92,-r*.28);c.lineTo(r*.92,-r*.28);c.lineTo(0,r*.86);c.lineTo(-r*.92,-r*.28);
      c.moveTo(-r*.48,-r*.74);c.lineTo(0,-r*.28);c.lineTo(r*.48,-r*.74);c.strokeStyle='#ffe3ff';c.lineWidth=1;c.stroke();
    }else{
      const img=v2PocketSymbolImages[kind];
      if(img?.complete&&img.naturalWidth){const b=getV2PocketSymbolDrawBounds(kind,kind==='crown'?r*.94:r);c.drawImage(img,x+b.x,y+b.y,b.width,b.height);}
    }c.restore();
  }
  const px=180,py=89,r=84,cellR=r/5;
  const cell=(col,row)=>[px+(col-row)*cellR,py+(col+row-4)*cellR];
  const baseCenter=rules?.centerMultipliers[5]||10,baseSide=rules?.rings[5][1]||2;
  const samples=[[2,1],[3,2],[1,2]],targets=key==='balls'?samples:key==='boost'?[[2,2]]:[[3,2]];
  const released=time>=5.5,settled=time>=7,enhanced=key==='multi'&&time>=3;
  for(let row=0;row<5;row++)for(let col=0;col<5;col++){
    const [x,y]=cell(col,row),target=targets.some(([a,b])=>a===col&&b===row);
    const boosted=enhanced&&samples.some(([a,b])=>a===col&&b===row);
    diamond(x,y,cellR-.4,purple?'#664485':'#174c35',target&&settled&&key!=='chance'?'#635018':boosted?'#3b3219':purple?'#170e24':'#090e15');
  }
  diamond(px,py,r,purple?'#ca68ff':'#1bb866','transparent',4);
  if(!enhanced&&key!=='win'){
    label(baseCenter*(purple?10:1),px,py,purple?'#ca68ff':'#ff4b4b',19);
    if(!(key==='boost'&&settled))symbol(purple?'diamond':'crown',px,py-19,6);
  }
  for(const [col,row] of (key==='balls'?samples:enhanced||!config?[[3,2]]:[])) {
    const [x,y]=cell(col,row),value=baseSide*(enhanced?10:1)*(purple?10:1);
    label(value,x,y,purple?'#ca68ff':BalloroMultiplierPresentation.color(value),13);
    if(enhanced&&!settled&&value>=baseCenter)symbol('crown',x,y-17,5);
  }
  const pockets={diamond:cell(0,0),blue:cell(0,4),crown:cell(4,4),lemon:cell(4,0)};
  const [hx,hy]=pockets[config?.kind||'crown'];
  for(const [kind,[x,y]] of Object.entries(pockets)){
    const active=kind===config?.kind;
    c.save();c.strokeStyle={diamond:'#ca68ff',blue:'#43ed60',crown:'#ff4b4b',lemon:'#ffd53d'}[kind];
    c.lineWidth=active&&time>=1.2&&time<5.5?4:3;c.fillStyle='#07090e';
    c.beginPath();c.arc(x,y,12,0,Math.PI*2);c.fill();c.stroke();
    if(!active||time<1.2||released)symbol(kind,x,y,9);
    if(active&&time>=1.2&&time<5.5){
      c.globalAlpha=.3+.3*Math.sin(time*6)**2;c.beginPath();c.arc(x,y,17,0,Math.PI*2);c.stroke();
    }c.restore();
  }
  const selecting=key==='chance'&&time>=3.5&&time<5.5;
  const chosen=key==='chance'&&(released||selecting)?(released?1:Math.floor(time*4)%2):-1;
  const roomX=[133,227],roomY=189,roomR=42;
  for(let i=0;i<2;i++){
    const x=roomX[i],lit=i===chosen,roomColor=purple?'#ca68ff':'#ff4b4b';
    c.save();c.globalAlpha=lit?1:purple?.6:.28;
    diamond(x,roomY,roomR,roomColor,purple?'#170e24':'#180d12',lit?4:2);
    c.beginPath();c.moveTo(x-roomR/2,roomY-roomR/2);c.lineTo(x+roomR/2,roomY+roomR/2);
    c.moveTo(x+roomR/2,roomY-roomR/2);c.lineTo(x-roomR/2,roomY+roomR/2);c.strokeStyle=roomColor;c.lineWidth=1;c.stroke();
    label((rules?.roomMultipliers[5][i?'bottom-right':'bottom-left']||(i?120:20))*(purple?10:1),x,roomY,roomColor,18);
    symbol(purple?'diamond':'crown',x,roomY-19,6);c.restore();
  }
  function flight(points,p) {
    const progress=clamp(p)*(points.length-1),index=Math.min(points.length-2,Math.floor(progress));
    return [lerp(points[index][0],points[index+1][0],progress-index),lerp(points[index][1],points[index+1][1],progress-index)];
  }
  if(!config){
    const points=[[180,144],[139,78],[218,105],cell(3,2)];
    c.save();c.strokeStyle='#b6cad670';c.lineWidth=2;c.setLineDash([3,5]);c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.restore();
    const [x,y]=flight(points,key==='win'?1:.65);ball(x,y);
    if(key==='win')label(baseSide,x,y-29,'#ffd53d',25);
    return;
  }
  if(time<1.2){ball(lerp(180,hx,time/1.2),lerp(111,hy,time/1.2));return;}
  if(time<5.5){
    if(key==='chance'&&time>=3.5)ball(180,188);
    else ball(hx,hy,key==='chance'&&time>=3.2?7*(1-clamp((time-3.2)/.3)):7,Math.floor(time*5)%2?.3:1);
    return;
  }
  if(key==='chance'){
    const x=roomX[1],points=[[x,218],[x-24,184],[x+25,181],[x,roomY]];
    const pos=flight(points,(time-5.5)/1.5);ball(...pos);
    if(settled){diamond(x,roomY,20,'#ffe65b','#554314',2);ball(x,roomY);label(rules?.roomMultipliers[5]['bottom-right']||120,x,147,'#ff4b4b',25);}
    return;
  }
  for(const [index,[col,row]] of targets.entries()){
    const end=cell(col,row),points=[[hx,hy],[153+index*20,115],[216-index*18,62],end];
    const pos=flight(points,(time-5.5)/1.5);ball(...pos);
  }
  // A single result avoids overlapping labels in the three-ball example.
  if(settled&&key!=='balls'){
    const value=key==='boost'?baseCenter*10:baseSide*10;
    const end=cell(...targets[0]);
    label(value,end[0],end[1]-30,purple?'#ca68ff':BalloroMultiplierPresentation.color(value),26);
  }
}
