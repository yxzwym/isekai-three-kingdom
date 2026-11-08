(function(root){
 'use strict';
 // 4×5滑块机关；状态与解法均使用同一套合法移动规则。
 const initial=[['gate',1,1,2,2,'机枢'],['a',0,1,1,2,'甲'],['b',3,1,1,2,'乙'],['c',0,0,2,1,'横闩'],['d',0,3,1,2,'丙'],['e',3,3,1,2,'丁'],['f',2,0,1,1,'木'],['g',3,0,1,1,'木'],['h',1,4,1,1,'木'],['i',2,4,1,1,'木']].map(([id,x,y,w,h,name])=>({id,x,y,w,h,name}));
 const copy=x=>JSON.parse(JSON.stringify(x)),fresh=()=>({pieces:copy(initial),moves:0}),solved=s=>s.pieces.find(p=>p.id==='gate')?.y===3&&s.pieces.find(p=>p.id==='gate')?.x===1;
 function valid(s,id,dx,dy){if(Math.abs(dx)+Math.abs(dy)!==1)return false;const p=s.pieces.find(p=>p.id===id);if(!p)return false;const x=p.x+dx,y=p.y+dy;if(x<0||y<0||x+p.w>4||y+p.h>5)return false;return !s.pieces.some(q=>q!==p&&x<q.x+q.w&&x+p.w>q.x&&y<q.y+q.h&&y+p.h>q.y);}
 function move(s,id,dx,dy){if(!valid(s,id,dx,dy))return false;const p=s.pieces.find(p=>p.id===id);p.x+=dx;p.y+=dy;s.moves++;return true;}
 function normalize(s){if(!s?.pieces||s.pieces.length!==initial.length)return fresh();const result=copy(s),occupied=new Set();for(const ref of initial){const p=result.pieces.find(p=>p.id===ref.id);if(!p||p.w!==ref.w||p.h!==ref.h||!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x<0||p.y<0||p.x+p.w>4||p.y+p.h>5)return fresh();for(let y=p.y;y<p.y+p.h;y++)for(let x=p.x;x<p.x+p.w;x++){const key=x+','+y;if(occupied.has(key))return fresh();occupied.add(key);}}result.moves=Math.max(0,Math.floor(result.moves)||0);return result;}
 const hints=new Map();
 const encode=s=>s.pieces.map(p=>p.x+4*p.y).join(',');
 function* solve(s){
  const key=encode(s);if(hints.has(key))return hints.get(key);const queue=[{s:copy(s),parent:-1,step:null}],seen=new Set([key]);
  for(let k=0;k<queue.length&&k<60000;k++){
   const entry=queue[k];if(solved(entry.s)){let at=k;while(queue[at].parent>=0){const child=queue[at],parent=queue[child.parent];hints.set(encode(parent.s),child.step);at=child.parent;}return hints.get(key)||null;}
   for(const p of entry.s.pieces)for(const [dx,dy]of [[0,1],[0,-1],[1,0],[-1,0]])if(valid(entry.s,p.id,dx,dy)){const next=copy(entry.s);move(next,p.id,dx,dy);const nextKey=encode(next);if(!seen.has(nextKey)){seen.add(nextKey);queue.push({s:next,parent:k,step:{id:p.id,dx,dy}});}}
   if(k%32===0)yield;
  }return null;
 }
 function hint(s){const search=solve(s);let result;do{result=search.next();}while(!result.done);return result.value;}
 async function hintAsync(s,{cancelled=()=>false,yieldFrame=()=>new Promise(resolve=>setTimeout(resolve,0))}={}){const search=solve(copy(s));while(!cancelled()){const start=performance.now();let result;do{result=search.next();if(result.done)return result.value;}while(performance.now()-start<5);await yieldFrame();}return null;}
 function draw(v){const panel=v.panel,state=v.model.state.heroQuests[panel.questId];if(panel.gameRecord!==state.puzzle||!state.puzzle){state.puzzle=normalize(state.puzzle);panel.gameRecord=state.puzzle;}const game=state.puzzle,size=Math.min(60,(v.w-72)/4,(v.h-230)/5),f=v.frame('机关 · 华容道',size*5+211),x=f.x+(f.w-size*4)/2,y=f.y+76;
  v.text('拖动木块移向出口，也可使用方向键',f.x+f.w/2,f.y+56,14,'#d3c5a8','center');v.box(x-4,y-4,size*4+8,size*5+8,'#091b22','#9b8054',4);
  for(const p of game.pieces){const drag=panel.drag?.id===p.id?panel.drag:{dx:0,dy:0},px=x+p.x*size+3+drag.dx,py=y+p.y*size+3+drag.dy;v.box(px,py,p.w*size-6,p.h*size-6,p.id==='gate'?'#7c3c31':panel.selected===p.id?'#74613c':'#3f4234',p.id==='gate'?'#ecb185':'#a18b60',4);v.text(p.name,px+(p.w*size-6)/2,py+(p.h*size-6)/2,16,'#f2dfb9','center');v.hits.push({x:px,y:py,w:p.w*size-6,h:p.h*size-6,label:'机关 '+p.id,kind:'puzzle',drag:(dx,dy,end)=>{const horizontal=Math.abs(dx)>Math.abs(dy),sx=horizontal?Math.sign(dx):0,sy=horizontal?0:Math.sign(dy),allowed=valid(game,p.id,sx,sy);panel.selected=p.id;panel.drag={id:p.id,dx:allowed&&horizontal?Math.max(-size,Math.min(size,dx)):0,dy:allowed&&!horizontal?Math.max(-size,Math.min(size,dy)):0};if(end){panel.drag=null;if(allowed&&Math.max(Math.abs(dx),Math.abs(dy))>size*.3)apply(p.id,sx,sy);}v.invalidate();},action:()=>{panel.hintToken=(panel.hintToken||0)+1;panel.solving=false;panel.selected=p.id;}});}
  v.text('出口',x+size*2,y+size*5+20,14,'#e1bc74','center');const controls=y+size*5+38,bw=(f.w-40)/4;
  const apply=(id,dx,dy)=>{panel.hintToken=(panel.hintToken||0)+1;panel.solving=false;if(v.panel!==panel||state.puzzle!==game)return;if(move(game,id,dx,dy)){v.save();if(solved(game)){v.model.completeHeroPuzzle(panel.questId);v.panel=null;v.save();v.heroQuestDialogue(root.HeroQuests.npc(panel.questId,state));}v.invalidate();}};
  [[-1,0,'←'],[0,-1,'↑'],[0,1,'↓'],[1,0,'→']].forEach(([dx,dy,label],i)=>v.button(label,f.x+20+i*bw,controls,bw-5,32,()=>apply(panel.selected,dx,dy),{disabled:!valid(game,panel.selected,dx,dy)}));
  v.button('重置',f.x+20,controls+42,(f.w-48)/2,30,()=>{panel.hintToken=(panel.hintToken||0)+1;panel.solving=false;state.puzzle=fresh();panel.selected=null;v.save();});v.button('提示',f.x+28+(f.w-48)/2,controls+42,(f.w-48)/2,30,()=>{if(panel.solving)return;panel.solving=true;const token=panel.hintToken=(panel.hintToken||0)+1;hintAsync(game,{cancelled:()=>v.disposed||v.panel!==panel||panel.hintToken!==token}).then(step=>{if(v.panel!==panel||panel.hintToken!==token)return;panel.solving=false;if(step){panel.selected=step.id;apply(step.id,step.dx,step.dy);}v.invalidate({visualOnly:true});});});
 }
 const api={initial,fresh,normalize,valid,move,solved,hint,hintAsync,draw};root.SlidingPuzzle=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
