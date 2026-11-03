(function (root) {
  'use strict';
  const DATA = typeof module !== 'undefined' && module.exports ? require('./rules.js') : root.BattleRules;
  const PASSIVES = typeof module !== 'undefined' && module.exports ? require('./passives.js') : root.BattlePassives;
  const STATES = typeof module !== 'undefined' && module.exports ? require('./statuses.js') : root.BattleStatuses;
  const WEAPONS = typeof module !== 'undefined' && module.exports ? require('./weapon-skills.js') : root.WeaponSkills;
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
  function maxSoldiers(level, leadership) {
    const n = Math.max(0, attr(level) - 1);
    return Math.max(1, Math.round((200 + 60 * n + .4 * n * n) * attr(leadership) / 255));
  }
  function ratio(war, speed, timing = 'classic') {
    const r = attr(war) / (attr(speed) + (timing === 'modern' ? 1 : 0));
    return timing === 'modern' ? Math.floor(Math.min(3, r) * 10) / 10 : Math.min(3, Math.ceil(r * 10) / 10);
  }
  function interval(unit, config = DEFAULTS, skillDelay = 0) { return Math.max(.5, 1.5 + ratio(unit.war, unit.speed, config.timing) + (Number(skillDelay) || 0)); }
  function mitigation(value,scale=100) {
    const protection=Math.max(0,Number(value)||0),k=Math.max(1,Number(scale)||100);
    return k/(k+protection);
  }
  function physical({attacker,target,level=40,random=1,critical=1,mitigationScale=100}) {
    if(attacker.soldiers<=0)return {raw:0,amount:0,factors:[]};
    const k=Math.max(1,Number(mitigationScale)||100),armor=attacker.ignoreArmor?0:Math.max(0,Number(target.armor)||0),attack=Math.max(1,attacker.attack);
    const player=attacker.side==='ally',levelFactor=player?.5*(1+(attr(level)-2.95125)/82.03125):.25,correction=player?1:.9;
    const beforeMitigation=Math.max(0,levelFactor*(attack/100)*attr(attacker.war)/256*attacker.soldiers*correction*random*critical),protection=mitigation(armor,k),raw=beforeMitigation*protection;
    return {raw,amount:Math.max(1,Math.floor(raw)),armor,beforeMitigation,mitigation:protection,factors:[['阵营/等级系数',levelFactor],['装备攻击÷100',attack/100],['武力÷256',attr(attacker.war)/256],['当前兵力',attacker.soldiers],['敌方补正',correction],['乱数',random],['会心倍率',critical],['护甲',armor],['护甲承伤倍率',protection]],formula:'基础物理伤害 × K÷(K＋护甲)'};
  }
  function tactic({skill,intelligence,random=1,count=1,scope='single',target,mitigationScale=100}) {
    const divisor=scope==='all'?Math.max(1,count-1):1,beforeMitigation=skill.base*attr(intelligence)/256*random/divisor;
    const resistance=skill.kind==='heal'?0:Math.max(0,Number(target?.resistance)||0),protection=skill.kind==='heal'?1:mitigation(resistance,mitigationScale),raw=beforeMitigation*protection;
    return {raw,amount:Math.max(1,Math.floor(raw)),resistance,beforeMitigation,mitigation:protection,factors:[['计策基数',skill.base],['智力÷256',attr(intelligence)/256],['乱数',random],['群体分摊',divisor],['抗性',resistance],['抗性承伤倍率',protection]],formula:skill.kind==='heal'?'回复基数 × 智力÷256 × 乱数 ÷ 群体分摊':'基础计策伤害 × K÷(K＋抗性)'};
  }
  function criticalChance(unit, config) {
    if (unit.guaranteedCritical) return 1;
    const value = config.criticalSource === 'speed' ? unit.speed : unit.technique;
    const bonus = unit.criticalChain > 0 ? 3 : 1;
    return clamp(attr(value) / 256 / 8 * bonus, 0, 1);
  }
  function weighted(rng, values, weights) {
    let sample = rng() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < values.length; i++) { sample -= weights[i]; if (sample < 0) return values[i]; }
    return values[values.length - 1];
  }
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
        const u = { ...base, ...(this.config.rosterOverrides?.[base.id] || {}) };
        for (const key of ['war', 'intelligence', 'leadership', 'speed', 'technique']) u[key] = attr(u[key]);
        u.attack = Math.max(1, Math.floor(Number(u.attack) || 1)); u.armor = Math.max(0,Math.floor(Number(u.armor)||0));u.resistance=Math.max(0,Math.floor(Number(u.resistance)||0));
        u.level = attr(u.level ?? (u.side === 'enemy' ? this.config.enemyLevel || this.config.level : this.config.level));
        u.skills = Array.isArray(u.skills) ? u.skills.filter(id=>this.skills[id]&&!this.skills[id].reactionOnly) : [];
        u.passives = Array.isArray(u.passives) ? [...new Set(u.passives)].filter(id=>this.passives[id]) : [];
        u.priorities = Array.isArray(u.priorities) ? u.priorities.map(r=>normalizeRule(r,this.skills[r.skill])) : [];
        u.targetRule=u.targetRule||'lowestCurrent';u.lastSingleSkill=null;u.lastManualSkill=null;
        u.maxSoldiers = u.maxSoldiers == null ? maxSoldiers(u.level, u.leadership) : attr(u.maxSoldiers);
        u.soldiers = clamp(Math.floor(Number(u.startSoldiers ?? u.maxSoldiers)), 0, u.maxSoldiers);
        u.sp = Math.max(0, Number(u.enemySp) || 0); u.initialSp = u.sp;
        u.interval = interval(u, this.config); u.progress = clamp(Number(u.initialProgress)||0,0,1); u.ready = u.progress>=1; u.readyTick=u.ready?0:null; u.mode = u.initialMode==='manual'||(u.side==='ally'&&this.scenario.control.manualOnly)?'manual':'auto'; u.queued = null;
        u.statuses = [];u.lastSkillDelay=0;u.waitTime=u.progress*u.interval;u.progressStamp=u.progress;u.autoCheckedRevision=-1; u.criticalChain = 0; u.order = order;
        u.stats = { damage: 0, healing: 0, received: 0, actions: 0, kills: 0, tactics: 0, dodges: 0 };
        return u;
      });
      this.unitIndex=new Map(this.units.map(u=>[u.id,u]));
      this.initialTroops = { ally: this.total('ally'), enemy: this.total('enemy') };
      this.emit('system', { text: `${this.scenario.title}，双方部队就位。` });
    }
    unit(id) { return this.unitIndex.get(id); }
    living(side) { return this.units.filter(u => u.side === side && u.soldiers > 0); }
    total(side) { return this.units.filter(u => u.side === side).reduce((n, u) => n + u.soldiers, 0); }
    availableSp(unit) { return unit.side === 'ally' ? this.allySp : unit.sp; }
    invalidateAI(){this.revision++;}
    emit(type, detail) { this.revision++;const event = { id: ++this.sequence, tick: this.tick, time: this.time, type, ...detail }; this.events.push(event); return event; }
    start() { if (this.status === 'ready') { this.status = 'running'; this.emit('system', { text: '战鼓已响，两军交锋。' }); this.checkEnd(); } }
    advance(seconds) {
      if (this.status !== 'running') return;
      this.accumulator += Math.max(0, Number(seconds) || 0);
      let iterations = 0;
      while (this.accumulator + 1e-9 >= .02 && this.status === 'running' && iterations++ < 50000) {
        this.accumulator -= .02; this.tick++; this.time = this.tick * .02;
        for(const u of this.units)this.tickStatuses(u);if(this.status!=='running')break;
        for (const u of this.units) if (u.soldiers > 0&&!this.stunned(u)) {if(u.progress!==u.progressStamp)u.waitTime=u.progress*u.interval;u.interval=interval(this.effective(u),this.config,u.lastSkillDelay);u.waitTime+=.02;const raw=Math.min(1,u.waitTime/u.interval);u.progress=Math.max(u.progress,raw);u.progressStamp=u.progress;if(!u.ready&&u.waitTime>=u.interval-1e-9)u.readyTick=this.tick;u.ready=u.waitTime>=u.interval-1e-9;}
        for (const u of this.units) {
          if (this.status !== 'running') break;
          if (u.soldiers <= 0 || !u.ready || this.stunned(u)) continue;
          if (u.queued) {
            const command = u.queued; u.queued = null;
            const result = this.act(u.id, command.skill, command.target, command.scope);
            if (!result.ok) { this.emit('notice', { actor: u.id, text: `${u.name}指令取消：${result.reason}` }); }
          }
          if(u.ready&&u.mode==='auto'&&u.autoCheckedRevision!==this.revision){u.autoCheckedRevision=this.revision;const command=this.autoCommand(u);if(command)this.act(u.id,command.skill,command.target,command.scope);}
        }
      }
    }
    effective(u){
      const out={...u};for(const key of ['war','intelligence','leadership','speed','technique','attack','armor','resistance']){
        const add=u.statuses.reduce((n,s)=>n+(s.attribute===key?(Number(s.amount)||0)*(s.stacks||1):0),0),mult=u.statuses.reduce((n,s)=>n*(Number(s[key+'Multiplier'])||1),1);out[key]=Math.max(['armor','resistance'].includes(key)?0:1,(u[key]+add)*mult);
      }return out;
    }
    stunned(u){return u.statuses.some(s=>s.stun&&s.expiresAt>this.time);}
    addStatus(source,target,effect,skill={}){
      const base=STATES.definitions[effect.id]||{},definition={...copy(base),...copy(effect)},id=definition.id||skill.id;
      if(target.soldiers<=0||(target.statusImmunities||[]).includes(id))return null;
      if(definition.chance!==undefined){const chance=clamp(Number(definition.chance)-(source.side!==target.side?this.effective(target).resistance/1000:0),0,1);if(this.rng()>=chance)return null;}
      const owner=this.effective(source),coefficient=Number(definition.coefficient)||0;
      let amount=Number(definition.amount??((Number(definition.base)||0)+coefficient*(owner[definition.stat||'technique']||1)))||0;if(definition.negative)amount=-Math.abs(amount);
      const previous=target.statuses.find(s=>s.id===id),origin=skill.id||id,maxStacks=Math.max(1,Number(definition.maxStacks)||1),same=previous?.origin===origin;
      const status={...definition,id,name:definition.name||skill.name||id,source:source.id,origin,amount,stacks:same?Math.min(maxStacks,(previous.stacks||1)+1):1,expiresAt:this.time+Math.max(.02,Number(definition.duration)||5),nextTick:this.time+(Number(definition.period)||1)};
      target.statuses=target.statuses.filter(s=>s.id!==id);target.statuses.push(status);this.emit('status',{actor:source.id,target:target.id,status:copy(status)});return status;
    }
    tickStatuses(u){
      if(u.soldiers<=0)return;
      for(const status of [...u.statuses])if(status.period){while(status.nextTick<=this.time+1e-9&&status.nextTick<=status.expiresAt+1e-9&&u.soldiers>0){
        status.nextTick+=status.period;const source=this.unit(status.source)||u,before=u.soldiers,amount=Math.max(1,Math.floor(Math.abs(status.amount)*(status.stacks||1))),actual=Math.min(amount,status.healing?u.maxSoldiers-before:before);u.soldiers+=status.healing?actual:-actual;
        const after=u.soldiers,restored=this.survive(u),defeated=u.soldiers===0;
        if(status.healing)source.stats.healing+=actual;else{source.stats.damage+=actual;u.stats.received+=actual;}
        if(defeated){source.stats.kills++;u.progress=0;u.progressStamp=0;u.waitTime=0;u.ready=false;u.queued=null;u.statuses=[];}
        this.emit('action',{actor:source.id,actorName:source.name,side:source.side,skill:'status-'+status.id,skillName:status.name,scope:'single',cost:0,periodic:true,results:[{target:u.id,targetName:u.name,before,after,actual,healing:!!status.healing,defeated,raw:amount,amount,factors:[],formula:'持续状态每秒结算'}]});if(restored)this.emit('action',restored);this.checkEnd();if(this.status!=='running')return;
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
      const side=skill.side==='enemy'?(u.side==='ally'?'enemy':'ally'):u.side,pool=skill.side==='self'?[u]:this.living(side);
      if(scope!=='single'||skill.side!=='enemy'||!['physical','tactic'].includes(skill.kind)||skill.ignoreTaunt)return pool;
      const taunted=pool.filter(t=>t.statuses.some(s=>s.taunt&&s.expiresAt>this.time));return taunted.length?taunted:pool;
    }
    validate(u, skillId, targetId, scope = 'single') {
      const skill = this.skills[skillId];
      if (!skill || !u.skills.includes(skillId)) return { ok: false, reason: '该武将没有此技能' };
      if (skill.element && Array.isArray(this.scenario.scene.allowedElements) && !this.scenario.scene.allowedElements.includes(skill.element)) return { ok: false, reason: '当前战场不能使用此类计策' };
      if (this.availableSp(u) < skill.cost) return { ok: false, reason: '策略值不足' };
      if (scope === 'all' && !skill.all) return { ok: false, reason: '此行动不支持全体目标' };
      const side = skill.side === 'enemy' ? (u.side === 'ally' ? 'enemy' : 'ally') : u.side;
      let targets = skill.side === 'self' ? [u] : scope === 'all' ? this.living(side) : [this.unit(targetId)];
      if (!targets.length || targets.some(t => !t || t.side !== side || t.soldiers <= 0)) return { ok: false, reason: '目标已溃退或阵营不符' };
      if(scope==='single'&&skill.side==='enemy'&&!this.targetPool(u,skill,scope).some(t=>t.id===targetId))return {ok:false,reason:'只能选择嘲讽目标'};
      if (skill.kind === 'heal' && targets.every(t => t.soldiers >= t.maxSoldiers)) return { ok: false, reason: '目标兵力已满' };
      return { ok: true, skill, targets };
    }
    autoCommand(u) {
      const friends=this.living(u.side),foes=this.living(u.side==='ally'?'enemy':'ally');if(!friends.length||!foes.length)return null;
      const weakestFriend=[...friends].sort((a,b)=>a.soldiers/a.maxSoldiers-b.soldiers/b.maxSoldiers||a.order-b.order)[0];
      const teammates=friends.filter(t=>t.id!==u.id).sort((a,b)=>a.soldiers/a.maxSoldiers-b.soldiers/b.maxSoldiers||a.order-b.order);
      const sortedFoes=[...foes].sort((a,b)=>u.targetRule==='highestCurrent'?b.soldiers-a.soldiers||a.order-b.order:u.targetRule==='highestMax'?b.maxSoldiers-a.maxSoldiers||a.order-b.order:a.soldiers-b.soldiers||a.order-b.order);
      const weakestFoe=[...foes].sort((a,b)=>a.soldiers-b.soldiers||a.order-b.order)[0],candidates=[];
      for(const r of u.priorities){
        if(r.disabled)continue;const skill=this.skills[r.skill];if(!skill||!u.skills.includes(r.skill)||this.availableSp(u)<skill.cost)continue;
        const threshold=Number(r.threshold);let target=skill.side==='ally'?weakestFriend:skill.side==='self'?u:sortedFoes[0],enabled=false;
        if(['physical','tactic'].includes(skill.kind))enabled=skill.scope==='all'?foes.length>=Math.max(1,Number(r.threshold)||1):true;
        else if(r.when==='healThresholds'){
          const self=Number(r.selfThreshold)||0,ally=Number(r.allyThreshold)||0;
          if(self>0&&u.soldiers<u.maxSoldiers&&u.soldiers/u.maxSoldiers<=self){target=u;enabled=true;}
          else if(ally>0&&teammates[0]&&teammates[0].soldiers/teammates[0].maxSoldiers<=ally){target=teammates[0];enabled=true;}
        }else enabled=r.when==='always'||(r.when==='allyBelow'&&weakestFriend.soldiers/weakestFriend.maxSoldiers<=threshold)||(r.when==='selfBelow'&&u.soldiers/u.maxSoldiers<=threshold)||(r.when==='enemyCount'&&foes.length>=threshold)||(r.when==='enemyBelow'&&weakestFoe.soldiers/weakestFoe.maxSoldiers<=threshold);
        if(!enabled)continue;
        const scope=skill.scope||(skill.all?r.scope||'single':'single');
        if(skill.kind==='buff'&&!skill.buff?.reapply){const id=skill.buff?.id||skill.id,pool=skill.side==='self'?[u]:skill.side==='ally'?friends:sortedFoes,missing=pool.filter(t=>!t.statuses.some(s=>s.id===id&&s.expiresAt>this.time));if(!missing.length)continue;if(scope==='single')target=missing[0];}
        if(skill.side==='enemy'&&scope==='single'){const pool=this.targetPool(u,skill,scope),sorted=sortedFoes.filter(t=>pool.includes(t));target=sorted[0];}
        if(target&&this.validate(u,skill.id,target.id,scope).ok)candidates.push({skill:skill.id,target:target.id,scope,kind:skill.kind,frequency:r.frequency});
      }
      if(!candidates.length)return null;
      let chosen=candidates[0];
      if(['physical','tactic'].includes(chosen.kind)){
        const damage=candidates.filter(c=>['physical','tactic'].includes(c.kind)),groups=damage.filter(c=>c.scope==='all');
        if(groups.length)chosen=groups[0];
        else if(damage.some(c=>c.frequency==='sometimes'))chosen=damage[Math.floor(this.rng()*damage.length)];
        else{const previous=damage.findIndex(c=>c.skill===u.lastSingleSkill);chosen=damage[(previous+1)%damage.length];}
      }
      if(this.skills[chosen.skill].side==='enemy'&&chosen.scope==='single'){const skill=this.skills[chosen.skill],pool=this.targetPool(u,skill),taunted=pool.some(t=>t.statuses.some(s=>s.taunt&&s.expiresAt>this.time));if(u.targetRule==='random'||(u.side==='enemy'&&taunted))chosen={...chosen,target:pool[Math.floor(this.rng()*pool.length)].id};}
      return {skill:chosen.skill,target:chosen.target,scope:chosen.scope};
    }
    dodgeChance(unit,kind){
      const bonus=unit.passives.reduce((n,id)=>n+(Number(this.passives[id]?.stats?.dodgeBonus)||0),0);
      return clamp((kind==='physical'?(Number(unit.dodge)||0):0)+bonus,0,1);
    }
    survive(unit){
      if(unit.soldiers>0)return null;
      for(const id of unit.passives){const definition=this.passives[id],trigger=definition.triggers?.find(t=>t.on==='lethal'&&t.effect==='restoreFull');if(!trigger)continue;
        unit.soldiers=unit.maxSoldiers;unit.stats.healing+=unit.maxSoldiers;
        return {actor:unit.id,actorName:unit.name,side:unit.side,skill:trigger.skill,skillName:definition.name,passive:id,reaction:true,scope:'single',cost:0,results:[{target:unit.id,targetName:unit.name,before:0,after:unit.soldiers,actual:unit.soldiers,healing:true,raw:unit.soldiers,amount:unit.soldiers,factors:[],formula:'教程被动：濒死恢复全部兵力'}]};
      }
      return null;
    }
    reactions(on,owner,source){
      // 反应技能不再触发反应，避免被动互相反击造成无限递归。
      for(const id of owner.passives)for(const trigger of this.passives[id]?.triggers||[]){
        const skill=this.skills[trigger.skill];
        if(trigger.on!==on||!skill||owner.soldiers<=0||source.soldiers<=0||owner.side===source.side)continue;
        const calc=tactic({skill,intelligence:this.effective(owner).intelligence,target:this.effective(source),mitigationScale:this.config.mitigationScale});
        const before=source.soldiers,actual=Math.min(before,calc.amount);source.soldiers-=actual;
        owner.stats.damage+=actual;source.stats.received+=actual;
        const after=source.soldiers,restored=this.survive(source),defeated=source.soldiers===0;if(defeated){owner.stats.kills++;source.progress=0;source.ready=false;source.queued=null;source.statuses=[];}
        this.emit('action',{actor:owner.id,actorName:owner.name,side:owner.side,skill:skill.id,skillName:this.passives[id].name,passive:id,reaction:true,scope:'single',cost:0,results:[{target:source.id,targetName:source.name,before,after,actual,healing:false,defeated,critical:false,...calc}]});if(restored)this.emit('action',restored);
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
      const dodged=[],restores=[],reflections=[];let drain=0;
      for (const target of targets) {
        const before = target.soldiers;
        if (skill.kind === 'buff') {
          const definition=skill.buff || {},status=this.addStatus(u,target,{...definition,id:definition.id||skill.id},skill);
          for(const effect of skill.effects||[])this.addStatus(u,target,effect,skill);
          event.results.push({target:target.id,targetName:target.name,before,after:before,actual:0,buff:true,status:copy(status),healing:false,raw:0,amount:0,factors:[],formula:'附加状态'});continue;
        }
        let miss = null, critical = false, multiplier = 1, random = 1, calc;
        const dodge=skill.kind==='heal'?0:this.dodgeChance(target,skill.kind);
        if(dodge>0&&this.rng()<dodge){miss='闪避';target.stats.dodges++;dodged.push(target);}
        if (skill.kind === 'physical') {
          if (!miss&&!skill.alwaysHit&&this.config.hit && this.rng() >= (u.side === 'ally' ? 244 : 235) / 256) miss = '未命中';
          if (!miss) {
            critical = !!u.guaranteedCritical || (this.config.critical && this.rng() < clamp(criticalChance(this.effective(u), this.config)+(skill.criticalBonus||0),0,1));
            if (critical) { u.criticalChain++; multiplier = [1.2, 1.4, 1.6, 2, 3][Math.min(4, u.criticalChain - 1)]; }
            else u.criticalChain = 0;
            const values = this.config.physicalRandom === 'list' ? [.8, .92, 1, 1.12, 1.2] : [.8, .9, 1, 1.1, 1.2];
            random = this.config.random ? weighted(this.rng, values, [1, 4, 6, 4, 1]) : 1;
            const attacker=this.effective(u);attacker.attack*=Number(skill.power)||1;
            calc = physical({ attacker, target:this.effective(target), level: u.side === 'ally' ? u.level : target.level, random, critical: multiplier, mitigationScale:this.config.mitigationScale });
          } else { calc = { raw: 0, amount: 0, factors: [], formula: miss }; }
        } else if(miss){calc={raw:0,amount:0,factors:[],formula:miss};} else {
          random = this.config.random ? weighted(this.rng, [.6, .8, 1, 1.2, 1.4], [1, 3, 8, 2, 2]) : 1;
          calc = tactic({skill,intelligence:this.effective(u).intelligence,random,count:targets.length,scope,target:this.effective(target),mitigationScale:this.config.mitigationScale});
        }
        const healing = skill.kind === 'heal';
        const actual = Math.min(calc.amount, healing ? target.maxSoldiers - before : before);
        target.soldiers = healing ? before + actual : before - actual;
        const after=target.soldiers,restored=!healing?this.survive(target):null;if(restored)restores.push(restored);
        if (healing) u.stats.healing += actual;
        else { u.stats.damage += actual; target.stats.received += actual; }
        if(!healing&&!miss){drain+=Math.floor(actual*(Number(skill.lifesteal)||0));if(skill.kind==='physical'){const reflect=target.statuses.reduce((n,s)=>n+(Number(s.reflect)||0),0);if(reflect>0)reflections.push({source:target,amount:Math.floor(actual*reflect)});}}
        if(!miss&&target.soldiers>0)for(const effect of skill.effects||[])this.addStatus(u,target,effect,skill);
        const defeated = !healing && before > 0 && target.soldiers === 0;
        if (defeated) { u.stats.kills++; target.progress = 0; target.ready = false; target.queued = null; target.statuses=[]; }
        event.results.push({ target: target.id, targetName: target.name, before, after, actual, healing, miss, critical, multiplier, random, defeated, ...calc });
      }
      if (skill.element === 'fire') this.fireCount++;
      if(drain>0&&u.soldiers>0){const before=u.soldiers,actual=Math.min(drain,u.maxSoldiers-before);u.soldiers+=actual;u.stats.healing+=actual;event.results.push({target:u.id,targetName:u.name,before,after:u.soldiers,actual,healing:true,raw:drain,amount:drain,factors:[],formula:'吸血回复'});}
      const delay=this.config.skillDelays?.[skillId]??skill.cooldown??0;
      u.progress = 0;u.progressStamp=0;u.waitTime=0;u.lastSkillDelay=Number(delay)||0; u.ready = false; u.readyTick=null; u.interval = interval(this.effective(u), this.config, delay);
      event.skillDelay = Number(delay) || 0;
      event.nextInterval = u.interval;
      this.emit('action', event);for(const restored of restores)this.emit('action',restored);for(const target of dodged)this.reactions('dodge',target,u);
      for(const reflect of reflections)if(u.soldiers>0&&reflect.amount>0){const before=u.soldiers,actual=Math.min(before,reflect.amount);u.soldiers-=actual;const after=u.soldiers,restored=this.survive(u),defeated=u.soldiers===0;reflect.source.stats.damage+=actual;u.stats.received+=actual;if(defeated){reflect.source.stats.kills++;u.progress=0;u.ready=false;u.statuses=[];}this.emit('action',{actor:reflect.source.id,actorName:reflect.source.name,side:reflect.source.side,skill:'status-reflect',skillName:'反伤',reaction:true,scope:'single',cost:0,results:[{target:u.id,targetName:u.name,before,after,actual,raw:actual,amount:actual,healing:false,defeated,factors:[],formula:'已承受物理伤害 × 反伤比例'}]});if(restored)this.emit('action',restored);}
      this.checkEnd();
      return { ok: true };
    }
    checkEnd() {
      const allies = this.living('ally').length, enemies = this.living('enemy').length;
      if (allies > 0 && enemies > 0) return;
      this.status = allies > 0 ? 'victory' : enemies > 0 ? 'defeat' : 'draw';
      this.emit('end', { result: this.status, text: this.status === 'victory' ? '敌军溃退，我方取胜。' : this.status === 'defeat' ? '我方溃退，此役失利。' : '两军俱溃。' });
    }
    retreat() { if (!this.scenario.allowRetreat || this.status !== 'running') return false; this.status = 'retreated'; this.emit('end',{result:'retreated',text:'我方撤退。'}); return true; }
    export() { return { version: 2, scenario: copy(this.scenario), skills:copy(this.skills), passives:copy(this.passives), config: copy(this.config), result: this.status, time: this.time, units: copy(this.units), events: copy(this.events) }; }
  }
  const api = { Battle, attr, maxSoldiers, ratio, interval, physical, tactic, mitigation, normalizeRule, criticalChance, seededRandom, seedNumber };
  root.BattleEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
