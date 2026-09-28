(function(root){
  'use strict';

  const MAX_POINTS=11;
  const LIFETIME_MS=260;
  const MIN_SAMPLE_MS=14;
  const histories=new WeakMap();

  function trim(points,now){
    while(points.length&&now-points[0].t>LIFETIME_MS)points.shift();
  }

  const BONUS_CHANNELS={blue:'41,232,91',diamond:'180,83,236',crown:'255,69,75',lemon:'255,217,58'};

  function draw(ctx,key,point,radius,{active=false,alpha=1,now=performance.now(),bonusKind=null}={}){
    if(!key||!point||!Number.isFinite(point.x)||!Number.isFinite(point.y)||!(radius>0))return 0;
    let points=histories.get(key);
    if(!points){points=[];histories.set(key,points);}
    trim(points,now);

    if(active){
      const last=points[points.length-1];
      const moved=!last||Math.hypot(point.x-last.x,point.y-last.y)>=Math.max(1,radius*.28);
      if(!last||moved||now-last.t>=MIN_SAMPLE_MS){
        points.push({x:point.x,y:point.y,t:now});
        if(points.length>MAX_POINTS)points.splice(0,points.length-MAX_POINTS);
      }
    }

    if(points.length<2)return points.length;
    ctx.save();
    ctx.lineCap='round';
    ctx.lineJoin='round';
    ctx.globalCompositeOperation='source-over';
    const channels=BONUS_CHANNELS[bonusKind]||'255,255,255';
    for(let index=1;index<points.length;index+=1){
      const from=points[index-1],to=points[index];
      const fade=Math.max(0,1-(now-to.t)/LIFETIME_MS);
      if(fade<=0)continue;
      const taper=index/(points.length-1);
      ctx.beginPath();
      ctx.moveTo(from.x,from.y);
      ctx.lineTo(to.x,to.y);
      ctx.lineWidth=radius*2;
      ctx.strokeStyle=`rgba(${channels},${(.16*fade*taper*alpha).toFixed(4)})`;
      ctx.stroke();
    }
    ctx.restore();
    return points.length;
  }

  function clear(key){if(key)histories.delete(key);}

  const api={draw,clear,MAX_POINTS,LIFETIME_MS};
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.BalloroQuickTrail=api;
})(typeof globalThis==='object'?globalThis:this);
