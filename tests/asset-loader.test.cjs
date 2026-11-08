const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {createLoader}=require('../js/asset-loader.js');
const image=async(blob,src)=>({src,naturalWidth:512,naturalHeight:768,size:blob.size,complete:true});
const response=(chunks=[30,70])=>new Response(new ReadableStream({start(controller){for(const size of chunks)controller.enqueue(new Uint8Array(size));controller.close();}}),{headers:{'content-type':'image/webp'}});

test('加载进度按接收字节递增，资源全部下载并解码后才完成',async()=>{
  const states=[],loader=createLoader({fetch:async()=>response(),decode:image});
  await loader.preload([{src:'a.webp',bytes:100},{src:'b.webp',bytes:100}],{onProgress:p=>states.push(p)});
  assert.ok(states.some(p=>p.percent>0&&p.percent<99));for(let i=1;i<states.length;i++)assert.ok(states[i].percent>=states[i-1].percent);
  assert.deepEqual(states.at(-1),{loadedBytes:200,totalBytes:200,completed:2,total:2,percent:100});assert.equal(loader.get('a.webp').size,100);
  let started,finish;const decoding=new Promise(resolve=>started=resolve),gated=createLoader({fetch:async()=>response(),decode:()=>{started();return new Promise(resolve=>finish=resolve);}}),progress=[];
  const task=gated.preload([{src:'a.webp',bytes:100}],{onProgress:p=>progress.push(p)});await decoding;assert.equal(progress.at(-1).percent,99);assert.equal(gated.get('a.webp'),undefined);finish({complete:true});await task;assert.equal(progress.at(-1).percent,100);
});
test('加载失败可以重试，已加载成功的图片不再下载',async()=>{
  const calls=[],loader=createLoader({fetch:async src=>{calls.push(src);if(src==='b.webp'&&calls.filter(x=>x===src).length===1)throw new Error('offline');return response();},decode:image}),files=[{src:'a.webp',bytes:100},{src:'b.webp',bytes:100}];
  await assert.rejects(loader.preload(files),error=>error.failed.length===1&&error.failed[0].src==='b.webp');assert.ok(loader.get('a.webp'));assert.equal(loader.get('b.webp'),undefined);
  await loader.preload(files);assert.deepEqual(calls,['a.webp','b.webp','b.webp']);assert.ok(loader.get('b.webp'));
});
test('重复路径只下载一次，控制并发数，跨页面使用同一张解码图片',async()=>{
  let active=0,peak=0,calls=0;const loader=createLoader({fetch:async()=>{calls++;active++;peak=Math.max(peak,active);await new Promise(resolve=>setTimeout(resolve,2));active--;return response();},decode:image}),files=Array.from({length:8},(_,i)=>({src:i+'.webp',bytes:100}));
  await loader.preload([...files,files[0]],{concurrency:3});const cached=loader.get('0.webp');assert.equal(calls,8);assert.equal(peak,3);await loader.preload(files);assert.equal(calls,8);assert.equal(loader.get('0.webp'),cached);
});
test('网页图片使用内容版本号缓存，离线版直接读取内嵌资源',async()=>{
  const calls=[],loader=createLoader({fetch:async src=>{calls.push(src);return response();},decode:image});
  await loader.preload([{src:'a.webp',bytes:100,revision:'abc123'}]);assert.deepEqual(calls,['a.webp?v=abc123']);
  const previous=globalThis.BattleEmbeddedAssets;try{globalThis.BattleEmbeddedAssets={'b.webp':'data:image/webp;base64,test'};await loader.preload([{src:'b.webp',bytes:100,revision:'def456'}]);assert.equal(calls.at(-1),'data:image/webp;base64,test');}finally{globalThis.BattleEmbeddedAssets=previous;}
});
test('没有流式读取或Content-Length时仍能按实际文件大小完成',async()=>{
  const progress=[],loader=createLoader({fetch:async()=>({ok:true,headers:new Headers(),blob:async()=>new Blob([new Uint8Array(120)])}),decode:image});await loader.preload([{src:'a.webp'}],{onProgress:p=>progress.push(p)});assert.equal(progress.at(-1).percent,100);assert.equal(progress.at(-1).totalBytes,120);assert.equal(loader.get('a.webp').size,120);
});
test('生成的资源清单没有重复，字节数和内容版本与发布文件完全一致',()=>{
  const root=path.resolve(__dirname,'..'),context={};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/runtime-manifest.js'),'utf8'),{globalThis:context});const files=context.GameAssetManifest;assert.ok(files.length>0);assert.equal(new Set(files.map(f=>f.src)).size,files.length);
  for(const file of files){const data=fs.readFileSync(path.join(root,file.src));assert.equal(file.bytes,data.length);assert.equal(file.revision,crypto.createHash('sha256').update(data).digest('hex').slice(0,12));assert.equal(path.extname(file.src),'.webp');}
});

