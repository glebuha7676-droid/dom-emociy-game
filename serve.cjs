/* Локальный сервер игры и сохранения из редактора. Запуск: node serve.cjs */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const renderHTML=require('./tools/export-html.cjs');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.avif':'image/avif','.gif':'image/gif','.ico':'image/x-icon'};
function createServer(root=__dirname){
  const storageContext=vm.createContext({window:{}});
  vm.runInContext(fs.readFileSync(path.join(root,'project-store.js'),'utf8'),storageContext,{timeout:1000});
  const normalize=storageContext.window.EmotionStorage.normalize;
  const readProject=()=>{
    const context=vm.createContext({window:{}});
    vm.runInContext(fs.readFileSync(path.join(root,'project.js'),'utf8'),context,{timeout:1000});
    return context.window.EMOTION_PROJECT?normalize(context.window.EMOTION_PROJECT):null;
  };
  const json=(res,code,value)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
  function persist(project){
    const context=vm.createContext({window:{}});
    vm.runInContext(fs.readFileSync(path.join(root,'export-bundle.js'),'utf8'),context,{timeout:2000});
    const source='/* Сохранено визуальным редактором. */\nwindow.EMOTION_PROJECT = '+JSON.stringify(project).replace(/</g,'\\u003c')+';\n';
    const files=[['demo-one-file.html',renderHTML(context.window.EMOTION_EXPORT,project)],['project.js',source]];
    const suffix='.saving-'+crypto.randomUUID(),staged=[];
    try{
      for(const [name,body] of files){const target=path.join(root,name),temp=target+suffix;staged.push({target,temp,previous:fs.existsSync(target)?fs.readFileSync(target):null});fs.writeFileSync(temp,body);}
      for(const file of staged)fs.renameSync(file.temp,file.target);
    }catch(error){
      for(const file of staged){if(!fs.existsSync(file.temp)){if(file.previous)fs.writeFileSync(file.target,file.previous);else fs.rmSync(file.target,{force:true});}}
      throw error;
    }finally{for(const file of staged)fs.rmSync(file.temp,{force:true});}
  }
  return http.createServer((req,res)=>{
    let url;try{url=new URL(req.url,'http://127.0.0.1');}catch{return json(res,400,{error:'Неверный адрес.'});}
    if(url.pathname==='/api/project'){
      // Only the editor served by this loopback server may write the project.
      const host=req.headers.host,expected='127.0.0.1:'+req.socket.localPort;
      if(host!==expected||req.headers.origin&&req.headers.origin!=='http://'+expected||req.headers['sec-fetch-site']==='cross-site')return json(res,403,{error:'Открой редактор на этом локальном сервере.'});
      if(req.method==='GET'){try{return json(res,200,{project:readProject()});}catch{return json(res,500,{error:'Не удалось прочитать сохранённую игру.'});}}
      if(req.method!=='POST')return json(res,405,{error:'Нужен запрос сохранения POST.'});
      if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return json(res,415,{error:'Нужен JSON-проект.'});
      let size=0,tooLarge=false;const chunks=[];
      req.on('data',chunk=>{size+=chunk.length;if(size>128*1024*1024){if(!tooLarge){tooLarge=true;json(res,413,{error:'Проект больше 128 МБ.'});}return;}if(!tooLarge)chunks.push(chunk);});
      req.on('end',()=>{
        if(tooLarge)return;
        let project;try{project=normalize(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch(error){return json(res,400,{error:'Проект не сохранён: '+error.message});}
        try{persist(project);json(res,200,{saved:true,savedAt:Date.now()});}catch(error){console.error('Save failed:',error.message);json(res,500,{error:'Не удалось записать файлы игры. Черновик сохранён в браузере.'});}
      });
      req.on('error',()=>{if(!res.headersSent)json(res,400,{error:'Передача проекта прервана.'});});
      return;
    }
    if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'Метод не поддерживается.'});
    let file;try{file=path.resolve(root,'.'+decodeURIComponent(url.pathname));}catch{return json(res,400,{error:'Неверный путь.'});}
    if(file!==root&&!file.startsWith(root+path.sep))return json(res,403,{error:'Путь вне проекта.'});
    if(file===root||fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
    fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:data);});
  });
}
module.exports={createServer};
if(require.main===module){const port=Number(process.env.EMOTION_PORT)||8937;createServer().listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}\nEditor: http://127.0.0.1:${port}/editor.html`));}
