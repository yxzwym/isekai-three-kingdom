const test=require('node:test'),assert=require('node:assert/strict'),{Battle}=require('../js/engine.js'),W=require('../js/weapon-skills.js');
const unit=(id,extra={})=>({id,name:id,war:100,intelligence:50,constitution:100000,speed:200,technique:200,attack:20,armor:0,resistance:0,skills:[],priorities:[],initialMode:'manual',...extra});
function make(ids=['hook-1','hook-3']){return new Battle({allies:[unit('a',{skills:ids,initialMode:'auto',priorities:ids.map(skill=>({skill,when:'always',frequency:'sometimes'}))})],enemies:[unit('e')],rules:{hit:false,critical:false}});}
function cast(b){const u=b.unit('a');u.ready=true;u.progress=1;const c=b.autoCommand(u);assert.ok(c);assert.ok(b.act(u.id,c.skill,c.target,c.scope).ok);return c.skill;}

test('夜莺两项偶尔减益连续交替，重复查询和失败行动不推进顺序，月日阶均适用',()=>{
 for(const suffix of ['', '-day'])for(const roll of [0,.99]){const ids=['hook-1'+suffix,'hook-3'+suffix],b=make(ids);b.rng=()=>roll;b.start();const first=cast(b),other=ids.find(id=>id!==first);assert.equal(b.autoCommand(b.unit('a')).skill,other);assert.equal(b.autoCommand(b.unit('a')).skill,other);assert.equal(b.act('a',other,'e').ok,false);assert.equal(b.autoCommand(b.unit('a')).skill,other);assert.deepEqual(Array.from({length:5},()=>cast(b)),[other,first,other,first,other]);}
});
test('夜莺真实自动战斗可维持流血瘟疫重叠，状态仍按原命中和附加概率结算',()=>{
 const b=make();b.rng=()=>0;b.start();b.advance(30);const actions=b.events.filter(e=>e.type==='action'&&e.actor==='a'&&!e.periodic);assert.ok(actions.length>5);assert.ok(actions.every((e,i)=>i===0||e.skill!==actions[i-1].skill));assert.deepEqual(b.unit('e').statuses.map(s=>s.id).sort(),['bleed','plague']);assert.ok(b.unit('e').statuses.every(s=>s.expiresAt>b.time));
 const miss=make();miss.config.hit=true;miss.rng=()=>.999;miss.start();cast(miss);cast(miss);assert.equal(miss.unit('e').statuses.length,0);assert.ok(miss.events.filter(e=>e.type==='action'&&!e.periodic).every(e=>e.results[0].miss));
});
test('关闭一个技能或设为始终时不轮换，普通攻击插入不丢失夜莺减益顺序',()=>{
 const b=make(['hook-1','hook-2','hook-3']),u=b.unit('a');b.rng=()=>0;b.start();assert.equal(cast(b),'hook-1');b.rng=()=>.5;assert.equal(cast(b),'hook-2');b.rng=()=>0;assert.equal(cast(b),'hook-3');
 b.setPriorities(u.id,[{skill:'hook-1',when:'always',frequency:'sometimes'},{skill:'hook-3',when:'always',disabled:true}]);assert.equal(cast(b),'hook-1');assert.equal(cast(b),'hook-1');
 b.setPriorities(u.id,[{skill:'hook-1',when:'always'},{skill:'hook-3',when:'always',frequency:'sometimes'}]);assert.equal(cast(b),'hook-1');assert.equal(cast(b),'hook-1');
});
test('夜魇及其他职业继续随机选技能，手动夜莺可以连续释放同一项减益，轮换记忆不跨战斗',()=>{
 for(const ids of [['dagger-bleed','dagger-poison'],['staff-fire','hook-1']]){const b=make(ids);b.rng=()=>0;b.start();assert.equal(cast(b),ids[0]);assert.equal(cast(b),ids[0]);b.rng=()=>.99;assert.equal(cast(b),ids[1]);assert.equal(cast(b),ids[1]);}
 const b=make(),u=b.unit('a');b.rng=()=>0;b.start();cast(b);b.setMode(u.id,'manual');for(let i=0;i<3;i++){u.ready=true;assert.ok(b.manual(u.id,'hook-1','e').ok);}assert.equal(b.events.filter(e=>e.type==='action').at(-1).skill,'hook-1');const next=new Battle({...make().scenario,allies:[{...u,initialMode:'auto'}],enemies:[unit('e')]});next.rng=()=>0;next.start();assert.equal(cast(next),'hook-1');
});