test('直接打开本地源码页面时使用图片加载，不对file地址发起fetch',async()=>{
  const urls=[],progress=[],loader=createLoader({protocol:()=> 'file:',fetch:async()=>{throw new Error('本地文件禁止fetch');},loadLocal:async url=>{urls.push(url);return {src:url,complete:true,naturalWidth:512,naturalHeight:768};}});
  await loader.preload([{src:'./assets/a.webp',bytes:100,revision:'123'},{src:'./assets/b.webp',bytes:200}],{onProgress:p=>progress.push(p)});assert.deepEqual(urls,['./assets/a.webp?v=123','./assets/b.webp']);assert.equal(progress.at(-1).percent,100);assert.equal(progress.at(-1).loadedBytes,300);assert.ok(loader.get('./assets/a.webp').complete);
});
test('本地源码图片加载失败后可重试，离线单文件仍直接读取内嵌数据',async()=>{
  let calls=0;const loader=createLoader({protocol:()=> 'file:',fetch:async()=>response(),decode:image,loadLocal:async()=>{if(++calls===1)throw new Error('missing');return {complete:true};}}),files=[{src:'local.webp',bytes:100}];await assert.rejects(loader.preload(files));await loader.preload(files);assert.equal(calls,2);
  const previous=globalThis.BattleEmbeddedAssets;try{globalThis.BattleEmbeddedAssets={'embedded.webp':'data:image/webp;base64,test'};await loader.preload([{src:'embedded.webp',bytes:100}]);assert.equal(calls,2);assert.ok(loader.get('embedded.webp').complete);}finally{globalThis.BattleEmbeddedAssets=previous;}
});

