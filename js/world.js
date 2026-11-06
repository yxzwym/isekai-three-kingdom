(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports,D=node?require('./world-data.js'):root.WorldData,E=node?require('./engine.js'):root.BattleEngine,R=node?require('./game-rules.js'):root.PengpaiRules,W=node?require('./weapon-skills.js'):root.WeaponSkills;
  const I=node?require('./items.js'):root.ItemCatalog,N=node?require('./nearby-content.js'):root.NearbyContent;
  const G=node?require('./character-growth.js'):root.CharacterGrowth,Scenes=node?require('./battle-scenes.js'):root.BattleScenes;
  const F=node?require('./proficiency.js'):root.WeaponProficiency,H=node?require('./hero-quests.js'):root.HeroQuests;
  const X=node?require('./experience.js'):root.CharacterExperience,Q=node?require('./timed-choice.js'):root.TimedChoice;
  const copy=x=>JSON.parse(JSON.stringify(x)),countries=['wei','shu','wu'],placeId=id=>Object.hasOwn(D.placeAliases,id)?D.placeAliases[id]:id,neighbors=id=>D.roads.flatMap(([a,b])=>a===id?[b]:b===id?[a]:[]),safeObject=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
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
    const effects=(character.passives||[]).map(id=>R.PASSIVE_MAP[id]?.effects||{});
    for(const effect of effects){if(effect.guaranteedCritical)unit.guaranteedCritical=true;if(effect.ignoreArmor)unit.ignoreArmor=true;if(effect.physicalDodge)unit.dodge=(unit.dodge||0)+effect.physicalDodge;}
    if(root.PengpaiAssets?.protagonists[character.appearance]){const art=root.PengpaiAssets.protagonists[character.appearance];unit.fullbody={src:art.src};unit.portrait={src:art.src,crop:art.portrait};}
    return unit;
  }
  function normalize(character,value={}){
    character=G.normalizeCharacter(character);const s=copy(safeObject(value));if(s.weaponCatalogVersion!==1&&s.weaponType){const C=node?require('./weapon-catalog.js'):root.WeaponCatalog;s.weaponType=C.legacyAliases[s.weaponType]||s.weaponType;}const nodeId=placeId(s.nodeId),used=new Set(),recruits={};for(const country of countries)recruits[country]=(Array.isArray(s.recruits?.[country])?s.recruits[country]:[]).filter(id=>{if(typeof id!=='string'||!id||used.has(id))return false;used.add(id);return true;});
    const companions=(Array.isArray(s.companions)?s.companions:[]).filter(u=>u&&typeof u.id==='string'&&u.id!=='hero').filter((u,i,a)=>a.findIndex(x=>x.id===u.id)===i).map(G.normalizeKnownPotentials).map(X.normalizeRecord).map(W.migrateWeaponPlan),ids=new Set(['hero',...companions.map(u=>u.id)]);
    const activeLimit=Math.max(4,Math.min(7,Math.floor(Number(s.activeLimit)||4)));
    const active=(Array.isArray(s.activeIds)?s.activeIds:['hero']).filter((id,i,a)=>ids.has(id)&&a.indexOf(id)===i).slice(0,activeLimit);
    const state={version:3,activeLimit,weaponCatalogVersion:1,weapon:s.weapon?I.weaponRecord(s.weapon):null,conditions:copy(safeObject(s.conditions)),nodeId:Object.hasOwn(D.placeMap,nodeId)?nodeId:'camp',inside:Object.hasOwn(D.placeMap,nodeId)&&!!s.inside,weaponType:R.WEAPON_TYPES.some(t=>t.id===s.weaponType)?s.weaponType:null,visited:[...new Set(['camp',...(Array.isArray(s.visited)?s.visited.map(placeId).filter(id=>Object.hasOwn(D.placeMap,id)):[])])],steps:Math.max(0,Math.floor(Number(s.steps)||0)),lastEventStep:Number.isInteger(s.lastEventStep)?Math.max(0,s.lastEventStep):null,introStep:Number.isInteger(s.introStep)?Math.max(0,Math.min(2,s.introStep)):(Number(s.steps)>0||s.inside||(nodeId&&nodeId!=='camp')?2:0),seed:typeof s.seed==='string'?s.seed:character.name+':'+Object.values(character.attributes||{}).join('-'),recruits,companions,activeIds:active.length?active:['hero'],reserveOrder:(Array.isArray(s.reserveOrder)?s.reserveOrder:[]).filter((id,i,a)=>ids.has(id)&&a.indexOf(id)===i),troops:copy(safeObject(s.troops)),tactics:copy(safeObject(s.tactics))};
    if([1,2].includes(s.version)&&Number.isFinite(Number(state.troops.hero))){const previousConstitution=(character.legacyMaxHealth||E.maxHealth(character.attributes.constitution))/10,oldMax=s.version===1?Math.max(1,Math.round(200*previousConstitution/255)):previousConstitution*10;state.troops.hero=Math.floor(E.maxHealth(character.attributes.constitution)*Math.min(1,Number(state.troops.hero)/oldMax));}
    state.inside=state.nodeId==='camp'&&state.inside;
    for(const u of companions)if(u.weaponPlanMigrated){if(state.tactics[u.id])delete state.tactics[u.id].priorities;delete u.weaponPlanMigrated;}
    state.trainingWins=Object.fromEntries(D.trainingOptions.map(t=>[t.id,Math.max(0,Math.floor(Number(s.trainingWins?.[t.id])||0))]));
    const stages=['available','entry','supplies','rescue','escort','return','decision','complete'],oldQuest=safeObject(s.quests?.changshan);state.quests={changshan:{stage:stages.includes(oldQuest.stage)?oldQuest.stage:'available',arrivalIndex:Math.max(0,Math.min(N.storyConversations.changshanEntry.length-1,Math.floor(Number(oldQuest.arrivalIndex)||0))),arrivalSeen:!!oldQuest.arrivalSeen,zhaoInvitation:!!oldQuest.zhaoInvitation,healerDecision:!!oldQuest.healerDecision,healerStayDecided:!!oldQuest.healerStayDecided,healerJoined:!!oldQuest.healerJoined||companions.some(u=>u.id==='zhenji')||recruits.wei.includes('zhenji'),grainWins:Math.max(0,Math.min(2,Number.isInteger(oldQuest.grainWins)?oldQuest.grainWins:(['rescue','escort','return','decision','complete'].includes(oldQuest.stage)?2:0)))},side:copy(safeObject(s.quests?.side))};
    state.economyVersion=1;state.money=Math.max(0,Math.floor(Number(s.money??200)||0));state.inventory=Array.isArray(s.inventory)?copy(s.inventory).filter(i=>i&&typeof i.uid==='string').map(i=>i.slot==='weapon'||i.type?{...I.weaponRecord(i),slot:'weapon'}:i):[];state.itemSerial=Math.max(0,Math.floor(Number(s.itemSerial)||0));state.battleSerial=Math.max(0,Math.floor(Number(s.battleSerial)||0));state.heroEquipment=copy(s.heroEquipment||{armor:I.create('cloth-armor','white','initial-cloth'),accessory1:null,accessory2:null});state.showParty=s.showParty!==false;state.outfitted=!!s.outfitted||!!s.weaponType||!!s.weapon;state.pendingReward=s.pendingReward?copy(s.pendingReward):null;state.afterBattle=s.afterBattle?copy(s.afterBattle):null;state.npcTalks=copy(safeObject(s.npcTalks));
    for(const quest of N.sideQuests){const old=safeObject(state.quests.side[quest.id]),oldRounds=old.rounds||(s.questProgressVersion===2?quest.rounds:quest.rounds===5?10:quest.rounds),wins=Math.floor((Number(old.wins)||0)*quest.rounds/oldRounds);state.quests.side[quest.id]={accepted:!!old.accepted,wins:Math.max(0,Math.min(quest.rounds,wins)),rounds:quest.rounds,paid:!!old.paid};}
    state.heroQuests=H.normalize(s.heroQuests,state.quests.changshan.stage==='complete');for(const d of Object.values(H.definitions))if(countries.some(c=>state.recruits[c].includes(d.id)))state.heroQuests[d.id].stage='complete';
    const completeIds=[...(state.quests.changshan.stage==='complete'?['changshan']:[]),...N.sideQuests.filter(q=>state.quests.side[q.id].paid).map(q=>q.id),...Object.keys(H.definitions).filter(id=>state.heroQuests[id].stage==='complete'),...(countries.every(c=>state.recruits[c].length>=3)?['coalition']:[])];
    state.questCompletions=Object.fromEntries(Object.entries(safeObject(s.questCompletions)).filter(([id,n])=>completeIds.includes(id)&&Number.isSafeInteger(n)&&n>0));state.questCompletionSerial=Math.max(0,Number.isSafeInteger(s.questCompletionSerial)?s.questCompletionSerial:0,...Object.values(state.questCompletions));for(const id of completeIds)if(!state.questCompletions[id])state.questCompletions[id]=++state.questCompletionSerial;
    state.mapZoom=Number.isFinite(Number(s.mapZoom))&&Number(s.mapZoom)>0?Math.max(.05,Math.min(3.6,Number(s.mapZoom))):D.mapRules.defaultZoom;state.questProgressVersion=2;state.enemyLevelCap=N.combatProgression.caps.includes(s.enemyLevelCap)?s.enemyLevelCap:N.combatProgression.initialCap;
    state.residents=Object.fromEntries(Object.entries(safeObject(s.residents)).filter(([id,u])=>u&&u.id===id&&id!=='hero'&&D.placeMap[u.homeNode]&&!ids.has(id)).map(([id,u])=>[id,W.migrateWeaponPlan(X.normalizeRecord(G.normalizeKnownPotentials(u)))]));
    for(const u of Object.values(state.residents))if(u.weaponPlanMigrated){if(state.tactics[u.id])delete state.tactics[u.id].priorities;delete u.weaponPlanMigrated;}
    for(const u of [...companions,...Object.values(state.residents)])if(u.id==='zhangliang'&&u.level<15){const old=I.apply(u),attributes=G.attributesAt(u.baseAttributes,u.potentials,15);Object.assign(u,{level:15,attributes},attributes);delete u.maxSoldiers;const max=I.apply(u).maxSoldiers;if(Object.hasOwn(state.troops,u.id))state.troops[u.id]=Math.floor(state.troops[u.id]/old.maxSoldiers*max);if(u.startSoldiers!=null)u.startSoldiers=Math.floor(u.startSoldiers/old.maxSoldiers*max);}
    if(state.nodeId!=='camp')state.inside=!!s.inside&&(N.npcs.some(n=>n.place===state.nodeId&&(!n.unlockQuest||state.heroQuests[n.unlockQuest]?.stage!=='locked'))||Object.values(H.definitions).some(d=>d.place===state.nodeId&&H.npc(d.id,state.heroQuests[d.id]))||Object.values(state.residents).some(u=>u.homeNode===state.nodeId));
    const resumed=s.resolvedLeg;state.resolvedLeg=resumed&&resumed.from===state.nodeId&&neighbors(state.nodeId).includes(resumed.to)?{from:resumed.from,to:resumed.to}:null;
    const target=placeId(s.routeTarget);state.routeTarget=target!==state.nodeId&&shortestRoute(state.nodeId,target)?target:null;
    state.troops.hero=Math.max(0,Math.min(E.maxHealth(character.attributes?.constitution),Number.isFinite(Number(state.troops.hero))?Number(state.troops.hero):E.maxHealth(character.attributes?.constitution)));return state;
  }
  class World{
    constructor(character,saved){this.character=X.normalizeRecord(G.normalizeCharacter(character));if(this.character.weaponCatalogVersion!==1){const C=node?require('./weapon-catalog.js'):root.WeaponCatalog,values={};for(const [id,value]of Object.entries(this.character.weaponProficiencies||{})){const key=C.legacyAliases[id]||id;values[key]=Math.max(values[key]||0,value);}this.character.weaponProficiencies=values;this.character.weaponCatalogVersion=1;}this.state=normalize(this.character,saved);if(this.state.weaponType&&!this.state.weapon)this.state.weapon=I.create('weapon-'+this.state.weaponType,'white','initial-weapon');this.pending=null;this.journey=this.state.resolvedLeg?{...this.state.resolvedLeg,checkpoint:this.snapshot(),event:{kind:'quiet'},checked:true}:null;this.lastReward=null;}
    snapshot(){return copy(this.state);}
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
    coalitionReady(){return countries.every(id=>this.state.recruits[id].length>=3);}
    chooseWeapon(type){if(!R.WEAPON_TYPES.some(t=>t.id===type))return false;this.state.weaponType=type;this.state.weapon=I.create('weapon-'+type,'white','initial-weapon');this.state.outfitted=true;delete this.state.tactics.hero;return true;}
    equipWeapon(weapon){if(!weapon||!weapon.type)return false;const resolved=W.resolveWeapon(weapon);W.forWeapon(resolved);this.state.weapon=copy(resolved);this.state.weaponType=resolved.type;this.state.outfitted=true;delete this.state.tactics.hero;return true;}
    members(){return [heroUnit(this.character,this.state),...this.state.companions.map(raw=>{const u=I.apply(copy(raw)),max=u.maxSoldiers??E.maxHealth(u.constitution);return {...u,...(root.CharacterAssets?.manifest.characters[u.characterId||u.id]?root.CharacterAssets.resolve(u.characterId||u.id):{}),maxSoldiers:max,condition:this.state.conditions[u.id],dead:this.state.conditions[u.id]==='dead',startSoldiers:clampTroops(this.state.troops[u.id]??max,max),...safeObject(this.state.tactics[u.id]),...(!u.weapon?{attack:0,skills:W.forWeapon(null),priorities:W.prioritiesFor(W.forWeapon(null))}:{})};})];}
    addItem(template,quality='white'){const item=I.create(template,quality,'item-'+(++this.state.itemSerial));this.state.inventory.push(item);return copy(item);}
    equipped(id,slot){if(id==='hero')return slot==='weapon'?this.state.weapon:this.state.heroEquipment[slot];const u=this.state.companions.find(u=>u.id===id);return slot==='weapon'?u?.weapon:u?.equipment?.[slot];}
    changeEquipment(id,slot,uid){
      if(this.pending||this.journey||!['weapon','armor','accessory1','accessory2'].includes(slot)||!this.members().some(u=>u.id===id))return false;
      const item=uid?this.state.inventory.find(i=>i.uid===uid):null;if(uid&&(!item||!I.compatible(item,slot)))return false;const old=this.equipped(id,slot),owner=this.members().find(u=>u.id===id),hp=owner.startSoldiers;
      if(uid)this.state.inventory=this.state.inventory.filter(i=>i.uid!==uid);if(old){const restored={...copy(old),slot:slot.startsWith('accessory')?'accessory':slot,quality:old.quality||'white',uid:old.uid||'item-'+(++this.state.itemSerial)};if(slot==='weapon'&&restored.power==null)restored.power=Math.max(0,Number(restored.attack??owner.attack)||0);this.state.inventory.push(restored);}
      if(id==='hero'){if(slot==='weapon'){this.state.weapon=item?copy(item):null;this.state.weaponType=item?.type||null;}else this.state.heroEquipment[slot]=item?copy(item):null;}
      else {const u=this.state.companions.find(u=>u.id===id);u.equipment||={};if(slot==='weapon')u.weapon=item?copy(item):null;else u.equipment[slot]=item?copy(item):null;}
      if(slot==='weapon'){const member=id==='hero'?null:this.state.companions.find(u=>u.id===id),skills=W.forWeapon(item);if(member){member.skills=skills;member.priorities=W.prioritiesFor(skills);}if(this.state.tactics[id])delete this.state.tactics[id].priorities;}
      this.state.troops[id]=Math.min(hp,this.members().find(u=>u.id===id).maxSoldiers);return true;
    }
    buyItem(template){const t=I.templates[template];if(!t||this.state.money<t.price||this.pending||this.journey)return false;this.state.money-=t.price;this.addItem(template);return true;}
    sellItem(uid){const item=this.state.inventory.find(i=>i.uid===uid);if(!item||this.pending||this.journey)return false;this.state.money+=I.sellPrice(item);this.state.inventory=this.state.inventory.filter(i=>i.uid!==uid);return true;}
    sellItems(uids){
      if(this.pending||this.journey||!Array.isArray(uids))return false;const selected=new Set(uids),items=this.state.inventory.filter(i=>selected.has(i.uid));if(!selected.size||items.length!==selected.size)return false;
      const money=items.reduce((sum,item)=>sum+I.sellPrice(item),0);this.state.inventory=this.state.inventory.filter(i=>!selected.has(i.uid));this.state.money+=money;return {count:items.length,money};
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
    recordRecruit(id,country,unit){if(!countries.includes(country)||typeof id!=='string'||!id||id==='hero'||countries.some(c=>this.state.recruits[c].includes(id)))return false;if(unit&&!this.canRecruit())return false;this.state.recruits[country].push(id);if(unit){this.state.companions.push(W.migrateWeaponPlan({...copy(unit),id}));this.state.troops[id]=unit.maxSoldiers??E.maxHealth(unit.constitution);if(this.state.activeIds.length<this.activeLimit())this.state.activeIds.push(id);}if(this.state.heroQuests[id]){this.state.heroQuests[id].stage='complete';this.markQuestComplete(id);}if(this.coalitionReady())this.markQuestComplete('coalition');return true;}
    sceneNpcs(){
      const id=this.state.nodeId,stage=this.state.quests.changshan.stage,npcs=id==='camp'?D.townNpcs.camp.filter(n=>!this.state.companions.some(u=>u.id===n.id)):N.npcs.filter(n=>n.place===id&&(!n.unlockQuest||this.state.heroQuests[n.unlockQuest]?.stage!=='locked')).map(copy);
      if(id==='changshan'&&stage!=='complete'&&!this.state.companions.some(u=>u.id==='zhaoyun'))npcs.unshift(D.questNpcs.zhaoyun);
      if(id==='zhongshan-county'&&(this.state.quests.changshan.healerJoined||['return','decision','complete'].includes(stage))&&!this.state.companions.some(u=>u.id==='zhenji')&&!this.state.residents.zhenji)npcs.unshift(D.questNpcs.zhenji);
      for(const u of Object.values(this.state.residents))if(u.homeNode===id&&!npcs.some(n=>n.id===u.id))npcs.push({id:u.id,name:u.name,art:u.characterId||u.id,side:'left',role:'companion',roleLabel:'同行'});for(const data of N.sideQuests){const q=this.state.quests.side[data.id];if(q.accepted&&!q.paid&&q.wins<data.rounds&&data.place===id)npcs.push({id:'side-enemy-'+data.id,name:data.enemyName||'拦路盗匪',art:data.enemyArt||'brigand',role:'sideBattle',roleLabel:'剿匪',questId:data.id,side:'left'});}for(const d of Object.values(H.definitions)){const n=H.npc(d.id,this.state.heroQuests[d.id]);if(n&&d.place===id&&!d.stages[this.state.heroQuests[d.id].stage].strictDialogue)npcs.push(n);}return npcs.filter(n=>!this.state.companions.some(u=>u.id===n.id));
    }
    enter(){if(this.location().id!=='camp'&&!this.sceneNpcs().length)return false;this.state.inside=true;return this.location();}
    leave(){this.state.inside=false;}
    rest(){for(const u of this.members()){this.state.troops[u.id]=u.maxSoldiers;delete this.state.conditions[u.id];}}
    quests(){
      const q=this.state.quests.changshan,at=id=>this.state.nodeId===id,objectives={available:'前往常山，查看村口的动静',entry:'与赵云合力击退村口盗匪',supplies:q.healerJoined?(at('zhongshan')?'夺回中山粮仓':'前往中山夺回粮仓')+' · '+q.grainWins*50+'%':at('zhongshan')?'向仓守打听粮车下落':'前往中山打听粮车下落',rescue:at('zhongshan-county')?'救出被扣押的甄家医者':'前往毋极寻找甄家医者',escort:'护送粮车返回常山',return:'向常山里正复命',decision:'与赵云商议去留',complete:'常山的乡民已安顿妥当'};
      return [...D.questDefinitions.map(t=>({...t,complete:t.id==='changshan'?q.stage==='complete':this.coalitionReady(),taskStatus:t.id==='changshan'?(q.stage==='complete'?null:q.stage==='available'?'available':['return','decision'].includes(q.stage)?'ready':'active'):(this.coalitionReady()?null:'active'),objective:t.id==='changshan'?(q.zhaoInvitation?'与赵云商议中山之行':q.healerDecision?'与甄姑娘商议去留':objectives[q.stage]):'为魏、蜀、吴招募英雄'})),...Object.values(H.definitions).filter(d=>this.state.heroQuests[d.id].stage!=='locked').map(d=>({...d,target:d.place,accepted:true,complete:this.state.heroQuests[d.id].stage==='complete',taskStatus:this.state.heroQuests[d.id].stage==='complete'?null:this.state.heroQuests[d.id].stage==='freed'?'ready':'active',objective:d.stages[this.state.heroQuests[d.id].stage].objective})),...N.sideQuests.map(t=>{
        const s=this.state.quests.side[t.id],giver=N.npcs.find(n=>n.id===t.giver).name,done=s.wins>=t.rounds,target=s.accepted&&!done?t.place:t.giverPlace;
        const objective=s.paid?'委托已完成':!s.accepted?'向'+D.placeMap[t.giverPlace].name+'的'+giver+'询问委托':done?'返回'+D.placeMap[t.giverPlace].name+'向'+giver+'复命':(at(t.place)?'在':'前往')+D.placeMap[t.place].name+'剿匪 · '+Math.floor(s.wins/t.rounds*100)+'%';
        return {...t,category:'side',complete:s.paid,taskStatus:s.paid?null:!s.accepted?'available':done?'ready':'active',accepted:s.accepted,target,objective};
      })].map(q=>({...q,completionOrder:this.state.questCompletions[q.id]||0})).sort((a,b)=>Number(a.complete)-Number(b.complete)||(a.complete?b.completionOrder-a.completionOrder:0));
    }
    npcQuestStatus(npc){const q=this.state.quests.changshan,quests=this.quests(),statuses=[],add=id=>{const status=quests.find(q=>q.id===id)?.taskStatus;if(status)statuses.push(status);};if(npc.questId)add(npc.questId);if(npc.heroQuest)add(npc.heroQuest);for(const data of N.sideQuests)if(data.giver===npc.id)add(data.id);if(npc.id==='zhaoyun'&&q.stage!=='complete'&&npc.role!=='companion')add('changshan');if(npc.id==='changshan-elder'&&q.stage==='return')add('changshan');if(npc.id==='grain-steward'&&q.stage==='supplies')add('changshan');if(npc.id==='refugee-laborer'&&q.stage==='rescue')add('changshan');return ['ready','available','active'].find(status=>statuses.includes(status))||null;}
    questDestination(){const q=this.state.quests.changshan;if(q.zhaoInvitation)return 'changshan';if(q.healerDecision)return 'zhongshan';if(q.stage==='complete'){const d=Object.values(H.definitions).find(d=>!['locked','complete'].includes(this.state.heroQuests[d.id].stage));return d?.place||null;}return {available:'changshan',entry:'changshan',supplies:'zhongshan',rescue:'zhongshan-county',escort:'changshan',return:'changshan',decision:'changshan'}[this.state.quests.changshan.stage]||null;}
    questMarkers(){
      const markers=Object.values(H.definitions).filter(d=>!['locked','complete'].includes(this.state.heroQuests[d.id].stage)).map(d=>({place:d.place,questId:d.id,category:'story',title:d.title,accepted:true})),near=new Set([this.state.nodeId,...neighbors(this.state.nodeId)]),destination=this.questDestination(),started=this.state.quests.changshan.stage!=='available';
      if(this.state.quests.changshan.stage!=='complete'&&destination&&(started||near.has(destination)))markers.push({place:destination,questId:'changshan',category:'story',title:'常山归途',accepted:started});
      for(const quest of N.sideQuests){const q=this.state.quests.side[quest.id];if(!q.paid&&(q.accepted||near.has(quest.giverPlace)))markers.push({place:q.accepted&&q.wins<quest.rounds?quest.place:quest.giverPlace,questId:quest.id,category:'side',title:quest.title,accepted:q.accepted});}
      const states=new Map(this.quests().map(q=>[q.id,q.taskStatus])),priority={ready:0,available:1,active:2};return markers.map(mark=>({...mark,taskStatus:states.get(mark.questId)})).sort((a,b)=>(priority[a.taskStatus]??3)-(priority[b.taskStatus]??3));
    }
    acceptSide(id){const q=this.state.quests.side[id];if(!q||q.accepted)return false;q.accepted=true;return true;}
    turnInSide(id){const data=N.sideQuests.find(t=>t.id===id),q=this.state.quests.side[id];if(!data||!q?.accepted||q.paid||q.wins<data.rounds||this.state.nodeId!==data.giverPlace||this.pending||this.journey)return false;q.paid=true;this.markQuestComplete(id);this.state.money+=data.money;const reward={gains:[],money:data.money,items:[this.addItem(data.item,data.quality)],completedQuest:data.title};this.lastReward=reward;this.state.pendingReward=copy(reward);this.state.afterBattle={kind:'quest-turn-in',questId:id};return reward;}
    beginSideBattle(id){const data=N.sideQuests.find(q=>q.id===id),q=this.state.quests.side[id];if(!data||!q?.accepted||q.wins>=data.rounds||this.state.nodeId!==data.place||this.pending||this.journey)return false;this.pending={kind:'side',questId:id,to:this.state.nodeId,checkpoint:this.snapshot(),memberIds:this.members().map(u=>u.id),seed:this.state.seed+':side:'+id+':'+q.wins};return true;}
    chooseHeroQuest(id,index,expectedStage){
      const d=H.definitions[id],q=this.state.heroQuests[id];if(!d||!q||q.stage!==expectedStage||this.state.nodeId!==d.place||this.pending||this.journey)return false;const choice=d.stages[q.stage].npc?.choices[index];if(!choice)return false;
      if(Object.hasOwn(choice,'recruit'))return this.finishHeroQuest(id,choice.recruit);if(choice.battle)return this.beginHeroBattle(id,choice.battle);
      if(choice.price&&this.state.money<choice.price){this.lastQuestError='铜钱不足。';return false;}if(!d.stages[choice.next])return false;this.state.money-=choice.price||0;q.stage=choice.next;return true;
    }
    beginHeroBattle(id,phase){const d=H.definitions[id],q=this.state.heroQuests[id],fight=d?.battles[phase];if(!fight||!fight.stage.includes(q?.stage)||this.state.nodeId!==d.place||this.pending||this.journey)return false;this.pending={kind:'heroQuest',questId:id,phase,to:d.place,checkpoint:this.snapshot(),memberIds:this.members().map(u=>u.id),seed:this.state.seed+':'+id+':'+phase};q.stage=phase;return true;}
    finishHeroQuest(id,stay){
      const d=H.definitions[id],q=this.state.heroQuests[id];if(!d||q?.stage!=='freed'||this.pending||this.journey||this.state.nodeId!==d.place)return false;const unit=H.companion();if(stay){if(!this.recordRecruit(id,d.country,unit)){this.lastQuestError=this.lastRecruitError;return false;}}
      else{if(!this.state.recruits[d.country].includes(id))this.state.recruits[d.country].push(id);this.state.residents[id]={...unit,startSoldiers:E.maxHealth(I.apply(unit).constitution)};}q.stage='complete';this.markQuestComplete(id);return true;
    }
    beginStoryBattle(phase){
      const data=N.storyBattles[phase],q=this.state.quests.changshan;if(!data||this.pending||this.journey||this.state.nodeId!==data.place)return false;
      if(!({entry:['available','entry'],grain:['supplies'],rescue:['rescue'],escort:['escort']}[phase]||[]).includes(q.stage))return false;
      if(phase!=='entry'&&(q.zhaoInvitation||q.healerDecision))return false;
      const checkpoint=this.snapshot();if(phase==='entry')q.stage='entry';
      this.pending={kind:'story',phase,to:this.state.nodeId,checkpoint,memberIds:this.members().map(u=>u.id),seed:this.state.seed+':story:'+phase+':'+q.grainWins};return true;
    }
    zhaoYunUnit(){
      const weapon={type:'spear',name:'白蜡枪',power:10},skills=W.forWeapon(weapon),u={...G.create('zhaoyun',5),id:'zhaoyun',name:'赵云',characterId:'zhaoyun',homeNode:'chengdu',guest:true,experience:0,weaponPlanVersion:3,passives:['zhaoyun-courage','zhaoyun-seven-crossings','zhaoyun-ever-victorious','zhaoyun-loyal-guard'],equipment:{armor:{name:'轻甲'},accessory1:null,accessory2:null},weapon,attack:10,armor:6,resistance:3,weaponProficiencies:{spear:75},skills,priorities:W.prioritiesFor(skills)};
      return u;
    }
    zhenJiUnit(){
      const weapon={type:'needle',name:'金针',power:10},skills=W.forWeapon(weapon),priorities=W.prioritiesFor(skills);for(const rule of priorities){const skill=W.skills[rule.skill];if(skill.kind==='heal'){rule.selfThreshold=.8;rule.allyThreshold=.8;}if(skill.kind==='buff')rule.disabled=true;}
      return {...G.create('zhenji',3),id:'zhenji',unitType:'general',name:'甄姬',characterId:'zhenji',homeNode:'zhongshan-county',guest:true,experience:0,weaponPlanVersion:3,passives:['benevolent-healer','zhenji-clear-water'],weapon,attack:10,armor:3,resistance:5,equipment:{armor:{name:'绣纹轻衣'},accessory1:null,accessory2:null},weaponProficiencies:{needle:65},skills,priorities};
    }
    recruitZhenJi(){
      const q=this.state.quests.changshan;if(q.healerJoined||this.pending||this.journey||!['zhongshan','zhongshan-county'].includes(this.state.nodeId)||!this.canRecruit())return false;
      const unit=this.zhenJiUnit();if(q.stage==='complete')delete unit.guest;this.state.companions.push(unit);this.state.troops[unit.id]=E.maxHealth(unit.constitution);if(!this.state.recruits.wei.includes(unit.id))this.state.recruits.wei.push(unit.id);
      if(this.state.activeIds.length>=this.activeLimit()){const replaced=[...this.state.activeIds].reverse().find(id=>!['hero','zhaoyun'].includes(id));if(replaced)this.state.activeIds=this.state.activeIds.filter(id=>id!==replaced);}
      if(this.state.activeIds.length<this.activeLimit())this.state.activeIds.push(unit.id);q.healerJoined=true;q.healerDecision=false;return true;
    }
    npcUnit(id){
      const member=this.members().find(u=>u.id===id)||this.state.residents[id];if(member)return copy(member);
      if(['zhangjiao','zhangbao','zhangliang'].includes(id)){const P=node?require('./prologue.js'):root.PengpaiPrologue;return P.general(id,15);}
      if(id==='ganning')return H.companion();const questNpc=Object.keys(H.definitions).map(id=>H.npc(id,this.state.heroQuests[id])).find(n=>n?.id===id&&n.observe);if(questNpc)return {...H.enemies(1)[0],id:questNpc.id,name:questNpc.name};if(id==='zhaoyun')return this.zhaoYunUnit();if(id==='zhenji')return this.zhenJiUnit();return null;
    }
    startChangshan(){
      const q=this.state.quests.changshan;if(this.state.nodeId!=='changshan'||!(q.stage==='available'||q.zhaoInvitation)||this.state.companions.some(u=>u.id==='zhaoyun')||this.pending||this.journey||!this.canRecruit())return false;const u=this.zhaoYunUnit();
      this.state.companions.push(u);this.state.troops[u.id]=E.maxHealth(u.constitution);if(this.state.activeIds.length>=this.activeLimit())this.state.activeIds.pop();this.state.activeIds.push(u.id);q.stage='supplies';q.zhaoInvitation=false;return true;
    }

    finishZhenStay(stay){const q=this.state.quests.changshan,u=this.state.companions.find(u=>u.id==='zhenji');if(!q.healerDecision||!u||this.pending||this.journey)return false;delete u.guest;q.healerDecision=false;q.healerStayDecided=true;if(!stay)this.dismiss('zhenji');return true;}

    advanceChangshan(){
      const q=this.state.quests.changshan,id=this.state.nodeId;
      if(q.stage==='supplies'&&id==='zhongshan'&&!q.healerJoined&&!q.zhaoInvitation){q.stage='rescue';return true;}
      if(q.stage==='return'&&id==='changshan'){q.stage='decision';return true;}return false;
    }
    beginQuestBattle(){return this.beginStoryBattle('rescue');}
    finishChangshan(stay){
      if(this.state.nodeId!=='changshan'||this.state.quests.changshan.stage!=='decision')return false;
      const u=this.state.companions.find(u=>u.id==='zhaoyun');if(!u)return false;delete u.guest;for(const member of this.state.companions)if(member.id==='zhenji')delete member.guest;u.homeNode='chengdu';if(!this.state.recruits.shu.includes(u.id))this.state.recruits.shu.push(u.id);this.state.quests.changshan.stage='complete';this.markQuestComplete('changshan');this.state.heroQuests.ganning.stage=H.definitions.ganning.start;if(!stay)this.dismiss(u.id);return true;
    }
    dismiss(id){
      const u=this.state.companions.find(u=>u.id===id);if(!u||u.guest||this.pending||this.journey)return false;const homeNode=u.homeNode||(id==='zhangliang'?'camp':null);if(!D.placeMap[homeNode])return false;
      this.state.residents[id]={...copy(u),homeNode,condition:this.state.conditions[id],startSoldiers:this.state.troops[id]??E.maxHealth(u.constitution)};this.state.companions=this.state.companions.filter(u=>u.id!==id);this.state.reserveOrder=this.state.reserveOrder.filter(value=>value!==id);this.state.activeIds=this.state.activeIds.filter(value=>value!==id);if(!this.state.activeIds.length)this.state.activeIds=['hero'];delete this.state.troops[id];delete this.state.conditions[id];return true;
    }
    inviteResident(id){const u=this.state.residents[id];if(!u||u.homeNode!==this.state.nodeId||this.pending||this.journey||this.state.companions.some(c=>c.id===id)||!this.canRecruit())return false;this.state.companions.push(copy(u));this.state.troops[id]=u.startSoldiers??E.maxHealth(u.constitution);if(u.condition)this.state.conditions[id]=u.condition;if(this.state.activeIds.length<this.activeLimit())this.state.activeIds.push(id);delete this.state.residents[id];return true;}
    campAdvice(){
      if(!Object.values(this.state.trainingWins).some(Boolean))return ['外头到处都有乱兵，我还是有些不放心。你若不急着走，可以找我三弟练一练，他就在教场，有什么不会的，直接问他。'];
      if(this.state.quests.changshan.stage!=='complete')return [{available:'常山离这里不远，就在西北边。前些日子来的人说，有个年轻枪客一直在照看流民，也许就是你要找的人。',entry:'你要找的枪客应该就在常山村里。进去问问乡亲们，他们都认得他。',supplies:this.state.quests.changshan.healerJoined?'既然人已经救出来了，就和子龙去把粮取回来吧。这么多乡亲等着吃饭，怕是撑不了几天。':'中山那边一直没送粮来，恐怕是路上出了事。你和子龙一起去看看，有个照应，我也放心些。',rescue:'听说人被带去了毋极，你和子龙先去救人吧。若是缺药，就回来找我二弟拿，营里还有一些。',escort:'粮找回来了就好。回常山时照看好车上的伤者，宁可中途停下来歇歇，也别颠着他们。',return:'你们把粮送到常山，先跟里正说一声，让他安排分粮，别在村口挤作一团。',decision:'常山那边暂时安顿好了，你也能松口气了。子龙接下来打算去哪儿，你问过他没有？'}[this.state.quests.changshan.stage]||'你在外头可还顺利？有什么拿不定主意的，可以说来听听，我们一起想想办法。'];
      if(!this.state.visited.includes('changshan'))return ['我听说常山有个年轻枪客在照看流民，应该就在村里。你可以先去那边问问，路上要是受了伤，别忘了回来找我二弟。'];
      if(this.coalitionReady())return ['几家都招到了能用的人，应该能认真谈谈讨董的事了。难的是让他们肯一起出兵，你先去见见各家的主事人，听听他们怎么说。'];
      const clue=D.clues.filter(c=>!this.state.recruits[c.faction].includes(c.id)&&!this.state.visited.includes(c.place)).sort((a,b)=>(this.findRoute(a.place)?.distance??Infinity)-(this.findRoute(b.place)?.distance??Infinity))[0];
      return [clue?clue.text:'你这阵子跑了不少地方，也该歇歇了。找人的事急不得，往后路上遇见愿意聊的，多问几句，说不定就有你要的消息。'];
    }
    enemyLevel(){return Math.max(1,Math.min(this.character.level,this.state.enemyLevelCap));}
    unlockEnemyLevelCap(cap){if(!N.combatProgression.caps.includes(cap)||cap<=this.state.enemyLevelCap)return false;this.state.enemyLevelCap=cap;return true;}
    scaleEnemy(unit){const level=this.enemyLevel(),attributes=G.attributesAt(unit.baseAttributes,unit.potentials,level);return {...unit,level,attributes,...attributes};}
    trainingRoster(training){
      const level=Math.max(1,Math.min(10,this.character.level));
      if(training.rivals){const P=node?require('./prologue.js'):root.PengpaiPrologue;return training.rivals.map(id=>({...P.general(id,15),id:'training-'+id,characterId:id}));}
      const profiles=['yellowMilitia','yellowSkirmisher','yellowGuard'];return Array.from({length:training.count},(_,i)=>({...G.create(profiles[i%profiles.length],level),id:'training-militia-'+i,name:'黄巾军',characterId:'yellow-militia',weapon:{type:'spear',name:'木杆枪'},weaponProficiencies:{spear:30},attack:6,armor:2,resistance:0,skills:['spear-cut','spear-sweep'],priorities:[{skill:'spear-sweep',when:'enemyCount',threshold:2},{skill:'spear-cut',when:'always',frequency:'sometimes'}]}));
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
      const P=node?require('./prologue.js'):root.PengpaiPrologue,u={...P.general('zhangliang',15),characterId:'zhangliang',homeNode:'camp',experience:0};this.state.companions.push(u);this.state.troops[u.id]=E.maxHealth(u.constitution);if(this.state.activeIds.length<this.activeLimit())this.state.activeIds.push(u.id);return true;
    }
    awardExperience(amount,ids=this.members().map(u=>u.id)){
      const old=this.members(),gains=[],value=member=>typeof amount==='function'?amount(member):amount;if(ids.includes('hero')){const gain=X.grant(this.character,value(this.character));this.character=gain.record;gains.push({id:'hero',name:this.character.name,...gain});}
      this.state.companions=this.state.companions.map(u=>{if(!ids.includes(u.id))return u;const gain=X.grant(u,value(u)),next=gain.record;if(next.growthVersion===1)delete next.maxSoldiers;gains.push({id:u.id,name:u.name,...gain});return next;});
      for(const member of this.members()){const before=old.find(u=>u.id===member.id);if(before&&member.maxSoldiers!==before.maxSoldiers)this.state.troops[member.id]=Math.floor((this.state.troops[member.id]??before.maxSoldiers)/before.maxSoldiers*member.maxSoldiers);}
      return {gains:gains.map(({id,name,amount,before,after,record})=>({id,name,amount,before,after,experienceBefore:old.find(u=>u.id===id)?.experience||0,experienceAfter:record.experience||0,requiredBefore:X.required(before),requiredAfter:X.required(after)}))};
    }
    beginTravel(to,{eventRoll}={}){
      if(D.placeMap[to]?.requiresWater)return {ok:false,reason:'水路尚未开通'};
      if(this.pending||this.journey||!neighbors(this.state.nodeId).includes(to))return {ok:false,reason:'只能前往相邻地标'};
      const checkpoint=this.snapshot(),from=this.state.nodeId,rng=E.seededRandom(this.state.seed+':road:'+this.state.steps+':'+from+':'+to),roll=eventRoll??rng();let sample=roll*D.roadEvents.reduce((n,e)=>n+e.weight,0),event=D.roadEvents.at(-1);for(const e of D.roadEvents){sample-=e.weight;if(sample<0){event=e;break;}}
      const quietRequired=this.state.steps<D.travelRules.eventGraceSteps||(this.state.lastEventStep!==null&&this.state.steps-this.state.lastEventStep<D.travelRules.quietStepsAfterEvent);if(eventRoll===undefined&&quietRequired)event=D.roadEvents.find(e=>e.kind==='quiet');
      this.journey={from,to,checkpoint,event:copy(event),checked:false};return {ok:true,from,to};
    }
    travelEvent(){
      const j=this.journey;if(!j||j.checked)return null;j.checked=true;this.state.steps++;this.state.inside=false;const event=j.event;if(event.kind!=='quiet')this.state.lastEventStep=this.state.steps;
      if(event.kind==='battle')this.pending={from:j.from,to:j.to,checkpoint:j.checkpoint,encounterId:D.placeMap[j.to].encounterId||event.encounter,seed:this.state.seed+':fight:'+this.state.steps,kind:'battle'};
      return {ok:true,kind:event.kind,title:event.title,text:event.kind==='rumor'?(D.placeMap[j.to].rumor||event.text):event.text,...(event.choices?{choices:copy(event.choices)}:{})};
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
    battleScenario({extraAllies=[]}={}){
      if(!this.pending)throw new Error('没有待结算的路遇战斗');
      if(this.pending.kind==='heroQuest'){const p=this.pending,d=H.definitions[p.questId],fight=d.battles[p.phase],enemies=H.enemies(fight.count).map(u=>({...u,...(root.CharacterAssets?root.CharacterAssets.resolve(u.characterId):{})}));return {id:p.questId+'-'+p.phase,title:fight.title,scene:Scenes.get(fight.sceneId),allies:[...this.partyGroups().active,...extraAllies],enemies,passives:heroPassives(),rules:{partySlots:this.activeLimit(),allySp:0,hit:true,critical:true,seed:p.seed}};}
      if(this.pending.kind==='training'){
        const training=D.trainingOptions.find(t=>t.id===this.pending.trainingId),enemies=this.trainingRoster(training).map(u=>({...u,...(root.CharacterAssets?.manifest.characters[u.characterId]?root.CharacterAssets.resolve(u.characterId):{})}));
        return {id:'camp-training',title:training.label,scene:copy(D.townScenes.camp),allies:[...this.trainingAllies(training),...extraAllies],enemies,passives:heroPassives(),rules:{partySlots:this.activeLimit(),level:1,enemyLevel:1,allySp:0,random:true,hit:true,critical:true,seed:this.pending.seed}};
      }
      if(['story','side'].includes(this.pending.kind)){
        const p=this.pending,data=p.kind==='story'?N.storyBattles[p.phase]:N.sideQuests.find(q=>q.id===p.questId),level=this.enemyLevel(),count=p.kind==='story'?data.count:data.rounds===5?3+this.state.quests.side[data.id].wins%3:2+this.state.quests.side[data.id].wins,enemies=N.bandits(level,count,p.kind==='story'&&['grain','escort'].includes(p.phase)).map((u,i)=>({...this.scaleEnemy(u),...(root.CharacterAssets?root.CharacterAssets.resolve(u.characterId):{}),id:'local-enemy-'+i}));
        return {id:'local-'+p.kind,title:data.title,scene:Scenes.get(data.sceneId||'rural-road'),allies:[...this.storyAllies(p.phase),...extraAllies],enemies,passives:heroPassives(),rules:{partySlots:this.activeLimit(),allySp:0,hit:true,critical:true,seed:p.seed}};
      }
      const troops=this.members(),allies=this.state.activeIds.map(id=>troops.find(u=>u.id===id)).filter(Boolean),encounter=D.encounters[this.pending.encounterId];if(!encounter)throw new Error('遭遇配置不存在');
      const count=encounter.count||D.placeMap[this.pending.to].encounterCount||1,enemies=Array.from({length:count},(_,i)=>{const unit=copy(encounter.roster[i%encounter.roster.length]),art=root.CharacterAssets?.manifest.characters[unit.characterId]?root.CharacterAssets.resolve(unit.characterId):{};return {...this.scaleEnemy(unit),...art,id:encounter.id+'-'+i};});
      const passives=heroPassives();
      return {id:'road-encounter',title:encounter.title,scene:copy(encounter.scene),allies:[...allies,...extraAllies],enemies,passives,rules:{...copy(encounter.rules),partySlots:this.activeLimit(),seed:this.pending.seed}};
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
      if(result.result!=='victory'){const mapZoom=this.state.mapZoom;this.state=normalize(this.character,pending.checkpoint);this.state.mapZoom=mapZoom;this.journey=null;this.cancelRoute();if(pending.kind==='training')this.rest();return false;}
      for(const u of result.units||[])if(u.side==='ally'&&this.members().some(m=>m.id===u.id)){this.state.troops[u.id]=u.soldiers;this.state.conditions[u.id]=u.dead?'dead':u.wounded?'wounded':'healthy';}
      const proficiencyGains=this.awardProficiency(result);
      const defeated=(result.units||[]).filter(u=>u.side==='enemy'),foes=defeated.length?defeated:scenario.enemies;this.lastReward=this.awardExperience(member=>X.reward(foes,member),pending.memberIds||this.members().map(u=>u.id));this.lastReward.proficiencies=proficiencyGains;
      const rng=E.seededRandom(pending.seed+':loot:'+this.state.battleSerial++),drops=pending.kind==='training'?{money:0,items:[]}:I.loot(foes,rng);this.state.money+=drops.money;this.lastReward.money=drops.money;this.lastReward.items=drops.items.map(i=>this.addItem(i.templateId,i.quality));
      if(pending.kind==='story'){const q=this.state.quests.changshan;if(pending.phase==='entry'){q.stage='supplies';q.zhaoInvitation=!this.state.companions.some(u=>u.id==='zhaoyun');}else if(pending.phase==='grain'){q.grainWins++;q.stage=q.grainWins>=2?'escort':'supplies';if(q.grainWins>=2&&!q.healerStayDecided&&this.state.companions.some(u=>u.id==='zhenji'))q.healerDecision=true;this.lastReward.progress={label:'夺回粮车',value:q.grainWins/2};}else if(pending.phase==='rescue'){this.recruitZhenJi();q.stage=q.grainWins>=2?'escort':'supplies';}else if(pending.phase==='escort')q.stage='return';this.state.inside=true;}
      if(pending.kind==='side'){const data=N.sideQuests.find(q=>q.id===pending.questId),q=this.state.quests.side[data.id];q.wins++;this.lastReward.progress={label:data.title,value:q.wins/data.rounds};this.state.inside=true;}
      if(pending.kind==='heroQuest'){const d=H.definitions[pending.questId],fight=d.battles[pending.phase];this.state.heroQuests[d.id].stage=fight.next;this.lastReward.progress={label:'解救甘宁',value:pending.phase==='breach'?.5:1};if(fight.next==='freed'){this.state.money+=150;this.lastReward.money+=150;this.lastReward.items.push(this.addItem('weapon-blade','green'));}this.state.inside=true;}
      this.state.afterBattle={kind:pending.kind,phase:pending.phase,questId:pending.questId,trainingId:pending.trainingId};this.state.pendingReward=copy(this.lastReward);
      if(pending.kind==='training'){this.state.trainingWins[pending.trainingId]++;this.state.inside=true;this.rest();}else if(pending.kind==='quest'){this.state.quests.changshan.stage='return';this.state.inside=true;}else if(!['story','side','heroQuest'].includes(pending.kind)){if(!this.journey)this.arrive(pending.to);else this.markResolvedLeg();}return true;
    }
    saveTactics(unit){this.state.tactics[unit.id]={initialMode:unit.mode,priorities:copy(unit.priorities),targetRule:unit.targetRule};if(this.pending)this.pending.checkpoint.tactics=copy(this.state.tactics);if(this.journey)this.journey.checkpoint.tactics=copy(this.state.tactics);}
  }
  const clampTroops=(value,max)=>Math.max(0,Math.min(max,Number.isFinite(Number(value))?Number(value):max));
  const heroPassives=()=>Object.fromEntries(R.PASSIVES.map(p=>[p.id,{id:p.id,name:p.name,quality:p.quality,description:p.description,stats:{dodgeBonus:p.effects?.dodgeBonus||0},triggers:[]}]));
  const api={World,normalize,neighbors,shortestRoute,heroUnit,heroPassives,countries};root.WorldModel=api;if(node)module.exports=api;
})(globalThis);
