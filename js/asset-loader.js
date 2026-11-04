(function(root){
  'use strict';
  async function loadImageURL(url,signal){
    const image=new Image();
    await new Promise((resolve,reject)=>{
      const cleanup=()=>{image.onload=null;image.onerror=null;signal?.removeEventListener('abort',abort);};
      const abort=()=>{cleanup();image.src='';reject(new Error('图片加载超时'));};
      image.onload=()=>{cleanup();resolve();};image.onerror=()=>{cleanup();reject(new Error('图片加载失败'));};signal?.addEventListener('abort',abort,{once:true});
      if(signal?.aborted){abort();return;}image.src=url;
    });
    if(image.decode)await image.decode();return image;
  }
  async function decodeImage(blob){
    const url=URL.createObjectURL(blob);
    try{return await loadImageURL(url);}
    finally{URL.revokeObjectURL(url);}
  }
  function createLoader({fetch:fetcher=(...args)=>root.fetch(...args),decode=decodeImage,loadLocal=loadImageURL,protocol=()=>root.location?.protocol,timeoutMs=60000}={}){
    const cache=new Map(),pending=new Map();
    async function preload(files,{onProgress=()=>{},concurrency=4}={}){
      const list=[...new Map(files.map(file=>[file.src,file])).values()],sizes=new Map(list.map(f=>[f.src,Math.max(0,Number(f.bytes)||0)])),received=new Map(),complete=new Set(),failed=[];
      let cursor=0;
      const notify=()=>{const totalBytes=[...sizes.values()].reduce((a,b)=>a+b,0),loadedBytes=[...received.values()].reduce((a,b)=>a+b,0),done=complete.size===list.length;
        onProgress({loadedBytes,totalBytes,completed:complete.size,total:list.length,percent:done?100:Math.min(99,Math.floor((totalBytes?loadedBytes/totalBytes:complete.size/Math.max(1,list.length))*100))});};
      async function download(file){
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
        try{
          const embedded=root.BattleEmbeddedAssets?.[file.src],url=embedded||(file.revision?`${file.src}?v=${file.revision}`:file.src);
          // 本地源文件不能fetch(file://)，直接加载图片；网页版仍逐字节统计进度。
          if(protocol()==='file:'&&!embedded){const image=await loadLocal(url,controller.signal);cache.set(file.src,image);received.set(file.src,sizes.get(file.src));notify();return image;}
          const response=await fetcher(url,{cache:'force-cache',signal:controller.signal});
          if(!response.ok)throw new Error(`资源下载失败：${file.src} (${response.status})`);
          if(!sizes.get(file.src))sizes.set(file.src,Number(response.headers?.get('content-length'))||0);
          let blob;
          if(response.body?.getReader){
            const reader=response.body.getReader(),chunks=[];let bytes=0;
            while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);bytes+=value.byteLength;received.set(file.src,bytes);notify();}
            blob=new Blob(chunks,{type:response.headers?.get('content-type')||'image/webp'});
          }else{blob=await response.blob();received.set(file.src,blob.size);notify();}
          if(!sizes.get(file.src))sizes.set(file.src,blob.size);
          const image=await decode(blob,file.src);cache.set(file.src,image);return image;
        }finally{clearTimeout(timer);}
      }
      async function worker(){
        while(cursor<list.length){const file=list[cursor++];
          try{
            if(!cache.has(file.src)){
              if(!pending.has(file.src))pending.set(file.src,download(file).finally(()=>pending.delete(file.src)));
              await pending.get(file.src);
            }
            complete.add(file.src);received.set(file.src,sizes.get(file.src));notify();
          }catch(error){received.set(file.src,0);failed.push({src:file.src,error});notify();}
        }
      }
      for(const file of list)if(cache.has(file.src)){received.set(file.src,sizes.get(file.src));complete.add(file.src);}
      notify();await Promise.all(Array.from({length:Math.min(list.length,Math.max(1,concurrency))},worker));
      if(failed.length){const error=new Error('部分资源加载失败');error.failed=failed;throw error;}
      return {count:list.length,bytes:[...sizes.values()].reduce((a,b)=>a+b,0)};
    }
    return {preload,get:src=>cache.get(src)};
  }
  const loader=createLoader();
  function mount(canvas,files,onReady){
    const ctx=canvas.getContext('2d'),font=root.PengpaiUI.font;let disposed=false,error=false,state={percent:0,loadedBytes:0,totalBytes:files.reduce((n,f)=>n+f.bytes,0)},width,height,dpr,retry;
    const size=bytes=>(bytes/1000000).toFixed(2)+' MB';
    function draw(){
      if(disposed)return;ctx.clearRect(0,0,width,height);ctx.fillStyle='#071923';ctx.fillRect(0,0,width,height);ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle='#dfc18b';ctx.font=`20px ${font}`;ctx.fillText('异界三国',width/2,height*.43);
      ctx.fillStyle='#dce6e5';ctx.font=`14px ${font}`;ctx.fillText(error?'资源加载失败':`正在加载 ${state.percent}%`,width/2,height*.43+44);
      const barWidth=Math.min(300,width-64),x=(width-barWidth)/2,y=height*.43+72;
      ctx.fillStyle='#173842';ctx.fillRect(x,y,barWidth,6);ctx.fillStyle='#52bccb';ctx.fillRect(x,y,barWidth*state.percent/100,6);
      ctx.fillStyle='#9eb4b8';ctx.fillText(`${size(Math.min(state.loadedBytes,state.totalBytes))} / ${size(state.totalBytes)}`,width/2,y+29);
      retry={x:width/2-65,y:y+55,w:130,h:40};
      if(error){ctx.strokeStyle='#79999c';ctx.strokeRect(retry.x,retry.y,retry.w,retry.h);ctx.fillStyle='#e4e8e4';ctx.fillText('重试',width/2,retry.y+20);}
      canvas.setAttribute('aria-label',error?'资源加载失败，点击重试':`资源加载 ${state.percent}%，${state.completed||0}/${files.length} 项`);
    }
    function resize(){const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;dpr=Math.min(2,root.devicePixelRatio||1);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
    function destroy(){disposed=true;observer.disconnect();canvas.removeEventListener('pointerup',click);canvas.removeEventListener('keydown',key);}
    async function run(){error=false;draw();try{await loader.preload(files,{onProgress:value=>{state=value;draw();}});}catch(cause){if(disposed)return;error=true;draw();console.error(cause);return;}if(disposed)return;destroy();onReady();}
    function click(event){if(!error)return;const rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;if(x>=retry.x&&x<=retry.x+retry.w&&y>=retry.y&&y<=retry.y+retry.h)run();}
    function key(event){if(error&&event.key==='Enter'){event.preventDefault();run();}}
    const observer=new ResizeObserver(resize);observer.observe(canvas);canvas.addEventListener('pointerup',click);canvas.addEventListener('keydown',key);resize();run();return {destroy};
  }
  const api={...loader,createLoader,mount};root.GameAssetLoader=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
