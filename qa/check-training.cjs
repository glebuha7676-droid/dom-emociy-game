const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
(async()=>{
 const manifest=JSON.parse(read('assets/characters/manifest.json'));
 assert.equal(manifest.entries.length,36);
 for(const entry of manifest.entries){const meta=await sharp(path.join(root,entry.file)).metadata();assert.equal(meta.width,448);assert.equal(meta.height,600);assert.equal(meta.format,'webp');}
 assert(!manifest.entries.some(entry=>entry.emotion==='shyness'),'Shame must not be silently relabelled as shyness');
 const main={innerHTML:''},page={classList:{toggle(){}}},device={classList:{toggle(){}}},scroll={scrollTop:0},handlers={};
 const project={assets:{}},window={DesignRuntime:{ready:Promise.resolve(),rendered(){},getProject:()=>project}};
 const context=vm.createContext({window,document:{querySelector:s=>({'#game':main,'.page':page,'.device':device,'.scroll-area':scroll}[s]),addEventListener:(type,fn)=>handlers[type]=fn},localStorage:{getItem:()=>JSON.stringify({unlockedLevel:17,levelStars:{},dailyDates:[],storiesDone:[],weeklyClaimed:[]}),setItem(){}},setTimeout:()=>0,console});
 vm.runInContext(read('game-data.js'),context);vm.runInContext(read('story-data.js'),context);vm.runInContext(read('portrait-data.js'),context);await vm.runInContext(read('app.js'),context);
 const click=dataset=>handlers.click({target:{closest:()=>({dataset,disabled:false})}});
 assert(main.innerHTML.includes('class="star-score"'));assert(main.innerHTML.includes('aria-valuenow="0"'));
 click({action:'nav',to:'training'});
 assert(main.innerHTML.includes('training-hero-row'));assert(main.innerHTML.includes('Выбери игру'));assert(main.innerHTML.includes('data-training-icon="recognize"'));assert(main.innerHTML.includes('data-training-icon="find"'));assert(main.innerHTML.includes('data-training-icon="daily"'));
 assert.equal((main.innerHTML.match(/class="level-node /g)||[]).length,16);assert.equal((main.innerHTML.match(/data-action="free-mode"/g)||[]).length,2);
 assert(main.innerHTML.indexOf('Выбери игру')<main.innerHTML.indexOf('path-section-head'));
 let count=0;
 for(let level=1;level<=16;level++){
  click({action:'start-level',level:String(level)});
  for(let i=0;i<8;i++){
   const quiz=window.EmotionGame.getState().quiz,q=quiz.questions[quiz.index];
   assert.equal(q.opts[q.correct],q.emotion);assert(manifest.portraits[q.character][q.emotion]);
   assert(main.innerHTML.includes('portrait-source'));assert(main.innerHTML.includes('quiz-response'));
   assert(!main.innerHTML.includes('class="feedback '));
   if(q.kind==='find')for(const emotion of q.opts)assert(manifest.portraits[q.character][emotion],`${q.character}:${emotion}`);
   else{assert(main.innerHTML.indexOf('portrait-container')<main.innerHTML.indexOf('quiz-question'),'Question belongs below the large image');assert(main.innerHTML.indexOf('portrait-source')<main.innerHTML.indexOf('portrait-name'));}
   click({action:'answer',index:String(q.correct)});assert(main.innerHTML.includes('class="feedback '));
   assert(main.innerHTML.includes(`data-char="${q.character}" data-emotion="${q.emotion}"`));
   count++;click({action:'next-question'});
  }
 }
 // A newly supplied missing expression immediately becomes eligible too.
 click({action:'nav',to:'home'});assert(main.innerHTML.includes('aria-valuenow="16"'));assert(main.innerHTML.includes('Твои звёзды: 48 из 48'));
 project.assets['portrait:mother:shyness']='data:image/webp;base64,YQ==';
 window.GAME_DATA.chapters[0].emotions=['shyness'];window.EmotionGame.preview('quiz-name');
 assert.equal(window.EmotionGame.getState().quiz.questions[0].character,'mother');assert.equal(window.EmotionGame.getState().quiz.questions[0].emotion,'shyness');assert(main.innerHTML.includes(project.assets['portrait:mother:shyness']));
 const bundleContext=vm.createContext({window:{}});vm.runInContext(read('export-bundle.js'),bundleContext);
 const defaults=bundleContext.window.EMOTION_EXPORT.defaults;
 for(const entry of manifest.entries)assert(defaults[`portrait:${entry.id}:${entry.emotion}`].startsWith('data:image/webp;base64,'));
 const css=read('mobile.css');assert(!css.includes('.page:has(.feedback) .portrait-container .portrait'));
 console.log(`PASS: ${count} questions across all levels use matching real expressions; 36 equal 448 x 600 portraits; question below image; no feedback-driven resizing; images embedded in export.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
