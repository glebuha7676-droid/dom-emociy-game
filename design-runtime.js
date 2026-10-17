/* Один и тот же рендерер используется игрой, редактором и HTML-экспортом. */
(() => {
  'use strict';
  const embedded=window.parent!==window&&new URLSearchParams(location.search).has('editor');
  const baseline=structuredClone(window.GAME_DATA),nodes=new Map(),originals=new WeakMap();
  let project=EmotionStorage.empty(),screen='home',editing=embedded,selected=null,gesture=null,grid=4,readySent=false;
  const post=(type,data={})=>{if(embedded)parent.postMessage({source:'emotion-game',type,...data},'*');};
  const styleProps=new Set(['width','height','minWidth','maxWidth','minHeight','maxHeight','padding','paddingTop','paddingRight','paddingBottom','paddingLeft','margin','marginTop','marginRight','marginBottom','marginLeft','gap','fontSize','fontWeight','lineHeight','letterSpacing','textAlign','color','background','borderRadius','borderWidth','borderColor','opacity','objectFit','objectPosition','boxShadow','backdropFilter','display','alignItems','justifyContent','flexDirection','gridTemplateColumns','overflow','zIndex']);
  const numeric=new Set(['width','height','minWidth','maxWidth','minHeight','maxHeight','padding','paddingTop','paddingRight','paddingBottom','paddingLeft','margin','marginTop','marginRight','marginBottom','marginLeft','gap','fontSize','letterSpacing','borderRadius','borderWidth']);
  const themeVars={cream:'--cream',paper:'--paper',ink:'--ink',muted:'--muted',line:'--line',coral:'--coral',coralDeep:'--coral-deep',mint:'--mint',yellow:'--yellow',lav:'--lav',font:'--font-game'};
  const labels={device:'Игровой экран',page:'Содержимое экрана',nav:'Нижнее меню',topline:'Шапка',brand:'Название игры',brandMark:'Значок игры',welcome:'Приветствие',progressCard:'Прогресс',houseCard:'Карточка дома',houseImageWrap:'Сцена дома',houseImage:'Изображение дома',houseFooter:'Семья под домом',familyAvatars:'Портреты семьи',roomHotspot:'Область комнаты',cta:'Кнопка тренировки',homeShortcuts:'Задания и награды',homeShortcut:'Быстрое действие',portraitContainer:'Большой портрет',portrait:'Изображение персонажа',choiceList:'Список ответов',choice:'Кнопка ответа',faceOptions:'Сетка изображений',faceChoice:'Вариант с портретом',pageHeader:'Заголовок экрана',storyStage:'Сцена истории',speech:'Текст истории',chapter:'Глава',levelNodes:'Уровни',chapterBanner:'Продолжить обучение',feedback:'Объяснение ответа',quizBottom:'Продолжить',homeNote:'Подпись',designText:'Текст'};
  const camel=s=>s.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
  Object.assign(labels,{roomIcon:'3D-иконка комнаты',roomResidents:'Жильцы комнаты',residentPortrait:'Круглый портрет жильца'});
  Object.assign(labels,{trainingIcon:'Иконка тренировок',trainingHeroRow:'Продолжить обучение',trainingHeroCopy:'Текущая глава',trainingEyebrow:'Подпись главы',trainingProgressCaption:'Результаты обучения',modeAction:'Действие режима',trainingDaily:'Задание дня',trainingRewards:'Мои награды',starToken:'Звезда',starScore:'Количество звёзд',progressCount:'Количество уровней'});
  Object.assign(labels,{scrollArea:'Прокручиваемая область',brandName:'Название игры',micro:'Маленькая подпись',topStar:'Счётчик звёзд',tinyHearts:'Декор',progressRow:'Строка прогресса',levelBadge:'Номер уровня',progressMain:'Подпись прогресса',progressTrack:'Полоска прогресса',progressFill:'Заполнение прогресса',houseCardTop:'Заголовок дома',houseHeadline:'Подпись дома',pill:'Метка',roomNotify:'Новое событие',avatarBubble:'Портрет в кружке',ctaCopy:'Содержимое кнопки',emojiBadge:'Значок кнопки',symbol:'Символ',navBtn:'Кнопка меню',back:'Кнопка назад',quizTop:'Шапка вопроса',quizProgress:'Ход тренировки',quizKicker:'Подсказка вопроса',quizQuestion:'Вопрос',portraitName:'Имя персонажа',choiceIndex:'Номер ответа',chapterTop:'Заголовок главы',chapterRound:'Значок главы',chapterInfo:'Описание главы',levelNode:'Уровень',sectionHead:'Заголовок раздела',modeGrid:'Режимы тренировки',modeCard:'Карточка режима',modeIcon:'Значок режима',featureIcon:'Иконка события',featureBody:'Описание события',callout:'Подсказка',roomList:'Список комнат',roomButton:'Кнопка комнаты',roomSquare:'Значок комнаты',spacer:'Содержимое комнаты',roomHero:'Заставка комнаты',heroIcon:'Значок комнаты',storyItem:'Карточка истории',storyArt:'Наклейка истории',details:'Название истории',trailing:'Стрелка истории',storyStepbar:'Ход истории',storyPeople:'Персонажи истории',storyQuestion:'Вопрос истории',resultHero:'Награда за прохождение',bigEmoji:'Большая награда',resultStars:'Звёзды уровня',statPair:'Результаты',stat:'Показатель',rewardBig:'Счётчик наград',stickerGrid:'Коллекция наклеек',sticker:'Наклейка',dayGrid:'Дни недели',day:'День',formOption:'Выбор сложности',status:'Отметка выбора',label:'Подпись варианта',customText:'Добавленный текст',customImage:'Добавленная картинка',customButton:'Добавленная кнопка'});
  const title=el=>project.elements[el.dataset.editKey]?.label||labels[camel(el.classList[0]||'')]||({H1:'Заголовок',H2:'Подзаголовок',H3:'Заголовок раздела',P:'Описание',BUTTON:'Кнопка',IMG:'Изображение',SPAN:'Подпись',STRONG:'Текст',SMALL:'Маленький текст',SECTION:'Раздел',HEADER:'Шапка',NAV:'Навигация'}[el.tagName])||'Группа';
  const snippet=el=>(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,46);
  function content(){
    for(const [group,list] of Object.entries(baseline)){
      if(!Array.isArray(list)||!['characters','emotions','rooms','stories','chapters'].includes(group))continue;
      const updates=project.content[group]||{};
      for(let i=0;i<list.length;i++){
        const base=list[i],target=window.GAME_DATA[group][i];
        Object.assign(target,structuredClone(base));
        const patch=updates[base.id||base.number];
        if(!patch||typeof patch!=='object')continue;
        for(const [key,value] of Object.entries(patch)){
          if(['id','number','levels','emotions','people','style','icon','group'].includes(key)||!(key in base))continue;
          if(typeof base[key]==='string'&&typeof value==='string')target[key]=value;
          if(typeof base[key]==='number'&&Number.isFinite(value))target[key]=value;
          if(['options','followOptions'].includes(key)&&Array.isArray(value)&&value.length===3&&value.every(x=>typeof x==='string'))target[key]=value.slice();
        }
      }
    }
  }
  function fit(){
    const viewport=document.getElementById('viewport');if(!viewport)return;
    const scale=Math.min(viewport.clientWidth/390,viewport.clientHeight/844,1);
    document.documentElement.style.setProperty('--game-scale',scale);
    yardLayout();
    outline();post('viewport',{scale,width:390,height:844});
  }
  function yardLayout(){
    const page=document.querySelector('.home-page');
    if(!page)return;
    const progress=page.querySelector('.progress-card'),house=page.querySelector('.house-image');
    if(!progress||!house)return;
    const scale=scaleNow(),origin=page.getBoundingClientRect(),image=house.getBoundingClientRect(),css=getComputedStyle(house);
    const top=(progress.getBoundingClientRect().bottom-origin.top)/scale;
    const road=window.EmotionYardPlacement({left:(image.left-origin.left)/scale,top:(image.top-origin.top)/scale,width:image.width/scale,height:image.height/scale,naturalWidth:house.naturalWidth,naturalHeight:house.naturalHeight,fit:css.objectFit,position:css.objectPosition,pageHeight:page.offsetHeight,anchor:window.GAME_DATA.yardGeometry});
    page.style.setProperty('--yard-top',Math.max(0,top)+'px');
    page.style.setProperty('--house-ground',road.ground+'px');
    page.style.setProperty('--stairs-x',road.center+'px');
    page.style.setProperty('--path-top',road.top+'px');
    page.style.setProperty('--path-width',road.width+'px');
    page.style.setProperty('--path-height',road.height+'px');
  }
  function theme(){
    document.title=project.name;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',project.theme.cream||'#fff8ef');
    for(const [key,variable] of Object.entries(themeVars)){document.documentElement.style.removeProperty(variable);if(project.theme[key])document.documentElement.style.setProperty(variable,project.theme[key]);}
    const backdrop=project.assets.homeBackground;
    if(backdrop&&EmotionStorage.safeImage(backdrop))document.documentElement.style.setProperty('--home-backdrop',`url("${backdrop.replace(/"/g,'%22')}")`);
    else document.documentElement.style.removeProperty('--home-backdrop');
    const path=project.assets.homePath;
    if(path&&EmotionStorage.safeImage(path))document.documentElement.style.setProperty('--home-path',`url("${path.replace(/"/g,'%22')}")`);
    else document.documentElement.style.removeProperty('--home-path');
  }
  function addCustom(){
    const page=document.querySelector('.page');
    for(const item of project.additions[screen]||[]){
      if(!item||!['text','image','button'].includes(item.type)||typeof item.id!=='string')continue;
      const el=document.createElement(item.type==='button'?'button':item.type==='image'?'img':'p');
      el.className=`custom-${item.type}`;el.dataset.customId=item.id;
      el.textContent=item.type==='image'?'':item.text||'Новый текст';
      if(item.type==='image'){el.alt='Добавленное изображение';el.src=placeholder();el.style.cssText='width:160px;height:120px;object-fit:contain;align-self:center';}
      if(item.type==='button'){el.className+=' btn coral full';el.dataset.action='nav';el.dataset.to=['home','training','stories','rewards'].includes(item.to)?item.to:'training';}
      const parent=item.parent&&nodes.get(item.parent);(parent&&!['BUTTON','IMG','SPAN','P','H1','H2','H3'].includes(parent.tagName)?parent:page).append(el);
      visit(el,item.parent||`${screen}/page`,1);
    }
  }
  function placeholder(){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180"><rect width="240" height="180" rx="16" fill="#e3eee8"/><path d="m60 125 45-45 30 30 20-20 30 35" fill="none" stroke="#8bafa0" stroke-width="6"/><circle cx="165" cy="55" r="14" fill="#8bafa0"/></svg>');}
  function visit(el,parentKey,depth){
    if(!(el instanceof HTMLElement)||el.matches('.icon, .portrait-file')||el.closest('svg'))return;
    const noChildren=el.matches('.portrait');
    if(!noChildren&&el.children.length){
      for(const node of [...el.childNodes])if(node.nodeType===3&&node.textContent.trim()){
        const span=document.createElement('span');span.className='design-text';span.textContent=node.textContent;node.replaceWith(span);
      }
    }
    const stateClasses=new Set(['active','correct','wrong','selected','locked','passed','current','done','mint','peach','lilac','gold','full','solid','coral','primary']);
    const base=el.dataset.customId?`custom:${el.dataset.customId}`:el.dataset.level?`level:${el.dataset.level}`:el.dataset.room?`room:${el.dataset.room}`:el.dataset.story?`story:${el.dataset.story}`:[...el.classList].find(c=>!stateClasses.has(c))||el.tagName.toLowerCase();
    const siblings=[...(el.parentElement?.children||[])];const index=siblings.slice(0,siblings.indexOf(el)).filter(s=>s.tagName===el.tagName&&((s.classList[0]||'')===(el.classList[0]||''))).length;
    const key=el.classList.contains('device')?'global/device':el.classList.contains('nav')?'global/nav':el.classList.contains('page')?`${screen}/page`:el.dataset.customId?`${screen}/custom:${el.dataset.customId}`:`${parentKey}/${base}:${index}`;
    el.dataset.editKey=key;el.dataset.editDepth=depth;el.dataset.editParent=parentKey||'';el.dataset.originalOrder=siblings.indexOf(el);
    nodes.set(key,el);originals.set(el,{style:el.getAttribute('style')||'',text:el.children.length===0?el.textContent:null});
    if(!noChildren)for(const child of [...el.children])visit(child,key,depth+1);
  }
  function slot(el){
    if(el.matches('.house-image'))return 'house';
    if(el.dataset.roomIcon)return `roomIcon:${el.dataset.roomIcon}`;
    if(el.dataset.trainingIcon)return `trainingIcon:${el.dataset.trainingIcon}`;
    if(el.dataset.storyImage)return `story:${el.dataset.storyImage}`;
    if(el.dataset.residentId)return `avatar:${el.dataset.residentId}`;
    if(el.matches('.portrait'))return `portrait:${el.dataset.char}:${el.dataset.emotion}`;
    if(el.dataset.customId&&el.tagName==='IMG')return `custom:${el.dataset.customId}`;
    return null;
  }
  function assets(){
    for(const el of nodes.values()){
      const name=slot(el),src=name&&project.assets[name];
      if(el.matches('.portrait')){
        el.querySelector('.design-upload')?.remove();el.classList.remove('has-image');
        if(src&&EmotionStorage.safeImage(src)){
          const img=document.createElement('img');img.className='portrait-file design-upload';img.alt=el.querySelector('svg')?.getAttribute('aria-label')||'Персонаж';img.src=src;img.draggable=false;img.onerror=()=>{img.remove();el.classList.remove('has-image');};const style=project.elements[el.dataset.editKey]?.style||{};if(style.objectFit)img.style.objectFit=style.objectFit;if(style.objectPosition)img.style.objectPosition=style.objectPosition;el.append(img);el.classList.add('has-image');
        }
      }else if(name){
        if(!el.dataset.baseSrc)el.dataset.baseSrc=el.getAttribute('src');
        el.src=src||el.dataset.baseSrc;
      }
      if(project.elements[el.dataset.editKey]?.image){const custom=project.elements[el.dataset.editKey].image;if(EmotionStorage.safeImage(custom))el.style.backgroundImage=`url("${custom.replace(/"/g,'%22')}")`;el.style.backgroundSize='cover';el.style.backgroundPosition='center';}
    }
  }
  function apply(){
    theme();
    for(const [key,el] of nodes){
      const base=originals.get(el),settings=project.elements[key]||{},s=settings.style||{};
      el.setAttribute('style',base.style);if(base.text!==null)el.textContent=typeof settings.text==='string'?settings.text:base.text;
      if(settings.hidden)el.dataset.designHidden='true';else delete el.dataset.designHidden;
      for(const [prop,value] of Object.entries(s))if(styleProps.has(prop)&&value!==''&&value!==null){
        if(typeof value==='number'&&Number.isFinite(value))el.style[prop]=numeric.has(prop)?`${value}px`:String(value);
        else if(typeof value==='string'&&value.length<180&&!/[{};<>]|url\s*\(/i.test(value))el.style[prop]=value;
      }
      if((s.width!==undefined||s.height!==undefined)&&!s.display&&getComputedStyle(el).display==='inline')el.style.display='inline-block';
      if(s.backdropFilter)el.style.webkitBackdropFilter=s.backdropFilter;
      if(s.x||s.y)el.style.translate=`${Number(s.x)||0}px ${Number(s.y)||0}px`;
    }
    assets();
    const parents=new Set([...nodes.values()].map(el=>el.parentElement));
    for(const parent of parents){
      const children=[...parent.children];
      if(!children.some(el=>project.elements[el.dataset.editKey]?.order!==undefined))continue;
      children.sort((a,b)=>(project.elements[a.dataset.editKey]?.order??Number(a.dataset.originalOrder||0))-(project.elements[b.dataset.editKey]?.order??Number(b.dataset.originalOrder||0))).forEach(el=>parent.append(el));
    }
    document.body.classList.toggle('design-editing',editing);fit();outline();
  }
  function info(key){
    const el=nodes.get(key);if(!el)return null;
    const css=getComputedStyle(el),base=originals.get(el),rect=el.getBoundingClientRect(),scale=scaleNow();
    const computed={};for(const prop of styleProps)computed[prop]=css[prop];
    return {key,label:title(el),tag:el.tagName,text:base.text===null?null:el.textContent,parent:el.dataset.editParent,depth:Number(el.dataset.editDepth),assetSlot:slot(el),hidden:!!project.elements[key]?.hidden,width:Math.round(rect.width/scale),height:Math.round(rect.height/scale),computed,hasChildren:base.text===null,settings:project.elements[key]||{}};
  }
  function tree(){return [...nodes].map(([key,el])=>({key,label:title(el),text:snippet(el),parent:el.dataset.editParent,depth:Number(el.dataset.editDepth),hidden:!!project.elements[key]?.hidden,order:project.elements[key]?.order??Number(el.dataset.originalOrder),assetSlot:slot(el)}));}
  function snapshot(){post('snapshot',{screen,tree:tree(),selection:info(selected),overflow:overflow()});}
  function overflow(){const el=document.querySelector('.scroll-area');return el?{scroll:el.scrollHeight>el.clientHeight+2,extra:Math.max(0,el.scrollHeight-el.clientHeight)}:null;}
  function scaleNow(){return document.getElementById('game').getBoundingClientRect().width/390||1;}
  let overlay;
  function outline(){
    if(!embedded)return;
    if(!overlay){overlay=document.createElement('div');overlay.id='design-outline';overlay.innerHTML='<span class="design-tag"></span><span class="design-handle" aria-label="Изменить размер"></span>';document.body.append(overlay);overlay.querySelector('.design-handle').addEventListener('pointerdown',ev=>begin(ev,true));}
    const el=nodes.get(selected);if(!editing||!el||getComputedStyle(el).display==='none'){overlay.hidden=true;return;}
    const rect=el.getBoundingClientRect();overlay.hidden=false;Object.assign(overlay.style,{left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`});overlay.querySelector('.design-tag').textContent=`${title(el)} · ${Math.round(rect.width/scaleNow())} × ${Math.round(rect.height/scaleNow())}`;
  }
  function select(key,scroll=false){selected=nodes.has(key)?key:null;if(scroll&&selected)nodes.get(selected).scrollIntoView({block:'nearest',inline:'nearest'});outline();post('selection',{selection:info(selected)});}
  function rendered(view){
    screen=view;nodes.clear();visit(document.querySelector('.device'),'',0);addCustom();apply();
    if(!readySent){readySent=true;post('ready',{data:baseline});}snapshot();
  }
  function begin(ev,resize=false){
    if(!editing||ev.button!==0)return;
    const el=resize?nodes.get(selected):ev.target.closest('[data-edit-key]');if(!el)return;
    ev.preventDefault();ev.stopImmediatePropagation();select(el.dataset.editKey);
    if(el.matches('.device,.page,.nav'))return;
    const cfg=project.elements[selected]?.style||{},details=info(selected);
    gesture={id:ev.pointerId,key:selected,startX:ev.clientX,startY:ev.clientY,initialX:Number(cfg.x)||0,initialY:Number(cfg.y)||0,width:details.width,height:details.height,resize,changed:false,scale:scaleNow()};
    ev.target.setPointerCapture?.(ev.pointerId);
  }
  const snap=(n,ev)=>ev.altKey||!grid?Math.round(n):Math.round(n/grid)*grid;
  function move(ev){
    if(!gesture||ev.pointerId!==gesture.id)return;
    const g=gesture,el=nodes.get(g.key),dx=(ev.clientX-g.startX)/g.scale,dy=(ev.clientY-g.startY)/g.scale;
    if(Math.abs(dx)+Math.abs(dy)<3&&!g.changed)return;g.changed=true;
    const style=g.resize?{width:Math.max(12,snap(g.width+dx,ev)),height:Math.max(12,snap(g.height+dy,ev))}:{x:snap(g.initialX+dx,ev),y:snap(g.initialY+dy,ev)};
    if(g.resize&&ev.shiftKey)style.height=Math.round(style.width*g.height/g.width);
    g.style=style;if(g.resize){if(getComputedStyle(el).display==='inline')el.style.display='inline-block';el.style.width=style.width+'px';el.style.height=style.height+'px';}else el.style.translate=`${style.x}px ${style.y}px`;
    yardLayout();outline();ev.preventDefault();
  }
  function finishGesture(){
    if(!gesture)return;const g=gesture;gesture=null;
    if(g.changed){const old=project.elements[g.key]||{};project.elements[g.key]={...old,style:{...old.style,...g.style}};post('element-change',{key:g.key,patch:{style:g.style}});}
  }
  function end(ev){if(gesture&&ev.pointerId===gesture.id)finishGesture();}
  document.addEventListener('pointerdown',ev=>{if(!ev.target.closest('#design-outline'))begin(ev);},true);
  document.addEventListener('pointermove',move,true);document.addEventListener('pointerup',end,true);
  document.addEventListener('pointercancel',()=>{gesture=null;apply();},true);
  document.addEventListener('click',ev=>{if(editing&&ev.target.closest('#game')){ev.preventDefault();ev.stopImmediatePropagation();}},true);
  document.addEventListener('dragstart',ev=>{if(editing)ev.preventDefault();});
  document.addEventListener('dragover',ev=>{if(editing&&ev.dataTransfer?.types.includes('Files')){ev.preventDefault();ev.dataTransfer.dropEffect='copy';}});
  document.addEventListener('drop',ev=>{if(!editing)return;const el=ev.target.closest('[data-edit-key]'),file=ev.dataTransfer?.files[0];if(!el||!file)return;ev.preventDefault();post('upload-drop',{file,key:el.dataset.editKey,slot:slot(el)});});
  document.addEventListener('scroll',outline,true);window.addEventListener('resize',fit);
  document.addEventListener('load',ev=>{if(ev.target.matches?.('.house-image'))fit();},true);
  document.addEventListener('keydown',ev=>{
    if(!editing)return;
    if((ev.ctrlKey||ev.metaKey)&&['z','y','s'].includes(ev.key.toLowerCase())){ev.preventDefault();post('shortcut',{key:ev.key.toLowerCase(),shift:ev.shiftKey});return;}
    if(ev.key==='Escape'){select(null);return;}
    if(!selected)return;
    if(ev.key==='Delete'){ev.preventDefault();post('element-change',{key:selected,patch:{hidden:true}});return;}
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(ev.key)){
      ev.preventDefault();const s=project.elements[selected]?.style||{},step=ev.shiftKey?10:1;
      post('element-change',{key:selected,patch:{style:{x:(Number(s.x)||0)+(ev.key==='ArrowLeft'?-step:ev.key==='ArrowRight'?step:0),y:(Number(s.y)||0)+(ev.key==='ArrowUp'?-step:ev.key==='ArrowDown'?step:0)}}});
    }
  });
  window.addEventListener('message',ev=>{
    if(!embedded||ev.source!==parent||ev.data?.source!=='emotion-editor')return;
    const m=ev.data;
    if(m.type==='project'){
      try{project=EmotionStorage.normalize(m.project);content();if(m.render)window.EmotionGame?.render();else{apply();snapshot();}}catch(error){post('error',{message:error.message});}
    }
    if(m.type==='select')select(m.key,true);
    if(m.type==='flush'){finishGesture();post('flushed',{requestId:m.requestId});}
    if(m.type==='mode'){finishGesture();editing=m.editing;apply();snapshot();}
    if(m.type==='grid')grid=Number(m.value)||0;
    if(m.type==='navigate')window.EmotionGame?.preview(m.view);
    if(m.type==='refresh')window.EmotionGame?.render();
    if(m.type==='reorder'){
      const el=nodes.get(m.key);if(!el)return;
      const siblings=[...el.parentElement.children].filter(s=>s.dataset.editKey),i=siblings.indexOf(el),j=i+Number(m.direction);
      if(j<0||j>=siblings.length)return;
      post('reorder-changes',{changes:siblings.map((s,n)=>({key:s.dataset.editKey,order:n===i?j:n===j?i:n}))});
    }
  });
  if(embedded)document.body.classList.add('embedded');
  const ready=EmotionStorage.load({preferPublished:!embedded}).then(p=>{project=p;content();theme();fit();});
  if(!embedded&&/^https?:$/.test(location.protocol))EmotionStorage.onPublished(p=>{project=p;window.EMOTION_PROJECT=p;content();window.EmotionGame?.render();});
  window.DesignRuntime={ready,rendered,getProject:()=>project,info,tree};
})();
