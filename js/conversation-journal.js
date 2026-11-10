(function(root){
 'use strict';
 const LIMIT=160;
 function normalize(value){return(Array.isArray(value)?value:[]).filter(r=>r&&typeof r.text==='string'&&r.text.trim()).slice(-LIMIT).map(r=>({name:String(r.name||'旁白').slice(0,20),text:r.text.slice(0,1800),chapter:String(r.chapter||'行旅').slice(0,40)}));}
 function append(value,entry){if(!entry?.text)return normalize(value);const next=normalize([entry])[0];if(!next)return normalize(value);const last=Array.isArray(value)?value.at(-1):null;if(Array.isArray(value)&&value.length<=LIMIT&&last&&last.text===next.text&&last.name===next.name&&last.chapter===next.chapter)return value;const rows=normalize(value);rows.push(next);return rows.slice(-LIMIT);}
 function draw(view,rows,panel,onClose){
  const UI=root.PengpaiUI,c=view.ctx,w=Math.min(460,view.w-28),h=Math.min(650,view.h-32),x=(view.w-w)/2,y=(view.h-h)/2,left=x+20,top=y+63,bottom=y+h-18,inner=w-40;
  c.save();c.fillStyle='#030b10d9';c.fillRect(0,0,view.w,view.h);view.box(x,y,w,h,'#18201ffb','#877958',3);view.hits=[];view.text('行旅回顾',x+22,y+27,20,'#e3d2ac','left');view.button('×',x+w-45,y+10,30,30,onClose);
  c.font=`14px ${UI.font}`;const entries=normalize(rows).map(r=>({...r,lines:UI.wrapLines(c,r.text,inner),height:51+UI.wrapLines(c,r.text,inner).length*24})),contentH=entries.reduce((n,e)=>n+e.height,0);
  panel.maxScroll=Math.max(0,contentH-(bottom-top));panel.scroll=Math.max(0,Math.min(panel.maxScroll,panel.scroll??panel.maxScroll));const headerHits=view.hits.length;c.beginPath();c.rect(left,top,inner,bottom-top);c.clip();let yy=top-panel.scroll;
  if(!entries.length)view.text('尚无可回顾的对话',x+w/2,top+50,16,'#a1ad98','center');
  for(const r of entries){if(yy+r.height>=top&&yy<=bottom){view.text(r.name,left,yy+14,16,'#d5bb84','left');r.lines.forEach((line,i)=>view.text(line,left,yy+43+i*24,14,'#cdd4c4','left'));}yy+=r.height;}
  view.hits=view.hits.slice(0,headerHits);c.restore();
 }
 const api={LIMIT,normalize,append,draw};root.ConversationJournal=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
