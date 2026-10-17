/* Generated portraits stay unchanged; shared SVG geometry gives exact circular frames. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let sharp;try{sharp=require('sharp');}catch{sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');}
const root=path.resolve(__dirname,'..'),out=path.join(root,'assets','avatars');
const people=[{id:'grandma',name:'Бабушка',folder:'Бабушка'},{id:'grandpa',name:'Дедушка',folder:'Дедушка'},{id:'mother',name:'Мама',folder:'Мама'},{id:'father',name:'Папа',folder:'Отец'},{id:'brother',name:'Брат',folder:'Мальчик'},{id:'sister',name:'Сестра',folder:'Девочка'}];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const data=bytes=>'data:image/png;base64,'+bytes.toString('base64');
function badge(source,name){return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="${esc(name)}"><title>${esc(name)} — спокойное выражение</title><defs><clipPath id="clip"><circle cx="256" cy="256" r="244"/></clipPath><linearGradient id="rim" x1="0" y1="0" x2="0.8" y2="1"><stop offset="0" stop-color="#fffdf7"/><stop offset=".48" stop-color="#f8f0df"/><stop offset="1" stop-color="#dbc9ae"/></linearGradient><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#766149" flood-opacity=".16"/></filter></defs><g filter="url(#shadow)"><circle cx="256" cy="256" r="244" fill="#eee6dc"/><g clip-path="url(#clip)"><image href="${source}" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet"/></g><circle cx="256" cy="256" r="244" fill="none" stroke="url(#rim)" stroke-width="5"/></g></svg>`;}
(async()=>{
  const manifest=[];
  for(const person of people){
    const source=fs.readFileSync(path.join(out,'masters',person.id+'-source.png'));
    const svg=badge(data(source),person.name);fs.writeFileSync(path.join(out,person.id+'.svg'),svg);
    await sharp(Buffer.from(svg)).png().toFile(path.join(out,person.id+'.png'));
    const metadata=await sharp(path.join(out,person.id+'.png')).metadata();assert.equal(metadata.width,512);assert.equal(metadata.height,512);assert(metadata.hasAlpha);
    const raw=await sharp(path.join(out,person.id+'.png')).ensureAlpha().raw().toBuffer();
    for(const [x,y] of [[0,0],[511,0],[0,511],[511,511]])assert.equal(raw[(y*512+x)*4+3],0,'Corners must be transparent');
    manifest.push({...person,width:512,height:512,expression:'neutral-friendly',png:person.id+'.png',svg:person.id+'.svg',source:'masters/'+person.id+'-source.png'});
  }
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({version:1,description:'Единые круглые портреты семьи',size:512,tool:'built-in image_gen; shared SVG framing',characters:manifest},null,2));
  let cards='';
  people.forEach((p,i)=>{const x=88+(i%3)*360,y=130+Math.floor(i/3)*350;cards+=`<image href="${data(fs.readFileSync(path.join(out,p.id+'.png')))}" x="${x}" y="${y}" width="280" height="280"/><text x="${x+140}" y="${y+309}" text-anchor="middle" font-size="24" font-weight="600" fill="#493e33">${p.name}</text>`;});
  const preview=`<svg xmlns="http://www.w3.org/2000/svg" width="1176" height="880" viewBox="0 0 1176 880"><rect width="1176" height="880" rx="26" fill="#f8f4ed"/><g font-family="Segoe UI, Arial, sans-serif"><text x="588" y="62" text-anchor="middle" font-size="34" font-weight="700" fill="#493e33">Семья «Дома эмоций»</text><text x="588" y="96" text-anchor="middle" font-size="17" fill="#928270">Единый размер · спокойные выражения · прозрачный фон</text>${cards}</g></svg>`;
  fs.writeFileSync(path.join(out,'family-preview.svg'),preview);await sharp(Buffer.from(preview)).png().toFile(path.join(out,'family-preview.png'));
  const html=`<!DOCTYPE html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Семья — круглые портреты</title><style>*{box-sizing:border-box}body{margin:0;background:#f8f4ed;color:#493e33;font:15px system-ui}main{max-width:1080px;margin:auto;padding:32px 24px}h1{font-size:28px;margin:0 0 8px}p{color:#928270;line-height:1.6}section{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}article{text-align:center;padding:14px;border-radius:24px;background:#fffaf3}img{width:100%;max-width:280px;display:block;margin:auto}h2{font-size:18px;margin:12px 0}a{color:#89704d;margin:0 8px;text-decoration:none;font-size:13px}.sizes{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:14px}.sizes img{margin:0;width:48px}.sizes img:last-child{width:80px}@media(max-width:620px){section{grid-template-columns:repeat(2,1fr);gap:12px}main{padding:24px 14px}}</style><main><h1>Семья «Дома эмоций»</h1><p>Шесть портретов 512 × 512. Одинаковая круглая рамка и объём. Спокойные выражения, прозрачный фон.</p><section>${people.map(p=>`<article><img src="${p.id}.png" alt="${p.name}"><h2>${p.name}</h2><a href="${p.id}.png" download>PNG · 512 × 512</a><a href="${p.id}.svg" download>SVG</a><div class="sizes"><img src="${p.id}.png" alt="48 px"><img src="${p.id}.png" alt="80 px"></div></article>`).join('')}</section></main></html>`;
  fs.writeFileSync(path.join(out,'index.html'),html);
  // Inspection sheets of the source collection; source files remain unchanged.
  const qa=path.join(root,'qa','character-reference-sheets');fs.mkdirSync(qa,{recursive:true});
  for(const person of people){
    const folder=path.join(root,'ПЕРСОНАЖИ И ИХ ЭМОЦИИ',person.folder),files=fs.readdirSync(folder).filter(f=>/\.(png|jpe?g|webp)$/i.test(f)).sort((a,b)=>a.localeCompare(b,'ru'));
    let thumbnails='';
    for(let i=0;i<files.length;i++){
      const thumb=await sharp(path.join(folder,files[i])).resize(150,200,{fit:'contain',background:'#f7f2ec'}).png().toBuffer(),x=12+i%6*176,y=55+Math.floor(i/6)*240;
      thumbnails+=`<image href="${data(thumb)}" x="${x}" y="${y}" width="150" height="200"/><text x="${x+75}" y="${y+220}" text-anchor="middle" font-size="12" fill="#493e33">${esc(files[i].replace(/\.[^.]+$/,''))}</text>`;
    }
    const sheet=`<svg xmlns="http://www.w3.org/2000/svg" width="1056" height="${60+Math.ceil(files.length/6)*240}"><rect width="100%" height="100%" fill="#f7f2ec"/><g font-family="Segoe UI, Arial, sans-serif"><text x="20" y="32" font-size="24" fill="#493e33">${person.name} — ${files.length} исходных изображений</text>${thumbnails}</g></svg>`;
    await sharp(Buffer.from(sheet)).png().toFile(path.join(qa,person.id+'.png'));
  }
  console.log('PASS: six 512 x 512 RGBA avatars, identical circle geometry, transparent corners, previews and source inventory sheets.');
})().catch(error=>{console.error(error);process.exitCode=1;});
