// Keep each bitmap embedded once, even when many characters reference an atlas.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const manifest=require('./sync-assets.cjs');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const gameAssets=JSON.parse(read('assets/game/manifest.json'));
fs.writeFileSync(path.join(root,'assets/game/manifest.js'),`// Generated from manifest.json.\nglobalThis.PengpaiAssets=${JSON.stringify(gameAssets)};\n`);
const files=['assets/characters/manifest.js','js/character-assets.js','js/rules.js','js/data.js','js/passives.js','js/game-rules.js','js/statuses.js','js/weapon-skills.js','js/engine.js','js/ui-theme.js','js/presentation.js','js/canvas-effects.js','js/skill-info.js','js/canvas-battle.js','assets/game/manifest.js','js/canvas-menu.js','js/prologue.js','js/canvas-story.js','js/app.js'];
let html=read('index.html').replace('<link rel="stylesheet" href="./styles.css">',()=>`<style>${read('styles.css')}</style>`);
for(const file of files)html=html.replace(`  <script defer src="./${file}"></script>\n`,'');
const refs=new Set();
refs.add(gameAssets.background);for(const art of Object.values(gameAssets.protagonists)){if(art.src)refs.add(art.src);if(art.portrait?.src)refs.add(art.portrait.src);}
for(const c of Object.values(manifest.characters))for(const art of Object.values(c.variants))for(const role of ['portrait','fullbody'])if(art[role]?.src)refs.add(art[role].src);
for(const file of files.filter(f=>f.startsWith('js/')))for(const match of read(file).matchAll(/['"](\.\/assets\/[^'"]+\.(?:png|jpe?g|webp))['"]/g))refs.add(match[1]);
const assets={};for(const src of refs){const ext=path.extname(src),mime=ext==='.png'?'image/png':ext==='.webp'?'image/webp':'image/jpeg';assets[src]=`data:${mime};base64,${fs.readFileSync(path.join(root,src)).toString('base64')}`;}
const bundle=`<script>globalThis.BattleEmbeddedAssets=${JSON.stringify(assets)};</script>\n`+files.map(file=>`<script>\n${read(file).replace(/<\/script/gi,'<\\/script')}\n</script>`).join('\n');
html=html.replace('</body>',()=>`${bundle}\n</body>`);fs.mkdirSync(path.join(root,'dist'),{recursive:true});fs.writeFileSync(path.join(root,'dist/index.html'),html);console.log(`Canvas 单文件构建完成 (${Buffer.byteLength(html)} bytes，${refs.size}张运行时图片)`);