test('同一资源包只下载一次，按索引取回原始图片，只解码被请求的图片',async()=>{
 const calls=[],decoded=[],payload=new Uint8Array([1,2,3,4,5,6,7,8]),files=[{src:'a.webp',bytes:3,pack:{src:'scene.bin',revision:'pack-v1',bytes:8,offset:0,length:3}},{src:'b.webp',bytes:5,pack:{src:'scene.bin',revision:'pack-v1',bytes:8,offset:3,length:5}}],loader=createLoader({manifest:()=>files,fetch:async src=>{calls.push(src);return new Response(payload);},decode:async(blob,src)=>{decoded.push({src,data:[...new Uint8Array(await blob.arrayBuffer())]});return{complete:true,src};}}),states=[];
 await loader.preload([files[0]],{onProgress:p=>states.push(p)});assert.deepEqual(calls,['scene.bin?v=pack-v1']);assert.deepEqual(decoded,[{src:'a.webp',data:[1,2,3]}]);assert.equal(loader.peek('b.webp'),undefined);assert.equal(states.at(-1).totalBytes,8);
 await Promise.all([loader.preload(files),loader.preload([files[1]])]);assert.equal(calls.length,1);assert.deepEqual(decoded[1],{src:'b.webp',data:[4,5,6,7,8]});assert.equal(decoded.length,2);
});
test('损坏或截断的包不入缓存，重试后恢复；解码错误不会留下未处理拒绝',async()=>{
 let calls=0;const f={src:'a.webp',bytes:3,pack:{src:'scene.bin',revision:'v1',bytes:5,offset:1,length:3}},loader=createLoader({fetch:async()=>new Response(new Uint8Array(++calls===1?2:5)),decode:image});await assert.rejects(loader.preload([f]),e=>e.failed[0].error.message==='资源包不完整');assert.equal(loader.peek(f.src),undefined);await loader.preload([f]);assert.equal(calls,2);assert.equal(loader.get(f.src).size,3);
 const invalid=createLoader({fetch:async()=>new Response(new Uint8Array(5)),decode:image});await assert.rejects(invalid.preload([{...f,pack:{...f.pack,offset:4}}]),e=>e.failed[0].error.message==='资源包索引无效');
});
test('按需get会去重并共享全局并发限制，失败后等待明确重试',async()=>{
 let calls=0,active=0,peak=0;const files=Array.from({length:10},(_,i)=>({src:i+'.webp',bytes:100})),loader=createLoader({manifest:()=>files,maxConcurrency:2,fetch:async()=>{calls++;active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,2));active--;return response();},decode:image});assert.equal(calls,0);for(const f of files){assert.equal(loader.get(f.src),undefined);loader.get(f.src);}await loader.preload(files);assert.equal(calls,10);assert.equal(peak,2);assert.ok(files.every(f=>loader.peek(f.src)));
 let attempts=0;const failed=createLoader({fetch:async()=>{attempts++;throw Error('network');},decode:image});failed.get('missing.webp');await assert.rejects(failed.ensure('missing.webp'));failed.get('missing.webp');assert.equal(attempts,1);await assert.rejects(failed.preload(['missing.webp']));assert.equal(attempts,2);
});
test('离线源文件绕过传输包，读取原始文件；内嵌资源优先于包',async()=>{
 const file={src:'a.webp',bytes:100,revision:'image-v1',pack:{src:'scene.bin',bytes:200,offset:0,length:100,revision:'pack-v1'}},urls=[],loader=createLoader({protocol:()=> 'file:',loadLocal:async src=>{urls.push(src);return{complete:true};},fetch:async()=>{throw Error('No file fetch');}});await loader.preload([file]);assert.deepEqual(urls,['a.webp?v=image-v1']);
 const previous=globalThis.BattleEmbeddedAssets;try{globalThis.BattleEmbeddedAssets={'a.webp':'data:image/webp;base64,embedded'};const embedded=createLoader({fetch:async src=>{urls.push(src);return response();},decode:image});await embedded.preload([file]);assert.equal(urls.at(-1),'data:image/webp;base64,embedded');}finally{globalThis.BattleEmbeddedAssets=previous;}
});
test('网页入口只含一个有内容版本的脚本；小包逐项保持与原图字节一致',()=>{
 const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),scripts=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)];assert.equal(scripts.length,1);const runtime=fs.readFileSync(path.join(root,'assets/runtime/game.js'));assert.equal(scripts[0][1],'./assets/runtime/game.js?v='+crypto.createHash('sha256').update(runtime).digest('hex').slice(0,12));assert.ok(!html.includes('BattleEmbeddedAssets'));
 const context={};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/runtime-manifest.js'),'utf8'),{globalThis:context});const packs=new Map();for(const f of context.GameAssetManifest.filter(f=>f.pack)){let data=packs.get(f.pack.src);if(!data){data=fs.readFileSync(path.join(root,f.pack.src));packs.set(f.pack.src,data);assert.equal(crypto.createHash('sha256').update(data).digest('hex').slice(0,12),f.pack.revision);}assert.equal(data.length,f.pack.bytes);assert.ok(data.subarray(f.pack.offset,f.pack.offset+f.pack.length).equals(fs.readFileSync(path.join(root,f.src))));}assert.ok(packs.size>=4);assert.ok(context.GameAssetManifest.filter(f=>f.src.endsWith('/main-menu.webp')).reduce((n,f)=>n+f.bytes,0)<500000);
});
