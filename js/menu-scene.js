(function(root){
 'use strict';
 function layer(w,h,paint){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;paint(canvas.getContext('2d'));return canvas;}
 function atlas(view){
  const {w,h,dpr=1}=view,key=[w,h,dpr].join('|');if(view.atlas?.key===key)return view.atlas;
  const shade=layer(Math.ceil(w*dpr),Math.ceil(h*dpr),c=>{c.scale(dpr,dpr);const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#060d1840');g.addColorStop(.35,'#08101900');g.addColorStop(.58,'#080f1520');g.addColorStop(.78,'#060d16a8');g.addColorStop(1,'#050b13e0');c.fillStyle=g;c.fillRect(0,0,w,h);const edge=c.createLinearGradient(0,0,w,0);edge.addColorStop(0,'#050b1338');edge.addColorStop(.35,'#050b1300');edge.addColorStop(.65,'#050b1300');edge.addColorStop(1,'#050b1338');c.fillStyle=edge;c.fillRect(0,0,w,h);});
  const fog=layer(512,128,c=>{for(let i=0;i<5;i++){const x=50+i*110,y=58+Math.sin(i*2)*12,g=c.createRadialGradient(x,y,0,x,y,100);g.addColorStop(0,'#c3c9be24');g.addColorStop(1,'#c3c9be00');c.fillStyle=g;c.fillRect(0,0,512,128);}});
  const light=layer(256,256,c=>{const g=c.createRadialGradient(128,128,0,128,128,128);g.addColorStop(0,'#edc58d38');g.addColorStop(1,'#edc58d00');c.fillStyle=g;c.fillRect(0,0,256,256);});
  return view.atlas={key,shade,fog,light};
 }
 function draw(view,now=0){
  const c=view.ctx,w=view.w,h=view.h,cache=atlas(view),t=view.reduceMotion?0:now/1000,img=view.image(view.assets.background);c.fillStyle='#0d151e';c.fillRect(0,0,w,h);
  if(img){const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight)*1.025,iw=img.naturalWidth*scale,ih=img.naturalHeight*scale,dx=view.reduceMotion?0:Math.sin(t*.09)*w*.003,dy=view.reduceMotion?0:Math.cos(t*.07)*h*.002;c.drawImage(img,(w-iw)/2+dx,(h-ih)/2+dy,iw,ih);}
  c.save();c.globalAlpha=.36+Math.sin(t*.23)*.08;c.drawImage(cache.light,w*.34,h*.27,w*.72,h*.40);c.globalAlpha=.30;c.drawImage(cache.fog,-w*.20+Math.sin(t*.06)*w*.16,h*.44+Math.sin(t*.1)*4,w*1.50,h*.12);c.globalAlpha=.19;c.drawImage(cache.fog,-w*.12-Math.sin(t*.045)*w*.18,h*.58,w*1.40,h*.13);c.restore();
  if(!view.reduceMotion){c.save();for(let i=0;i<12;i++){const phase=(t*(.012+i*.0006)+i*.083)%1,x=w*(.045+(i*.037)% .23)+Math.sin(t*.3+i)*5,y=h*(.78-phase*.22);c.globalAlpha=Math.sin(phase*Math.PI)*(.10+(i%3)*.10);c.fillStyle=i%3?'#ce9d64':'#e5bc7b';c.beginPath();c.arc(x,y,i%3===0?1.1:.6,0,Math.PI*2);c.fill();}c.restore();}
  c.drawImage(cache.shade,0,0,w,h);
 }
 const api={draw,atlas};root.MenuScene=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
