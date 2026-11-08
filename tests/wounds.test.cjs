const test=require('node:test'),assert=require('node:assert/strict'),E=require('../js/engine.js'),W=require('../js/weapon-skills.js');
const hit={id:'hit',name:'重击',kind:'physical',side:'enemy',scope:'single',scaling:{war:1},weaponCoefficient:0,cost:0,cooldown:2,hitChance:0};
const heal={id:'heal',name:'治疗',kind:'heal',side:'ally',scope:'single',scaling:{intelligence:1},weaponCoefficient:0,cost:0,cooldown:2};
const unit=(id,extra={})=>({id,name:id,war:50,intelligence:20,constitution:10,speed:50,technique:0,armor:0,resistance:0,skills:['hit','heal'],priorities:[],initialMode:'manual',...extra});
const make=(rules={})=>new E.Battle({allies:[unit('a'),unit('healer')],enemies:[unit('e',{war:150,constitution:100})],skills:{hit,heal},rules:{hit:false,critical:false,...rules}});
const cast=(b,who,id,target)=>{const u=b.unit(who);u.progress=1;u.ready=true;return b.act(who,id,target,b.skills[id].scope==='all'?'all':'single');};
test('直接致命攻击进入重伤，保留已有状态、暂停行动且不附加新控制；致命一击也不附加新持续伤害',()=>{
 const b=make(),a=b.unit('a'),e=b.unit('e');b.start();b.addStatus(a,a,{id:'taunt',taunt:true,duration:30});b.addStatus(e,a,{id:'armorDown',attribute:'armor',amount:-1,duration:8});b.skills.hit.effects=[{id:'stun',stun:true,duration:7},{id:'burn',amount:2,period:1,duration:8}];b.rng=()=>.9;cast(b,'e','hit','a');assert.equal(a.wounded,true);assert.equal(a.dead,false);assert.equal(a.soldiers,0);assert.equal(a.ready,false);assert.ok(a.statuses.some(s=>s.id==='taunt'));assert.ok(a.statuses.some(s=>s.id==='armorDown'));assert.ok(!a.statuses.some(s=>s.id==='stun'));assert.ok(!a.statuses.some(s=>s.id==='burn'));assert.equal(cast(b,'a','hit','e').ok,false);assert.ok(b.targetPool(e,b.skills.hit).includes(a));assert.equal(b.status,'running');
});
test('手动单奶与群奶可以救起重伤，死亡目标不可治疗；救起清空上招冷却并重新读条',()=>{
 for(const scope of ['single','all']){const b=make(),a=b.unit('a');b.start();a.lastSkillDelay=9;b.rng=()=>.9;cast(b,'e','hit','a');b.skills.heal.scope=scope;const result=cast(b,'healer','heal','a');assert.ok(result.ok);assert.equal(a.soldiers,20);assert.equal(a.wounded,false);assert.equal(a.lastSkillDelay,0);assert.equal(a.progress,0);assert.equal(a.interval,E.interval(a,b.config));b.advance(a.interval-.04);assert.equal(a.ready,false);b.advance(.06);assert.equal(a.ready,true);}
 const b=make();b.start();b.rng=()=>.9;cast(b,'e','hit','a');cast(b,'e','hit','a');assert.equal(b.unit('a').dead,true);assert.equal(b.validate(b.unit('healer'),'heal','a').ok,false);
});
test('自动治疗把重伤队友视为0%，1%规则也可救起，不误解为需要治疗超过1%才复苏',()=>{
 const b=make(),h=b.unit('healer');h.priorities=[{skill:'heal',when:'healThresholds',selfThreshold:0,allyThreshold:.01}];b.start();cast(b,'e','hit','a');const command=b.autoCommand(h);assert.equal(command.target,'a');assert.equal(command.skill,'heal');b.skills.heal.scaling={};b.skills.heal.flat=1;cast(b,'healer','heal','a');assert.equal(b.unit('a').soldiers,1);assert.equal(b.unit('a').wounded,false);
});
test('重伤后受击固定50%闪避，独立于命中、必中特性与角色闪避，不触发普通闪避反击',()=>{
 for(const [roll,dead]of [[.49,false],[.5,true]]){const b=make({hit:true}),a=b.unit('a');b.start();a.soldiers=0;a.wounded=true;a.dodge=1;a.passives=['thunder-lord'];b.skills.hit.alwaysHit=true;b.rng=()=>roll;cast(b,'e','hit','a');assert.equal(a.dead,dead);assert.equal(b.events.some(e=>e.reaction),false);assert.equal(a.wounded,!dead);}
});
test('持续伤害首次致命及重伤后每次跳伤均进行50%判定，持续恢复不能自动救起',()=>{
 for(const [roll,dead]of [[.49,false],[.5,true]]){const b=make(),a=b.unit('a');a.soldiers=1;b.start();b.rng=()=>roll;b.addStatus(b.unit('e'),a,{id:'bleed',amount:2,period:1,duration:5});b.advance(1);assert.equal(a.dead,dead);assert.equal(a.wounded,!dead);}
 const b=make(),a=b.unit('a');b.start();b.addStatus(a,a,{id:'regeneration',amount:20,healing:true,period:1,duration:5});cast(b,'e','hit','a');b.advance(1);assert.equal(a.soldiers,0);assert.equal(a.wounded,true);b.rng=()=>.9;a.statuses.push({id:'bleed',name:'流血',source:'e',amount:2,period:1,nextTick:b.time+1,expiresAt:b.time+5});b.advance(1);assert.equal(a.dead,true);
});
test('重伤时反击失效、敌人默认正常死亡、全队失去行动者战斗失败；可配置禁用重伤或夺魂',()=>{
 const b=make(),a=b.unit('a');b.start();b.addStatus(a,a,W.skills['shield-reflect'].buff,W.skills['shield-reflect']);cast(b,'e','hit','a');assert.equal(b.events.some(e=>e.skill==='status-reflect'),false);b.rng=()=>.9;cast(b,'e','hit','healer');assert.equal(b.status,'defeat');
 for(const mode of ['disabled','execute']){const b=make(mode==='disabled'?{wounds:false}:{});b.skills.hit.ignoreWounds=mode==='execute';b.start();cast(b,'e','hit','a');assert.equal(b.unit('a').dead,true);assert.equal(b.unit('a').wounded,false);}
});
test('一次群攻受到多个反伤时，第一段重伤后第二段仍判定绝对闪避或阵亡',()=>{
 const b=new E.Battle({allies:[unit('a',{startSoldiers:5}),unit('healer')],enemies:[unit('e1',{constitution:100}),unit('e2',{constitution:100})],skills:{hit:{...hit,scope:'all',alwaysHit:true},heal},rules:{hit:false,critical:false}});b.start();for(const e of b.living('enemy'))b.addStatus(e,e,{id:'reflectDamage',reflect:1});b.rng=()=>.9;cast(b,'a','hit');assert.equal(b.unit('a').dead,true);assert.equal(b.events.filter(e=>e.skill==='status-reflect').length,2);
});
test('群体增益只作用于可行动友军，不因队中存在重伤者而整体失效',()=>{
 const b=make();b.start();cast(b,'e','hit','a');b.skills.buff={id:'buff',name:'同心守护',kind:'buff',side:'ally',scope:'all',cost:0,cooldown:1,buff:{id:'armorUp',attribute:'armor',amount:5,duration:10}};b.unit('healer').skills.push('buff');assert.ok(cast(b,'healer','buff').ok);assert.ok(b.unit('healer').statuses.some(s=>s.id==='armorUp'));assert.ok(!b.unit('a').statuses.some(s=>s.id==='armorUp'));
});
test('赵云重伤被治疗跨过生命阈值，救起重置后仍按七进七出立即读满',()=>{
 const b=make(),a=b.unit('a');a.passives=['zhaoyun-seven-crossings'];b.start();cast(b,'e','hit','a');b.skills.heal.scaling={intelligence:3};cast(b,'healer','heal','a');assert.equal(a.soldiers,60);assert.equal(a.wounded,false);assert.equal(a.ready,true);assert.equal(a.progress,1);assert.ok(b.events.some(e=>e.type==='passive'&&e.passive==='zhaoyun-seven-crossings'));
});
