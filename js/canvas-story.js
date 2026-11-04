(function(root){
  'use strict';
  const P=root.PengpaiPrologue,UI=root.PengpaiUI,FONT=UI.font;
  class CanvasStory{
    constructor(canvas,options){
      this.canvas=canvas;this.ctx=canvas.getContext('2d');this.options=options;this.character=options.character;this.store=options.store;this.slot=options.slot;this.progress=P.checkpoint(options.progress);this.images=new Map();this.busts=new Map();this.hits=[];this.disposed=false;
      this.resize=this.resize.bind(this);this.up=e=>{if(this.view)return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*this.w/r.width,y=(e.clientY-r.top)*this.h/r.height;[...this.hits].reverse().find(a=>x>=a.x&&x<=a.x+a.w&&y>=a.y&&y<=a.y+a.h)?.action();};
      this.key=e=>{if(this.view||e.repeat)return;if([' ','Enter'].includes(e.key)){e.preventDefault();this.next();}if(e.key==='Escape')this.leave();};
      canvas.addEventListener('pointerup',this.up);canvas.addEventListener('keydown',this.key);this.observer=new ResizeObserver(this.resize);this.observer.observe(canvas);canvas.focus({preventScroll:true});this.enter(this.progress.stage,this.progress.index);
    }
    image(src){if(!src)return null;if(!this.images.has(src)){const i=new Image();i.onload=()=>{if(!this.disposed&&!this.view)this.draw();};i.src=root.BattleEmbeddedAssets?.[src]||src;this.images.set(src,i);}const i=this.images.get(src);return i.complete&&i.naturalWidth?i:null;}
    resize(){if(this.disposed||this.view)return;const r=this.canvas.getBoundingClientRect();this.w=r.width;this.h=r.height;this.dpr=Math.min(2,devicePixelRatio||1);this.canvas.width=Math.round(this.w*this.dpr);this.canvas.height=Math.round(this.h*this.dpr);this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);this.draw();}
    save(){try{this.store.save(this.slot,this.character,this.progress);this.saveError=false;}catch{this.saveError=true;}}
    enter(stage,index=0){
      clearTimeout(this.timer);this.view?.destroy();this.view=null;this.failure=false;this.progress=P.checkpoint({...this.progress,stage,index});this.save();this.canvas.dataset.storyStage=stage;
      if(['first-fight','manual-fight','prepare','squad-fight'].includes(stage)){
        const prepare=stage==='prepare',scenario=P.createBattle(stage,this.character,this.progress.preparation),settings=this.store.settings();
        const update=view=>{this.progress.preparation={...P.preparationOf(view.battle),_reviewed:!!view.prepared};this.save();};
        this.view=root.BattleSystem.mount(this.canvas,scenario,{...settings,autoStart:!prepare,hideResult:true,tutorialActor:'zhangjiao',
          onTacticsSave:(unit,view)=>update(view),onPrepareChange:update,
          onPrepared:view=>{update(view);this.progress.stage='squad-fight';this.save();this.canvas.dataset.storyStage='squad-fight';},
          onComplete:result=>{const expected=stage==='first-fight'?'defeat':'victory';this.timer=setTimeout(()=>{if(this.disposed)return;if(result.result!==expected){this.view?.destroy();this.view=null;this.failure=true;this.resize();return;}this.enter(stage==='first-fight'?'aftermath':stage==='manual-fight'?'reinforcements':'camp');},900);}
        });
        this.view.prepared=!!this.progress.preparation._reviewed;return;
      }
      this.resize();
    }
    text(value,x,y,size=16,color='#f1ece2',align='left'){size=UI.textSize(size);const c=this.ctx;c.font=`${size}px ${FONT}`;c.fillStyle=color;c.textBaseline='middle';c.textAlign=align;c.fillText(value,x,y);}
    box(x,y,w,h,fill='#0c1d26ed',stroke='#b6a17a'){const c=this.ctx;c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,5);c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
    button(label,x,y,w,h,action){this.box(x,y,w,h);this.text(label,x+w/2,y+h/2,15,'#e7d4b0','center');this.hits.push({x,y,w,h,action});}
    bust(id,side,top,active){
      if(!id)return;const art=P.assets(id,this.character.appearance).fullbody,img=this.image(art?.src);if(!img)return;
      if(!this.busts.has(art.src)){const cache=document.createElement('canvas');cache.width=724;cache.height=830;const c=cache.getContext('2d');c.drawImage(img,150,0,724,830,0,0,724,830);const fade=c.createLinearGradient(0,0,0,830);fade.addColorStop(0,'#000');fade.addColorStop(.65,'#000');fade.addColorStop(1,'#0000');c.globalCompositeOperation='destination-in';c.fillStyle=fade;c.fillRect(0,0,724,830);this.busts.set(art.src,cache);}
      const height=Math.min(330,this.h*.42),width=height*724/830,x=side==='left'?-width*.1:this.w-width*.9,c=this.ctx;c.save();c.globalAlpha=active?1:.55;c.drawImage(this.busts.get(art.src),x,top-height+70,width,height);c.restore();
    }
    wrap(value,x,y,width){const c=this.ctx,size=16,line=25;c.font=`${size}px ${FONT}`;let row='';for(const ch of Array.from(value)){if(c.measureText(row+ch).width>width&&row){this.text(row,x,y,size);row='';y+=line;}row+=ch;}if(row)this.text(row,x,y,size);return y;}
    backdrop(scene){const c=this.ctx,img=this.image(scene==='camp'?'./assets/story/yellow-camp.png':'./assets/story/village-road-v3.png');c.fillStyle='#172a2c';c.fillRect(0,0,this.w,this.h);if(img){const s=Math.max(this.w/img.naturalWidth,this.h/img.naturalHeight);c.drawImage(img,(this.w-img.naturalWidth*s)/2,(this.h-img.naturalHeight*s)/2,img.naturalWidth*s,img.naturalHeight*s);}const g=c.createLinearGradient(0,0,0,this.h);g.addColorStop(0,'#06131b66');g.addColorStop(.45,'#06131b00');g.addColorStop(1,'#06131baa');c.fillStyle=g;c.fillRect(0,0,this.w,this.h);}
    draw(){
      if(this.disposed||this.view||!this.w)return;const c=this.ctx,w=this.w,h=this.h,chapter=P.chapters[this.progress.stage],line=chapter?.lines[this.progress.index];this.hits=[];this.backdrop(chapter?.scene||'camp');
      if(this.failure){this.box(24,h/2-92,w-48,184);this.text('未能守住村口',w/2,h/2-46,20,'#f0dfbc','center');this.button('再试一次',48,h/2+12,w-96,42,()=>this.enter(this.progress.stage));return;}
      if(!line){this.canvas.setAttribute('aria-label','序章结束，未完待续。返回主菜单。');this.text('序章 · 黄天之下',w/2,h*.36,25,'#f4dfb3','center');this.text('未完待续',w/2,h*.36+46,16,'#dfd7c8','center');this.button('返回主菜单',w/2-100,h*.66,200,42,()=>this.leave());return;}
      this.text(chapter.title,w/2,33,20,'#f2e4cb','center');this.button('跳过',w-64,56,48,32,()=>this.skip());
      const panelH=208,top=h-panelH,partner=line.partner;
      if(line.speaker==='hero')this.bust('hero','right',top,true);else if(line.speaker!=='narrator')this.bust(partner,'left',top,true);
      const fade=c.createLinearGradient(0,top-24,0,top+panelH);fade.addColorStop(0,'#081b2600');fade.addColorStop(.25,'#081b26ed');fade.addColorStop(1,'#081b26ff');c.fillStyle=fade;c.fillRect(0,top-24,w,panelH+24);c.strokeStyle='#bcab8644';c.beginPath();c.moveTo(24,top+45);c.lineTo(w-24,top+45);c.stroke();
      const names={zhangjiao:'张角',zhangbao:'张宝',zhangliang:'张梁','imperial-soldier':'官兵',villager:'老人',narrator:'',hero:this.character.name};
      const right=line.speaker==='hero';this.text(names[line.speaker]||'',right?w-26:26,top+24,16,'#ead1a2',right?'right':'left');
      this.wrap(line.text.replaceAll('{name}',this.character.name),26,top+73,w-52);
      this.text('›',w-32,h-30,24,'#c7b386','center');this.hits.unshift({x:0,y:90,w,h:h-90,action:()=>this.next()});
      if(this.saveError)this.text('存档写入失败',w/2,65,12,'#edaa92','center');
      this.canvas.setAttribute('aria-label',`${chapter.title}。${names[line.speaker]||'旁白'}：${line.text.replaceAll('{name}',this.character.name)}。点击继续。`);
    }
    skip(){const chapter=P.chapters[this.progress.stage];if(chapter)this.enter(chapter.next);}
    next(){if(this.failure){this.enter(this.progress.stage);return;}const chapter=P.chapters[this.progress.stage];if(!chapter)return;if(this.progress.index+1<chapter.lines.length){this.progress.index++;this.save();this.draw();}else this.enter(chapter.next);}
    leave(){this.save();this.options.onExit?.();}
    destroy(){this.disposed=true;clearTimeout(this.timer);this.view?.destroy();this.observer.disconnect();this.canvas.removeEventListener('pointerup',this.up);this.canvas.removeEventListener('keydown',this.key);}
  }
  root.PengpaiStory={mount:(canvas,options)=>new CanvasStory(canvas,options)};
})(globalThis);
