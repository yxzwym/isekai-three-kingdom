(function (root) {
  'use strict';
  const DATA = typeof module !== 'undefined' && module.exports ? require('./rules.js') : root.BattleRules;
  const PASSIVES = typeof module !== 'undefined' && module.exports ? require('./passives.js') : root.BattlePassives;
  const STATES = typeof module !== 'undefined' && module.exports ? require('./statuses.js') : root.BattleStatuses;
  const WEAPONS = typeof module !== 'undefined' && module.exports ? require('./weapon-skills.js') : root.WeaponSkills;
  const EQUIPMENT=typeof module!=='undefined'&&module.exports?require('./equipment.js'):root.EquipmentSlots;
  const ITEMS=typeof module!=='undefined'&&module.exports?require('./items.js'):root.ItemCatalog;
  const G=typeof module!=='undefined'&&module.exports?require('./character-growth.js'):root.CharacterGrowth;
  const PROFICIENCY=typeof module!=='undefined'&&module.exports?require('./proficiency.js'):root.WeaponProficiency;
  const { SKILLS, DEFAULTS } = DATA;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const attr = value => Math.max(1, Math.floor(Number(value) || 1));
  const copy = value => JSON.parse(JSON.stringify(value));
  function seedNumber(text) {
    let hash = 2166136261;
    for (const c of String(text)) { hash ^= c.codePointAt(0); hash = Math.imul(hash, 16777619); }
    return hash >>> 0;
  }
  function seededRandom(seed) {
    let state = seedNumber(seed);
    return () => { state += 0x6D2B79F5; let n = state; n = Math.imul(n ^ n >>> 15, n | 1); n ^= n + Math.imul(n ^ n >>> 7, n | 61); return ((n ^ n >>> 14) >>> 0) / 4294967296; };
  }
  const maxHealth=constitution=>Math.max(1,Math.floor(attr(constitution)*10));
  // Compatibility alias for existing scenario/save fields; life no longer depends on level.
  const maxSoldiers=(level,constitution)=>maxHealth(constitution);
  function ratio(war,speed,unload=0){return Math.floor(Math.min(3,Math.max(1,(Number(war)||0)-(Number(unload)||0))/(Math.max(0,Number(speed)||0)+1))*10)/10;}
  function interval(unit,config=DEFAULTS,skillDelay=0){return Math.max(.5,(1.5+ratio(unit.war,unit.speed,unit.unload)+(Number(skillDelay)||0))*(unit.intervalMultiplier??1));}
  function mitigation(value,scale=50){return 50/(50+Math.max(0,Number(value)||0));}
  function skillValue(actor,skill={}){
    const scaling=skill.scaling||{[skill.kind==='physical'?'war':'intelligence']:Number(skill.power)||1};
    return Object.entries(scaling).reduce((n,[key,coefficient])=>n+(Number(actor[key])||0)*coefficient,Number(skill.flat)||0)+(skill.weaponCoefficient??1)*Math.max(0,Number(actor.weaponPower??actor.attack)||0);
  }
  function raceMultiplier(skill,target){const tags=new Set([target?.species||'humanoid',...(target?.tags||[])]);return 1+Object.entries(skill.raceBonuses||{}).reduce((n,[tag,value])=>n+(tags.has(tag)?value:0),0);}
  function calculate({attacker={},target={},skill={},critical=1,damageType=skill.damageType||skill.kind||'physical'}){
    if(attacker.soldiers<=0)return {raw:0,amount:0,factors:[]};const healing=skill.kind==='heal',physical=damageType==='physical',protectionValue=healing||damageType==='true'||(physical&&attacker.ignoreArmor)||(!physical&&attacker.ignoreResistance)?0:Math.max(0,Number(target[physical?'armor':'resistance'])||0)*(1-clamp(Number(attacker[physical?'armorPierce':'resistancePierce'])||0,0,1))-Math.max(0,Number(attacker[physical?'armorPenetration':'resistancePenetration'])||0);
    const base=skillValue(attacker,skill),bonus=healing?(1+(Number(attacker.healingBonus)||0)):(1+(Number(attacker[physical?'physicalBonus':'tacticBonus'])||0)),beforeMitigation=Math.max(0,base*bonus*(healing?1:Math.max(0,Number(attacker.damageMultiplier??1)))*(healing?1:critical)*raceMultiplier(skill,target)*(healing?1:(skill.kind==='physical'||skill.kind==='tactic')&&attacker.executeThreshold&&target.soldiers/target.maxSoldiers<=attacker.executeThreshold?(attacker.executeMultiplier||1):1)),protection=healing?1:mitigation(protectionValue)*(damageType==='true'?1:clamp(1-(Number(target[physical?'physicalReduction':'tacticReduction'])||0),0,1)),raw=beforeMitigation*protection;
    return {raw,amount:Math.max(1,Math.floor(raw)),damageType,armor:physical?Math.max(0,protectionValue):undefined,resistance:physical?undefined:Math.max(0,protectionValue),beforeMitigation,mitigation:protection,factors:[['技能面板',base],['效果加成',bonus],...(!healing&&attacker.damageMultiplier!==undefined&&attacker.damageMultiplier!==1?[['被动增伤',attacker.damageMultiplier]]:[]),['暴击倍率',healing?1:critical],['减伤后倍率',protection]],formula:healing?'技能治疗量':damageType==='true'?'真实伤害':'技能伤害 × 50÷(50＋减伤属性)'};
  }
  function physical(options){return calculate({...options,skill:options.skill||{kind:'physical',scaling:{war:1},weaponCoefficient:1},damageType:options.damageType||'physical'});}
  function tactic(options){return calculate({...options,attacker:options.attacker||{intelligence:attr(options.intelligence),attack:0},skill:options.skill,damageType:options.skill.damageType||options.skill.kind});}
  function criticalChance(unit,config,skill={}){return unit.guaranteedCritical?1:clamp((Number(skill.criticalChance)||0)+(Number(skill.criticalBonus)||0)+(Number(unit.criticalBonus)||0)+(skill.kind==='tactic'?(Number(unit.tacticCriticalBonus)||0):0)+Math.max(0,Number(unit.technique)||0)/2000,0,1);}
  function hitChance(actor,target,skill,dodge=0){return skill.alwaysHit?1:clamp((skill.hitChance??.4)+(Number(actor.hitBonus)||0)+(Math.max(0,Number(actor.technique)||0)/Math.max(1,Number(target.speed)||0))*.3-dodge,0,1);}
  function normalizeRule(rule,skill){
    const r=copy(rule);if(!skill)return r;
    if(['physical','tactic'].includes(skill.kind)){
      return {skill:rule.skill,disabled:!!rule.disabled,when:skill.scope==='all'?'enemyCount':'always',threshold:skill.scope==='all'?(rule.when==='enemyCount'?Math.max(2,Math.floor(Number(rule.threshold)||2)):2):0,...(rule.frequency==='sometimes'?{frequency:'sometimes'}:{})};
    }
    return r;
  }
  class Battle {
    constructor(options = {}) {
      if (!Array.isArray(options.allies) || !Array.isArray(options.enemies)) throw new TypeError('战斗必须传入 allies 和 enemies 阵容');
      this.scenario = { id:options.id || 'battle', title:options.title || '战斗', scene:copy(options.scene || {}), allowRetreat:!!options.allowRetreat, control:copy(options.control || {}) };
      this.config = { ...copy(DEFAULTS), ...copy(options.rules || {}) };
      this.skills = {...copy(SKILLS),...copy(WEAPONS.skills),...copy(STATES.skills),...copy(PASSIVES.skills),...copy(options.skills || {})};
      this.passives = {...copy(PASSIVES.definitions),...copy(options.passives || {})};
      this.rng = seededRandom(this.config.seed);
      this.time = 0; this.tick = 0; this.accumulator = 0; this.status = 'ready'; this.events = []; this.sequence = 0;
      this.allySp = Math.max(0, Math.floor(this.config.allySp)); this.initialAllySp = this.allySp;
      this.actionCount = 0; this.fireCount = 0;this.revision=0;
      const roster = [...copy(options.allies).map(u=>({...u,side:'ally'})),...copy(options.enemies).map(u=>({...u,side:'enemy'}))];
      const ids = new Set();
      for (const u of roster) { if (!u.id || ids.has(u.id)) throw new TypeError('参战单位必须有唯一 id'); ids.add(u.id); }
      this.units = roster.map((base, order) => {
        const u = { ...base, ...(this.config.rosterOverrides?.[base.id] || {}) };u.equipment=EQUIPMENT.normalize(u.equipment);
        if(u.weapon){if(WEAPONS.special(u.weapon)||!Array.isArray(u.skills))u.skills=WEAPONS.forWeapon(u.weapon);for(const definition of WEAPONS.definitionsForWeapon(u.weapon))this.skills[definition.id]??=definition;u.weapon=WEAPONS.resolveWeapon(u.weapon);}
        u.constitution??=u.leadership;delete u.leadership;u.species||='humanoid';
        u.level=attr(u.level??(u.side==='enemy'?this.config.enemyLevel||this.config.level:this.config.level));
        if(u.potentials&&u.baseAttributes)Object.assign(u,{growthVersion:1,attributes:G.attributesAt(u.baseAttributes,u.potentials,u.level)},G.attributesAt(u.baseAttributes,u.potentials,u.level));
        for (const key of ['war', 'intelligence', 'constitution', 'speed', 'technique']) u[key] = attr(u[key]);
        Object.assign(u,ITEMS.apply(u));
        u.attack = Math.max(0, Math.floor(Number(u.weapon?.power??u.weapon?.attack??u.attack) || 0)); u.armor = Math.max(0,Math.floor(Number(u.armor)||0));u.resistance=Math.max(0,Math.floor(Number(u.resistance)||0));
        if(u.side==='enemy'&&(this.config.bossBattle||u.boss||u.passives?.includes('enemy-stun-resistance')))u.statusImmunities=[...new Set([...(u.statusImmunities||[]),'stun'])];
        u.level = attr(u.level ?? (u.side === 'enemy' ? this.config.enemyLevel || this.config.level : this.config.level));
        u.skills = Array.isArray(u.skills) ? u.skills.filter(id=>this.skills[id]&&!this.skills[id].reactionOnly) : [];
        u.passives = Array.isArray(u.passives) ? [...new Set(u.passives)].filter(id=>this.passives[id]&&(!this.passives[id].enemyOnly||u.side==='enemy')) : [];
        if(u.side==='enemy'&&!u.passives.includes('enemy-negative-immunity'))for(const immunity of u.statusImmunities||[]){const id=immunity==='stun'?'enemy-stun-resistance':'enemy-status-immunity:'+immunity;if(!this.passives[id]){const name=STATES.definitions[immunity]?.name||immunity;this.passives[id]={id,name:name+'免疫',quality:'white',temporary:true,enemyOnly:true,description:'本场战斗免疫'+name+'。',stats:{},triggers:[]};}u.passives=[...new Set([...u.passives,id])];}
        u.priorities = Array.isArray(u.priorities) ? u.priorities.map(r=>normalizeRule(r,this.skills[r.skill])) : [];
        u.targetRule=u.targetRule||(u.side==='enemy'?'random':'lowestCurrent');u.lastSingleSkill=null;u.lastManualSkill=null;
        u.maxSoldiers=u.healthOverride!=null?attr(u.healthOverride):Math.max(1,Math.floor(u.baseMaxHealth*(PASSIVES.statsFor(u,this.passives).healthMultiplier||1)));
        u.soldiers = clamp(Math.floor(Number(u.startSoldiers ?? u.maxSoldiers)), 0, u.maxSoldiers);
        u.woundsEnabled=u.side==='ally'&&(u.woundsEnabled??this.config.wounds!==false);u.dead=!!u.dead||u.condition==='dead'||u.soldiers===0&&!u.woundsEnabled;u.wounded=!u.dead&&u.soldiers===0&&u.woundsEnabled;
        u.sp = Math.max(0, Number(u.enemySp) || 0); u.initialSp = u.sp;
        u.interval = interval(u, this.config); u.progress = clamp((Number(u.initialProgress)||0)+(PASSIVES.statsFor(u,this.passives).initialProgress||0),0,1); u.ready = u.progress>=1; u.readyTick=u.ready?0:null; u.mode = u.initialMode==='manual'||(u.side==='ally'&&this.scenario.control.manualOnly)?'manual':'auto'; u.queued = null;
        u.statuses = [];u.lastSkillDelay=0;u.waitTime=u.progress*u.interval;u.progressStamp=u.progress;u.autoCheckedRevision=-1; u.criticalChain = 0; u.order = order;
        u.interval=interval(this.effective(u),this.config);u.waitTime=u.progress*u.interval;
        u.stats = { damage: 0, healing: 0, received: 0, actions: 0, kills: 0, tactics: 0, dodges: 0 };
        return u;
      });
      this.unitIndex=new Map(this.units.map(u=>[u.id,u]));
      this.healingAuras=this.units.filter(u=>PASSIVES.statsFor(u,this.passives).opponentHealingMultiplier!==undefined);
      this.battleTimers=this.units.flatMap(u=>u.passives.flatMap(id=>(this.passives[id]?.triggers||[]).filter(t=>t.on==='battleTime').map(trigger=>({unit:u,id,trigger,fired:false}))));
      this.initialTroops = { ally: this.total('ally'), enemy: this.total('enemy') };
      this.emit('system', { text: `${this.scenario.title}，双方就位。` });
    }
    unit(id) { return this.unitIndex.get(id); }
    living(side) { return this.units.filter(u => u.side === side && u.soldiers > 0); }
    targetable(side){return this.units.filter(u=>u.side===side&&!u.dead&&(u.soldiers>0||u.wounded));}
    total(side) { return this.units.filter(u => u.side === side).reduce((n, u) => n + u.soldiers, 0); }
    availableSp(unit) { return unit.side === 'ally' ? this.allySp : unit.sp; }
    invalidateAI(){this.revision++;}
    emit(type, detail) { this.revision++;const event = { id: ++this.sequence, tick: this.tick, time: this.time, type, ...detail }; this.events.push(event); return event; }
    start() { if (this.status === 'ready') { this.status = 'running';for(const u of this.units){const amount=Math.floor(u.maxSoldiers*(PASSIVES.statsFor(u,this.passives).openingShield||0));if(amount>0)this.gainShield(u,u,amount);} this.emit('system', { text: '战鼓已响，两军交锋。' }); this.checkEnd(); } }
    advance(seconds,stopWhen) {
      if (this.status !== 'running') return;
      if(stopWhen?.()){this.accumulator=0;return;}
      this.accumulator += Math.max(0, Number(seconds) || 0);
      let iterations = 0;
      while (this.accumulator + 1e-9 >= .02 && this.status === 'running' && iterations++ < 50000) {
        this.accumulator -= .02; this.tick++; this.time = this.tick * .02;
        this.tickBattleTimers();if(this.status!=='running')break;
        for(const u of this.units)this.tickStatuses(u);if(this.status!=='running')break;
        for (const u of this.units) if (u.soldiers > 0&&!this.stunned(u)) {if(u.progress!==u.progressStamp)u.waitTime=u.progress*u.interval;u.interval=interval(this.effective(u),this.config,u.lastSkillDelay);u.waitTime+=.02;const raw=Math.min(1,u.waitTime/u.interval);u.progress=Math.max(u.progress,raw);u.progressStamp=u.progress;if(!u.ready&&u.waitTime>=u.interval-1e-9)u.readyTick=this.tick;u.ready=u.waitTime>=u.interval-1e-9;}
        if(stopWhen?.()){this.accumulator=0;break;}
        for (const u of this.units) {
          if (this.status !== 'running') break;
          if (u.soldiers <= 0 || !u.ready || this.stunned(u)) continue;
          if (u.queued) {
            const command = u.queued; u.queued = null;
            const result = this.act(u.id, command.skill, command.target, command.scope);
            if (!result.ok) { this.emit('notice', { actor: u.id, text: `${u.name}指令取消：${result.reason}` }); }
            if(stopWhen?.()){this.accumulator=0;return;}
          }
          if(u.ready&&u.mode==='auto'&&u.autoCheckedRevision!==this.revision){u.autoCheckedRevision=this.revision;const command=this.autoCommand(u);if(command)this.act(u.id,command.skill,command.target,command.scope);}
          if(stopWhen?.()){this.accumulator=0;return;}
        }
      }
    }
    effective(u){
      const out={...u},p=PASSIVES.statsFor(u,this.passives);
      for(const key of ['war','intelligence','constitution','speed','technique','attack','armor','resistance']){
        const add=(u.statuses||[]).reduce((n,s)=>n+(s.attribute===key?(Number(s.amount)||0)*(s.stacks||1):0),0),mult=(u.statuses||[]).reduce((n,s)=>n*(Number(s[key+'Multiplier'])||1),1);out[key]=Math.max(key==='constitution'?1:0,(u[key]+add+(p[key+'Bonus']||0))*mult*(p[key+'Multiplier']||1));
      }
      for(const stat of ['healingBonus','physicalBonus','tacticBonus','physicalReduction','tacticReduction','hitBonus','criticalBonus','armorPenetration','resistancePenetration','armorPierce','resistancePierce','criticalDamageBonus','tacticCriticalBonus','tacticCriticalDamageBonus','physicalLifesteal','executeThreshold'])out[stat]=(Number(u[stat])||0)+(p[stat]||0);
      for(const stat of ['intervalMultiplier','executeMultiplier'])out[stat]=(Number(u[stat])||1)*(p[stat]||1);
      for(const [kind,mult]of [['physical','physicalMultiplier'],['tactic','tacticMultiplier'],['healing','healingMultiplier']])if(p[mult]!==undefined)out[kind+'Bonus']=(1+out[kind+'Bonus'])*p[mult]-1;
      out.damageMultiplier=Number(u.damageMultiplier??1)*(p.damageMultiplier||1);out.guaranteedCritical=!!(u.guaranteedCritical||p.guaranteedCritical);out.ignoreArmor=!!(u.ignoreArmor||p.ignoreArmor);out.ignoreResistance=!!(u.ignoreResistance||p.ignoreResistance);
      let taken=p.takenMultiplier||1;for(const id of u.passives){const stats=this.passives[id]?.stats||{},maximum=Number(stats.missingHealthDamageBonus)||0;if(maximum>0)out.damageMultiplier*=1+maximum*clamp(1-u.soldiers/u.maxSoldiers,0,1);if(stats.lowTroopsThreshold&&u.soldiers/u.maxSoldiers<=stats.lowTroopsThreshold){out.damageMultiplier*=stats.lowTroopsDamageMultiplier||1;taken*=stats.lowTroopsTakenMultiplier||1;}}
      if(taken!==1)out.physicalReduction=1-(1-out.physicalReduction)*taken;if(taken!==1||p.tacticTakenMultiplier!==undefined)out.tacticReduction=1-(1-out.tacticReduction)*taken*(p.tacticTakenMultiplier||1);out.weaponPower=PROFICIENCY.power(out.attack,u);return out;
    }
    gainShield(source,target,amount){
      if(amount<=0||target.dead)return;let status=target.statuses.find(s=>s.id==='passiveShield');if(status)status.amount+=amount;else{status={id:'passiveShield',name:'护盾',shield:true,amount,source:source.id,permanent:true,expiresAt:Infinity};target.statuses.push(status);}this.emit('status',{actor:source.id,target:target.id,status:copy(status)});
    }
    healingFactor(target){return (this.healingAuras||[]).reduce((n,u)=>Math.min(n,u.side!==target.side&&u.soldiers>0?(PASSIVES.statsFor(u,this.passives).opponentHealingMultiplier??1):1),1);}
    tickBattleTimers(){
      for(const timer of this.battleTimers){const {unit:u,id,trigger}=timer;if(timer.fired||u.soldiers<=0||this.time+1e-9<trigger.after)continue;timer.fired=true;if(trigger.effect!=='wipeOpponents')continue;
        const results=[];for(const target of this.targetable(u.side==='enemy'?'ally':'enemy')){const amount=target.maxSoldiers*10,result=this.damageUnit(u,target,amount,{ignoreWounds:true,fatal:true});results.push({target:target.id,targetName:target.name,...result,damageType:'true',healing:false,amount,raw:amount});}
        this.emit('action',{actor:u.id,actorName:u.name,side:u.side,passive:id,skill:'enemy-wipe',skillName:'绝境一击',reaction:true,scope:'all',cost:0,results});this.checkEnd();if(this.status!=='running')return;
      }
    }
    healingPassives(owner,target){
      for(const id of owner.passives)for(const trigger of this.passives[id]?.triggers||[]){
        if(trigger.on!=='heal'||trigger.effect!=='cleanse')continue;const removed=[];
        for(let n=0;n<(trigger.count||1);n++){const index=target.statuses.findIndex(s=>s.negative||s.harmful||s.stun||(s.period&&!s.healing)||(s.attribute&&s.amount<0)||Object.entries(s).some(([key,value])=>key.endsWith('Multiplier')&&Number(value)<1));if(index<0)break;removed.push(target.statuses.splice(index,1)[0]);}
        if(removed.length)this.emit('passive',{actor:owner.id,actorName:owner.name,target:target.id,passive:id,skillName:this.passives[id].name,effect:'cleanse',removed:removed.map(s=>s.id)});
      }
    }
    healthChanged(unit,before,after=unit.soldiers){
      if(before===after||unit.soldiers<=0||after<=0)return;
      for(const id of unit.passives)for(const trigger of this.passives[id]?.triggers||[]){
        if(trigger.on!=='healthCrossing'||trigger.effect!=='fillProgress')continue;const thresholds=(trigger.thresholds||[]).filter(t=>{const line=unit.maxSoldiers*t;return (trigger.direction!=='up'&&before>line&&after<=line)||(trigger.direction!=='down'&&before<=line&&after>line);});if(!thresholds.length)continue;
        const previous=unit.progress;unit.interval=interval(this.effective(unit),this.config,unit.lastSkillDelay);unit.progress=1;unit.progressStamp=1;unit.waitTime=unit.interval;unit.ready=true;unit.readyTick??=this.tick;unit.autoCheckedRevision=-1;
        this.emit('passive',{actor:unit.id,actorName:unit.name,passive:id,skillName:this.passives[id].name,thresholds,before,after,progressBefore:previous,progressAfter:1});
      }
    }
    restoredHealth(event){if(!event)return;this.emit('action',event);for(const result of event.results)this.healthChanged(this.unit(result.target),result.before,result.after);}
    stunned(u){return u.statuses.some(s=>s.stun&&s.expiresAt>this.time);}
    addStatus(source,target,effect,skill={}){
      const base=STATES.definitions[effect.id]||{},definition={...copy(base),...copy(effect)},id=definition.id||skill.id;
      const protection=PASSIVES.statsFor(target,this.passives);if((definition.stun||id==='stun')&&protection.immuneStun)return null;
      const harmful=definition.negative||definition.harmful||definition.stun||definition.period&&!definition.healing||definition.attribute&&Number(definition.amount)<0||Object.entries(definition).some(([key,value])=>key.endsWith('Multiplier')&&Number(value)<1);
      if(harmful&&protection.immuneNegative)return null;
      if(target.dead||(target.soldiers<=0&&!(target.wounded&&definition.period&&!definition.healing))||((target.statusImmunities||[]).includes(id)||definition.stun&&(target.statusImmunities||[]).includes('stun')))return null;
      if(definition.chance!==undefined){const chance=clamp(Number(definition.chance)-(source.side!==target.side?this.effective(target).resistance/1000:0),0,1);if(this.rng()>=chance)return null;}
      const owner=this.effective(source),coefficient=Number(definition.coefficient)||0;
      let amount=Number(definition.amount??((Number(definition.base)||0)+coefficient*(owner[definition.stat||'technique']??0)))||0;if(definition.healing&&definition.period)amount*=1+(owner.healingBonus||0);if(definition.negative)amount=-Math.abs(amount);if(amount<0&&protection.immuneNegative)return null;
      const previous=target.statuses.find(s=>s.id===id),origin=skill.id||id,maxStacks=Math.max(1,Number(definition.maxStacks)||1),same=previous?.origin===origin;
      const status={...definition,id,name:definition.name||skill.name||id,source:source.id,origin,amount,...(definition.reflectFormula?{reflect:(Number(definition.reflectFormula.base)||0)+(Number(definition.reflectFormula.coefficient)||0)*(owner[definition.reflectFormula.stat||'technique']??0)}:{}),stacks:same?Math.min(maxStacks,(previous.stacks||1)+1):1,expiresAt:this.time+Math.max(.02,Number(definition.duration)||5),nextTick:this.time+(Number(definition.period)||1)};
      target.statuses=target.statuses.filter(s=>s.id!==id);target.statuses.push(status);this.emit('status',{actor:source.id,target:target.id,status:copy(status)});return status;
    }
    resetProgress(u){u.progress=0;u.progressStamp=0;u.waitTime=0;u.ready=false;u.readyTick=null;u.queued=null;}
    healUnit(source,target,amount){
      const before=target.soldiers;amount=Math.max(0,Math.floor(amount*this.healingFactor(target)));if(target.dead)return {before,after:before,actual:0,amount:0};
      const actual=Math.min(amount,target.maxSoldiers-before),recovered=!!target.wounded&&actual>0;target.soldiers+=actual;source.stats.healing+=actual;
      const shieldRate=PASSIVES.statsFor(source,this.passives).overhealShield||0;if(shieldRate>0)this.gainShield(source,target,Math.floor(Math.max(0,amount-actual)*shieldRate));
      if(recovered){target.wounded=false;target.condition='healthy';this.resetProgress(target);target.lastSkillDelay=0;target.interval=interval(this.effective(target),this.config,0);}
      return {before,after:target.soldiers,actual,recovered,amount};
    }
    damageUnit(source,target,amount,{periodic=false,ignoreWounds=false,fatal=false}={}){
      const before=target.soldiers;if(target.dead)return {before,after:before,actual:0,dead:true};
      if(target.wounded&&!ignoreWounds&&this.rng()<.5){target.stats.dodges++;return {before,after:before,actual:0,miss:'闪避',woundDodge:true};}
      let remaining=fatal?Math.max(0,target.soldiers):Math.max(0,Math.floor(amount)),absorbed=0;for(const shield of target.statuses.filter(s=>s.shield&&!fatal)){const used=Math.min(shield.amount,remaining);shield.amount-=used;remaining-=used;absorbed+=used;}target.statuses=target.statuses.filter(s=>!s.shield||s.amount>0);
      const actual=Math.min(before,remaining);target.soldiers-=actual;source.stats.damage+=actual;target.stats.received+=actual;const after=target.soldiers,restored=fatal?null:this.survive(target);
      if(target.soldiers===0){
        target.dead=!!(target.wounded||!target.woundsEnabled||ignoreWounds||(periodic&&this.rng()>=.5));target.wounded=!target.dead;target.condition=target.dead?'dead':'wounded';this.resetProgress(target);
        if(target.dead){source.stats.kills++;target.statuses=[];}
      }
      return {before,after,actual,absorbed,restored,defeated:target.soldiers===0,wounded:target.wounded,dead:target.dead};
    }
    tickStatuses(u){
      if(u.dead)return;
      for(const status of [...u.statuses])if(status.period){while(status.nextTick<=this.time+1e-9&&status.nextTick<=status.expiresAt+1e-9&&!u.dead){
        status.nextTick+=status.period;if(status.healing&&u.wounded)continue;
        const source=this.unit(status.source)||u,amount=Math.max(1,Math.floor(Math.abs(status.amount)*(status.stacks||1)*(status.healing?1:this.effective(source).damageMultiplier))),result=status.healing?this.healUnit(source,u,amount):this.damageUnit(source,u,amount,{periodic:true}),{restored,...detail}=result;
        this.emit('action',{actor:source.id,actorName:source.name,side:source.side,skill:'status-'+status.id,skillName:status.name,scope:'single',cost:0,periodic:true,results:[{target:u.id,targetName:u.name,...detail,damageType:this.skills['status-'+status.id]?.kind,healing:!!status.healing,raw:status.healing?result.amount:amount,amount:status.healing?result.amount:amount,factors:[],formula:'持续状态每秒结算'}]});this.healthChanged(u,result.before,result.after);this.restoredHealth(restored);this.checkEnd();if(this.status!=='running')return;
      }}
      const old=u.statuses.length;u.statuses=u.statuses.filter(s=>s.expiresAt>this.time+1e-9);if(u.statuses.length!==old)this.invalidateAI();
    }
    setMode(id, mode) { const u = this.unit(id); if (!u || u.side !== 'ally' || u.soldiers <= 0 || !['auto', 'manual'].includes(mode)) return false; if(mode==='auto'&&this.scenario.control.manualOnly){this.emit('modeblocked',{actor:id,text:'无法自动战斗'});return false;} u.mode = mode; if (mode === 'auto') u.queued = null; this.emit('mode', { actor: id, mode, text: `${u.name}切换为${mode === 'auto' ? '自动' : '手动'}指挥。` }); return true; }
    setPriorities(id, priorities) {
      const u = this.unit(id); if (!u) return false;
      u.priorities = priorities.filter(r=>u.skills.includes(r.skill)).map(r=>normalizeRule(r,this.skills[r.skill]));u.lastSingleSkill=null;
      this.config.rosterOverrides ||= {};
      this.config.rosterOverrides[id] = { ...(this.config.rosterOverrides[id] || {}), priorities: copy(u.priorities) };this.invalidateAI();
      return true;
    }
    setTactics(id,{rules,targetRule}) {
      const u=this.unit(id);if(!u||u.side!=='ally')return false;
      this.setPriorities(id,rules);
      if(['lowestCurrent','highestCurrent','highestMax','random'].includes(targetRule))u.targetRule=targetRule;
      this.config.rosterOverrides[id]={...this.config.rosterOverrides[id],targetRule:u.targetRule};
      u.lastSingleSkill=null;this.emit('tactics',{actor:id,text:`${u.name}的施法逻辑已更新。`});return true;
    }
    queue(id, skillId, targetId, scope = 'single') {
      const u = this.unit(id);
      if (this.status !== 'running') return { ok: false, reason: '请先开始战斗' };
      if (!u || u.soldiers <= 0) return { ok: false, reason: '该部队已溃退' };
      if (u.side !== 'ally') return { ok: false, reason: '不能指挥敌军' };
      const validation = this.validate(u, skillId, targetId, scope);
      if (!validation.ok) return validation;
      u.mode = 'manual';
      if (u.ready) return this.act(id, skillId, targetId, scope);
      u.queued = { skill: skillId, target: targetId, scope };
      this.emit('order', { actor: id, text: `${u.name}已预备${this.skills[skillId].name}，读条完成后执行。` });
      return { ok: true, queued: true };
    }
    manual(id, skillId, targetId) {
      const u=this.unit(id),skill=this.skills[skillId];
      if(!u||u.side!=='ally'||u.mode!=='manual')return {ok:false,reason:'请先切换该武将为手动'};
      if(!u.ready)return {ok:false,reason:'尚未完成读条'};
      if(this.stunned(u))return {ok:false,reason:'眩晕中，无法行动'};
      if(!skill)return {ok:false,reason:'技能不存在'};
      const result=this.act(id,skillId,skill.side==='self'?id:targetId,skill.scope==='all'?'all':'single');if(result.ok)u.lastManualSkill=skillId;return result;
    }
    targetPool(u,skill,scope=skill.scope||'single'){
      const side=skill.side==='enemy'?(u.side==='ally'?'enemy':'ally'):u.side,pool=skill.side==='self'?[u]:skill.kind==='buff'?this.living(side):this.targetable(side);
      if(scope!=='single'||skill.side!=='enemy'||!['physical','tactic'].includes(skill.kind)||skill.ignoreTaunt||PASSIVES.statsFor(u,this.passives).ignoreTaunt)return pool;
      const taunted=pool.filter(t=>t.statuses.some(s=>s.taunt&&s.expiresAt>this.time));return taunted.length?taunted:pool;
    }
    validate(u, skillId, targetId, scope = 'single') {
      const skill = this.skills[skillId];
      if (!skill || !u.skills.includes(skillId)) return { ok: false, reason: '该武将没有此技能' };
      if (skill.element && Array.isArray(this.scenario.scene.allowedElements) && !this.scenario.scene.allowedElements.includes(skill.element)) return { ok: false, reason: '当前战场不能使用此类计策' };
      if (this.availableSp(u) < skill.cost) return { ok: false, reason: '策略值不足' };
      if (scope === 'all' && skill.scope!=='all') return { ok: false, reason: '此行动不支持全体目标' };
      const side = skill.side === 'enemy' ? (u.side === 'ally' ? 'enemy' : 'ally') : u.side;
      let targets = skill.side === 'self' ? [u] : scope === 'all' ? this.targetPool(u,skill,scope) : [this.unit(targetId)];
      if (!targets.length || targets.some(t => !t || t.side !== side || t.dead || (t.soldiers <= 0&&!t.wounded))) return { ok: false, reason: '目标已倒下或阵营不符' };
      if(skill.kind==='buff'&&targets.some(t=>t.wounded))return {ok:false,reason:'需要先治疗重伤目标'};
      if(scope==='single'&&skill.side==='enemy'&&!this.targetPool(u,skill,scope).some(t=>t.id===targetId))return {ok:false,reason:'只能选择嘲讽目标'};
      return { ok: true, skill, targets };
    }
    autoCommand(u) {
      const friends=this.targetable(u.side),foes=this.targetable(u.side==='ally'?'enemy':'ally');if(!friends.length||!foes.length)return null;
      const weakestFriend=[...friends].sort((a,b)=>a.soldiers/a.maxSoldiers-b.soldiers/b.maxSoldiers||a.order-b.order)[0];
      const teammates=friends.filter(t=>t.id!==u.id).sort((a,b)=>a.soldiers/a.maxSoldiers-b.soldiers/b.maxSoldiers||a.order-b.order);
      const sortedFoes=[...foes].sort((a,b)=>u.targetRule==='highestCurrent'?b.soldiers-a.soldiers||a.order-b.order:u.targetRule==='highestMax'?b.maxSoldiers-a.maxSoldiers||a.order-b.order:a.soldiers-b.soldiers||a.order-b.order);
      const weakestFoe=[...foes].sort((a,b)=>a.soldiers-b.soldiers||a.order-b.order)[0],candidates=[];
      for(const r of u.priorities){
        if(r.disabled)continue;const skill=this.skills[r.skill];if(!skill||!u.skills.includes(r.skill)||this.availableSp(u)<skill.cost)continue;
        const threshold=Number(r.threshold);let target=skill.side==='ally'?weakestFriend:skill.side==='self'?u:sortedFoes[0],enabled=false,always=r.when==='always'&&r.frequency!=='sometimes'&&(skill.kind==='heal'||skill.scope!=='all');
        if(['physical','tactic'].includes(skill.kind))enabled=skill.scope==='all'?foes.length>=Math.max(1,Number(r.threshold)||1):true;
        else if(r.when==='healThresholds'){
          const self=Number(r.selfThreshold)||0,ally=Number(r.allyThreshold)||0;
          if(self>0&&u.soldiers<u.maxSoldiers&&u.soldiers/u.maxSoldiers<=self){target=u;enabled=true;always=self>1;}
          else if(ally>0&&teammates[0]&&teammates[0].soldiers/teammates[0].maxSoldiers<=ally){target=teammates[0];enabled=true;always=ally>1;}
        }else enabled=r.when==='always'||(r.when==='allyBelow'&&weakestFriend.soldiers/weakestFriend.maxSoldiers<=threshold)||(r.when==='selfBelow'&&u.soldiers/u.maxSoldiers<=threshold)||(r.when==='enemyCount'&&foes.length>=threshold)||(r.when==='enemyBelow'&&weakestFoe.soldiers/weakestFoe.maxSoldiers<=threshold);
        if(!enabled)continue;
        const scope=skill.scope||(skill.all?r.scope||'single':'single');
        if(skill.kind==='heal'&&(scope==='all'?friends:[target]).every(t=>t.soldiers>=t.maxSoldiers))continue;
        if(skill.kind==='buff'){const id=skill.buff?.id||skill.id,pool=skill.side==='self'?[u]:skill.side==='ally'?friends:sortedFoes,missing=pool.filter(t=>!t.wounded&&!t.statuses.some(s=>s.id===id&&s.expiresAt>this.time));if(!missing.length)continue;if(scope==='single')target=missing[0];}
        if(skill.side==='enemy'&&scope==='single'&&skill.kind!=='buff'){const pool=this.targetPool(u,skill,scope),sorted=sortedFoes.filter(t=>pool.includes(t));target=sorted[0];}
        if(target&&this.validate(u,skill.id,target.id,scope).ok)candidates.push({skill:skill.id,target:target.id,scope,kind:skill.kind,always,frequency:r.frequency});
      }
      if(!candidates.length)return null;
      // 与技能设置界面的从上到下顺序一致；状态维护不参与“始终释放”竞争。
      const displayOrder=(a,b)=>u.skills.indexOf(a.skill)-u.skills.indexOf(b.skill);
      let chosen=candidates.filter(c=>c.kind==='buff').sort(displayOrder)[0]||candidates.filter(c=>c.always).sort(displayOrder)[0]||candidates.filter(c=>c.kind==='heal').sort(displayOrder)[0]||candidates[0];
      if(!chosen.always&&['physical','tactic'].includes(chosen.kind)){
        const damage=candidates.filter(c=>['physical','tactic'].includes(c.kind)),groups=damage.filter(c=>c.scope==='all');
        if(groups.length)chosen=groups[0];
        else chosen=damage[Math.floor(this.rng()*damage.length)];
      }
      if(this.skills[chosen.skill].side==='enemy'&&chosen.scope==='single'&&chosen.kind!=='buff'){const skill=this.skills[chosen.skill],pool=this.targetPool(u,skill),taunted=pool.some(t=>t.statuses.some(s=>s.taunt&&s.expiresAt>this.time));if(u.targetRule==='random'||(u.side==='enemy'&&taunted))chosen={...chosen,target:pool[Math.floor(this.rng()*pool.length)].id};}
      return {skill:chosen.skill,target:chosen.target,scope:chosen.scope};
    }
    dodgeChance(unit,kind){
      const bonus=unit.passives.reduce((n,id)=>n+(Number(this.passives[id]?.stats?.dodgeBonus)||0),0);
      const physicalBonus=kind==='physical'?unit.passives.reduce((n,id)=>n+(Number(this.passives[id]?.stats?.physicalDodgeBonus)||0),0):0;return clamp((kind==='physical'?(Number(unit.dodge)||0):0)+bonus+physicalBonus,0,1);
    }
    survive(unit){
      if(unit.soldiers>0)return null;
      for(const id of unit.passives){const definition=this.passives[id],trigger=definition.triggers?.find(t=>t.on==='lethal'&&t.effect==='restoreFull');if(!trigger)continue;
        unit.soldiers=unit.maxSoldiers;unit.wounded=false;unit.dead=false;unit.condition='healthy';unit.stats.healing+=unit.maxSoldiers;
        return {actor:unit.id,actorName:unit.name,side:unit.side,skill:trigger.skill,skillName:definition.name,passive:id,reaction:true,scope:'single',cost:0,results:[{target:unit.id,targetName:unit.name,before:0,after:unit.soldiers,actual:unit.soldiers,healing:true,raw:unit.soldiers,amount:unit.soldiers,factors:[],formula:'教程被动：濒死恢复全部生命'}]};
      }
      return null;
    }
    reactions(on,owner,source){
      // 反应技能不再触发反应，避免被动互相反击造成无限递归。
      for(const id of owner.passives)for(const trigger of this.passives[id]?.triggers||[]){
        const skill=this.skills[trigger.skill];
        if(trigger.on!==on||!skill||owner.soldiers<=0||source.soldiers<=0||owner.side===source.side)continue;
        const calc=tactic({skill,attacker:this.effective(owner),target:this.effective(source),mitigationScale:this.config.mitigationScale});
        const result=this.damageUnit(owner,source,calc.amount),{restored,...detail}=result;
        this.emit('action',{actor:owner.id,actorName:owner.name,side:owner.side,skill:skill.id,skillName:this.passives[id].name,passive:id,reaction:true,scope:'single',cost:0,results:[{target:source.id,targetName:source.name,...detail,healing:false,critical:false,...calc}]});this.healthChanged(source,result.before,result.after);this.restoredHealth(restored);
      }
    }
    act(id, skillId, targetId, scope = 'single') {
      const u = this.unit(id);
      if (!u || u.soldiers <= 0 || !u.ready || this.status !== 'running') return { ok: false, reason: '尚未完成读条' };
      if(this.stunned(u))return {ok:false,reason:'眩晕中，无法行动'};
      const validation = this.validate(u, skillId, targetId, scope);
      if (!validation.ok) return validation;
      const { skill, targets } = validation;
      if(scope==='single'&&['physical','tactic'].includes(skill.kind))u.lastSingleSkill=skillId;
      const beforeSp = this.availableSp(u);
      if (u.side === 'ally') this.allySp -= skill.cost; else u.sp -= skill.cost;
      u.stats.actions++; this.actionCount++;
      if (skill.kind === 'tactic' || skill.kind === 'heal') u.stats.tactics++;
      const event = { actor: id, actorName: u.name, side: u.side, skill: skillId, skillName: skill.name, scope, cost: skill.cost, spBefore: beforeSp, spAfter: this.availableSp(u), attackerSoldiers: u.soldiers, results: [] };
      const dodged=[],restores=[],reflections=[],counters=[],healthChanges=[];let drain=0;
      for (const target of targets) {
        const before = target.soldiers;
        if (skill.kind === 'buff') {
          const definition=skill.buff || {},status=this.addStatus(u,target,{...definition,id:definition.id||skill.id},skill);
          for(const effect of skill.effects||[])if(effect.recipient!=='self')this.addStatus(u,target,effect,skill);
          event.results.push({target:target.id,targetName:target.name,before,after:before,actual:0,buff:true,status:copy(status),healing:false,raw:0,amount:0,factors:[],formula:'附加状态'});continue;
        }
        let miss=null,critical=false,multiplier=1,random=1,calc;const actor=this.effective(u),victim=this.effective(target),healingSkill=skill.kind==='heal';
        if(!healingSkill&&!target.wounded&&this.config.hit&&!skill.alwaysHit){const dodge=this.dodgeChance(target,skill.kind),hit=hitChance(actor,victim,skill,dodge),roll=this.rng();if(roll>=hit){miss=dodge>0&&roll<hitChance(actor,victim,skill,0)?'闪避':'未命中';if(miss==='闪避'){target.stats.dodges++;dodged.push(target);}}}
        // Explicit dodge passives still function in deterministic tutorial scenarios.
        else if(!healingSkill&&!target.wounded&&this.dodgeChance(target,skill.kind)>0&&this.rng()<this.dodgeChance(target,skill.kind)){miss='闪避';target.stats.dodges++;dodged.push(target);}
        if(!miss&&!healingSkill){critical=!!actor.guaranteedCritical||(this.config.critical&&this.rng()<criticalChance(actor,this.config,skill));multiplier=critical?1.5+(actor.criticalDamageBonus||0)+(skill.kind==='tactic'?(actor.tacticCriticalDamageBonus||0):0):1;}
        calc=miss?{raw:0,amount:0,factors:[],formula:miss}:calculate({attacker:actor,target:victim,skill,critical:multiplier});
        const healing = skill.kind === 'heal';
        const result=miss?{before,after:before,actual:0}:healing?this.healUnit(u,target,calc.amount):this.damageUnit(u,target,calc.amount,{ignoreWounds:!!skill.ignoreWounds});
        const {restored,...detail}=result;if(restored)restores.push(restored);if(result.miss)miss=result.miss;healthChanges.push({unit:target,before,after:target.soldiers});
        if(!healing&&!miss){drain+=Math.floor(calc.amount*((Number(skill.lifesteal)||0)+(skill.kind==='physical'?(actor.physicalLifesteal||0):0)));const reflect=target.soldiers>0?target.statuses.reduce((n,s)=>n+(Number(s.reflect)||0),0):0;if(skill.kind==='physical'&&target.soldiers>0){const p=PASSIVES.statsFor(target,this.passives);if(p.counterChance&&this.rng()<p.counterChance)counters.push({source:target,multiplier:p.counterMultiplier||.5});}if(reflect>0)reflections.push({source:target,amount:Math.floor(result.actual*reflect*this.effective(target).damageMultiplier)});}
        if(!miss&&!target.dead)for(const effect of skill.effects||[])if(effect.recipient!=='self')this.addStatus(u,target,effect,skill);
        event.results.push({target:target.id,targetName:target.name,...detail,healing,miss,critical:!miss&&critical,multiplier,random,...calc,...(healing?{amount:result.amount,raw:result.amount}:{})});
      }
      for(const effect of skill.effects||[])if(effect.recipient==='self')this.addStatus(u,u,effect,skill);
      if (skill.element === 'fire') this.fireCount++;
      if(drain>0&&u.soldiers>0){const result=this.healUnit(u,u,drain);healthChanges.push({unit:u,before:result.before,after:result.after});event.results.push({target:u.id,targetName:u.name,...result,healing:true,raw:result.amount,factors:[],formula:'吸血回复'});}
      const regen=Math.floor(u.maxSoldiers*(PASSIVES.statsFor(u,this.passives).actionRegen||0));if(regen>0&&u.soldiers>0){const result=this.healUnit(u,u,regen);event.results.push({target:u.id,targetName:u.name,...result,healing:true,raw:result.amount,amount:result.amount,formula:'行动回复'});healthChanges.push({unit:u,before:result.before,after:result.after});}
      const delay=this.config.skillDelays?.[skillId]??skill.cooldown??0;
      u.progress = 0;u.progressStamp=0;u.waitTime=0;u.lastSkillDelay=Number(delay)||0; u.ready = false; u.readyTick=null; u.interval = interval(this.effective(u), this.config, delay);
      event.skillDelay = Number(delay) || 0;
      event.nextInterval = u.interval;
      this.emit('action', event);for(const change of healthChanges)this.healthChanged(change.unit,change.before,change.after);for(const restored of restores)this.restoredHealth(restored);for(const target of dodged)this.reactions('dodge',target,u);if(skill.kind==='heal')for(const result of event.results)if(result.healing&&result.actual>0)this.healingPassives(u,this.unit(result.target));
      for(const reflect of reflections)if(!u.dead&&reflect.amount>0){const result=this.damageUnit(reflect.source,u,reflect.amount),{restored,...detail}=result;this.emit('action',{actor:reflect.source.id,actorName:reflect.source.name,side:reflect.source.side,skill:'status-reflect',skillName:'反伤',reaction:true,scope:'single',cost:0,results:[{target:u.id,targetName:u.name,...detail,damageType:'true',raw:reflect.amount,amount:reflect.amount,healing:false,factors:[],formula:'已承受伤害 × 反伤比例'}]});this.healthChanged(u,result.before,result.after);this.restoredHealth(restored);}
      for(const counter of counters)if(u.soldiers>0&&counter.source.soldiers>0){const calc=physical({attacker:this.effective(counter.source),target:this.effective(u),skill:{kind:'physical',scaling:{war:counter.multiplier},weaponCoefficient:counter.multiplier}}),result=this.damageUnit(counter.source,u,calc.amount),{restored,...detail}=result;this.emit('action',{actor:counter.source.id,actorName:counter.source.name,side:counter.source.side,skill:'passive-counter',skillName:'以逸待劳',reaction:true,scope:'single',cost:0,results:[{target:u.id,targetName:u.name,...detail,...calc,healing:false}]});this.healthChanged(u,result.before,result.after);this.restoredHealth(restored);}
      this.checkEnd();
      return { ok: true };
    }
    checkEnd() {
      const allies = this.living('ally').length, enemies = this.living('enemy').length;
      if (allies > 0 && enemies > 0) return;
      this.status = allies > 0 ? 'victory' : enemies > 0 ? 'defeat' : 'draw';
      this.emit('end', { result: this.status, text: this.status === 'victory' ? '敌军溃退，我方取胜。' : this.status === 'defeat' ? '我方溃退，此役失利。' : '两军俱溃。' });
    }
    canRetreat(){const delay=Number(this.config.retreatAfter);return this.status==='running'&&!this.scenario.control.retreatDisabled&&(this.scenario.allowRetreat||this.time>=(Number.isFinite(delay)?Math.max(0,delay):300));}
    retreat() { if (!this.canRetreat()) return false; this.status = 'retreated'; this.emit('end',{result:'retreated',text:'我方撤退。'}); return true; }
    export() { return { version: 2, scenario: copy(this.scenario), skills:copy(this.skills), passives:copy(this.passives), config: copy(this.config), result: this.status, time: this.time, units: copy(this.units), events: copy(this.events) }; }
  }
  const api = { Battle, attr, maxHealth, maxSoldiers, ratio, interval, physical, tactic, calculate, skillValue, raceMultiplier, hitChance, mitigation, normalizeRule, criticalChance, seededRandom, seedNumber };
  root.BattleEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
