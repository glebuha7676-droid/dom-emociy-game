// Smoke-check rendering and room navigation without controlling a browser.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,name),'utf8');
(async()=>{
  const main={innerHTML:''},scroll={scrollTop:0},page={classList:{toggle(){}}},deviceClasses=new Set(),device={classList:{toggle:(name,enabled)=>enabled?deviceClasses.add(name):deviceClasses.delete(name)}},events={},saved=new Map();
  const window={DesignRuntime:{ready:Promise.resolve(),rendered(){}}};
  const context=vm.createContext({window,document:{querySelector:s=>({'#game':main,'.page':page,'.device':device,'.scroll-area':scroll}[s]||null),addEventListener:(name,fn)=>events[name]=fn},localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)},setTimeout:()=>0,console});
  vm.runInContext(read('game-data.js'),context);vm.runInContext(read('story-data.js'),context);vm.runInContext(read('portrait-data.js'),context);await vm.runInContext(read('app.js'),context);
  assert(main.innerHTML.includes('assets/house-five-rooms-v1.png'));
  assert(deviceClasses.has('home-device'),'Garden backdrop must be enabled on home');
  assert(!main.innerHTML.includes('Привет, исследователь'));
  assert(!main.innerHTML.includes('Маленькие шаги'));
  assert.equal((main.innerHTML.match(/class="room-hotspot /g)||[]).length,5);
  assert.equal((main.innerHTML.match(/class="room-icon"/g)||[]).length,5);
  assert.equal((main.innerHTML.match(/class="resident-portrait"/g)||[]).length,6);
  assert.equal((main.innerHTML.match(/class="room-residents"/g)||[]).length,3);
  assert(main.innerHTML.includes('Спальня 1'));assert(main.innerHTML.includes('Спальня 2'));
  for(const r of window.GAME_DATA.rooms){assert(fs.existsSync(path.join(root,r.iconImage)));for(const id of r.residents)assert(main.innerHTML.includes(`data-resident-id="${id}"`));}
  function click(dataset){events.click({target:{closest:()=>({dataset,disabled:false})}});}
  for(const r of window.GAME_DATA.rooms){click({action:'room',room:r.id});assert.equal(window.EmotionGame.getState().screen,'room');assert(!deviceClasses.has('home-device'),'Garden backdrop must stay on home only');assert(main.innerHTML.includes(r.name));click({action:'nav',to:'home'});assert(deviceClasses.has('home-device'));}
  click({action:'start-level',level:'1'});
  for(let i=0;i<8;i++){const q=window.EmotionGame.getState().quiz;click({action:'answer',index:String(q.questions[q.index].correct)});click({action:'next-question'});}
  assert.equal(window.EmotionGame.getState().progress.levelStars[1],3);
  const bundleContext=vm.createContext({window:{}});vm.runInContext(read('export-bundle.js'),bundleContext);
  const bundle=bundleContext.window.EMOTION_EXPORT;assert(bundle.house.startsWith('data:image/png;base64,'));
  const exportedImage=Buffer.from(bundle.house.split(',')[1],'base64');assert(exportedImage.equals(fs.readFileSync(path.join(root,'assets/house-five-rooms-v1.png'))));
  const exportedBackdrop=Buffer.from(bundle.homeBackground.split(',')[1],'base64');assert(exportedBackdrop.equals(fs.readFileSync(path.join(root,'assets/home-garden-v3.png'))));
  const exportedPath=Buffer.from(bundle.homePath.split(',')[1],'base64');assert(exportedPath.equals(fs.readFileSync(path.join(root,'assets/home-path-v1.png'))));
  vm.runInContext(read('yard-layout.js'),context);
  const a=window.GAME_DATA.yardGeometry,box={left:2,top:132,width:386,height:474,pageHeight:768,fit:'contain',position:'50% 50%',anchor:a};
  const road=window.EmotionYardPlacement(box),factor=Math.min(box.width/a.imageWidth,box.height/a.imageHeight),fittedWidth=a.imageWidth*factor,fittedHeight=a.imageHeight*factor;
  const close=(actual,expected)=>assert(Math.abs(actual-expected)<.000001,`${actual} != ${expected}`);
  close(road.center,195);close(road.nearWidth,fittedWidth*(a.stairsRight-a.stairsLeft)/a.imageWidth);
  close(road.width*(a.roadTopRight-a.roadTopLeft)/a.roadViewWidth,road.nearWidth);
  close(road.top,132+(474-fittedHeight)/2+factor*a.stairsBottom-1);close(road.top+road.height,768);
  const moved=window.EmotionYardPlacement({...box,left:22,top:152});close(moved.center,road.center+20);close(moved.top,road.top+20);
  const smaller=window.EmotionYardPlacement({...box,width:193,height:237});close(smaller.nearWidth,road.nearWidth/2);
  const fill=window.EmotionYardPlacement({...box,fit:'fill'});close(fill.nearWidth,386*(a.stairsRight-a.stairsLeft)/a.imageWidth);
  for(const script of bundle.scripts)new vm.Script(script);
  const demo=read('demo-one-file.html');assert(demo.includes(bundle.house));assert(demo.includes(bundle.homeBackground));assert(demo.includes(bundle.homePath));assert(demo.includes('backdrop-filter:blur(7px)'));
  for(const [slot,src] of Object.entries(bundle.defaults)){assert(demo.includes(src),`Missing embedded ${slot}`);const [,id,emotion]=slot.split(':'),file=slot.startsWith('story:')?`assets/stories/${id}.webp`:slot.startsWith('portrait:')?`assets/characters/${id}/${emotion}.webp`:slot.startsWith('trainingIcon:')?`assets/training-icons/${id}-v1.png`:slot.startsWith('roomIcon:')?`assets/room-icons/${id}-v1.png`:`assets/avatars/${id}.png`;assert(Buffer.from(src.split(',')[1],'base64').equals(fs.readFileSync(path.join(root,file))));}
  console.log('PASS: house, 5 room routes, level rewards, embedded garden/path, exact stair alignment, movement and resizing, export scripts.');
  console.log(`PNG: ${exportedImage.readUInt32BE(16)} x ${exportedImage.readUInt32BE(20)}; house stage: 386 x 474 logical px.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
