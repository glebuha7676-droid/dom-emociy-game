const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const dir=path.resolve(__dirname,'../assets/room-icons');
(async()=>{
  const rooms=[['living','Гостиная'],['kitchen','Кухня'],['kids','Детская'],['parents','Спальня 1'],['grandparents','Спальня 2']];
  const image=file=>'data:image/png;base64,'+fs.readFileSync(file).toString('base64');
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="250" viewBox="0 0 1000 250"><rect width="1000" height="250" rx="24" fill="#fff8ef"/>'+rooms.map(([id,name],i)=>`<image href="${image(path.join(dir,id+'-v1.png'))}" x="${i*200+20}" y="12" width="160" height="172" preserveAspectRatio="xMidYMid meet"/><text x="${i*200+100}" y="215" text-anchor="middle" font-family="Segoe UI,Arial" font-size="19" font-weight="600" fill="#463a30">${name}</text>`).join('')+'</svg>';
  await sharp(Buffer.from(svg)).png().toFile(path.join(dir,'icons-preview.png'));
  for(const [id] of rooms){const file=path.join(dir,id+'-v1.png'),meta=await sharp(file).metadata(),stats=await sharp(file).stats();if(!meta.hasAlpha||stats.isOpaque)throw new Error(id+' must have transparent background');console.log(`${id}: ${meta.width} x ${meta.height}, alpha OK`);}
})();
