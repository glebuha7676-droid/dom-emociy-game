(() => {
  'use strict';
  const $=s=>document.querySelector(s),frame=$('#preview'),left=$('#left-content'),inspector=$('#inspector');
  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const data=window.GAME_DATA;
  const screens=[['home','Главная · Дом'],['training','Тренировки'],['quiz-name','Угадай эмоцию'],['quiz-find','Найди эмоцию'],['difficulty-name','Выбор сложности · Угадай'],['difficulty-find','Выбор сложности · Найди'],['result','Результат уровня'],['stories','Все комнаты'],...data.rooms.map(r=>[`room-${r.id}`,r.name]),...data.stories.flatMap(s=>[0,1,2,3].map(n=>[`story-${s.id}:${n}`,`${s.title} · ${['Сцена','Вопрос 1','Вопрос 2','Награда'][n]}`])),['rewards','Награды']];
  let project=EmotionStorage.empty(),history=[],cursor=-1,revision=0,savedRevision=0,saveTimer,saveChain=Promise.resolve();
  let publishing=false,publishedRevision=-1,flushSequence=0;const flushRequests=new Map();
  let tab='layers',inspectorTab='element',tree=[],selection=null,screen='home',view='home',activeAsset='house',character='grandma',assetGroup='house',contentGroup='stories',contentId=data.stories[0].id,editing=true,loaded=false,connected=false,uploadTarget=null,search='',noticeTimer;
  const send=(type,extra={})=>frame.contentWindow?.postMessage({source:'emotion-editor',type,...extra},'*');
  function notify(message){$('#notice').textContent=message;$('#notice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('#notice').hidden=true,4200);}
  function status(text,error=false){$('#save-state').classList.toggle('status-error',error);$('#save-state').innerHTML=`<i class="status-dot"></i>${esc(text)}`;}
  function updateHistory(){$('#undo').disabled=cursor<=0;$('#redo').disabled=cursor>=history.length-1;}
  function push(){history=history.slice(0,cursor+1);history.push(EmotionStorage.clone(project));if(history.length>40)history.shift();cursor=history.length-1;updateHistory();}
  function commit(fn,options={}){fn(project);revision++;push();sync(!!options.render);scheduleSave();if(options.panels)renderPanels();}
  function sync(render=false){if(connected)send('project',{project,render});$('#project-name').value=project.name;}
  function scheduleSave(){clearTimeout(saveTimer);status('Есть изменения · сохраняем…');saveTimer=setTimeout(saveNow,450);}
  async function saveNow(){
    clearTimeout(saveTimer);const snapshot=EmotionStorage.clone(project),rev=revision;status('Сохраняем…');
    saveChain=saveChain.catch(()=>{}).then(()=>EmotionStorage.save(snapshot));
    try{await saveChain;if(rev===revision){savedRevision=rev;status(publishedRevision===rev?'Сохранено в файлы игры ✓':'Черновик сохранён · можно сохранить в игру');}return true;}
    catch(error){status('Не удалось сохранить · скачай проект',true);notify('Не удалось сохранить в браузере. Скачай проект, чтобы сохранить изменения.');return false;}
  }
  function flushPreview(){
    document.activeElement?.blur();
    if(!connected)return Promise.reject(new Error('Дождись загрузки предпросмотра игры.'));
    return new Promise((resolve,reject)=>{const requestId=++flushSequence,timer=setTimeout(()=>{flushRequests.delete(requestId);reject(new Error('Предпросмотр не ответил. Обнови страницу редактора: автосохранённый черновик останется.'));},4000);flushRequests.set(requestId,()=>{clearTimeout(timer);resolve();});send('flush',{requestId});});
  }
  async function publishNow(){
    if(!loaded||publishing)return false;publishing=true;$('#save-game').disabled=true;$('#save-now').disabled=true;
    try{
      await flushPreview();await saveNow();
      const snapshot=EmotionStorage.clone(project),rev=revision;status('Записываем оформление в игру…');
      await EmotionStorage.publish(snapshot);publishedRevision=rev;
      status(rev===revision?'Сохранено в файлы игры ✓':'Игра сохранена · есть новые изменения в черновике');
      sync(false);notify('Игра обновлена. Положение, размеры, графика и тексты записаны в файлы проекта.');return true;
    }catch(error){status('Игра не обновлена · проверь сообщение',true);notify(error.message||'Не удалось сохранить игру.');return false;}
    finally{publishing=false;$('#save-game').disabled=!connected;$('#save-now').disabled=!connected;}
  }
  function restore(index){if(index<0||index>=history.length)return;cursor=index;project=EmotionStorage.clone(history[cursor]);revision++;updateHistory();sync(true);renderPanels();scheduleSave();}
  function patchElement(key,patch){commit(p=>{const old=p.elements[key]||{};p.elements[key]={...old,...patch,style:{...old.style,...patch.style}};});}
  const section=(title,body,action='')=>`<section class="panel-section"><h3>${title}${action}</h3>${body}</section>`;
  function field(label,name,value='',opts={}){
    const placeholder=opts.placeholder!==undefined?` placeholder="${esc(opts.placeholder)}"`:'';
    const attrs=`data-${opts.kind||'style'}="${esc(name)}"${placeholder}`;
    if(opts.options)return `<label class="field"><span class="field-label">${label}</span><select ${attrs}>${opts.options.map(([id,text])=>`<option value="${esc(id)}" ${String(value)===String(id)?'selected':''}>${esc(text)}</option>`).join('')}</select></label>`;
    if(opts.area)return `<label class="field"><span class="field-label">${label}</span><textarea ${attrs} rows="${opts.rows||3}">${esc(value)}</textarea></label>`;
    return `<label class="field"><span class="field-label">${label}</span><span class="input-unit"><input type="${opts.type||'number'}" ${attrs} value="${esc(value)}" ${opts.type==='text'?'':'step="'+(opts.step||1)+'"'} ${opts.min!==undefined?`min="${opts.min}"`:''} ${opts.max!==undefined?`max="${opts.max}"`:''}>${opts.unit===false?'':'<span>'+esc(opts.unit||'px')+'</span>'}</span></label>`;
  }
  function colorField(label,name,value='',kind='style',placeholder='#FFFFFF'){
    const color=/^#[\da-f]{6}$/i.test(value)?value:/^#[\da-f]{6}$/i.test(placeholder)?placeholder:'#ffffff';
    return `<label class="field"><span class="field-label">${label}</span><span class="color-field"><input type="color" value="${color}" data-color="${name}" data-kind="${kind}" aria-label="${label}"><input type="text" data-${kind}="${name}" value="${esc(value)}" placeholder="${esc(placeholder)}" aria-label="${label}: код цвета"><button type="button" data-clear="${name}" data-kind="${kind}" title="Автоматически" aria-label="Сбросить цвет">×</button></span></label>`;
  }
  const named=(group,id)=>({...data[group].find(x=>String(x.id||x.number)===String(id)),...project.content[group]?.[id]});
  function renderLayers(){
    const filtered=tree.filter(n=>!search||`${n.label} ${n.text}`.toLowerCase().includes(search.toLowerCase()));
    left.innerHTML=section('Добавить на экран',`<div class="add-buttons"><button data-add="text"><span>T</span>Текст</button><button data-add="image"><span>▧</span>Картинка</button><button data-add="button"><span>▭</span>Кнопка</button></div>`)+section('Элементы экрана',`<input id="layer-search" class="search-input" placeholder="Найти элемент…" value="${esc(search)}" aria-label="Поиск слоя"><p class="panel-description">Выбери слой или нажми на него в игре.</p>`)+`<div class="section-caption">${esc(screens.find(s=>s[0]===view)?.[1]||'Текущий экран')} <span class="layer-count">· ${filtered.length}</span></div><div class="layer-list">${filtered.map(n=>`<div class="layer-row ${selection?.key===n.key?'selected':''} ${n.hidden?'is-hidden':''}" style="padding-left:${Math.min(n.depth,7)*10}px"><button class="layer-select" data-select="${esc(n.key)}"><span class="layer-symbol">${n.assetSlot?'▧':n.label.includes('Кнопка')?'▭':'◇'}</span><span class="layer-name" title="${esc(n.text||n.label)}">${esc(n.label)}${['Подпись','Текст','Описание','Маленький текст','Заголовок','Подзаголовок'].includes(n.label)&&n.text?' · '+esc(n.text.slice(0,24)):''}</span></button><button class="layer-eye" data-toggle-hidden="${esc(n.key)}" title="${n.hidden?'Показать':'Скрыть'}" aria-label="${n.hidden?'Показать':'Скрыть'} ${esc(n.label)}">${n.hidden?'○':'◉'}</button></div>`).join('')}</div>`;
  }
  function assetTitle(slot){if(slot==='house')return 'Семейный дом';if(slot==='homeBackground')return 'Двор с газоном';if(slot==='homePath')return 'Дорожка от ступеней';if(slot.startsWith('story:'))return 'История · '+named('stories',slot.split(':')[1]).title;if(slot.startsWith('trainingIcon:'))return ({recognize:'Угадай эмоцию',find:'Найди эмоцию',medal:'Медаль',daily:'Задание дня'})[slot.split(':')[1]];if(slot.startsWith('roomIcon:'))return 'Иконка · '+named('rooms',slot.split(':')[1]).name;if(slot.startsWith('avatar:'))return 'Жилец · '+named('characters',slot.split(':')[1]).name;if(slot.startsWith('portrait:')){const [,c,e]=slot.split(':');return `${named('characters',c)?.name||c} · ${e==='neutral'?'Спокойное лицо':named('emotions',e)?.name||e}`;}return 'Добавленное изображение';}
  function assetSource(slot){
    if(project.assets[slot])return project.assets[slot];
    if(slot.startsWith('story:'))return data.stories.find(s=>s.id===slot.split(':')[1])?.sceneImage||null;
    if(slot.startsWith('roomIcon:'))return data.rooms.find(r=>r.id===slot.split(':')[1])?.iconImage;
    if(slot.startsWith('avatar:'))return `assets/avatars/${slot.split(':')[1]}.png`;
    if(slot.startsWith('trainingIcon:'))return `assets/training-icons/${slot.split(':')[1]}-v1.png`;
    if(slot.startsWith('portrait:')){const [,id,emotion]=slot.split(':');return window.EMOTION_PORTRAITS?.[id]?.[emotion]||null;}
    return {house:'assets/house-five-rooms-v1.png',homeBackground:'assets/home-garden-v3.png',homePath:'assets/home-path-v1.png'}[slot]||null;
  }
  function renderAssets(){
    const emotions=[{id:'neutral',name:'Спокойное лицо',icon:'🙂'},...data.emotions];
    left.innerHTML=section('Библиотека графики',`<p class="panel-description">Загрузи сгенерированные изображения. Одна замена обновляет все места, где используется этот портрет.</p>`)+`<section class="panel-section"><div class="asset-group-tabs"><button data-asset-group="house" class="${assetGroup==='house'?'active':''}">Дом</button><button data-asset-group="portraits" class="${assetGroup==='portraits'?'active':''}">Персонажи</button></div>${assetGroup==='house'?`<button class="asset-card ${activeAsset==='house'?'selected':''}" data-asset="house"><img src="${esc(project.assets.house||'assets/house-five-rooms-v1.png')}" alt="Дом"><span>Семейный дом <small class="asset-check">${project.assets.house?'✓ Загружено':'По умолчанию'}</small></span></button><p class="small-note">Комнаты остаются интерактивными поверх картинки. Перемещай их области во вкладке «Слои».</p>`:`${field('Персонаж','character',character,{kind:'library',options:data.characters.map(c=>[c.id,named('characters',c.id).name])})}<div class="asset-grid">${emotions.map(e=>{const slot=`portrait:${character}:${e.id}`;return `<button class="portrait-asset ${activeAsset===slot?'selected':''}" data-asset="${slot}">${project.assets[slot]?`<img src="${esc(project.assets[slot])}" alt="${esc(e.name)}">`:`<span class="asset-placeholder">${e.icon}</span>`}<span class="asset-label">${esc(named('emotions',e.id)?.name||e.name)} ${project.assets[slot]?'<span class="asset-check">✓</span>':''}</span></button>`;}).join('')}</div><p class="small-note">9 выражений × 6 персонажей.<br>Незагруженные портреты используют временную иллюстрацию.</p>`}</section>`;
    renderGardenCard();
    if(assetGroup==='house')left.insertAdjacentHTML('beforeend',section('Иллюстрации историй',`<div class="asset-grid">${data.stories.map(st=>{const slot='story:'+st.id;return `<button class="portrait-asset ${activeAsset===slot?'selected':''}" data-asset="${slot}"><img src="${esc(assetSource(slot))}" alt="${esc(st.title)}"><span class="asset-label">${esc(named('stories',st.id).title)}</span></button>`;}).join('')}</div>`));
    if(assetGroup==='house')left.insertAdjacentHTML('beforeend',section('Тренировки и прогресс',`<div class="asset-grid">${['recognize','find','medal','daily'].map(id=>{const slot='trainingIcon:'+id;return `<button class="portrait-asset ${activeAsset===slot?'selected':''}" data-asset="${slot}"><img src="${esc(assetSource(slot))}" alt="${esc(assetTitle(slot))}"><span class="asset-label">${esc(assetTitle(slot))}</span></button>`;}).join('')}</div>`));
    if(assetGroup==='portraits'){
      left.querySelector('.asset-grid').innerHTML=emotions.map(emotion=>{
        const slot=`portrait:${character}:${emotion.id}`,src=assetSource(slot);
        return `<button class="portrait-asset ${activeAsset===slot?'selected':''}" data-asset="${slot}">${src?`<img src="${esc(src)}" alt="${esc(emotion.name)}">`:`<span class="asset-placeholder">${emotion.icon}</span>`}<span class="asset-label">${esc(named('emotions',emotion.id)?.name||emotion.name)} ${project.assets[slot]?'<span class="asset-check">✓</span>':src?'<span class="asset-check">Есть</span>':''}</span></button>`;
      }).join('');
      left.querySelector('.asset-grid').nextElementSibling.textContent='Доступные карточки семьи уже подключены. Пустые слоты можно заполнить своей графикой. В тренировках используются только подходящие готовые изображения.';
    }
    if(assetGroup==='house'){
      const cards=items=>`<div class="asset-grid">${items.map(([slot,title])=>`<button class="portrait-asset ${activeAsset===slot?'selected':''}" data-asset="${slot}"><img src="${esc(assetSource(slot))}" alt="${esc(title)}"><span class="asset-label">${esc(title)} ${project.assets[slot]?'<span class="asset-check">✓</span>':''}</span></button>`).join('')}</div>`;
      left.insertAdjacentHTML('beforeend',section('3D-иконки комнат',cards(data.rooms.map(r=>[`roomIcon:${r.id}`,named('rooms',r.id).name])))+section('Жильцы в кружках',cards(data.characters.map(c=>[`avatar:${c.id}`,named('characters',c.id).name]))+'<p class="small-note">Портреты над кнопками показывают, кто живёт в детской и спальнях. Они перемещаются вместе с кнопкой комнаты.</p>'));
    }
  }
  function renderGardenCard(){
    if(assetGroup==='house')left.insertAdjacentHTML('beforeend',section('Двор и дорожка',[
      ['homeBackground','assets/home-garden-v3.png','Двор с газоном'],
      ['homePath','assets/home-path-v1.png','Дорожка от ступеней']
    ].map(([slot,src,title])=>`<button class="asset-card ${activeAsset===slot?'selected':''}" data-asset="${slot}"><img class="garden-thumbnail" src="${esc(project.assets[slot]||src)}" alt="${title}"><span>${title} <small class="asset-check">${project.assets[slot]?'✓ Загружено':'По умолчанию'}</small></span></button>`).join('')+'<p class="small-note">Фон начинается под блоком «Путь эмоций». Дорожка автоматически следует за ступенями при перемещении и изменении размера дома.</p>'));
  }
  function renderContent(){
    const groups=[['stories','Семейные истории'],['rooms','Комнаты'],['characters','Персонажи'],['emotions','Эмоции'],['chapters','Главы']];
    left.innerHTML=section('Игровые тексты',`${field('Раздел','group',contentGroup,{kind:'library',options:groups})}<p class="panel-description">Меняй тексты и ответы. Они обновятся во всех связанных экранах.</p>`)+`<section class="panel-section">${data[contentGroup].map(item=>{const id=item.id||item.number,c=named(contentGroup,id);return `<button class="content-entry ${String(contentId)===String(id)?'selected':''}" data-content-entry="${id}">${esc(c.title||c.name)}${contentGroup==='stories'?`<small>${esc(named('rooms',c.room).name)} · после уровня ${Math.max(0,c.unlock-1)}</small>`:''}</button>`;}).join('')}</section>`;
  }
  function renderLeft(){if(tab==='layers')renderLayers();if(tab==='assets')renderAssets();if(tab==='content')renderContent();}
  function renderTheme(){
    const colors=[['cream','Фон игры','#fffaf5'],['paper','Карточки и меню','#ffffff'],['ink','Основной текст','#293c38'],['muted','Второстепенный текст','#687b74'],['coral','Главные кнопки','#f16f61'],['coralDeep','Коралловый акцент','#dc584b'],['mint','Мятный акцент','#3fa58a'],['yellow','Жёлтый акцент','#efba4b'],['lav','Сиреневый акцент','#a18bcf'],['line','Обводки','#e3eae4']];
    inspector.innerHTML=section('Оформление всей игры',`<div class="theme-intro">Одна сцена 390 × 844.<br>На любом устройстве меняется масштаб, а расположение остаётся таким же.</div><div class="palette-grid">${['cream','coral','mint','yellow','lav'].map(k=>`<span style="background:${esc(project.theme[k]||colors.find(c=>c[0]===k)[2])}"></span>`).join('')}</div>`)+section('Цветовая палитра',colors.map(([k,n,v])=>colorField(n,k,project.theme[k]||'','theme',v)).join(''))+section('Шрифт',field('Семейство','font',project.theme.font||'',{kind:'theme',options:[['','Системный округлый'],['"Segoe UI", system-ui, sans-serif','Segoe UI'],['Arial, sans-serif','Arial'],['Georgia, serif','Georgia']]}))+section('Быстрые палитры',`<div class="preset-buttons"><button data-palette="warm">Тёплая</button><button data-palette="mint">Мятная</button><button data-palette="lilac">Сиреневая</button></div><p class="small-note">Отдельные элементы могут иметь свои цвета.</p>`)+section('Начальные настройки',`<button class="button danger" id="reset-design">Сбросить оформление проекта</button><p class="small-note">Сброс можно отменить. Игровые достижения сохранятся.</p>`);
  }
  function renderAssetInspector(){
    const src=assetSource(activeAsset);
    const isBackground=activeAsset==='homeBackground',isPath=activeAsset==='homePath';
    const description=activeAsset.startsWith('story:')?'Иллюстрация истории целиком, без обрезки. Замена обновит миниатюру в комнате, сцену и увеличенный просмотр.':activeAsset.startsWith('trainingIcon:')?'Общая иконка тренировок и прогресса. Замена обновляет все места её использования.':activeAsset.startsWith('roomIcon:')?'Объёмная иконка комнаты. Одна замена обновит кнопку на доме, список комнат и страницу комнаты. Используй PNG с прозрачным фоном.':activeAsset.startsWith('avatar:')?'Круглый портрет жильца над кнопкой его комнаты и на странице комнаты. Замена обновляет все эти кружки.':isPath?'Прозрачная картинка дорожки. Её начало совпадает с центром и шириной нижней ступени; дорожка плавно расширяется к нам.':isBackground?'Отдельный фон двора, привязанный к нижнему краю блока «Путь эмоций». Газон продолжается под кнопками.':activeAsset==='house'?'Дом — единая картинка. Области комнат настраиваются поверх неё.':'Портрет появится в тренировках и при соответствующей эмоции.';
    inspector.innerHTML=section('Изображение',`<span class="scope-label">${isBackground||isPath?'Фон главного экрана':'Общее для всей игры'}</span><h2 class="selection-title">${esc(assetTitle(activeAsset))}</h2><p class="panel-description">${description}</p>`)+section('Файл',`${src?`<img class="asset-preview" src="${esc(src)}" alt="${esc(assetTitle(activeAsset))}">`:'<div class="asset-preview-placeholder">▧</div>'}<button class="upload-area" data-upload-slot="${esc(activeAsset)}"><strong>↑ ${project.assets[activeAsset]?'Заменить изображение':'Загрузить изображение'}</strong><small>PNG, WebP, JPG, SVG, GIF, AVIF<br>До 12 МБ</small></button>${project.assets[activeAsset]?`<div class="row-actions"><button class="button danger" data-remove-asset="${esc(activeAsset)}">Вернуть исходное изображение</button></div>`:''}`)+section(isPath?'Стык со ступенями':isBackground?'Подстройка фона':'Как разместить',isPath?'<p class="panel-description">Положение и ширина подстраиваются за текущим домом. Для замены используй PNG с прозрачными полями и той же формой дорожки, чтобы сохранить точный стык.</p>':isBackground?'<p class="panel-description">При изменении высоты блока прогресса начало двора подстраивается автоматически. У нижнего меню предусмотрен короткий мягкий переход в основной цвет игры.</p>':'<p class="panel-description">Перейди в «Слои» и выбери картинку на экране. Там можно изменить размер, положение, скругление и способ заполнения.</p><p class="small-note">Картинку также можно перетащить из папки прямо на элемент в предпросмотре.</p>');
  }
  function contentField(label,key,value,options={}){return field(label,key,value,{...options,kind:'content',type:options.type||'text',unit:false});}
  function renderContentInspector(){
    const c=named(contentGroup,contentId);if(!c)return;
    let body='';
    const text=(label,key,area=false)=>contentField(label,key,c[key]||'',{area});
    if(contentGroup==='stories'){
      body=section('Название и доступность',text('Название истории','title')+text('Короткое описание','subtitle')+contentField('Комната','room',c.room,{options:data.rooms.map(r=>[r.id,named('rooms',r.id).name])})+contentField('Открыть при доступности уровня','unlock',c.unlock,{type:'number',min:1,max:17})+text('Наклейка (символ или эмодзи)','sticker'));
      body+=section('Иллюстрация',`<img class="asset-preview" src="${esc(assetSource('story:'+c.id))}" alt="${esc(c.title)}"><button class="upload-area" data-upload-slot="story:${esc(c.id)}"><strong>Заменить картинку истории</strong><small>Картинка сохраняется целиком, без обрезки</small></button>`);
      body+=section('Сцена',text('Что происходит','scene',true));
      for(const [prefix,title] of [['','Первый вопрос'],['follow','Второй вопрос']]){
        const opts=prefix?'followOptions':'options',correct=prefix?'followCorrect':'correct';
        body+=section(title,text('Вопрос',prefix?'follow':'question',true)+c[opts].map((answer,i)=>contentField(`Ответ ${i+1}`,`${opts}.${i}`,answer,{area:true,rows:2})).join('')+contentField('Верный ответ',correct,c[correct],{options:c[opts].map((v,i)=>[i,`${i+1}. ${v.slice(0,34)}`])})+text('Объяснение',prefix?'followExplain':'explain',true));
      }
    }else if(contentGroup==='characters')body=section('Имя',text('Полное имя','name')+text('Короткое имя','short'))+section('Временная иллюстрация',colorField('Фон портрета','accent',c.accent,'content',c.accent)+colorField('Одежда','clothes',c.clothes,'content',c.clothes)+colorField('Кожа','skin',c.skin,'content',c.skin))+section('Портреты',`<button class="button" data-open-character="${esc(c.id)}">Загрузить графику персонажа →</button>`);
    else if(contentGroup==='emotions')body=section('Эмоция',text('Название','name')+text('Символ','icon')+text('Подсказка после ответа','tip',true));
    else if(contentGroup==='rooms')body=section('Комната',text('Название','name')+text('Описание','description')+contentField('Акцент','accent',c.accent,{options:[['peach','Персиковый'],['mint','Мятный'],['lilac','Сиреневый']]}));
    else if(contentGroup==='chapters')body=section('Глава',text('Название','name')+text('Описание','subtitle')+contentField('Акцент','color',c.color,{options:[['peach','Персиковый'],['mint','Мятный'],['lilac','Сиреневый'],['gold','Золотой']]}));
    inspector.innerHTML=section('Редактор содержания',`<span class="scope-label">Связанный игровой контент</span><h2 class="selection-title">${esc(c.title||c.name)}</h2>${contentGroup==='stories'?`<button class="parent-button" data-preview-story="${esc(c.id)}">Открыть эту историю в предпросмотре →</button>`:''}`)+body+section('Исходные тексты',`<button class="small-button" id="reset-content">Вернуть исходные значения</button>`);
  }
  function renderElementInspector(){
    if(!selection){inspector.innerHTML=`<div class="empty-inspector"><div class="empty-icon">↖</div><h2>Твоя игра, твои детали</h2><p>Выбери картинку, кнопку или текст на экране. Здесь появятся настройки выбранного элемента.</p><div class="keyboard-help"><span>Перемещение</span><kbd>← ↑ ↓ →</kbd><span>Большой шаг</span><kbd>Shift + стрелки</kbd><span>Без привязки</span><kbd>Alt + перетаскивание</kbd><span>Пропорции при размере</span><kbd>Shift</kbd><span>Скрыть элемент</span><kbd>Delete</kbd><span>Отменить</span><kbd>Ctrl + Z</kbd></div></div>`;return;}
    const s=project.elements[selection.key]?.style||{},c=selection.computed||{},settings=project.elements[selection.key]||{};
    const number=(label,key,opts={})=>field(label,key,s[key]??'',{placeholder:Number.parseFloat(c[key])||'Авто',...opts});
    const dropdown=(label,key,options)=>field(label,key,s[key]??'',{options:[['','Автоматически'],...options]});
    let html=section('Выбранный элемент',`<span class="scope-label">${selection.key.startsWith('global/')?'На всех экранах':'На этом экране'}</span><h2 class="selection-title">${esc(selection.label)}</h2><div class="selection-path">${esc(selection.tag)} · ${selection.width} × ${selection.height}</div>${selection.parent?`<button class="parent-button" data-select="${esc(selection.parent)}">↑ Выбрать родительскую группу</button>`:''}<div class="row-actions"><button class="button" data-hidden-selected>${settings.hidden?'◉ Показать':'○ Скрыть'}</button><button class="button" id="reset-element">↺ Сбросить</button></div>`+field('Название слоя','label',settings.label||'',{kind:'element',type:'text',unit:false,placeholder:selection.label}));
    if(selection.text!==null)html+=section('Текст',field('Содержание','text',settings.text??selection.text,{kind:'element',area:true})+'<p class="small-note">Сюжеты и названия эмоций удобнее менять во вкладке «Тексты».</p>');
    html+=section('Положение и размер',`<div class="field-grid">${number('Смещение X','x',{placeholder:0})}${number('Смещение Y','y',{placeholder:0})}${number('Ширина','width',{min:0})}${number('Высота','height',{min:0})}</div><div class="row-actions"><button class="button" data-reorder="-1">↑ Выше в потоке</button><button class="button" data-reorder="1">↓ Ниже в потоке</button></div><p class="small-note">Размеры заданы в пикселях сцены. Пустое поле — автоматический размер. X/Y смещают элемент поверх обычного расположения.</p>`,`<button class="section-action" id="reset-position">Авто</button>`);
    html+=section('Ограничения размера',`<div class="field-grid">${number('Мин. ширина','minWidth',{min:0})}${number('Макс. ширина','maxWidth',{min:0})}${number('Мин. высота','minHeight',{min:0})}${number('Макс. высота','maxHeight',{min:0})}</div>`+dropdown('Выход за границы','overflow',[['visible','Показывать'],['hidden','Обрезать'],['auto','Прокрутка при необходимости']]));
    html+=section('Оформление',colorField('Фон','background',s.background||'','style',rgbToHex(c.backgroundColor||c.background))+colorField('Цвет текста','color',s.color||'','style',rgbToHex(c.color))+`<div class="field-grid">${number('Скругление','borderRadius',{min:0})}${number('Толщина рамки','borderWidth',{min:0})}</div>`+colorField('Цвет рамки','borderColor',s.borderColor||'','style',rgbToHex(c.borderColor))+`<div class="field-grid">${number('Непрозрачность','opacity',{placeholder:1,min:0,max:1,step:.05,unit:false})}${number('Порядок наложения','zIndex',{unit:false})}</div>`+dropdown('Тень','boxShadow',[['none','Без тени'],['0 6px 18px #263c3020','Мягкая'],['0 12px 32px #263c3030','Выраженная']])+dropdown('Стекло · размытие фона','backdropFilter',[['none','Без размытия'],['blur(6px)','Лёгкое'],['blur(10px) saturate(1.12)','Мягкое стекло'],['blur(16px) saturate(1.2)','Матовое стекло']]));
    if(selection.text!==null||selection.hasChildren)html+=section('Типографика',`<div class="field-grid">${number('Размер шрифта','fontSize',{min:1})}${dropdown('Насыщенность','fontWeight',[['400','Обычный'],['600','Средний'],['700','Жирный'],['900','Очень жирный']])}${number('Высота строки','lineHeight',{placeholder:1.4,step:.1,min:.5,unit:false})}${number('Межбуквенный','letterSpacing',{step:.1})}</div>`+dropdown('Выравнивание текста','textAlign',[['left','Слева'],['center','По центру'],['right','Справа']]));
    if(selection.assetSlot||selection.tag==='IMG'){
      const image=selection.assetSlot&&assetSource(selection.assetSlot);
      html+=section('Изображение',`${image?`<img class="inspector-image" src="${esc(image)}" alt="Текущее изображение">`:''}<button class="upload-area" data-upload-slot="${esc(selection.assetSlot||'')}" data-upload-key="${esc(selection.key)}"><strong>↑ Заменить изображение</strong><small>${selection.assetSlot?.startsWith('portrait:')?esc(assetTitle(selection.assetSlot)):'Загрузить свою графику'}</small></button>`+dropdown('Заполнение','objectFit',[['contain','Целиком'],['cover','Заполнить с обрезкой'],['fill','Растянуть']])+dropdown('Положение картинки','objectPosition',[['center','Центр'],['top','Сверху'],['bottom','Снизу'],['left','Слева'],['right','Справа']]));
    }else html+=section('Фоновая картинка',`<button class="small-button" data-upload-key="${esc(selection.key)}">↑ Загрузить фон элемента</button>${settings.image?'<button class="small-button danger" id="remove-background">Убрать фон</button>':''}`);
    if(selection.hasChildren)html+=section('Расположение внутри',dropdown('Способ раскладки','display',[['block','Блок'],['flex','Гибкий ряд / колонка'],['grid','Сетка']])+dropdown('Направление','flexDirection',[['row','По горизонтали'],['column','По вертикали']])+dropdown('Выравнивание поперёк','alignItems',[['stretch','Растянуть'],['flex-start','В начале'],['center','По центру'],['flex-end','В конце']])+dropdown('Выравнивание вдоль','justifyContent',[['flex-start','В начале'],['center','По центру'],['space-between','Равные промежутки'],['flex-end','В конце']])+dropdown('Колонки сетки','gridTemplateColumns',[['1fr','Одна'],['repeat(2, 1fr)','Две'],['repeat(3, 1fr)','Три'],['repeat(4, 1fr)','Четыре']])+number('Расстояние между элементами','gap',{min:0}));
    html+=section('Отступы',number('Внутри со всех сторон','padding',{min:0})+`<div class="field-grid four">${number('Верх','paddingTop',{min:0,unit:false})}${number('Право','paddingRight',{min:0,unit:false})}${number('Низ','paddingBottom',{min:0,unit:false})}${number('Лево','paddingLeft',{min:0,unit:false})}</div><span class="field-label">Снаружи</span><div class="field-grid four">${number('Верх','marginTop',{unit:false})}${number('Право','marginRight',{unit:false})}${number('Низ','marginBottom',{unit:false})}${number('Лево','marginLeft',{unit:false})}</div>`);
    if(selection.key.includes('/custom:')){
      const item=(project.additions[screen]||[]).find(i=>selection.key.endsWith('/custom:'+i.id));
      if(item?.type==='button')html+=section('Действие кнопки',field('Открыть экран','to',item.to||'training',{kind:'custom',options:[['home','Дом'],['training','Тренировки'],['stories','Истории'],['rewards','Награды']]}));
      html+=section('Удалить',`<button class="button danger" id="delete-custom">Удалить добавленный элемент</button>`);
    }
    inspector.innerHTML=html;
  }
  function rgbToHex(s){if(/^#[\da-f]{6}$/i.test(s))return s;const m=String(s).match(/^rgba?\(\s*(\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/);return m?'#'+m.slice(1).map(x=>Number(x).toString(16).padStart(2,'0')).join(''):'#ffffff';}
  function renderInspector(){if(inspectorTab==='theme')renderTheme();else if(tab==='assets')renderAssetInspector();else if(tab==='content')renderContentInspector();else renderElementInspector();}
  function renderPanels(){renderLeft();renderInspector();}
  function setTab(value){tab=value;inspectorTab='element';document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-selected',b.dataset.tab===tab);});updateInspectorTabs();renderPanels();}
  function updateInspectorTabs(){document.querySelectorAll('[data-inspector]').forEach(b=>b.classList.toggle('active',b.dataset.inspector===inspectorTab));}
  function navigate(value){view=value;$('#screen-select').value=view;selection=null;send('navigate',{view});}
  async function setMode(value){
    try{await flushPreview();if(!value&&!await saveNow())return;sync(false);editing=value;$('#edit-mode').classList.toggle('active',value);$('#play-mode').classList.toggle('active',!value);$('#canvas-hint').textContent=value?'Перетаскивай элементы · уголок рамки меняет размер':'Режим игры · текущее оформление сохранено в черновике';send('mode',{editing});}
    catch(error){notify(error.message);}
  }
  function fitCanvas(){
    const [w,h]=$('#device-select').value.split(',').map(Number),area=$('#canvas-area'),zoom=$('#zoom-select').value;
    const scale=zoom==='auto'?Math.min((area.clientWidth-54)/(w+10),(area.clientHeight-44)/(h+10),1):Number(zoom);
    const s=Math.max(.1,scale);frame.style.width=w+'px';frame.style.height=h+'px';frame.style.transform=`scale(${s})`;
    $('#device-shell').style.width=(w*s+10)+'px';$('#device-shell').style.height=(h*s+10)+'px';$('#device-shell').style.borderRadius=Math.min(32,32*s)+'px';
    const gameScale=Math.min(w/390,h/844,1);$('#viewport-info').textContent=`${w} × ${h} · ${Math.round(s*100)}%`;
    frame.dataset.previewScale=gameScale*s;
  }
  function upload(target){uploadTarget=target;$('#image-file').value='';$('#image-file').click();}
  async function useImage(file,target){
    if(!file||!target)return;
    if(!/^image\/(png|jpeg|webp|gif|svg\+xml|avif)$/i.test(file.type)){notify('Выбери изображение PNG, JPG, WebP, SVG, GIF или AVIF.');return;}
    if(file.size>12*1024*1024){notify('Изображение больше 12 МБ. Выбери файл поменьше.');return;}
    const url=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
    try{await new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=reject;image.src=url;});}
    catch{notify('Этот файл не удалось прочитать как изображение.');return;}
    commit(p=>{if(target.slot)p.assets[target.slot]=url;else if(target.key)p.elements[target.key]={...p.elements[target.key],image:url};});
    renderPanels();notify('Изображение добавлено. Изменения сохраняются автоматически.');
  }
  function download(name,type,text){const url=URL.createObjectURL(new Blob([text],{type})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function exportGame(){
    const bundle=window.EMOTION_EXPORT;if(!bundle){notify('Не найден пакет экспорта. Запусти node tools/build-export.cjs.');return;}
    const p=EmotionStorage.clone(project);p.assets={...bundle.defaults,...p.assets};p.assets.house=p.assets.house||bundle.house;p.assets.homeBackground=p.assets.homeBackground||bundle.homeBackground;p.assets.homePath=p.assets.homePath||bundle.homePath;
    const json=JSON.stringify(p).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
    const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
    const html='<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="'+esc(p.theme.cream||'#fff8ef')+'"><title>'+esc(p.name)+'</title><style>'+bundle.css+'</style></head><body><div id="viewport"><main id="game" aria-live="polite"></main></div>'+script('window.EMOTION_PROJECT='+json+';')+bundle.scripts.map(script).join('')+'</body></html>';
    download('Дом эмоций — игра.html','text/html;charset=utf-8',html);notify('Скачана самостоятельная HTML-игра со всей загруженной графикой.');
  }
  function shortcut(key,shift=false){if(key==='s'){publishNow();return;}if(key==='y'||key==='z'&&shift)restore(cursor+1);else if(key==='z')restore(cursor-1);}
  window.addEventListener('message',ev=>{
    if(ev.source!==frame.contentWindow||ev.data?.source!=='emotion-game')return;
    const m=ev.data;
    if(m.type==='ready'){connected=true;if(loaded){sync(true);send('mode',{editing});send('grid',{value:$('#grid-select').value});$('#save-game').disabled=false;$('#save-now').disabled=false;}}
    if(m.type==='flushed'){const resolve=flushRequests.get(m.requestId);flushRequests.delete(m.requestId);resolve?.();}
    if(m.type==='snapshot'){
      screen=m.screen;tree=m.tree;selection=m.selection;
      if(!document.activeElement?.closest('#left-content'))renderLeft();
      if(!document.activeElement?.closest('#inspector'))renderInspector();
      $('#overflow-state').textContent=m.overflow?.scroll?`Внутренняя прокрутка · ещё ${m.overflow.extra} px`:'Экран помещается целиком';
    }
    if(m.type==='selection'){selection=m.selection;if(tab!=='layers')setTab('layers');else{inspectorTab='element';updateInspectorTabs();renderPanels();}}
    if(m.type==='element-change')patchElement(m.key,m.patch);
    if(m.type==='reorder-changes')commit(p=>m.changes.forEach(c=>{p.elements[c.key]={...p.elements[c.key],order:c.order};}));
    if(m.type==='shortcut')shortcut(m.key,m.shift);
    if(m.type==='error')notify(m.message);
    if(m.type==='upload-drop')useImage(m.file,{slot:m.slot,key:m.key});
  });
  document.addEventListener('click',ev=>{
    const b=ev.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.tab){setTab(b.dataset.tab);return;}
    if(b.dataset.inspector){inspectorTab=b.dataset.inspector;updateInspectorTabs();renderInspector();return;}
    if(b.dataset.select){send('select',{key:b.dataset.select});return;}
    if(b.dataset.toggleHidden){const key=b.dataset.toggleHidden;patchElement(key,{hidden:!project.elements[key]?.hidden});renderLeft();return;}
    if('hiddenSelected' in b.dataset&&selection){patchElement(selection.key,{hidden:!project.elements[selection.key]?.hidden});renderInspector();return;}
    if(b.dataset.reorder&&selection){send('reorder',{key:selection.key,direction:Number(b.dataset.reorder)});return;}
    if(b.dataset.assetGroup){assetGroup=b.dataset.assetGroup;activeAsset=assetGroup==='house'?'house':`portrait:${character}:neutral`;renderPanels();return;}
    if(b.dataset.asset){activeAsset=b.dataset.asset;renderPanels();return;}
    if('uploadSlot' in b.dataset||b.dataset.uploadKey){upload({slot:b.dataset.uploadSlot||null,key:b.dataset.uploadKey});return;}
    if(b.dataset.removeAsset){commit(p=>delete p.assets[b.dataset.removeAsset]);renderPanels();return;}
    if(b.dataset.contentEntry){contentId=b.dataset.contentEntry;renderPanels();return;}
    if(b.dataset.openCharacter){character=b.dataset.openCharacter;assetGroup='portraits';activeAsset=`portrait:${character}:neutral`;setTab('assets');return;}
    if(b.dataset.previewStory){navigate(`story-${b.dataset.previewStory}:0`);return;}
    if(b.dataset.add){
      const id=crypto.randomUUID?.()||String(Date.now()),type=b.dataset.add;
      commit(p=>{(p.additions[screen]||= []).push({id,type,text:type==='button'?'Новая кнопка':'Новый текст',to:'training'});},{render:true});
      setTimeout(()=>send('select',{key:`${screen}/custom:${id}`}),80);return;
    }
    if(b.dataset.clear){const kind=b.dataset.kind,key=b.dataset.clear;if(kind==='theme')commit(p=>delete p.theme[key]);else if(kind==='content')updateContent(key,'');else if(selection)commit(p=>{if(p.elements[selection.key]?.style)delete p.elements[selection.key].style[key];});renderInspector();return;}
    if(b.dataset.palette){const palettes={warm:{cream:'#fff8ef',paper:'#fffefa',coral:'#fa796b',mint:'#5ebca8',lav:'#bfa5e7'},mint:{cream:'#f0f8f1',paper:'#ffffff',coral:'#4a9f86',mint:'#8ac7b0',lav:'#b9cda2'},lilac:{cream:'#f7f3fc',paper:'#fffaff',coral:'#a080bd',mint:'#79b5a7',lav:'#c8b5e5'}};commit(p=>Object.assign(p.theme,palettes[b.dataset.palette]));renderInspector();return;}
    const id=b.id;
    if(id==='undo')restore(cursor-1);if(id==='redo')restore(cursor+1);
    if(id==='save-now'||id==='save-game')publishNow();
    if(id==='edit-mode')setMode(true);if(id==='play-mode')setMode(false);
    if(id==='export-project'){download('Дом эмоций — проект.json','application/json',JSON.stringify(project,null,2));notify('Проект скачан вместе с изображениями и настройками.');}
    if(id==='export-game')exportGame();
    if(id==='import-project'){$('#project-file').value='';$('#project-file').click();}
    if(id==='reset-element'&&selection){commit(p=>delete p.elements[selection.key]);renderInspector();}
    if(id==='reset-position'&&selection){commit(p=>{const s=p.elements[selection.key]?.style;if(s)for(const key of ['x','y','width','height','minWidth','maxWidth','minHeight','maxHeight'])delete s[key];});renderInspector();}
    if(id==='remove-background'&&selection){commit(p=>delete p.elements[selection.key].image);renderInspector();}
    if(id==='reset-content'){commit(p=>{if(p.content[contentGroup])delete p.content[contentGroup][contentId];},{render:true});renderPanels();}
    if(id==='delete-custom'&&selection){const key=selection.key;commit(p=>{p.additions[screen]=(p.additions[screen]||[]).filter(i=>!key.endsWith('/custom:'+i.id));delete p.elements[key];},{render:true});selection=null;renderPanels();}
    if(id==='reset-design'&&confirm('Вернуть исходное оформление, графику и тексты? Сброс можно отменить.')){commit(p=>{const empty=EmotionStorage.empty();Object.assign(p,empty);},{render:true});selection=null;renderPanels();}
  });
  function updateContent(key,value){
    const item=named(contentGroup,contentId),path=key.split('.');
    if(['unlock','correct','followCorrect'].includes(key)){value=Number(value);if(!Number.isInteger(value)||value<0||key==='unlock'&&(value<1||value>17)||key!=='unlock'&&value>2){notify('Проверь числовое значение.');return;}}
    commit(p=>{const patch=((p.content[contentGroup]||={})[contentId]||={});if(path.length===2){patch[path[0]]=[...(patch[path[0]]||item[path[0]])];patch[path[0]][Number(path[1])]=value;}else patch[key]=value;},{render:true});
  }
  document.addEventListener('change',ev=>{
    const el=ev.target;
    if(el.id==='screen-select'){navigate(el.value);return;}
    if(['device-select','zoom-select'].includes(el.id)){fitCanvas();return;}
    if(el.id==='grid-select'){send('grid',{value:el.value});return;}
    if(el.id==='project-name'){commit(p=>p.name=el.value.trim()||'Дом эмоций');return;}
    if(el.dataset.library==='character'){character=el.value;activeAsset=`portrait:${character}:neutral`;renderPanels();return;}
    if(el.dataset.library==='group'){contentGroup=el.value;contentId=String(data[contentGroup][0].id||data[contentGroup][0].number);renderPanels();return;}
    if(el.dataset.color){const target=el.closest('.color-field').querySelector('input[type=text]');target.value=el.value;target.dispatchEvent(new Event('change',{bubbles:true}));return;}
    if(el.dataset.style&&selection){
      const key=el.dataset.style;let value=el.type==='number'&&el.value!==''?Number(el.value):el.value;
      if(typeof value==='number'&&(!Number.isFinite(value)||el.min!==''&&value<Number(el.min)||el.max!==''&&value>Number(el.max))){notify('Значение выходит за допустимые границы.');return;}
      commit(p=>{const settings=p.elements[selection.key]||={};settings.style||={};if(value==='')delete settings.style[key];else settings.style[key]=value;});return;
    }
    if(el.dataset.element&&selection){patchElement(selection.key,{[el.dataset.element]:el.value});return;}
    if(el.dataset.theme){commit(p=>{if(el.value)p.theme[el.dataset.theme]=el.value;else delete p.theme[el.dataset.theme];});return;}
    if(el.dataset.content){updateContent(el.dataset.content,el.value);return;}
    if(el.dataset.custom==='to'&&selection){commit(p=>{const item=(p.additions[screen]||[]).find(i=>selection.key.endsWith('/custom:'+i.id));if(item)item.to=el.value;},{render:true});return;}
  });
  document.addEventListener('input',ev=>{if(ev.target.id==='layer-search'){const pos=ev.target.selectionStart;search=ev.target.value;renderLayers();$('#layer-search').focus();$('#layer-search').setSelectionRange(pos,pos);}});
  $('#image-file').addEventListener('change',ev=>useImage(ev.target.files[0],uploadTarget));
  $('#project-file').addEventListener('change',async ev=>{
    const file=ev.target.files[0];if(!file)return;
    if(file.size>100*1024*1024){notify('Проект больше 100 МБ.');return;}
    try{const next=EmotionStorage.normalize(JSON.parse(await file.text()));commit(p=>Object.assign(p,next),{render:true});selection=null;renderPanels();notify('Проект открыт. Импорт можно отменить.');}
    catch(error){notify('Проект не открыт: '+error.message);}
  });
  document.addEventListener('keydown',ev=>{
    if((ev.ctrlKey||ev.metaKey)&&['s','z','y'].includes(ev.key.toLowerCase())){
      if(ev.key.toLowerCase()!=='s'&&ev.target.matches('input,textarea'))return;
      ev.preventDefault();shortcut(ev.key.toLowerCase(),ev.shiftKey);
    }
  });
  document.querySelector('.studio-brand').addEventListener('click',async ev=>{ev.preventDefault();if(await publishNow())location.href='index.html';});
  window.addEventListener('beforeunload',ev=>{if(publishing||revision!==savedRevision){ev.preventDefault();ev.returnValue='';}});
  window.addEventListener('resize',fitCanvas);new ResizeObserver(fitCanvas).observe($('#canvas-area'));
  $('#screen-select').innerHTML=screens.map(([id,title])=>`<option value="${id}">${esc(title)}</option>`).join('');
  renderPanels();fitCanvas();
  EmotionStorage.load().then(p=>{project=p;loaded=true;push();sync(true);renderPanels();$('#save-game').disabled=!connected;$('#save-now').disabled=!connected;status('Проект загружен · черновик сохраняется автоматически');});
})();
