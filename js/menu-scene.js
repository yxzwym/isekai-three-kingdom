(function(root){
 'use strict';
 const serif='"KaiTi","STKaiti","SimSun",serif';
 function atlas(view){
  const {w,h,dpr=1}=view,key=[w,h,dpr].join('|');if(view.atlas?.key===key)return view.atlas;
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.ceil(w*dpr));canvas.height=Math.max(1,Math.ceil(h*dpr));const c=canvas.getContext('2d');c.scale(dpr,dpr);c.fillStyle='#10191b';c.fillRect(0,0,w,h);
  // A chart of the game's own geography: the three courts and the first journey.
  const D=root.WorldData,places=D?.places||[],xs=places.map(p=>p.x),ys=places.map(p=>p.y),minX=Math.min(...xs),minY=Math.min(...ys),spanX=Math.max(...xs)-minX,spanY=Math.max(...ys)-minY;
  const point=id=>{const p=D?.placeMap[id];return p?{x:w*.10+(p.x-minX)/Math.max(1,spanX)*w*1.06,y:h*.10+(p.y-minY)/Math.max(1,spanY)*h*.43}:null;};
  c.strokeStyle='#9c9371';c.lineWidth=.6;c.globalAlpha=.13;
  for(let row=0;row<28;row++){c.beginPath();for(let i=0;i<=48;i++){const x=w*i/48,y=h*.08+row*h*.016+Math.sin(i*.31+row*.57)*10+Math.sin(i*.64-row*.2)*5;i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}
  c.globalAlpha=.26;c.strokeStyle='#a0a58b';for(const [a,b]of D?.roads||[]){const p=point(a),q=point(b);if(!p||!q)continue;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();}
  c.globalAlpha=.45;for(const p of places){const pos=point(p.id);if(!pos)continue;c.fillStyle='#b1a27a';c.fillRect(pos.x,pos.y,1.5,1.5);}
  c.globalAlpha=1;const capitals=[['xuchang','魏 · 许昌','#aebac6'],['chengdu','蜀 · 成都','#aab692'],['jianye','吴 · 建业','#d1ad7f']];
  c.font=`15px ${serif}`;capitals.forEach(([id,name,tint],i)=>{const p=point(id);if(!p)return;const x=w*.73,y=h*(.145+i*.105);c.strokeStyle=tint;c.lineWidth=1;c.beginPath();c.arc(p.x,p.y,5,0,Math.PI*2);c.stroke();c.globalAlpha=.35;c.beginPath();c.moveTo(p.x+7,p.y);c.lineTo(x-9,y-4);c.stroke();c.globalAlpha=1;c.fillStyle=tint;c.fillRect(p.x-1.5,p.y-1.5,3,3);c.fillText(name,x,y);});
  const shade=c.createLinearGradient(0,0,w,0);shade.addColorStop(0,'#10191bf5');shade.addColorStop(.58,'#10191b35');shade.addColorStop(1,'#10191b00');c.fillStyle=shade;c.fillRect(0,0,w,h);
  const fade=c.createLinearGradient(0,h*.35,0,h*.67);fade.addColorStop(0,'#10191b00');fade.addColorStop(1,'#10191b');c.fillStyle=fade;c.fillRect(0,h*.35,w,h*.65);
  c.globalAlpha=.06;for(let i=0;i<1100;i++){const x=(i*73.13)%w,y=(i*137.73)%h;c.fillStyle=i%2?'#e4d5ad':'#000';c.fillRect(x,y,1,1);}c.globalAlpha=1;
  view.atlas={key,canvas,point};return view.atlas;
 }
 function draw(view,now){const c=view.ctx,w=view.w,h=view.h,map=atlas(view);c.drawImage(map.canvas,0,0,w,h);const time=view.reduceMotion?0:now*.00012;
  for(let i=0;i<18;i++){const x=(w*.3+i*79.7+Math.sin(time+i)*13)%w,y=h*.06+((i*47-time*23)%(h*.48)+h*.48)%(h*.48);c.globalAlpha=(.10+.20*Math.sin(time*3+i)**2);c.fillStyle='#ddbd7e';c.beginPath();c.arc(x,y,i%3===0?1.6:.8,0,7);c.fill();}c.globalAlpha=1;
  const camp=map.point('camp'),dest=map.point('changshan');if(camp&&dest){const t=(time*.8)%1;c.strokeStyle='#c6a97566';c.beginPath();c.moveTo(camp.x,camp.y);c.lineTo(dest.x,dest.y);c.stroke();c.fillStyle='#ead59e';c.beginPath();c.arc(camp.x+(dest.x-camp.x)*t,camp.y+(dest.y-camp.y)*t,2,0,7);c.fill();}
 }
 const api={draw,atlas};root.MenuScene=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
