/* Shared by the offline recorder and the opt-in browser player. No game rules here. */
(function(root){
  'use strict';
  const keys=['crownsCollected','x10BoostActivated','crownBonusAwarded','multiPlusActive',
    'multiPlusFinalCells','multiPlusToken','multiPlusActivatedAt','multiPlusPhase',
    'multiPlusRevealStartedAt','multiPlusNeonCells','multiPlusNeonLastStepAt','multiPlusNeonFlashUntil',
    'fieldPocket','bluePocket','chancePocket','chancePhase','chanceSpinStartedAt','chanceSpinRoomIndex',
    'chanceSpinTotalSteps','chanceSelectedRoomId','chanceRoomMultipliers','chanceRoomOutcome',
    'pucks','settledCells','wonLines','bonusStars','secretRoomLaunchAt','roundWinAmount'];
  const omitted=new Set(['replayTrajectory','savedFrames','authoritativeResult','pocketReleasePlan']);
  const coords=new Set(['x','y','vx','vy','speed','radius','previousX','previousY','targetX','targetY','startX','startY']);
  function copy(value){
    return JSON.parse(JSON.stringify(value,(k,v)=>omitted.has(k)?undefined:v));
  }
  function snapshot(state,time){
    const data={};for(const k of keys)data[k]=state[k];
    data.roundOutcome={seed:state.roundOutcome?.seed,bonus_triggered:state.roundOutcome?.bonus_triggered};
    data.chanceCompletedRoomIds=[...state.chanceCompletedRoomIds];
    data.openSecretZones=[...state.openSecretZones];
    data.secretZoneOpenTimes=state.secretZoneOpenTimes;
    data.chanceCapturedPuck=state.pucks.indexOf(state.chanceCapturedPuck);
    data.multiPlusCapturedPuck=state.pucks.indexOf(state.multiPlusCapturedPuck);
    return {t:time-10000,data:copy(data)};
  }
  function transform(value,scale,bet,start,speed,spatial=false,key=''){
    if(typeof value==='number'){
      if(/(At|Until)$/.test(key)&&value>0)return start+(value-10000)/speed;
      if(['payout','basePayout','roundWinAmount'].includes(key))return value*bet;
      if(spatial&&coords.has(key))return value*scale;
      return value;
    }
    if(Array.isArray(value))return value.map(v=>transform(v,scale,bet,start,speed,spatial));
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,transform(v,scale,bet,start,speed,spatial,k)]));
    return value;
  }
  function apply(state,frame,{half,bet,start,speed=1}){
    const d=frame.data;
    for(const k of keys){
      const value=transform(d[k],half/300,bet,start,speed,['pucks','multiPlusToken','bonusStars'].includes(k),k);
      if(k==='pucks'){
        // Stable object identity is required by the existing win-effect renderer.
        state.pucks.length=value.length;
        value.forEach((p,i)=>{const old=state.pucks[i]||{};Object.keys(old).forEach(k=>delete old[k]);Object.assign(old,p);state.pucks[i]=old;});
      }else state[k]=value;
    }
    state.roundOutcome=copy(d.roundOutcome);
    state.chanceCompletedRoomIds=new Set(d.chanceCompletedRoomIds);
    state.openSecretZones=new Set(d.openSecretZones);
    state.secretZoneOpenTimes=Object.fromEntries(Object.entries(d.secretZoneOpenTimes).map(([k,v])=>[k,start+(v-10000)/speed]));
    state.chanceCapturedPuck=state.pucks[d.chanceCapturedPuck]||null;
    state.multiPlusCapturedPuck=state.pucks[d.multiPlusCapturedPuck]||null;
  }
  const api={snapshot,apply};
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.BalloroTapeCodec=api;
})(typeof globalThis==='object'?globalThis:this);
