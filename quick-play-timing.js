(function(root){
  'use strict';
  const CHANCE_PREPARATION_PHASES=new Set(['capturing','captured','sinking','spinning','final_cue']);
  const MULTI_PREPARATION_PHASES=new Set(['capturing','captured','revealing']);
  const BLUE_PREPARATION_PHASES=new Set(['capturing','pocket_wait']);

  function hasFastBonusShot(data={}){
    return (data.pucks||[]).some(puck=>{
      if(puck?.stopped)return false;
      const secretPhase=puck?.secretRoom?.phase;
      const chancePhase=puck?.chance?.phase;
      if(puck?.pocketRelease&&(puck?.speed||0)>0&&secretPhase!=='capturing')return true;
      return chancePhase==='inside';
    });
  }

  function isBonusPreparation(data={}){
    // A released bonus ball has priority over another ball that is still parked
    // in the blue pocket. Otherwise the whole recorded frame incorrectly stays x1.
    if(hasFastBonusShot(data))return false;
    if(CHANCE_PREPARATION_PHASES.has(data.chancePhase))return true;
    if(MULTI_PREPARATION_PHASES.has(data.multiPlusPhase))return true;
    return (data.pucks||[]).some(puck=>
      CHANCE_PREPARATION_PHASES.has(puck?.chance?.phase)
      || BLUE_PREPARATION_PHASES.has(puck?.secretRoom?.phase)
      || Boolean(puck?.multiPlusCapture));
  }

  function recordedFrameSpeed(data,quickPlay){
    if(!quickPlay)return 1;
    return isBonusPreparation(data)?1:3;
  }

  function preparationStep(baseStep,quickPlay){
    return baseStep/(quickPlay?3:1);
  }

  const api={hasFastBonusShot,isBonusPreparation,recordedFrameSpeed,preparationStep};
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.BalloroQuickPlayTiming=api;
})(typeof globalThis==='object'?globalThis:this);
