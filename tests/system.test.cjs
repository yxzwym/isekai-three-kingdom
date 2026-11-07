const test=require('node:test');
const assert=require('node:assert/strict');
const {Battle}=require('../js/engine.js');
const {layout,fitImage,CanvasBattle}=require('../js/canvas-battle.js');
const D=require('../js/data.js');
const unit=(id,changes={})=>({...D.ALLIES[0],id,name:id,skills:[],priorities:[],...changes});
const scenario=(changes={})=>({id:'custom',title:'独立测试战斗',allies:[unit('hero')],enemies:[unit('foe')],rules:{level:10,enemyLevel:10,random:false,hit:false},scene:{color:'#345'},...changes});

test('通用引擎只生成传入阵容，不注入赤壁武将，不修改调用数据',()=>{
  const input=scenario();const before=JSON.stringify(input),b=new Battle(input);
  assert.deepEqual(b.units.map(u=>u.id),['hero','foe']);assert.equal(JSON.stringify(input),before);
  assert.equal(b.export().scenario.title,'独立测试战斗');assert.equal(b.export().scenario.scene.color,'#345');
  assert.ok(b.events.every(e=>!e.text?.includes('赤壁')));
  assert.throws(()=>new Battle({}),/阵容/);assert.throws(()=>new Battle(scenario({enemies:[unit('hero')]})),/唯一/);
});
test('两场不同阵容、等级、技能和场地的战斗相互独立',()=>{
  const a=new Battle(D.createChibi());const b=new Battle(scenario({allies:Array.from({length:7},(_,i)=>unit('hero'+i,{level:i+1})),skills:{flame:{id:'flame',name:'自定义火计',kind:'tactic',element:'fire',base:50,cost:0,side:'enemy'}},scene:{allowedElements:['stone']}}));
  assert.equal(a.units.length,10);assert.equal(b.units.length,8);assert.equal(b.units[6].level,7);assert.equal(a.unit('hero0'),undefined);
  b.unit('hero0').skills=['flame'];assert.equal(b.validate(b.unit('hero0'),'flame','foe').ok,false);
  b.scenario.scene.allowedElements.push('fire');b.start();const u=b.unit('hero0');u.ready=true;u.progress=1;
  assert.equal(b.act(u.id,'flame','foe').ok,true);assert.ok(b.events.some(e=>e.skillName==='自定义火计'));
});
test('撤退由场景配置控制，默认隐藏且禁止，允许时产生结束事件',()=>{
  const a=new Battle(scenario());a.start();assert.equal(a.retreat(),false);assert.equal(a.status,'running');
  const b=new Battle(scenario({allowRetreat:true}));b.start();assert.equal(b.retreat(),true);assert.equal(b.status,'retreated');assert.equal(b.events.at(-1).type,'end');const t=b.time;b.advance(5);assert.equal(b.time,t);
});
test('Canvas 布局在小屏和七人剧情阵容下不越界、不相互重叠',()=>{
  for(const [w,h]of[[320,568],[375,667],[390,844],[844,390]])for(const count of[1,5,7,12]){
    const rects=layout(w,h,count,5);assert.equal(rects.length,count+5);
    for(const r of rects){assert.ok(r.x>=0&&r.y>=0);assert.ok(r.x+r.w<=w+.01&&r.y+r.h<=h);}
    const enemies=rects.filter(r=>r.side==='enemy'),allies=rects.filter(r=>r.side==='ally');
    assert.ok(Math.max(...enemies.map(r=>r.y+r.h))<Math.min(...allies.map(r=>r.y)));
  }
});
test('头像以原比例等比缩放，宽屏、窄屏均不拉伸',()=>{
  for(const box of[{x:0,y:0,w:65,h:130},{x:10,y:20,w:130,h:70}]){const fit=fitImage(256,440,box);assert.ok(Math.abs(fit.w/fit.h-256/440)<1e-10);assert.ok(fit.w<=box.w&&fit.h<=box.h);}
});
test('己方一到四人都占相同四分之一槽宽，阵容水平居中',()=>{
  for(const [w,h]of[[320,568],[390,844],[640,900]]){const full=layout(w,h,4,1).filter(r=>r.side==='ally');for(let n=1;n<=4;n++){const cards=layout(w,h,n,1).filter(r=>r.side==='ally');assert.ok(cards.every(r=>r.w===full[0].w));assert.ok(Math.abs((cards[0].x+cards.at(-1).x+cards.at(-1).w)/2-w/2)<.01);}}
});
test('四至六名敌人默认前后分排，五人为后二前三，超员继续换行且不截掉',()=>{
  for(const [w,h]of[[320,568],[375,667],[640,900],[844,390]]){
    const enemies=layout(w,h,5,5).filter(r=>r.side==='enemy');assert.equal(enemies.length,5);
    assert.equal(new Set(enemies.map(r=>r.y)).size,2);assert.equal(enemies.filter(r=>r.row===0).length,2);assert.equal(enemies.filter(r=>r.row===1).length,3);assert.deepEqual(enemies.map(r=>r.index),[0,1,2,3,4]);
    for(const count of[1,3,5,9,12]){
      const cards=layout(w,h,5,count).filter(r=>r.side==='enemy');assert.equal(cards.length,count);
      for(const [i,r]of cards.entries()){
        assert.ok(r.x>=0&&r.y>=0&&r.w>0&&r.h>0);assert.ok(r.x+r.w<=w+.001);assert.ok(r.y+r.h<=h+.001);
        for(const previous of cards.slice(0,i).filter(previous=>previous.row===r.row))assert.ok(r.x>=previous.x+previous.w-.001||previous.x>=r.x+r.w-.001||r.y>=previous.y+previous.h-.001||previous.y>=r.y+r.h-.001);
      }
    }
  }
});
test('两三名敌人按实际人数左右展开，多人分排后模型仍有足够空间',()=>{
  for(const [w,h]of [[320,568],[375,667],[390,844],[640,800]]){
    const five=layout(w,h,4,5).filter(r=>r.side==='enemy');
    for(const count of [2,3]){
      const cards=layout(w,h,4,count).filter(r=>r.side==='enemy');
      assert.equal(cards.length,count);assert.equal(new Set(cards.map(r=>r.y)).size,1);
      assert.ok(cards.every(r=>r.w>=(w-18)/3));
      assert.ok(Math.abs((cards[0].x+cards.at(-1).x+cards.at(-1).w)/2-w/2)<.01);
      for(let i=1;i<cards.length;i++)assert.ok(cards[i].x>cards[i-1].x+cards[i-1].w);
      if(count===2){
        assert.ok(cards[0].x+cards[0].w<w/2&&cards[1].x>w/2);
        const large=fitImage(1024,1536,{x:cards[0].x,y:cards[0].y,w:cards[0].w,h:cards[0].h-50});
        const small=fitImage(1024,1536,{x:five[0].x,y:five[0].y,w:five[0].w,h:five[0].h-50});
        assert.ok(large.h>=small.h);
      }
    }
  }
});
test('默认分排保留阵容顺序，旧字段或战斗拖动不改变位置和战斗结算',()=>{
  for(const input of[D.createChibi(),D.createEffectsPreview()]){
    input.scene.enemyRows=[['caocao'],['yujin','zhangliao'],['xuhuang','caoren']];
    const source=JSON.stringify(input),b=new Battle(input);b.start();b.advance(2);
    const view={battle:b,scenario:input,w:375,h:667,point:e=>e,updateLayout:CanvasBattle.prototype.updateLayout};
    view.updateLayout();const before=b.export(),expected=input.enemies.map(u=>u.id);
    assert.deepEqual(view.rects.filter(r=>r.side==='enemy').map(r=>r.id),expected);
    const fixed=view.rects.map(r=>({id:r.id,x:r.x,y:r.y})),r=view.rectMap.get('caocao');view.press={x:r.x+10,y:r.y+10,hit:{...r,kind:'unit',unitId:'caocao'}};
    CanvasBattle.prototype.move.call(view,{x:r.x+55,y:r.y+30});assert.deepEqual(view.rects.map(r=>({id:r.id,x:r.x,y:r.y})),fixed);
    view.w=320;view.h=568;view.updateLayout();const enemies=view.rects.filter(r=>r.side==='enemy');assert.equal(new Set(enemies.map(r=>r.y)).size,2);assert.deepEqual(enemies.map(r=>r.id),expected);
    assert.deepEqual(b.export(),before);assert.equal(JSON.stringify(input),source);
  }
});
test('单敌和后排双条在模型上方，前排姓名双条贴在脚下',()=>{
  for(const count of [1,5]){
  const input=D.createEffectsPreview(),b=new Battle(input),boxes=[],texts=[];
  b.units=b.units.filter(u=>u.side==='ally'||u.id==='caocao'||count===5);
  const view={battle:b,scenario:input,w:375,h:667,visuals:new Map(),health:new Map(),hits:[],formationEditing:true,
    ctx:{save(){},restore(){},fillRect(){},createLinearGradient(){return{addColorStop(){}};}},
    box(x,y,w,h,fill){boxes.push({x,y,w,h,fill});},text(text,x,y){texts.push({text,y});}};
  CanvasBattle.prototype.updateLayout.call(view);const r=view.rectMap.get('caocao');CanvasBattle.prototype.drawUnit.call(view,r.unit,r,0);
  const hp=boxes.find(box=>box.fill==='#10171d'),progress=boxes.find(box=>box.fill==='#07141c');
  assert.ok(texts.find(t=>t.text==='曹操').y<hp.y);assert.ok(hp.y+hp.h<=progress.y);
  if(count===1||r.hudAbove)assert.ok(progress.y+progress.h<=r.figure.y+.001);
  else {assert.ok(texts.find(t=>t.text==='曹操').y>=r.figure.y+r.figure.h);assert.equal(hp.y-r.figure.y-r.figure.h,20);}
  assert.equal(view.hits.length,2);assert.ok(view.hits.every(hit=>hit.unitId==='caocao'&&hit.kind==='unit'));
  }
});
test('敌方有全身图时只读取完整立绘，己方继续使用头像，保持原图比例及头脚完整',()=>{
  const head={src:'head.png',crop:{x:10,y:20,width:256,height:440},status:'legacy'},body={src:'body.png',width:1024,height:1536,status:'ready'};
  const requests=[],sprites=[],rects=[{id:'ally',side:'ally',unit:{portrait:head,fullbody:body},figure:{x:0,y:0,w:70,h:140}},{id:'enemy',side:'enemy',unit:{portrait:head,fullbody:body},figure:{x:100,y:80,w:120,h:180}}];
  const view={rects,dpr:2,visuals:new Map(),image(src){requests.push(src);return {naturalWidth:1024,naturalHeight:1536};},sprite(img,source,width,red,fade){sprites.push({source,fade});return {};}};
  for(const r of rects)r.unit.id=r.id;CanvasBattle.prototype.preparePortraits.call(view);
  assert.deepEqual(requests,['head.png','body.png']);assert.deepEqual(sprites[2].source,{x:0,y:0,width:1024,height:1536});assert.equal(sprites[2].fade,false);
  const dst=view.visuals.get('enemy').dst;assert.equal(dst.w/dst.h,1024/1536);assert.equal(dst.y,80);assert.equal(dst.h,180);
});

