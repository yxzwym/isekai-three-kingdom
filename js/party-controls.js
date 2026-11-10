(function(root){
 'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),inside=(p,r)=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;
 const panelFor=view=>view.panel||(view.dialogue||view.journey||view.battle||view.model?.state.trackerCollapsed?null:view.trackerDragPanel),supported=p=>['party','trackerOrder','trackerHud','tasks'].includes(p?.type),groups=view=>panelFor(view)?.type==='trackerOrder'||panelFor(view)?.type==='trackerHud'?{tracked:view.model.trackedQuests()}:panelFor(view)?.type==='tasks'?{tasks:panelFor(view).taskItems||[]}:view.model.partyGroups();
 const columnAt=(panel,point)=>(panel.partyColumns||[]).find(c=>inside(point,c));
 function drop(view){
  const p=panelFor(view),d=p?.drag;if(!d)return;const column=columnAt(p,d);d.overGroup=column?.group||null;if(!column)return;
  const group=groups(view)[column.group],position=d.y-column.y+(p.scrolls[column.group]||0),slot=column.itemTops?column.itemTops.filter(top=>position>=top+p.rowHeight/2).length:clamp(Math.floor((position+p.rowHeight/2)/p.rowHeight),0,group.length),source=group.findIndex(u=>u.id===d.id);
  d.slot=slot;d.index=source>=0&&source<slot?slot-1:slot;
 }
 function down(view,e){
  const p=panelFor(view);if(!supported(p)||view.battle||view.press||e.button!==0||e.isPrimary===false)return false;const point=view.point(e),column=columnAt(p,point);if(!column)return false;if(view.drawnRevision!==view.revision)return true;
  const hit=[...view.hits].reverse().find(h=>inside(point,h)),press=view.press={party:true,id:e.pointerId,x:point.x,y:point.y,point,column:column.group,start:p.scrolls[column.group]||0,panel:p,hit,revision:view.revision,moved:false,dragging:false};view.canvas.setPointerCapture?.(e.pointerId);
  if(['partyMember','trackedQuest','taskQuest'].includes(hit?.kind)){
   const beginDrag=()=>{if(view.press!==press||panelFor(view)!==p||press.moved||view.disposed)return;press.dragging=true;p.drag={id:hit.unitId,sourceGroup:column.group,x:press.point.x,y:press.point.y,offsetX:press.x-hit.cardX,offsetY:press.y-hit.cardY,w:hit.cardW,lastTick:performance.now()};drop(view);view.invalidate();};if(hit.dragHandle?inside(point,hit.dragHandle):point.x>=hit.cardX+hit.cardW-36)beginDrag();else{view.partyPressTimer=setTimeout(beginDrag,250);view.partyPressTimer?.unref?.();}
  }return true;
 }
 function move(view,e){
  const press=view.press;if(!press?.party)return false;if(press.id!==e.pointerId)return true;const p=press.panel;if(panelFor(view)!==p){cancel(view);return true;}const point=view.point(e);press.point=point;
  if(press.dragging){Object.assign(p.drag,point);drop(view);view.invalidate();return true;}
  if(Math.hypot(point.x-press.x,point.y-press.y)>7){press.moved=true;clearTimeout(view.partyPressTimer);p.scrolls[press.column]=clamp(press.start-(point.y-press.y),0,p.scrollLimits[press.column]||0);view.invalidate();}return true;
 }
 function cancel(view){clearTimeout(view.partyPressTimer);view.partyPressTimer=null;if(view.press?.party&&view.press.panel){const p=view.press.panel;p.drag=null;if(p.type==='trackerHud'){const offset=clamp(Math.round(p.scrolls.tracked/p.rowHeight),0,Math.round(p.scrollLimits.tracked/p.rowHeight));p.scrolls.tracked=offset*p.rowHeight;p.lastOffset=view.trackerOffset=offset;}}view.press=null;}
 function up(view,e){
  const press=view.press;if(!press?.party)return false;if(press.id!==e.pointerId)return true;const p=press.panel,drag=p.drag,point=view.point(e);if(press.dragging&&drag){Object.assign(drag,point);drop(view);}cancel(view);
  if(panelFor(view)!==p)return true;
  if(press.dragging){if(drag?.overGroup){const changed=drag.overGroup==='tasks'?view.model.reorderQuest(drag.id,drag.index,p.taskItems.map(q=>q.id)):drag.overGroup==='tracked'?view.model.reorderTrackedQuest(drag.id,drag.index):view.model.movePartyMember(drag.id,drag.overGroup,drag.index);if(changed)view.save();else if(view.model.lastPartyError)view.notify(view.model.lastPartyError);}view.invalidate();return true;}
  if(!press.moved&&press.revision===view.revision&&press.hit&&inside(point,press.hit))press.hit.action?.();view.invalidate();return true;
 }
 function wheel(view,e){const p=panelFor(view);if(!supported(p))return false;const column=columnAt(p,view.point(e));if(!column)return false;e.preventDefault();if(view.press?.party&&!view.press.dragging){clearTimeout(view.partyPressTimer);view.press.moved=true;}p.scrolls[column.group]=clamp((p.scrolls[column.group]||0)+e.deltaY,0,p.scrollLimits[column.group]||0);view.invalidate();return true;}
 function tick(view,now){
  const p=panelFor(view),d=p?.drag;if(!supported(p)||!d)return;const dt=clamp(now-(d.lastTick??now),0,80)/1000;d.lastTick=now;const column=columnAt(p,d);if(!column)return;
  const edge=30,direction=d.y<column.y+edge?-clamp((column.y+edge-d.y)/edge,0,1):d.y>column.y+column.h-edge?clamp((d.y-column.y-column.h+edge)/edge,0,1):0;
  if(direction)p.scrolls[column.group]=clamp((p.scrolls[column.group]||0)+direction*260*dt,0,p.scrollLimits[column.group]||0);drop(view);
 }
 const api={down,move,up,cancel,wheel,tick};root.PartyControls=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
