// Prepare supplied cards for the game without changing originals or expressions.
const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),source=path.join(root,'ПЕРСОНАЖИ И ИХ ЭМОЦИИ'),output=path.join(root,'assets/characters');
const people={
 grandma:{folder:'Бабушка',files:{neutral:'Эталон бабушки.JPG',joy:'Радость.JPG',sadness:'Грусть.JPG',anger:'Злость.JPG',surprise:'Удивление.JPG',fear:'Страх.JPG',disgust:'Отвращение.JPG',curiosity:'Заинтересованность.png'}},
 grandpa:{folder:'Дедушка',files:{neutral:'Эталон дедушки.JPG',joy:'Радость.JPG',sadness:'Грусть.JPG',anger:'Злость.JPG',fear:'Страх.JPG'}},
 mother:{folder:'Мама',files:{neutral:'Эталон мамы.JPG',joy:'Радость.JPG',sadness:'Грусть.JPG',anger:'Гнев.JPG',surprise:'Удивление.JPG',fear:'Страх.JPG',disgust:'Отвращение.JPG'}},
 father:{folder:'Отец',files:{neutral:'Эталон отца.JPG',surprise:'Удивление.png',disgust:'Отвращение.png'}},
 brother:{folder:'Мальчик',files:{neutral:'Эталон мальчика.JPG',joy:'Радость.JPG',surprise:'Удивление.JPG',fear:'Страх.JPG',disgust:'Отвращение.JPG',curiosity:'Любопытство.JPG'}},
 sister:{folder:'Девочка',files:{neutral:'Эталон девочки.JPG',joy:'Радость.JPG',sadness:'Грусть.JPG',surprise:'Удивление.JPG',fear:'Страх.JPG',disgust:'Отвращение.JPG',curiosity:'Любопытство.JPG'}}
};
(async()=>{
 const portraits={},entries=[];
 for(const [id,person] of Object.entries(people)){
  fs.mkdirSync(path.join(output,id),{recursive:true});portraits[id]={};
  for(const [emotion,name] of Object.entries(person.files)){
   const relative=`assets/characters/${id}/${emotion}.webp`,file=path.join(root,relative);
   await sharp(path.join(source,person.folder,name)).rotate().resize(448,600,{fit:'contain',background:'#e5dfd7'}).webp({quality:88}).toFile(file);
   portraits[id][emotion]=relative;entries.push({id,emotion,file:relative,source:person.folder+'/'+name});
  }
 }
 fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({version:1,width:448,height:600,portraits,entries,unmapped:['Стыд','Высокомерие','Надменность','Сочувствие','Зависть','Безразличие','Разочаровние','Настольгия','Хитрость'],note:'Use existing matching expressions. Shame is not automatically mapped to shyness. Missing combinations are excluded from image quizzes.'},null,2));
 fs.writeFileSync(path.join(root,'portrait-data.js'),'/* Prepared from supplied family emotion images. */\nwindow.EMOTION_PORTRAITS='+JSON.stringify(portraits)+';\n');
 console.log(`Prepared ${entries.length} portraits: ${entries.filter(e=>e.emotion!=='neutral').length} expressions and 6 neutral, all 448 x 600 WebP.`);
})();
