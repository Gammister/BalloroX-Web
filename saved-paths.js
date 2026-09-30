'use strict';
window.BalloroSavedPaths = (()=>{
  const cache=new Map(),pending=new Map(),v3Cache=new Map();
  const params=new URLSearchParams(location.search);
  const enabled=params.get('savedPaths')==='1'||params.get('pocketExperiment')==='1';
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
  return {enabled,has:lines=>cache.has(lines),
    load(lines){
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
      const source=cache.get(lines),catalog=v3Cache.get(lines);
      const key=`${Math.round((start.x+1)*lines/2-.5)}_${Math.round((start.y+1)*lines/2-.5)}`;
      const groups=catalog?.releaseTierIndices?.[key];
      if(!source||!groups)throw Error(`Missing V3 release paths ${lines}/${key}`);
      const {tier,indexUnit}=chooseWeighted(groups,window.BalloroV3Rules.releaseTierWeights,unit);
      const indices=groups[tier];
      return prepare(source.pools[key][indices[Math.min(indices.length-1,Math.floor(indexUnit*indices.length))]]);
    },
    roomV3(lines,id,unit){
      const source=cache.get(lines),catalog=v3Cache.get(lines);
      const groups=catalog?.roomTierIndices?.[id];
      if(!source||!groups)throw Error(`Missing V3 room paths ${lines}/${id}`);
      const {tier,indexUnit}=chooseWeighted(groups,{center:window.BalloroV3Rules.roomCenterWeight,
        side:1-window.BalloroV3Rules.roomCenterWeight},unit);
      const indices=groups[tier];
      return source.rooms[indices[Math.min(indices.length-1,Math.floor(indexUnit*indices.length))]];
    },
    room(lines,unit){return cache.get(lines).rooms[Math.floor(unit*cache.get(lines).rooms.length)];}
  };
})();
