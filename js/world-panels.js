(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,I=node?require('./items.js'):root.ItemCatalog,E=node?require('./engine.js'):root.BattleEngine,X=node?require('./experience.js'):root.CharacterExperience,C=node?require('./weapon-catalog.js'):root.WeaponCatalog;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),color=i=>I.qualities[i?.quality]?.color||'#a9b9bc',slots=[['weapon','武器'],['armor','防具'],['accessory1','饰品'],['accessory2','饰品']];
 const displayAttribute=(value,readonly=false)=>readonly?Math.floor(Number(value)||0):Number((Number(value)||0).toFixed(2));
 const questColors={available:'#59dce5',active:'#f3f6f4',ready:'#e9c365'};
 function questIcon(v,status,x,y,size=25){const tint=questColors[status];if(!tint)return;v.box(x,y,size,size,'#17201ff5',tint,3);v.text('!',x+size/2,y+size*.53,20,tint,'center');}
 function icon(v,id,x,y,size,tint){root.RpgIcons.draw(v.ctx,id,x,y,size,{image:src=>v.image(src),disabled:tint==='#425966'});}
 function iconButton(v,label,x,y,size,action,active=false){v.box(x,y,size,size,active?'#61502b':'#0c2531ed',active?'#e3c384':'#7d959b',4);icon(v,label,x+5,y+5,size-10,active?'#ffe2a2':'#d5e5df');v.hits.push({x,y,w:size,h:size,label,action});}
 function textButton(v,label,x,y,w,h,action,active=false){v.box(x,y,w,h,active?'#51472c':'#252c27',active?'#b79a68':'#766e57',2);v.text(label,x+w/2,y+h/2,14,active?'#f1ddb5':'#dcd8c5','center');v.hits.push({x,y,w,h,label,action});}
 function bar(v,x,y,w,h,value,fill='#40aab9',trail=value){v.box(x,y,w,h,'#07151e','#557780',3);v.ctx.fillStyle='#ecedce';v.ctx.fillRect(x+2,y+2,(w-4)*clamp(trail,0,1),h-4);v.ctx.fillStyle=fill;v.ctx.fillRect(x+2,y+2,(w-4)*clamp(value,0,1),h-4);}
 function itemIcon(v,item,x,y,size,empty){const tint=color(item);v.box(x,y,size,size,'#0a1d28',item?tint:'#3e5865',4);icon(v,root.RpgIcons.resolveItem(item,empty),x+7,y+7,size-14,item?tint:'#425966');if(item?.slot==='trophy'){v.box(x+size-23,y+size-17,22,16,'#172019','#8d805d',2);v.text(item.level+'',x+size-12,y+size-9,11,'#ead8ad','center');}}
 function character(){
  const p=this.panel,members=this.model.members(),u=p.unit||members.find(u=>u.id===p.unitId);
  if(!u){this.closeWorldPanel();return;}
  const previewKey=JSON.stringify(u);if(p.previewKey!==previewKey){p.previewKey=previewKey;p.previewCache=this.memberPreview(u);}const preview=p.previewCache,actor=preview.unit(u.id),current=preview.effective(actor),ids=actor.skills,passives=root.PengpaiRules.sortPassives(actor.passives,preview.passives),c=this.ctx;
  const showPotential=!!u.potentials&&(!p.readonly||root.CharacterGrowth.isGeneral(u)),statsH=108,showExperience=this.options?.showExperience!==false&&members.some(member=>member.id===u.id);
  const compact=this.h<640,width=Math.min(560,this.w-16),inner=width-28,headerH=compact?82:86,skillSize=compact?48:52,skillRowH=compact?60:64,footerH=compact?42:46,barH=showExperience?(compact?32:36):17,skillCols=Math.min(3,Math.max(1,ids.length)),skillRows=Math.ceil(ids.length/skillCols),passiveH=root.PengpaiUI.passiveHeight(passives.map(id=>preview.passives[id]),width-28);
  const fixed=headerH+skillRows*skillRowH+passiveH+statsH+4+barH+footerH,modelH=clamp(Math.min(440,inner*1.18,this.h-16-fixed),180,440),contentH=modelH+skillRows*skillRowH+passiveH+statsH+4+barH;
  const f=this.frame(u.name+'  '+u.level+'级',fixed+modelH,{titleAlign:'center',maxWidth:560,inset:8,verticalInset:8}),left=f.x+14,top=f.y+headerH,bottom=f.y+f.h-footerH,slotSize=Math.min(46,Math.floor(modelH/4)-5),slotGap=Math.min(12,(modelH-slotSize*4)/3),equipmentOffset=(modelH-slotSize*4-slotGap*3)/2,proto=root.BattleSystem.CanvasBattle.prototype;
  const profession=I.profession(u),type=profession?C.types.find(t=>t.id===profession.weaponType):null,group=C.groups.find(g=>g.id===type?.group);this.text((type?group.name+' · '+type.name:'自由职业')+(u.origin==='tavern'?' · '+root.TavernRecruitment.gradeOf(u).name:''),f.x+f.w/2,f.y+67,14,'#cbb586','center');
  const teammates=p.readonly?[]:[...this.model.partyGroups().active,...this.model.partyGroups().reserve];
  if(teammates.length>1&&teammates.some(member=>member.id===u.id))for(const [delta,glyph,label]of [[-1,'‹','上一位队友'],[1,'›','下一位队友']]){const index=teammates.findIndex(member=>member.id===u.id);this.button(glyph,f.x+f.w/2+(delta<0?-102:72),f.y+9,30,30,()=>this.openCharacter(teammates[(index+delta+teammates.length)%teammates.length].id,p.previous));this.hits.at(-1).label=label;}
  p.maxScroll=Math.max(0,contentH-(bottom-top));p.scroll=clamp(p.scroll||0,0,p.maxScroll);let y=top-p.scroll;const headerHits=this.hits.length;
  c.save();c.beginPath();c.rect(left,top,inner,bottom-top);c.clip();
  slots.forEach(([slot,label],i)=>{
   const sy=y+equipmentOffset+i*(slotSize+slotGap),item=p.readonly?(slot==='weapon'?u.weapon:u.equipment?.[slot]):this.model.equipped(u.id,slot);
   itemIcon(this,item,left,sy,slotSize,slot==='weapon'?'sword':slot.startsWith('accessory')?'accessory':'armor');
   if(item||!p.readonly)this.hits.push({x:left,y:sy,w:slotSize,h:slotSize,label:(item?'查看':'装备')+label,action:()=>{
    if(item)this.openItemDetail(item,{unitId:u.id,slot,equipped:true,readonly:!!p.readonly,fallbackPower:u.attack,previous:p});
    else this.panel={type:'inventory',unitId:u.id,slot,scroll:0,previous:p};
   }});
  });
  root.TrophyPanels.character(this,u,left,y,inner,slotSize,p.readonly,p);
  if(!p.readonly)this.options?.drawCharacterControls?.(this,{unit:u,frame:f,slotSize,y,modelH,inner,left,previous:p});
  const art=u.fullbody||(root.CharacterAssets?.manifest.characters[u.characterId||u.id]?root.CharacterAssets.resolve(u.characterId||u.id).fullbody:null),img=this.image(art?.src),modelBox={x:left+slotSize+8,y,w:inner-(slotSize+8)*2,h:modelH};
  if(img){const dst=root.BattleSystem.fitImage(img.naturalWidth,img.naturalHeight,modelBox),pose=root.BattlePresentation.idlePose({mode:'auto',soldiers:u.startSoldiers??u.soldiers??u.maxSoldiers,order:u.order||0},performance.now());c.save();c.translate(dst.x+dst.w/2,dst.y+dst.h);c.scale(pose.scale,1+(pose.scale-1)*2);c.drawImage(img,-dst.w/2,-dst.h,dst.w,dst.h);c.restore();}else this.text(u.name,f.x+f.w/2,y+modelH/2,20,'#ddd','center');
  y+=modelH;
  ids.forEach((id,i)=>{
   const skill=preview.skills[id],row=Math.floor(i/skillCols),count=Math.min(skillCols,ids.length-row*skillCols),size=skillSize,gap=compact?20:24,x=left+(inner-count*size-(count-1)*gap)/2+(i%skillCols)*(size+gap),sy=y+row*skillRowH+6;
   this.box(x,sy,size,size,'#102833','#76909a');proto.drawSkillIcon.call(this,skill,x,sy,size);
   this.hits.push({x:x-3,y:sy-3,w:size+6,h:size+6,label:'查看'+skill.name+'详情',action:()=>{this.panel={type:'npcSkill',preview,unitId:u.id,skill:id,scroll:0,previous:p};}});
  });
  y+=skillRows*skillRowH;
  root.PengpaiUI.passiveButtons(this,passives.map(id=>preview.passives[id]),left,y,inner,passive=>this.openPassiveInfo(passive,p));
  y+=passiveH;
  const gap=12,cw=(inner-gap)/2,pairs=[['war','武力','constitution','体质'],['intelligence','智力','armor','护甲'],['technique','技巧','resistance','抗性'],['speed','速度',...(u.statusImmunities?.includes('stun')?['stunProtection','抗晕']:[])]];
  this.box(left,y,inner,statsH,'#091d26','#37545e',3);
  pairs.forEach((row,i)=>{const yy=y+i*27+13.5;for(let col=0;col<row.length/2;col++){const x=left+col*(cw+gap),key=row[col*2],label=row[col*2+1],potential=showPotential?u.potentials?.[key]:null;if(potential!=null){this.text(label+' '+displayAttribute(current[key],p.readonly),x+6,yy,14,'#eddfc0');this.text(p.readonly?String(Math.floor(potential)):potential+'(+'+Number(root.CharacterGrowth.growthPerLevel(potential).toFixed(2))+')',x+cw-6,yy,14,'#d6bb8b','right');}else{this.text(label,x+6,yy,14,'#a9bec3');this.text(key==='stunProtection'?'抵抗':displayAttribute(current[key],p.readonly),x+cw-6,yy,16,'#eddfc0','right');}}});
  y+=statsH+4;const hp=u.startSoldiers??u.soldiers??u.maxSoldiers;bar(this,left,y,inner,17,hp/u.maxSoldiers,'#ba222c');this.text(u.dead?'濒死':hp===0?'重伤':hp+' / '+u.maxSoldiers,f.x+f.w/2,y+8.5,14,'#fff0e5','center');
  if(showExperience){y+=compact?19:20;const required=X.required(u.level);bar(this,left,y,inner,13,required===Infinity?1:(u.experience||0)/required,'#b39751');this.text((u.experience||0)+' / '+(required===Infinity?'—':required),f.x+f.w/2,y+6.5,14,'#f4e2b7','center');}
  c.restore();this.hits=this.hits.filter((hit,i)=>i<headerHits||hit.y>=top&&hit.y+hit.h<=bottom);
  const footer=f.y+f.h-footerH+7,bw=(inner-14)/3;
  if(!p.readonly)this.button('技能设置',left,footer,bw,32,()=>this.openMemberTactics(u.id,p));
  this.button('详细属性',p.readonly?left:left+bw+7,footer,p.readonly?inner:bw,32,()=>{this.panel={type:'characterDetails',unitId:u.id,...(p.readonly?{unit:u,readonly:true}:{}),previous:p};});
  if(!p.readonly)this.button(this.options?.memberAction?.label||'队伍设置',left+(bw+7)*2,footer,bw,32,()=>{if(this.options?.memberAction)this.options.memberAction.action(this,u,p);else this.panel={type:'memberActions',unitId:u.id,previous:p};});
 }
 function details(){
  const p=this.panel,u=p.unit||this.model.members().find(u=>u.id===p.unitId);if(!u){this.closeWorldPanel();return;}
  const previewKey=JSON.stringify(u);if(p.previewKey!==previewKey){p.previewKey=previewKey;p.previewCache=this.memberPreview(u);}const current=p.previewCache.effective(p.previewCache.unit(u.id)),showPotential=!p.readonly||root.CharacterGrowth.isGeneral(u);
  const trophyRows=Object.entries(u.trophyBonuses||{}),groups=C.groupedTypes(),columns=Math.min(3,Math.max(2,Math.floor((Math.min(460,this.w-28)-32)/100))),canLeave=this.options?.allowDismiss!==false&&!p.readonly&&u.id!=='hero'&&!u.guest,contentH=(trophyRows.length?36+trophyRows.length*28:0)+28+root.PengpaiRules.ATTRIBUTES.length*30+12+24+60+12+24+groups.reduce((n,g)=>n+28+Math.ceil(g.types.length/columns)*38+12,0);
  const f=this.frame(u.name+' · 详细属性',58+contentH+(canLeave?54:18)),left=f.x+20,w=f.w-40,top=f.y+58,bottom=f.y+f.h-(canLeave?54:18),c=this.ctx;
  p.maxScroll=Math.max(0,contentH-(bottom-top));p.scroll=clamp(p.scroll||0,0,p.maxScroll);let y=top-p.scroll;const beforeHits=this.hits.length;
  c.save();c.beginPath();c.rect(left,top,w,bottom-top);c.clip();
  this.text('属性',left,y+10,14,'#aec5ce');this.text('当前',left+w*(showPotential ? .58 : 1),y+10,14,'#aec5ce','right');if(showPotential)this.text(p.readonly?'潜力':'潜力(每级)',left+w,y+10,14,'#d6bb8b','right');y+=28;
  for(const [key,label]of root.PengpaiRules.ATTRIBUTES){this.box(left,y,w,27,'#15313b',null);this.text(label,left+8,y+13.5,14);this.text(displayAttribute(current[key],p.readonly),left+w*(showPotential ? .58 : 1)-(showPotential?0:8),y+13.5,16,'#f4e0b3','right');if(showPotential)this.text(u.potentials?.[key]!=null?p.readonly?Math.floor(u.potentials[key]):u.potentials[key]+'('+Number(root.CharacterGrowth.growthPerLevel(u.potentials[key]).toFixed(2))+')':'—',left+w-8,y+13.5,14,'#d6bb8b','right');y+=30;}
  y+=12;this.text('防护',left,y+10,14,'#aec5ce');this.text('当前',left+w*.58,y+10,14,'#aec5ce','right');this.text('对应减伤',left+w,y+10,14,'#aec5ce','right');y+=24;
  for(const [label,value,kind]of [['护甲',current.armor,'物理'],['抗性',current.resistance,'计策']]){
   const percent=p.readonly?Math.floor((1-E.mitigation(value))*100):((1-E.mitigation(value))*100).toFixed(2).replace(/\.?0+$/,'');
   this.box(left,y,w,27,'#15313b',null);this.text(label,left+8,y+13.5,14,'#b8cbd0');this.text(displayAttribute(value,p.readonly),left+w*.58,y+13.5,16,'#f4e0b3','right');this.text(kind+' '+percent+'%',left+w-8,y+13.5,14,'#e0cf9f','right');y+=30;
  }
  if(trophyRows.length){y+=12;this.text('遗物加成',left,y+10,16,'#d8bc89');y+=24;for(const [key,value]of trophyRows){this.text(root.TrophyCatalog.attributes[key]?.name||key,left+8,y+12,14,'#aec5ae');this.text('+'+root.TrophyCatalog.percent(value),left+w-8,y+12,16,'#c4d7a8','right');y+=28;}}
  y+=12;this.text('武器熟练度',left,y+10,16,'#d8bc89');y+=24;
  const cellW=(w-(columns-1)*8)/columns;for(const group of groups){this.box(left,y+12,(w-56)/2,1,'#38565d',null);this.box(left+(w+56)/2,y+12,(w-56)/2,1,'#38565d',null);this.text(group.name,left+w/2,y+12,14,'#e0ca99','center');y+=28;group.types.forEach((t,i)=>{const x=left+(i%columns)*(cellW+8),yy=y+Math.floor(i/columns)*38;this.box(x,yy,cellW,29,'#102c36',null,3);this.text(t.name,x+6,yy+11,14,'#abc2cb');this.text(u.weaponProficiencies?.[t.id]||0,x+cellW-6,yy+11,14,'#e1d6bd','right');const xp=u.weaponExperience?.[t.id]||0,need=root.WeaponProficiency.required(u.weaponProficiencies?.[t.id]||0);bar(this,x+5,yy+22,cellW-10,5,xp/need,'#55ad94');this.hits.push({x,y:yy,w:cellW,h:29,label:t.name+'熟练度',action:()=>{this.panel={type:'notice',title:group.name+' · '+t.name+'熟练度 '+(u.weaponProficiencies?.[t.id]||0),text:'熟练经验 '+xp+' / '+need+'。每级提升0.2%武器威力；有效施放相应武器技能可积累经验，敌人低于自身5级时不再增长。',previous:p};}});});y+=Math.ceil(group.types.length/columns)*38+12;}
  c.restore();this.hits=this.hits.filter((hit,i)=>i<beforeHits||hit.y>=top&&hit.y+hit.h<=bottom);
  if(canLeave)this.button('暂别 · 返回'+root.WorldData.placeMap[u.homeNode||'camp'].name,f.x+20,f.y+f.h-42,f.w-40,30,()=>{if(this.model.dismiss(u.id)){this.save();this.panel={type:'party',scroll:0};}});
 }
 function partyCard(v,u,x,y,w,ghost=false){
  const hp=u.startSoldiers??u.maxSoldiers;v.box(x,y,w,100,ghost?'#1b414bea':'#112d37','#4d7078',4);if(u.portrait)v.portrait(u.portrait,x+7,y+7,36,{frame:false});v.text(u.name,x+49,y+18,14,'#ede0c3');v.text(u.level+'级',x+49,y+39,14,'#a8c4c5');bar(v,x+8,y+53,w-16,14,hp/u.maxSoldiers,'#b82d33');v.text(u.dead?'濒死':hp===0?'重伤':hp+' / '+u.maxSoldiers,x+w/2,y+60,14,'#fff0e5','center');
 }
 function party(){
  const p=this.panel,groups=this.model.partyGroups(),total=groups.active.length+groups.reserve.length,f=this.frame('队伍 '+total+'/'+this.model.rosterLimit(),600),left=f.x+16,gap=12,cw=(f.w-32-gap)/2,top=f.y+84,bottom=f.y+f.h-18,c=this.ctx;
  p.scrolls||={active:0,reserve:0};p.scrollLimits||={active:0,reserve:0};p.rowHeight=108;p.partyColumns=[{group:'active',x:left,y:top,w:cw,h:bottom-top},{group:'reserve',x:left+cw+gap,y:top,w:cw,h:bottom-top}];
  this.button('整队轮换',f.x+f.w-202,f.y+9,76,30,()=>{if(this.model.swapPartyTeams()){p.scrolls={active:0,reserve:0};this.save();this.invalidate();}},{disabled:!groups.reserve.length||groups.reserve.length>this.model.activeLimit()||!!this.model.pending||!!this.model.journey});
  this.button(p.sortMode?'完成排序':'排序',f.x+f.w-120,f.y+9,70,30,()=>{p.sortMode=!p.sortMode;},{active:!!p.sortMode});
  this.text('出战 '+groups.active.length+'/'+this.model.activeLimit(),left+cw/2,f.y+61,14,'#e4cf9b','center');this.text('备战 '+groups.reserve.length+'/'+Math.max(0,this.model.rosterLimit()-this.model.activeLimit()),left+cw+gap+cw/2,f.y+61,14,'#b6cbd0','center');c.fillStyle='#425c6266';c.fillRect(left+cw+gap/2-.5,f.y+50,1,f.h-68);
  const button=(label,fullLabel,x,y,w,h,action,disabled=false)=>{const n=this.hits.length;this.button(label,x,y,w,h,action,{disabled});if(this.hits.length>n)this.hits.at(-1).label=fullLabel;};
  for(const column of p.partyColumns){const group=column.group,items=groups[group];p.scrollLimits[group]=Math.max(0,items.length*p.rowHeight-column.h);p.scrolls[group]=clamp(p.scrolls[group]||0,0,p.scrollLimits[group]);const before=this.hits.length;
   c.save();c.beginPath();c.rect(column.x,column.y,column.w,column.h);c.clip();
   if(!items.length)this.text('暂无备战人员',column.x+cw/2,top+35,14,'#78949e','center');
   items.forEach((u,i)=>{const x=column.x,y=top+i*p.rowHeight-p.scrolls[group],w=cw-4;if(y+100<top||y>bottom)return;c.save();if(p.drag?.id===u.id)c.globalAlpha=.25;partyCard(this,u,x,y,w);c.restore();
    this.hits.push({x,y,w,h:100,kind:'partyMember',unitId:u.id,partyGroup:group,cardX:x,cardY:y,cardW:w,label:'状态 '+u.name,action:()=>{this.panel={type:'character',unitId:u.id,previous:p};}});
    if(p.sortMode){const bw=(w-22)/2;for(const [delta,label]of [[-1,'上移'],[1,'下移']])button(label,label+' '+u.name,x+8+(delta>0?bw+6:0),y+73,bw,25,()=>{if(this.model.reorderParty(group,u.id,i+delta))this.save();},delta<0?i===0:i===items.length-1);}
    else{const target=group==='active'?'reserve':'active',label=group==='active'?'下场':'上阵',disabled=target==='active'?groups.active.length>=this.model.activeLimit():groups.active.length===1;const canDismiss=group==='reserve'&&u.id!=='hero'&&!u.guest&&(u.homeNode||u.id==='zhangliang');if(canDismiss)button('离队','离队 '+u.name,x+w/2+3,y+73,w/2-11,25,()=>{if(this.model.dismiss(u.id))this.save();});button(label,label+' '+u.name,x+8,y+73,canDismiss?w/2-11:w-16,25,()=>{if(this.model.movePartyMember(u.id,target,groups[target].length))this.save();else this.notify(this.model.lastPartyError||'暂时不能调整队伍。');},disabled);}
   });c.restore();this.hits=this.hits.filter((hit,i)=>{if(i<before)return true;const end=Math.min(bottom,hit.y+hit.h);hit.y=Math.max(top,hit.y);hit.h=end-hit.y;return hit.h>0;});
   if(p.scrollLimits[group]>0){const h=Math.max(20,column.h*column.h/(items.length*p.rowHeight)),yy=top+(column.h-h)*p.scrolls[group]/p.scrollLimits[group];this.box(column.x+cw-2,top,2,column.h,'#18343c',null);this.box(column.x+cw-2,yy,2,h,'#9cb8b5',null);}
  }
  if(p.drag){const d=p.drag,column=p.partyColumns.find(c=>c.group===d.overGroup);if(column){const yy=clamp(top+d.slot*p.rowHeight-p.scrolls[column.group],top,bottom-2);this.box(column.x,yy,column.w-4,3,'#e6cb83',null);}const u=[...groups.active,...groups.reserve].find(u=>u.id===d.id);if(u){c.save();c.globalAlpha=.9;c.shadowColor='#0009';c.shadowBlur=15;partyCard(this,u,d.x-d.offsetX,d.y-d.offsetY,d.w,true);c.restore();}}
 }
 function memberActions(){
  const p=this.panel,u=this.model.members().find(u=>u.id===p.unitId);if(!u){this.closeWorldPanel();return;}const active=this.model.state.activeIds.includes(u.id),retainer=u.origin==='tavern',canLeave=u.id!=='hero'&&!u.guest&&u.homeNode,f=this.frame(u.name+' · 队伍',retainer?346:canLeave?240:180);
  this.button(active?'转为候补':'加入出战',f.x+20,f.y+65,f.w-40,40,()=>{const ids=active?this.model.state.activeIds.filter(id=>id!==u.id):[...this.model.state.activeIds,u.id];if(this.model.setActive(ids)){this.save();this.panel=p.previous;}else this.notify(active?'至少保留一人出战。':'最多'+this.model.activeLimit()+'人出战。');});
  if(canLeave)this.button(retainer?'离队 · 返回酒馆':'离队 · 返回'+root.WorldData.placeMap[u.homeNode].name,f.x+20,f.y+121,f.w-40,40,()=>{if(this.model.dismiss(u.id)){this.save();this.panel={type:'party',scroll:0};}});
  if(retainer){this.button('更改姓名',f.x+20,f.y+177,f.w-40,40,()=>{this.panel={type:'retainerRename',unitId:u.id,previous:p};});this.button('永久离队',f.x+20,f.y+233,f.w-40,40,()=>{this.panel={type:'retainerRelease',unitId:u.id,previous:p,returnPanel:{type:'party',scroll:0}};});}
 }

 function formation(){
  const p=this.panel,members=this.model.members(),f=this.frame('上阵 ('+this.model.state.activeIds.length+'/'+this.model.activeLimit()+')',80+members.length*50),top=f.y+58,bottom=f.y+f.h-16,c=this.ctx;
  p.maxScroll=Math.max(0,members.length*50-(bottom-top));p.scroll=clamp(p.scroll||0,0,p.maxScroll);const before=this.hits.length;c.save();c.beginPath();c.rect(f.x+16,top,f.w-32,bottom-top);c.clip();
  members.forEach((u,i)=>{const active=this.model.state.activeIds.includes(u.id);this.button(u.name+' · '+(active?'出战':'候补'),f.x+20,top+i*50-p.scroll,f.w-40,42,()=>{const ids=active?this.model.state.activeIds.filter(id=>id!==u.id):[...this.model.state.activeIds,u.id];if(this.model.setActive(ids))this.save();else this.notify(active?'至少保留一人出战。':'最多'+this.model.activeLimit()+'人出战。');},{active});});
  c.restore();this.hits=this.hits.filter((hit,i)=>i<before||hit.y>=top&&hit.y+hit.h<=bottom);
 }
 const sortOptions=[['quality','品质'],['default','默认顺序'],['power','武器威力'],['war','武力'],['intelligence','智力'],['constitution','体质'],['speed','速度'],['technique','技巧'],['armor','护甲'],['resistance','抗性']];
 function preferences(v,p){return p.preferences||(p.preferences=v.inventoryPreferences||(v.inventoryPreferences={qualities:[],slot:'all',types:[],sortBy:'quality',descending:true}));}
 function itemDetail(){
  if(this.panel.item?.slot==='trophy')return root.TrophyPanels.detail(this);
  const p=this.panel,item=p.equipped&&!p.readonly?this.model.equipped(p.unitId,p.slot):p.item;if(!item){this.closeWorldPanel();return;}
  const labels={war:'武力',intelligence:'智力',constitution:'体质',speed:'速度',technique:'技巧',armor:'护甲',resistance:'抗性',healingBonus:'治疗效果',hitBonus:'命中率',criticalBonus:'暴击率',dodge:'闪避率',armorPenetration:'忽视护甲',resistancePenetration:'忽视抗性',physicalLifesteal:'物理吸血',unload:'卸力'},rows=[];
  const classification=C.classification(item);if(classification){rows.push(['职业',classification.group?.name||'其他']);rows.push(['流派',classification.type.name]);}
  const ranges=item.rollPreview?item.rollRanges:null,rangeText=b=>b[0]+' – '+b[1];
  if(item.slot==='weapon'||item.type)rows.push(['武器威力',ranges?.power?rangeText(ranges.power):item.power??item.attack??p.fallbackPower??0]);
  for(const [key,value]of Object.entries(item.attributes||{}))rows.push([labels[key]||key,ranges?.attributes[key]?rangeText(ranges.attributes[key]):(value>=0?'+':'')+(['healingBonus','hitBonus','criticalBonus','dodge','physicalLifesteal'].includes(key)?Math.round(value*100)+'%':value)]);if(item.statusImmunities?.length)rows.push(['状态免疫',item.statusImmunities.map(id=>root.BattleStatuses.definitions[id]?.name||id).join('、')]);if(item.unique)rows.push(['获取',item.acquisition]);
  if(ranges)rows.push(['随机属性',ranges.count+'条 · 随机 '+rangeText(ranges.random)]);
  if(item.questItem)rows.push(['用途','任务道具']);
  const target=this.model.members().find(u=>u.id===(p.unitId||'hero')),canAct=!item.questItem&&!p.readonly&&!this.model.pending&&!this.model.journey;let action,label;
  if(canAct&&p.transaction==='buy'){label='购买 '+item.price+'文';action=()=>{if(this.model.buyItem(item.templateId)){const acquired=this.model.state.inventory.at(-1);this.save();this.openItemDetail(acquired,{unitId:p.unitId||'hero',previous:p.previous,revealed:true});root.GameAudio?.play?.('buff');}else this.notify('铜钱不足。');};}
  else if(canAct&&p.transaction==='sell'&&this.model.state.inventory.some(i=>i.uid===item.uid)){label='出售 '+I.sellPrice(item)+'文';action=()=>{if(this.model.sellItem(item.uid)){this.save();this.panel=p.previous;this.notify('已出售 '+item.name);}};}
  else if(canAct&&target&&p.equipped){label='卸下';action=()=>{if(this.model.changeEquipment(target.id,p.slot,null)){this.save();this.panel=p.previous;}};}
  else if(canAct&&target&&this.model.state.inventory.some(i=>i.uid===item.uid)){const slot=p.slot||(item.slot==='accessory'?(!target.equipment?.accessory1?'accessory1':'accessory2'):item.slot);if(I.compatible(item,slot)&&I.canEquip(target,item)){label='装备';action=()=>{if(this.model.changeEquipment(target.id,slot,item.uid)){this.save();this.panel=p.previous?.slot&&p.previous.previous?.type==='character'?p.previous.previous:p.previous;}};}}
  const canReplace=canAct&&target&&p.equipped,compareSlot=p.slot||(item.slot==='accessory'?(!target?.equipment?.accessory1?'accessory1':'accessory2'):item.slot),showCompare=!item.rollPreview&&canAct&&target&&p.transaction!=='sell'&&I.compatible(item,compareSlot)&&I.canEquip(target,item);
  if(showCompare&&!p.comparison)p.comparison=this.model.compareEquipment(target.id,compareSlot,p.equipped?null:item);
  const comparison=showCompare?p.comparison:null,changes=comparison?.changes||[],compareH=comparison?42+Math.max(1,changes.length)*26:0;
  this.ctx.font='14px '+root.PengpaiUI.font;const description=item.description||'',descriptionH=description?root.PengpaiUI.wrapLines(this.ctx,description,Math.min(380,this.w-28)-40).length*22+12:0,footerH=(p.transaction?28:0)+(action?54:14)+(canReplace?44:0),contentH=rows.length*32+descriptionH+compareH;
  const f=this.frame('',118+contentH+footerH,{closable:false,maxWidth:380}),left=f.x+20,w=f.w-40,top=f.y+110,bottom=f.y+f.h-footerH,c=this.ctx;
  itemIcon(this,item,left,f.y+20,64);this.text(item.name,left+80,f.y+40,18,color(item));this.text((I.qualities[item.quality]?.name||'普通')+' · '+I.typeLabel(item),left+80,f.y+69,14,color(item));this.box(left,f.y+101,w,1,'#48616b',null);
  p.maxScroll=Math.max(0,contentH-(bottom-top));p.scroll=clamp(p.scroll||0,0,p.maxScroll);let y=top-p.scroll;c.save();c.beginPath();c.rect(left,top,w,bottom-top);c.clip();
  rows.forEach(([name,value])=>{this.box(left,y,w,28,'#15313b',null,3);this.text(name,left+10,y+14,14,'#b5cbd0');this.text(value,left+w-10,y+14,16,'#f0deba','right');y+=32;});
  if(description){this.wrap(description,left,y+6,w,{size:14,line:22,color:'#c5d3d5'});y+=descriptionH;}
  if(comparison){this.text(target.name+' · '+(p.equipped?'卸下后':'装备后'),left,y+20,16,'#d8c18b');y+=42;const rateKeys=['hitBonus','criticalBonus','dodge','healingBonus','physicalLifesteal'],format=(value,key)=>rateKeys.includes(key)?Number((value*100).toFixed(1))+'%':Number(value.toFixed(2));if(!changes.length)this.text('属性不变',left,y+12,14,'#a4b3a5');for(const change of changes){this.text(change.label,left,y+12,14,'#b1c1b6');this.text(format(change.before,change.key)+' → '+format(change.after,change.key),left+w,y+12,14,change.after>change.before?'#a9d49f':'#e5a18c','right');y+=26;}}
  c.restore();if(p.maxScroll)this.box(left+w+8,top+(bottom-top-24)*p.scroll/p.maxScroll,2,24,'#a28f63',null);
  if(p.transaction)this.text(this.model.state.money+' 文',left,f.y+f.h-footerH+14,14,'#e2c380');
  if(canReplace)this.button('更换',left,f.y+f.h-92,w,32,()=>{this.panel={type:'inventory',unitId:target.id,slot:p.slot,scroll:0,previous:p.previous};});
  if(action)this.button(label,left,f.y+f.h-48,w,32,()=>{action();if(label==='装备'&&this.model.equipped(target.id,compareSlot)?.uid===item.uid)this.notify('已装备 '+item.name);});
  this.hits.unshift({x:0,y:0,w:this.w,h:this.h,label:'关闭装备详情',action:()=>this.closeWorldPanel()});
 }
 function inventory(){
  if(this.panel.category==='trophies')return root.TrophyPanels.warehouse(this);
  const p=this.panel,shop=p.type==='shop',selling=shop&&p.shopMode==='sell',prefs=preferences(this,p),source=shop&&!selling?(p.shopItems||=I.shopTemplates().map(id=>I.preview(id,'white','shop-'+id,this.model.character.level))):shop||p.slot?this.model.state.inventory:[...this.model.state.inventory,...root.StoryRules.itemRecords(this.model)],query={...prefs,slot:p.slot||prefs.slot,types:p.slot&&p.slot!=='weapon'?[]:prefs.types},queryKey=JSON.stringify(query);
  if(p.itemSource!==source||p.itemLength!==source.length||p.queryKey!==queryKey){p.itemSource=source;p.itemLength=source.length;p.queryKey=queryKey;p.items=I.select(source,query).filter(item=>!p.slot||I.canEquip(this.model.members().find(u=>u.id===p.unitId),item));}
  const items=p.items;if(p.selected&&!items.some(item=>item.uid===p.selected))p.selected=null;
  const f=this.frame(p.slot?'选择'+slots.find(s=>s[0]===p.slot)[1]:shop?(selling?'出售':'购买'):'背包',600),left=f.x+16,w=f.w-32,c=this.ctx,top=f.y+(p.slot?106:shop?140:144),bottom=f.y+f.h-(selling?64:16),cols=Math.max(3,Math.floor(w/96)),cw=(w-8*(cols-1))/cols,rowH=120;
  textButton(this,'筛选',f.x+f.w-154,f.y+9,48,30,()=>{this.panel={type:'inventoryFilter',inventory:p,previous:p,scroll:0};},!!(prefs.qualities.length||prefs.types.length||prefs.slot!=='all'));
  textButton(this,'排序',f.x+f.w-100,f.y+9,48,30,()=>{this.panel={type:'inventorySort',inventory:p,previous:p,scroll:0};});
  if(!shop)root.TrophyPanels.tabs(this,p,f);
  if(shop){const bw=(w-8)/2;for(const [i,mode]of ['buy','sell'].entries())this.button(mode==='buy'?'购买':'出售',left+i*(bw+8),f.y+62,bw,34,()=>{p.shopMode=mode;p.selected=null;p.scroll=0;},{active:(p.shopMode||'buy')===mode});}
  if(!p.slot)this.text(this.model.state.money+' 文',left,f.y+(p.slot?76:116),14,'#e2c380');
  this.text(items.length+' 件',left+w,f.y+(p.slot?76:116),14,'#a9bdc4','right');
  p.maxScroll=Math.max(0,Math.ceil(items.length/cols)*rowH-(bottom-top));p.scroll=clamp(p.scroll||0,0,p.maxScroll);const before=this.hits.length,first=Math.floor(p.scroll/rowH)*cols,end=Math.min(items.length,Math.ceil((p.scroll+bottom-top)/rowH)*cols);
  c.save();c.beginPath();c.rect(left,top,w,bottom-top);c.clip();
  for(let i=first;i<end;i++){const item=items[i],x=left+(i%cols)*(cw+8),y=top+Math.floor(i/cols)*rowH-p.scroll;if(p.selected===item.uid)this.box(x,y,cw,108,'#c6b26a14','#e6d295',3);itemIcon(this,item,x+(cw-44)/2,y+8,44);this.text(item.name,x+cw/2,y+70,14,color(item),'center');this.text(I.typeLabel(item),x+cw/2,y+94,14,'#8fa49a','center');this.hits.push({x,y,w:cw,h:108,label:'选择 '+item.name,action:()=>{p.selected=item.uid;this.openItemDetail(item,{unitId:p.unitId,slot:p.slot,...(shop?{transaction:selling?'sell':'buy'}:{}),readonly:!!item.questItem,previous:p});}});}
  c.restore();this.hits=this.hits.filter((hit,i)=>i<before||hit.y>=top&&hit.y+hit.h<=bottom);
  if(p.maxScroll){const h=bottom-top,thumb=Math.max(22,h*h/(h+p.maxScroll)),y=top+(h-thumb)*p.scroll/p.maxScroll;this.box(left+w-3,y,3,thumb,'#78959e',null,1);}
  if(!items.length)this.text(source.length?'没有符合条件的装备':p.slot?'没有可更换的装备':selling?'没有可出售的装备':'背包是空的',f.x+f.w/2,(top+bottom)/2,14,'#8fa6af','center');
  if(selling)this.button('批量出售'+(items.length?' '+items.length+'件':''),left,f.y+f.h-48,w,32,()=>{this.notice=null;this.panel={type:'bulkSell',items:[...items],previous:p};},{disabled:!items.length});
 }
 function bulkSell(){
  const p=this.panel,items=p.items,total=items.reduce((sum,item)=>sum+I.sellPrice(item),0),f=this.frame('批量出售',266),left=f.x+20,w=f.w-40,prefs=preferences(this,p.previous),types=root.PengpaiRules.WEAPON_TYPES;
  const filters=[...prefs.qualities.map(q=>({white:'白色',green:'绿色',blue:'蓝色',orange:'橙色',red:'红色'}[q])),...prefs.types.map(id=>types.find(t=>t.id===id)?.name||id)];if(!filters.length&&prefs.slot!=='all')filters.push({weapon:'武器',armor:'防具',accessory:'饰品'}[prefs.slot]);
  this.text(filters.join(' · ')||'全部未穿戴装备',left,f.y+65,14,'#b4c9ce');this.text('装备',left,f.y+101,14,'#b4c9ce');this.text(items.length+' 件',left+w,f.y+101,16,'#e8d8b5','right');this.text('总售价',left,f.y+133,14,'#b4c9ce');this.text(total+' 文',left+w,f.y+133,16,'#e2c380','right');this.text('当前金钱 '+this.model.state.money+' 文',left,f.y+170,14,'#e2c380');
  this.button('出售',left,f.y+f.h-54,w,36,()=>{const sold=this.model.sellItems(items.map(i=>i.uid));this.panel=p.previous;if(sold){this.panel.selected=null;this.panel.scroll=0;this.save();this.notify('已出售 '+sold.count+' 件装备');}else this.notify('装备列表已变化，请重新选择。');});this.dismissOutside(f,()=>this.closeWorldPanel());
 }
 function inventoryFilter(){
  const p=this.panel,parent=p.inventory,prefs=preferences(this,parent),sections=[{title:'品质',key:'qualities',values:[['all','全部'],...Object.keys(I.qualities).map(id=>[id,{white:'白色',green:'绿色',blue:'蓝色',orange:'橙色',red:'红色'}[id]])],cols:3}];
  if(!parent.slot)sections.push({title:'装备类型',key:'slot',values:[['all','全部'],['weapon','武器'],['armor','防具'],['accessory','饰品']],cols:4});
  if((!parent.slot||parent.slot==='weapon')&&(parent.slot==='weapon'||['all','weapon'].includes(prefs.slot)))sections.push({title:'武器种类',key:'types',values:[['all','全部'],...root.PengpaiRules.WEAPON_TYPES.map(t=>[t.id,t.name])],cols:3});
  const contentH=sections.reduce((n,s)=>n+26+Math.ceil(s.values.length/s.cols)*36+10,0),f=this.frame('筛选',58+contentH+54),left=f.x+18,w=f.w-36,top=f.y+58,bottom=f.y+f.h-54,c=this.ctx;
  p.maxScroll=Math.max(0,contentH-(bottom-top));p.scroll=clamp(p.scroll||0,0,p.maxScroll);let y=top-p.scroll;const before=this.hits.length;c.save();c.beginPath();c.rect(left,top,w,bottom-top);c.clip();
  for(const section of sections){this.text(section.title,left,y+10,16,'#d8bc89');y+=26;const cw=(w-6*(section.cols-1))/section.cols;
   section.values.forEach(([id,label],i)=>{const multi=section.key!=='slot',active=multi?(id==='all'?!prefs[section.key].length:prefs[section.key].includes(id)):prefs.slot===id;
    this.button(label,left+(i%section.cols)*(cw+6),y+Math.floor(i/section.cols)*36,cw,30,()=>{if(multi){prefs[section.key]=id==='all'?[]:prefs[section.key].includes(id)?prefs[section.key].filter(v=>v!==id):[...prefs[section.key],id];if(section.key==='types'&&id!=='all'&&!parent.slot)prefs.slot='weapon';}else{prefs.slot=id;if(!['all','weapon'].includes(id))prefs.types=[];}parent.scroll=0;parent.selected=null;},{active});});
   y+=Math.ceil(section.values.length/section.cols)*36+10;
  }
  c.restore();this.hits=this.hits.filter((hit,i)=>i<before||hit.y>=top&&hit.y+hit.h<=bottom);
  this.button('重置筛选',left,f.y+f.h-43,w,30,()=>{prefs.qualities=[];prefs.types=[];prefs.slot='all';parent.scroll=0;parent.selected=null;p.scroll=0;});
 }
 function inventorySort(){
  const p=this.panel,parent=p.inventory,prefs=preferences(this,parent),f=this.frame('排序',380),left=f.x+18,w=f.w-36,cw=(w-8)/2;
  this.button('从高到低',left,f.y+58,cw,32,()=>{prefs.descending=true;parent.scroll=0;},{active:prefs.descending});this.button('从低到高',left+cw+8,f.y+58,cw,32,()=>{prefs.descending=false;parent.scroll=0;},{active:!prefs.descending});
  sortOptions.forEach(([id,label],i)=>this.button(label,left+(i%2)*(cw+8),f.y+108+Math.floor(i/2)*47,cw,38,()=>{prefs.sortBy=id;parent.scroll=0;this.panel=parent;},{active:prefs.sortBy===id}));
 }
 function reward(){
  this.ctx.font=`14px ${root.PengpaiUI.font}`;
  const p=this.panel,r=p.reward,gains=r.gains||[],masteries=r.proficiencies||[],items=(r.items||[]).map(item=>item.slot==='trophy'?this.model.state.trophies?.find(t=>t.uid===item.uid)||item:item),members=this.model.members(),ids=[...new Set([...gains.map(g=>g.id),...masteries.map(g=>g.id)])],cards=ids.map(id=>({id,gain:gains.findIndex(g=>g.id===id),masteries:masteries.flatMap((g,i)=>g.id===id?[i]:[])})),startOffset=r.progress?90:58;
  const width=Math.min(460,this.w-28)-36,cols=Math.max(3,Math.floor(width/76)),cw=(width-8*(cols-1))/cols,growths=cards.map(card=>root.AdventureFeedback?.growth(gains[card.gain],members.find(u=>u.id===card.id))||0),cardBlock=cards.reduce((n,card,i)=>n+96+(growths[i]?24:0)+card.masteries.length*48,0),reported=r.reportedNames||[],contentH=cardBlock+(cards.length?8:0)+reported.length*26+(r.money>0?44:0)+(items.length?28+Math.ceil(items.length/cols)*112:0),f=this.frame(r.title||(r.completedQuest?'委托完成':'战斗胜利'),startOffset+contentH+69,{closable:false}),c=this.ctx,left=f.x+18,w=f.w-36,start=f.y+startOffset,bottom=f.y+f.h-69,elapsed=Math.max(0,performance.now()-p.started);
  if(!p.tracks){p.tracks=gains.map(g=>new root.BattlePresentation.ExperienceTrack(g,{required:X.required,maxLevel:X.maxLevel}));p.masteryTracks=masteries.map(g=>new root.BattlePresentation.ExperienceTrack(g,{required:root.WeaponProficiency.required}));p.animationDuration=Math.max(0,...[...p.tracks,...p.masteryTracks].map(t=>t.duration));}
  if(r.progress){bar(this,left,f.y+53,w,17,r.progress.value,'#528e92');this.text(r.progress.label+' '+Math.round(r.progress.value*100)+'%',f.x+f.w/2,f.y+61,14,'#e6d9b2','center');}

  p.maxScroll=Math.max(0,contentH-(bottom-start));p.scroll=clamp(p.scroll||0,0,p.maxScroll);const before=this.hits.length;c.save();c.beginPath();c.rect(left,start,w,bottom-start);c.clip();let y=start-p.scroll;
  for(const card of cards){const g=gains[card.gain],u=members.find(u=>u.id===card.id),sample=g?p.tracks[card.gain].sample(elapsed):{level:u?.level||1,xp:u?.experience||0,need:X.required(u?.level||1),fraction:(u?.experience||0)/X.required(u?.level||1)},growth=growths[cards.indexOf(card)],extra=growth?24:0,height=84+extra+card.masteries.length*48;
   this.box(left,y,w,height,'#112e39','#365867',4);if(u?.portrait)this.portrait(u.portrait,left+8,y+10,42);this.text(g?.name||u?.name||card.id,left+59,y+18,16,'#e6dcc4');this.text('经验 +'+(g?.amount||0),left+w-10,y+18,14,'#e4c37c','right');this.text(sample.level+'级'+(g&&sample.level>g.before?'  升级':''),left+59,y+40,14,g&&sample.level>g.before?'#f0d187':'#a4bbc3');bar(this,left+10,y+56,w-20,14,sample.fraction,'#b89d53',sample.trail??sample.fraction);this.text(X.display(sample.xp)+' / '+(sample.need===Infinity?'—':sample.need),left+w/2,y+63,14,'#f1e4c6','center');
   if(growth)this.text('基础属性合计 +'+growth+' 点',left+10,y+86,14,'#b6e8b4');
   card.masteries.forEach((index,i)=>{const gain=masteries[index],yy=y+80+extra+i*48,sample=p.masteryTracks[index].sample(elapsed),name=root.PengpaiRules.WEAPON_TYPES.find(t=>t.id===gain.type)?.name||gain.type;this.text(name+'熟练 '+sample.level,left+10,yy+10,14,'#a8dfcf');this.text('+'+gain.amount,left+w-10,yy+10,14,'#a8dfcf','right');bar(this,left+10,yy+26,w-20,13,sample.fraction,'#4baf97',sample.trail);this.text(X.display(sample.xp)+' / '+sample.need,left+w/2,yy+32.5,14,'#d8f0d8','center');});y+=height+12;
  }
  if(cards.length)y+=8;for(const name of reported){this.text(name,left+8,y+12,14,'#d6e0d7');y+=26;}if(r.money>0){this.box(left,y,w,44,'#102b34','#38565d',4);icon(this,'金币',left+8,y+7,30);this.text('+'+(r.money||0)+' 文',left+48,y+22,16,'#e8ce8a');y+=44;}
  if(items.length){this.text('获得物品',left,y+16,14,'#b9ccd0');y+=28;items.forEach((item,i)=>{const x=left+(i%cols)*(cw+8),yy=y+Math.floor(i/cols)*112;itemIcon(this,item,x+(cw-44)/2,yy+3,44);this.text(item.name,x+cw/2,yy+64,14,color(item),'center');this.text(I.typeLabel(item),x+cw/2,yy+85,14,'#8fa49a','center');if(members.some(u=>[u.weapon,...Object.values(u.equipment||{}),...(u.trophies||[])].some(gear=>gear?.uid===item.uid)))this.text('已装备',x+cw/2,yy+104,12,'#acc99c','center');this.hits.push({x,y:yy,w:cw,h:110,label:I.typeLabel(item)+' '+item.name,action:()=>this.openItemDetail(item,{previous:p})});});}
  c.restore();this.hits=this.hits.filter((h,i)=>i<before||h.y>=start&&h.y+h.h<=bottom);
  const context=this.model.state.afterBattle,q=context?.kind==='side'?this.model.state.quests.side[context.questId]:null,data=context?.kind==='side'?root.NearbyContent.sideQuests.find(t=>t.id===context.questId):null,canContinue=q&&q.wins<data.rounds;this.button(canContinue?'继续剿匪':'继续',left,f.y+f.h-51,canContinue?(w-10)/2:w,36,()=>this.finishReward(canContinue?context.questId:null));if(canContinue)this.button('暂歇',left+(w+10)/2,f.y+f.h-51,(w-10)/2,36,()=>this.finishReward());
 }
 function questTarget(view,q){const data=root.NearbyContent.sideQuests.find(t=>t.id===q.id);return q.id==='changshan'?view.model.questDestination():q.target||(q.accepted?data?.place:data?.giverPlace);}
 function goQuest(view,q){const target=questTarget(view,q);if(!target)return;view.panel=null;if(target===view.model.state.nodeId){if(!view.model.state.inside)view.tryEnter();else{const npc=view.model.questNpc(q.id);if(npc)view.interact(npc);}}else{view.model.leave();view.save();view.travel(target);}view.invalidate();}
 function taskRewards(view,q){
  const d=root.NearbyContent.sideQuests.find(t=>t.id===q.id),hero=root.HeroQuests?.definitions[q.id],items=[];let money=d?.money||0;
  if(d?.item)items.push(I.preview(d.item,d.quality,'quest-preview-'+d.id,d.fixedCombatLevel||view.model.character.level));
  for(const [id,quality]of [...(I.rewards['hero:'+q.id]||[]),...(I.rewards['side:'+q.id]||[]),...(q.id==='changshan'?I.rewards['story:escort']||[]:[])])items.push(I.preview(id,quality,'quest-preview-'+id,view.model.character.level));
  if(d?.effects?.items)for(const [id,count]of Object.entries(d.effects.items)){const record=root.StoryRules?.itemDefinitions[id];if(record)items.push({...record,id,count,slot:'quest',questItem:true,quality:'blue'});}
  const trophyId=q.id==='changshan'?'peace-jade':q.id==='reed-shrine'?'sacred-censer':null;if(trophyId)items.push(root.TrophyCatalog.create(trophyId,'quest-preview-'+trophyId));
  if(q.id==='chapter-one')for(const [name,iconId,description]of [['战斗经验','任务','击败守军后，按每场战斗获得经验。'],['铜钱','./assets/ui/copper-coins-v1.webp','击败守军后，按每场战斗获得铜钱。'],['随机装备','iron-armor','战斗中有概率掉落随机属性装备。'],['稀有遗物','trophy-scale','战斗中有较低概率掉落遗物。']])items.push({name,iconId,description,slot:'quest',questItem:true,quality:'white'});
  if(q.id.startsWith('report-'))money=view.model.pendingReports(q.id.slice(7)).length*root.FactionCourts.rewardPerHero;
  return {money,items,recruits:q.id==='changshan'?[{id:'zhaoyun',name:'赵云'}]:hero?[{id:hero.id,name:hero.name}]:[]};
 }
 function tasks(){
  const p=this.panel;this.model.readQuests();p.category||=this.model.state.questTab;p.statusFilter||='active';
  const quests=this.model.quests().filter(q=>q.category===p.category&&(p.statusFilter==='complete'?q.complete:p.statusFilter==='active'?!q.complete:true)&&(q.category==='main'&&q.id!=='chapter-one'||q.accepted||q.complete)),groupCount=p.category==='main'?Number(quests.some(q=>!q.longTerm))+Number(quests.some(q=>q.longTerm)):0,f=this.frame('行旅手记',Math.min(680,Math.max(280,154+quests.length*52+groupCount*28))),left=f.x+18,w=f.w-36,top=f.y+130,bottom=f.y+f.h-18,c=this.ctx,categories=[['main','主线'],['story','人物'],['side','委托']],bw=(w-12)/3,tracked=new Set(this.model.trackedQuests().map(q=>q.id));
  textButton(this,'追踪',f.x+f.w-208,f.y+10,48,30,()=>{this.panel={type:'trackerOrder',previous:p};});
  textButton(this,'筛选',f.x+f.w-154,f.y+10,48,30,()=>{this.panel={type:'taskFilter',previous:p};},p.statusFilter!=='active');
  textButton(this,'回顾',f.x+f.w-100,f.y+10,48,30,()=>this.openJournal(p));
  categories.forEach(([id,label],i)=>this.button(label,left+i*(bw+6),f.y+61,bw,32,()=>{p.category=id;p.scroll=0;this.model.state.questTab=id;this.save();},{active:p.category===id}));
  this.text(({all:'全部记事',active:'进行中',complete:'已完成'})[p.statusFilter]+' · '+quests.length,left,f.y+112,14,'#99a78f');this.text('已追踪 '+tracked.size,left+w,f.y+112,14,'#a69870','right');
  const rows=[];let height=0;const addGroup=(title,items)=>{if(!items.length)return;if(title){rows.push({title,y:height});height+=28;}for(const q of items){rows.push({q,y:height});height+=52;}};
  if(p.category==='main'){addGroup(p.statusFilter==='complete'?'已完成篇章':'当前篇章',quests.filter(q=>!q.longTerm));addGroup('长期目标',quests.filter(q=>q.longTerm));}else addGroup(null,quests);
  p.maxScroll=Math.max(0,height-(bottom-top));p.scroll=clamp(p.scroll||0,0,p.maxScroll);const before=this.hits.length;c.save();c.beginPath();c.rect(left,top,w,bottom-top);c.clip();
  for(const row of rows){const y=top+row.y-p.scroll;if(row.title){this.text(row.title,left+2,y+12,14,'#ac9b76');continue;}const q=row.q,tint=q.complete?'#797a68':questColors[q.taskStatus]||'#b9a478';if(y+46<top||y>bottom)continue;this.box(left,y,w,46,q.complete?'#171d1b':'#202624','#565d4b',2);c.fillStyle=tint;c.fillRect(left+1,y+11,2,24);c.font='16px '+root.PengpaiUI.font;let title=q.title;const titleWidth=w-128;while(title.length>1&&c.measureText(title+'…').width>titleWidth)title=title.slice(0,-1);if(title!==q.title)title+='…';this.text(title,left+14,y+23,16,q.complete?'#999a87':'#e6dcc2');this.text(q.recommendedLevel+'级',left+w-78,y+23,14,'#96a28d','center');this.hits.push({x:left,y,w,h:46,label:q.title,action:()=>{this.panel={type:'taskDetail',questId:q.id,previous:p,scroll:0};this.invalidate();}});
   if(!q.complete){const active=tracked.has(q.id),px=left+w-42,py=y+6;this.box(px,py,34,34,active?'#3d3827':'#1e2923',active?'#ad955e':'#5e6c5b',3);root.PengpaiUI.pin(this,px+3,py+3,28,active);this.hits.push({x:px,y:py,w:34,h:34,label:(active?'取消追踪 ':'追踪 ')+q.title,action:()=>{if(this.model.trackQuest(q.id,!active))this.save();this.invalidate();}});}else this.text('✓',left+w-25,y+23,16,'#87957b','center');
  }
  if(!quests.length)this.text(p.statusFilter==='complete'?'还没有完成的记事':'此页暂无进行中的记事',left+w/2,top+76,16,'#8c8d7c','center');
  c.restore();this.hits=this.hits.filter((h,i)=>i<before||h.y>=top&&h.y+h.h<=bottom);if(p.maxScroll){const available=bottom-top,thumb=Math.max(24,available*available/(available+p.maxScroll));this.box(left+w+7,top+(available-thumb)*p.scroll/p.maxScroll,2,thumb,'#9a8b61',null);}
 }
 function trackerOrder(){
  const p=this.panel,quests=this.model.trackedQuests(),f=this.frame('追踪',Math.min(640,Math.max(220,130+quests.length*64))),left=f.x+18,w=f.w-36,top=f.y+92,bottom=f.y+f.h-18,c=this.ctx;
  p.rowHeight=64;p.partyColumns=[{group:'tracked',x:left,y:top,w,h:bottom-top}];p.scrollLimits={tracked:Math.max(0,quests.length*64-(bottom-top))};p.scrolls||={tracked:0};p.scrolls.tracked=clamp(p.scrolls.tracked||0,0,p.scrollLimits.tracked);const scroll=p.scrolls.tracked,oldHits=this.hits.length;
  this.text('长按任务或拖动右侧手柄排序',left,f.y+66,14,'#a9ad9b');
  const row=(q,index,x,y,ghost=false)=>{this.box(x,y,w,54,ghost?'#343b2d':'#202624',ghost?'#c3aa70':'#565d4b',3);this.text(String(index+1),x+16,y+27,14,'#b7a06e','center');c.font='16px '+root.PengpaiUI.font;let title=q.title;while(title.length>1&&c.measureText(title+'…').width>w-115)title=title.slice(0,-1);this.text(title+(title!==q.title?'…':''),x+34,y+27,16,'#e6dcc2');this.text(q.recommendedLevel+'级',x+w-50,y+27,14,'#99a88e','center');c.fillStyle='#9b9d86';for(let a=0;a<2;a++)for(let b=0;b<3;b++)c.fillRect(x+w-21+a*5,y+19+b*6,2,2);};
  c.save();c.beginPath();c.rect(left,top,w,bottom-top);c.clip();quests.forEach((q,i)=>{const y=top+i*64-scroll;if(y+54<top||y>bottom)return;c.save();if(p.drag?.id===q.id)c.globalAlpha=.25;row(q,i,left,y);c.restore();this.hits.push({x:left,y,w,h:54,kind:'trackedQuest',unitId:q.id,cardX:left,cardY:y,cardW:w,label:'拖动追踪 '+q.title,action:()=>{}});});
  if(!quests.length)this.text('暂无追踪任务',left+w/2,top+40,16,'#8c9786','center');
  if(p.drag?.overGroup==='tracked'){const yy=top+p.drag.slot*64-scroll-4;this.box(left+4,yy,w-8,3,'#ddc38a',null);}c.restore();this.hits=this.hits.filter((h,i)=>{if(i<oldHits)return true;const end=Math.min(bottom,h.y+h.h);h.y=Math.max(top,h.y);h.h=end-h.y;return h.h>0;});
  if(p.drag){const index=quests.findIndex(q=>q.id===p.drag.id);if(index>=0)row(quests[index],index,left,clamp(p.drag.y-p.drag.offsetY,top,bottom-54),true);}if(p.scrollLimits.tracked)this.box(left+w+7,top+(bottom-top-24)*scroll/p.scrollLimits.tracked,2,24,'#9a8b61',null);
 }
 function taskFilter(){
  const p=this.panel,parent=p.previous,f=this.frame('任务筛选',232),left=f.x+20,w=f.w-40;[['active','进行中'],['complete','已完成'],['all','全部记事']].forEach(([id,label],i)=>this.button(label,left,f.y+62+i*50,w,38,()=>{parent.statusFilter=id;parent.scroll=0;this.panel=parent;this.invalidate();},{active:parent.statusFilter===id}));
 }
 function taskDetail(){
  const p=this.panel,offer=p.type==='taskOffer',record=this.model.quests().find(q=>q.id===p.questId),q=record&&{...record,...(offer?{complete:false,objective:p.offerObjective||root.NearbyContent.sideQuests.find(d=>d.id===record.id)?.description||record.objective}: {})};if(!q){this.closeWorldPanel();return;}
  const rewards=taskRewards(this,q),data=root.NearbyContent.sideQuests.find(d=>d.id===q.id),c=this.ctx,measureW=Math.min(460,this.w-28)-44;c.font=`16px ${root.PengpaiUI.font}`;const objectiveRows=root.PengpaiUI.wrapLines(c,q.objective,measureW).length;c.font=`14px ${root.PengpaiUI.font}`;const description=p.offerDescription||((data?.description!==q.objective)?data?.description:null),descriptionRows=description?root.PengpaiUI.wrapLines(c,description,measureW).length:0,rewardCount=rewards.items.length+(rewards.money?1:0),height=62+51+29+objectiveRows*26+14+(descriptionRows?descriptionRows*24+20:0)+(data&&!offer?64:0)+(q.id==='coalition'?42:0)+(rewardCount?48+Math.ceil(rewardCount/Math.max(3,Math.floor(measureW/86)))*116:0)+(rewards.recruits.length?24+rewards.recruits.length*88:0)+75;
  const f=this.frame(q.title,Math.min(690,Math.max(400,height))),left=f.x+22,w=f.w-44,top=f.y+62,bottom=f.y+f.h-75,target=questTarget(this,q),place=root.WorldData.placeMap[target];
  const oldHits=this.hits.length;c.save();c.beginPath();c.rect(left,top,w,bottom-top);c.clip();let y=top-(p.scroll||0);
  this.text((q.complete?'已完成':q.taskStatus==='ready'?'可交付':'推荐 '+q.recommendedLevel+' 级')+(place?'  ·  '+place.name:''),left,y+12,14,'#ada88f');y+=51;
  this.text('任务目标',left,y,16,'#d8c18b');y=this.wrap(q.objective,left,y+29,w,{size:16,line:26,color:'#e0dfce'})+14;
  if(description)y=this.wrap(description,left,y,w,{size:14,line:24,color:'#a6afa3'})+20;
  if(data&&!offer){const state=this.model.state.quests.side[q.id],value=Math.min(1,(state?.wins||0)/data.rounds);bar(this,left,y,w,5,value,'#b9a271');this.text((state?.wins||0)+' / '+data.rounds+' 战',left,y+23,14,'#bcb795');y+=64;}
  if(q.id==='coalition'){this.text('魏 '+this.model.counts().wei+'/3    蜀 '+this.model.counts().shu+'/3    吴 '+this.model.counts().wu+'/3',left,y,16,'#c9b786');y+=42;}
  if(rewards.money||rewards.items.length){this.text('任务奖励',left,y,16,'#d8c18b');y+=24;const cols=Math.max(3,Math.floor(w/86)),cw=w/cols,entries=[...(rewards.money?[{money:rewards.money}]:[]),...rewards.items.map(item=>({item}))];
   entries.forEach((entry,i)=>{const xx=left+i%cols*cw,yy=y+Math.floor(i/cols)*116,size=48;if(entry.money){this.box(xx+(cw-size)/2,yy+5,size,size,'#221f17','#a38d58',3);icon(this,'金币',xx+(cw-size)/2+6,yy+11,36);this.text(entry.money+' 文',xx+cw/2,yy+72,14,'#e0c58a','center');}else{const item=entry.item;itemIcon(this,item,xx+(cw-size)/2,yy+5,size);this.text(item.name,xx+cw/2,yy+72,14,color(item),'center');this.text(I.typeLabel(item),xx+cw/2,yy+94,14,'#8fa49a','center');this.hits.push({x:xx,y:yy,w:cw,h:108,label:'奖励详情 '+item.name,action:()=>this.openItemDetail(item,{previous:p,readonly:true})});}});y+=Math.ceil(entries.length/cols)*116+24;
  }
  if(rewards.recruits.length){this.text('同行之缘',left,y,16,'#d8c18b');y+=24;for(const recruit of rewards.recruits){const art=root.CharacterAssets?.resolve(recruit.id)?.portrait;this.box(left,y,w,76,'#222825','#6b6951',3);if(art)this.portrait(art,left+10,y+10,54);this.text(recruit.name,left+78,y+27,18,'#dfcfaa');this.text('完成故事后，可商议同行',left+78,y+53,14,'#a6b3a4');this.hits.push({x:left,y,w,h:76,label:'观察 '+recruit.name,action:()=>{const unit=this.model.members().find(u=>u.id===recruit.id)||this.model.npcUnit(recruit.id)||root.RecruitmentContent.companion(recruit.id,this.model.character.level);if(unit){this.panel={type:'character',unitId:unit.id,unit,readonly:true,previous:p};this.invalidate();}}});y+=88;}}
  if(!rewards.money&&!rewards.items.length&&!rewards.recruits.length){this.text('后续',left,y,16,'#d8c18b');y=this.wrap(q.id==='coalition'?'三国人手齐备后，洛阳战线将开启。':'完成眼前的事，继续新的旅程。',left,y+29,w,{size:14,line:24,color:'#abb4a5'});}
  p.maxScroll=Math.max(0,y+(p.scroll||0)+12-bottom);p.scroll=clamp(p.scroll||0,0,p.maxScroll);c.restore();this.hits=this.hits.filter((hit,i)=>i<oldHits||hit.y>=top&&hit.y+hit.h<=bottom);
  if(offer){const bw=(w-10)/2;this.button('稍后再说',left,f.y+f.h-56,bw,36,()=>{this.panel=p.previous||null;this.invalidate();});this.button(q.category==='side'?'接下委托':'答应相助',left+bw+10,f.y+f.h-56,bw,36,()=>{p.onAccept();this.invalidate();},{active:true});return;}
  const returnLabel=p.previous?.type==='tasks'?'返回手记':'返回场景';this.button(q.complete?returnLabel:place?'前往 '+place.name:returnLabel,left,f.y+f.h-56,w,36,()=>{if(q.complete||!place)this.panel=p.previous||null;else goQuest(this,q);this.invalidate();},{active:!q.complete&&!!place});
 }
 const handlers={character,characterDetails:details,tasks,taskFilter,trackerOrder,party,memberActions,formation,inventory,inventoryFilter,inventorySort,shop:inventory,reward,taskDetail,taskOffer:taskDetail,itemDetail,bulkSell};
 const api={displayAttribute,icon,iconButton,textButton,bar,itemIcon,questIcon,questColors,draw(v){if(root.TrophyPanels?.draw(v))return true;const p=v.panel,fn=handlers[p?.type];if(!fn)return false;if(['itemDetail','bulkSell'].includes(p.type)&&handlers[p.previous?.type]){v.panel=p.previous;try{handlers[p.previous.type].call(v);}finally{v.panel=p;}}fn.call(v);return true;}};root.WorldPanels=api;if(node)module.exports=api;
})(globalThis);
