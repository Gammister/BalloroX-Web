// Self-contained visual explanations. Never read or mutate a round or its RNG.
let bonusHelpFrame = null;
const BONUS_HELP = {
  boost: {title:'X10 BOOST',color:'#ce74ff',text:'Соберите шаром 3 алмаза. Все выигрыши этого раунда в основном ромбе и обеих СК умножатся на 10 — даже уже полученные.'},
  chance: {title:'LUCKY SHOT',color:'#ff4a55',text:'Красная луза отправит шар в одну из двух СК после остальных бонусов. Остановитесь на множителе, чтобы выиграть. Справа множитель в 10 раз больше.'},
  multi: {title:'EX MULTI',color:'#ffda3e',text:'Жёлтая луза добавит множители на поле: сколько линий, столько новых ячеек. Затем выпустит шар. Для выигрыша нужно остановиться на множителе.'},
  balls: {title:'X3 BALLS',color:'#73dafa',text:'Голубая луза захватит шар и выпустит вместо него 3 шара. Каждый может принести выигрыш или собрать бонус.'}
};
if (window.BalloroBonusUI?.isV2) {
  BONUS_HELP.boost.text = 'Фиолетовая луза даёт алмаз. Накопите 5 алмазов за несколько раундов, чтобы запустить X10 BOOST. Заполненный счётчик опустеет после остановки бонусных шаров.';
  BONUS_HELP.chance.text = 'Красная луза даёт огонёк. Накопите 3 огонька для LUCKY SHOT: шар отправится в одну из двух скрытых комнат. Счётчик опустеет после остановки шара.';
  BONUS_HELP.multi.text = 'Жёлтая луза даёт звезду. Накопите 2 звезды для EX MULTI: на поле появятся дополнительные множители, затем луза выпустит шар. Счётчик опустеет после остановки шара.';
  BONUS_HELP.balls.color = '#43ed60';
  BONUS_HELP.balls.text = 'Зелёная луза даёт кактус. Одного кактуса достаточно для X3 BALLS: луза выпустит 3 шара. Счётчик опустеет, когда шары остановятся.';
}
function stopBonusHelpAnimation() {
  if (bonusHelpFrame !== null) cancelAnimationFrame(bonusHelpFrame);
  bonusHelpFrame = null;
}
function setupBonusHelp() {
  const body = makeSlotDialog('bonusHelpDialog', 'Бонус');
  body.innerHTML = '<canvas class="bonus-help-canvas" width="720" height="576" aria-label="Демонстрация бонуса"></canvas><p class="bonus-help-copy"></p><p class="bonus-help-note">Схематичный пример · не игровой раунд</p>';
  const entries = [[els.crownCounter.closest('.crown-bonus-counter'),'boost'],[els.chanceBonusCounter,'chance'],[els.multiPlusCounter,'multi'],[els.pocketBonusCounter,'balls']];
  for (const [counter,key] of entries) {
    counter.dataset.bonusHelp = key;
    counter.setAttribute('role','button'); counter.tabIndex = 0;
    counter.setAttribute('aria-label', `${BONUS_HELP[key].title}: как работает бонус`);
    counter.setAttribute('aria-haspopup','dialog');
    counter.addEventListener('click',()=>openBonusHelp(key));
    counter.addEventListener('keydown',event=>{
      if (event.key === 'Enter' || event.key === ' ') {event.preventDefault();openBonusHelp(key);}
    });
  }
}
function openBonusHelp(key) {
  const config = BONUS_HELP[key];
  showSlotDialog('bonusHelpDialog');
  const dialog = document.getElementById('bonusHelpDialog');
  dialog.querySelector('h2').textContent = config.title;
  dialog.querySelector('h2').style.color = config.color;
  dialog.querySelector('.bonus-help-copy').textContent = config.text;
  const canvas = dialog.querySelector('canvas');
  canvas.setAttribute('aria-label', `Анимация: ${config.text}`);
  const startedAt = performance.now();
  const frame = now => {
    if (dialog.classList.contains('hidden')) return;
    drawBonusHelp(canvas,key,((now-startedAt)/1000)%7);
    bonusHelpFrame = requestAnimationFrame(frame);
  };
  frame(startedAt);
}
function drawBonusHelp(canvas,key,time) {
  const c = canvas.getContext('2d');
  c.setTransform(2,0,0,2,0,0); c.clearRect(0,0,360,288);
  c.fillStyle='#000';c.fillRect(0,0,360,288);
  const color = BONUS_HELP[key].color;
  const lerp=(a,b,t)=>a+(b-a)*Math.max(0,Math.min(1,t));
  function label(text,x,y,fill,size=17) {c.fillStyle=fill;c.font=`800 ${size}px system-ui`;c.textAlign='center';c.textBaseline='middle';c.fillText(text,x,y);}
  function diamond(x,y,r,stroke,fill='#060b0b',width=3) {
    c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r,y);c.lineTo(x,y+r);c.lineTo(x-r,y);c.closePath();
    c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=width;c.stroke();
  }
  function board(x,y,r,boost=false) {
    diamond(x,y,r,boost?'#bd62f7':'#21b478',boost?'#180b26':'#050a09',5);
    for(let i=1;i<5;i++) {
      const p=i/5;
      c.beginPath();c.moveTo(x+r*p,y-r+r*p);c.lineTo(x-r+r*p,y+r*p);
      c.moveTo(x-r*p,y-r+r*p);c.lineTo(x+r-r*p,y+r*p);
      c.lineWidth=1;c.strokeStyle=boost?'#703994':'#16553e';c.stroke();
    }
  }
  function ball(x,y,r=9) {
    if(r<=.05)return;
    const g=c.createRadialGradient(x-r*.3,y-r*.35,1,x,y,r);
    g.addColorStop(0,'#fff');g.addColorStop(.65,'#f1f5ef');g.addColorStop(1,'#9ca7a2');
    c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.strokeStyle='#37413e';c.lineWidth=2;c.stroke();
  }
  function waves(x,y,elapsed,col) {
    for(let i=0;i<2;i++) {const p=(elapsed*1.5+i*.5)%1;c.globalAlpha=1-p;c.strokeStyle=col;c.lineWidth=2;c.beginPath();c.arc(x,y,12+p*17,0,Math.PI*2);c.stroke();}c.globalAlpha=1;
  }
  function pocket(x,y,col) {
    const r=17+Math.sin(time*5)*.7;
    c.shadowColor=col;c.shadowBlur=12;
    const g=c.createRadialGradient(x,y,5,x,y,r);g.addColorStop(0,'#000');g.addColorStop(.45,'#102025');g.addColorStop(1,col);
    c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.shadowBlur=0;
    c.strokeStyle=col;c.lineWidth=3;c.stroke();
  }
  function gem(x,y,col) {diamond(x,y,10,col,'#d7a4ee',2);c.beginPath();c.moveTo(x-9,y-2);c.lineTo(x+9,y-2);c.lineTo(x,y+9);c.closePath();c.strokeStyle='#f4d9ff';c.lineWidth=1;c.stroke();}
  if(key==='boost') {
    const active=time>=4.2;
    board(180,153,105,active);
    label(active?'20×':'2×',180,153,active?color:'#d6e539',23);
    const points=[[138,153],[180,111],[222,153]];
    const pickup=[1.1,2.2,3.3];
    points.forEach(([x,y],i)=>{
      if(time<pickup[i])gem(x,y,color);
      else if(time<pickup[i]+.7){const p=(time-pickup[i])/.7;gem(lerp(x,150+i*30,p),lerp(y,23,p),color);}
      diamond(150+i*30,23,8,color,time>=pickup[i]+.7?'#d7a4ee':'#120c1b',2);
    });
    const path=[[180,235],[138,153],[180,111],[222,153],[180,153]];
    const phase=Math.min(3,Math.floor(time/1.1));const p=Math.min(1,time/1.1-phase);
    ball(active?180:lerp(path[phase][0],path[phase+1][0],p),active?153:lerp(path[phase][1],path[phase+1][1],p));
    if(active){waves(180,153,time-4.2,color);label('×10',180,79,color,24);}
    return;
  }
  const red=key==='chance';
  const by=red?107:140, radius=red?77:110;
  board(180,by,radius);
  const py=by+22;
  label('2×',180,by-5,'#d6e539',20);
  if(time< (red?2.3:4))pocket(180,py,color);
  if(time<1.2)ball(lerp(139,180,time/1.2),lerp(py+38,py,time/1.2));
  else if(time<2.3){ball(180,py,red&&time>1.8?9*(1-(time-1.8)/.5):9);waves(180,py,time-1.2,color);}
  if(red) {
    const selected=time>=4;
    const lit=time<2.3?-1:selected?1:Math.floor((time-2.3)*6)%2;
    [99,261].forEach((x,i)=>{
      const roomY=216;
      c.globalAlpha=lit===i?1:.2;
      diamond(x,roomY,45,'#ff4955','#140808',4);
      label(i===0?'2×':'20×',x,roomY-22,i===0?'#e4eb32':'#ff7450',18);
      if(i===1)diamond(x,roomY,49,'#ff4955','transparent',1);
      if(lit===i&&time<4){ball(x,roomY+45);waves(x,roomY+45,time,'#fff');}
      c.globalAlpha=1;
    });
    if(selected){const p=Math.min(1,(time-4)/1.4);ball(261+Math.sin(p*Math.PI*2)*20,lerp(261,211,p));if(time>5.4)label('20×',261,180,'#ff7450',21);}
  } else if(key==='balls') {
    if(time>=2.3&&time<4){ball(180,py);waves(180,py,time-1.2,color);}
    if(time>=4){const p=Math.min(1,(time-4)/1.8);[-1,0,1].forEach((side)=>ball(180+side*60*Math.sin(p*Math.PI*.75),py-p*62));}
  } else {
    const places=[[158,96],[202,96],[136,140],[224,140],[180,184],[158,140],[202,184],[180,96]];
    if(time>=1.8){const step=time<3.6?Math.floor((time-1.8)*6):10;
      for(let i=0;i<5;i++){const [x,y]=places[(i+step)%places.length];diamond(x,y,21,time<3.6?'#fff':'#eacd40',time<3.6?'#8b762a':'#4e4513',1);label('1.5×',x,y,'#ffe452',12);}
    }
    if(time>=2.3&&time<4){ball(180,py);waves(180,py,time-1.2,color);}
    if(time>=4){const p=Math.min(1,(time-4)/1.8);ball(180+Math.sin(p*Math.PI)*53,py-p*63);}
  }
}