test('手动技能只在满条时执行；单体选目标，群体直接命中全部',()=>{
  const b=new Battle(D.createEffectsPreview());b.start();const u=b.units[0];
  assert.equal(b.manual(u.id,'fx_fire','caocao').ok,false);assert.equal(u.queued,null);
  b.advance(4.5);assert.ok(u.ready);const enemy=b.unit('caocao').soldiers;
  assert.equal(b.manual(u.id,'fx_fire','caocao').ok,true);assert.ok(b.unit('caocao').soldiers<enemy);assert.equal(b.events.at(-1).results.length,1);
  b.advance(4.5);assert.equal(b.manual(u.id,'fx_fire_all').ok,true);assert.equal(b.events.at(-1).results.length,5);
  assert.equal(u.ready,false);assert.equal(u.mode,'manual');
});
test('单奶、群奶、自身Buff、友军Buff、敌军状态直接作用且到期消失',()=>{
  const b=new Battle(D.createEffectsPreview());b.start();b.advance(4.5);
  const healer=b.unit('lusu'),before=b.unit('ganning').soldiers;
  assert.equal(b.manual(healer.id,'fx_heal','ganning').ok,true);assert.ok(b.unit('ganning').soldiers>before);
  assert.equal(b.manual('zhugeliang','fx_heal_all').ok,true);assert.equal(b.events.at(-1).results.length,5);
  assert.equal(b.manual('huanggai','fx_taunt').ok,true);assert.ok(b.unit('huanggai').statuses.some(s=>s.taunt));
  assert.equal(b.manual('ganning','fx_boost','zhouyu').ok,true);assert.equal(b.unit('zhouyu').statuses[0].attackMultiplier,1.2);
  b.advance(6);assert.equal(b.manual('zhugeliang','fx_weaken','caocao').ok,true);assert.equal(b.unit('caocao').statuses[0].armorMultiplier,.8);
  b.advance(11);assert.equal(b.unit('caocao').statuses.length,0);assert.equal(b.unit('huanggai').statuses.length,0);
});
test('恢复自动会正常出手，其他角色不因手动待命停止行动',()=>{
  const b=new Battle(D.createEffectsPreview());b.start();b.advance(4.5);const count=b.actionCount;
  b.advance(6);assert.ok(b.actionCount>count);assert.equal(b.unit('zhouyu').stats.actions,0);
  b.setMode('zhouyu','auto');b.advance(.02);assert.ok(b.unit('zhouyu').stats.actions>0);
});

test('同一技能的单体或群体范围在自动和手动时一致',()=>{
  const b=new Battle(D.createChibi());
  b.setPriorities('zhouyu',[{skill:'huoshen',when:'always',threshold:0,scope:'single'}]);
  assert.equal(b.autoCommand(b.unit('zhouyu')).scope,'all');
  b.setPriorities('huanggai',[{skill:'dare',when:'always',threshold:0,scope:'all'}]);
  assert.equal(b.autoCommand(b.unit('huanggai')).scope,'single');
});
