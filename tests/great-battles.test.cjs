const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../js/battle-simulator.js'),E=require('../js/engine.js'),{layout}=require('../js/canvas-battle.js'),R=require('../js/game-rules.js'),I=require('../js/items.js');
const memory=()=>({value:null,getItem(){return this.value;},setItem(k,v){this.value=v;}});
test('所有剧情与模拟人物均有同源头像和全身图，裁切范围不越过素材',()=>{const Cast=require('../js/chapter-cast.js'),A=require('../js/character-assets.js'),actors=require('../js/recruitment-content.js').actors;for(const id of new Set([...Object.keys(Cast.definitions),...Object.values(actors).map(a=>a.art).filter(id=>id!=='hero')])){const a=A.resolve(id),f=a.fullbody,p=a.portrait;assert.ok(f&&p,id);assert.equal(p.src,f.src,id);const q=p.crop;assert.ok(q.x>=0&&q.y>=0&&q.width>0&&q.height>0&&q.x+q.width<=f.width&&q.y+q.height<=f.height,id);}});
test('四场大战的所有敌人均为100级，普通兵按真实成长计算而不受剧情等级上限截断',()=>{
 const Wars=require('../js/great-battles.js'),Catalog=require('../js/enemy-catalog.js');
 for(const b of Wars.definitions){
  assert.equal(b.level,100,b.id);
  const enemies=Wars.roster(b);
  assert.equal(enemies.length,b.foes.length);
  assert.ok(enemies.every(u=>u.level===100),b.id);
  for(const [i,entry] of b.foes.entries())if(typeof entry==='object'){
   const p=Catalog.profiles[entry.role],values=p.base.map((n,j)=>Math.round(n+p.growth[j]*99)),u=enemies[i];
   assert.deepEqual([u.war,u.intelligence,u.constitution,u.speed,u.technique,u.armor,u.resistance,u.weapon.power],values,b.id+':'+entry.role);
  }
 }
 assert.equal(Catalog.unit('infantry',100).level,25,'剧情敌人仍保留原等级上限');
});
test('切换四场大战默认装载100级己方阵容，实际属性按对应等级成长',()=>{
 const G=require('../js/character-growth.js'),s=new S.Session();
 for(const id of ['guandu','chibi','hulao','hefei']){
  s.chooseBoss('war:'+id);
  for(const u of s.scenario().allies){
   assert.equal(u.level,100,id+':'+u.name);
   const raw=s.record(u.id).unit,attributes=G.attributesAt(raw.baseAttributes,raw.potentials,100);
   for(const key of ['war','intelligence','constitution','speed','technique'])assert.equal(raw[key],attributes[key],id+':'+u.name+':'+key);
  }
 }
});
test('旧20级大战配置迁移到100级，手工调级后重载保留自定义等级和配装',()=>{
 const store=memory(),s=new S.Session();
 s.chooseBoss('war:chibi');s.setLevel(20);
 const old=s.snapshot();delete old.warLevels;store.value=JSON.stringify(old);
 const migrated=new S.Session(store);
 assert.equal(migrated.bossId,'war:chibi');
 assert.deepEqual(migrated.selected,old.selected);
 for(const id of migrated.activeIds()){
  assert.equal(migrated.record(id).unit.level,100,id);
  assert.deepEqual(migrated.record(id).unit.weapon,old.records[id].weapon,id);
  assert.deepEqual(migrated.record(id).unit.equipment,old.records[id].equipment,id);
 }
 migrated.setLevel(91);
 const loaded=new S.Session(store);
 assert.equal(loaded.warLevels['war:chibi'],91);
 assert.ok(loaded.scenario().allies.every(u=>u.level===91));
 assert.ok(loaded.scenario().enemies.every(u=>u.level===100));
});
test('四场大战自动配齐队伍与兵器，各自阵容可修改并单独保存',()=>{const store=memory(),s=new S.Session(store),regular=[...s.selected];assert.equal(R.PARTY_LIMIT,4);for(const id of ['guandu','chibi','hulao','hefei']){s.chooseBoss('war:'+id);assert.deepEqual(s.selected,s.boss().preset);assert.equal(s.scenario().allies.length,s.boss().limit);assert.ok(s.world.members().every(u=>u.weapon?.power>0&&I.canEquip(u,u.weapon)));assert.ok(s.scenario().enemies.length>=5);new E.Battle(s.scenario());}s.chooseBoss('war:chibi');assert.equal(s.activeIds().length,10);assert.equal(s.toggle('huatuo'),false);s.toggle(s.selected.at(-1));assert.ok(s.toggle('huatuo'));const customized=[...s.selected];s.chooseBoss('chapter:dongzhuo');assert.deepEqual(s.selected,regular);s.chooseBoss('war:chibi');assert.deepEqual(s.selected,customized);const loaded=new S.Session(store);assert.deepEqual(loaded.selected,customized);assert.equal(loaded.scenario().allies.length,10);});
test('五人横排，六至十人最多五列两排，双方血条、人物和手动区不越界',()=>{for(const [w,h] of [[320,568],[405,720],[540,960],[844,390]])for(let n=1;n<=10;n++){const rects=layout(w,h,n,10,undefined,n),a=rects.filter(r=>r.side==='ally'),e=rects.filter(r=>r.side==='enemy');assert.equal(a.length,n);assert.ok(new Set(a.map(r=>r.y)).size<=(n<=5?1:2));assert.equal(new Set(e.map(r=>r.y)).size,2);for(const r of rects){assert.ok(r.x>=0&&r.y>=0&&r.w>0&&r.h>0);assert.ok(r.x+r.w<=w+.001&&r.y+r.h<=h+.001);}for(const row of new Set(a.map(r=>r.row))){const cells=a.filter(r=>r.row===row);assert.ok(cells.length<=5);assert.ok(Math.abs((cells[0].x+cells.at(-1).x+cells.at(-1).w)/2-w/2)<1e-6);}assert.ok(Math.max(...e.map(r=>r.y+r.h))<Math.min(...a.map(r=>r.y)));}});
test('大战双方实际出手并能正常结束，模拟不写入剧情经验钱物',()=>{for(const d of S.bosses.filter(b=>b.group==='war')){const s=new S.Session();s.chooseBoss(d.id);const before=s.world.snapshot(),b=new E.Battle(s.scenario('war-validation'));b.start();b.advance(295);assert.ok(['victory','defeat','draw'].includes(b.status),d.id);assert.ok(b.events.some(e=>e.type==='action'&&e.side==='enemy'));assert.ok(b.events.some(e=>e.type==='action'&&e.side==='ally'));assert.equal(s.world.state.money,before.money);assert.deepEqual(s.world.state.inventory,before.inventory);}});

test('命名敌将观察时可见抗晕特质，普通兵仍可控制',()=>{for(const b of S.bosses.filter(b=>b.group==='war')){const battle=new E.Battle({allies:[],enemies:b.roster()});for(const u of battle.units.filter(u=>u.unitType==='general')){assert.ok(u.statusImmunities.includes('stun'));assert.ok(u.passives.includes('enemy-stun-resistance'));}}});
