'use strict';
// Opt-in, local-demo playback. No collision detection, trajectory planning or
// payout decisions take place while a recorded round is being displayed.
window.BalloroRoundTapes=(()=>{
  const params=new URLSearchParams(location.search);
  const enabled=params.get('recordedRounds')==='1' && params.get('pocketExperiment')!=='1';
  let busy=false,current=null,preparePromise=null,preparedSlot=null;
  let publicCatalogPromise=null,publicSignaturesPromise=null;
  const blueActivationHoldMs=350;
  const recentPublicVariants=new Map();
  function publicPathTooSimilar(first,second,signatures){
    if(first===second)return true;
    const a=signatures?.[first],b=signatures?.[second];
    if(!a||!b||a.length!==b.length)return false;
    let sum=0;
    for(let i=0;i<a.length;i++)sum+=(a[i][0]-b[i][0])**2+(a[i][1]-b[i][1])**2;
    const rms=Math.sqrt(sum/a.length);
    const endpoint=Math.hypot(a.at(-1)[0]-b.at(-1)[0],a.at(-1)[1]-b.at(-1)[1]);
    return rms<=180||(endpoint<=55&&rms<=300);
  }
  async function selectPublicRound(lines,balls,mode,progress){
    if(mode!=='v2')throw Error('Публичный тест записанных раундов доступен только для V2');
    publicCatalogPromise ||= fetch('math/round-tapes-v2-stopped/manifest.json',{
      signal:AbortSignal.timeout(15000)
    }).then(response=>{
      if(!response.ok)throw Error('Публичная библиотека раундов недоступна');
      return response.json();
    });
    const catalog=await publicCatalogPromise;
    const profile=`p${Number(progress.diamond===4)}r${Number(progress.crown===2)}y${Number(progress.lemon===1)}`;
    const config=catalog.configurations.find(item=>item.lines===lines&&item.balls===balls&&item.profile===profile);
    if(!config)throw Error('Не найдена запись для текущего состояния бонусов');
    const unit=crypto.getRandomValues(new Uint32Array(2));
    const draw=(unit[0]*4294967296+unit[1]) / 18446744073709551616;
    let total=0,selected=null;
    for(const scenario of config.scenarios){
      total+=scenario.probability;
      if(draw<total){selected=scenario;break;}
    }
    selected ||= config.scenarios.at(-1);
    const variants=catalog.neutralVariants?.[String(lines)];
    if(variants?.length&&selected.payout===0&&selected.pickups?.length===0
      &&!selected.red&&!selected.yellow&&!selected.blue&&!selected.x10){
      publicSignaturesPromise ||= fetch('math/round-tapes-v2-stopped/neutral-path-signatures.json')
        .then(response=>response.ok?response.json():{signatures:{}})
        .then(data=>data.signatures||{}).catch(()=>({}));
      const signatures=await publicSignaturesPromise;
      const key=`${lines}-${profile}`,recent=recentPublicVariants.get(key)||[];
      const safe=variants.filter(item=>recent.every(previous=>
        !publicPathTooSimilar(item.id,previous,signatures)));
      const pool=safe.length?safe:variants.filter(item=>!recent.includes(item.id));
      const random=crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
      selected=(pool.length?pool:variants)[Math.floor(random*(pool.length||variants.length))];
      recent.push(selected.id);
      if(recent.length>3)recent.shift();
      recentPublicVariants.set(key,recent);
    }
    return {expectedRtp:config.expectedRtp,configurationHash:config.configurationHash,
      scenario:{id:selected.id,sha256:selected.sha256,payout:selected.payout}};
  }
  function replayDiamondPickupEffect(star,collectedBefore){
    if(!star||!Number.isFinite(star.x)||!Number.isFinite(star.y))return;
    const scale=state.field.half/300;
    const fieldStar={x:star.x*scale,y:star.y*scale,radius:(star.radius||8)*scale};
    spawnCounterFlyIn('diamond',toScreen(fieldStar.x,fieldStar.y),
      getCrownCounterTargetPoint(collectedBefore||0),fieldStar.radius);
    spawnStarBurst(fieldStar,'purple');
  }
  function replayV2PocketPickup(kind,x,y,radius,onArrival){
    const scale=state.field.half/300;
    recordV2PocketPickup(kind,x*scale,y*scale,radius*scale,onArrival);
  }
  const sounds={playLaunchSound,playWallHitSound,playPocketDropSound,playMultiplierResultSound,
    playBonusStarSound,playBonusCompleteSound,playMultiPlusSound,playMultiPlusNeonCue,
    playChanceSpinTick,recordDiamondPickupEffect:replayDiamondPickupEffect,
    recordV2PocketPickup:replayV2PocketPickup};
  async function load(scenario,lines,balls){
    const directory=window.BalloroBonusUI?.isV2?'round-tapes-v2-stopped':'round-tapes';
    const r=await fetch(`math/${directory}/${scenario.id}.json.gz`,{signal:AbortSignal.timeout(15000)});
    if(!r.ok)throw Error('Не удалось загрузить запись раунда');
    const bytes=await r.arrayBuffer();
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
    if(hash!==scenario.sha256)throw Error('Повреждена запись раунда');
    const tape=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json();
    if(tape.version!==1||tape.lines!==lines||tape.balls!==balls||tape.id!==scenario.id
      ||Math.abs(tape.payout-scenario.payout)>1e-8||!tape.frames.length
      ||Math.abs(tape.frames.at(-1).data.roundWinAmount-tape.payout)>1e-8)throw Error('Запись и исход не совпадают');
    return tape;
  }
  function updateFrame(frame){
    const mappedStart=current.segmentWallStart-current.segmentTapeStart/current.speed;
    BalloroTapeCodec.apply(state,frame,{half:state.field.half,bet:current.bet,start:mappedStart,speed:current.speed});
    // Recorded V2 tapes already include the symbol's full flight before any
    // bonus phase starts. Their visual state is authoritative: a second client
    // gate can hide the purple field, red sink and yellow chase on quick play.
    state.bankroll=current.bank-current.stake+state.roundWinAmount;
    updateBank();updateRoundWinLabel();updateCrownCounter();updateMultiPlusCounter();
    updateChanceBonusCounter();updatePocketBonusCounter();render();
  }
  function playDueEvents(){
    const tape=current.tape;
    while(current.event<tape.events.length&&tape.events[current.event].t<=current.elapsed){
      const event=tape.events[current.event++];
      if(event.name==='recordV2PocketPickup'){
        const round=current;
        // The recorded ball is fully inside the pocket one frame after this
        // event; its waves are already in the tape. No synthetic second entry.
        setTimeout(()=>{
          if(current!==round)return;
          replayV2PocketPickup(...event.args);
        },35);
        continue;
      }
      if(event.name==='recordV2PocketPickup'||current.elapsed-event.t<250*current.speed)
        sounds[event.name]?.(...event.args);
    }
  }
  function show(now){
    if(!current)return;
    try{
      if(current.chanceCueUntil){
        if(now<current.chanceCueUntil){
          current.lastNow=now;
          render();
          requestAnimationFrame(show);
          return;
        }
        current.chanceCueUntil=0;
        state.chanceFinalCueUntil=0;
        current.lastNow=now;
      }
      if(current.blueCueUntil){
        if(now<current.blueCueUntil){
          current.lastNow=now;
          render();
          requestAnimationFrame(show);
          return;
        }
        current.blueCueUntil=0;
        current.lastNow=now;
      }
      const tape=current.tape;
      const delta=Math.max(0,now-current.lastNow);
      current.lastNow=now;
      current.elapsed+=delta*current.speed;
      const previousFrame=current.frame;
      while(current.frame+1<tape.frames.length&&tape.frames[current.frame+1].t<=current.elapsed)current.frame++;
      let cueFrame=-1;
      for(let index=previousFrame+1;index<=current.frame;index+=1){
        if(tape.frames[index-1].data.chancePhase==='spinning'
          &&tape.frames[index].data.chancePhase!=='spinning'
          &&current.chanceCueFrame!==index){cueFrame=index;break;}
      }
      if(cueFrame>=0){
        current.frame=cueFrame;
        current.elapsed=tape.frames[cueFrame].t;
        current.chanceCueFrame=cueFrame;
        current.chanceCueUntil=now+280;
        updateFrame(tape.frames[cueFrame-1]);
        state.chancePhase='final_cue';
        state.chanceSelectedRoomId=tape.frames[cueFrame].data.chanceSelectedRoomId
          ||tape.frames[cueFrame-1].data.chanceSelectedRoomId;
        state.chanceFinalCueStartedAt=now;
        state.chanceFinalCueUntil=current.chanceCueUntil;
        state.chanceFinalCueRoomId=state.chanceSelectedRoomId;
        playDueEvents();
        render();
        requestAnimationFrame(show);
        return;
      }
      let blueCueFrame=-1;
      if(window.BalloroBonusUI?.isV2){
        for(let index=previousFrame+1;index<=current.frame;index+=1){
          const before=tape.frames[index-1].data,after=tape.frames[index].data;
          if(!before.bluePocket?.finished&&after.bluePocket?.finished
            &&before.pucks.length<after.pucks.length&&after.pucks.length>=3
            &&current.blueCueFrame!==index){blueCueFrame=index;break;}
        }
      }
      if(blueCueFrame>=0){
        current.frame=blueCueFrame;
        current.elapsed=tape.frames[blueCueFrame].t;
        current.blueCueFrame=blueCueFrame;
        current.blueCueUntil=now+blueActivationHoldMs;
        updateFrame(tape.frames[blueCueFrame-1]);
        render();
        requestAnimationFrame(show);
        return;
      }
      const nextSpeed=window.BalloroQuickPlayTiming.recordedFrameSpeed(tape.frames[current.frame].data,state.quickPlay);
      if(nextSpeed!==current.speed){
        current.speed=nextSpeed;
        current.segmentTapeStart=current.elapsed;
        current.segmentWallStart=now;
      }
      playDueEvents();
      updateFrame(tape.frames[current.frame]);
      if(current.elapsed>=tape.duration){
        const expected=tape.payout*current.bet;
        if(Math.abs(state.roundWinAmount-expected)>1e-7)throw Error('Выплата не совпала с записью');
        state.bankroll=current.bank-current.stake+expected;
        busy=false;
        settleRound(); // History/UI only; recorded final results are already settled.
        current=null;
      }else requestAnimationFrame(show);
    }catch(error){fail(error);}
  }
  function fail(error){
    console.error(error);
    if(current)state.bankroll=current.bank;
    busy=false;current=null;preparePromise=null;preparedSlot=null;state.running=false;
    resetPucks({force:true});updateBank();updateBetButtons();render();
    alert(`Тест записанных раундов: ${error.message}. Ставка не списана.`);
  }
  async function prepare(slot){
    if(state.running)return false;
    if(current&&preparedSlot===slot)return true;
    if(preparePromise)return preparePromise;
    if(state.layoutMode!=='configurator_5'){alert('Записанный тест доступен только для конфигурации 5.');return;}
    const lines=GRID_SIZE,balls=state.puckCount,bet=parseBet(slot),stake=bet*balls,bank=state.bankroll;
    if(!(bet>=.75&&bet<=1000))return false;
    if(bank<stake){openPopup(els.topUpPopup);return false;}
    busy=true;state.launchPrepared=true;state.launchPreparedSlot=slot;updateBetButtons();
    preparePromise=(async()=>{try{
      const progress=state.v2BonusProgress;
      const mode=window.BalloroBonusUI?.isV2?'v2':'legacy';
      let config;
      if(window.BalloroStaticRecordedMode){
        config=await selectPublicRound(lines,balls,mode,progress);
      }else{
        const response=await fetch(`/api/recorded-round?lines=${lines}&balls=${balls}&bonusUI=${mode}&diamond=${progress.diamond}&crown=${progress.crown}&lemon=${progress.lemon}`,{cache:'no-store',signal:AbortSignal.timeout(15000)});
        if(!response.ok)throw Error('Локальный сервер выбора раундов недоступен');
        config=await response.json();
      }
      const selected=config.scenario;
      const configBytes=new TextEncoder().encode(JSON.stringify(getMathConfiguration()));
      const configHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',configBytes)),v=>v.toString(16).padStart(2,'0')).join('');
      if(configHash!==config.configurationHash)throw Error('Математика поля изменилась: библиотеку нужно пересоздать');
      const tape=await load(selected,lines,balls);
      resetPucks({force:true});setupCanvas();
      state.activeSlot=slot;state.activeBetPerPuck=bet;
      state.launchPrepared=true;state.launchPreparedSlot=slot;
      const speed=window.BalloroQuickPlayTiming.recordedFrameSpeed(tape.frames[0].data,state.quickPlay);
      current={tape,bet,stake,bank,start:0,speed,frame:0,event:0,elapsed:0,lastNow:0,
        chanceCueFrame:-1,chanceCueUntil:0,blueCueFrame:-1,blueCueUntil:0,
        segmentTapeStart:0,segmentWallStart:0};
      preparedSlot=slot;
      state.recordedRound={id:selected.id,expectedPayout:tape.payout*bet,expectedRtp:config.expectedRtp};
      updateFrame(tape.frames[0]);updateBetButtons();render();
      return true;
    }catch(error){fail(error);return false;}finally{preparePromise=null;}})();
    return preparePromise;
  }
  async function launch(slot){
    if(state.running)return;
    if(!await prepare(slot))return;
    if(!current||preparedSlot!==slot)return;
    stopLaunchPrimeAnimation({rerender:false});
    state.running=true;state.launchPrepared=false;state.launchPreparedSlot=null;
    state.roundId++;
    if(state.autoPlay&&Number.isFinite(state.autoRoundsRemaining))state.autoRoundsRemaining=Math.max(0,state.autoRoundsRemaining-1);
    const start=performance.now();
    current.start=start;current.lastNow=start;current.segmentWallStart=start;
    preparedSlot=null;
    updateBetButtons();
    requestAnimationFrame(show);
  }
  if(enabled){
    document.title='Balloro X · записанные раунды · тест';
    for(const [language,translation] of Object.entries(TRANSLATIONS)){
      translation.ruleLaunchTitle=language==='ru'?'Тест записанных раундов':'Recorded-round pilot';
      translation.ruleLaunchText=language==='ru'
        ?'Полный записанный раунд выбирается заранее. В V2 бонусы накапливаются между раундами; расчётный долгосрочный RTP 97,45% не является сертификацией. Это демо без реальных ставок.'
        :'A complete prerecorded round is selected before launch. V2 bonuses accumulate across rounds; the estimated long-run RTP of 97.45% is not certified. This is a demo without real wagers.';
      if(window.BalloroBonusUI?.isV2){
        translation.rulePocketTitle=language==='ru'?'Накопление символов':'Collecting symbols';
        translation.rulePocketFieldText=language==='ru'
          ?'Фиолетовая луза даёт алмаз, красная — огонёк, жёлтая — звезду, зелёная — кактус. Каждая луза даёт не больше одного символа за раунд. Бонус запускается, когда символ долетает до счётчика.'
          :'Purple, red, yellow and green pockets award their matching symbols. Each pocket gives at most one symbol per round. The bonus starts when its symbol reaches the meter.';
        translation.ruleBoostText=language==='ru'
          ?'X10 BOOST запускается после 5 алмазов; LUCKY SHOT — после 3 огоньков; EX MULTI — после 2 звёзд; X3 BALLS — после 1 кактуса. Заполненный счётчик опустеет, когда бонусные шары остановятся.'
          :'X10 BOOST starts after 5 diamonds, LUCKY SHOT after 3 fires, EX MULTI after 2 stars and X3 BALLS after 1 cactus. The full meter clears once the bonus balls stop.';
      }
    }
    document.querySelectorAll('[data-i18n="ruleLaunchTitle"], [data-i18n="ruleLaunchText"], [data-i18n="rulePocketTitle"], [data-i18n="rulePocketFieldText"], [data-i18n="ruleBoostText"]').forEach(e=>e.textContent=t(e.dataset.i18n));
  }
  return {enabled,get busy(){return busy;},get playbackSpeed(){return current?.speed||1;},prepare,launch};
})();
