// Lightweight current-game explanations. No gameplay state or RNG is changed.
let bonusHelpFrame = null;
let bonusHelpDemo = null;
const BONUS_HELP = Object.freeze({
  boost: { title:'X10 BOOST',color:'#ca68ff',kind:'diamond',copy:'ruleBoostText' },
  chance: { title:'LUCKY SHOT',color:'#ff4b4b',kind:'crown',copy:'ruleLuckyText' },
  multi: { title:'EX MULTI',color:'#ffd53d',kind:'lemon',copy:'ruleMultiText' },
  balls: { title:'X3 BALLS',color:'#43ed60',kind:'blue',copy:'rulePocketFieldText' }
});
function stopBonusHelpAnimation() {
  if (bonusHelpFrame !== null) cancelAnimationFrame(bonusHelpFrame);
  bonusHelpFrame = null;
  bonusHelpDemo = null;
}
function setupBonusHelp() {
  const body = makeSlotDialog('bonusHelpDialog','');
  body.innerHTML='<canvas class="bonus-help-canvas" width="720" height="640"></canvas>'
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
  const c=canvas.getContext('2d'),config=BONUS_HELP[key],color=config.color;
  c.setTransform(2,0,0,2,0,0);c.clearRect(0,0,360,320);c.fillStyle='#090e15';c.fillRect(0,0,360,320);
  const lerp=(a,b,p)=>a+(b-a)*Math.max(0,Math.min(1,p)),ease=p=>1-Math.pow(1-Math.max(0,Math.min(1,p)),3);
  function diamond(x,y,r,stroke,fill='#090e15',width=1.5) {
    c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r,y);c.lineTo(x,y+r);c.lineTo(x-r,y);c.closePath();
    c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=width;c.stroke();
  }
  function label(value,x,y,fill,size=17) {
    c.fillStyle=fill;c.font='900 '+size+'px system-ui';c.textAlign='center';c.textBaseline='middle';
    const text=String(value),width=c.measureText(text).width;c.fillText(text,x-3,y);
    c.font='600 '+size*.57+'px system-ui';c.fillText('x',x+width/2+2,y);
  }
  function ball(x,y,r=8,alpha=1) {
    if(r<.1)return;c.save();c.globalAlpha=alpha;
    const g=c.createRadialGradient(x-r*.28,y-r*.32,1,x,y,r);g.addColorStop(0,'#fff');g.addColorStop(.7,'#edf2ec');g.addColorStop(1,'#9aa59e');
    c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.lineWidth=2;c.strokeStyle='#303934';c.stroke();c.restore();
  }
  function symbol(kind,x,y,r,alpha=1) {
    c.save();c.globalAlpha=alpha;
    if(kind==='diamond'){
      c.translate(x,y);c.beginPath();c.moveTo(-r*.92,-r*.28);c.lineTo(-r*.48,-r*.74);c.lineTo(r*.48,-r*.74);c.lineTo(r*.92,-r*.28);c.lineTo(0,r*.86);c.closePath();
      c.fillStyle='#d8a4ff';c.fill();c.strokeStyle='#9439d0';c.lineWidth=1.6;c.stroke();
      c.beginPath();c.moveTo(-r*.92,-r*.28);c.lineTo(r*.92,-r*.28);c.lineTo(0,r*.86);c.lineTo(-r*.92,-r*.28);c.moveTo(-r*.48,-r*.74);c.lineTo(0,-r*.28);c.lineTo(r*.48,-r*.74);c.strokeStyle='#ffe3ff';c.lineWidth=1;c.stroke();
    }else{
      const image=v2PocketSymbolImages[kind];
      if(image?.complete&&image.naturalWidth){
        const size=kind==='crown'?r*.94:r;
        const bounds=getV2PocketSymbolDrawBounds(kind,size);
        c.drawImage(image,x+bounds.x,y+bounds.y,bounds.width,bounds.height);
      }
    }c.restore();
  }
  function pocket(x,y,col,showSymbol,kind) {
    c.beginPath();c.arc(x,y,15,0,Math.PI*2);c.fillStyle='#040609';c.fill();c.strokeStyle=col;c.lineWidth=4;c.stroke();
    c.beginPath();c.arc(x,y,12,0,Math.PI*2);c.strokeStyle=col;c.lineWidth=1;c.stroke();
    if(showSymbol)symbol(kind,x,y,12);
  }
  function waves(x,y,elapsed,col){
    for(let i=0;i<2;i++){const p=(elapsed*1.3+i*.5)%1;c.save();c.globalAlpha=(1-p)*.8;c.beginPath();c.arc(x,y,17+p*18,0,Math.PI*2);c.lineWidth=1.5;c.strokeStyle=col;c.stroke();c.restore();}
  }
  const purple=key==='boost'&&time>=3,px=180,py=147,r=90;
  const pockets={diamond:[180,75],blue:[108,147],crown:[180,219],lemon:[252,147]};
  const [hx,hy]=pockets[config.kind];
  const boosted=[[1,2],[2,2],[3,2]],chase=time>=3&&time<5.2;
  for(let row=0;row<5;row++)for(let col=0;col<5;col++){
    const x=px+(col-row)*r/5,y=py+(col+row-4)*r/5;
    const corner=(col===0||col===4)&&(row===0||row===4);
    const ring=Math.max(Math.abs(col-2),Math.abs(row-2)),base=ring===0?40:ring===1?2:.3;
    const lit=key==='multi'&&time>=3&&((chase&&(col+row+Math.floor(time*5))%5===0)||(!chase&&boosted.some(p=>p[0]===col&&p[1]===row)));
    const cellPurple=purple&&time>=3+(y-57)/260&&(time<8||y<317-(time-8)*260);
    diamond(x,y,r/5-1,cellPurple?'#68438c':'#174c35',lit?'#665119':cellPurple?'#160d24':'#090e15');
    // A few values are enough to convey the actual cells, without visual noise.
    if(!corner&&col===row&&col>=1&&col<=3){
      const value=base*(lit?10:1)*(cellPurple?10:1);
      label(value,x,y,cellPurple?color:BalloroMultiplierPresentation.color(value),ring===0?20:14);
      if(ring===0)symbol(cellPurple?'diamond':'crown',x,y-16,5);
    }
  }
  diamond(px,py,r,purple?'#ca68ff':'#1bb866','transparent',4);
  if(key!=='chance')for(const [i,x]of [115,245].entries()){
    c.save();c.globalAlpha=purple?.7:.2;
    diamond(x,259,49,purple?'#ca68ff':'#ff4b4b',purple?'#160d24':'#150b10',3);
    label((i===0?20:120)*(purple?10:1),x,259,purple?'#ca68ff':'#ff4b4b',17);
    symbol(purple?'diamond':'crown',x,241,6);c.restore();
  }
  for(const [kind,[x,y]]of Object.entries(pockets)){
    const active=kind===config.kind,show=!active||time<1.2;
    pocket(x,y,{diamond:'#ca68ff',blue:'#43ed60',crown:'#ff4b4b',lemon:'#ffd53d'}[kind],show,kind);
  }
  // One outlined meter fills on arrival. It is not an old accumulation counter.
  c.save();c.translate(180,23);c.strokeStyle=color;c.lineWidth=1.5;c.beginPath();c.roundRect(-31,-18,62,36,12);c.stroke();c.restore();
  if(time<2.7){symbol(config.kind,180,23,12,.18);}
  else{symbol(config.kind,180,23,12);if(time<3.2){c.save();c.globalAlpha=(3.2-time)*.8;c.fillStyle=color;c.fillRect(150,5,60,36);c.restore();}}
  if(time<1.2){const p=ease(time/1.2);ball(lerp(hx-18,hx,p),lerp(hy+24,hy,p));}
  if(time>=1.2&&time<2.7){
    const p=time<1.9?0:ease((time-1.9)/.8);
    symbol(config.kind,lerp(hx,180,p),lerp(hy-30,23,p),lerp(19,12,p));
  }
  const red=key==='chance';
  if(time>=1.2&&time<5.5&&!red){waves(hx,hy,time-1.2,color);ball(hx,hy,8,Math.floor(time*8)%2?0:1);}
  if(red){
    const switching=time>=3.46&&time<5.5,selected=time>=5.5;
    const lit=selected?1:switching?Math.floor(time*4)%2:-1;
    [115,245].forEach((x,i)=>{
      c.save();c.globalAlpha=lit===i?1:.23;
      diamond(x,py+112,49,'#ff4b4b','#150b10',3);
      diamond(x,py+112,24,'#56242a','transparent',1);
      label(i===0?20:120,x,py+112,'#ff4b4b',20);
      symbol('crown',x,py+92,6);
      label(i===0?2:5,x,py+75,'#ffd53d',12);
      c.restore();
    });
    if(time>=1.2&&time<3.2){
      waves(hx,hy,time-1.2,color);
      ball(hx,hy,8,Math.floor(time*8)%2===0?1:0);
    }
    if(time>=3.2&&time<3.46)ball(hx,hy,8*(1-(time-3.2)/.26));
    if(time>=3.46&&time<5.5){
      ball(180,259);
      waves(180,259,time,'#ff4b4b');
    }
    if(selected){
      const p=Math.min(1,(time-5.5)/1.3);
      ball(lerp(180,245,p)+Math.sin(p*Math.PI*2)*13,259-Math.sin(p*Math.PI)*25,8,time>7.1?Math.max(0,1-(time-7.1)*8):1);
      if(time>6.8)label(120,245,lerp(235,215,(time-6.8)/2),'#ff4b4b',26);
    }
  }else if(time>=5.5){
    const p=Math.min(1,(time-5.5)/1.3),fade=time>7.1?Math.max(0,1-(time-7.1)*8):1;
    const endpoints=key==='balls'?[[144,147],[180,111],[216,147]]:key==='multi'?[[162,129]]:[[180,147]];
    for(const [tx,ty] of endpoints){
      const x=lerp(hx,tx,p)+Math.sin(p*Math.PI*2)*(key==='balls'?19:29);
      const y=lerp(hy,ty,p)-Math.sin(p*Math.PI)*20;
      ball(x,y,8,fade);
      if(time>6.8){
        const value=key==='boost'?400:key==='multi'?20:2;
        c.save();c.globalAlpha=Math.max(0,1-(time-7.3)/1.7);label(value,tx,lerp(ty-25,ty-47,(time-6.8)/2),key==='boost'?color:BalloroMultiplierPresentation.color(value),23);c.restore();
      }
    }
  }
}
