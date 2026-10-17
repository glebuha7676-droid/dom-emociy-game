const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
async function game(unlockedLevel){
 const main={innerHTML:''},scroll={scrollTop:0},page={classList:{toggle(){}}},device={classList:{toggle(){}}},events={},project={assets:{}};
 const saved=new Map([['dom-emociy-demo-v1',JSON.stringify({unlockedLevel,levelStars:{1:3},dailyDates:[],storiesDone:['gift'],weeklyClaimed:[]})]]);
 const window={DesignRuntime:{ready:Promise.resolve(),rendered(){},getProject:()=>project}};
 const context=vm.createContext({window,document:{querySelector:s=>({'#game':main,'.page':page,'.device':device,'.scroll-area':scroll}[s]||null),addEventListener:(type,fn)=>events[type]=fn},localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)},setTimeout:()=>0,console});
 for(const name of ['game-data.js','story-data.js','portrait-data.js'])vm.runInContext(read(name),context);await vm.runInContext(read('app.js'),context);
 return {main,window,project,events,click:dataset=>events.click({target:{closest:()=>({dataset,disabled:false})}})};
}
(async()=>{
 const g=await game(17),stories=g.window.GAME_DATA.stories,manifest=JSON.parse(read('assets/stories/manifest.json'));
 assert.equal(stories.length,9);assert.equal(new Set(stories.map(s=>s.id)).size,9);assert.equal(manifest.entries.length,9);
 const expected={living:1,kitchen:1,kids:3,parents:2,grandparents:2};
 for(const [room,count] of Object.entries(expected)){
  assert.equal(stories.filter(s=>s.room===room).length,count);g.click({action:'room',room});assert.equal((g.main.innerHTML.match(/class="story-thumbnail"/g)||[]).length,count);
 }
 for(const st of stories){
  assert.equal(st.options.length,3);assert.equal(st.followOptions.length,3);assert(st.correct>=0&&st.correct<3);assert(st.followCorrect>=0&&st.followCorrect<3);
  const entry=manifest.entries.find(e=>e.id===st.id),meta=await sharp(path.join(root,st.sceneImage)).metadata();assert.equal(meta.width,1600);assert.equal(meta.height,entry.height);
  g.click({action:'story',story:st.id});assert(g.main.innerHTML.includes(st.sceneImage));assert(!g.main.innerHTML.includes('story-people'));
  assert.equal(g.window.EmotionGame.getState().story.step,0);
  g.click({action:'zoom-story-image',story:st.id});assert(g.main.innerHTML.includes('role="dialog"'));assert.equal(g.window.EmotionGame.getState().story.step,0);
  g.events.keydown({key:'Escape',preventDefault(){}});assert(!g.main.innerHTML.includes('role="dialog"'));
  g.click({action:'story-next'});assert.equal(g.window.EmotionGame.getState().story.step,1);
  g.click({action:'story-answer',index:String((st.correct+1)%3)});assert(g.main.innerHTML.includes('feedback wrong'));
  g.click({action:'story-next'});assert.equal(g.window.EmotionGame.getState().story.step,2);assert(g.main.innerHTML.includes(st.sceneImage));
  g.click({action:'story-answer',index:String(st.followCorrect)});g.click({action:'story-next'});assert.equal(g.window.EmotionGame.getState().story.step,3);
  assert(g.window.EmotionGame.getState().progress.storiesDone.includes(st.id));
 }
 const progress=g.window.EmotionGame.getState().progress;assert.equal(progress.storiesDone.length,9);assert(progress.archivedStoriesDone.includes('gift'));assert.equal(progress.levelStars[1],3);
 const p=await game(1);for(const room of Object.keys(expected))assert(stories.some(st=>st.room===room&&st.unlock===1));
 p.click({action:'story',story:'boo'});assert.notEqual(p.window.EmotionGame.getState().screen,'story','Locked stories stay locked');
 const st=stories[0];g.project.assets['story:'+st.id]='data:image/webp;base64,dGVzdA==';g.window.EmotionGame.preview('story-'+st.id+':0');assert(g.main.innerHTML.includes(g.project.assets['story:'+st.id]));
 const bundleContext=vm.createContext({window:{}});vm.runInContext(read('export-bundle.js'),bundleContext);for(const st of stories)assert(bundleContext.window.EMOTION_EXPORT.defaults['story:'+st.id].startsWith('data:image/webp;base64,'));
 console.log('PASS: nine unique scenes in five rooms, 18 questions, wrong/correct explanations, image zoom and close, completion rewards, unlock rules, editor image overrides, legacy progress preservation, embedded export.');
})().catch(error=>{console.error(error);process.exitCode=1;});
