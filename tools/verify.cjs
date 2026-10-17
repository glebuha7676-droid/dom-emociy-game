/* Проверка игрового цикла, редактора, сохранений и автономного экспорта. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
const url='http://127.0.0.1:8937',root=path.resolve(__dirname,'..'),qa=path.join(root,'qa');
fs.mkdirSync(qa,{recursive:true});
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  const context=await browser.newContext({viewport:{width:1440,height:1080},acceptDownloads:true});
  const errors=[];context.on('page',page=>page.on('pageerror',e=>errors.push(e.message)));
  const page=await context.newPage();
  await page.goto(url);await page.waitForFunction(()=>window.EmotionGame);
  const metrics=()=>page.evaluate(()=>{const s=document.querySelector('.scroll-area'),p=document.querySelector('.page'),h=document.querySelector('.house-image-wrap'),g=document.querySelector('#game');return {gameWidth:g.offsetWidth,gameHeight:g.offsetHeight,pageWidth:p.offsetWidth,houseWidth:h.offsetWidth,houseHeight:h.offsetHeight,scroll:s.scrollHeight-s.clientHeight};});
  const desktop=await metrics();console.log('HOME',desktop);assert(desktop.scroll<=2,'Home must fit one screen');
  await page.screenshot({path:path.join(qa,'game-desktop.png')});
  for(const viewport of [{width:390,height:844},{width:360,height:800},{width:375,height:667},{width:430,height:932},{width:844,height:390}]){
    await page.setViewportSize(viewport);await page.waitForTimeout(60);const mobile=await metrics();assert.deepEqual(mobile,desktop,'Logical layout must match on all devices');
    if(viewport.width===390)await page.screenshot({path:path.join(qa,'game-phone.png')});
  }
  await page.setViewportSize({width:1440,height:1080});
  await page.locator('.cta').click();await page.locator('[data-action="start-level"][data-level="1"]').first().click();
  for(let i=0;i<8;i++){
    const correct=await page.evaluate(()=>{const q=EmotionGame.getState().quiz;return q.questions[q.index].correct;});
    await page.locator(`[data-action="answer"][data-index="${correct}"]`).click();
    const overflow=await page.evaluate(()=>{const s=document.querySelector('.scroll-area');return s.scrollHeight-s.clientHeight;});
    assert(overflow<=2,'Quiz answer and explanation must fit');
    if(i===0)await page.screenshot({path:path.join(qa,'quiz-answer.png')});
    await page.locator('[data-action="next-question"]').click();
  }
  assert.equal(await page.evaluate(()=>EmotionGame.getState().progress.unlockedLevel),2);
  await page.reload();await page.waitForFunction(()=>window.EmotionGame);assert.equal(await page.evaluate(()=>EmotionGame.getState().progress.levelStars[1]),3);
  await page.locator('[data-action="daily"]').click();
  for(let i=0;i<5;i++){const correct=await page.evaluate(()=>{const q=EmotionGame.getState().quiz;return q.questions[q.index].correct;});await page.locator(`[data-action="answer"][data-index="${correct}"]`).click();await page.locator('[data-action="next-question"]').click();}
  assert.equal(await page.evaluate(()=>EmotionGame.getState().progress.dailyDates.length),1);
  await page.locator('[data-to="home"]').first().click();await page.locator('[data-room="living"]').click();await page.locator('[data-story="gift"]').click();await page.locator('[data-action="story-next"]').click();
  for(let i=0;i<2;i++){await page.locator('[data-action="story-answer"][data-index="0"]').click();await page.locator('[data-action="story-next"]').click();}
  assert((await page.evaluate(()=>EmotionGame.getState().progress.storiesDone)).includes('gift'));
  console.log('Game flow, stars, daily and stories: OK');
  await page.goto(url+'/editor.html');await page.waitForFunction(()=>document.querySelector('.layer-row'));await page.waitForTimeout(200);
  await page.screenshot({path:path.join(qa,'editor.png')});
  const game=page.frames().find(f=>f.url().includes('editor=1'));
  await page.locator('[data-inspector="theme"]').click();await page.locator('input[type=text][data-theme="coral"]').fill('#4455aa');await page.locator('input[type=text][data-theme="coral"]').press('Tab');
  await page.waitForTimeout(150);assert.equal(await game.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--coral')),'#4455aa');
  await page.locator('[data-inspector="element"]').click();
  const houseKey=await game.locator('.house-image').getAttribute('data-edit-key');
  await page.locator(`button[data-select="${houseKey}"]`).click();
  await page.locator('[data-style="height"]').fill('220');await page.locator('[data-style="height"]').press('Tab');
  await game.waitForFunction(()=>document.querySelector('.house-image').style.height==='220px');
  assert.equal(await game.locator('.house-image').evaluate(el=>el.style.height),'220px');
  await page.locator('[data-hidden-selected]').click();await game.waitForFunction(()=>getComputedStyle(document.querySelector('.house-image')).display==='none');assert.equal(await game.locator('.house-image').evaluate(el=>getComputedStyle(el).display),'none');
  await page.locator('#undo').click();await page.waitForTimeout(100);assert.notEqual(await game.locator('.house-image').evaluate(el=>getComputedStyle(el).display),'none');
  // Change a hotspot by dragging. Coordinates account for both iframe and logical scene scales.
  const hotspotKey=await game.locator('.room-hotspot.living').getAttribute('data-edit-key');
  await page.locator(`button[data-select="${hotspotKey}"]`).click();
  let box=await game.locator('.room-hotspot.living').boundingBox();
  await page.mouse.move(box.x+5,box.y+5);await page.mouse.down();await page.mouse.move(box.x+25,box.y+21,{steps:5});await page.mouse.up();await page.waitForTimeout(150);
  const moved=await game.locator('.room-hotspot.living').evaluate(el=>el.style.translate);assert(moved&&moved!=='0px','Drag must create a position override');
  await page.locator(`button[data-select="${hotspotKey}"]`).click();
  box=await game.locator('.design-handle').boundingBox();await page.mouse.move(box.x+5,box.y+5);await page.mouse.down();await page.mouse.move(box.x+25,box.y+15,{steps:5});await page.mouse.up();await page.waitForTimeout(100);
  assert(await game.locator('.room-hotspot.living').evaluate(el=>!!el.style.width),'Resize must create width override');
  console.log('Theme, inspector, hide/undo, drag and resize: OK');
  // Upload a real image into the shared portrait slot.
  await page.locator('[data-tab="assets"]').click();await page.locator('[data-asset-group="portraits"]').click();
  await page.locator('[data-asset="portrait:grandma:joy"]').click();
  await page.locator('[data-upload-slot="portrait:grandma:joy"]').click();
  await page.locator('#image-file').setInputFiles({name:'portrait.png',mimeType:'image/png',buffer:fs.readFileSync(path.join(qa,'game-phone.png'))});
  await page.waitForFunction(()=>document.querySelector('.asset-preview')?.src.startsWith('data:image/png'));
  await page.locator('[data-tab="content"]').click();await page.locator('[data-content="title"]').fill('Проверочная история');await page.locator('[data-content="title"]').press('Tab');
  await page.locator('[data-preview-story="gift"]').click();await page.waitForTimeout(150);assert((await game.locator('.page-header h1').textContent()).includes('Проверочная история'));
  await page.locator('#save-now').click();await page.waitForFunction(()=>document.querySelector('#save-state').textContent.includes('Все изменения сохранены'));
  await page.reload();await page.waitForFunction(()=>document.querySelector('.layer-row'));await page.waitForTimeout(150);
  const reloadedGame=page.frames().find(f=>f.url().includes('editor=1'));
  assert.equal(await reloadedGame.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--coral')),'#4455aa');
  assert((await reloadedGame.evaluate(()=>DesignRuntime.getProject().assets['portrait:grandma:joy'])).startsWith('data:image/png'));
  assert.equal(await reloadedGame.evaluate(()=>GAME_DATA.stories[0].title),'Проверочная история');
  const gameDownload=page.waitForEvent('download');await page.locator('#export-game').click();const download=await gameDownload;const exported=path.join(qa,'exported-game.html');await download.saveAs(exported);
  const offline=await context.newPage();await offline.route(/^https?:/,route=>route.abort());await offline.goto('file:///'+exported.replaceAll('\\','/'));await offline.waitForFunction(()=>window.EmotionGame);
  assert.equal(await offline.locator('.house-image').evaluate(el=>el.src.startsWith('data:image/png')),true);
  assert.equal(await offline.evaluate(()=>GAME_DATA.stories[0].title),'Проверочная история');
  const projectDownload=page.waitForEvent('download');await page.locator('#export-project').click();const pd=await projectDownload;const json=path.join(qa,'exported-project.json');await pd.saveAs(json);
  await page.locator('#import-project').click();await page.locator('#project-file').setInputFiles(json);await page.waitForTimeout(150);
  assert.equal(await reloadedGame.evaluate(()=>GAME_DATA.stories[0].title),'Проверочная история');
  await page.locator('#play-mode').click();
  // Exercise both free question formats with four options without changing earned progress.
  for(const type of ['name','find']){
    await reloadedGame.evaluate(type=>EmotionGame.preview('quiz-'+type),type);
    await reloadedGame.evaluate(()=>{const q=EmotionGame.getState().quiz.questions[0];q.opts=['joy','sadness','anger','surprise'];q.correct=q.opts.indexOf(q.emotion);EmotionGame.render();});
    await reloadedGame.locator('[data-action="answer"][data-index="0"]').click();
    assert((await reloadedGame.evaluate(()=>{const s=document.querySelector('.scroll-area');return s.scrollHeight-s.clientHeight;}))<=2,'Four-choice quiz must fit with explanation');
  }
  await page.locator('#edit-mode').click();await page.locator('#screen-select').selectOption('home');await page.locator('[data-tab="layers"]').click();
  const ctaKey=await reloadedGame.locator('.cta').getAttribute('data-edit-key');
  await page.locator(`button[data-select="${ctaKey}"]`).click();
  const indexBefore=await reloadedGame.locator('.cta').evaluate(el=>[...el.parentElement.children].indexOf(el));
  await page.locator('[data-reorder="-1"]').click();await page.waitForTimeout(100);
  assert.equal(await reloadedGame.locator('.cta').evaluate(el=>[...el.parentElement.children].indexOf(el)),indexBefore-1);
  await page.locator('[data-add="text"]').click();await reloadedGame.waitForSelector('.custom-text');
  await page.waitForTimeout(150);await page.locator('[data-element="text"]').fill('Добавленный текст');await page.locator('[data-element="text"]').press('Tab');
  await reloadedGame.waitForFunction(()=>document.querySelector('.custom-text').textContent==='Добавленный текст');
  await page.locator('#delete-custom').click();await reloadedGame.waitForFunction(()=>!document.querySelector('.custom-text'));
  const local=await context.newPage();await local.goto('file:///'+path.join(root,'editor.html').replaceAll('\\','/'));await local.waitForSelector('.layer-row');
  console.log('Four-option layouts, reordering, custom elements and file:// editor: OK');
  assert.deepEqual(errors,[],'No JavaScript errors');
  console.log('Assets, content, autosave, reload, JSON and offline HTML export: OK');
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
