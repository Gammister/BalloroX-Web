'use strict';
window.BalloroSavedPaths = (()=>{
  const cache=new Map(),pending=new Map();
  const params=new URLSearchParams(location.search);
  const enabled=params.get('savedPaths')==='1'||params.get('pocketExperiment')==='1';
  return {enabled,has:lines=>cache.has(lines),
    load(lines){
      if(cache.has(lines))return Promise.resolve();
      if(!pending.has(lines))pending.set(lines,fetch(`math/prototype-paths/${lines}.json.gz`).then(r=>{if(!r.ok)throw Error('Path library unavailable');return new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json();}).then(data=>{cache.set(lines,data);}).catch(error=>{pending.delete(lines);throw error;}));
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
    room(lines,unit){return cache.get(lines).rooms[Math.floor(unit*cache.get(lines).rooms.length)];}
  };
})();
