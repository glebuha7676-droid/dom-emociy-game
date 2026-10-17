/* Build a static, portable game for GitHub Pages; editor/server stay in the source repo. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),out=path.join(root,'_site');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const files=['index.html','styles.css','mobile.css','game-data.js','story-data.js','portrait-data.js','project.js','project-store.js','yard-layout.js','design-runtime.js','app.js'];
const assets=[
 'assets/house-five-rooms-v1.png','assets/home-garden-v3.png','assets/home-path-v1.png',
 ...['grandma','grandpa','mother','father','brother','sister'].map(id=>`assets/avatars/${id}.png`),
 ...['living','kitchen','kids','parents','grandparents'].map(id=>`assets/room-icons/${id}-v1.png`),
 ...['recognize','find','medal','daily'].map(id=>`assets/training-icons/${id}-v1.png`),
 ...JSON.parse(read('assets/characters/manifest.json')).entries.map(entry=>entry.file),
 ...JSON.parse(read('assets/stories/manifest.json')).entries.map(entry=>entry.file)
];
// Keep cleanup strictly inside this project's generated _site folder.
if(path.dirname(out)!==root||path.basename(out)!=='_site')throw new Error('Unexpected site output path');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
for(const file of [...files,...assets]){const target=path.join(out,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);}
const html=read('index.html').replace(/\s*<a class="studio-link"[\s\S]*?<\/a>/,'');
fs.writeFileSync(path.join(out,'index.html'),html);fs.writeFileSync(path.join(out,'.nojekyll'),'');
const ctx=vm.createContext({window:{}});vm.runInContext(read('project.js'),ctx,{timeout:1000});
const preset=ctx.window.EMOTION_PROJECT||{version:1,name:'Дом эмоций',theme:{},elements:{},assets:{},content:{},additions:{}};
fs.writeFileSync(path.join(out,'project.js'),'window.EMOTION_PROJECT='+JSON.stringify(preset).replace(/</g,'\\u003c')+';\n');
const app=read('app.js').replace("const KEY = 'dom-emociy-demo-v1';","const KEY = 'dom-emociy-progress-v1:' + location.pathname.replace(/\\/[^\\/]*$/, '/');");
fs.writeFileSync(path.join(out,'app.js'),app);
console.log(`Static game ready: ${files.length} code files, ${assets.length} images. Output: _site/`);
