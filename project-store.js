/* Общий формат проекта и хранилище. Изображения не ограничены квотой localStorage. */
(() => {
  'use strict';
  const empty=()=>({version:1,name:'Дом эмоций',theme:{},elements:{},assets:{},content:{},additions:{}});
  const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
  function normalize(input){
    if(!object(input)||input.version!==1)throw new Error('Нужен проект «Дом эмоций» версии 1.');
    const result=empty();result.name=String(input.name||result.name).slice(0,100);
    for(const key of ['theme','elements','assets','content','additions']){
      if(input[key]!==undefined&&!object(input[key]))throw new Error(`Неверный раздел: ${key}`);
      result[key]=input[key]||{};
    }
    for(const [key,value] of Object.entries(result.assets))if(typeof value!=='string'||!safeImage(value))throw new Error(`Неверное изображение: ${key}`);
    for(const settings of Object.values(result.elements)){
      if(!object(settings)||settings.style!==undefined&&!object(settings.style))throw new Error('Неверные настройки элемента.');
      if(settings.image!==undefined&&!safeImage(settings.image))throw new Error('Неверный фон элемента.');
      for(const key of ['text','label'])if(settings[key]!==undefined&&typeof settings[key]!=='string')throw new Error('Неверный текст элемента.');
      if(settings.order!==undefined&&!Number.isFinite(settings.order))throw new Error('Неверный порядок элементов.');
    }
    for(const list of Object.values(result.additions)){
      if(!Array.isArray(list)||list.some(i=>!object(i)||typeof i.id!=='string'||!['text','image','button'].includes(i.type)))throw new Error('Неверный список добавленных элементов.');
    }
    for(const [group,entries] of Object.entries(result.content)){
      if(!['characters','emotions','rooms','stories','chapters'].includes(group)||!object(entries))throw new Error('Неверный раздел игрового содержания.');
      for(const patch of Object.values(entries)){
        if(!object(patch))throw new Error('Неверная запись игрового содержания.');
        if(group==='stories'){
          for(const key of ['correct','followCorrect'])if(patch[key]!==undefined&&(!Number.isInteger(patch[key])||patch[key]<0||patch[key]>2))throw new Error('Верный ответ должен быть от 1 до 3.');
          if(patch.unlock!==undefined&&(!Number.isInteger(patch.unlock)||patch.unlock<1||patch.unlock>17))throw new Error('Уровень открытия должен быть от 1 до 17.');
          if(patch.room!==undefined&&!['living','kitchen','kids','grandparents','parents'].includes(patch.room))throw new Error('Неизвестная комната.');
          if(patch.emotion!==undefined&&!['joy','sadness','anger','surprise','fear','disgust','curiosity','shyness'].includes(patch.emotion))throw new Error('Неизвестная эмоция.');
          for(const key of ['options','followOptions'])if(patch[key]!==undefined&&(!Array.isArray(patch[key])||patch[key].length!==3||patch[key].some(v=>typeof v!=='string')))throw new Error('В вопросе должно быть три текстовых ответа.');
        }
      }
    }
    return result;
  }
  function safeImage(src){return typeof src==='string'&&(/^(data:image\/(png|jpeg|webp|gif|svg\+xml|avif);|https?:\/\/|assets\/)/i.test(src));}
  let database;
  function open(){return database||(database=new Promise((resolve,reject)=>{
    if(!window.indexedDB){reject(new Error('IndexedDB недоступна'));return;}
    const request=indexedDB.open('emotion-design-studio',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('projects');
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  }));}
  async function load({preferPublished=false}={}){
    if(preferPublished&&window.EMOTION_PROJECT)return normalize(window.EMOTION_PROJECT);
    try{const db=await open();const value=await new Promise((resolve,reject)=>{const r=db.transaction('projects').objectStore('projects').get('active');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});if(value)return normalize(value);}
    catch{/* Use the local fallback below when IndexedDB is unavailable. */}
    try{const value=localStorage.getItem('emotion-design-fallback');if(value)return normalize(JSON.parse(value));}catch{}
    return window.EMOTION_PROJECT?normalize(window.EMOTION_PROJECT):empty();
  }
  async function save(project){
    const value=normalize(project);
    let db;try{db=await open();}catch{localStorage.setItem('emotion-design-fallback',JSON.stringify(value));return;}
    await new Promise((resolve,reject)=>{const tx=db.transaction('projects','readwrite');tx.objectStore('projects').put(value,'active');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Сохранение прервано'));});
  }
  function clone(p){return {...p,theme:{...p.theme},assets:{...p.assets},elements:structuredClone(p.elements),content:structuredClone(p.content),additions:structuredClone(p.additions)};}
  async function readPublished(){
    const response=await fetch('api/project',{cache:'no-store'});
    if(!response.ok)throw new Error('Не удалось прочитать сохранённую игру.');
    const result=await response.json();return result.project?normalize(result.project):null;
  }
  async function publish(project){
    if(!/^https?:$/.test(location.protocol))throw new Error('Для записи в игру запусти «Открыть редактор.cmd». Черновик сохранён в браузере.');
    let response;try{response=await fetch('api/project',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(normalize(project))});}
    catch{throw new Error('Нет связи с локальным сервером. Запусти «Открыть редактор.cmd» и повтори сохранение.');}
    let result;try{result=await response.json();}catch{throw new Error('Перезапусти «Открыть редактор.cmd», чтобы включить сохранение в файлы игры. Черновик сохранён.');}
    if(!response.ok||!result.saved)throw new Error(result.error||'Не удалось сохранить игру.');
    window.EMOTION_PROJECT=clone(project);
    const id=String(result.savedAt)+'-'+Math.random();
    try{localStorage.setItem('emotion-game-published',id);}catch{}
    try{const channel=new BroadcastChannel('emotion-game-published');channel.postMessage(id);channel.close();}catch{}
    return result;
  }
  function onPublished(callback){
    let lastId='',chain=Promise.resolve();
    const update=id=>{if(id&&id===lastId)return;lastId=id;chain=chain.catch(()=>{}).then(async()=>{const p=await readPublished();if(p)callback(p);}).catch(()=>{});};
    window.addEventListener('storage',ev=>{if(ev.key==='emotion-game-published')update(ev.newValue);});
    try{const channel=new BroadcastChannel('emotion-game-published');channel.onmessage=ev=>update(ev.data);}catch{}
  }
  window.EmotionStorage={empty,normalize,load,save,clone,safeImage,publish,readPublished,onPublished};
})();
