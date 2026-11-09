(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,I=node?require('./items.js'):root.ItemCatalog,E=node?require('./engine.js'):root.BattleEngine,X=node?require('./experience.js'):root.CharacterExperience,C=node?require('./weapon-catalog.js'):root.WeaponCatalog;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),color=i=>I.qualities[i?.quality]?.color||'#a9b9bc',slots=[['weapon','武器'],['armor','盔甲'],['accessory1','饰品'],['accessory2','饰品']];
 const questColors={available:'#59dce5',active:'#f3f6f4',ready:'#e9c365'};
 function questIcon(v,status,x,y,size=25){const tint=questColors[status];if(!tint)return;const c=v.ctx,pulse=.5+.5*Math.sin(performance.now()*.004),glow=status==='active'?4:7+5*pulse;c.save();c.shadowColor=tint;c.shadowBlur=glow;v.box(x,y,size,size,'#10232bf5',tint,4);c.shadowBlur=0;c.globalAlpha*=.45;icon(v,'任务',x+2,y+2,size-4);c.restore();c.save();c.shadowColor='#06131c';c.shadowBlur=3;v.text('!',x+size*.5,y+size*.53,size*1.04,tint,'center');c.restore();if(status!=='active'){c.save();c.globalAlpha=.3+.45*pulse;v.box(x-2-pulse,y-2-pulse,size+4+2*pulse,size+4+2*pulse,'#0000',tint,5);c.restore();}}
 function icon(v,id,x,y,size,tint){root.RpgIcons.draw(v.ctx,id,x,y,size,{image:src=>v.image(src),disabled:tint==='#425966'});}
 function iconButton(v,label,x,y,size,action,active=false){v.box(x,y,size,size,active?'#61502b':'#0c2531ed',active?'#e3c384':'#7d959b',4);icon(v,label,x+5,y+5,size-10,active?'#ffe2a2':'#d5e5df');v.hits.push({x,y,w:size,h:size,label,action});}
 function bar(v,x,y,w,h,value,fill='#40aab9',trail=value){v.box(x,y,w,h,'#07151e','#557780',3);v.ctx.fillStyle='#ecedce';v.ctx.fillRect(x+2,y+2,(w-4)*clamp(trail,0,1),h-4);v.ctx.fillStyle=fill;v.ctx.fillRect(x+2,y+2,(w-4)*clamp(value,0,1),h-4);}
 function itemIcon(v,item,x,y,size,empty){const tint=color(item);v.box(x,y,size,size,'#0a1d28',item?tint:'#3e5865',4);icon(v,root.RpgIcons.resolveItem(item,empty),x+7,y+7,size-14,item?tint:'#425966');}
 function character(){
  const p=this.panel,members=this.model.members(),u=p.unit||members.find(u=>u.id===p.unitId);
  if(!u){this.closeWorldPanel();return;}
  const previewKey=JSON.stringify(u);if(p.previewKey!==previewKey){p.previewKey=previewKey;p.previewCache=this.memberPreview(u);}const preview=p.previewCache,actor=preview.unit(u.id),current=preview.effective(actor),ids=actor.skills,passives=root.PengpaiRules.sortPassives(actor.passives,preview.passives),c=this.ctx;
  const showPotential=!!u.potentials&&(!p.readonly||root.CharacterGrowth.isGeneral(u)),statsH=108,showExperience=this.options?.showExperience!==false&&members.some(member=>member.id===u.id);
  const compact=this.h<640,width=Math.min(560,this.w-16),inner=width-28,headerH=compact?64:68,skillSize=compact?48:52,skillRowH=compact?60:64,footerH=compact?42:46,barH=showExperience?(compact?32:36):17,skillCols=Math.min(3,Math.max(1,ids.length)),skillRows=Math.ceil(ids.length/skillCols),passiveH=root.PengpaiUI.passiveHeight(passives.map(id=>preview.passives[id]),width-28);
  const fixed=headerH+skillRows*skillRowH+passiveH+statsH+4+barH+footerH,modelH=clamp(Math.min(440,inner*1.18,this.h-16-fixed),180,440),contentH=modelH+skillRows*skillRowH+passiveH+statsH+4+barH;
  const f=this.frame(u.name+'  '+u.level+'级',fixed+modelH,{titleAlign:'center',maxWidth:560,inset:8,verticalInset:8}),left=f.x+14,top=f.y+headerH,bottom=f.y+f.h-footerH,slotSize=Math.min(46,Math.floor(modelH/4)-5),slotGap=Math.min(12,(modelH-slotSize*4)/3),equipmentOffset=(modelH-slotSize*4-slotGap*3)/2,proto=root.BattleSystem.CanvasBattle.prototype;
  const profession=I.profession(u),type=profession?C.types.find(t=>t.id===profession.weaponType):null,group=C.groups.find(g=>g.id===type?.group);this.text((type?group.name+' · '+type.name:'自由职业')+(u.origin==='tavern'?' · '+root.TavernRecruitment.gradeOf(u).name:''),f.x+f.w/2,f.y+51,14,'#cbb586','center');
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
  pairs.forEach((row,i)=>{const yy=y+i*27+13.5;for(let col=0;col<row.length/2;col++){const x=left+col*(cw+gap),key=row[col*2],label=row[col*2+1],potential=showPotential?u.potentials?.[key]:null;if(potential!=null){this.text(label+' '+Number(current[key].toFixed(2)),x+6,yy,14,'#eddfc0');this.text(potential+'(+'+Number(root.CharacterGrowth.growthPerLevel(potential).toFixed(2))+')',x+cw-6,yy,14,'#d6bb8b','right');}else{this.text(label,x+6,yy,14,'#a9bec3');this.text(key==='stunProtection'?'抵抗':Number(current[key].toFixed(2)),x+cw-6,yy,16,'#eddfc0','right');}}});
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
  const groups=C.groupedTypes(),columns=Math.min(3,Math.max(2,Math.floor((Math.min(460,this.w-28)-32)/100))),canLeave=this.options?.allowDismiss!==false&&!p.readonly&&u.id!=='hero'&&!u.guest,contentH=28+root.PengpaiRules.ATTRIBUTES.length*30+12+24+60+12+24+groups.reduce((n,g)=>n+28+Math.ceil(g.types.length/columns)*38+12,0);
  const f=this.frame(u.name+' · 详细属性',58+contentH+(canLeave?54:18)),left=f.x+20,w=f.w-40,top=f.y+58,bottom=f.y+f.h-(canLeave?54:18),c=this.ctx;
  p.maxScroll=Math.max(0,contentH-(bottom-top));p.scroll=clamp(p.scroll||0,0,p.maxScroll);let y=top-p.scroll;const beforeHits=this.hits.length;
  c.save();c.beginPath();c.rect(left,top,w,bottom-top);c.clip();
  this.text('属性',left,y+10,14,'#aec5ce');this.text('当前',left+w*(showPotential ? .58 : 1),y+10,14,'#aec5ce','right');if(showPotential)this.text('潜力(每级)',left+w,y+10,14,'#d6bb8b','right');y+=28;
  for(const [key,label]of root.PengpaiRules.ATTRIBUTES){this.box(left,y,w,27,'#15313b',null);this.text(label,left+8,y+13.5,14);this.text(Number(current[key].toFixed(2)),left+w*(showPotential ? .58 : 1)-(showPotential?0:8),y+13.5,16,'#f4e0b3','right');if(showPotential)this.text(u.potentials?.[key]!=null?u.potentials[key]+'('+Number(root.CharacterGrowth.growthPerLevel(u.potentials[key]).toFixed(2))+')':'—',left+w-8,y+13.5,14,'#d6bb8b','right');y+=30;}
  y+=12;this.text('防护',left,y+10,14,'#aec5ce');this.text('当前',left+w*.58,y+10,14,'#aec5ce','right');this.text('对应减伤',left+w,y+10,14,'#aec5ce','right');y+=24;
  for(const [label,value,kind]of [['护甲',current.armor,'物理'],['抗性',current.resistance,'计策']]){
   const percent=((1-E.mitigation(value))*100).toFixed(2).replace(/\.?0+$/,'');
   this.box(left,y,w,27,'#15313b',null);this.text(label,left+8,y+13.5,14,'#b8cbd0');this.text(value,left+w*.58,y+13.5,16,'#f4e0b3','right');this.text(kind+' '+percent+'%',left+w-8,y+13.5,14,'#e0cf9f','right');y+=30;
  }
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
  this.button(p.sortMode?'完成排序':'排序',f.x+f.w-120,f.y+9,70,30,()=>{p.sortMode=!p.sortMode;},{active:!!p.sortMode});
  this.text('出战 '+groups.active.length+'/'+this.model.activeLimit(),left+cw/2,f.y+61,14,'#e4cf9b','center');this.text('替补 '+groups.reserve.length,left+cw+gap+cw/2,f.y+61,14,'#b6cbd0','center');c.fillStyle='#425c6266';c.fillRect(left+cw+gap/2-.5,f.y+50,1,f.h-68);
  const button=(label,fullLabel,x,y,w,h,action,disabled=false)=>{const n=this.hits.length;this.button(label,x,y,w,h,action,{disabled});if(this.hits.length>n)this.hits.at(-1).label=fullLabel;};
  for(const column of p.partyColumns){const group=column.group,items=groups[group];p.scrollLimits[group]=Math.max(0,items.length*p.rowHeight-column.h);p.scrolls[group]=clamp(p.scrolls[group]||0,0,p.scrollLimits[group]);const before=this.hits.length;
   c.save();c.beginPath();c.rect(column.x,column.y,column.w,column.h);c.clip();
   if(!items.length)this.text('暂无替补',column.x+cw/2,top+35,14,'#78949e','center');
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
  const p=this.panel,item=p.equipped&&!p.readonly?this.model.equipped(p.unitId,p.slot):p.item;if(!item){this.closeWorldPanel();return;}
  const labels={war:'武力',intelligence:'智力',constitution:'体质',speed:'速度',technique:'技巧',armor:'护甲',resistance:'抗性',healingBonus:'治疗效果',hitBonus:'命中率',criticalBonus:'暴击率',dodge:'闪避率',armorPenetration:'忽视护甲',resistancePenetration:'忽视抗性',physicalLifesteal:'物理吸血',unload:'卸力'},rows=[];
  const classification=C.classification(item);if(classification){rows.push(['职业',classification.group?.name||'其他']);rows.push(['流派',classification.type.name]);}
  if(item.slot==='weapon'||item.type)rows.push(['武器威力',item.power??item.attack??p.fallbackPower??0]);
  for(const [key,value]of Object.entries(item.attributes||{}))rows.push([labels[key]||key,(value>=0?'+':'')+(['healingBonus','hitBonus','criticalBonus','dodge','physicalLifesteal'].includes(key)?Math.round(value*100)+'%':value)]);if(item.statusImmunities?.length)rows.push(['状态免疫',item.statusImmunities.map(id=>root.BattleStatuses.definitions[id]?.name||id).join('、')]);if(item.unique)rows.push(['获取',item.acquisition]);
  if(item.questItem)rows.push(['用途','任务道具']);
  const target=this.model.members().find(u=>u.id===(p.unitId||'hero')),canAct=!item.questItem&&!p.readonly&&!this.model.pending&&!this.model.journey;let action,label;
  if(canAct&&p.transaction==='buy'){label='购买 '+item.price+'文';action=()=>{if(this.model.buyItem(item.templateId)){this.save();this.panel=p.previous;this.notify('已购入 '+item.name);}else this.notify('铜钱不足。');};}
  else if(canAct&&p.transaction==='sell'&&this.model.state.inventory.some(i=>i.uid===item.uid)){label='出售 '+I.sellPrice(item)+'文';action=()=>{if(this.model.sellItem(item.uid)){this.save();this.panel=p.previous;this.notify('已出售 '+item.name);}};}
  else if(canAct&&target&&p.equipped){label='卸下';action=()=>{if(this.model.changeEquipment(target.id,p.slot,null)){this.save();this.panel=p.previous;}};}
  else if(canAct&&target&&this.model.state.inventory.some(i=>i.uid===item.uid)){const slot=p.slot||(item.slot==='accessory'?(!target.equipment?.accessory1?'accessory1':'accessory2'):item.slot);if(I.compatible(item,slot)&&I.canEquip(target,item)){label='装备';action=()=>{if(this.model.changeEquipment(target.id,slot,item.uid)){this.save();this.panel=p.previous?.slot&&p.previous.previous?.type==='character'?p.previous.previous:p.previous;}};}}
  const canReplace=canAct&&target&&p.equipped;
  this.ctx.font='14px '+root.PengpaiUI.font;const descriptionH=item.description?root.PengpaiUI.wrapLines(this.ctx,item.description,Math.min(380,this.w-28)-40).length*22+12:0;
  const f=this.frame('',118+rows.length*32+descriptionH+(p.transaction?28:0)+(action?54:0)+(canReplace?44:0),{closable:false,maxWidth:380}),left=f.x+20,w=f.w-40;
  itemIcon(this,item,left,f.y+20,64);this.text(item.name,left+80,f.y+40,18,color(item));this.text(I.qualities[item.quality]?.name||'普通',left+80,f.y+69,14,color(item));this.box(left,f.y+101,w,1,'#48616b',null);
  rows.forEach(([name,value],i)=>{const y=f.y+110+i*32;this.box(left,y,w,28,'#15313b',null,3);this.text(name,left+10,y+14,14,'#b5cbd0');this.text(value,left+w-10,y+14,16,'#f0deba','right');});
  if(item.description)this.wrap(item.description,left,f.y+116+rows.length*32,w,{size:14,line:22,color:'#c5d3d5'});
  if(p.transaction)this.text(this.model.state.money+' 文',left,f.y+114+rows.length*32,14,'#e2c380');
  if(canReplace)this.button('更换',left,f.y+f.h-92,w,32,()=>{this.panel={type:'inventory',unitId:target.id,slot:p.slot,scroll:0,previous:p.previous};});
  if(action)this.button(label,left,f.y+f.h-48,w,32,action);
  this.hits.unshift({x:0,y:0,w:this.w,h:this.h,label:'关闭装备详情',action:()=>this.closeWorldPanel()});
 }
 function inventory(){
  const p=this.panel,shop=p.type==='shop',selling=shop&&p.shopMode==='sell',prefs=preferences(this,p),source=shop&&!selling?(p.shopItems||=I.shopTemplates().map(id=>I.create(id,'white','shop-'+id))):shop||p.slot?this.model.state.inventory:[...this.model.state.inventory,...root.StoryRules.itemRecords(this.model)],query={...prefs,slot:p.slot||prefs.slot,types:p.slot&&p.slot!=='weapon'?[]:prefs.types},queryKey=JSON.stringify(query);
  if(p.itemSource!==source||p.itemLength!==source.length||p.queryKey!==queryKey){p.itemSource=source;p.itemLength=source.length;p.queryKey=queryKey;p.items=I.select(source,query).filter(item=>!p.slot||I.canEquip(this.model.members().find(u=>u.id===p.unitId),item));}
  const items=p.items;if(p.selected&&!items.some(item=>item.uid===p.selected))p.selected=null;
  const f=this.frame(p.slot?'选择'+slots.find(s=>s[0]===p.slot)[1]:shop?(selling?'出售':'购买'):'背包',600),left=f.x+16,w=f.w-32,c=this.ctx,top=f.y+(shop?122:82),bottom=f.y+f.h-(selling?64:16),cols=Math.max(3,Math.floor(w/76)),cw=(w-8*(cols-1))/cols,rowH=100;
  iconButton(this,'筛选',f.x+f.w-120,f.y+9,30,()=>{this.panel={type:'inventoryFilter',inventory:p,previous:p,scroll:0};},!!(prefs.qualities.length||prefs.types.length||prefs.slot!=='all'));
  iconButton(this,'排序',f.x+f.w-82,f.y+9,30,()=>{this.panel={type:'inventorySort',inventory:p,previous:p,scroll:0};});
  if(shop){const bw=(w-8)/2;for(const [i,mode]of ['buy','sell'].entries())this.button(mode==='buy'?'购买':'出售',left+i*(bw+8),f.y+49,bw,30,()=>{p.shopMode=mode;p.selected=null;p.scroll=0;},{active:(p.shopMode||'buy')===mode});}
  if(!p.slot)this.text(this.model.state.money+' 文',left,f.y+(shop?98:59),14,'#e2c380');
  this.text(items.length+' 件',left+w,f.y+(shop?98:59),14,'#a9bdc4','right');
  p.maxScroll=Math.max(0,Math.ceil(items.length/cols)*rowH-(bottom-top));p.scroll=clamp(p.scroll||0,0,p.maxScroll);const before=this.hits.length,first=Math.floor(p.scroll/rowH)*cols,end=Math.min(items.length,Math.ceil((p.scroll+bottom-top)/rowH)*cols);
  c.save();c.beginPath();c.rect(left,top,w,bottom-top);c.clip();
  for(let i=first;i<end;i++){const item=items[i],x=left+(i%cols)*(cw+8),y=top+Math.floor(i/cols)*rowH-p.scroll;if(p.selected===item.uid)this.box(x,y,cw,88,'#c6b26a14','#e6d295',3);itemIcon(this,item,x+(cw-44)/2,y+8,44);this.text(item.name,x+cw/2,y+70,14,color(item),'center');this.hits.push({x,y,w:cw,h:88,label:'选择 '+item.name,action:()=>{p.selected=item.uid;this.openItemDetail(item,{unitId:p.unitId,slot:p.slot,...(shop?{transaction:selling?'sell':'buy'}:{}),readonly:!!item.questItem,previous:p});}});}
  c.restore();this.hits=this.hits.filter((hit,i)=>i<before||hit.y>=top&&hit.y+hit.h<=bottom);
  if(p.maxScroll){const h=bottom-top,thumb=Math.max(22,h*h/(h+p.maxScroll)),y=top+(h-thumb)*p.scroll/p.maxScroll;this.box(left+w-3,y,3,thumb,'#78959e',null,1);}
  if(!items.length)this.text(source.length?'没有符合条件的装备':p.slot?'没有可更换的装备':selling?'没有可出售的装备':'背包是空的',f.x+f.w/2,(top+bottom)/2,14,'#8fa6af','center');
  if(selling)this.button('批量出售'+(items.length?' '+items.length+'件':''),left,f.y+f.h-48,w,32,()=>{this.notice=null;this.panel={type:'bulkSell',items:[...items],previous:p};},{disabled:!items.length});
 }
 function bulkSell(){
  const p=this.panel,items=p.items,total=items.reduce((sum,item)=>sum+I.sellPrice(item),0),f=this.frame('批量出售',266),left=f.x+20,w=f.w-40,prefs=preferences(this,p.previous),types=root.PengpaiRules.WEAPON_TYPES;
  const filters=[...prefs.qualities.map(q=>({white:'白色',green:'绿色',blue:'蓝色',orange:'橙色',red:'红色'}[q])),...prefs.types.map(id=>types.find(t=>t.id===id)?.name||id)];if(!filters.length&&prefs.slot!=='all')filters.push({weapon:'武器',armor:'盔甲',accessory:'饰品'}[prefs.slot]);
  this.text(filters.join(' · ')||'全部未穿戴装备',left,f.y+65,14,'#b4c9ce');this.text('装备',left,f.y+101,14,'#b4c9ce');this.text(items.length+' 件',left+w,f.y+101,16,'#e8d8b5','right');this.text('总售价',left,f.y+133,14,'#b4c9ce');this.text(total+' 文',left+w,f.y+133,16,'#e2c380','right');this.text('当前金钱 '+this.model.state.money+' 文',left,f.y+170,14,'#e2c380');
  this.button('出售',left,f.y+f.h-54,w,36,()=>{const sold=this.model.sellItems(items.map(i=>i.uid));this.panel=p.previous;if(sold){this.panel.selected=null;this.panel.scroll=0;this.save();this.notify('已出售 '+sold.count+' 件装备');}else this.notify('装备列表已变化，请重新选择。');});this.dismissOutside(f,()=>this.closeWorldPanel());
 }
 function inventoryFilter(){
  const p=this.panel,parent=p.inventory,prefs=preferences(this,parent),sections=[{title:'品质',key:'qualities',values:[['all','全部'],...Object.keys(I.qualities).map(id=>[id,{white:'白色',green:'绿色',blue:'蓝色',orange:'橙色',red:'红色'}[id]])],cols:3}];
  if(!parent.slot)sections.push({title:'装备类型',key:'slot',values:[['all','全部'],['weapon','武器'],['armor','盔甲'],['accessory','饰品']],cols:4});
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
  const p=this.panel,r=p.reward,gains=r.gains||[],masteries=r.proficiencies||[],items=r.items||[],members=this.model.members(),ids=[...new Set([...gains.map(g=>g.id),...masteries.map(g=>g.id)])],cards=ids.map(id=>({id,gain:gains.findIndex(g=>g.id===id),masteries:masteries.flatMap((g,i)=>g.id===id?[i]:[])})),startOffset=r.progress?90:58;
  const width=Math.min(460,this.w-28)-36,cols=Math.max(3,Math.floor(width/76)),cw=(width-8*(cols-1))/cols,cardBlock=cards.reduce((n,card)=>n+96+card.masteries.length*48,0),reported=r.reportedNames||[],contentH=cardBlock+(cards.length?8:0)+reported.length*26+44+(items.length?28+Math.ceil(items.length/cols)*88:0),f=this.frame(r.title||(r.completedQuest?'委托完成':'战斗胜利'),startOffset+contentH+69,{closable:false}),c=this.ctx,left=f.x+18,w=f.w-36,start=f.y+startOffset,bottom=f.y+f.h-69,elapsed=Math.max(0,performance.now()-p.started);
  if(!p.tracks){p.tracks=gains.map(g=>new root.BattlePresentation.ExperienceTrack(g,{required:X.required,maxLevel:X.maxLevel}));p.masteryTracks=masteries.map(g=>new root.BattlePresentation.ExperienceTrack(g,{required:root.WeaponProficiency.required}));p.animationDuration=Math.max(0,...[...p.tracks,...p.masteryTracks].map(t=>t.duration));}
  if(r.progress){bar(this,left,f.y+53,w,17,r.progress.value,'#528e92');this.text(r.progress.label+' '+Math.round(r.progress.value*100)+'%',f.x+f.w/2,f.y+61,14,'#e6d9b2','center');}
  p.maxScroll=Math.max(0,contentH-(bottom-start));p.scroll=clamp(p.scroll||0,0,p.maxScroll);const before=this.hits.length;c.save();c.beginPath();c.rect(left,start,w,bottom-start);c.clip();let y=start-p.scroll;
  for(const card of cards){const g=gains[card.gain],u=members.find(u=>u.id===card.id),sample=g?p.tracks[card.gain].sample(elapsed):{level:u?.level||1,xp:u?.experience||0,need:X.required(u?.level||1),fraction:(u?.experience||0)/X.required(u?.level||1)},height=84+card.masteries.length*48;
   this.box(left,y,w,height,'#112e39','#365867',4);if(u?.portrait)this.portrait(u.portrait,left+8,y+10,42);this.text(g?.name||u?.name||card.id,left+59,y+18,16,'#e6dcc4');this.text('经验 +'+(g?.amount||0),left+w-10,y+18,14,'#e4c37c','right');this.text(sample.level+'级'+(g&&sample.level>g.before?'  升级':''),left+59,y+40,14,g&&sample.level>g.before?'#f0d187':'#a4bbc3');bar(this,left+10,y+56,w-20,14,sample.fraction,'#b89d53',sample.trail??sample.fraction);this.text(X.display(sample.xp)+' / '+(sample.need===Infinity?'—':sample.need),left+w/2,y+63,14,'#f1e4c6','center');
   card.masteries.forEach((index,i)=>{const gain=masteries[index],yy=y+80+i*48,sample=p.masteryTracks[index].sample(elapsed),name=root.PengpaiRules.WEAPON_TYPES.find(t=>t.id===gain.type)?.name||gain.type;this.text(name+'熟练 '+sample.level,left+10,yy+10,14,'#a8dfcf');this.text('+'+gain.amount,left+w-10,yy+10,14,'#a8dfcf','right');bar(this,left+10,yy+26,w-20,13,sample.fraction,'#4baf97',sample.trail);this.text(X.display(sample.xp)+' / '+sample.need,left+w/2,yy+32.5,14,'#d8f0d8','center');});y+=height+12;
  }
  if(cards.length)y+=8;for(const name of reported){this.text(name,left+8,y+12,14,'#d6e0d7');y+=26;}this.box(left,y,w,44,'#102b34','#38565d',4);icon(this,'金币',left+8,y+7,30);this.text('+'+(r.money||0)+' 文',left+48,y+22,16,'#e8ce8a');y+=44;
  if(items.length){this.text('获得物品',left,y+16,14,'#b9ccd0');y+=28;items.forEach((item,i)=>{const x=left+(i%cols)*(cw+8),yy=y+Math.floor(i/cols)*88;itemIcon(this,item,x+(cw-44)/2,yy+3,44);this.text(item.name,x+cw/2,yy+64,14,color(item),'center');this.hits.push({x,y:yy,w:cw,h:80,label:'战利品 '+item.name,action:()=>this.openItemDetail(item,{previous:p})});});}
  c.restore();this.hits=this.hits.filter((h,i)=>i<before||h.y>=start&&h.y+h.h<=bottom);
  const context=this.model.state.afterBattle,q=context?.kind==='side'?this.model.state.quests.side[context.questId]:null,data=context?.kind==='side'?root.NearbyContent.sideQuests.find(t=>t.id===context.questId):null,canContinue=q&&q.wins<data.rounds;this.button(canContinue?'继续剿匪':'继续',left,f.y+f.h-51,canContinue?(w-10)/2:w,36,()=>this.finishReward(canContinue?context.questId:null));if(canContinue)this.button('暂歇',left+(w+10)/2,f.y+f.h-51,(w-10)/2,36,()=>this.finishReward());
 }
 function tasks(){
  const p=this.panel;this.model.readQuests();p.category||=this.model.state.questTab;const quests=this.model.quests().filter(q=>q.category===p.category&&(q.category==='main'||q.id==='changshan'||q.heard||q.accepted||q.complete)),f=this.frame('任务',600),left=f.x+18,w=f.w-36,top=f.y+108,bottom=f.y+f.h-18,c=this.ctx,categories=[['main','主线'],['story','剧情'],['side','支线']],bw=(w-12)/3;
  categories.forEach(([id,label],i)=>this.button(label,left+i*(bw+6),f.y+58,bw,33,()=>{p.category=id;p.scroll=0;this.model.state.questTab=id;this.save();},{active:p.category===id}));p.maxScroll=Math.max(0,quests.reduce((n,q)=>n+(q.complete?64:166),0)-(bottom-top));p.scroll=clamp(p.scroll||0,0,p.maxScroll);const before=this.hits.length;c.save();c.beginPath();c.rect(left,top,w,bottom-top);c.clip();let y=top-p.scroll;
  for(const q of quests){this.box(left,y,w,q.complete?52:154,'#102e39',q.complete?'#5b927b':'#4a6875');if(!q.complete)questIcon(this,q.taskStatus,left+9,y+9,25);this.text(q.title,left+(q.complete?12:43),y+(q.complete?26:22),16,'#e5d2a4');this.text(q.complete?'已完成':'推荐 '+q.recommendedLevel+' 级',left+w-12,y+(q.complete?26:22),14,q.complete?'#8ed6a8':'#b9c8c9','right');if(q.complete){y+=64;continue;}
   this.wrap((q.heard&&!q.accepted?'线索：':'')+q.objective,left+12,y+52,w-24,{size:14,line:23});if(q.id==='coalition')this.text('魏 '+this.model.counts().wei+'/3　蜀 '+this.model.counts().shu+'/3　吴 '+this.model.counts().wu+'/3',left+12,y+126,14,'#bcd1d5');else{const data=root.NearbyContent.sideQuests.find(t=>t.id===q.id),target=q.id==='changshan'?this.model.questDestination():q.target||(q.accepted?data?.place:data?.giverPlace);if(target)this.button('前往 '+root.WorldData.placeMap[target].name,left+12,y+112,w-24,29,()=>{this.panel=null;if(target===this.model.state.nodeId){if(!this.model.state.inside)this.tryEnter();else{const npc=this.model.questNpc(q.id);if(npc)this.interact(npc);}}else{this.model.leave();this.save();this.travel(target);}this.invalidate();});}y+=166;
  }
  c.restore();this.hits=this.hits.filter((h,i)=>i<before||h.y>=top&&h.y+h.h<=bottom);
 }
 const handlers={character,characterDetails:details,tasks,party,memberActions,formation,inventory,inventoryFilter,inventorySort,shop:inventory,reward,itemDetail,bulkSell};
 const api={icon,iconButton,bar,itemIcon,questIcon,questColors,draw(v){const p=v.panel,fn=handlers[p?.type];if(!fn)return false;if(['itemDetail','bulkSell'].includes(p.type)&&handlers[p.previous?.type]){v.panel=p.previous;try{handlers[p.previous.type].call(v);}finally{v.panel=p;}}fn.call(v);return true;}};root.WorldPanels=api;if(node)module.exports=api;
})(globalThis);
