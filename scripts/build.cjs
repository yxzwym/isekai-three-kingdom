// Keep each bitmap embedded once, even when many characters reference an atlas.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const manifest=require('./sync-assets.cjs');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const files=['assets/characters/manifest.js','js/character-assets.js','js/rules.js','js/data.js','js/engine.js','js/presentation.js','js/canvas-effects.js','js/canvas-battle.js','js/app.js'];
let html=read('index.html').replace('<link rel="stylesheet" href="./styles.css">',()=>`<style>${read('styles.css')}</style>`);
for(const file of files)html=html.replace(`  <script defer src="./${file}"></script>\n`,'');
const refs=new Set();
for(const c of Object.values(manifest.characters))for(const art of Object.values(c.variants))if(art.portrait?.src)refs.add(art.portrait.src);
for(const file of files.filter(f=>f.startsWith('js/')))for(const match of read(file).matchAll(/['"](\.\/assets\/[^'"]+\.(?:png|jpe?g|webp))['"]/g))refs.add(match[1]);
const assets={};for(const src of refs){const ext=path.extname(src),mime=ext==='.png'?'image/png':ext==='.webp'?'image/webp':'image/jpeg';assets[src]=`data:${mime};base64,${fs.readFileSync(path.join(root,src)).toString('base64')}`;}
const bundle=`<script>globalThis.BattleEmbeddedAssets=${JSON.stringify(assets)};</script>\n`+files.map(file=>`<script>\n${read(file).replace(/<\/script/gi,'<\\/script')}\n</script>`).join('\n');
html=html.replace('</body>',()=>`${bundle}\n</body>`);fs.mkdirSync(path.join(root,'dist'),{recursive:true});fs.writeFileSync(path.join(root,'dist/index.html'),html);console.log(`Canvas 单文件构建完成 (${Buffer.byteLength(html)} bytes，${refs.size}张运行时图片)`);
