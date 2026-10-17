const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),asset=path.join(root,'assets'),qa=path.join(root,'qa');
const data=bytes=>'data:image/png;base64,'+bytes.toString('base64');
(async()=>{
 const texture=data(fs.readFileSync(path.join(asset,'path-stone-v1.png')));
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="512" viewBox="0 0 1024 512" preserveAspectRatio="none"><defs><clipPath id="road"><path d="M360 0 H664 L864 512 H160 Z"/></clipPath><linearGradient id="contact" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#63492a" stop-opacity=".18"/><stop offset=".06" stop-color="#63492a" stop-opacity="0"/></linearGradient></defs><g clip-path="url(#road)"><image href="${texture}" width="1024" height="512" preserveAspectRatio="xMidYMid slice"/><rect width="1024" height="512" fill="url(#contact)"/></g></svg>`;
 fs.writeFileSync(path.join(asset,'home-path-v1.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(asset,'home-path-v1.png'));
 const geometry=JSON.parse(fs.readFileSync(path.join(asset,'yard-geometry.json'),'utf8'));
 const vm=require('node:vm'),ctx=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(path.join(root,'yard-layout.js'),'utf8'),ctx);
 // Same logical image box as the game; the progress strip is above this preview.
 const box={left:2,top:31,width:386,height:474,naturalWidth:1133,naturalHeight:1388,fit:'contain',position:'50% 50%',pageHeight:667,anchor:geometry};
 const road=ctx.window.EmotionYardPlacement(box);
 const scene=`<svg xmlns="http://www.w3.org/2000/svg" width="780" height="1334" viewBox="0 0 390 667"><image href="${data(fs.readFileSync(path.join(asset,'home-garden-v3.png')))}" width="390" height="667" preserveAspectRatio="none"/><image href="${data(fs.readFileSync(path.join(asset,'home-path-v1.png')))}" x="${road.center-road.width/2}" y="${road.top}" width="${road.width}" height="${road.height}" preserveAspectRatio="none"/><image href="${data(fs.readFileSync(path.join(asset,'house-five-rooms-v1.png')))}" x="2" y="31" width="386" height="474" preserveAspectRatio="xMidYMid meet"/></svg>`;
 fs.writeFileSync(path.join(qa,'yard-join-preview.svg'),scene);await sharp(Buffer.from(scene)).png().toFile(path.join(qa,'yard-join-preview.png'));
 await sharp(path.join(qa,'yard-join-preview.png')).extract({left:80,top:Math.round((road.ground-65)*2),width:620,height:260}).png().toFile(path.join(qa,'road-junction.png'));
 console.log(JSON.stringify({roadCenter:road.center,nearWidth:road.nearWidth,ground:road.ground,frameWidth:road.width,frameHeight:road.height}));
})();
