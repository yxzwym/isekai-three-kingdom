(function(root){
  'use strict';
  const font='"Microsoft YaHei UI","Microsoft YaHei","PingFang SC",system-ui,sans-serif';
  const serif=font;
  function surface(c,x,y,w,h,fill='#151c1c',stroke='#605b49',radius=3){
    if(!w||!h)return;
    const matte=/^#(?:0[789abc]|1[0123456])/.test(fill)?'#171f20'+(fill.length===9?fill.slice(7):''):fill;
    c.save();c.beginPath();c.roundRect(x,y,Math.max(0,w),Math.max(0,h),Math.min(radius,3));c.fillStyle=matte;c.fill();
    if(stroke){c.strokeStyle=['#507984','#52727c','#486c77','#5c7d88','#4d7078','#375763','#38565d','#365867','#2d4a54','#48616b','#76909a','#7d959b','#37545e'].includes(stroke)?'#716b56':stroke;c.globalAlpha*=.72;c.lineWidth=1;c.stroke();}
    if(w>230&&h>140){c.globalAlpha=.035;c.strokeStyle='#e6d6b3';c.beginPath();for(let i=0;i<64;i++){const xx=x+7+(i*73.13)%(w-14),yy=y+7+(i*37.77)%(h-14);c.moveTo(xx,yy);c.lineTo(Math.min(x+w-7,xx+3+i%9),yy+.4);}c.stroke();c.globalAlpha=.30;c.strokeStyle='#b19a6c';c.beginPath();for(const [xx,yy,dx,dy]of[[x+5,y+5,1,1],[x+w-5,y+5,-1,1],[x+5,y+h-5,1,-1],[x+w-5,y+h-5,-1,-1]]){c.moveTo(xx,yy+dy*12);c.lineTo(xx,yy);c.lineTo(xx+dx*12,yy);}c.stroke();}
    c.restore();
  }
  // 1080×1920设计像素：正文28、按钮32、标题40；绘图单位为设计像素的一半。
  const textSize=value=>value>25?value:value>=18?20:value>=15?16:14;
  function dragGrip(view,x,y,w=28,h=36,color='#a5a58d'){const c=view.ctx;c.save();c.fillStyle=color;for(let row=0;row<3;row++)for(let col=0;col<2;col++)c.fillRect(x+w/2-4+col*6,y+h/2-7+row*6,2,2);c.restore();}
  function centeredText(view,value,x,y,w,h,size=14,color='#ead8ad'){
    const c=view.ctx,label=String(value);if(!c?.measureText||!c.fillText){view.text(label,x+w/2,y+h/2,size,color,'center');return;}
    c.save();c.font=textSize(size)+'px '+font;c.textAlign='center';c.textBaseline='alphabetic';c.fillStyle=color;const metrics=c.measureText(label),ascent=metrics.actualBoundingBoxAscent,descent=metrics.actualBoundingBoxDescent;
    if(Number.isFinite(ascent)&&Number.isFinite(descent))c.fillText(label,x+w/2,y+(h+ascent-descent)/2);else{c.textBaseline='middle';c.fillText(label,x+w/2,y+h/2);}c.restore();
  }
  const controls={compact:32,normal:40,primary:48,font:16};
  function buttonTrim(view,x,y,w,h,{active=false,disabled=false,pressed=false}={}){
    const c=view.ctx;if(!c?.save||!c.beginPath||!c.moveTo||!c.lineTo||!c.stroke)return;
    c.save();c.lineWidth=1;c.strokeStyle=disabled?'#48504b':active?'#d1ad76':'#99896b';c.globalAlpha=pressed?.85:.52;
    const inset=4,len=w>100?8:4;c.beginPath();
    for(const [xx,yy,dx,dy]of [[x+inset,y+inset,1,1],[x+w-inset,y+h-inset,-1,-1]]){c.moveTo(xx,yy+dy*len);c.lineTo(xx,yy);c.lineTo(xx+dx*len,yy);}c.stroke();
    if(w>110){c.globalAlpha=.17;c.beginPath();c.moveTo(x+17,y+3);c.lineTo(x+w-17,y+3);c.stroke();c.globalAlpha=.30;c.beginPath();c.moveTo(x+w-11,y+h/2-2);c.lineTo(x+w-9,y+h/2);c.lineTo(x+w-11,y+h/2+2);c.stroke();}
    c.restore();
  }
  function button(view,label,x,y,w,h,action,options={}){
    const {active=false,disabled=false,plain=false,suggested=false}=options,pressed=view.press?.hit?.label===label;
    const height=Math.min(h,h>=46?controls.primary:h>=38?controls.normal:controls.compact),top=y+(h-height)/2;
    view.box(x,top,w,height,disabled?'#202623':pressed?'#332d24':active?'#64392e':plain?'#1c2422bb':'#252c27',disabled?'#464f46':active?'#b79a68':suggested?'#a69a79':'#766e57',2);
    buttonTrim(view,x,top,w,height,{active,disabled,pressed});view.text(label,x+w/2,y+h/2,controls.font,disabled?'#788173':active?'#f1ddb5':'#dcd8c5','center');
    if(!disabled)view.hits.push({x,y,w,h,label,action:()=>{root.GameAudio?.play('ui');action();}});
  }
  function chevron(view,x,y,w,h,expanded=false,color='#b8ad8f'){
    const c=view.ctx,cx=x+w/2,cy=y+h/2,half=Math.min(5,w*.18),rise=Math.min(2.7,h*.1),direction=expanded?-1:1;c.save();c.strokeStyle=color;c.lineWidth=1.8;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(cx-half,cy-direction*rise);c.lineTo(cx,cy+direction*rise);c.lineTo(cx+half,cy-direction*rise);c.stroke();c.restore();
  }
  function pin(view,x,y,size,active){
    const c=view.ctx;c.save();c.translate(x+size/2,y+size/2);c.rotate(-.55);c.strokeStyle=active?'#e3c17e':'#8f9c91';c.fillStyle=active?'#ad8b4a':'#28332c';c.lineWidth=1.6;c.lineJoin='round';const k=size/28;c.scale(k,k);c.beginPath();c.moveTo(-5,-10);c.lineTo(5,-10);c.lineTo(4,-3);c.lineTo(8,2);c.lineTo(-8,2);c.lineTo(-4,-3);c.closePath();c.fill();c.stroke();c.beginPath();c.moveTo(0,2);c.lineTo(0,12);c.stroke();c.restore();
  }
  function wrapLines(ctx,value,width){const lines=[];let row='';for(const ch of String(value)){if(ch.charCodeAt(0)===10){lines.push(row);row='';continue;}if(row&&ctx.measureText(row+ch).width>width){if(/[，。！？、；：）》」』】,.!?;:]/u.test(ch)){const chars=Array.from(row),last=chars.pop();if(chars.length)lines.push(chars.join(''));row=last+ch;}else if(/[（《「『【(]$/u.test(row)){const chars=Array.from(row),last=chars.pop();if(chars.length)lines.push(chars.join(''));row=last+ch;}else{lines.push(row);row=ch;}}else row+=ch;}if(row)lines.push(row);return lines;}
  function singleChoiceHit(hits,width,height,choices){if(choices.length===1)hits.unshift({x:0,y:0,w:width,h:height,action:choices[0].action});}
  const EXCLUSIVE_COLOR='#b69cff';
  function passiveColor(passive,qualities=root.PengpaiRules?.QUALITIES){return passive.temporary?(qualities?.white?.color||'#d5dedf'):passive.exclusive||passive.quality==='purple'?EXCLUSIVE_COLOR:qualities?.[passive.quality]?.color||'#c4d5d3';}
  const passiveLabel=p=>p.temporary?'临时':p.exclusive||p.quality==='purple'?'专属':({white:'普通',green:'精良',blue:'稀有',gold:'传说',red:'神话',rainbow:'融合'}[p.quality]||'普通');
  function passiveRows(passives,width){
    const rows=[],chars=Math.max(1,Math.floor((width/4-10)/14));let y=0;
    for(let i=0;i<passives.length;i+=4){const items=passives.slice(i,i+4).map(passive=>{const letters=Array.from(passive.name),lines=[];for(let n=0;n<letters.length;n+=chars)lines.push(letters.slice(n,n+chars).join(''));return{passive,lines,h:20+(lines.length-1)*18};}),h=Math.max(...items.map(item=>item.h))+4;rows.push({items,y,h});y+=h;}return rows;
  }
  const passiveHeight=(passives,width)=>passiveRows(passives,width).reduce((n,row)=>n+row.h,0);
  function passiveButtons(view,passives,x,y,width,onSelect){
    const cellW=width/4,rows=passiveRows(passives,width);
    for(const row of rows)row.items.forEach(({passive,lines,h},i)=>{const cw=cellW-6,xx=x+(width-row.items.length*cellW)/2+i*cellW+3,yy=y+row.y+(row.h-4-h)/2+2,tint=passiveColor(passive);
      view.box(xx,yy,cw,h,'#112932',tint,3);lines.forEach((line,n)=>view.text(line,xx+cw/2,yy+10+n*18,14,tint,'center'));
      view.hits.push({x:xx,y:yy,w:cw,h,label:passive.name,action:()=>onSelect(passive)});
    });return rows.reduce((n,row)=>n+row.h,0);
  }
  const courtesyNames={赵云:'子龙',刘备:'玄德',关羽:'云长',张飞:'翼德',诸葛亮:'孔明',马超:'孟起',黄忠:'汉升',马良:'季常',曹操:'孟德',司马懿:'仲达',夏侯惇:'元让',张辽:'文远',荀彧:'文若',贾诩:'文和',许褚:'仲康',徐晃:'公明',于禁:'文则',曹仁:'子孝',孙权:'仲谋',周瑜:'公瑾',鲁肃:'子敬',吕蒙:'子明',陆逊:'伯言',甘宁:'兴霸',黄盖:'公覆',太史慈:'子义',吕布:'奉先',董卓:'仲颖',袁绍:'本初',袁术:'公路',华佗:'元化',管辂:'公明'};
  const dialogueName=name=>courtesyNames[name]?name+' '+courtesyNames[name]:name;
  const api={dialogueName,font,serif,surface,controls,dragGrip,centeredText,button,buttonTrim,chevron,pin,textSize,wrapLines,singleChoiceHit,EXCLUSIVE_COLOR,passiveColor,passiveLabel,passiveButtons,passiveHeight};root.PengpaiUI=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
