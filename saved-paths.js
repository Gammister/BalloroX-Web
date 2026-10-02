'use strict';
window.BalloroSavedPaths = (()=>{
  const cache=new Map(),pending=new Map(),v3Cache=new Map(),v4Cache=new Map();
  const recentV4=new Map();
  const remainingV4=new Map();
  const mvpModels=new Map();
  const params=new URLSearchParams(location.search);
  const enabled=params.get('savedPaths')==='1'||params.get('pocketExperiment')==='1'||window.BalloroBonusUI?.isV4;
  const chooseWeighted=(groups,weights,unit)=>{
    const eligible=Object.entries(weights).filter(([tier,weight])=>weight>0&&groups[tier]?.length);
    const total=eligible.reduce((sum,[,weight])=>sum+weight,0);
    if(!total)throw Error('Missing weighted saved path variants');
    let cursor=Math.min(1-Number.EPSILON,Math.max(0,unit))*total;
    for(const [tier,weight] of eligible){
      if(cursor<weight)return {tier,indexUnit:cursor/weight};
      cursor-=weight;
    }
    return {tier:eligible.at(-1)[0],indexUnit:1-Number.EPSILON};
  };
  const prepare=(descriptor)=>{
    const t=structuredClone(descriptor);
    t.target_category='physical';t.recent_usage_count=0;t.stagger_delay=0;
    return t;
  };
  const v4Rules=()=>window.BalloroV4Rules;
  const mvpActive=()=>window.BalloroBonusUI?.isV4&&window.BalloroMvpMath?.enabled();
  const mvpModel=(lines)=>{
    if(!mvpModels.has(lines))mvpModels.set(lines,window.BalloroMvpMath.createModel(
      lines,v4Cache.get(lines),v4Rules(),window.BalloroV3Rules));
    return mvpModels.get(lines);
  };
  const mvpPick=(stage,key,unit)=>{
    const chosen=window.BalloroMvpMath.choose(stage,unit);
    // The deck only rearranges paths with the same payout/continuation outcome.
    // It cannot change the independently selected mathematical outcome.
    return v4Pick(chosen.entry.pool,`mvp/${key}/${chosen.entry.key}`,chosen.unit,true).item;
  };
  const v4Pick=(pool,key,unit,avoidCell=false)=>{
    if(!pool?.length)throw Error(`Missing V4 path variants ${key}`);
    const history=recentV4.get(key)||[];
    const recentIds=new Set(history.slice(-Math.min(48,pool.length-1)).map(item=>item.id));
    const recentCells=new Set(avoidCell?history.slice(-2).map(item=>item.cell):[]);
    let remaining=remainingV4.get(key);
    if(!remaining?.length)remaining=Array.from({length:pool.length},(_,index)=>index);
    // Each parameter set is used once per pool cycle. Reordering avoids recent
    // paths/cells without biasing endpoint frequencies or changing payout tiers.
    const fresh=remaining.filter(index=>!recentIds.has(index));
    const differentCell=fresh.filter(index=>!recentCells.has(`${pool[index].col}_${pool[index].row}`));
    const candidates=differentCell.length?differentCell:fresh.length?fresh:remaining;
    const index=candidates[Math.min(candidates.length-1,Math.floor(Math.max(0,unit)*candidates.length))];
    remaining.splice(remaining.indexOf(index),1);
    remainingV4.set(key,remaining);
    history.push({id:index,cell:`${pool[index].col}_${pool[index].row}`});
    if(history.length>64)history.shift();
    recentV4.set(key,history);
    return {item:pool[index],index};
  };
  const v4Hydrate=(lines,catalog,point,startPoint,id)=>{
    const trajectory=window.PuckLuckTrajectoryPlanner.simulateTrajectoryFromAngle({
      lines,puckRadius:catalog.radius,startPoint,angleDegrees:point.a,
      launchForce:point.f,dampingPerStep:point.d,duration:point.t
    });
    const end=trajectory.landing_point;
    const col=Math.max(0,Math.min(lines-1,Math.floor((end.x+1)*lines/2)));
    const row=Math.max(0,Math.min(lines-1,Math.floor((end.y+1)*lines/2)));
    if(col!==point.col||row!==point.row||trajectory.bounce_count!==point.b){
      throw Error(`V4 physical path mismatch ${id}`);
    }
    trajectory.id=id;
    if(mvpActive())trajectory.mvpOutcome={id:point.id,kind:point.kind,value:point.value};
    return prepare(trajectory);
  };
  const v4Start=(catalog)=>({x:1-catalog.radius*1.8,y:1-catalog.radius*1.8});
  return {enabled,has:lines=>window.BalloroBonusUI?.isV4?v4Cache.has(lines):cache.has(lines),
    load(lines){
      if(window.BalloroBonusUI?.isV4){
        if(v4Cache.has(lines))return Promise.resolve();
        if(window.BalloroV4LocalCatalogs?.[lines]) {
          if(!pending.has(lines)) {
            const bytes=Uint8Array.from(atob(window.BalloroV4LocalCatalogs[lines]), c=>c.charCodeAt(0));
            pending.set(lines,new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')))
              .json().then(data=>{v4Cache.set(lines,data);})
              .catch(error=>{pending.delete(lines);throw error;}));
          }
          return pending.get(lines);
        }
        if(!pending.has(lines))pending.set(lines,
          fetch(`math/prototype-paths/v4-${lines}.json.gz`).then(r=>{
            if(!r.ok)throw Error('V4 physical paths unavailable');
            return new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json();
          }).then(data=>{v4Cache.set(lines,data);}).catch(error=>{pending.delete(lines);throw error;}));
        return pending.get(lines);
      }
      if(cache.has(lines))return Promise.resolve();
      if(!pending.has(lines))pending.set(lines,Promise.all([
        fetch(`math/prototype-paths/${lines}.json.gz`).then(r=>{if(!r.ok)throw Error('Path library unavailable');return new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json();}),
        window.BalloroBonusUI?.isV3
          ? fetch(`math/prototype-paths/v3-${lines}.json.gz`).then(r=>{if(!r.ok)throw Error('V3 pocket paths unavailable');return new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json();})
          : Promise.resolve(null)
      ]).then(([data,v3])=>{cache.set(lines,data);if(v3)v3Cache.set(lines,v3);}).catch(error=>{pending.delete(lines);throw error;}));
      return pending.get(lines);
    },
    field(lines,start,unit){
      const key=start?`${Math.round((start.x+1)*lines/2-.5)}_${Math.round((start.y+1)*lines/2-.5)}`:'main';
      const pool=cache.get(lines)?.pools[key];
      if(!pool?.length)throw Error(`Missing saved path pool ${lines}/${key}`);
      const t=structuredClone(pool[Math.floor(unit*pool.length)]);
      t.target_category='physical';t.recent_usage_count=0;t.stagger_delay=0;
      return t;
    },
    fieldV3(lines,unit,variantUnit){
      if(window.BalloroBonusUI?.isV4){
        const catalog=v4Cache.get(lines);
        if(!catalog)throw Error(`Missing V4 path library ${lines}`);
        if(mvpActive()){
          const item=mvpPick(mvpModel(lines).main,`${lines}/main`,unit);
          return v4Hydrate(lines,catalog,item,v4Start(catalog),`mvp-${item.id}`);
        }
        const weights=v4Rules().pocketWeights;
        let target='neutral',threshold=0;
        for(const kind of ['blue','lemon','crown','diamond']){
          threshold+=weights[kind];
          if(unit<threshold){target=kind;break;}
        }
        if(target!=='neutral'){
          // Catalogs remain untouched: use the existing physical corner pool.
          const cell=v4Rules().pocketCells(lines)[target];
          const poolKind=window.BalloroV3Rules.pocketKindAt(lines,cell.col,cell.row);
          const {item,index}=v4Pick(catalog.pockets[poolKind],`${lines}/main/${target}`,variantUnit,true);
          return v4Hydrate(lines,catalog,item,v4Start(catalog),`v4-${lines}-main-${target}-${index}`);
        }
        const {tier,indexUnit}=chooseWeighted(catalog.neutral,v4Rules().neutralTierWeights[lines],variantUnit);
        const {item,index}=v4Pick(catalog.neutral[tier],`${lines}/main/${tier}`,indexUnit,true);
        return v4Hydrate(lines,catalog,item,v4Start(catalog),`v4-${lines}-main-${tier}-${index}`);
      }
      const source=cache.get(lines),catalog=v3Cache.get(lines);
      if(!source||!catalog)throw Error(`Missing V3 path library ${lines}`);
      const weights=window.BalloroV3Rules.pocketWeights;
      let target='neutral',threshold=0;
      for(const kind of ['blue','lemon','crown','diamond']){
        threshold+=weights[kind];
        if(unit<threshold){target=kind;break;}
      }
      if(target!=='neutral'){
        const pool=catalog.pockets[target];
        if(!pool?.length)throw Error(`Missing V3 ${lines}/${target} paths`);
        return prepare(pool[Math.min(pool.length-1,Math.floor(variantUnit*pool.length))]);
      }
      const {tier,indexUnit}=chooseWeighted(catalog.neutralTierIndices,
        window.BalloroV3Rules.neutralTierWeights[lines],variantUnit);
      const indices=catalog.neutralTierIndices[tier];
      const index=Math.min(indices.length-1,Math.floor(indexUnit*indices.length));
      const path=indices[index]<0
        ? catalog.neutralCenterPaths[-indices[index]-1]
        : source.pools.main[indices[index]];
      return prepare(path);
    },
    fieldV3Release(lines,start,unit){
      if(window.BalloroBonusUI?.isV4){
        const catalog=v4Cache.get(lines);
        const col=Math.round((start.x+1)*lines/2-.5);
        const row=Math.round((start.y+1)*lines/2-.5);
        const kind=v4Rules().pocketKindAt(lines,col,row);
        if(mvpActive()){
          const item=mvpPick(mvpModel(lines).release[kind],`${lines}/release/${kind}`,unit);
          return v4Hydrate(lines,catalog,item,start,`mvp-${item.id}`);
        }
        const groups=catalog?.release[kind];
        if(!groups)throw Error(`Missing V4 release paths ${lines}/${kind}`);
        const {tier,indexUnit}=chooseWeighted(groups,v4Rules().releaseTierWeights,unit);
        const {item,index}=v4Pick(groups[tier],`${lines}/release/${kind}/${tier}`,indexUnit,true);
        // Rotate the same physical launch parameters with the relocated pocket.
        // No new paths, endpoint corrections or selection weights are introduced.
        const oldCell=window.BalloroV3Rules.pocketCells(lines)[kind];
        const oldAngle=Math.atan2(oldCell.row-(lines-1)/2,oldCell.col-(lines-1)/2);
        const newAngle=Math.atan2(row-(lines-1)/2,col-(lines-1)/2);
        const turn=newAngle-oldAngle;
        const cos=Math.round(Math.cos(turn)),sin=Math.round(Math.sin(turn));
        const mid=(lines-1)/2,dx=item.col-mid,dy=item.row-mid;
        const rotated={...item,a:item.a+turn*180/Math.PI,
          col:Math.round(mid+dx*cos-dy*sin),row:Math.round(mid+dx*sin+dy*cos)};
        return v4Hydrate(lines,catalog,rotated,start,`v4-${lines}-release-${kind}-${tier}-${index}`);
      }
      const source=cache.get(lines),catalog=v3Cache.get(lines);
      const key=`${Math.round((start.x+1)*lines/2-.5)}_${Math.round((start.y+1)*lines/2-.5)}`;
      const groups=catalog?.releaseTierIndices?.[key];
      if(!source||!groups)throw Error(`Missing V3 release paths ${lines}/${key}`);
      const {tier,indexUnit}=chooseWeighted(groups,window.BalloroV3Rules.releaseTierWeights,unit);
      const indices=groups[tier];
      return prepare(source.pools[key][indices[Math.min(indices.length-1,Math.floor(indexUnit*indices.length))]]);
    },
    roomV3(lines,id,unit){
      if(window.BalloroBonusUI?.isV4){
        const catalog=v4Cache.get(lines);
        if(mvpActive()){
          const item=mvpPick(mvpModel(lines).rooms[id],`${lines}/room/${id}`,unit);
          const frames=window.BalloroV4RoomPaths.simulate(item.a,item.f,item.d,catalog.radius);
          frames.mvpOutcome={id:item.id,value:item.value,col:item.col,row:item.row};
          return frames;
        }
        const groups=catalog?.rooms[id];
        if(!groups)throw Error(`Missing V4 room paths ${lines}/${id}`);
        const {tier,indexUnit}=chooseWeighted(groups,{center:v4Rules().roomCenterWeight,
          side:1-v4Rules().roomCenterWeight},unit);
        const {item}=v4Pick(groups[tier],`${lines}/room/${id}/${tier}`,indexUnit,true);
        return window.BalloroV4RoomPaths.simulate(item.a,item.f,item.d,catalog.radius);
      }
      const source=cache.get(lines),catalog=v3Cache.get(lines);
      const groups=catalog?.roomTierIndices?.[id];
      if(!source||!groups)throw Error(`Missing V3 room paths ${lines}/${id}`);
      const {tier,indexUnit}=chooseWeighted(groups,{center:window.BalloroV3Rules.roomCenterWeight,
        side:1-window.BalloroV3Rules.roomCenterWeight},unit);
      const indices=groups[tier];
      return source.rooms[indices[Math.min(indices.length-1,Math.floor(indexUnit*indices.length))]];
    },
    yellowV2Plan(lines,start,randomUnit){
      if(!mvpActive())return null;
      const trajectory=this.fieldV3Release(lines,start,randomUnit());
      const outcome=trajectory.mvpOutcome;
      const boosted=!outcome.kind&&randomUnit()<window.BalloroMvpMath.yellowHitProbability;
      const end=trajectory.landing_point;
      const cell={col:Math.max(0,Math.min(lines-1,Math.floor((end.x+1)*lines/2))),
        row:Math.max(0,Math.min(lines-1,Math.floor((end.y+1)*lines/2)))};
      const candidates=[];
      for(let row=0;row<lines;row++)for(let col=0;col<lines;col++){
        if(!v4Rules().pocketKindAt(lines,col,row)
          &&(col!==cell.col||row!==cell.row))candidates.push({col,row});
      }
      const cells=boosted?[cell]:[];
      while(cells.length<lines){
        const index=Math.min(candidates.length-1,Math.floor(randomUnit()*candidates.length));
        cells.push(candidates.splice(index,1)[0]);
      }
      return {trajectory,boosted,cells:cells.map(point=>({...point,
        multiplier:v4Rules().cellMultiplier(lines,point.col,point.row)*v4Rules().yellowMultiplier}))};
    },
    mathModel(lines){return mvpActive()?mvpModel(lines):null;},
    room(lines,unit){return cache.get(lines).rooms[Math.floor(unit*cache.get(lines).rooms.length)];}
  };
})();
