const test=require('node:test'),assert=require('node:assert/strict');
const UI=require('../js/ui-theme.js'),{World}=require('../js/world.js'),{CanvasWorld}=require('../js/canvas-world.js'),R=require('../js/game-rules.js'),D=require('../js/world-data.js'),P=require('../js/prologue.js'),Courts=require('../js/courts.js'),H=require('../js/hero-quests.js'),RC=require('../js/recruitment-content.js'),Panels=require('../js/world-panels.js'),E=require('../js/engine.js'),Cast=require('../js/chapter-cast.js'),W=require('../js/weapon-skills.js');
require('../js/trophy-panels.js');
const make=state=>new World({name:'行舟',appearance:'armored',...R.rollHero('normal',()=>.5)},{introStep:2,weaponType:'sword',...state});
function view(model){const texts=[],v=Object.assign(Object.create(CanvasWorld.prototype),{model,character:model.character,w:540,h:960,hits:[],ctx:new Proxy({measureText:t=>({width:String(t).length*14}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})}),text(t){texts.push(String(t));},box(){},frame(title,height){this.hits=[];return{x:40,y:30,w:460,h:Math.min(850,height)};},button(label,x,y,w,h,action,o={}){if(!o.disabled)this.hits.push({label,x,y,w,h,action});},image(){return null;},portrait(){},save(){},invalidate(){},rememberDialogue(){},travel(target){this.travelled=target;}});return{v,texts};}

test('对话标题追加表字，场景及角色姓名不被改写，开局直接显示赵云',()=>{
 const w=make({nodeId:'changshan',inside:true}),{v,texts}=view(w),npc={...D.questNpcs.zhaoyun,art:null};v.dialogue={npc,index:0,lines:['我叫赵云，字子龙。']};v.drawDialogue();assert.ok(texts.includes('赵云 子龙'));assert.equal(npc.name,'赵云');assert.equal(D.questNpcs.zhaoyun.name,'赵云');assert.equal(w.zhaoYunUnit().name,'赵云');assert.ok(w.sceneNpcs().some(n=>n.id==='zhaoyun'&&n.name==='赵云'));assert.equal(UI.dialogueName('村民'),'村民');assert.equal(UI.dialogueName('诸葛亮'),'诸葛亮 孔明');
});

test('三府主事者在入梦阶段结识主角，现实初见承接约定，三府按钮各自前往对应都城',()=>{
 const dream=P.chapters.dream.lines;for(const court of Object.values(Courts.definitions)){const rows=dream.filter(l=>l.speaker===court.id);assert.ok(rows.length,court.id);assert.ok(rows.some(l=>l.text.includes(D.placeMap[court.place].name)),court.id);assert.ok(court.welcome.some(t=>/梦|仙长/.test(t)),court.id);}
 const w=make({quests:{changshan:{stage:'complete'}},trophyClaims:{changshan:true}}),{v}=view(w),icons=global.RpgIcons;global.RpgIcons={draw(){},resolveItem(){return 'trophy';}};try{v.panel={type:'taskDetail',questId:'visit-courts'};Panels.draw(v);const buttons=Object.values(Courts.definitions).map(d=>v.hits.find(h=>h.label===D.placeMap[d.place].name));assert.ok(buttons.every(Boolean));assert.equal(new Set(buttons.map(h=>h.y)).size,1);for(const [i,d]of Object.values(Courts.definitions).entries()){v.panel={type:'taskDetail',questId:'visit-courts'};buttons[i].action();assert.equal(v.travelled,d.place);assert.equal(v.panel,null);}}finally{global.RpgIcons=icons;}
});

test('招募战使用战前交谈敌人的姓名与模型，巨鹿两战不再变成官兵',()=>{
 let checked=0;for(const d of Object.values(H.definitions))for(const [phase,f]of Object.entries(d.battles||{})){if(!f.leaderName||!f.leaderArt)continue;const u=RC.enemies(d.id,phase)[0];assert.equal(u.name,f.leaderName,d.id+':'+phase);assert.equal(u.characterId,f.leaderArt,d.id+':'+phase);checked++;}assert.ok(checked>15);
 for(const phase of ['abuse','trace']){const f=H.definitions.zhangjiao.battles[phase],u=RC.enemies('zhangjiao',phase)[0];assert.equal(u.characterId,'brigand');assert.equal(u.name,f.leaderName);assert.doesNotMatch(u.name,/官兵/);}
});

test('工坊对话由黄月英回应开炮，不会借用盗匪的头像与姓名',()=>{
 const w=make({nodeId:'xiangyang',inside:true,heroQuests:{huangyueying:{stage:'workshop',accepted:true}}}),{v}=view(w);v.heroQuestDialogue({...H.npc('huangyueying',w.state.heroQuests.huangyueying),selectedQuest:true});const speakers=[];for(let i=0;i<4;i++){speakers.push(v.dialogue.npc.id);if(i<3)v.advanceDialogue();}assert.deepEqual(speakers,['yueying-raider','huangyueying','hero','huangyueying']);assert.match(v.dialogue.lines[0],/炮口/);
});

test('吕布物理必暴击并穿透护甲和物理减伤，计策仍受抗性且不会被强制暴击',()=>{
 const u=Cast.unit('lvbu',20),foe={id:'foe',name:'盾手',constitution:10000,war:10,intelligence:10,speed:10,technique:10,armor:9999,resistance:9999,physicalReduction:.99,skills:['punch']},b=new E.Battle({allies:[u],enemies:[foe],rules:{random:false,hit:false,critical:false}});b.start();b.setMode(u.id,'manual');const a=b.unit(u.id),t=b.unit('foe'),skill=b.skills[a.skills[0]],effective=b.effective(a);assert.equal(E.criticalChance(effective,b.config,skill),1);a.ready=true;a.progress=1;assert.ok(b.manual(a.id,skill.id,t.id).ok);const result=b.events.find(e=>e.type==='action').results[0];assert.ok(result.critical);assert.equal(result.damageType,'true');assert.equal(result.amount,E.calculate({attacker:effective,target:{...b.effective(t),armor:0,physicalReduction:0},skill,critical:1.5}).amount);
 b.skills.probe={id:'probe',name:'计策',kind:'tactic',scope:'single',side:'enemy',scaling:{intelligence:1},cost:0,cooldown:0};a.skills.push('probe');a.ready=true;a.progress=1;assert.ok(b.manual(a.id,'probe',t.id).ok);const magic=b.events.filter(e=>e.type==='action').at(-1).results[0];assert.equal(magic.critical,false);assert.equal(magic.damageType,'tactic');assert.ok(magic.amount<E.calculate({attacker:effective,target:{resistance:0},skill:b.skills.probe}).amount);for(const id of u.passives.filter(id=>!b.passives[id].exclusive))assert.equal(b.passives[id].quality,'gold');
 assert.deepEqual(Object.keys(W.specials),['fangtian-halberd']);assert.equal(W.forWeapon({id:'fire-god-staff',type:'staff',skills:['staff-shock','staff-storm']}).length,3);
});
