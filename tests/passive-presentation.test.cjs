require('../js/canvas-effects.js');
const test=require('node:test'),assert=require('node:assert/strict'),UI=require('../js/ui-theme.js'),R=require('../js/game-rules.js'),P=require('../js/passives.js'),G=require('../js/character-growth.js'),{Battle}=require('../js/engine.js'),{CanvasBattle,layout}=require('../js/canvas-battle.js'),{World}=require('../js/world.js');
test('被动按钮固定四分之一宽并居中，普通品质分别着色，专属使用独立紫色',()=>{
 const passives=['zhangliang-might','zhangliang-hardy','benevolent-healer','zhaoyun-courage'].map(id=>P.definitions[id]),texts=[],boxes=[],v={hits:[],box(...args){boxes.push(args);},text(...args){texts.push(args);}};let selected;
 UI.passiveButtons(v,passives,20,100,320,p=>selected=p);assert.equal(new Set(v.hits.map(h=>h.w)).size,1);assert.equal(v.hits[0].w,74);assert.deepEqual(texts.map(t=>t[4]),[R.QUALITIES.green.color,R.QUALITIES.white.color,R.QUALITIES.gold.color,UI.EXCLUSIVE_COLOR]);assert.notEqual(UI.EXCLUSIVE_COLOR,R.QUALITIES.red.color);assert.ok(!texts.some(t=>t[0].includes('伤害提高')));v.hits[3].action();assert.equal(selected.id,'zhaoyun-courage');
 v.hits=[];UI.passiveButtons(v,passives.slice(0,2),20,100,320,()=>{});assert.equal((v.hits[0].x+v.hits[1].x+v.hits[1].w)/2,180);
});
test('敌人属性只显示被动按钮，点击才打开详情，关闭恢复原面板和滚动位置',()=>{
 const battle=new Battle({allies:[{...G.create('hero',1),id:'hero'}],enemies:[{...G.create('yellowMilitia',3),id:'foe',skills:['punch'],passives:['zhangliang-might','zhangliang-hardy']}]}),texts=[],v=Object.assign(Object.create(CanvasBattle.prototype),{battle,w:390,h:844,hits:[],panel:{type:'inspect',id:'foe',scroll:0},ctx:{measureText:value=>({width:String(value).length*14}),save(){},restore(){},beginPath(){},rect(){},clip(){}},panelFrame(){return{x:20,y:30,w:350,h:620};},box(){},text(value){texts.push(String(value));},drawSkillIcon(){}});
 v.drawInspect();const previous=v.panel;assert.ok(!texts.includes(P.definitions['zhangliang-might'].description));v.hits.find(h=>h.label==='勇健有力').action();assert.equal(v.panel.type,'passiveInfo');v.drawPassiveInfo();assert.ok(texts.some(t=>t.includes('物理伤害提高5%')));v.closePanel();assert.equal(v.panel,previous);assert.equal(v.panel.scroll,0);
});
test('五名黄巾训练采用后两名前三名，后排头顶双条，其他默认多人战同样分排',()=>{
 const hero={name:'行客',...R.rollHero('normal',()=>.5)},world=new World(hero,{nodeId:'camp',inside:true,weaponType:'sword',introStep:2});assert.ok(world.beginTraining('militia-five').ok);const scenario=world.battleScenario();
 for(const [w,h]of [[320,568],[390,844],[640,900]]){const rects=layout(w,h,scenario.allies.length,scenario.enemies.length,scenario.scene.enemyFormation),foes=rects.filter(r=>r.side==='enemy');assert.equal(foes.filter(r=>r.hudAbove).length,2);assert.equal(foes.filter(r=>!r.hudAbove).length,3);assert.equal(new Set(foes.map(r=>r.w)).size,1);for(const n of [4,5,6,7,9])assert.ok(new Set(layout(w,h,1,n).filter(r=>r.side==='enemy').map(r=>r.row)).size>=2);}
});
