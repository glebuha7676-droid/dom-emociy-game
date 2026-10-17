// Persistence integration and a drag/mode regression without a browser.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,name),'utf8');
async function serverCheck(){
  const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'emotion-save-'));let server;
  const start=async()=>{server=require('../serve.cjs').createServer(fixture);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return 'http://127.0.0.1:'+server.address().port;};
  try{
    fs.writeFileSync(path.join(fixture,'project-store.js'),read('project-store.js'));
    fs.writeFileSync(path.join(fixture,'project.js'),'window.EMOTION_PROJECT=null;');
    fs.writeFileSync(path.join(fixture,'export-bundle.js'),read('export-bundle.js'));
    fs.writeFileSync(path.join(fixture,'demo-one-file.html'),'previous demo');
    let url=await start();const sourceBefore=read('project.js');
    const project={version:1,name:'Семья </script><script>bad()</script>',theme:{coral:'#112233'},elements:{'home/page/cta:0':{text:'Моя тренировка',style:{x:44,y:28,width:322,height:70,opacity:.8}},'home/page/hidden:0':{hidden:true}},assets:{house:'data:image/png;base64,aGVsbG8='},content:{rooms:{living:{name:'Наша гостиная'}}},additions:{home:[{id:'note',type:'text',text:'Привет'}]}};
    let response=await fetch(url+'/api/project',{method:'POST',headers:{'Content-Type':'application/json',Origin:url},body:JSON.stringify(project)});
    assert.equal(response.status,200);assert.equal((await response.json()).saved,true);
    const get=await (await fetch(url+'/api/project')).json();assert.deepEqual(get.project,project);
    const context=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(path.join(fixture,'project.js'),'utf8'),context);
    assert.equal(JSON.stringify(context.window.EMOTION_PROJECT),JSON.stringify(project));
    const demo=fs.readFileSync(path.join(fixture,'demo-one-file.html'),'utf8');
    assert(demo.includes('Моя тренировка'));assert(!demo.includes('<script>bad()'));
    const scripts=[...demo.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);for(const script of scripts)new vm.Script(script);
    vm.runInContext(scripts[0],context);assert.equal(context.window.EMOTION_PROJECT.elements['home/page/cta:0'].style.x,44);assert(context.window.EMOTION_PROJECT.assets.homePath.startsWith('data:image/png;'));
    for(const id of ['living','kitchen','kids','grandparents','parents'])assert(context.window.EMOTION_PROJECT.assets['roomIcon:'+id].startsWith('data:image/png;'));
    for(const id of ['grandma','grandpa','mother','father','brother','sister'])assert(context.window.EMOTION_PROJECT.assets['avatar:'+id].startsWith('data:image/png;'));
    const saved=fs.readFileSync(path.join(fixture,'project.js'),'utf8');
    for(const [body,origin,expected] of [['{',url,400],[JSON.stringify({...project,version:9}),url,400],[JSON.stringify(project),'https://unrelated.example',403]]){
      response=await fetch(url+'/api/project',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body});assert.equal(response.status,expected);assert.equal(fs.readFileSync(path.join(fixture,'project.js'),'utf8'),saved);
    }
    await new Promise(resolve=>server.close(resolve));url=await start();assert.deepEqual((await (await fetch(url+'/api/project')).json()).project,project);
    assert.equal(read('project.js'),sourceBefore,'Tests must preserve the real user project');
    console.log('PASS: save to source and standalone HTML, restart persistence, every design section, invalid-save protection.');
  }finally{if(server?.listening)await new Promise(resolve=>server.close(resolve));fs.rmSync(fixture,{recursive:true,force:true});}
}
async function storageCheck(){
  const disk={version:1,name:'Disk',theme:{},elements:{},assets:{},content:{},additions:{}};
  const draft={...disk,name:'Draft',elements:{button:{style:{x:44,y:28}}}},values=new Map([['emotion-design-fallback',JSON.stringify(draft)]]),events={};
  const window={EMOTION_PROJECT:disk,addEventListener:(name,fn)=>events[name]=fn};
  const ctx=vm.createContext({window,localStorage:{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)},structuredClone,location:{protocol:'http:'},fetch:async()=>({ok:true,json:async()=>({project:disk})})});
  vm.runInContext(read('project-store.js'),ctx);
  assert.equal((await window.EmotionStorage.load()).name,'Draft');assert.equal((await window.EmotionStorage.load({preferPublished:true})).name,'Disk');
  let applied;window.EmotionStorage.onPublished(p=>applied=p);events.storage({key:'emotion-game-published',newValue:'new'});await new Promise(resolve=>setImmediate(resolve));assert.equal(applied.name,'Disk');
  values.clear();assert.equal((await window.EmotionStorage.load()).name,'Disk');
  console.log('PASS: editor recovers draft, game loads saved file, live update notification, source fallback.');
}
async function dragCheck(){
  class Element{
    constructor(tag,cls){this.tagName=tag;this.classes=cls?cls.split(' '):[];this.dataset={};this.children=[];this.childNodes=[];this.style={};this.attrs={};this.textContent='';this.classList={contains:c=>this.classes.includes(c),toggle:()=>{},remove:()=>{},add:()=>{},[Symbol.iterator]:()=>this.classes[Symbol.iterator]()};}
    add(child){child.parentElement=this;this.children.push(child);return child;}
    matches(selector){return selector.split(',').some(s=>s.trim().startsWith('.')?this.classes.includes(s.trim().slice(1)):s.trim()===this.tagName);}
    closest(s){return s==='[data-edit-key]'?this:null;}
    querySelector(s){if(this.parts?.[s])return this.parts[s];for(const c of this.children){if(c.matches(s))return c;const found=c.querySelector(s);if(found)return found;}return null;}
    getAttribute(name){return this.attrs[name]||'';}
    setAttribute(name,value){this.attrs[name]=value;if(name==='style')this.style={};}
    getBoundingClientRect(){return {left:0,top:0,width:390,height:60};}
    addEventListener(){}append(child){this.add(child);}setPointerCapture(){}
  }
  const device=new Element('DIV','device'),page=device.add(new Element('DIV','page')),button=page.add(new Element('BUTTON','cta'));button.textContent='Тренировка';
  const handlers={},windowHandlers={},messages=[],parent={postMessage:m=>messages.push(m)},body=new Element('BODY','');
  body.add(device);
  const storage={empty:()=>({version:1,name:'Дом',theme:{},elements:{},assets:{},content:{},additions:{}}),load:async()=>storage.empty(),normalize:p=>p,safeImage:()=>true};
  const window={parent,GAME_DATA:{},addEventListener:(type,fn)=>windowHandlers[type]=fn};
  const doc={body,documentElement:{style:{setProperty(){},removeProperty(){}}},querySelector:s=>s==='.device'?device:s==='.page'?page:null,getElementById:id=>id==='viewport'?{clientWidth:390,clientHeight:844}:device,addEventListener:(type,fn)=>handlers[type]=fn,createElement:tag=>{const el=new Element(tag.toUpperCase(),'');el.parts={'.design-tag':new Element('SPAN',''),'.design-handle':new Element('SPAN','')};return el;}};
  const ctx=vm.createContext({window,parent,document:doc,EmotionStorage:storage,HTMLElement:Element,structuredClone,URLSearchParams,location:{search:'?editor=1',protocol:'http:'},getComputedStyle:()=>({display:'block'})});
  vm.runInContext(read('design-runtime.js'),ctx);await window.DesignRuntime.ready;window.DesignRuntime.rendered('home');
  const pointer={target:button,button:0,pointerId:1,clientX:0,clientY:0,preventDefault(){},stopImmediatePropagation(){}};
  handlers.pointerdown(pointer);handlers.pointermove({...pointer,clientX:44,clientY:28});handlers.pointerup(pointer);
  assert.equal(button.style.translate,'44px 28px');
  // Parent has deliberately not acknowledged element-change yet. This used to reset the drag.
  windowHandlers.message({source:parent,data:{source:'emotion-editor',type:'mode',editing:false}});
  assert.equal(button.style.translate,'44px 28px');assert.equal(window.DesignRuntime.getProject().elements[button.dataset.editKey].style.x,44);
  windowHandlers.message({source:parent,data:{source:'emotion-editor',type:'mode',editing:true}});
  handlers.pointerdown(pointer);handlers.pointermove({...pointer,clientX:16,clientY:8});
  windowHandlers.message({source:parent,data:{source:'emotion-editor',type:'flush',requestId:7}});
  assert.equal(messages.at(-1).type,'flushed');assert.equal(messages.at(-2).type,'element-change');assert.equal(messages.at(-2).patch.style.x,60);
  console.log('PASS: dragging survives Play before parent acknowledgement; save flush includes an unfinished drag.');
}
(async()=>{await serverCheck();await storageCheck();await dragCheck();})().catch(error=>{console.error(error);process.exitCode=1;});
