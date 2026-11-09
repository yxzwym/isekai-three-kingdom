(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports,D=node?require('./world-data.js'):root.WorldData,E=node?require('./engine.js'):root.BattleEngine,R=node?require('./game-rules.js'):root.PengpaiRules,W=node?require('./weapon-skills.js'):root.WeaponSkills;
  const I=node?require('./items.js'):root.ItemCatalog,N=node?require('./nearby-content.js'):root.NearbyContent;
  const G=node?require('./character-growth.js'):root.CharacterGrowth,Scenes=node?require('./battle-scenes.js'):root.BattleScenes;
  const F=node?require('./proficiency.js'):root.WeaponProficiency,H=node?require('./hero-quests.js'):root.HeroQuests;
  const Optional=node?require('./optional-battles.js'):root.OptionalBattles;
  const Recruitment=node?require('./recruitment-content.js'):root.RecruitmentContent,Puzzle=node?require('./minigames.js'):root.SlidingPuzzle;
  const Courts=node?require('./courts.js'):root.FactionCourts,Tavern=node?require('./tavern.js'):root.TavernRecruitment;
  const Story=node?require('./story-rules.js'):root.StoryRules;
  const Feedback=node?require('./adventure-feedback.js'):root.AdventureFeedback;
  const Chapter=node?require('./chapter-one.js'):root.ChapterOne;if(node){require('./early-dungeons.js');require('./dialogue-voices.js');}
  const Progression=node?require('./quest-progression.js'):root.QuestProgression;
  const X=node?require('./experience.js'):root.CharacterExperience,Q=node?require('./timed-choice.js'):root.TimedChoice;
  const copy=x=>JSON.parse(JSON.stringify(x)),countries=['wei','shu','wu'],recruitCountries=[...countries,'other','yellow'],placeId=id=>Object.hasOwn(D.placeAliases,id)?D.placeAliases[id]:id,neighbors=id=>D.roads.flatMap(([a,b])=>a===id?[b]:b===id?[a]:[]),safeObject=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  function shortestRoute(from,to){
    if(!D.placeMap[from]||!D.placeMap[to]||D.placeMap[from].requiresWater||D.placeMap[to].requiresWater)return null;
    const distance=new Map([[from,0]]),previous=new Map(),open=new Set([from]);
    while(open.size){const current=[...open].reduce((a,b)=>distance.get(a)<=distance.get(b)?a:b);open.delete(current);if(current===to)break;
      for(const next of neighbors(current)){if(D.placeMap[next].requiresWater)continue;const value=distance.get(current)+D.roadLength(current,next);if(value<(distance.get(next)??Infinity)){distance.set(next,value);previous.set(next,current);open.add(next);}}
    }
    if(!distance.has(to))return null;const nodes=[to];while(nodes[0]!==from)nodes.unshift(previous.get(nodes[0]));return {nodes,distance:distance.get(to)};
  }
  function heroUnit(character,state){
    character=G.characterAt(character);const stats=Object.fromEntries(R.ATTRIBUTES.map(([key])=>[key,E.attr(character.attributes?.[key])])),weapon=state.weapon?W.resolveWeapon(state.weapon):state.weaponType?{type:state.weaponType,name:D.weaponNames[state.weaponType],attack:10}:null;
    const unit={...character,id:'hero',name:character.name,...stats,level:character.level,weapon,weaponProficiencies:copy(character.weaponProficiencies||{}),equipment:copy(state.heroEquipment||{armor:{name:'布衣'}}),attack:weapon?10:0,armor:0,resistance:0,maxSoldiers:E.maxHealth(stats.constitution),skills:W.forWeapon(weapon),passives:[...(character.passives||[])],...safeObject(state.tactics?.hero)};
    Object.assign(unit,I.apply(unit));unit.condition=state.conditions?.hero;unit.dead=unit.condition==='dead';unit.startSoldiers=Math.max(0,Math.min(unit.maxSoldiers,Number(state.troops?.hero??unit.maxSoldiers)));unit.priorities=unit.priorities?.length&&unit.priorities.every(r=>unit.skills.includes(r.skill))?unit.priorities:W.prioritiesFor(unit.skills);
    if(root.PengpaiAssets?.protagonists[character.appearance]){const art=root.PengpaiAssets.protagonists[character.appearance];unit.fullbody={src:art.src};unit.portrait={src:art.src,crop:art.portrait};}
    return unit;
  }
  function normalizeRecruitHome(unit){const P=node?require('./passives.js'):root.BattlePassives;if(P.heroDefaults[unit.characterId||unit.id])unit.passives=P.forUnit(unit);if(unit.homeNode==='ye'&&H.definitions[unit.characterId||unit.id]?.country==='wei')unit.homeNode=Courts.definitions.wei.place;return unit;}
  function normalize(character,value={}){
    character=G.normalizeCharacter(character);const s=copy(safeObject(value));if(s.weaponCatalogVersion!==1&&s.weaponType){const C=node?require('./weapon-catalog.js'):root.WeaponCatalog;s.weaponType=C.legacyAliases[s.weaponType]||s.weaponType;}const nodeId=placeId(s.nodeId),used=new Set(),recruits={};for(const country of recruitCountries)recruits[country]=(Array.isArray(s.recruits?.[country])?s.recruits[country]:[]).filter(id=>{if(typeof id!=='string'||!id||used.has(id))return false;used.add(id);return true;});
    const companions=(Array.isArray(s.companions)?s.companions:[]).filter(u=>u&&typeof u.id==='string'&&u.id!=='hero').filter((u,i,a)=>a.findIndex(x=>x.id===u.id)===i).map(G.normalizeKnownPotentials).map(X.normalizeRecord).map(W.migrateWeaponPlan).map(normalizeRecruitHome),ids=new Set(['hero',...companions.map(u=>u.id)]);
    const activeLimit=Math.max(4,Math.min(7,Math.floor(Number(s.activeLimit)||4)));
    const active=(Array.isArray(s.activeIds)?s.activeIds:['hero']).filter((id,i,a)=>ids.has(id)&&a.indexOf(id)===i).slice(0,activeLimit);
    const state={version:3,activeLimit,weaponCatalogVersion:1,weapon:s.weapon?I.weaponRecord(s.weapon):null,conditions:copy(safeObject(s.conditions)),nodeId:Object.hasOwn(D.placeMap,nodeId)?nodeId:'camp',inside:Object.hasOwn(D.placeMap,nodeId)&&!!s.inside,weaponType:R.WEAPON_TYPES.some(t=>t.id===s.weaponType)?s.weaponType:null,visited:[...new Set(['camp',...(Array.isArray(s.visited)?s.visited.map(placeId).filter(id=>Object.hasOwn(D.placeMap,id)):[])])],steps:Math.max(0,Math.floor(Number(s.steps)||0)),lastEventStep:Number.isInteger(s.lastEventStep)?Math.max(0,s.lastEventStep):null,introStep:Number.isInteger(s.introStep)?Math.max(0,Math.min(2,s.introStep)):(Number(s.steps)>0||s.inside||(nodeId&&nodeId!=='camp')?2:0),seed:typeof s.seed==='string'?s.seed:character.name+':'+Object.values(character.attributes||{}).join('-'),recruits,companions,activeIds:active.length?active:['hero'],reserveOrder:(Array.isArray(s.reserveOrder)?s.reserveOrder:[]).filter((id,i,a)=>ids.has(id)&&a.indexOf(id)===i),troops:copy(safeObject(s.troops)),tactics:copy(safeObject(s.tactics))};
    if([1,2].includes(s.version)&&Number.isFinite(Number(state.troops.hero))){const previousConstitution=(character.legacyMaxHealth||E.maxHealth(character.attributes.constitution))/10,oldMax=s.version===1?Math.max(1,Math.round(200*previousConstitution/255)):previousConstitution*10;state.troops.hero=Math.floor(E.maxHealth(character.attributes.constitution)*Math.min(1,Number(state.troops.hero)/oldMax));}
    state.inside=Object.hasOwn(D.placeMap,nodeId)&&!!s.inside&&!D.placeMap[state.nodeId].requiresWater;
    for(const u of companions)if(u.weaponPlanMigrated){if(state.tactics[u.id])delete state.tactics[u.id].priorities;delete u.weaponPlanMigrated;}
    state.story={items:copy(safeObject(s.story?.items)),flags:copy(safeObject(s.story?.flags))};state.courtDreams=copy(safeObject(s.courtDreams));state.chapterOne=Chapter.normalize(s.chapterOne);state.tavern=Tavern.normalize(s.tavern,state.seed);state.releasedRetainers=[...new Set((Array.isArray(s.releasedRetainers)?s.releasedRetainers:[]).filter(id=>typeof id==='string'&&id.startsWith('retainer-')))];state.tavern.candidates=state.tavern.candidates.filter(u=>!state.releasedRetainers.includes(u.id));
    state.trainingWins=Object.fromEntries(D.trainingOptions.map(t=>[t.id,Math.max(0,Math.floor(Number(s.trainingWins?.[t.id])||0))]));
    state.recruitReports=Object.fromEntries(countries.map(country=>[country,[...new Set((Array.isArray(s.recruitReports?.[country])?s.recruitReports[country]:[]).filter(id=>state.recruits[country].includes(id)))]]));
    const stages=['available','entry','supplies','rescue','escort','return','decision','complete'],oldQuest=safeObject(s.quests?.changshan);state.quests={changshan:{stage:stages.includes(oldQuest.stage)?oldQuest.stage:'available',arrivalIndex:Math.max(0,Math.min(N.storyConversations.changshanEntry.length-1,Math.floor(Number(oldQuest.arrivalIndex)||0))),arrivalSeen:!!oldQuest.arrivalSeen,zhaoInvitation:!!oldQuest.zhaoInvitation,healerDecision:!!oldQuest.healerDecision,healerStayDecided:!!oldQuest.healerStayDecided,escortIntroSeen:!!oldQuest.escortIntroSeen,escortIntroIndex:Math.max(0,Math.min(N.storyConversations.escortArrival.length-1,Math.floor(Number(oldQuest.escortIntroIndex)||0))),healerRescued:!!oldQuest.healerRescued||!!oldQuest.healerJoined||Number(oldQuest.grainWins)>0||(s.afterBattle?.kind==='story'&&s.afterBattle.phase==='rescue')||companions.some(u=>u.id==='zhenji')||recruits.wei.includes('zhenji')||['escort','return','decision','complete'].includes(oldQuest.stage),healerJoined:!!oldQuest.healerJoined||companions.some(u=>u.id==='zhenji')||recruits.wei.includes('zhenji'),grainWins:Math.max(0,Math.min(2,Number.isInteger(oldQuest.grainWins)?oldQuest.grainWins:(['rescue','escort','return','decision','complete'].includes(oldQuest.stage)?2:0)))},side:copy(safeObject(s.quests?.side))};
    state.equipmentRewards=copy(safeObject(s.equipmentRewards));state.economyVersion=1;state.money=Math.max(0,Math.floor(Number(s.money??200)||0));state.inventory=Array.isArray(s.inventory)?copy(s.inventory).filter(i=>i&&typeof i.uid==='string').map(i=>i.slot==='weapon'||i.type?{...I.weaponRecord(i),slot:'weapon'}:i):[];state.itemSerial=Math.max(0,Math.floor(Number(s.itemSerial)||0));state.battleSerial=Math.max(0,Math.floor(Number(s.battleSerial)||0));state.heroEquipment=copy(s.heroEquipment||{armor:I.create('cloth-armor','white','initial-cloth'),accessory1:null,accessory2:null});state.showParty=s.showParty!==false;state.departurePractice=state.nodeId==='camp'&&['offer','training'].includes(s.departurePractice)?s.departurePractice:null;state.roadSeed=typeof s.roadSeed==='string'?s.roadSeed:Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2);state.serviceRumors={tavern:['heard','visited'].includes(s.serviceRumors?.tavern)?s.serviceRumors.tavern:null,tavernPlace:Tavern.capitals.includes(s.serviceRumors?.tavernPlace)?s.serviceRumors.tavernPlace:null};state.outfitted=!!s.outfitted||!!s.weaponType||!!s.weapon;state.pendingReward=s.pendingReward?copy(s.pendingReward):null;state.afterBattle=s.afterBattle?copy(s.afterBattle):null;state.npcTalks=copy(safeObject(s.npcTalks));
    for(const quest of N.sideQuests){const old=safeObject(state.quests.side[quest.id]),oldRounds=old.rounds||(s.questProgressVersion===2?quest.rounds:quest.rounds===5?10:quest.rounds),wins=Math.floor((Number(old.wins)||0)*quest.rounds/oldRounds);state.quests.side[quest.id]={heard:!!old.heard,accepted:!!old.accepted,wins:Math.max(0,Math.min(quest.rounds,wins)),rounds:quest.rounds,paid:!!old.paid};
      // 已交付的旧委托补发新增任务凭据，不重复发放金钱或装备。
      if(old.paid)for(const [id,count]of Object.entries(quest.effects?.items||{}))state.story.items[id]=Math.max(Number(state.story.items[id])||0,count);
    }
    for(const u of companions)if(!I.canEquip(u,u.weapon)){if(u.weapon)state.inventory.push({...copy(u.weapon),slot:'weapon',uid:'item-'+(++state.itemSerial)});const type=I.profession(u).weaponType,normal=H.definitions[u.characterId||u.id]?Recruitment.companion(u.characterId||u.id,u.level).weapon:I.create('weapon-'+type,'green');u.weapon=copy(normal);u.skills=W.forWeapon(u.weapon);u.priorities=W.prioritiesFor(u.skills);if(state.tactics[u.id])delete state.tactics[u.id].priorities;}
    state.heroQuests=H.normalize(s.heroQuests,state.quests.changshan.stage==='complete');if(state.quests.changshan.stage==='complete'&&!s.heroQuests?.taishici)state.heroQuests.taishici.accepted=true;for(const d of Object.values(H.definitions))if(recruitCountries.some(c=>state.recruits[c].includes(d.id)))state.heroQuests[d.id].stage='complete';
    for(const d of Object.values(H.definitions))if(d.recruitRedirect&&state.heroQuests[d.id]?.stage==='freed'&&!Story.check({state},d.recruitRequires).ok)state.heroQuests[d.id].stage=d.recruitRedirect;
    if(state.heroQuests.taishici?.stage!=='complete')for(const u of [...companions])if(u.questGuest==='taishici'){companions.splice(companions.indexOf(u),1);state.activeIds=state.activeIds.filter(id=>id!==u.id);delete state.troops[u.id];}if(!state.activeIds.length)state.activeIds=['hero'];
    const completeIds=[...(state.quests.changshan.stage==='complete'?['changshan']:[]),...N.sideQuests.filter(q=>state.quests.side[q.id].paid).map(q=>q.id),...Object.keys(H.definitions).filter(id=>state.heroQuests[id].stage==='complete'),...(countries.every(c=>state.recruits[c].length>=3)?['coalition']:[]),...(state.chapterOne.stage==='complete'?['chapter-one']:[])];
    state.questCompletions=Object.fromEntries(Object.entries(safeObject(s.questCompletions)).filter(([id,n])=>completeIds.includes(id)&&Number.isSafeInteger(n)&&n>0));state.questCompletionSerial=Math.max(0,Number.isSafeInteger(s.questCompletionSerial)?s.questCompletionSerial:0,...Object.values(state.questCompletions));for(const id of completeIds)if(!state.questCompletions[id])state.questCompletions[id]=++state.questCompletionSerial;
    state.mapZoom=Number.isFinite(Number(s.mapZoom))&&Number(s.mapZoom)>0?Math.max(.05,Math.min(3.6,Number(s.mapZoom))):D.mapRules.defaultZoom;state.questTab=['main','story','side'].includes(s.questTab)?s.questTab:'story';state.questNotice={signature:typeof s.questNotice?.signature==='number'?s.questNotice.signature:null,unread:!!s.questNotice?.unread};state.questProgressVersion=2;state.enemyLevelCap=N.combatProgression.initialCap;
    state.residents=Object.fromEntries(Object.entries(safeObject(s.residents)).filter(([id,u])=>u&&u.id===id&&id!=='hero'&&D.placeMap[u.homeNode]&&!ids.has(id)).map(([id,u])=>[id,normalizeRecruitHome(W.migrateWeaponPlan(X.normalizeRecord(G.normalizeKnownPotentials(u))))]));
    for(const u of Object.values(state.residents))if(!I.canEquip(u,u.weapon)){if(u.weapon)state.inventory.push({...copy(u.weapon),slot:'weapon',uid:'item-'+(++state.itemSerial)});u.weapon=H.definitions[u.characterId||u.id]?copy(Recruitment.companion(u.characterId||u.id,u.level).weapon):I.create('weapon-'+I.profession(u).weaponType,'green');u.skills=W.forWeapon(u.weapon);u.priorities=W.prioritiesFor(u.skills);if(state.tactics[u.id])delete state.tactics[u.id].priorities;}
    for(const u of Object.values(state.residents))if(u.weaponPlanMigrated){if(state.tactics[u.id])delete state.tactics[u.id].priorities;delete u.weaponPlanMigrated;}
    for(const u of [...companions,...Object.values(state.residents)]){const old=(Array.isArray(s.companions)?s.companions:[]).find(record=>record?.id===u.id)||s.residents?.[u.id];if(old&&(!(old.potentialRevision>=2)||old.constitutionRevision!==1)&&G.GENERAL_POTENTIALS[u.characterId||u.id]&&old.potentials){const oldMax=I.apply(old).maxSoldiers,newMax=I.apply(u).maxSoldiers;if(oldMax>0&&newMax>0){if(Object.hasOwn(state.troops,u.id))state.troops[u.id]=Math.floor(Math.max(0,Math.min(1,state.troops[u.id]/oldMax))*newMax);if(u.startSoldiers!=null)u.startSoldiers=Math.floor(Math.max(0,Math.min(1,u.startSoldiers/oldMax))*newMax);}}}
    // 仅迁移旧版默认长枪；玩家自行更换的兵器及已练出的熟练经验保留。
    for(const u of [...companions,...Object.values(state.residents)])if((u.characterId||u.id)==='taishici'&&u.defaultLoadoutVersion!==2){
      if(u.weapon?.type==='spear'&&u.weapon.uid==='taishici-weapon'){u.weapon=I.create('weapon-blade',u.weapon.quality||'green',u.weapon.uid);u.skills=W.forWeapon(u.weapon);u.priorities=W.prioritiesFor(u.skills);u.weaponProficiencies={...u.weaponProficiencies,blade:Math.max(60,u.weaponProficiencies?.blade||0)};delete state.tactics[u.id];}u.defaultLoadoutVersion=2;
    }
    for(const u of [...companions,...Object.values(state.residents)])if(u.id==='zhangliang'&&u.campLevelVersion!==2){if(!u.recruitLevelVersion&&(u.level<10||u.level===15&&!u.experience)){const old=I.apply(u),attributes=G.attributesAt(u.baseAttributes,u.potentials,10);Object.assign(u,{level:10,attributes},attributes);delete u.maxSoldiers;const max=I.apply(u).maxSoldiers;if(Object.hasOwn(state.troops,u.id))state.troops[u.id]=Math.floor(state.troops[u.id]/old.maxSoldiers*max);if(u.startSoldiers!=null)u.startSoldiers=Math.floor(u.startSoldiers/old.maxSoldiers*max);}u.campLevelVersion=2;}

    const resumed=s.resolvedLeg;state.resolvedLeg=resumed&&resumed.from===state.nodeId&&neighbors(state.nodeId).includes(resumed.to)?{from:resumed.from,to:resumed.to}:null;
    const target=placeId(s.routeTarget);state.routeTarget=target!==state.nodeId&&shortestRoute(state.nodeId,target)?target:null;
    const hero=heroUnit(character,state),max=hero.maxSoldiers;let health=Number(state.troops.hero);if(s.passiveEffectsVersion!==1&&Number.isFinite(health)&&max!==hero.baseMaxHealth)health=Math.floor(Math.max(0,Math.min(1,health/hero.baseMaxHealth))*max);state.passiveEffectsVersion=1;state.troops.hero=Math.max(0,Math.min(max,Number.isFinite(health)?health:max));return state;
  }
  class World{
    constructor(character,saved){this.character=X.normalizeRecord(G.normalizeCharacter({...character,...(character.difficulty==='hell'&&!character.hellBalanceVersion&&Object.values(character.potentials||{}).every(n=>n===1)?{potentials:Object.fromEntries(G.KEYS.map(key=>[key,40])),hellBalanceVersion:1}: {})}));if(this.character.weaponCatalogVersion!==1){const C=node?require('./weapon-catalog.js'):root.WeaponCatalog,values={};for(const [id,value]of Object.entries(this.character.weaponProficiencies||{})){const key=C.legacyAliases[id]||id;values[key]=Math.max(values[key]||0,value);}this.character.weaponProficiencies=values;this.character.weaponCatalogVersion=1;}this.state=normalize(this.character,saved);this.syncCompanionLevels();if(this.state.weaponType&&!this.state.weapon)this.state.weapon=I.create('weapon-'+this.state.weaponType,'white','initial-weapon');this.pending=null;this.journey=this.state.resolvedLeg?{...this.state.resolvedLeg,checkpoint:this.snapshot(),event:{kind:'quiet'},checked:true}:null;this.lastReward=null;this.restoreEquipmentRewards();}
    questStateKey(){return JSON.stringify([this.state.quests,this.state.heroQuests,this.state.recruits,this.state.recruitReports,this.state.story,this.state.chapterOne,this.state.questCompletions,this.state.serviceRumors]);}
    refreshQuestNotice(){const raw=this.questStateKey();if(raw===this.questNoticeKey)return this.state.questNotice.unread;this.questNoticeKey=raw;const q=this.state.quests.changshan,signature=E.seedNumber(JSON.stringify([this.quests().map(q=>[q.id,q.title,q.category,q.taskStatus,q.complete,q.target]),[q.stage,q.zhaoInvitation,q.healerDecision,q.healerStayDecided,q.healerRescued,q.healerJoined,q.grainWins],this.state.quests.side,this.state.heroQuests,this.counts()]));if(signature!==this.state.questNotice.signature){this.state.questNotice={signature,unread:true};}return this.state.questNotice.unread;}
    readQuests(){this.refreshQuestNotice();this.state.questNotice.unread=false;}
    snapshot(){this.refreshQuestNotice();return copy(this.state);}
    location(){return D.placeMap[this.state.nodeId];}
    neighbors(){return neighbors(this.state.nodeId).map(id=>D.placeMap[id]);}
    findRoute(to){return shortestRoute(this.state.nodeId,to);}
    planRoute(to){
      if(this.pending||this.journey)return {ok:false,reason:'正在行路'};
      const route=this.findRoute(to);if(!route||route.nodes.length<2)return {ok:false,reason:D.placeMap[to]?.requiresWater?'水路尚未开通':'没有可通行的道路'};
      this.state.routeTarget=to;return {ok:true,...route};
    }
    beginNextLeg(options={}){const route=this.findRoute(this.state.routeTarget);if(!route||route.nodes.length<2){this.cancelRoute();return {ok:false,reason:'行程已结束'};}return this.beginTravel(route.nodes[1],options);}
    cancelRoute(){this.state.routeTarget=null;if(this.journey)this.journey.checkpoint.routeTarget=null;if(this.pending)this.pending.checkpoint.routeTarget=null;}
    counts(){return Object.fromEntries(countries.map(id=>[id,this.state.recruits[id].length]));}
    pendingReports(country){return countries.includes(country)?this.state.recruits[country].filter(id=>!this.state.recruitReports[country].includes(id)):[];}
    claimRecruitReward(country){
      const court=Courts.definitions[country],ids=this.pendingReports(country);if(!court||!ids.length||!this.state.inside||this.state.nodeId!==court.place||this.pending||this.journey||this.state.pendingReward)return null;
      this.state.recruitReports[country].push(...ids);const names=ids.map(id=>this.state.companions.find(u=>u.id===id)?.name||this.state.residents[id]?.name||H.definitions[id]?.name||({zhaoyun:'赵云',zhenji:'甄姬',ganning:'甘宁'})[id]||id),reward={title:'招贤赏钱',reportedNames:names,money:ids.length*Courts.rewardPerHero,gains:[],proficiencies:[],items:[]};
      this.state.money+=reward.money;this.state.pendingReward=copy(reward);this.state.afterBattle=null;this.lastReward=reward;return copy(reward);
    }
    coalitionReady(){return countries.every(id=>this.state.recruits[id].length>=3);}
    chooseWeapon(type){if(!R.WEAPON_TYPES.some(t=>t.id===type))return false;this.state.weaponType=type;this.state.weapon=I.create('weapon-'+type,'white','initial-weapon');this.state.outfitted=true;delete this.state.tactics.hero;return true;}
    equipWeapon(weapon){if(!weapon||!weapon.type)return false;const resolved=W.resolveWeapon(weapon);W.forWeapon(resolved);this.state.weapon=copy(resolved);this.state.weaponType=resolved.type;this.state.outfitted=true;delete this.state.tactics.hero;return true;}
    prepareRecruit(raw){
      const u=copy(raw),id=u.characterId||u.id;
      if(u.passives?.includes('enemy-stun-resistance')){u.passives=u.passives.filter(id=>id!=='enemy-stun-resistance');u.statusImmunities=u.statusImmunities?.filter(id=>id!=='stun');}
      const passiveDefinitions=(node?require('./passives.js'):root.BattlePassives).definitions;u.passives=(u.passives||[]).filter(id=>typeof id==='string'&&!passiveDefinitions[id]?.enemyOnly&&!id.startsWith('enemy-status-immunity:'));if(u.observationEnemy||u.side==='enemy'){u.statusImmunities=[];delete u.boss;delete u.side;}delete u.observationEnemy;
      if(id==='zhaoyun'||!u.baseAttributes||!u.potentials)return u;
      const old=I.apply(u),attributes=G.attributesAt(u.baseAttributes,u.potentials,this.character.level),ratio=u.startSoldiers==null?1:clampTroops(u.startSoldiers,old.maxSoldiers)/old.maxSoldiers;
      Object.assign(u,{level:this.character.level,experience:0,experienceVersion:2,attributes,recruitLevelVersion:1},attributes);delete u.maxSoldiers;delete u.equipmentBase;
      if(u.startSoldiers!=null)u.startSoldiers=Math.floor(I.apply(u).maxSoldiers*ratio);return u;
    }
    syncCompanionLevels(){
      // 同步只发生在首次入队。旧队伍及再次邀请的成员不在读档时反复改级。
      for(const u of [...this.state.companions,...Object.values(this.state.residents)])u.recruitLevelVersion??=1;
    }
    members(){return [heroUnit(this.character,this.state),...this.state.companions.map(raw=>{const u=I.apply(copy(raw)),max=u.maxSoldiers??E.maxHealth(u.constitution);return {...u,...(root.CharacterAssets?.manifest.characters[u.characterId||u.id]?root.CharacterAssets.resolve(u.characterId||u.id):{}),maxSoldiers:max,condition:this.state.conditions[u.id],dead:this.state.conditions[u.id]==='dead',startSoldiers:clampTroops(this.state.troops[u.id]??max,max),...safeObject(this.state.tactics[u.id]),...(!u.weapon?{attack:0,skills:W.forWeapon(null),priorities:W.prioritiesFor(W.forWeapon(null))}:{})};})];}
    claimEquipmentReward(key){
      const definitions=I.rewards[key];if(!definitions||this.state.equipmentRewards[key])return [];
      const items=definitions.map(([id,quality])=>this.addItem(id,quality));this.state.equipmentRewards[key]=true;return items;
    }
    restoreEquipmentRewards(){
      const keys=[...(['return','decision','complete'].includes(this.state.quests.changshan.stage)?['story:escort']:[]),...N.sideQuests.filter(q=>this.state.quests.side[q.id].paid).map(q=>'side:'+q.id),...Object.keys(this.state.heroQuests).filter(id=>this.state.heroQuests[id].stage==='complete').map(id=>'hero:'+id)],items=keys.flatMap(key=>this.claimEquipmentReward(key));
      if(!items.length)return;const reward=this.state.pendingReward||{title:'获得谢礼',gains:[],proficiencies:[],money:0,items:[]};reward.items=[...(reward.items||[]),...items];this.state.pendingReward=reward;
    }
    addItem(template,quality='white'){const uid='item-'+(++this.state.itemSerial),item=typeof template==='object'?{...copy(template),uid}:I.create(template,quality,uid);this.state.inventory.push(item);return copy(item);}
    equipped(id,slot){if(id==='hero')return slot==='weapon'?this.state.weapon:this.state.heroEquipment[slot];const u=this.state.companions.find(u=>u.id===id);return slot==='weapon'?u?.weapon:u?.equipment?.[slot];}
    changeEquipment(id,slot,uid){
      if(this.pending||this.journey||!['weapon','armor','accessory1','accessory2'].includes(slot)||!this.members().some(u=>u.id===id))return false;
      const item=uid?this.state.inventory.find(i=>i.uid===uid):null;if(uid&&(!item||!I.compatible(item,slot)||!I.canEquip(this.members().find(u=>u.id===id),item))){this.lastEquipmentError='只能装备本职业对应的兵器。';return false;}const old=this.equipped(id,slot),owner=this.members().find(u=>u.id===id),hp=owner.startSoldiers;
      if(uid)this.state.inventory=this.state.inventory.filter(i=>i.uid!==uid);if(old){const restored={...copy(old),slot:slot.startsWith('accessory')?'accessory':slot,quality:old.quality||'white',uid:old.uid||'item-'+(++this.state.itemSerial)};if(slot==='weapon'&&restored.power==null)restored.power=Math.max(0,Number(restored.attack??owner.attack)||0);this.state.inventory.push(restored);}
      if(id==='hero'){if(slot==='weapon'){this.state.weapon=item?copy(item):null;this.state.weaponType=item?.type||null;}else this.state.heroEquipment[slot]=item?copy(item):null;}
      else {const u=this.state.companions.find(u=>u.id===id);u.equipment||={};if(slot==='weapon')u.weapon=item?copy(item):null;else u.equipment[slot]=item?copy(item):null;}
      if(slot==='weapon'){const member=id==='hero'?null:this.state.companions.find(u=>u.id===id),skills=W.forWeapon(item);if(member){member.skills=skills;member.priorities=W.prioritiesFor(skills);}if(this.state.tactics[id])delete this.state.tactics[id].priorities;}
      this.state.troops[id]=Math.min(hp,this.members().find(u=>u.id===id).maxSoldiers);return true;
    }
    buyItem(template){const t=I.templates[template];if(!t||t.unique||this.state.money<t.price||this.pending||this.journey)return false;this.state.money-=t.price;this.addItem(template);return true;}
    sellItem(uid){const item=this.state.inventory.find(i=>i.uid===uid);if(!item||this.pending||this.journey)return false;this.state.money+=I.sellPrice(item);this.state.inventory=this.state.inventory.filter(i=>i.uid!==uid);return true;}
    sellItems(uids){
      if(this.pending||this.journey||!Array.isArray(uids))return false;const selected=new Set(uids),items=this.state.inventory.filter(i=>selected.has(i.uid));if(!selected.size||items.length!==selected.size)return false;
      const money=items.reduce((sum,item)=>sum+I.sellPrice(item),0);this.state.inventory=this.state.inventory.filter(i=>!selected.has(i.uid));this.state.money+=money;return {count:items.length,money};
    }

    tavernAvailable(){return this.state.inside&&Tavern.capitals.includes(this.state.nodeId)&&!this.pending&&!this.journey;}
    refreshTavern(){if(!this.tavernAvailable()||this.state.money<Tavern.REFRESH_COST)return false;this.state.money-=Tavern.REFRESH_COST;this.state.tavern.generation++;this.state.tavern.candidates=Tavern.generate(this.state.seed,this.state.tavern.generation);return true;}
    hireRetainer(id,type){
      if(!this.tavernAvailable()||this.state.releasedRetainers.includes(id)||this.state.money<Tavern.HIRE_COST||!this.canRecruit())return false;const candidate=this.state.tavern.candidates.find(c=>c.id===id),u=Tavern.create(candidate,type,this.character.level,this.state.nodeId);if(!u||this.state.companions.some(v=>v.id===id)||this.state.residents[id])return false;
      this.state.money-=Tavern.HIRE_COST;this.state.companions.push(u);this.state.troops[id]=I.apply(u).maxSoldiers;if(this.state.activeIds.length<this.activeLimit())this.state.activeIds.push(id);this.state.tavern.candidates=this.state.tavern.candidates.filter(c=>c.id!==id);return u;
    }
    renameRetainer(id,name){const u=this.state.companions.find(u=>u.id===id)||this.state.residents[id];if(!u||u.origin!=='tavern'||typeof name!=='string')return false;const next=R.sanitizeName(name).trim();if(!next||R.nameLength(next)>4)return false;u.name=next;this.npcListCache=null;return true;}
    archivedRetainers(){return Object.values(this.state.residents).filter(u=>u.origin==='tavern'&&!this.state.releasedRetainers.includes(u.id)).reverse();}
    recallRetainer(id){const u=this.state.residents[id];return !!(this.tavernAvailable()&&u?.origin==='tavern'&&!this.state.releasedRetainers.includes(id)&&this.inviteResident(id));}
    releaseRetainer(id){
      const u=this.state.companions.find(u=>u.id===id)||this.state.residents[id];if(!u||u.origin!=='tavern'||this.pending||this.journey||this.state.releasedRetainers.includes(id))return false;
      if(this.state.companions.some(u=>u.id===id)&&!this.dismiss(id))return false;const archived=this.state.residents[id];
      for(const item of [archived.weapon,...Object.values(archived.equipment||{})].filter(Boolean))this.addItem(item);
      delete this.state.residents[id];delete this.state.tactics[id];delete this.state.troops[id];delete this.state.conditions[id];this.state.releasedRetainers.push(id);this.state.tavern.candidates=this.state.tavern.candidates.filter(c=>c.id!==id);this.npcListCache=null;return true;
    }
    rosterLimit(){return 7;}
    activeLimit(){return this.state.activeLimit||4;}
    unlockActiveLimit(limit){if(!Number.isInteger(limit)||limit<=this.activeLimit()||limit>this.rosterLimit())return false;this.state.activeLimit=limit;return true;}
    canRecruit(){if(this.members().length<this.rosterLimit()){this.lastRecruitError=null;return true;}this.lastRecruitError='队伍已满（'+this.rosterLimit()+'/'+this.rosterLimit()+'），请先让一位同伴离队。';return false;}
    partyGroups(){
      const members=this.members(),map=new Map(members.map(u=>[u.id,u])),active=this.state.activeIds.map(id=>map.get(id)).filter(Boolean),activeSet=new Set(active.map(u=>u.id)),order=[...new Set([...(this.state.reserveOrder||[]),...members.map(u=>u.id)])];
      return {active,reserve:order.filter(id=>map.has(id)&&!activeSet.has(id)).map(id=>map.get(id))};
    }
    setActive(ids){
      if(!Array.isArray(ids)||!ids.length||ids.length>this.activeLimit()||new Set(ids).size!==ids.length||ids.some(id=>!this.members().some(u=>u.id===id)))return false;
      const groups=this.partyGroups(),reserve=[...groups.reserve.map(u=>u.id).filter(id=>!ids.includes(id)),...this.state.activeIds.filter(id=>!ids.includes(id))];this.state.activeIds=[...ids];this.state.reserveOrder=[...reserve,...ids];return true;
    }
    reorderParty(group,id,index){
      const members=this.partyGroups()[group];if(!members||!members.some(u=>u.id===id)||!Number.isInteger(index))return false;
      const ids=members.map(u=>u.id).filter(value=>value!==id);ids.splice(Math.max(0,Math.min(ids.length,index)),0,id);
      if(group==='active')this.state.activeIds=ids;else this.state.reserveOrder=[...ids,...this.state.activeIds];return true;
    }
    movePartyMember(id,group,index){
      if(!['active','reserve'].includes(group)||!this.members().some(u=>u.id===id))return false;this.lastPartyError=null;const active=this.state.activeIds.includes(id);
      if(active!==(group==='active')){const ids=group==='active'?[...this.state.activeIds,id]:this.state.activeIds.filter(value=>value!==id);if(!this.setActive(ids)){this.lastPartyError=group==='active'?'最多'+this.activeLimit()+'人出战，请先让一人下场。':'至少保留一人出战。';return false;}}
      return this.reorderParty(group,id,Number.isInteger(index)?index:this.partyGroups()[group].length-1);
    }
    markQuestComplete(id){if(!this.state.questCompletions[id])this.state.questCompletions[id]=++this.state.questCompletionSerial;if(id!=='coalition'&&this.coalitionReady()&&!this.state.questCompletions.coalition)this.markQuestComplete('coalition');}
    recordRecruit(id,country,unit){if(!recruitCountries.includes(country)||typeof id!=='string'||!id||id==='hero'||recruitCountries.some(c=>this.state.recruits[c].includes(id)))return false;if(unit&&!this.canRecruit())return false;this.state.recruits[country].push(id);if(unit){const joined=this.prepareRecruit(W.migrateWeaponPlan({...copy(unit),id}));this.state.companions.push(joined);this.state.troops[id]=joined.startSoldiers??I.apply(joined).maxSoldiers;if(this.state.activeIds.length<this.activeLimit())this.state.activeIds.push(id);}this.syncCompanionLevels();if(this.state.heroQuests[id]){this.state.heroQuests[id].stage='complete';this.markQuestComplete(id);}if(this.coalitionReady())this.markQuestComplete('coalition');this.restoreEquipmentRewards();return true;}
    sceneNpcs(){
      const id=this.state.nodeId,stage=this.state.quests.changshan.stage,key=this.questStateKey()+'|'+id+'|'+this.state.companions.map(u=>u.id).join(',')+'|'+Object.keys(this.state.residents).join(',')+'|'+N.npcs.length;
      if(this.npcListCache?.key===key)return this.npcListCache.npcs;
      const npcs=id==='camp'?D.townNpcs.camp.filter(n=>!this.state.companions.some(u=>u.id===n.id)).map(copy):N.npcs.filter(n=>n.place===id&&(!n.unlockQuest||this.state.heroQuests[n.unlockQuest]?.stage!=='locked')).map(copy),court=Courts.at(id);
      if(court){if(this.state.companions.some(u=>u.id===court.id))npcs.unshift({...court,courtId:court.id,id:court.id+'-clerk',name:D.factions[court.country].name+'国主簿',art:'town-doctor',delegate:true});else npcs.unshift(court);}
      const tavernNpc=Tavern.npc(id);if(tavernNpc)npcs.push(tavernNpc);
      if(id==='changshan'&&stage!=='complete'&&!this.state.companions.some(u=>u.id==='zhaoyun'))npcs.unshift(D.questNpcs.zhaoyun);
      if(id==='zhongshan-county'&&(this.state.quests.changshan.healerRescued||this.state.quests.changshan.healerJoined||['return','decision','complete'].includes(stage))&&!this.state.companions.some(u=>u.id==='zhenji')&&!this.state.residents.zhenji)npcs.unshift(D.questNpcs.zhenji);
      for(const u of Object.values(this.state.residents))if(u.origin!=='tavern'&&u.homeNode===id&&!npcs.some(n=>n.id===u.id))npcs.push({id:u.id,name:u.name,art:u.characterId||u.id,side:'left',role:'companion',roleLabel:'同行'});
      for(const data of N.sideQuests){const q=this.state.quests.side[data.id];if(q.accepted&&!q.paid&&q.wins<data.rounds&&data.place===id)npcs.push({id:'side-enemy-'+data.id,name:data.enemyName||'拦路盗匪',art:data.enemyArt||'brigand',role:'sideBattle',roleLabel:'剿匪',questId:data.id,side:'left'});}
      for(const d of Object.values(H.definitions)){const q=this.state.heroQuests[d.id];if(!this.heroQuestVisible(d,q))continue;const n=H.npc(d.id,q);if(!n||H.place(d.id,q)!==id||d.stages[q.stage].strictDialogue)continue;const existing=npcs.findIndex(other=>(other.courtId||other.id)===n.id);
        if(existing<0)npcs.push(n);else if(['court','advice','heal','training','companion'].includes(npcs[existing].role))npcs[existing].relatedQuests=[...(npcs[existing].relatedQuests||[]),d.id];else npcs[existing]=n;
      }
      const chapterNpc=Chapter.npc?.(this);if(chapterNpc)npcs.unshift(chapterNpc);
      const result=npcs.filter((n,i,all)=>!this.state.companions.some(u=>u.id===n.id&&!(u.questGuest===n.heroQuest&&u.guest))&&all.findIndex(other=>other.id===n.id)===i).map((n,index)=>({n,index})).sort((a,b)=>{const rank=n=>G.isGeneral({id:n.id,characterId:n.art})||n.role==='companion'?0:this.npcQuestStatus(n)?1:2;return rank(a.n)-rank(b.n)||a.index-b.index;}).map(row=>row.n);
      this.npcListCache={key,npcs:result};return result;
    }
    heroQuestVisible(d,q=this.state.heroQuests[d.id]){return !d.visibility||q.accepted||Story.check(this,d.visibility).ok;}
    enter(){if(this.location().requiresWater)return false;this.state.inside=true;return this.location();}
    leave(){this.state.inside=false;}
    rest(){for(const u of this.members()){this.state.troops[u.id]=u.maxSoldiers;delete this.state.conditions[u.id];}}
    quests(){
      const cacheKey=this.questStateKey()+'|'+this.state.nodeId;if(this.questListCache?.key===cacheKey)return this.questListCache.list;const q=this.state.quests.changshan,at=id=>this.state.nodeId===id,objectives={available:'前往常山，查看村口的动静',entry:'与赵云合力击退村口盗匪',supplies:(q.healerRescued||q.healerJoined)?(at('zhongshan')?'夺回中山粮仓':'前往中山夺回粮仓')+' · '+q.grainWins*50+'%':at('zhongshan')?'向仓守打听粮车下落':'前往中山打听粮车下落',rescue:at('zhongshan-county')?'救出被扣押的甄家医者':'前往毋极寻找甄家医者',escort:'护送粮车返回常山',return:'向常山里正复命',decision:'与赵云商议去留',complete:'常山的乡民已安顿妥当'};
      const list=[...D.questDefinitions.map(t=>({...t,complete:t.id==='changshan'?q.stage==='complete':this.coalitionReady(),taskStatus:t.id==='changshan'?(q.stage==='complete'?null:q.stage==='available'?'available':['return','decision'].includes(q.stage)?'ready':'active'):(this.coalitionReady()?null:'active'),objective:t.id==='changshan'?(q.zhaoInvitation?'与赵云商议中山之行':q.healerDecision?'与甄姑娘商议去留':objectives[q.stage]):'为魏、蜀、吴招募英雄'})),...Object.values(H.definitions).filter(d=>this.state.heroQuests[d.id].stage!=='locked'&&this.heroQuestVisible(d)).map(d=>({...d,recommendedLevel:Progression.recommended(d,d.stages[this.state.heroQuests[d.id].stage]),target:H.place(d.id,this.state.heroQuests[d.id]),heard:!!this.state.heroQuests[d.id].heard,accepted:!!this.state.heroQuests[d.id].accepted,complete:this.state.heroQuests[d.id].stage==='complete',taskStatus:this.state.heroQuests[d.id].stage==='complete'?null:this.state.heroQuests[d.id].stage==='freed'?'ready':this.state.heroQuests[d.id].accepted||this.state.heroQuests[d.id].stage!==d.start?'active':'available',objective:this.state.heroQuests[d.id].stage===d.start&&this.state.nodeId!==H.place(d.id,this.state.heroQuests[d.id])?'前往'+D.placeMap[H.place(d.id,this.state.heroQuests[d.id])].name+'查探消息':d.stages[this.state.heroQuests[d.id].stage].objective})),...N.sideQuests.map(t=>{
        const s=this.state.quests.side[t.id],giver=N.npcs.find(n=>n.id===t.giver).name,done=s.wins>=t.rounds,target=s.accepted&&!done?t.place:t.giverPlace;
        const objective=s.paid?'委托已完成':!s.accepted?'向'+D.placeMap[t.giverPlace].name+'的'+giver+'询问委托':done?'返回'+D.placeMap[t.giverPlace].name+'向'+giver+'复命':(at(t.place)?'在':'前往')+D.placeMap[t.place].name+'剿匪 · '+Math.floor(s.wins/t.rounds*100)+'%';
        return {...t,heard:!!s.heard,recommendedLevel:Progression.recommended(t),category:'side',complete:s.paid,taskStatus:s.paid?null:!s.accepted?'available':done?'ready':'active',accepted:s.accepted,target,objective};
      }),...(this.state.serviceRumors.tavern?[{id:'tavern-recruit',title:'酒肆访客',category:'side',recommendedLevel:1,heard:true,accepted:true,complete:this.state.serviceRumors.tavern==='visited',taskStatus:this.state.serviceRumors.tavern==='visited'?null:'active',target:this.state.serviceRumors.tavernPlace||this.tavernRumor().place,objective:this.state.serviceRumors.tavern==='visited'?'已向酒肆掌柜打听过同行的人':'前往'+D.placeMap[this.state.serviceRumors.tavernPlace||this.tavernRumor().place].name+'，向酒肆掌柜打听同行的人'}]:[]),...(Chapter.quest(this)?[Chapter.quest(this)]:[]),...countries.filter(country=>this.pendingReports(country).length).map(country=>{const d=Courts.definitions[country];return {id:'report-'+country,title:D.factions[country].name+'国复命',category:'side',recommendedLevel:1,accepted:true,complete:false,taskStatus:'ready',target:d.place,objective:'前往'+D.placeMap[d.place].name+'，向'+d.name+'复命'};})].map(q=>({...q,completionOrder:this.state.questCompletions[q.id]||0})).sort((a,b)=>Number(a.complete)-Number(b.complete)||(a.complete?b.completionOrder-a.completionOrder:(a.recommendedLevel||1)-(b.recommendedLevel||1)));this.questListCache={key:cacheKey,list};return list;
    }
    npcQuestIds(npc){const stage=this.state.quests.changshan.stage,ids=[...(npc.relatedQuests||[])];if(npc.role==='tavern'&&this.state.serviceRumors.tavern==='heard')ids.push('tavern-recruit');if(npc.role==='chapter')ids.push('chapter-one');if(npc.role==='court')ids.push('report-'+npc.country);if(npc.questId)ids.push(npc.questId);if(npc.heroQuest)for(const d of Object.values(H.definitions))if(H.place(d.id,this.state.heroQuests[d.id])===this.state.nodeId&&H.npc(d.id,this.state.heroQuests[d.id])?.id===npc.id)ids.push(d.id);for(const data of N.sideQuests)if(data.giver===npc.id)ids.push(data.id);if(npc.id==='zhaoyun'&&!['return','complete'].includes(stage)&&npc.role!=='companion'||npc.id==='changshan-elder'&&stage==='return'||npc.id==='grain-steward'&&stage==='supplies'||npc.id==='refugee-laborer'&&stage==='rescue')ids.push('changshan');return [...new Set(ids)];}
    npcQuestStatus(npc){const ids=this.npcQuestIds(npc),statuses=this.quests().filter(q=>ids.includes(q.id)).map(q=>q.taskStatus);return ['ready','available','active'].find(status=>statuses.includes(status))||null;}
    questNpc(id){const d=H.definitions[id],q=this.state.heroQuests[id];if(d&&q&&this.heroQuestVisible(d,q)&&q.accepted&&H.place(id,q)===this.state.nodeId&&H.npc(id,q))return {...H.npc(id,q),selectedQuest:true};return this.sceneNpcs().find(n=>this.npcQuestIds(n).includes(id))||null;}
    entryQuestNpc(){const npcs=this.sceneNpcs(),here=this.state.nodeId,currentTasks=new Set(this.questMarkers().filter(mark=>mark.place===here).map(mark=>mark.questId)),progress=new Map(),offers=new Map();for(const q of this.quests()){const npc=npcs.find(n=>this.npcQuestIds(n).includes(q.id))||this.questNpc(q.id);if(!npc)continue;if(q.taskStatus==='available')offers.set(q.id,npc);else if(q.taskStatus==='ready'||q.taskStatus==='active'&&currentTasks.has(q.id))progress.set(q.id,npc);}const candidates=progress.size?progress:offers;if(candidates.size!==1)return null;const [id,npc]=[...candidates][0];return H.definitions[id]?{...H.npc(id,this.state.heroQuests[id]),selectedQuest:true}:npc;}
    questDestination(){const q=this.state.quests.changshan;if(q.zhaoInvitation)return 'changshan';if(q.healerDecision)return 'zhongshan';if(q.stage==='complete'){const d=Object.values(H.definitions).find(d=>!['locked','complete'].includes(this.state.heroQuests[d.id].stage)&&(this.state.heroQuests[d.id].accepted||this.state.heroQuests[d.id].heard));return d?H.place(d.id,this.state.heroQuests[d.id]):null;}return {available:'changshan',entry:'changshan',supplies:'zhongshan',rescue:'zhongshan-county',escort:'changshan',return:'changshan',decision:'changshan'}[this.state.quests.changshan.stage]||null;}
    questMarkers(){
      const cacheKey=this.questStateKey()+'|'+this.state.nodeId;if(this.markerCache?.key===cacheKey)return this.markerCache.markers;const nearHere=new Set([this.state.nodeId,...neighbors(this.state.nodeId)]),markers=Object.values(H.definitions).filter(d=>this.heroQuestVisible(d)&&!['locked','complete'].includes(this.state.heroQuests[d.id].stage)&&(this.state.heroQuests[d.id].accepted||this.state.heroQuests[d.id].heard||nearHere.has(H.place(d.id,this.state.heroQuests[d.id])))).map(d=>({place:H.place(d.id,this.state.heroQuests[d.id]),questId:d.id,category:'story',title:d.title,accepted:!!this.state.heroQuests[d.id].accepted})),near=new Set([this.state.nodeId,...neighbors(this.state.nodeId)]),destination=this.questDestination(),started=this.state.quests.changshan.stage!=='available';
      if(this.state.quests.changshan.stage!=='complete'&&destination&&(started||near.has(destination)))markers.push({place:destination,questId:'changshan',category:'story',title:'常山归途',accepted:started});
      for(const quest of N.sideQuests){const q=this.state.quests.side[quest.id];if(!q.paid&&(q.accepted||near.has(quest.giverPlace)))markers.push({place:q.accepted&&q.wins<quest.rounds?quest.place:quest.giverPlace,questId:quest.id,category:'side',title:quest.title,accepted:q.accepted});}
      if(this.state.serviceRumors.tavern==='heard')markers.push({place:this.state.serviceRumors.tavernPlace||this.tavernRumor().place,questId:'tavern-recruit',category:'side',title:'酒肆访客',accepted:true});
      for(const country of countries)if(this.pendingReports(country).length){const d=Courts.definitions[country];markers.push({place:d.place,questId:'report-'+country,category:'side',title:D.factions[country].name+'国复命',accepted:true});}
      const chapterQuest=Chapter.quest(this);if(chapterQuest&&!chapterQuest.complete)markers.push({place:'luoyang',questId:'chapter-one',category:'main',title:chapterQuest.title,accepted:true});
      const states=new Map(this.quests().map(q=>[q.id,q.taskStatus])),priority={ready:0,available:1,active:2};const result=markers.map(mark=>({...mark,taskStatus:states.get(mark.questId)})).sort((a,b)=>(priority[a.taskStatus]??3)-(priority[b.taskStatus]??3));this.markerCache={key:cacheKey,markers:result};return result;
    }
    repeatSide(id){const d=N.sideQuests.find(q=>q.id===id),q=this.state.quests.side[id];if(!d?.repeatable||!q?.paid||this.state.nodeId!==d.giverPlace||this.pending)return false;q.paid=false;q.wins=0;q.accepted=true;return true;}
    acceptSide(id){const q=this.state.quests.side[id];if(!q||q.accepted)return false;q.accepted=true;return true;}
    turnInSide(id){const data=N.sideQuests.find(t=>t.id===id),q=this.state.quests.side[id];if(!data||!q?.accepted||q.paid||q.wins<data.rounds||this.state.nodeId!==data.giverPlace||this.pending||this.journey)return false;q.paid=true;Story.apply(this,data.effects);this.markQuestComplete(id);this.state.money+=data.money;const reward={gains:[],money:data.money,items:[this.addItem(data.item,data.quality),...this.claimEquipmentReward('side:'+id),...Object.keys(data.effects?.items||{}).map(id=>Story.itemRecord(this,id)).filter(Boolean)],completedQuest:data.title};this.lastReward=reward;this.state.pendingReward=copy(reward);this.state.afterBattle={kind:'quest-turn-in',questId:id};return reward;}
    beginSideBattle(id){const data=N.sideQuests.find(q=>q.id===id),q=this.state.quests.side[id];if(!data||!q?.accepted||q.wins>=data.rounds||this.state.nodeId!==data.place||this.pending||this.journey)return false;this.pending={kind:'side',questId:id,to:this.state.nodeId,checkpoint:this.snapshot(),memberIds:this.members().map(u=>u.id),seed:this.state.seed+':side:'+id+':'+q.wins};return true;}
    chooseHeroQuest(id,index,expectedStage){
      const d=H.definitions[id],q=this.state.heroQuests[id];if(!d||!q||q.stage!==expectedStage||this.state.nodeId!==H.place(id,q)||this.pending||this.journey)return false;const choice=d.stages[q.stage].npc?.choices[index];if(!choice)return false;
      const allowed=Story.check(this,choice.requires||d.stages[q.stage].requires);if(!allowed.ok){this.lastQuestError=allowed.reason;return false;}
      const branch=choice.routes?.find(route=>Story.check(this,route.if).ok);if(branch)return this.chooseHeroRoute(id,branch);
      if(Object.hasOwn(choice,'recruit'))return this.finishHeroQuest(id,choice.recruit);if(choice.battle){if(choice.restoreParty)this.rest();return this.beginHeroBattle(id,choice.battle);}if(choice.puzzle){q.accepted=true;q.puzzle=Puzzle.normalize(q.puzzle);return true;}
      if(choice.price&&this.state.money<choice.price){this.lastQuestError='铜钱不足。';return false;}if(!d.stages[choice.next])return false;if(choice.guest&&!this.attachHeroGuest(choice.guest)){this.lastQuestError=this.lastRecruitError;return false;}this.state.money-=choice.price||0;Story.apply(this,choice.effects);q.stage=choice.next;q.accepted=true;return true;
    }
    chooseHeroRoute(id,route){if(route.battle)return this.beginHeroBattle(id,route.battle);const q=this.state.heroQuests[id];if(!H.definitions[id].stages[route.next])return false;Story.apply(this,route.effects);q.stage=route.next;q.accepted=true;return true;}
    beginHeroBattle(id,phase){const d=H.definitions[id],q=this.state.heroQuests[id],fight=d?.battles[phase];if(!fight||!fight.stage.includes(q?.stage)||this.state.nodeId!==H.place(id,q)||this.pending||this.journey)return false;if(fight.solo&&!this.members().some(u=>u.id==='hero'&&u.startSoldiers>0)){this.lastQuestError='先让主角恢复伤势，再来单挑。';return false;}this.pending={kind:'heroQuest',questId:id,phase,to:H.place(id,q),checkpoint:this.snapshot(),memberIds:this.members().map(u=>u.id),seed:this.state.seed+':'+id+':'+phase};q.stage=phase;q.accepted=true;return true;}
    attachHeroGuest(id){const existing=this.state.companions.find(u=>u.id===id);if(existing)return true;if(!this.canRecruit())return false;const u={...this.prepareRecruit(Recruitment.companion(id,this.character.level)),guest:true,questGuest:id};this.state.companions.push(u);this.state.troops[id]=I.apply(u).maxSoldiers;if(this.state.activeIds.length<this.activeLimit())this.state.activeIds.push(id);return true;}
    finishHeroQuest(id,stay){
      const d=H.definitions[id],q=this.state.heroQuests[id];if(!d||q?.stage!=='freed'||!Story.check(this,d.recruitRequires).ok||this.pending||this.journey||this.state.nodeId!==H.place(id,q))return false;const guest=this.state.companions.find(u=>u.id===id&&u.questGuest===id),unit=guest||this.prepareRecruit(Recruitment.companion(id,this.character.level));
      if(guest){delete guest.guest;delete guest.questGuest;if(!this.state.recruits[d.country].includes(id))this.state.recruits[d.country].push(id);if(!stay)this.dismiss(id);}
      else if(stay){if(!this.recordRecruit(id,d.country,unit)){this.lastQuestError=this.lastRecruitError;return false;}}
      else{if(!this.state.recruits[d.country].includes(id))this.state.recruits[d.country].push(id);this.state.residents[id]={...unit,startSoldiers:E.maxHealth(I.apply(unit).constitution)};}q.stage='complete';this.markQuestComplete(id);const items=this.claimEquipmentReward('hero:'+id);if(items.length){this.lastReward={title:'获得谢礼',gains:[],money:0,items};this.state.pendingReward=copy(this.lastReward);this.state.afterBattle=null;}return true;
    }
    nearbyRumor(at=this.state.nodeId){const from=D.placeMap[at];if(!from)return null;return Object.values(H.definitions).filter(d=>this.heroQuestVisible(d)&&this.state.heroQuests[d.id].stage===d.start&&!this.state.heroQuests[d.id].accepted&&d.rumor).map(d=>({id:d.id,text:d.rumor,place:H.place(d.id,this.state.heroQuests[d.id]),distance:Math.hypot(D.placeMap[d.place].x-from.x,D.placeMap[d.place].y-from.y),heard:this.state.heroQuests[d.id].heard})).filter(r=>r.distance<450).sort((a,b)=>Number(a.heard)-Number(b.heard)||a.distance-b.distance)[0]||null;}
    tavernRumor(at=this.state.nodeId){const from=D.placeMap[at];if(!from)return null;const place=[...Tavern.capitals].sort((a,b)=>Math.hypot(D.placeMap[a].x-from.x,D.placeMap[a].y-from.y)-Math.hypot(D.placeMap[b].x-from.x,D.placeMap[b].y-from.y))[0],city=D.placeMap[place].name;return {id:'tavern-recruit',place,text:(at===place?'城里的酒肆常有些游历的人歇脚。':'你要是想找人搭伴，可以去'+city+'的酒肆问问。')+'有会使兵器的，也有懂医术、会些法术的，掌柜认得他们，肯帮着引荐。先聊聊，看合不合得来，再请人同行。许昌、成都、建业都有这样的酒肆。'};}
    townRumor(at=this.state.nodeId){return !this.state.serviceRumors.tavern?this.tavernRumor(at):this.nearbyRumor(at);}
    visitTavern(){if(!this.tavernAvailable())return false;if(this.state.serviceRumors.tavern!=='visited'){this.state.serviceRumors.tavern='visited';this.markQuestComplete('tavern-recruit');}return true;}
    hearRumor(id,place){if(id==='tavern-recruit'){if(this.state.serviceRumors.tavern)return false;this.state.serviceRumors.tavern='heard';this.state.serviceRumors.tavernPlace=Tavern.capitals.includes(place)?place:this.tavernRumor()?.place;return true;}const d=H.definitions[id],q=this.state.heroQuests[id];if(!d||!q||['locked','complete'].includes(q.stage)||q.accepted||q.heard)return false;q.heard=true;return true;}
    completeHeroPuzzle(id){const q=this.state.heroQuests[id],stage=H.definitions[id]?.stages[q?.stage],choice=stage?.npc?.choices.find(c=>c.puzzle);if(!choice||!Puzzle.solved(Puzzle.normalize(q.puzzle)))return false;Story.apply(this,choice.effects);q.stage=choice.next;q.accepted=true;delete q.puzzle;return true;}
    canBeginStoryBattle(phase){const data=N.storyBattles[phase],q=this.state.quests.changshan;return !!data&&!this.pending&&!this.journey&&this.state.nodeId===data.place&&({entry:['available','entry'],grain:['supplies'],rescue:['rescue'],escort:['escort']}[phase]||[]).includes(q.stage)&&(phase==='entry'||!q.zhaoInvitation&&!q.healerDecision);}
    beginStoryBattle(phase){
      if(!this.canBeginStoryBattle(phase))return false;const q=this.state.quests.changshan;
      const checkpoint=this.snapshot();if(phase==='entry')q.stage='entry';
      this.pending={kind:'story',phase,to:this.state.nodeId,checkpoint,memberIds:this.members().map(u=>u.id),seed:this.state.seed+':story:'+phase+':'+q.grainWins};return true;
    }
    zhaoYunUnit(){
      const weapon={type:'spear',name:'白蜡枪',power:10},skills=W.forWeapon(weapon),u={...G.create('zhaoyun',3),id:'zhaoyun',name:'赵云',characterId:'zhaoyun',homeNode:'chengdu',guest:true,experience:0,experienceVersion:2,weaponPlanVersion:3,passives:['zhaoyun-courage','zhaoyun-seven-crossings','zhaoyun-ever-victorious','zhaoyun-loyal-guard'],equipment:{armor:{name:'轻甲'},accessory1:null,accessory2:null},weapon,attack:10,armor:6,resistance:3,weaponProficiencies:{spear:75},skills,priorities:W.prioritiesFor(skills)};
      return u;
    }
    zhenJiUnit(){
      const weapon={type:'needle',name:'金针',power:10},skills=W.forWeapon(weapon),priorities=W.prioritiesFor(skills);for(const rule of priorities){const skill=W.skills[rule.skill];if(skill.kind==='heal'){rule.selfThreshold=.8;rule.allyThreshold=.8;}if(skill.kind==='buff')rule.disabled=true;}
      return {...G.create('zhenji',this.character.level),id:'zhenji',unitType:'general',name:'甄姬',characterId:'zhenji',homeNode:'zhongshan-county',guest:true,experience:0,experienceVersion:2,weaponPlanVersion:3,passives:['benevolent-healer','zhenji-clear-water','zhenji-serenity'],weapon,attack:10,armor:3,resistance:5,equipment:{armor:{name:'绣纹轻衣'},accessory1:null,accessory2:null},weaponProficiencies:{needle:65},skills,priorities};
    }
    recruitZhenJi(){
      const q=this.state.quests.changshan;if(q.healerJoined||this.pending||this.journey||!['zhongshan','zhongshan-county'].includes(this.state.nodeId)||!this.canRecruit())return false;
      const unit=this.prepareRecruit(this.zhenJiUnit());if(['escort','return','decision','complete'].includes(q.stage)){delete unit.guest;q.healerStayDecided=true;}this.state.companions.push(unit);this.state.troops[unit.id]=E.maxHealth(unit.constitution);if(!this.state.recruits.wei.includes(unit.id))this.state.recruits.wei.push(unit.id);
      if(this.state.activeIds.length>=this.activeLimit()){const replaced=[...this.state.activeIds].reverse().find(id=>!['hero','zhaoyun'].includes(id));if(replaced)this.state.activeIds=this.state.activeIds.filter(id=>id!==replaced);}
      if(this.state.activeIds.length<this.activeLimit())this.state.activeIds.push(unit.id);q.healerRescued=true;q.healerJoined=true;q.healerDecision=false;return true;
    }
    npcUnit(id){
      this.syncCompanionLevels();const member=this.members().find(u=>u.id===id)||this.state.residents[id];if(member)return copy(member);
      if(['zhangjiao','zhangbao','zhangliang'].includes(id)){const P=node?require('./prologue.js'):root.PengpaiPrologue;return P.general(id,10);}
      if(H.definitions[id]){const d=H.definitions[id],phase=Object.keys(d.battles).find(k=>d.battles[k].duel&&(d.battles[k].stage.includes(this.state.heroQuests[id].stage)||d.stages[this.state.heroQuests[id].stage]?.npc?.choices?.some(c=>d.battles[k].stage.includes(c.next)))),fight=d.battles[phase];const u=Recruitment.companion(id,d.fixedCombatLevel||this.character.level);return fight?.duel?{...Recruitment.enemies(id,phase,this.character.level)[0],id,characterId:id,observationEnemy:true}:u;}const questNpc=Object.keys(H.definitions).map(id=>H.npc(id,this.state.heroQuests[id])).find(n=>n?.id===id&&n.observe);if(questNpc)return {...H.enemies(1)[0],id:questNpc.id,name:questNpc.name};if(id==='zhaoyun')return this.zhaoYunUnit();if(id==='zhenji')return this.zhenJiUnit();return null;
    }
    startChangshan(){
      const q=this.state.quests.changshan;if(this.state.nodeId!=='changshan'||!(q.stage==='available'||q.zhaoInvitation)||this.state.companions.some(u=>u.id==='zhaoyun')||this.pending||this.journey||!this.canRecruit())return false;const u=this.zhaoYunUnit();
      this.state.companions.push(u);this.state.troops[u.id]=E.maxHealth(u.constitution);if(this.state.activeIds.length>=this.activeLimit())this.state.activeIds.pop();this.state.activeIds.push(u.id);q.stage='supplies';q.zhaoInvitation=false;return true;
    }

    finishZhenStay(stay){const q=this.state.quests.changshan,u=this.state.companions.find(u=>u.id==='zhenji');if(!q.healerDecision||!u||this.pending||this.journey)return false;delete u.guest;q.healerDecision=false;q.healerStayDecided=true;if(!stay)this.dismiss('zhenji');return true;}

    advanceChangshan(){
      const q=this.state.quests.changshan,id=this.state.nodeId;
      if(q.stage==='supplies'&&id==='zhongshan'&&!q.healerRescued&&!q.healerJoined&&!q.zhaoInvitation){q.stage='rescue';return true;}
      if(q.stage==='return'&&id==='changshan'){q.stage='decision';return true;}return false;
    }
    beginQuestBattle(){return this.beginStoryBattle('rescue');}
    finishChangshan(stay){
      if(this.state.nodeId!=='changshan'||this.state.quests.changshan.stage!=='decision')return false;
      const u=this.state.companions.find(u=>u.id==='zhaoyun');if(!u)return false;delete u.guest;for(const member of this.state.companions)if(member.id==='zhenji')delete member.guest;u.homeNode='chengdu';if(!this.state.recruits.shu.includes(u.id))this.state.recruits.shu.push(u.id);this.state.quests.changshan.stage='complete';this.markQuestComplete('changshan');this.state.heroQuests.ganning.stage=H.definitions.ganning.start;this.state.heroQuests.ganning.accepted=false;for(const id of ['cs-blackwood','grain-escort','clear-mountain'])this.state.quests.side[id].heard=true;this.state.heroQuests.taishici.heard=true;this.state.heroQuests.taishici.accepted=false;if(!stay)this.dismiss(u.id);return true;
    }
    dismiss(id){
      const u=this.state.companions.find(u=>u.id===id);if(!u||u.guest||this.pending||this.journey)return false;const homeNode=u.homeNode||(id==='zhangliang'?'camp':null);if(!D.placeMap[homeNode])return false;
      this.state.residents[id]={...copy(u),homeNode,condition:this.state.conditions[id],startSoldiers:this.state.troops[id]??E.maxHealth(u.constitution)};this.state.companions=this.state.companions.filter(u=>u.id!==id);this.state.reserveOrder=this.state.reserveOrder.filter(value=>value!==id);this.state.activeIds=this.state.activeIds.filter(value=>value!==id);if(!this.state.activeIds.length)this.state.activeIds=['hero'];delete this.state.troops[id];delete this.state.conditions[id];return true;
    }
    inviteResident(id){this.syncCompanionLevels();const u=this.state.residents[id];if(!u||(u.origin==='tavern'&&!this.tavernAvailable())||this.state.releasedRetainers.includes(id)||(u.homeNode!==this.state.nodeId&&!(u.origin==='tavern'&&this.tavernAvailable()))||this.pending||this.journey||this.state.companions.some(c=>c.id===id)||!this.canRecruit())return false;this.state.companions.push(copy(u));this.state.troops[id]=u.startSoldiers??E.maxHealth(u.constitution);if(u.condition)this.state.conditions[id]=u.condition;if(this.state.activeIds.length<this.activeLimit())this.state.activeIds.push(id);delete this.state.residents[id];return true;}
    campAdvice(){
      if(!Object.values(this.state.trainingWins).some(Boolean))return ['我还是担心你在路上碰到乱兵。要是不急着走，先去教场找我三弟练练吧，他就在那边，想试什么兵器都能陪你，不会的也可以问他。'];
      if(this.state.quests.changshan.stage!=='complete')return [{available:'常山就在营地西北边，离得不远。前些天来投宿的人说，赵子龙在那里照顾逃难的乡亲，应该就是你想找的人，你可以先过去问问。',entry:'你要找的赵子龙就在常山村里。到了跟乡亲们打听一下，他们都认得他，也知道他平时在哪里帮忙。',supplies:(this.state.quests.changshan.healerRescued||this.state.quests.changshan.healerJoined)?'甄姑娘和伤者都平安就好。粮仓里若还有贼，你们先和子龙把粮夺回来，再安排人装车。常山的乡亲还在等着呢。':'中山的粮食一直没送到，看来不是临时耽误。你和子龙一起过去，把仓守找来问问，看看是路不通，还是粮车出了事情。',rescue:'听说甄姑娘被带去了毋极，你们先去找人。我二弟这里还有一些药，路上如果需要，可以回来拿，别让伤者一直拖着。',escort:'能把粮找回来就好。回常山的时候慢一点，车上还有伤者，中途觉得不舒服就停下来歇歇，不用为了赶路一直颠着他们。',return:'到了常山先找里正，让他叫人卸粮、分发。大家已经等了很久，村口一下围太多人，反而容易把车上的伤者挤着。',decision:'常山的事情暂时安排好了，你们也能歇一会儿。子龙以后准备去哪里，你问过没有？既然一起忙了这么久，也该坐下来好好聊聊。'}[this.state.quests.changshan.stage]||'你这趟出去还顺利吗？遇到什么不好处理的事情，告诉我们听听，能帮忙的地方，我们再一起想办法。'];
      if(!this.state.visited.includes('changshan'))return ['我听说赵子龙还在常山照顾流民，你可以先去村里找他。路上要是受伤，记得回来让我二弟看看，不要觉得回来一趟麻烦就硬撑。'];
      if(this.coalitionReady())return ['魏、蜀、吴都有了愿意帮忙的人，现在可以认真商量怎么对付董卓了。你先去跟各家负责的人谈谈，确定谁能出兵、谁来接应，再到洛阳去。'];
      const clue=D.clues.filter(c=>H.definitions[c.id]&&!this.state.recruits[c.faction].includes(c.id)&&!this.state.visited.includes(c.place)).sort((a,b)=>(this.findRoute(a.place)?.distance??Infinity)-(this.findRoute(b.place)?.distance??Infinity))[0];
      return [clue?clue.text:'你最近跑了不少地方，先在营里歇歇吧。找人的事情不用每次都急着赶路，遇到愿意聊天的乡亲，多问问附近的消息，也许就能有线索。'];
    }
    enemyLevel(){return Math.max(1,Math.min(this.character.level,this.state.enemyLevelCap));}
    unlockEnemyLevelCap(cap){if(!N.combatProgression.caps.includes(cap)||cap<=this.state.enemyLevelCap)return false;this.state.enemyLevelCap=cap;return true;}
    scaleEnemy(unit){const level=this.enemyLevel(),Catalog=node?require('./enemy-catalog.js'):root.EnemyCatalog;return Catalog.unit(unit.enemyRole||(/队长|头目/.test(unit.name)?'captain':'infantry'),level,0,{...unit,preserveIdentity:true});}
    trainingRoster(training){
      const level=({'militia-one':1,'militia-two':3,'militia-five':5})[training.id]||Math.min(5,training.count||1);
      if(training.rivals){const P=node?require('./prologue.js'):root.PengpaiPrologue;return training.rivals.map(id=>({...P.general(id,10),id:'training-'+id,characterId:id,formationRow:id==='zhangliang'?'front':'back'}));}
      if(training.dummy)return [{...G.create('yellowMilitia',1),id:'training-dummy',name:'稻草人',characterId:'training-dummy',unitType:'soldier',species:'object',weapon:null,attack:0,armor:2,resistance:0,skills:[],priorities:[],targetRule:'random',experienceWeight:.5}];
      const profiles=['yellowMilitia','yellowSkirmisher','yellowGuard'];return Array.from({length:training.count},(_,i)=>({...G.create(profiles[i%profiles.length],level),id:'training-militia-'+i,name:'黄巾军',characterId:'yellow-militia',weapon:{type:'spear',name:'木杆枪'},weaponProficiencies:{spear:30},attack:6,armor:2,resistance:0,skills:['spear-cut'],priorities:[{skill:'spear-cut',when:'always'}]}));
    }
    trainingAllies(training){return this.partyGroups().active.filter(u=>!training.rivals?.includes(u.id));}
    beginTraining(id){
      const training=D.trainingOptions.find(t=>t.id===id);if(!training||this.state.nodeId!=='camp'||!this.state.inside||this.pending||this.journey)return {ok:false,reason:'先到营中教场。'};
      const allies=this.trainingAllies(training);if(!allies.length)return {ok:false,reason:'张梁要下场陪练，请先让其他人出战。'};
      if(!allies.some(u=>u.startSoldiers>0))return {ok:false,reason:'先请张宝调理伤势，再来切磋。'};
      this.pending={kind:'training',trainingId:id,checkpoint:this.snapshot(),memberIds:this.members().map(u=>u.id),seed:this.state.seed+':training:'+id+':'+this.state.trainingWins[id]};this.lastReward=null;return {ok:true};
    }
    recruitZhangLiang(){
      if(!this.state.trainingWins['three-brothers']||this.state.companions.some(u=>u.id==='zhangliang'))return false;if(this.state.residents.zhangliang)return this.inviteResident('zhangliang');if(!this.canRecruit())return false;
      const P=node?require('./prologue.js'):root.PengpaiPrologue,u=this.prepareRecruit({...P.general('zhangliang',10),characterId:'zhangliang',homeNode:'camp',experience:0});this.state.companions.push(u);this.state.troops[u.id]=E.maxHealth(u.constitution);if(this.state.activeIds.length<this.activeLimit())this.state.activeIds.push(u.id);return true;
    }
    awardExperience(amount,ids=this.members().map(u=>u.id)){
      this.syncCompanionLevels();const old=this.members(),gains=[],value=member=>typeof amount==='function'?amount(member):amount;if(ids.includes('hero')){const gain=X.grant(this.character,value(this.character));this.character=gain.record;gains.push({id:'hero',name:this.character.name,...gain});}
      this.state.companions=this.state.companions.map(u=>{if(!ids.includes(u.id))return u;const gain=X.grant(u,value(u)),next=gain.record;if(next.growthVersion===1)delete next.maxSoldiers;gains.push({id:u.id,name:u.name,...gain});return next;});
      for(const member of this.members()){const before=old.find(u=>u.id===member.id);if(before&&member.maxSoldiers!==before.maxSoldiers)this.state.troops[member.id]=Math.floor((this.state.troops[member.id]??before.maxSoldiers)/before.maxSoldiers*member.maxSoldiers);}
      this.syncCompanionLevels();return {gains:gains.map(({id,name,amount,before,after,record})=>({id,name,amount,before,after,experienceBefore:old.find(u=>u.id===id)?.experience||0,experienceAfter:record.experience||0,requiredBefore:X.required(before),requiredAfter:X.required(after)}))};
    }
    beginTravel(to,{eventRoll}={}){
      if(D.placeMap[to]?.requiresWater)return {ok:false,reason:'水路尚未开通'};
      if(this.pending||this.journey||!neighbors(this.state.nodeId).includes(to))return {ok:false,reason:'只能前往相邻地标'};
      const checkpoint=this.snapshot(),from=this.state.nodeId,rng=E.seededRandom(this.state.roadSeed+':road:'+this.state.steps+':'+from+':'+to),roll=eventRoll??rng();let sample=roll*D.roadEvents.reduce((n,e)=>n+e.weight,0),event=D.roadEvents.at(-1);for(const e of D.roadEvents){sample-=e.weight;if(sample<0){event=e;break;}}
      const quietRequired=this.state.steps<D.travelRules.eventGraceSteps||(this.state.lastEventStep!==null&&this.state.steps-this.state.lastEventStep<D.travelRules.quietStepsAfterEvent);if(eventRoll===undefined&&quietRequired)event=D.roadEvents.find(e=>e.kind==='quiet');
      this.journey={from,to,checkpoint,event:copy(event),checked:false};return {ok:true,from,to};
    }
    travelEvent(){
      const j=this.journey;if(!j||j.checked)return null;j.checked=true;this.state.steps++;this.state.inside=false;const event=j.event;if(event.kind!=='quiet')this.state.lastEventStep=this.state.steps;
      if(event.kind==='battle')this.pending={from:j.from,to:j.to,checkpoint:j.checkpoint,encounterId:event.encounter||D.placeMap[j.to].encounterId,seed:this.state.seed+':fight:'+this.state.steps,kind:'battle'};
      const rumor=event.kind==='rumor'?(!this.state.serviceRumors.tavern&&this.state.steps%3===0?this.tavernRumor(j.to):this.nearbyRumor(j.to)):null;if(rumor)this.hearRumor(rumor.id,rumor.place);return {ok:true,kind:event.kind,title:event.title,text:rumor?.text||(event.kind==='rumor'?(D.placeMap[j.to].rumor||event.text):event.text),...(rumor?{clueId:rumor.id}:{}),...(event.choices?{choices:copy(event.choices)}:{})};
    }
    chooseRoadEvent(id){
      const j=this.journey;if(!j?.checked)return {ok:false};const choice=Q.choicesFor(j.event).find(c=>c.id===id);if(!choice)return {ok:false};
      if(choice.action==='battle'){if(!this.pending)this.pending={from:j.from,to:j.to,checkpoint:j.checkpoint,encounterId:j.event.encounter||'patrol',seed:this.state.seed+':fight:'+this.state.steps,kind:'battle'};return {ok:true,battle:true};}
      this.pending=null;this.markResolvedLeg();return {ok:true,battle:false};
    }
    markResolvedLeg(){if(this.journey){this.state.resolvedLeg={from:this.journey.from,to:this.journey.to};this.journey.checkpoint=this.snapshot();}}
    finishTravel(){if(!this.journey||!this.journey.checked||this.pending)return false;this.arrive(this.journey.to);this.journey=null;this.state.resolvedLeg=null;return true;}
    move(to,options={}){
      const start=this.beginTravel(to,options);if(!start.ok)return start;const result=this.travelEvent();if(result.kind==='battle')this.journey=null;else this.finishTravel();return result;
    }
    arrive(to){this.state.nodeId=to;this.state.inside=false;if(this.state.routeTarget===to)this.state.routeTarget=null;if(!this.state.visited.includes(to))this.state.visited.push(to);}
    storyAllies(phase){const allies=[...this.partyGroups().active];if(phase==='entry'&&!allies.some(u=>u.id==='zhaoyun')){if(allies.length>=this.activeLimit()){const index=allies.findLastIndex(u=>u.id!=='hero');if(index>=0)allies.splice(index,1);}allies.push(this.zhaoYunUnit());}return allies;}
    beginChapterBattle(){
      const q=this.state.chapterOne;if(this.state.nodeId!=='luoyang'||!this.state.inside||!this.coalitionReady()||this.pending||this.journey||['aftermath','complete'].includes(q.stage))return false;
      if(['gather','rally'].includes(q.stage))q.stage='vanguard';if(q.stage==='gate'&&this.state.story.flags.lvbuConvinced)q.stage='street';if(!Chapter.phases[q.stage])return false;
      q.accepted=true;this.unlockEnemyLevelCap(15);this.pending={kind:'chapter',phase:q.stage,to:'luoyang',checkpoint:this.snapshot(),memberIds:this.members().map(u=>u.id),seed:this.state.seed+':chapter:'+q.stage};return true;
    }
    completeChapterOne(){if(this.state.chapterOne.stage!=='aftermath')return false;this.state.chapterOne.stage='complete';this.state.chapterOne.endingIndex=0;this.state.story.flags.dongzhuoFreed=true;this.state.heroQuests.dongzhuo={...this.state.heroQuests.dongzhuo,stage:'freed',accepted:true};this.markQuestComplete('chapter-one');return true;}
    battleScenario({extraAllies=[]}={}){
      if(!this.pending)throw new Error('没有待结算的路遇战斗');
      if(this.pending.kind==='chapter'){const phase=Chapter.phases[this.pending.phase],enemies=Chapter.enemies(this.pending.phase);return {id:'chapter-'+this.pending.phase,title:phase.title,scene:Scenes.arrange(Scenes.get(phase.sceneId),enemies),allies:[...this.partyGroups().active,...extraAllies],enemies,passives:heroPassives(),rules:{difficulty:this.character.difficulty,partySlots:this.activeLimit(),bossBattle:true,seed:this.pending.seed,hit:true,critical:true}};}
      if(this.pending.kind==='heroQuest'){const p=this.pending,d=H.definitions[p.questId],fight=d.battles[p.phase],enemies=Recruitment.enemies(p.questId,p.phase,this.character.level).map(u=>({...u,...(root.CharacterAssets?root.CharacterAssets.resolve(u.characterId):{})}));return {id:p.questId+'-'+p.phase,title:fight.title,scene:Scenes.arrange(Scenes.get(fight.sceneId),enemies),allies:[...(fight.solo?this.members().filter(u=>u.id==='hero'):this.partyGroups().active),...[...new Set([fight.guest,...(fight.guests||[])].filter(Boolean))].filter(id=>!this.state.activeIds.includes(id)).map(id=>this.members().find(u=>u.id===id)||this.prepareRecruit(Recruitment.companion(id,this.character.level))),...(fight.solo?[]:extraAllies)],enemies,passives:heroPassives(),rules:{difficulty:this.character.difficulty,partySlots:fight.solo?1:this.activeLimit(),bossBattle:!!(fight.boss||fight.duel||fight.roster||fight.named),allySp:0,hit:true,critical:true,seed:p.seed}};}
      if(this.pending.kind==='training'){
        const training=D.trainingOptions.find(t=>t.id===this.pending.trainingId),enemies=this.trainingRoster(training).map(u=>({...u,...(root.CharacterAssets?.manifest.characters[u.characterId]?root.CharacterAssets.resolve(u.characterId):{})}));
        return {id:'camp-training',title:training.label,scene:Scenes.arrange(copy(D.townScenes.camp),enemies),allies:[...this.trainingAllies(training),...extraAllies],enemies,passives:heroPassives(),rules:{difficulty:this.character.difficulty,partySlots:this.activeLimit(),bossBattle:!!training.rivals,level:1,enemyLevel:1,allySp:0,random:true,hit:true,critical:true,seed:this.pending.seed}};
      }
      if(['story','side'].includes(this.pending.kind)){
        const p=this.pending,data=p.kind==='story'?N.storyBattles[p.phase]:N.sideQuests.find(q=>q.id===p.questId),level=data.fixedCombatLevel||Progression.recommended(data),count=p.kind==='story'?data.count:data.rounds===5?[2,3,2,3,5][this.state.quests.side[data.id].wins]:[2,3,5][Math.min(2,this.state.quests.side[data.id].wins)],enemies=(data.bossId?Optional.roster(data.bossId):(node?require('./enemy-catalog.js'):root.EnemyCatalog).roster(level,count,p.kind==='story'?(data.pattern||'earlyPhysical'):data.pattern||['patrol','arcane','venom','armored','ambush'][E.seedNumber(p.questId)%5])).map((u,i)=>({...u,...(root.CharacterAssets?root.CharacterAssets.resolve(u.characterId):{}),id:'local-enemy-'+i}));
        return {id:'local-'+p.kind,title:data.title,scene:Scenes.arrange(Scenes.get(data.sceneId||'rural-road'),enemies),allies:[...this.storyAllies(p.phase),...extraAllies],enemies,passives:heroPassives(),rules:{difficulty:this.character.difficulty,partySlots:this.activeLimit(),bossBattle:!!data.bossId,allySp:0,hit:true,critical:true,seed:p.seed}};
      }
      const troops=this.members(),allies=this.state.activeIds.map(id=>troops.find(u=>u.id===id)).filter(Boolean),encounter=D.encounters[this.pending.encounterId];if(!encounter)throw new Error('遭遇配置不存在');
      const count=encounter.count||D.placeMap[this.pending.to].encounterCount||1,enemies=N.mixRoster(Array.from({length:count},(_,i)=>{const unit=copy(encounter.roster[i%encounter.roster.length]),art=root.CharacterAssets?.manifest.characters[unit.characterId]?root.CharacterAssets.resolve(unit.characterId):{};return {...this.scaleEnemy(unit),...art,id:encounter.id+'-'+i};}),this.enemyLevel()>=3?N.mixedRoles(count,E.seedNumber(this.pending.seed)):null,{army:encounter.id==='patrol'}).map(u=>({...u,...(root.CharacterAssets?.manifest.characters[u.characterId]?root.CharacterAssets.resolve(u.characterId):{})}));
      const passives=heroPassives();
      return {id:'road-encounter',title:encounter.title,scene:Scenes.arrange(copy(encounter.scene),enemies),allies:[...allies,...extraAllies],enemies,passives,rules:{...copy(encounter.rules),difficulty:this.character.difficulty,partySlots:this.activeLimit(),seed:this.pending.seed}};
    }
    awardProficiency(result){
      const gains=[];for(const use of F.rewards(result)){
        const record=use.id==='hero'?this.character:this.state.companions.find(u=>u.id===use.id);if(!record)continue;
        const gain=F.grant(record,use.type,use.amount);if(use.id==='hero')this.character=gain.record;else this.state.companions=this.state.companions.map(u=>u.id===use.id?gain.record:u);
        gains.push({...gain,id:use.id,name:record.name,uses:use.uses});
      }return gains;
    }
    resolveBattle(result){
      if(!this.pending)return false;const pending=this.pending,scenario=this.battleScenario();this.pending=null;this.lastReward=null;
      const practice=pending.kind==='heroQuest'&&H.definitions[pending.questId].battles[pending.phase].acceptDefeat;if(result.result!=='victory'&&!practice){const mapZoom=this.state.mapZoom;this.state=normalize(this.character,pending.checkpoint);this.state.mapZoom=mapZoom;this.journey=null;this.cancelRoute();if(pending.kind==='training')this.rest();return false;}
      for(const u of result.units||[])if(u.side==='ally'&&this.members().some(m=>m.id===u.id)){this.state.troops[u.id]=u.soldiers;this.state.conditions[u.id]=u.dead?'dead':u.wounded?'wounded':'healthy';}
      const proficiencyGains=this.awardProficiency(result);
      const defeated=(result.units||[]).filter(u=>u.side==='enemy'),foes=defeated.length?defeated:scenario.enemies,firstVictory=pending.kind==='story'&&pending.phase==='entry'&&this.character.level===1;this.lastReward=this.awardExperience(member=>practice?0:X.reward(foes,member)+(firstVictory&&member===this.character?20:0),pending.memberIds||this.members().map(u=>u.id));this.lastReward.proficiencies=proficiencyGains;if(firstVictory)this.lastReward.milestone={label:'初战历练',experience:20};
      const rng=E.seededRandom(pending.seed+':loot:'+this.state.battleSerial++),drops=pending.kind==='training'||practice?{money:0,items:[]}:I.loot(foes,rng);this.state.money+=drops.money;this.lastReward.money=drops.money;this.lastReward.items=drops.items.map(i=>this.addItem(i));
      if(pending.kind==='story'){const q=this.state.quests.changshan;if(pending.phase==='entry'){q.stage='supplies';q.zhaoInvitation=!this.state.companions.some(u=>u.id==='zhaoyun');}else if(pending.phase==='grain'){q.grainWins++;q.stage=q.grainWins>=2?'escort':'supplies';if(q.grainWins>=2&&!q.healerStayDecided&&this.state.companions.some(u=>u.id==='zhenji'))q.healerDecision=true;this.lastReward.progress={label:'夺回粮车',value:q.grainWins/2};}else if(pending.phase==='rescue'){q.healerRescued=true;this.recruitZhenJi();q.stage=q.grainWins>=2?'escort':'supplies';}else if(pending.phase==='escort')q.stage='return';this.state.inside=true;}
      if(pending.kind==='side'){const data=N.sideQuests.find(q=>q.id===pending.questId),q=this.state.quests.side[data.id];q.wins++;this.lastReward.progress={label:data.title,value:q.wins/data.rounds};this.state.inside=true;if(data.dungeon&&q.wins>=data.rounds){q.paid=true;this.lastReward.items.push(this.addItem(I.roll(data.item,'green',rng,undefined,data.fixedCombatLevel)));this.state.money+=data.money;this.lastReward.money+=data.money;this.markQuestComplete(data.id);}}
      if(pending.kind==='heroQuest'){const d=H.definitions[pending.questId],fight=d.battles[pending.phase];this.state.heroQuests[d.id].stage=fight.next;Story.apply(this,fight.effects);this.lastReward.progress={label:d.title,value:d.id==='ganning'&&pending.phase==='breach'?.5:1};if(practice)this.rest();this.state.inside=true;}
      if(pending.kind==='story')this.lastReward.items.push(...this.claimEquipmentReward('story:'+pending.phase));
      const bonus=(pending.kind==='heroQuest'?H.definitions[pending.questId].battles[pending.phase]:pending.kind==='story'?N.storyBattles[pending.phase]:null)?.reward;if(bonus){this.state.money+=bonus.money||0;this.lastReward.money+=bonus.money||0;for(const item of bonus.items||[])this.lastReward.items.push(this.addItem(item.templateId,item.quality));}
      if(pending.kind==='chapter'){let next=Chapter.phases[pending.phase].next;if(next==='gate'&&this.state.story.flags.lvbuConvinced)next='street';this.state.chapterOne.stage=next;this.state.inside=true;this.lastReward.progress={label:'洛阳战线',value:(Object.keys(Chapter.phases).indexOf(pending.phase)+1)/6};}
      this.lastReward.story=Feedback.battle(pending,this);if(this.lastReward.milestone&&this.lastReward.story)this.lastReward.story.text+=' 初战历练额外获得20经验。';
      this.state.afterBattle={kind:pending.kind,phase:pending.phase,questId:pending.questId,trainingId:pending.trainingId};this.state.pendingReward=copy(this.lastReward);
      if(pending.kind==='training'){this.state.trainingWins[pending.trainingId]++;this.state.inside=true;this.rest();}else if(pending.kind==='quest'){this.state.quests.changshan.stage='return';this.state.inside=true;}else if(!['story','side','heroQuest','chapter'].includes(pending.kind)){if(!this.journey)this.arrive(pending.to);else this.markResolvedLeg();}return true;
    }
    saveTactics(unit){this.state.tactics[unit.id]={initialMode:unit.mode,priorities:copy(unit.priorities),targetRule:unit.targetRule};if(this.pending)this.pending.checkpoint.tactics=copy(this.state.tactics);if(this.journey)this.journey.checkpoint.tactics=copy(this.state.tactics);}
  }
  const clampTroops=(value,max)=>Math.max(0,Math.min(max,Number.isFinite(Number(value))?Number(value):max));
  const heroPassives=()=>Object.fromEntries(R.PASSIVES.map(p=>[p.id,(node?require('./passives.js'):root.BattlePassives).definitions[p.id]]));
  const api={World,normalize,neighbors,shortestRoute,heroUnit,heroPassives,countries};root.WorldModel=api;if(node)module.exports=api;
})(globalThis);
