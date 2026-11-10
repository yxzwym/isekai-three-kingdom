(function(root){
  'use strict';
  const R=root.PengpaiRules;
  const Viewport=typeof module!=='undefined'&&module.exports?require('./canvas-viewport.js'):root.CanvasViewport;
  const UI=root.PengpaiUI,FONT=UI.font;
  const SERIF=UI.serif;
  const GOLD='#dfc18b',INK='#0b1920',MUTED='#a7b2ad',WHITE='#f1ece1';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  class CanvasMenu{
    constructor(canvas,options={}){
      this.canvas=canvas;this.canvas.dataset.menuScreen='main';this.ctx=canvas.getContext('2d');this.options=options;this.assets=options.assets||root.PengpaiAssets;this.input=options.nameInput;
      this.store=options.store;this.settings=this.store.settings();root.GameAudio?.setScene('menu');this.screen='main';this.modal=null;this.draft={difficulty:'normal',appearance:R.APPEARANCES[1].id,name:'',roll:null};this.images=new Map();this.hits=[];this.focus=-1;this.raf=0;this.disposed=false;this.hover=null;this.reduceMotion=!!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      this.resize=this.resize.bind(this);this.down=this.down.bind(this);this.move=this.move.bind(this);this.up=this.up.bind(this);this.key=this.key.bind(this);this.cancel=()=>{this.press=null;this.hover=null;this.invalidate();};this.visible=()=>{if(!document.hidden){this.mainSlots=null;this.invalidate();}};document.addEventListener('visibilitychange',this.visible);
      root.GameAssetLoader?.track?.(this,{onReady:()=>{this.background=null;}});
      for(const [name,handler]of[['pointerdown',this.down],['pointermove',this.move],['pointerup',this.up],['pointercancel',this.cancel],['pointerleave',this.cancel],['keydown',this.key]])canvas.addEventListener(name,handler);
      this.onInput=()=>{if(!this.composing){const next=R.sanitizeName(this.input.value);this.input.value=next;this.draft.name=next;this.invalidate();}};
      this.startComposition=()=>{this.composing=true;};this.endComposition=()=>{this.composing=false;this.onInput();};
      this.input?.addEventListener('input',this.onInput);this.input?.addEventListener('compositionstart',this.startComposition);this.input?.addEventListener('compositionend',this.endComposition);
      this.inputKey=e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();this.confirmCreation();}};this.input?.addEventListener('keydown',this.inputKey);
      this.observer=new ResizeObserver(this.resize);this.observer.observe(canvas);this.image(this.assets.background);this.resize();
    }
    image(src){if(!src)return null;if(root.GameAssetLoader)return root.GameAssetLoader.get(src,this)||null;if(!this.images.has(src)){const img=new Image();img.onload=()=>{this.background=null;this.invalidate();};img.onerror=()=>this.invalidate();img.src=root.BattleEmbeddedAssets?.[src]||src;this.images.set(src,img);}const img=this.images.get(src);return img.complete&&img.naturalWidth?img:null;}
    resize(){Object.assign(this,Viewport.resize(this.canvas,this.ctx));this.background=null;this.invalidate();}
    invalidate(){if(this.disposed||this.raf)return;this.raf=requestAnimationFrame(now=>{this.raf=0;this.draw(now);if(this.toast?.until>now||this.screen==='main'&&!this.modal&&!this.reduceMotion&&!document.hidden)this.invalidate();});}
    text(value,x,y,size=14,color=WHITE,align='center',serif=false){size=UI.textSize(size);const c=this.ctx;c.font=`${size*this.settings.menuScale}px ${serif?SERIF:FONT}`;c.textBaseline='middle';c.textAlign=align;c.fillStyle=color;c.fillText(String(value),x,y);}
    wrap(value,x,y,width,size=13,color=MUTED,line=23){size=UI.textSize(size);const c=this.ctx;c.font=`${size*this.settings.menuScale}px ${FONT}`;let text='';for(const ch of Array.from(value)){if(c.measureText(text+ch).width>width&&text){if(/[，。！？、；：）》」』】]/u.test(ch)){const chars=Array.from(text),last=chars.pop();this.text(chars.join(''),x,y,size,color,'left');text=last+ch;}else{this.text(text,x,y,size,color,'left');text=ch;}y+=line;}else text+=ch;}if(text)this.text(text,x,y,size,color,'left');return y+line;}
    box(x,y,w,h,fill='#171e20f5',stroke='#746d58',radius=3){UI.surface(this.ctx,x,y,w,h,fill,stroke,radius);}
    button(label,x,y,w,h,action,options={}){UI.button(this,label,x,y,w,h,action,options);}
    backdrop(){
      const c=this.ctx,w=this.w,h=this.h;if(!this.background){const cache=document.createElement('canvas');cache.width=Math.ceil(w*this.dpr);cache.height=Math.ceil(h*this.dpr);const ctx=cache.getContext('2d');ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.fillStyle='#132029';ctx.fillRect(0,0,w,h);const img=this.image(this.assets.background);if(img){const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight);ctx.drawImage(img,(w-img.naturalWidth*scale)/2,(h-img.naturalHeight*scale)/2,img.naturalWidth*scale,img.naturalHeight*scale);}const shade=ctx.createLinearGradient(0,0,0,h);shade.addColorStop(0,'#06151b45');shade.addColorStop(.5,'#06151b20');shade.addColorStop(1,'#06151bde');ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);this.background=cache;}c.drawImage(this.background,0,0,w,h);if(this.screen!=='main'){c.fillStyle='#07151bdc';c.fillRect(0,0,w,h);}
    }
    heading(title,subtitle){this.text(title,this.w/2,35,20,WHITE,'center',true);if(subtitle)this.text(subtitle,this.w/2,64,12,MUTED);}
    footer(back,next,disabled=false){const y=this.h-53,w=this.w;if(next){this.button('上一步',20,y,88,36,back,{plain:true});this.button(next,120,y,w-140,36,()=>this.next(),{active:true,disabled});}else this.button('返回主菜单',24,y,w-48,36,()=>this.go('main'),{plain:true});}
    go(screen){if(screen==='create'||screen==='load')root.GameAssetLoader?.warmGroups?.(['creation']).catch(()=>{});else if(screen==='appearance')root.GameAssetLoader?.warmGroups?.(['road','interface']).catch(()=>{});this.hits=[];this.press=null;this.screen=screen;this.mainSlots=null;this.canvas.dataset.menuScreen=screen;this.modal=null;this.toast=null;this.focus=-1;if(screen!=='appearance'){if(this.input){this.input.hidden=true;this.input.blur();}this.canvas.focus({preventScroll:true});}this.resize();}
    startNew(){this.draft={difficulty:'normal',appearance:R.APPEARANCES[1].id,name:'',roll:R.rollHero('normal')};this.go('create');}
    next(){if(this.modal)return;if(this.screen==='create'&&this.draft.roll)this.go('appearance');else if(this.screen==='appearance')this.confirmCreation();}
    confirmCreation(){if(this.screen!=='appearance'||this.modal||!this.draft.roll)return;this.draft.name=R.heroName(this.input?.value??this.draft.name);this.input?.blur();this.canvas.focus({preventScroll:true});this.modal={type:'save'};this.focus=-1;this.invalidate();}
    roll(){if(this.screen!=='create'||!this.draft.difficulty||this.modal)return;this.draft.roll=R.rollHero(this.draft.difficulty);this.invalidate();}
    chooseDifficulty(id){if(this.draft.difficulty!==id){this.draft.difficulty=id;this.modal=null;this.roll();}else this.modal=null;this.focus=-1;this.invalidate();}
    art(id){return this.assets.protagonists[id];}
    figure(id,rect,alpha=1){const art=this.art(id),img=this.image(art?.src);if(!img)return;const scale=Math.min(rect.w/img.naturalWidth,rect.h/img.naturalHeight),w=img.naturalWidth*scale,h=img.naturalHeight*scale;this.ctx.save();this.ctx.globalAlpha=alpha;this.ctx.drawImage(img,rect.x+(rect.w-w)/2,rect.y+rect.h-h,w,h);this.ctx.restore();}
    portrait(id,rect){const art=this.art(id),record=art?.portrait,img=this.image(record?.src||art?.src);if(!img)return;const crop=record?.src?(record.crop||{x:0,y:0,width:img.naturalWidth,height:img.naturalHeight}):(record||{x:img.naturalWidth*.23,y:0,width:img.naturalWidth*.54,height:img.naturalHeight*.38});this.ctx.save();this.ctx.beginPath();this.ctx.roundRect(rect.x,rect.y,rect.w,rect.h,3);this.ctx.clip();const scale=Math.max(rect.w/crop.width,rect.h/crop.height),w=crop.width*scale,h=crop.height*scale;this.ctx.drawImage(img,crop.x,crop.y,crop.width,crop.height,rect.x+(rect.w-w)/2,rect.y+(rect.h-h)/2,w,h);this.ctx.restore();}
    drawMain(now=performance.now()){
      const c=this.ctx,w=this.w,h=this.h,x=34,inner=w-68;root.MenuScene.draw(this,now);
      c.save();c.fillStyle='#a84936';c.fillRect(x,38,3,22);this.text('一枕异梦 · 重逢三国',x+15,49,14,'#b8ae98','left',true);
      this.text('异界',x,h*.19,Math.min(76,w*.18),'#eee3ca','left',true);this.text('三国',x+3,h*.19+78,Math.min(76,w*.18),'#eee3ca','left',true);
      c.strokeStyle='#a14935';c.lineWidth=1.5;c.strokeRect(x+165,h*.19+53,29,38);this.text('志',x+180,h*.19+72,20,'#d28b64','center',true);
      c.strokeStyle='#a8946655';c.beginPath();c.moveTo(x,h*.40);c.lineTo(x+38,h*.40);c.stroke();this.text('天下故人，待你相逢。',x,h*.40+24,14,'#aaa38e','left',true);c.restore();
      const slots=this.mainSlots||(this.mainSlots=this.store.slots()),latest=slots.map((save,index)=>({save,index})).filter(s=>s.save).sort((a,b)=>Date.parse(b.save.savedAt)-Date.parse(a.save.savedAt))[0],y=h*.57;
      const entry=(label,xx,yy,ww,hh,action,primary=false)=>{const hover=this.hover?.label===label,pressed=this.press?.hit?.label===label,focus=this.focus>=0&&this.hits[this.focus]?.label===label,active=hover||pressed||focus;
        c.save();if(primary){c.fillStyle=pressed?'#6c3027':active?'#994b35':'#813c2d';c.fillRect(xx,yy,ww,hh);c.strokeStyle='#c49665';c.strokeRect(xx+3,yy+3,ww-6,hh-6);c.fillStyle='#bc704e';c.fillRect(xx,yy,3,hh);}else{c.fillStyle=active?'#c2aa7518':'#17202260';c.fillRect(xx,yy,ww,hh);c.strokeStyle=active?'#ac9567':'#b19b6b45';c.beginPath();c.moveTo(xx,yy+hh);c.lineTo(xx+ww,yy+hh);c.stroke();}
        UI.buttonTrim(this,xx,yy,ww,hh,{active:primary,pressed});this.text(label,xx+(primary?23:12)+(pressed?2:0),yy+hh/2,primary?20:16,primary?'#f3e4c6':active?'#eddab3':'#bcb4a1','left',true);this.text(primary?'启':'›',xx+ww-22,yy+hh/2,primary?20:24,primary?'#ead1a1':'#8c8268','center',true);c.restore();this.hits.push({x:xx,y:yy,w:ww,h:hh,label,action:()=>{root.GameAudio?.play('ui');action();}});};
      entry(latest?'继续旅程':'新游戏',x,y,inner,58,()=>{if(!latest)this.startNew();else if(this.options.onLoad)this.options.onLoad(latest.save,latest.index);else{this.character=latest.save.character;this.go('record');}},true);
      if(latest){entry('新游戏',x,y+72,(inner-20)/2,43,()=>this.startNew());entry('载入游戏',x+(inner+20)/2,y+72,(inner-20)/2,43,()=>this.go('load'));}else entry('载入游戏',x,y+72,inner,43,()=>this.go('load'));
      entry('战斗模拟',x,y+126,inner,43,()=>this.options.onSimulation?.());
      const foot=h-49;entry('设置',x,foot-16,70,32,()=>{this.modal={type:'settings'};});entry('关于',x+92,foot-16,70,32,()=>{this.modal={type:'about'};});this.text('卷 壹 · 乱世初逢',w-34,foot,14,'#786f5c','right',true);
    }
    difficultyStars(count,right,y){const c=this.ctx,size=14,gap=5,color=['','#6ecb8d','#77b7ed','#e5c16d','#ec9a66','#ef716d'][count];c.save();c.fillStyle=color;for(let i=0;i<count;i++){const x=right-size/2-(count-1-i)*(size+gap);c.beginPath();for(let point=0;point<10;point++){const angle=-Math.PI/2+point*Math.PI/5,r=point%2?size*.22:size*.5,px=x+Math.cos(angle)*r,py=y+Math.sin(angle)*r;if(point)c.lineTo(px,py);else c.moveTo(px,py);}c.closePath();c.fill();}c.restore();}
    creationLayout(){
      const tight=this.h<620,gap=tight?8:this.h<740?10:12,footerY=this.h-53,attributeTop=tight?106:114,available=footerY-12-attributeTop-44-gap*2,attributeRowH=clamp(Math.floor(available*.44/6),24,44),passiveTitleY=attributeTop+attributeRowH*6+22,passiveTop=passiveTitleY+20,cardH=Math.min(76,(footerY-12-passiveTop-gap*2)/3);
      return {tight,gap,cardH,footerY,passiveTop,passiveTitleY,attributeTop,attributeRowH};
    }
    drawAttributeSummary(character,top=114,rowH=31){
      const c=this.ctx,x=16,w=this.w-32,columns=[.22,.22,.22,.34],edges=[x];for(const fraction of columns)edges.push(edges.at(-1)+w*fraction);const height=rowH*(R.ATTRIBUTES.length+1);
      this.box(x,top,w,height,'#10252ddf','#536b70',4);c.fillStyle='#29414aaa';c.fillRect(x+1,top+1,w-2,rowH-1);c.strokeStyle='#4b656b99';c.lineWidth=1;c.beginPath();
      for(const xx of edges.slice(1,-1)){c.moveTo(xx,top);c.lineTo(xx,top+height);}for(let row=1;row<=R.ATTRIBUTES.length;row++){const yy=top+row*rowH;c.moveTo(x,yy);c.lineTo(x+w,yy);}c.stroke();
      ['属性','当前','潜力','每级加成'].forEach((label,i)=>this.text(label,(edges[i]+edges[i+1])/2,top+rowH/2,14,MUTED));
      R.ATTRIBUTES.forEach(([key,label],i)=>{const cy=top+rowH*(i+1.5),potential=character.potentials[key];this.text(label,(edges[0]+edges[1])/2,cy,14,WHITE);this.text(character.attributes[key],(edges[1]+edges[2])/2,cy,16,WHITE);this.text(potential,(edges[2]+edges[3])/2,cy,14,GOLD);this.text('+'+Number(root.CharacterGrowth.growthPerLevel(potential).toFixed(2)),(edges[3]+edges[4])/2,cy,14,GOLD);});
    }
    drawCreationPassives(character,layout){
      R.sortPassives(character.passives).forEach((id,i)=>{const p=R.PASSIVE_MAP[id],q=R.QUALITIES[p.quality],x=16,y=layout.passiveTop+i*(layout.cardH+layout.gap),cardW=this.w-32,contentW=cardW-32,lineH=20;
        this.box(x,y,cardW,layout.cardH,'#102128e6',q.color,4);this.ctx.fillStyle=q.color;this.ctx.fillRect(x+1,y+12,2,layout.cardH-24);this.ctx.font=`${14*this.settings.menuScale}px ${FONT}`;
        const tokens=p.description.match(/\d+(?:\.\d+)?%?|./gu)||[],lines=[];let line='';for(const token of tokens){if(line&&this.ctx.measureText(line+token).width>contentW){lines.push(line);line=token;}else line+=token;}if(line)lines.push(line);
        const maxLines=Math.max(1,Math.floor((layout.cardH-22)/lineH)),visible=lines.slice(0,maxLines);if(lines.length>maxLines){let last='';for(const token of lines.slice(maxLines-1).join('').match(/\d+(?:\.\d+)?%?|./gu)||[]){if(this.ctx.measureText(last+token+'…').width>contentW)break;last+=token;}visible[maxLines-1]=last+'…';}
        const contentH=22+visible.length*lineH,startY=y+(layout.cardH-contentH)/2;this.text(p.name,x+16,startY+8,16,q.color,'left',true);visible.forEach((text,row)=>this.text(text,x+16,startY+32+row*lineH,14,MUTED,'left'));this.hits.push({x,y,w:cardW,h:layout.cardH,label:p.name,action:()=>{this.modal={type:'passive',id};this.input?.blur();}});
      });
    }
    drawCreate(){
      const w=this.w,layout=this.creationLayout(),difficulty=R.getDifficulty(this.draft.difficulty);
      this.heading('创建人物');this.button('‹',16,18,32,34,()=>this.go('main'),{plain:true});
      const difficultyY=layout.tight?58:60,difficultyH=layout.tight?36:42;this.box(16,difficultyY,w-32,difficultyH,'#13242be6','#8b826c',3);this.text(difficulty.name,28,difficultyY+(layout.tight?10:12),14,WHITE,'left',true);this.text('难度',28,difficultyY+difficultyH-10,14,MUTED,'left');this.difficultyStars(difficulty.stars,70+difficulty.stars*19,difficultyY+difficultyH-10);this.ctx.strokeStyle=GOLD;this.ctx.lineWidth=1.5;this.ctx.beginPath();this.ctx.moveTo(w-36,difficultyY+difficultyH/2-3);this.ctx.lineTo(w-31,difficultyY+difficultyH/2+2);this.ctx.lineTo(w-26,difficultyY+difficultyH/2-3);this.ctx.stroke();
      this.hits.push({x:16,y:difficultyY,w:w-32,h:difficultyH,label:'选择难度 '+difficulty.name,action:()=>{this.modal={type:'difficulty'};}});
      if(difficulty.id==='hell')this.text('敌人全面加强',w-48,difficultyY+difficultyH/2,14,'#f28b78','right');this.drawAttributeSummary(this.draft.roll,layout.attributeTop,layout.attributeRowH);this.text('特质',16,layout.passiveTitleY,14,MUTED,'left');this.drawCreationPassives(this.draft.roll,layout);
      this.button('重掷',16,layout.footerY,96,36,()=>this.roll(),{plain:true});this.button('下一步',124,layout.footerY,w-140,36,()=>this.next(),{active:true});
    }
    drawAppearance(){
      const w=this.w,h=this.h,footerY=h-53,thumbGap=6,thumbW=Math.min(48,(w-32-thumbGap*(R.APPEARANCES.length-1))/R.APPEARANCES.length),thumbH=52,thumbY=footerY-76,stripW=thumbW*R.APPEARANCES.length+thumbGap*(R.APPEARANCES.length-1),artTop=112,artH=thumbY-artTop-12;
      this.heading('创建人物');this.button('‹',16,18,32,34,()=>this.go('create'),{plain:true});this.text('姓名',16,79,14,WHITE,'left');this.nameRect={x:62,y:60,w:w-78,h:38};
      this.figure(this.draft.appearance,{x:60,y:artTop,w:w-120,h:artH});const index=R.APPEARANCES.findIndex(look=>look.id===this.draft.appearance),choose=step=>{this.draft.appearance=R.APPEARANCES[(index+step+R.APPEARANCES.length)%R.APPEARANCES.length].id;};
      this.button('‹',16,artTop+artH/2-22,40,44,()=>choose(-1),{plain:true});this.button('›',w-56,artTop+artH/2-22,40,44,()=>choose(1),{plain:true});
      R.APPEARANCES.forEach((look,i)=>{const x=(w-stripW)/2+i*(thumbW+thumbGap),active=look.id===this.draft.appearance;this.box(x,thumbY,thumbW,thumbH,active?'#6b4a28dc':'#102128dc',active?GOLD:'#53645b',3);this.portrait(look.id,{x:x+2,y:thumbY+2,w:thumbW-4,h:thumbH-4});if(active){this.ctx.strokeStyle=GOLD;this.ctx.lineWidth=2;this.ctx.strokeRect(x,thumbY,thumbW,thumbH);}this.hits.push({x,y:thumbY,w:thumbW,h:thumbH,label:'选择造型'+(i+1),action:()=>{this.draft.appearance=look.id;}});});
      this.button('上一步',16,footerY,96,36,()=>this.go('create'),{plain:true});this.button('确认人物',124,footerY,w-140,36,()=>this.confirmCreation(),{active:true});
    }
    fitText(value,width,size=12){this.ctx.font=`${UI.textSize(size)*this.settings.menuScale}px ${FONT}`;let text=String(value);if(this.ctx.measureText(text).width<=width)return text;while(text&&this.ctx.measureText(text+'…').width>width)text=Array.from(text).slice(0,-1).join('');return text+'…';}
    passiveCard(id,x,y,w,h){const p=R.PASSIVE_MAP[id],q=p?R.QUALITIES[p.quality]:null;this.box(x,y,w,h,'#102128e6',q?.color||'#4d5c55',4);if(p){this.ctx.fillStyle=q.color;this.ctx.fillRect(x+1,y+9,2,h-18);this.text(p.name,x+14,y+19,16,q.color,'left',true);this.text(p.description,x+14,y+h-14,Math.min(12,(w-30)/(Math.max(1,p.description.length)*this.settings.menuScale)),MUTED,'left');this.hits.push({x,y,w,h,label:p.name,action:()=>{this.modal={type:'passive',id};}});}else{this.text('天赋未定',x+14,y+19,15,MUTED,'left',true);this.text('重掷时同时获得3个被动',x+14,y+h-17,11,'#728078','left');}}
    drawRecord(){const character=this.character,difficulty=R.getDifficulty(character.difficulty),layout=this.creationLayout();this.heading(character.name,`${difficulty.name} · 等级${character.level}`);this.drawAttributeSummary(character,layout.attributeTop,layout.attributeRowH);this.text('特质',16,layout.passiveTitleY,14,MUTED,'left');this.drawCreationPassives(character,layout);this.footer();}
    drawLoad(){
      const slots=this.store.slots(),w=this.w,h=this.h,start=102,cardH=Math.min(152,(h-191)/3),x=24,inner=w-48;this.heading('载入游戏','续一卷未尽的旅程');
      slots.forEach((slot,i)=>{const y=start+i*(cardH+12);this.box(x,y,inner,cardH,slot?'#202723e8':'#141c1cc0',slot?'#887b5e':'#454b41',2);
        if(slot){const imageW=Math.min(88,cardH-20);this.portrait(slot.character.appearance,{x:x+10,y:y+10,w:imageW,h:cardH-20});const textX=x+imageW+24;this.text(slot.character.name,textX,y+29,20,'#e3d3ae','left',true);const place=slot.chapter==='world-map'?(root.WorldData?.placeMap[slot.progress?.world?.nodeId]?.name||'大地图'):'序章';this.text(place+' · '+slot.character.level+'级',textX,y+59,14,'#b4baa7','left');this.text(new Date(slot.savedAt).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}),textX,y+cardH-23,14,'#7f8c80','left');this.text('›',x+inner-21,y+cardH/2,24,'#c4b080','center',true);this.hits.push({x,y,w:inner,h:cardH,label:'存档'+(i+1)+' '+slot.character.name,action:()=>{if(this.options.onLoad)this.options.onLoad(slot,i);else{this.character=slot.character;this.go('record');}}});}
        else{this.text('○',x+31,y+cardH/2,24,'#6e725e','center',true);this.text('空白存卷',x+58,y+cardH/2,16,'#858b79','left',true);this.text('0'+(i+1),x+inner-23,y+cardH/2,14,'#626b5d','right');}
      });this.footer();
    }
    modalFrame(title,height){const w=Math.min(420,this.w-28),h=Math.min(this.h-28,height),x=(this.w-w)/2,y=(this.h-h)/2;this.ctx.fillStyle='#020d16bb';this.ctx.fillRect(0,0,this.w,this.h);this.box(x,y,w,h,'#0c1c24fa','#8e836c',6);this.hits=[];this.text(title,x+18,y+27,20,GOLD,'left',true);this.button('×',x+w-45,y+10,31,31,()=>{this.modal=null;},{plain:true});return{x,y,w,h};}
    drawModal(){const modal=this.modal;
      if(modal.type==='difficulty'){const f=this.modalFrame('选择难度',350),row=(f.h-76)/R.DIFFICULTIES.length;R.DIFFICULTIES.forEach((id,i)=>{const x=f.x+16,y=f.y+57+i*row,w=f.w-32,active=id.id===this.draft.difficulty;this.box(x,y,w,row-4,active?'#513b26db':'#102128df',active?GOLD:'#46534f');this.text(id.name,x+12,y+(row-4)*.31,16,active?GOLD:WHITE,'left',true);this.text('难度',x+12,y+(row-4)*.75,10,MUTED,'left');this.difficultyStars(id.stars,x+50+id.stars*19,y+(row-4)*.75);this.hits.push({x,y,w,h:row-4,label:`${id.name} 难度${id.stars}星`,action:()=>this.chooseDifficulty(id.id)});});return;}
if(modal.type==='about'){const f=this.modalFrame('关于异界三国',284);let y=f.y+70;y=this.wrap('一场意外把你带进了三国。熟悉的人物都在，发生的事却和史书不同。走访各地，结识同伴，一起想办法结束这场乱世。',f.x+22,y,f.w-44,14,WHITE,26);y=this.wrap('人物与存档保存在当前浏览器。',f.x+22,y+18,f.w-44,12,MUTED,22);this.wrap('美术素材由 AI 生成。',f.x+22,y+8,f.w-44,12,MUTED,22);return;}
      if(modal.type==='passive'){const p=R.PASSIVE_MAP[modal.id],q=R.QUALITIES[p.quality],f=this.modalFrame(p.name,218);this.text(UI.passiveLabel(p),f.x+22,f.y+69,13,q.color,'left');this.wrap(p.description,f.x+22,f.y+107,f.w-44,15,WHITE,27);return;}
      if(modal.type==='settings'){const f=this.modalFrame('设置',root.GameSettingsPanel.HEIGHT);root.GameSettingsPanel.draw(this,f,this.settings,patch=>{try{this.settings=this.store.setSettings(patch);}catch{this.notify('设置未能保存');}this.invalidate();});return;}
      if(modal.type==='save'){const f=this.modalFrame('选择存档位',340),slots=this.store.slots();slots.forEach((slot,i)=>{const y=f.y+62+i*79;this.box(f.x+17,y,f.w-34,65,'#14252a',slot?'#927954':'#586c60');this.text(slot?`存档${i+1} · ${slot.character.name}`:`存档${i+1} · 空`,f.x+34,y+21,16,slot?GOLD:WHITE,'left');this.text(slot?'选择后确认覆盖':'保存这段新旅程',f.x+34,y+45,11,MUTED,'left');this.hits.push({x:f.x+17,y,w:f.w-34,h:65,label:`存档${i+1}`,action:()=>{if(slot)this.modal={type:'overwrite',index:i,name:slot.character.name};else this.saveCharacter(i);}});});return;}
      if(modal.type==='overwrite'){const f=this.modalFrame('覆盖存档',230);this.wrap(`将覆盖「${modal.name}」的存档。`,f.x+22,f.y+82,f.w-44,14,WHITE,25);this.button('返回',f.x+20,f.y+f.h-61,91,36,()=>{this.modal={type:'save'};},{plain:true});this.button('确认覆盖',f.x+123,f.y+f.h-61,f.w-143,36,()=>this.saveCharacter(modal.index),{active:true});}
    }
    saveSettings(){try{this.store.setSettings(this.settings);}catch{this.notify('设置未能保存');}this.invalidate();}
    saveCharacter(index){const character={name:this.draft.name,difficulty:this.draft.difficulty,appearance:this.draft.appearance,...this.draft.roll};try{this.store.save(index,character);this.character=character;this.go('record');this.notify('人物已创建，存档已保存');this.options.onCharacterCreated?.(character,index);}catch{this.notify('存档未能写入，请检查浏览器存储权限');}}
    syncInput(){if(!this.input)return;const show=this.screen==='appearance'&&!this.modal;this.input.hidden=!show;if(!show){if(document.activeElement===this.input)this.input.blur();return;}const n=this.nameRect,r=Viewport.clientRect(this.canvas.getBoundingClientRect(),n);Object.assign(this.input.style,{left:`${r.left}px`,top:`${r.top}px`,width:`${n.w}px`,height:`${n.h}px`,transformOrigin:'top left',transform:`scale(${r.scaleX},${r.scaleY})`});if(!this.composing&&this.input.value!==this.draft.name)this.input.value=this.draft.name;}
    draw(now=performance.now()){
      if(this.disposed)return;const c=this.ctx;c.clearRect(0,0,this.w,this.h);this.hits=[];if(this.screen!=='main')this.backdrop();
      if(this.screen==='main')this.drawMain(now);else if(this.screen==='create')this.drawCreate();else if(this.screen==='appearance')this.drawAppearance();else if(this.screen==='record')this.drawRecord();else if(this.screen==='load')this.drawLoad();
      if(this.modal)this.drawModal();
      if(this.focus>=0&&this.hits.length){this.focus%=this.hits.length;const hit=this.hits[this.focus];c.strokeStyle=GOLD;c.lineWidth=2;c.strokeRect(hit.x-2,hit.y-2,hit.w+4,hit.h+4);}
      this.syncInput();this.drawNotice(now);let label=({main:'异界三国 主菜单：'+this.hits.map(h=>h.label).join('、'),create:'创建人物 · 难度与潜力',appearance:'创建人物 · 姓名与造型',record:'人物档案',load:'载入游戏'})[this.screen]||'异界三国';
      if(this.modal)label+=' '+({settings:'设置',about:'关于',difficulty:'选择难度',save:'选择存档位',overwrite:'覆盖存档',passive:'被动详情'}[this.modal.type]||'');
      if(['create','record'].includes(this.screen)){const character=this.screen==='record'?this.character:{...this.draft,...this.draft.roll},difficulty=R.getDifficulty(character.difficulty);label+=` ${R.heroName(character.name)} ${difficulty.name} 难度${difficulty.stars}星 形象${R.APPEARANCES.findIndex(look=>look.id===character.appearance)+1} ${R.ATTRIBUTES.map(([key,name])=>name+character.attributes[key]+' 潜力'+character.potentials[key]).join(' ')} ${character.passives.map(id=>R.PASSIVE_MAP[id].name+' '+R.QUALITIES[R.PASSIVE_MAP[id].quality].name).join(' ')}`;}
      if(this.screen==='appearance')label+=` ${R.heroName(this.draft.name)} 造型${R.APPEARANCES.findIndex(look=>look.id===this.draft.appearance)+1} 上一步 确认人物`;
      this.canvas.setAttribute('aria-label',label);
    }
    drawNotice(now){
      const active=this.toast?.until>now,layer=this.noticeCanvas;if(!active){if(layer){layer.hidden=true;layer.setAttribute('aria-label','');}return;}
      if(!this.noticeCanvas){this.noticeCanvas=document.createElement('canvas');this.noticeCanvas.className='menu-notice-layer';this.noticeCanvas.setAttribute('role','status');this.noticeCanvas.setAttribute('aria-live','polite');this.noticeCanvas.setAttribute('aria-atomic','true');this.noticeCtx=this.noticeCanvas.getContext('2d');document.body.append(this.noticeCanvas);}
      const canvas=this.noticeCanvas,c=this.noticeCtx,r=this.canvas.getBoundingClientRect(),dpr=this.dpr;canvas.hidden=false;
      Object.assign(canvas.style,{left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,height:`${r.height}px`});
      if(canvas.width!==this.canvas.width||canvas.height!==this.canvas.height){canvas.width=this.canvas.width;canvas.height=this.canvas.height;}
      c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,this.w,this.h);c.font=`${16*this.settings.menuScale}px ${FONT}`;
      const maxWidth=Math.min(380,this.w-40),lines=[];let line='';for(const ch of this.toast.text){if(line&&c.measureText(line+ch).width>maxWidth-40){lines.push(line);line=ch;}else line+=ch;}if(line)lines.push(line);
      const width=Math.min(maxWidth,Math.max(164,...lines.map(value=>c.measureText(value).width+48))),height=lines.length*24+28,viewport=window.visualViewport;
      const scaleY=r.height/this.h,top=Math.max(0,((viewport?.offsetTop||0)-r.top)/scaleY),bottom=Math.min(this.h,((viewport?.offsetTop||0)+(viewport?.height||window.innerHeight)-r.top)/scaleY),x=(this.w-width)/2,y=(top+Math.max(top,bottom)-height)/2;
      c.save();c.globalAlpha=clamp((this.toast.until-now)/180,0,1);c.shadowColor='#000b';c.shadowBlur=20;c.shadowOffsetY=5;c.beginPath();c.roundRect(x,y,width,height,6);c.fillStyle='#10242cfa';c.fill();c.shadowBlur=0;c.shadowOffsetY=0;c.strokeStyle='#cbb381';c.lineWidth=1;c.stroke();c.fillStyle=WHITE;c.textAlign='center';c.textBaseline='middle';lines.forEach((value,i)=>c.fillText(value,this.w/2,y+26+i*24));c.restore();
      if(canvas.getAttribute('aria-label')!==this.toast.text)canvas.setAttribute('aria-label',this.toast.text);
    }
    notify(text){this.toast={text,until:performance.now()+2200};this.invalidate();}
    point(e){return Viewport.point(this.canvas.getBoundingClientRect(),e);}
    down(e){if(e.button!==0)return;const p=this.point(e);this.press={...p,pointer:e.pointerId,hit:[...this.hits].reverse().find(hit=>p.x>=hit.x&&p.x<=hit.x+hit.w&&p.y>=hit.y&&p.y<=hit.y+hit.h)};this.canvas.setPointerCapture?.(e.pointerId);this.invalidate();}
    move(e){const p=this.point(e);if(this.screen==='main'){this.hover=[...this.hits].reverse().find(hit=>p.x>=hit.x&&p.x<=hit.x+hit.w&&p.y>=hit.y&&p.y<=hit.y+hit.h);this.invalidate();}if(this.press&&Math.abs(p.x-this.press.x)+Math.abs(p.y-this.press.y)>9)this.press.moved=true;}
    up(){const p=this.press;this.press=null;if(p&&!p.moved&&p.hit){p.hit.action();this.focus=-1;this.invalidate();}}
    key(e){if(e.code==='Space'&&this.screen==='create'&&!this.modal&&e.target===this.canvas){e.preventDefault();this.roll();return;}if(e.key==='Escape'){if(this.modal)this.modal=null;else if(this.screen==='appearance')this.go('create');else if(['create','load','record'].includes(this.screen))this.go('main');this.invalidate();}if(e.key==='Tab'){e.preventDefault();if(this.hits.length)this.focus=(this.focus+(e.shiftKey?-1:1)+this.hits.length)%this.hits.length;this.invalidate();}if(e.key==='Enter'&&this.focus>=0&&this.hits[this.focus]){e.preventDefault();this.hits[this.focus].action();this.invalidate();}}
    destroy(){this.disposed=true;document.removeEventListener('visibilitychange',this.visible);this.noticeCanvas?.remove();delete this.canvas.dataset.menuScreen;cancelAnimationFrame(this.raf);this.observer.disconnect();for(const [name,handler]of[['pointerdown',this.down],['pointermove',this.move],['pointerup',this.up],['pointercancel',this.cancel],['pointerleave',this.cancel],['keydown',this.key]])this.canvas.removeEventListener(name,handler);this.input?.removeEventListener('input',this.onInput);this.input?.removeEventListener('compositionstart',this.startComposition);this.input?.removeEventListener('compositionend',this.endComposition);this.input?.removeEventListener('keydown',this.inputKey);if(this.input)this.input.hidden=true;}
  }
  const api={CanvasMenu,mount:(canvas,options)=>new CanvasMenu(canvas,options)};root.PengpaiMenu=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
