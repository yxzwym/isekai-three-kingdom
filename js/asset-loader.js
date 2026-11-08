(function(root){
  'use strict';
  const Viewport=typeof module!=='undefined'&&module.exports?require('./canvas-viewport.js'):root.CanvasViewport;
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
  async function decodeImage(blob){const url=URL.createObjectURL(blob);try{return await loadImageURL(url);}finally{URL.revokeObjectURL(url);}}
  function createLoader({fetch:fetcher=(...args)=>root.fetch(...args),decode=decodeImage,loadLocal=loadImageURL,protocol=()=>root.location?.protocol,manifest=()=>root.GameAssetManifest||[],timeoutMs=60000,maxConcurrency=4}={}){
    const cache=new Map(),pending=new Map(),failures=new Map(),transfers=new Map(),listeners=new Set(),queue=[],jobs=new Map(),prefetches=new Map();let active=0,backgroundActive=0,records,sourceList;
    const emit=event=>{for(const listener of [...listeners])listener(event);};
    function record(file){if(typeof file!=='string')return file;const list=manifest();if(sourceList!==list){sourceList=list;records=new Map(list.map(f=>[f.src,f]));}return records.get(file)||{src:file,bytes:0};}
    function transport(file){const embedded=root.BattleEmbeddedAssets?.[file.src],local=protocol()==='file:'&&!embedded,pack=!embedded&&!local&&file.pack;
      const descriptor=pack||file,url=embedded||(descriptor.revision?descriptor.src+'?v='+descriptor.revision:descriptor.src);return{url,local,pack,bytes:Math.max(0,Number(descriptor.bytes)||0)};
    }
    function progress(files){const unique=[...new Map(files.map(f=>{f=record(f);return[f.src,f];})).values()],resources=new Map();
      for(const file of unique){const t=transport(file),state=transfers.get(t.url),previous=resources.get(t.url);resources.set(t.url,{bytes:state?.total||t.bytes,loaded:state?.loaded??(cache.has(file.src)?t.bytes:0),complete:(previous?.complete??true)&&cache.has(file.src)});}
      const complete=unique.filter(f=>cache.has(f.src)).length,totalBytes=[...resources.values()].reduce((n,r)=>n+r.bytes,0),loadedBytes=[...resources.values()].reduce((n,r)=>n+Math.min(r.bytes||r.loaded,r.loaded),0),done=complete===unique.length;
      return {loadedBytes,totalBytes,completed:complete,total:unique.length,percent:done?100:Math.min(99,Math.floor((totalBytes?loadedBytes/totalBytes:complete/Math.max(1,unique.length))*100))};
    }
    // 0: current view, 1: next view, 2: nearby images, 3: remaining downloads.
    // A single background slot leaves capacity for immediately needed resources.
    function slot(task,priority=0){let job;const promise=new Promise((resolve,reject)=>{job={task,priority,resolve,reject};queue.push(job);pump();});return{promise,job};}
    function pump(){
      while(active<Math.max(1,maxConcurrency)&&queue.length){let best=-1;for(let i=0;i<queue.length;i++)if((queue[i].priority===0||backgroundActive===0)&&(best<0||queue[i].priority<queue[best].priority))best=i;if(best<0)break;
        const job=queue.splice(best,1)[0],background=job.priority>0;active++;if(background)backgroundActive++;Promise.resolve().then(()=>job.task(job)).then(job.resolve,job.reject).finally(()=>{active--;if(background)backgroundActive--;pump();});
      }
    }
    function promote(src,priority){const job=jobs.get(src);if(job&&priority<job.priority){job.priority=priority;pump();}}

    function fetchBlob(file,t,signal,priority=0){
      let state=transfers.get(t.url);if(state?.blob)return Promise.resolve(state.blob);if(state?.error)return Promise.reject(state.error);if(state?.promise)return state.promise;
      state={loaded:0,total:t.bytes};transfers.set(t.url,state);
      state.promise=(async()=>{const response=await fetcher(t.url,{cache:'force-cache',signal,priority:priority>0?'low':'high'});if(!response.ok)throw new Error('资源下载失败 ('+response.status+')');
        state.total=state.total||Number(response.headers?.get('content-length'))||0;let blob;
        if(response.body?.getReader){const reader=response.body.getReader(),chunks=[];try{while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);state.loaded+=value.byteLength;emit({type:'progress',src:file.src});}}catch(error){await reader.cancel().catch(()=>{});throw error;}blob=new Blob(chunks,{type:response.headers?.get('content-type')||'image/webp'});}
        else{blob=await response.blob();state.loaded=blob.size;}state.total=blob.size;state.loaded=blob.size;
        if(t.pack&&blob.size!==t.pack.bytes)throw new Error('资源包不完整');if(t.pack)state.blob=blob;state.done=true;emit({type:'progress',src:file.src});return blob;
      })().catch(error=>{state.error=error;state.promise=null;state.loaded=0;throw error;});return state.promise;
    }
    function ensure(file,{retry=false,priority=0}={}){
      file=record(file);if(cache.has(file.src))return Promise.resolve(cache.get(file.src));if(pending.has(file.src)){promote(file.src,priority);return pending.get(file.src);}if(failures.has(file.src)&&!retry)return Promise.reject(failures.get(file.src));failures.delete(file.src);if(retry){const t=transport(file);if(transfers.get(t.url)?.error)transfers.delete(t.url);}
      const entry=slot(async job=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs),t=transport(file);
        try{let image;if(t.local){image=await loadLocal(t.url,controller.signal);transfers.set(t.url,{loaded:t.bytes,total:t.bytes});}
          else{let blob=await fetchBlob(file,t,controller.signal,job.priority);if(t.pack){const {offset,length}=t.pack;if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(length)||offset<0||length<=0||offset+length>blob.size)throw new Error('资源包索引无效');blob=blob.slice(offset,offset+length,'image/webp');}image=await decode(blob,file.src);}
          cache.set(file.src,image);emit({type:'ready',src:file.src});return image;
        }catch(error){failures.set(file.src,error);emit({type:'error',src:file.src,error});throw error;}finally{clearTimeout(timer);}
      },priority),task=entry.promise.finally(()=>{pending.delete(file.src);jobs.delete(file.src);});jobs.set(file.src,entry.job);pending.set(file.src,task);emit({type:'pending',src:file.src});return task;
    }
    async function preload(files,{onProgress=()=>{},concurrency=4,priority=0}={}){
      const list=[...new Map(files.map(f=>{f=record(f);return[f.src,f];})).values()],failed=[];let cursor=0;
      const notify=()=>onProgress(progress(list)),unsubscribe=subscribe(notify);notify();
      try{await Promise.all(Array.from({length:Math.min(list.length,Math.max(1,concurrency))},async()=>{while(cursor<list.length){const file=list[cursor++];try{await ensure(file,{retry:priority===0,priority});}catch(error){failed.push({src:file.src,error});}notify();}}));}
      finally{unsubscribe();}if(failed.length){const error=new Error('部分资源加载失败');error.failed=failed;throw error;}return{count:list.length,bytes:progress(list).totalBytes};
    }
    const subscribe=listener=>{listeners.add(listener);return()=>listeners.delete(listener);};
    function get(src,owner){if(!src)return;const view=owner||currentView;view?.assetSources?.add(src);const image=cache.get(src);if(!image&&!failures.has(src)){if(pending.has(src))promote(src,0);else ensure(src).catch(()=>{});}return image;}
    function downloaded(src){const file=record(src),t=transport(file);return cache.has(src)||!!root.BattleEmbeddedAssets?.[src]||!!transfers.get(t.url)?.done;}
    async function prefetch(files,{priority=3}={}){
      const resources=new Map();for(let file of files){file=record(file);const t=transport(file);if(!t.local&&!root.BattleEmbeddedAssets?.[file.src]&&!downloaded(file.src))resources.set(t.url,{file,t});}
      const tasks=[...resources.values()].map(({file,t})=>{if(prefetches.has(t.url))return prefetches.get(t.url);const entry=slot(async job=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);try{return await fetchBlob(file,t,controller.signal,job.priority);}finally{clearTimeout(timer);}},priority),promise=entry.promise.finally(()=>prefetches.delete(t.url));prefetches.set(t.url,promise);return promise;});
      const results=await Promise.allSettled(tasks);return{count:resources.size,failed:results.filter(r=>r.status==='rejected').length};
    }
    return {preload,get,ensure,prefetch,downloaded,progress,subscribe,peek:src=>cache.get(src),error:src=>failures.get(src),pending:src=>pending.has(src)};
  }
  let currentView=null;
  const loader=createLoader();
  const startupFiles=()=>{const files=root.GameAssetManifest||[],src=root.PengpaiAssets?.background;return files.filter(file=>file.src===src);};
  function loadingScreen(canvas,ctx,width,height,state,error=false){
    const font=root.PengpaiUI.font,size=bytes=>(bytes/1000000).toFixed(2)+' MB';ctx.save();ctx.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);ctx.fillStyle='#071923';ctx.fillRect(0,0,width,height);ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='#dfc18b';ctx.font=`20px ${font}`;ctx.fillText('异界三国',width/2,height*.43);ctx.fillStyle='#dce6e5';ctx.font=`14px ${font}`;ctx.fillText(error?'资源加载失败':`正在加载 ${state.percent}%`,width/2,height*.43+44);
    const barWidth=Math.min(300,width-64),x=(width-barWidth)/2,y=height*.43+72;ctx.fillStyle='#173842';ctx.fillRect(x,y,barWidth,6);ctx.fillStyle='#52bccb';ctx.fillRect(x,y,barWidth*state.percent/100,6);ctx.fillStyle='#9eb4b8';ctx.fillText(`${size(state.loadedBytes)} / ${size(state.totalBytes)}`,width/2,y+29);
    const retry={x:width/2-65,y:y+55,w:130,h:40};if(error){ctx.strokeStyle='#79999c';ctx.strokeRect(retry.x,retry.y,retry.w,retry.h);ctx.fillStyle='#e4e8e4';ctx.fillText('重试',width/2,retry.y+20);}ctx.restore();canvas.setAttribute('aria-label',error?'资源加载失败，点击重试':`资源加载 ${state.percent}%，${state.completed}/${state.total} 项`);return retry;
  }
  // Each canvas view requests only the images it actually uses. Loading blocks input,
  // and the battle clock waits until the current scene is ready.
  function track(view,{onReady=()=>{}}={}){
    if(view.assetSources)return;view.assetSources=new Set();view.assetsLoading=true;let scheduled=0,wave=[],waitingSince=null,delayTimer,hold;
    const capture=()=>{const canvas=view.canvas;if(!canvas.width||!canvas.height)return;hold||=document.createElement('canvas');if(hold.width!==canvas.width||hold.height!==canvas.height){hold.width=canvas.width;hold.height=canvas.height;}hold.getContext('2d').drawImage(canvas,0,0);};capture();
    const redraw=()=>{if(view.disposed||scheduled)return;scheduled=requestAnimationFrame(()=>{scheduled=0;if(!view.disposed)view.draw(performance.now());});};
    const unsubscribe=loader.subscribe(event=>{if(view.assetSources.has(event.src)){if(event.type==='ready')onReady(event.src);redraw();}}),draw=view.draw,destroy=view.destroy;
    view.draw=function(...args){const waiting=[...view.assetSources].some(src=>!loader.peek(src));if(!view.assetsLoading||!waiting){const previous=currentView;currentView=view;try{draw.apply(this,args);}finally{currentView=previous;}}
      const missing=[...view.assetSources].filter(src=>!loader.peek(src));view.assetsLoading=missing.length>0;
      if(view.assetsLoading){wave=[...new Set([...wave,...missing])];const now=performance.now(),error=missing.some(src=>loader.error(src));if(waitingSince===null){waitingSince=now;delayTimer=setTimeout(redraw,150);}view.assetFailure=error;view.assetLoadingVisible=!!(error||view.assetLoadingVisible||missing.some(src=>!loader.downloaded(src))&&now-waitingSince>=150);
        if(view.assetLoadingVisible)view.assetRetry=loadingScreen(view.canvas,view.ctx,view.w,view.h,loader.progress(wave),error);
        else if(hold){const c=view.ctx;c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(hold,0,0,view.canvas.width,view.canvas.height);c.restore();view.canvas.setAttribute('aria-label','正在准备资源');}
        view.hits=[];if(view.input)view.input.hidden=true;}
      else{wave=[];waitingSince=null;clearTimeout(delayTimer);view.assetFailure=false;view.assetLoadingVisible=false;}
    };
    const retry=()=>{if(view.assetFailure){loader.preload([...view.assetSources].filter(src=>!loader.peek(src))).catch(()=>{});redraw();}};
    for(const key of ['down','up','move','key','click']){const fn=view[key];if(typeof fn!=='function')continue;view[key]=function(event,...args){if(view.assetsLoading){if(key==='up'&&view.assetFailure){const p=Viewport.point(view.canvas.getBoundingClientRect(),event),r=view.assetRetry;if(p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h)retry();}else if(key==='key'&&event.key==='Enter'){event.preventDefault();retry();}return;}if(!view.scenario&&(key==='down'||key==='key'&&!event.repeat))capture();return fn.call(this,event,...args);};}
    view.destroy=function(...args){unsubscribe();cancelAnimationFrame(scheduled);clearTimeout(delayTimer);if(hold)hold.width=hold.height=0;return destroy.apply(this,args);};
  }
  function mount(canvas,files,onReady){
    const ctx=canvas.getContext('2d');let disposed=false,error=false,state={percent:0,loadedBytes:0,totalBytes:0,completed:0,total:files.length},width,height,retry,scheduled=0;
    function draw(){if(!disposed)retry=loadingScreen(canvas,ctx,width,height,state,error);}
    function repaint(){if(scheduled||disposed)return;scheduled=requestAnimationFrame(()=>{scheduled=0;draw();});}
    function resize(){const view=Viewport.resize(canvas,ctx);width=view.w;height=view.h;draw();}
    function destroy(){disposed=true;cancelAnimationFrame(scheduled);observer.disconnect();canvas.removeEventListener('pointerup',click);canvas.removeEventListener('keydown',key);}
    async function run(){error=false;draw();try{await loader.preload(files,{onProgress:value=>{state=value;repaint();}});}catch(cause){if(!disposed){error=true;draw();console.error(cause);}return;}if(disposed)return;destroy();onReady();}
    function click(event){if(!error)return;const {x,y}=Viewport.point(canvas.getBoundingClientRect(),event);if(x>=retry.x&&x<=retry.x+retry.w&&y>=retry.y&&y<=retry.y+retry.h)run();}
    function key(event){if(error&&event.key==='Enter'){event.preventDefault();run();}}
    const observer=new ResizeObserver(resize);observer.observe(canvas);canvas.addEventListener('pointerup',click);canvas.addEventListener('keydown',key);resize();run();return{destroy};
  }
  let mapWarmup;function warmMap(){return mapWarmup||=(async()=>{const files=(root.GameAssetManifest||[]).filter(f=>f.src.includes('/map/'));try{await loader.preload(files);root.WorldMapArt?.prepare?.(root.WorldData,loader.peek);}catch{mapWarmup=null;}})();}
  function warmGroups(groups,{priority=1}={}){const order=new Map(groups.map((id,i)=>[id,i])),group=f=>f.pack?.src.split('/').pop().replace(/\.bin$/,'');return loader.preload((root.GameAssetManifest||[]).filter(f=>order.has(group(f))).sort((a,b)=>order.get(group(a))-order.get(group(b))),{priority});}
  let background;
  function startBackground(){
    if(!background)background=(async()=>{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const nearby=warmGroups(['creation','road','interface','camp','dream','map','townspeople'],{priority:2}).catch(()=>{}),remaining=loader.prefetch(root.GameAssetManifest||[]);await Promise.all([nearby,remaining]);
    })();return background;
  }
  const api={...loader,createLoader,startupFiles,track,mount,warmMap,warmGroups,startBackground};root.GameAssetLoader=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
