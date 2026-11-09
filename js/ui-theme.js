(function(root){
  'use strict';
  const font='-apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
  const serif='"KaiTi","STKaiti","Songti SC","SimSun",serif';
  function surface(c,x,y,w,h,fill='#151c1c',stroke='#605b49',radius=3){
    if(!w||!h)return;
    const matte=/^#(?:0[abc]|1[0123])/.test(fill)?'#141e20'+(fill.length===9?fill.slice(7):''):fill;
    c.save();c.beginPath();c.roundRect(x,y,Math.max(0,w),Math.max(0,h),Math.min(radius,3));c.fillStyle=matte;c.fill();
    if(stroke){c.strokeStyle=stroke;c.globalAlpha*=.72;c.lineWidth=1;c.stroke();}
    if(w>230&&h>140){c.globalAlpha=.035;c.strokeStyle='#e6d6b3';c.beginPath();for(let i=0;i<64;i++){const xx=x+7+(i*73.13)%(w-14),yy=y+7+(i*37.77)%(h-14);c.moveTo(xx,yy);c.lineTo(Math.min(x+w-7,xx+3+i%9),yy+.4);}c.stroke();c.globalAlpha=.30;c.strokeStyle='#b19a6c';c.beginPath();for(const [xx,yy,dx,dy]of[[x+5,y+5,1,1],[x+w-5,y+5,-1,1],[x+5,y+h-5,1,-1],[x+w-5,y+h-5,-1,-1]]){c.moveTo(xx,yy+dy*12);c.lineTo(xx,yy);c.lineTo(xx+dx*12,yy);}c.stroke();}
    c.restore();
  }
  // 正文最低14px，按钮16px，页面标题20px；主菜单游戏名单独放大。
  const textSize=value=>value>25?value:value>=18?20:value>=15?16:14;
  function wrapLines(ctx,value,width){const lines=[];let row='';for(const ch of String(value)){if(row&&ctx.measureText(row+ch).width>width){if(/[，。！？、；：）》」』】,.!?;:]/u.test(ch)){const chars=Array.from(row),last=chars.pop();if(chars.length)lines.push(chars.join(''));row=last+ch;}else if(/[（《「『【(]$/u.test(row)){const chars=Array.from(row),last=chars.pop();if(chars.length)lines.push(chars.join(''));row=last+ch;}else{lines.push(row);row=ch;}}else row+=ch;}if(row)lines.push(row);return lines;}
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
  const api={font,serif,surface,textSize,wrapLines,singleChoiceHit,EXCLUSIVE_COLOR,passiveColor,passiveLabel,passiveButtons,passiveHeight};root.PengpaiUI=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
