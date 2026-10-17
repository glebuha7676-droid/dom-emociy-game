const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'assets/stories'),source='C:/Users/User/Downloads/Telegram Desktop';
const scenes=[['hot-tea','IMG_0090.JPG','kitchen'],['boo','IMG_0092.JPG','kids'],['tidy-socks','IMG_0094.JPG','parents'],['jenga','IMG_0096.JPG','living'],['drawing','IMG_0107.JPG','kids'],['new-dress','IMG_0112.JPG','parents'],['book-time','IMG_0118.JPG','grandparents'],['doll-gift','IMG_0086.JPG','kids'],['warm-socks','IMG_0088.JPG','grandparents']];
(async()=>{
 fs.mkdirSync(out,{recursive:true});const entries=[];
 for(const [id,name,room] of scenes){
  const file='assets/stories/'+id+'.webp';
  await sharp(path.join(source,name)).rotate().resize({width:1600,withoutEnlargement:true}).webp({quality:90}).toFile(path.join(root,file));
  const meta=await sharp(path.join(root,file)).metadata();entries.push({id,room,source:name,file,width:meta.width,height:meta.height});
 }
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({version:1,entries,duplicates:[{source:'IMG_0052.JPG',sameSceneAs:'IMG_0086.JPG',story:'doll-gift',note:'Same illustrated scene; keep a single story.'}],note:'Complete uncropped supplied scenes, including speech bubbles. Original files stay unchanged.'},null,2));
 console.log('Prepared nine uncropped illustrated stories; duplicate doll scene appears once.');
})();
