(function (root) {
  'use strict';
  const DATA = typeof module !== 'undefined' && module.exports ? require('./rules.js') : root.BattleRules;
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
      return {skill:rule.skill,disabled:!!rule.disabled,when:skill.scope==='all'?'enemyCount':'always',threshold:skill.scope==='all'?(rule.when==='enemyCount'?Math.max(1,Math.floor(Number(rule.threshold)||1)):1):0};
    }
    return r;
  }
  class Battle {
    constructor(options = {}) {
      if (!Array.isArray(options.allies) || !Array.isArray(options.enemies)) throw new TypeError('战斗必须传入 allies 和 enemies 阵容');
      this.scenario = { id:options.id || 'battle', title:options.title || '战斗', scene:copy(options.scene || {}), allowRetreat:!!options.allowRetreat };
      this.config = { ...copy(DEFAULTS), ...copy(options.rules || {}) };
      this.skills = {...copy(SKILLS),...copy(options.skills || {})};
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
        u.skills = Array.isArray(u.skills) ? u.skills.filter(id=>this.skills[id]) : [];
        u.priorities = Array.isArray(u.priorities) ? u.priorities.map(r=>normalizeRule(r,this.skills[r.skill])) : [];
        u.targetRule=u.targetRule||'lowestCurrent';u.lastSingleSkill=null;
        u.maxSoldiers = maxSoldiers(u.level, u.leadership);
        u.soldiers = clamp(Math.floor(Number(u.startSoldiers ?? u.maxSoldiers)), 0, u.maxSoldiers);
        u.sp = Math.max(0, Number(u.enemySp) || 0); u.initialSp = u.sp;
        u.interval = interval(u, this.config); u.progress = 0; u.ready = false; u.readyTick=null; u.mode = u.initialMode==='manual'?'manual':'auto'; u.queued = null;
        u.statuses = [];u.autoCheckedRevision=-1; u.criticalChain = 0; u.order = order;
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
        for(const u of this.units)if(u.statuses.length){const old=u.statuses.length;u.statuses=u.statuses.filter(s=>s.expiresAt>this.time);if(u.statuses.length!==old)this.revision++;}
        for (const u of this.units) if (u.soldiers > 0) { u.progress = Math.min(1, u.progress + .02 / u.interval); if(!u.ready&&u.progress>=1-1e-9)u.readyTick=this.tick; u.ready = u.progress >= 1 - 1e-9; }
        for (const u of this.units) {
          if (this.status !== 'running') break;
          if (u.soldiers <= 0 || !u.ready) continue;
          if (u.queued) {
            const command = u.queued; u.queued = null;
            const result = this.act(u.id, command.skill, command.target, command.scope);
            if (!result.ok) { this.emit('notice', { actor: u.id, text: `${u.name}指令取消：${result.reason}` }); }
          }
          if(u.ready&&u.mode==='auto'&&u.autoCheckedRevision!==this.revision){u.autoCheckedRevision=this.revision;const command=this.autoCommand(u);if(command)this.act(u.id,command.skill,command.target,command.scope);}
        }
      }
    }
    setMode(id, mode) { const u = this.unit(id); if (!u || u.side !== 'ally' || u.soldiers <= 0 || !['auto', 'manual'].includes(mode)) return false; u.mode = mode; if (mode === 'auto') u.queued = null; this.emit('mode', { actor: id, mode, text: `${u.name}切换为${mode === 'auto' ? '自动' : '手动'}指挥。` }); return true; }
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
      if(!skill)return {ok:false,reason:'技能不存在'};
      return this.act(id,skillId,skill.side==='self'?id:targetId,skill.scope==='all'?'all':'single');
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
      if (skill.kind === 'physical') { const taunt = this.living(side).filter(t=>t.statuses.some(s=>s.taunt && s.expiresAt>this.time)); if (taunt.length && !targets.some(t=>taunt.includes(t))) targets=[taunt[0]]; }
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
        if(this.validate(u,skill.id,target.id,scope).ok)candidates.push({skill:skill.id,target:target.id,scope,kind:skill.kind});
      }
      if(!candidates.length)return null;
      let chosen=candidates[0];
      if(['physical','tactic'].includes(chosen.kind)){
        const damage=candidates.filter(c=>['physical','tactic'].includes(c.kind)),groups=damage.filter(c=>c.scope==='all');
        if(groups.length)chosen=groups[0];
        else{const previous=damage.findIndex(c=>c.skill===u.lastSingleSkill);chosen=damage[(previous+1)%damage.length];}
      }
      if(this.skills[chosen.skill].side==='enemy'&&u.targetRule==='random'&&chosen.scope==='single')chosen={...chosen,target:foes[Math.floor(this.rng()*foes.length)].id};
      return {skill:chosen.skill,target:chosen.target,scope:chosen.scope};
    }
    act(id, skillId, targetId, scope = 'single') {
      const u = this.unit(id);
      if (!u || u.soldiers <= 0 || !u.ready || this.status !== 'running') return { ok: false, reason: '尚未完成读条' };
      const validation = this.validate(u, skillId, targetId, scope);
      if (!validation.ok) return validation;
      const { skill, targets } = validation;
      if(scope==='single'&&['physical','tactic'].includes(skill.kind))u.lastSingleSkill=skillId;
      const beforeSp = this.availableSp(u);
      if (u.side === 'ally') this.allySp -= skill.cost; else u.sp -= skill.cost;
      u.stats.actions++; this.actionCount++;
      if (skill.kind === 'tactic' || skill.kind === 'heal') u.stats.tactics++;
      const event = { actor: id, actorName: u.name, side: u.side, skill: skillId, skillName: skill.name, scope, cost: skill.cost, spBefore: beforeSp, spAfter: this.availableSp(u), attackerSoldiers: u.soldiers, results: [] };
      for (const target of targets) {
        const before = target.soldiers;
        if (skill.kind === 'buff') {
          const definition=skill.buff || {},status={...copy(definition),id:definition.id || skill.id,name:definition.name || skill.name,source:u.id,expiresAt:this.time+Math.max(.02,Number(definition.duration)||5)};
          target.statuses=target.statuses.filter(s=>s.id!==status.id);target.statuses.push(status);
          event.results.push({target:target.id,targetName:target.name,before,after:before,actual:0,buff:true,status:copy(status),healing:false,raw:0,amount:0,factors:[],formula:'附加状态'});continue;
        }
        let miss = null, critical = false, multiplier = 1, random = 1, calc;
        if (skill.kind === 'physical') {
          if (target.dodge && this.rng() < target.dodge) { miss = '闪避'; target.stats.dodges++; }
          else if (this.config.hit && this.rng() >= (u.side === 'ally' ? 244 : 235) / 256) miss = '未命中';
          if (!miss) {
            critical = !!u.guaranteedCritical || (this.config.critical && this.rng() < criticalChance(u, this.config));
            if (critical) { u.criticalChain++; multiplier = [1.2, 1.4, 1.6, 2, 3][Math.min(4, u.criticalChain - 1)]; }
            else u.criticalChain = 0;
            const values = this.config.physicalRandom === 'list' ? [.8, .92, 1, 1.12, 1.2] : [.8, .9, 1, 1.1, 1.2];
            random = this.config.random ? weighted(this.rng, values, [1, 4, 6, 4, 1]) : 1;
            const attackBonus=u.statuses.reduce((n,s)=>n*(Number(s.attackMultiplier)||1),1),armorBonus=target.statuses.reduce((n,s)=>n*(Number(s.armorMultiplier)||1),1);
            calc = physical({ attacker: {...u,attack:u.attack*attackBonus}, target:{...target,armor:target.armor*armorBonus}, level: u.side === 'ally' ? u.level : target.level, random, critical: multiplier, mitigationScale:this.config.mitigationScale });
          } else { calc = { raw: 0, amount: 0, factors: [], formula: miss }; }
        } else {
          random = this.config.random ? weighted(this.rng, [.6, .8, 1, 1.2, 1.4], [1, 3, 8, 2, 2]) : 1;
          const resistanceBonus=target.statuses.reduce((n,s)=>n*(Number(s.resistanceMultiplier)||1),1);
          calc = tactic({skill,intelligence:u.intelligence,random,count:targets.length,scope,target:{...target,resistance:target.resistance*resistanceBonus},mitigationScale:this.config.mitigationScale});
        }
        const healing = skill.kind === 'heal';
        const actual = Math.min(calc.amount, healing ? target.maxSoldiers - before : before);
        target.soldiers = healing ? before + actual : before - actual;
        if (healing) u.stats.healing += actual;
        else { u.stats.damage += actual; target.stats.received += actual; }
        const defeated = !healing && before > 0 && target.soldiers === 0;
        if (defeated) { u.stats.kills++; target.progress = 0; target.ready = false; target.queued = null; target.statuses=[]; }
        event.results.push({ target: target.id, targetName: target.name, before, after: target.soldiers, actual, healing, miss, critical, multiplier, random, defeated, ...calc });
      }
      if (skill.element === 'fire') this.fireCount++;
      u.progress = 0; u.ready = false; u.readyTick=null; u.interval = interval(u, this.config, this.config.skillDelays?.[skillId]);
      event.skillDelay = Number(this.config.skillDelays?.[skillId]) || 0;
      event.nextInterval = u.interval;
      this.emit('action', event); this.checkEnd();
      return { ok: true };
    }
    checkEnd() {
      const allies = this.living('ally').length, enemies = this.living('enemy').length;
      if (allies > 0 && enemies > 0) return;
      this.status = allies > 0 ? 'victory' : enemies > 0 ? 'defeat' : 'draw';
      this.emit('end', { result: this.status, text: this.status === 'victory' ? '敌军溃退，我方取胜。' : this.status === 'defeat' ? '我方溃退，此役失利。' : '两军俱溃。' });
    }
    retreat() { if (!this.scenario.allowRetreat || this.status !== 'running') return false; this.status = 'retreated'; this.emit('end',{result:'retreated',text:'我方撤退。'}); return true; }
    export() { return { version: 2, scenario: copy(this.scenario), skills:copy(this.skills), config: copy(this.config), result: this.status, time: this.time, units: copy(this.units), events: copy(this.events) }; }
  }
  const api = { Battle, attr, maxSoldiers, ratio, interval, physical, tactic, mitigation, normalizeRule, criticalChance, seededRandom, seedNumber };
  root.BattleEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
