(async () => {
  'use strict';
  await window.DesignRuntime.ready;
  const DATA = window.GAME_DATA;
  const KEY = 'dom-emociy-demo-v1';
  const $ = (selector) => document.querySelector(selector);
  const game = $('#game');
  const freshProgress = () => ({unlockedLevel:1,levelStars:{},dailyDates:[],storiesDone:[],weeklyClaimed:[]});
  function readProgress(){
    try {const saved=JSON.parse(localStorage.getItem(KEY));if(!saved)return freshProgress();const ids=new Set(DATA.stories.map(s=>s.id)),done=Array.isArray(saved.storiesDone)?saved.storiesDone:[];return {...freshProgress(),...saved,storiesDone:done.filter(id=>ids.has(id)),archivedStoriesDone:[...new Set([...(saved.archivedStoriesDone||[]),...done.filter(id=>!ids.has(id))])]};}
    catch {return freshProgress();}
  }
  let progress=readProgress();
  const ui={screen:'home',room:null,freeType:'name',difficulty:'easy',quiz:null,quizResult:null,story:null,toast:'',zoomedStory:null};
  const CHARS=Object.fromEntries(DATA.characters.map(c=>[c.id,c]));
  const roomIcon=r=>`<img class="room-icon" data-room-icon="${r.id}" src="${e(r.iconImage)}" alt="" aria-hidden="true" draggable="false">`;
  const storySource=st=>window.DesignRuntime.getProject?.().assets[`story:${st.id}`]||st.sceneImage;
  const storyImage=(st,cls)=>`<img class="${cls}" data-story-image="${st.id}" src="${e(storySource(st))}" alt="${e(st.scene)}" draggable="false">`;
  const trainingIcon=(id,cls='')=>`<img class="training-icon ${cls}" data-training-icon="${id}" src="assets/training-icons/${id}-v1.png" alt="" aria-hidden="true" draggable="false">`;
  const roomResidents=r=>(r.residents||[]).length?`<span class="room-residents" aria-label="Жильцы: ${(r.residents||[]).map(id=>e(CHARS[id].name)).join(', ')}">${r.residents.map(id=>`<img class="resident-portrait" data-resident-id="${id}" src="assets/avatars/${id}.png" alt="${e(CHARS[id].name)}" draggable="false">`).join('')}</span>`:'';
  const EMOTIONS=Object.fromEntries(DATA.emotions.map(e=>[e.id,e]));
  const ICONS={
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-8h6v8"/>',
    heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
    star:'<path d="m12 2.2 3.1 6.3 7 1-5 4.9 1.2 7-6.3-3.3-6.3 3.3 1.2-7-5-4.9 7-1Z"/>',
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',back:'<path d="m14.5 5-7 7 7 7"/>',chevron:'<path d="m9 5 7 7-7 7"/>',
    check:'<path d="m4 12 5 5L20 6"/>',lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    book:'<path d="M12 6c-3-2-7-2-10-1v15c3-1 7-1 10 1 3-2 7-2 10-1V5c-3-1-7-1-10 1Zm0 0v15"/>',
    sparkles:'<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3ZM4 18l.7 2.3L7 21l-2.3.7L4 24l-.7-2.3L1 21l2.3-.7Z"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-12 5 2 2 4-4"/>',
    trophy:'<path d="M7 3h10v8a5 5 0 0 1-10 0V3Zm0 2H4v3a4 4 0 0 0 4 4m9-7h3v3a4 4 0 0 1-4 4m-4 4v4m-5 1h10"/>',
    images:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="9" r="2"/><path d="m3 17 5-5 4 4 3-3 6 6"/>',
    smile:'<circle cx="12" cy="12" r="9"/><path d="M8 14c1.6 2.5 6.4 2.5 8 0M8.5 9h.01M15.5 9h.01"/>',
    eye:'<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="3"/>',
    award:'<circle cx="12" cy="8" r="6"/><path d="m8.5 13.5-1 8 4.5-2.5 4.5 2.5-1-8"/>',
    face:'<rect x="3" y="3" width="18" height="18" rx="6"/><circle cx="8.5" cy="10" r=".6"/><circle cx="15.5" cy="10" r=".6"/><path d="M8.5 14q3.5 4 7 0"/>',
    gift:'<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 13h18M12 9v12M12 9C4-1 2 8 8 9m4 0c8-10 10-1 4 0"/>',
    sofa:'<path d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3M5 17h14v3H5v-3Zm0 1a3 3 0 0 1-2-3v-2a2 2 0 0 1 4 0v3h10v-3a2 2 0 0 1 4 0v2a3 3 0 0 1-2 3"/>',
    chef:'<path d="M6 12a4 4 0 0 1-1-7 4 4 0 0 1 7-.5A4 4 0 0 1 19 6a4 4 0 0 1-1 6v7H6v-7Z"/><path d="M6 15h12M6 19h12"/>',
    toy:'<rect x="5" y="7" width="14" height="14" rx="2"/><path d="M9 7V4h6v3M5 13h14m-7-6v14"/>',
    replay:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5"/>',
    sound:'<path d="M3 9v6h4l5 4V5L7 9H3Zm13-2a7 7 0 0 1 0 10m2-13a11 11 0 0 1 0 16"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>'
  };
  const ico=(name,cls='')=>`<span class="icon ${name==='star'?'star-icon ':''}${cls}" aria-hidden="true"><svg viewBox="0 0 24 24">${ICONS[name]||ICONS.smile}</svg></span>`;
  const e=(s='')=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const starsTotal=()=>Object.values(progress.levelStars).reduce((a,n)=>a+Number(n||0),0);
  const completedLevels=()=>Object.keys(progress.levelStars).length;
  const lvl=()=>Math.min(progress.unlockedLevel,16);
  const chapterFor=(level)=>DATA.chapters[Math.min(3,Math.floor((level-1)/4))];
  const passed=(n)=>Boolean(progress.levelStars[n]);
  const available=(n)=>n<=progress.unlockedLevel;
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(progress));}catch{}};
  function dateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function weekKey(date=new Date()){let d=new Date(date.getFullYear(),date.getMonth(),date.getDate()),day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return dateKey(d);}
  function weeklyDays(){const week=weekKey();return [...new Set(progress.dailyDates.filter(d=>{const [y,m,day]=d.split('-').map(Number);return weekKey(new Date(y,m-1,day))===week;}))].length;}
  const doneToday=()=>progress.dailyDates.includes(dateKey());
  const weeklyClaimed=()=>progress.weeklyClaimed.includes(weekKey());
  const unlockedStories=()=>DATA.stories.filter(s=>s.unlock<=progress.unlockedLevel);
  const newStories=()=>unlockedStories().filter(s=>!progress.storiesDone.includes(s.id));
  function heroAvatar(id,emo='neutral',size=''){const c=CHARS[id];const expr=emo==='neutral'?'neutral':emo;
    const source=window.DesignRuntime.getProject?.().assets[`portrait:${id}:${emo}`]||window.EMOTION_PORTRAITS?.[id]?.[emo];
    const eyebrows={joy:['M88 111q12-5 24 0','M148 111q12-5 24 0'],sadness:['M89 113q12-13 23-4','M148 109q12-9 24 4'],anger:['M88 107l27 11','M148 118l26-11'],surprise:['M88 99q13-8 26 0','M147 99q13-8 26 0'],fear:['M88 98q12-12 25-2','M148 97q13-10 25 2'],disgust:['M89 105q13-6 24 5','M148 110l25-7'],curiosity:['M89 104q14-11 25-5','M148 112q13-4 24 2'],shyness:['M89 112q11-5 24 1','M149 112q11-4 23 1'],neutral:['M89 110q12-5 24 0','M149 110q12-5 24 0']}[expr]||['M89 110h24','M149 110h24'];
    const lids=expr==='joy'?'<path d="M95 133q8-7 17 0M150 133q8-7 17 0" fill="none" stroke="#593b32" stroke-width="4" stroke-linecap="round"/>':expr==='shyness'?'<path d="M96 133q7-2 15 0M150 133q7-2 15 0" fill="none" stroke="#593b32" stroke-width="4" stroke-linecap="round"/>':`<ellipse cx="104" cy="131" rx="${expr==='surprise'||expr==='fear'?8:6}" ry="${expr==='surprise'||expr==='fear'?10:7}" fill="white"/><ellipse cx="159" cy="131" rx="${expr==='surprise'||expr==='fear'?8:6}" ry="${expr==='surprise'||expr==='fear'?10:7}" fill="white"/><circle cx="${expr==='shyness'?106:104}" cy="132" r="3.9" fill="#3a3c43"/><circle cx="${expr==='curiosity'?161:159}" cy="132" r="3.9" fill="#3a3c43"/>`;
    const mouth={joy:'<path d="M111 163Q130 192 151 163Z" fill="#964d58"/><path d="M115 165h33q-16 8-33 0" fill="white"/>',sadness:'<path d="M116 173q14-14 29 0" fill="none" stroke="#98575e" stroke-width="5" stroke-linecap="round"/>',anger:'<path d="M115 167h32" fill="none" stroke="#824e4f" stroke-width="5" stroke-linecap="round"/>',surprise:'<ellipse cx="131" cy="171" rx="11" ry="16" fill="#9d5961"/>',fear:'<ellipse cx="131" cy="172" rx="12" ry="13" fill="#9d5961"/>',disgust:'<path d="M115 172q17-12 31-2l-4 7q-15-5-27-5" fill="#9d5961"/>',curiosity:'<path d="M119 171q10 6 22-3" fill="none" stroke="#965360" stroke-width="4" stroke-linecap="round"/>',shyness:'<path d="M116 167q14 15 29 0" fill="none" stroke="#995461" stroke-width="4" stroke-linecap="round"/>',neutral:'<path d="M116 168q15 12 30 0" fill="none" stroke="#995461" stroke-width="4" stroke-linecap="round"/>'}[expr]||'';
    const hairStyles={
      grandma:'<ellipse cx="173" cy="61" rx="29" ry="27" fill="#c6cbce"/><path d="M73 105Q65 46 112 51Q140 28 178 72Q190 93 183 112L173 92Q165 70 145 72Q120 93 77 91Z" fill="#cbd0d3"/><path d="M84 76q35-38 75-5" stroke="#e2e5e7" stroke-width="9" fill="none" stroke-linecap="round"/>',
      grandpa:'<path d="M78 105Q69 74 95 65Q114 57 127 61Q145 48 169 62Q187 74 184 107Q170 78 161 79Q134 69 116 81Q97 77 78 105" fill="#c4cace"/><path d="M95 75q12-5 18-6M147 66q9 0 20 8" stroke="#e0e2e5" stroke-width="8" stroke-linecap="round"/>',
      mother:'<path d="M71 120Q60 44 120 47Q179 37 188 110L199 215Q180 234 171 205L165 99Q141 86 113 77Q101 105 77 107L82 203Q70 233 57 212Z" fill="#81503e"/><path d="M95 71q40-29 75 12" stroke="#a16b50" stroke-width="10" fill="none" stroke-linecap="round"/>',
      father:'<path d="M76 109Q67 56 110 54Q145 35 173 58Q190 69 185 109Q169 85 161 74Q134 83 112 76Q91 81 76 109" fill="#5c4238"/><path d="M95 73q36-31 73-4" stroke="#785343" stroke-width="10" fill="none" stroke-linecap="round"/>',
      brother:'<path d="M74 112Q65 72 87 69L96 51 113 64 124 43 143 60Q177 48 185 112L172 91Q145 94 134 76Q104 92 77 96Z" fill="#865339"/><path d="M92 76l20-16m22 8 24-7" stroke="#a9724e" stroke-width="9" stroke-linecap="round"/>',
      sister:'<circle cx="75" cy="77" r="25" fill="#885039"/><circle cx="189" cy="77" r="25" fill="#885039"/><path d="M77 108Q68 52 128 55Q187 51 184 108Q165 83 146 77Q116 96 79 95Z" fill="#8d543a"/><path d="M100 70q35-16 67 3" fill="none" stroke="#ad6f4e" stroke-width="8" stroke-linecap="round"/>'
    }[c.style];
    const accessories=(c.style==='grandma'||c.style==='grandpa')?'<g fill="none" stroke="#74615d" stroke-width="3.3"><circle cx="104" cy="131" r="16"/><circle cx="159" cy="131" r="16"/><path d="M120 129q11-5 23 0M87 128l-9-4m97 4 9-4"/></g>':'';
    const beard=c.style==='father'?'<path d="M91 154Q91 199 129 204Q167 198 170 153Q159 183 148 185Q131 194 114 185Q99 179 91 154Z" fill="#795747" opacity=".78"/>':'';
    const moustache=c.style==='grandpa'?'<path d="M132 156q-24-15-27 6 14 3 27-2 14 5 27 2-4-21-27-6Z" fill="#c5c8c9"/>':'';
    const blushing=expr==='shyness'?'<ellipse cx="93" cy="154" rx="16" ry="9" fill="#ed918e" opacity=".65"/><ellipse cx="171" cy="154" rx="16" ry="9" fill="#ed918e" opacity=".65"/>':'';
    const necklace=c.style==='mother'?'<path d="M112 214q20 20 41 0" stroke="#ffe0a8" stroke-width="4" fill="none"/>':'';
    const bow=c.style==='sister'?'<path d="M179 79q-18-23-18 2 5 11 18 1 11 15 20 1 8-16-20-4Z" fill="#eea8ae"/>':'';
    return `<div class="portrait ${source?'has-source':''}" data-char="${e(id)}" data-emotion="${e(emo)}"><svg viewBox="0 0 264 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${e(c.name)}">
     <rect width="264" height="250" rx="22" fill="${c.accent}"/><circle cx="131" cy="115" r="102" fill="#fff" opacity=".35"/><circle cx="40" cy="29" r="10" fill="white" opacity=".5"/><circle cx="222" cy="201" r="15" fill="white" opacity=".4"/>
     <path d="M28 251Q40 202 100 196L131 201 164 196Q223 201 236 251Z" fill="${c.clothes}"/><path d="M114 190h34v28q-17 16-34 0Z" fill="${c.skin}"/><path d="M105 199q27 31 53 0" fill="none" stroke="white" stroke-width="8" opacity=".35"/>${necklace}
     <ellipse cx="79" cy="140" rx="13" ry="20" fill="${c.skin}"/><ellipse cx="184" cy="140" rx="13" ry="20" fill="${c.skin}"/>
     <ellipse cx="131" cy="132" rx="58" ry="76" fill="${c.skin}"/><ellipse cx="110" cy="150" rx="36" ry="24" fill="white" opacity=".07"/>
     ${hairStyles}${beard}<path d="${eyebrows[0]}" stroke="${c.style==='grandma'||c.style==='grandpa'?'#8f9295':'#654638'}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="${eyebrows[1]}" stroke="${c.style==='grandma'||c.style==='grandpa'?'#8f9295':'#654638'}" stroke-width="5" fill="none" stroke-linecap="round"/>
     ${lids}<path d="M128 142q-5 11 4 12" fill="none" stroke="#cd967e" stroke-width="3" stroke-linecap="round"/>${blushing}${mouth}${moustache}${accessories}${bow}
     </svg>${source?`<img class="portrait-file portrait-source" src="${e(source)}" alt="${e(c.name)}" onerror="this.parentElement.classList.remove('has-source');this.remove()"/>`:''}</div>`;
  }
  function miniAvatar(id,emo='joy'){return `<span class="avatar-bubble">${heroAvatar(id,emo)}</span>`;}
  function familyRow(){return DATA.characters.map(c=>miniAvatar(c.id)).join('');}
  const outer=(page,nav=true)=>`<div class="device"><div class="scroll-area"><div class="page">${page}</div></div>${nav?navbar():''}${ui.toast?`<div class="toast">${e(ui.toast)}</div>`:''}${storyZoom()}</div>`;
  function storyZoom(){const st=DATA.stories.find(s=>s.id===ui.zoomedStory);return st?`<section class="story-lightbox" role="dialog" aria-modal="true" aria-label="Иллюстрация: ${e(st.title)}"><header><strong>${e(st.title)}</strong><button class="story-zoom-close" data-action="close-story-image" aria-label="Закрыть увеличенную картинку">Закрыть ×</button></header><p>Сдвигай картинку, чтобы рассмотреть детали</p><div class="story-zoom-pan" tabindex="0" aria-label="Увеличенная иллюстрация, прокрутка стрелками"><div class="story-zoom-canvas">${storyImage(st,'story-zoom-image')}</div></div></section>`:'';}
  function navbar(){return `<nav class="nav" aria-label="Основная навигация">${[['home','home','Дом'],['training','face','Тренировка'],['stories','book','Истории'],['rewards','trophy','Награды']].map(([id,ic,label])=>`<button class="nav-btn ${ui.screen===id?'active':''}" data-action="nav" data-to="${id}" aria-label="${label}">${ico(ic)}<span>${label}</span></button>`).join('')}</nav>`;}
  const head=(title,subtitle,back='training')=>`<header class="page-header"><button class="back" data-action="nav" data-to="${back}" aria-label="Назад">${ico('back')}</button><div><h1>${e(title)}</h1>${subtitle?`<p class="subtle">${e(subtitle)}</p>`:''}</div></header>`;
  const pill=(txt,type='')=>`<span class="pill ${type}">${txt}</span>`;
  function home(){const l=lvl(),stars=starsTotal();return `
    <header class="topline"><div class="brand"><div class="brand-mark">${ico('home')}</div><div><div class="brand-name">Дом эмоций</div><div class="micro">Учимся понимать чувства</div></div></div><button class="top-star" data-action="nav" data-to="rewards" aria-label="Твои звёзды: ${stars} из 48"><span class="star-token">${ico('star')}</span><span class="star-score"><strong>${stars}</strong><small>из 48</small></span></button></header>
    <div class="progress-card"><div class="progress-row"><div class="level-badge">${trainingIcon('medal')}</div><div class="progress-main"><strong>Путь эмоций</strong><div class="micro">${progress.unlockedLevel>16?'Все уровни пройдены':`Уровень ${l} · ${e(chapterFor(l).name)}`}</div></div><span class="progress-count"><strong>${completedLevels()}</strong><span>/ 16</span></span></div><div class="progress-track" role="progressbar" aria-label="Пройдено уровней" aria-valuemin="0" aria-valuemax="16" aria-valuenow="${completedLevels()}"><div class="progress-fill" style="width:${completedLevels()/16*100}%"></div></div></div>
    <section class="house-card"><div class="house-card-top"><span class="house-headline">Наш семейный дом</span>${pill(`${newStories().length} новых`,newStories().length?'peach':'mint')}</div><div class="house-image-wrap"><img class="house-image" src="assets/house-five-rooms-v1.png" alt="Дом в разрезе: детская, спальни, гостиная и кухня"/>
    ${DATA.rooms.map(r=>`<button class="room-hotspot ${r.id}" data-action="room" data-room="${r.id}" aria-label="${e(r.name)}: истории${r.residents.length?'. Жильцы: '+r.residents.map(id=>e(CHARS[id].name)).join(', '):''}">${roomIcon(r)}<span class="room-label">${e(r.name)}</span>${unlockedStories().some(s=>s.room===r.id&&!progress.storiesDone.includes(s.id))?'<span class="room-notify">!</span>':''}${roomResidents(r)}</button>`).join('')}</div></section>
    <button class="cta primary" data-action="nav" data-to="training"><span class="cta-copy"><span class="emoji-badge">${trainingIcon('recognize')}</span><span><strong>Тренировать эмоции</strong><small>Уровни, игры и открытия</small></span></span>${ico('arrow','lg')}</button>
    <div class="home-shortcuts"><button class="home-shortcut" data-action="daily"><span class="symbol">${trainingIcon('daily')}</span><span><strong>Задание дня</strong><small>${doneToday()?'Сегодня выполнено ✓':'5 новых вопросов'}</small></span></button><button class="home-shortcut" data-action="nav" data-to="rewards"><span class="symbol">${ico('award')}</span><span><strong>Награда недели</strong><small>${Math.min(3,weeklyDays())} из 3 дней</small></span></button></div>
    `;}
  function training(){const current=lvl(),chapter=chapterFor(current),canFree=progress.unlockedLevel>=5;return `
    ${head('Тренировки','Узнавай чувства по лицам','home')}
    <section class="chapter-banner"><div class="training-hero-row"><div class="training-hero-copy"><span class="training-eyebrow">Твой путь · глава ${chapter.number} из 4</span><h2>${progress.unlockedLevel>16?'Все главы пройдены':e(chapter.name)}</h2><p>${progress.unlockedLevel>16?'Повторяй любимые задания':'Следующий шаг — уровень '+current}</p></div>${trainingIcon('medal','hero-medal')}</div><div class="progress-track" role="progressbar" aria-label="Пройдено уровней" aria-valuemin="0" aria-valuemax="16" aria-valuenow="${completedLevels()}"><div class="progress-fill" style="width:${completedLevels()/16*100}%"></div></div><div class="training-progress-caption"><span>${completedLevels()} из 16 уровней</span><span>${ico('star')} ${starsTotal()} из 48</span></div><button class="btn solid full" data-action="start-level" data-level="${current}">${progress.unlockedLevel>16?'Повторить уровень 16':'Продолжить · уровень '+current}${ico('arrow','sm')}</button></section>
    <div class="section-head"><h3>Выбери игру</h3>${canFree?'<span class="micro">В своём темпе</span>':pill('После уровня 4')}</div>
    <div class="mode-grid"><button class="mode-card" data-action="free-mode" data-mode="name" ${canFree?'':'disabled'}><div class="mode-icon">${trainingIcon('recognize')}</div><strong>Угадай эмоцию</strong><p>Посмотри на лицо.<br>Назови чувство.</p><span class="mode-action">${canFree?'Начать '+ico('arrow','sm'):ico('lock','sm')+' Откроется позже'}</span></button><button class="mode-card mint" data-action="free-mode" data-mode="find" ${canFree?'':'disabled'}><div class="mode-icon">${trainingIcon('find')}</div><strong>Найди эмоцию</strong><p>Прочитай название.<br>Выбери картинку.</p><span class="mode-action">${canFree?'Начать '+ico('arrow','sm'):ico('lock','sm')+' Откроется позже'}</span></button></div>
    <div class="section-head path-section-head"><h3>Путь эмоций</h3><span class="micro">4 главы · 16 уровней</span></div>
    <div class="chapters">${DATA.chapters.map(ch=>`<section class="chapter"><div class="chapter-top"><div class="chapter-round ${ch.color}"><span>${ch.number}</span></div><div class="chapter-info"><strong>${e(ch.name)}</strong><p>${e(ch.subtitle)}</p></div>${ch.levels.every(passed)?pill('Готово','mint'):''}</div><div class="level-nodes">${ch.levels.map(n=>`<button class="level-node ${passed(n)?'passed':available(n)?'current':'locked'}" data-action="start-level" data-level="${n}" aria-label="Уровень ${n}${passed(n)?', пройден':available(n)?', доступен':', закрыт'}" ${available(n)?'':'disabled'}>${ico(passed(n)?'star':available(n)?'arrow':'lock')}<span>${n}</span></button>`).join('')}</div></section>`).join('')}</div>
    <button class="training-daily" data-action="daily">${trainingIcon('daily')}<span><strong>Задание дня ${doneToday()?'✓':''}</strong><small>${doneToday()?'Сегодня выполнено':'5 вопросов · новая практика'}</small></span>${ico('chevron','sm')}</button>
    <button class="training-rewards" data-action="nav" data-to="rewards">${ico('star')}<span>Мои награды</span><small>${Math.min(3,weeklyDays())} из 3 дней на этой неделе</small>${ico('chevron','sm')}</button>`;}
  function difficulty(){const options=[{id:'easy',name:'Легко',txt:'3 ответа · базовые эмоции',unlock:5},{id:'normal',name:'Обычно',txt:'4 ответа · 6 эмоций',unlock:9},{id:'hard',name:'Сложно',txt:'4 ответа · 8 эмоций',unlock:13}]; const chosen=options.find(o=>o.id===ui.difficulty);return `${head(ui.freeType==='name'?'Угадай эмоцию':'Найди эмоцию','Выбери подходящую сложность','training')}<div class="callout info">${ui.freeType==='name'?'На экране будет одно лицо. Выбирай, какую эмоцию выражает персонаж.':'На экране появятся несколько лиц. Найди изображение с нужной эмоцией.'}</div><div class="section-head"><h3>Уровень сложности</h3></div>${options.map(o=>`<button class="form-option ${ui.difficulty===o.id?'selected':''} ${progress.unlockedLevel<o.unlock?'locked':''}" data-action="set-difficulty" data-difficulty="${o.id}" ${progress.unlockedLevel<o.unlock?'disabled':''}><div><strong>${o.name}</strong><p>${o.txt}</p></div><span class="status">${progress.unlockedLevel<o.unlock?ico('lock','sm'):(ui.difficulty===o.id?ico('check'):'')}</span></button>`).join('')}<div style="height:18px"></div><button class="btn coral full" data-action="start-free">Начать тренировку · 8 вопросов ${ico('arrow','sm')}</button><p class="subtle" style="text-align:center;margin-top:12px">Свободные тренировки не расходуют звёзды. Можно играть сколько угодно.</p>`;}
  function seedFrom(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function rngSeed(seed){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
  function sample(arr,rng){return arr[Math.floor(rng()*arr.length)];}
  function shuffled(arr,rng){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function makeQuestions(mode,count,level,type,difficulty,dateSeed){const rng=dateSeed?rngSeed(seedFrom(dateSeed)):Math.random;let pool=chapterFor(level).emotions;let nOpts=level>=9?4:3;
    if(mode==='free'){pool=difficulty==='easy'?DATA.chapters[0].emotions:difficulty==='normal'?DATA.chapters[1].emotions:DATA.chapters[2].emotions;nOpts=difficulty==='easy'?3:4;}
    if(mode==='daily'){nOpts=level>=9?4:3;}
    const questions=[],used=new Set();for(let i=0;i<count;i++){
      const kind=type==='mixed'?(i%2===0?'name':'find'):type;
      const assets=window.DesignRuntime.getProject?.().assets||{};
      const hasImage=(id,emotion)=>!!(assets[`portrait:${id}:${emotion}`]||window.EMOTION_PORTRAITS?.[id]?.[emotion]);
      const candidates=DATA.characters.flatMap(who=>{
        const available=pool.filter(emotion=>hasImage(who.id,emotion));
        if(kind==='find'&&available.length<nOpts)return [];
        return available.map(target=>({who,target}));
      });
      // A missing expression is never replaced by a different emotion.
      const choices=candidates.length?candidates:DATA.characters.flatMap(who=>pool.map(target=>({who,target})));
      const unused=choices.filter(({who,target})=>!used.has(`${who.id}:${target}`));
      const {who,target}=sample(unused.length?unused:choices,rng);used.add(`${who.id}:${target}`);
      const optionPool=kind==='find'&&candidates.length?pool.filter(emotion=>hasImage(who.id,emotion)):pool;
      const rest=shuffled(optionPool.filter(x=>x!==target),rng).slice(0,nOpts-1);
      const opts=shuffled([target,...rest],rng);
      questions.push({kind,character:who.id,emotion:target,opts,correct:opts.indexOf(target)});
    }
    return questions;
  }
  function startQuiz(mode,level,type,difficulty){const count=mode==='daily'?5:8,questions=makeQuestions(mode,count,level,type,difficulty,mode==='daily'?dateKey():null);ui.quiz={mode,level,questions,index:0,selected:null,correct:0,difficulty};ui.quizResult=null;ui.screen='quiz';render(true);}
  function quiz(){const qz=ui.quiz,q=qz.questions[qz.index],who=CHARS[q.character],done=qz.selected!==null,correct=done&&qz.selected===q.correct;
    const prompt=`<div class="quiz-prompt"><p class="quiz-kicker">${q.kind==='name'?'Посмотри на лицо':'Выбери подходящую картинку'}</p><h1 class="quiz-question">${q.kind==='name'?`Что чувствует ${e(who.name.toLowerCase())}?`:`Где ${e(who.name.toLowerCase())} показывает «${e(EMOTIONS[q.emotion].name.toLowerCase())}»?`}</h1></div>`;
    return `<div class="quiz-top"><button class="back" data-action="quit-quiz" aria-label="Выйти">${ico('back')}</button><strong>${qz.mode==='path'?`Уровень ${qz.level}`:qz.mode==='daily'?'Задание дня':qz.questions[0].kind==='name'?'Угадай эмоцию':'Найди эмоцию'}</strong><span class="pill">${qz.index+1} / ${qz.questions.length}</span></div>
    <div class="quiz-progress">${qz.questions.map((_,i)=>`<span class="${i<qz.index?'done':i===qz.index?'current':''}"></span>`).join('')}</div>
    ${q.kind==='name'?`<div class="portrait-container">${heroAvatar(q.character,q.emotion)}<span class="portrait-name">${e(who.name)}</span></div>${prompt}<div class="choice-list">${q.opts.map((id,i)=>`<button class="choice ${done?(i===q.correct?'correct':qz.selected===i?'wrong':''):''}" data-action="answer" data-index="${i}" ${done?'disabled':''}><span class="choice-index">${String.fromCharCode(65+i)}</span><span>${e(EMOTIONS[id].name)}</span>${done&&i===q.correct?ico('check','mint-text'):''}</button>`).join('')}</div>`:
    `${prompt}<div class="face-options">${q.opts.map((id,i)=>`<button class="face-choice ${done?(i===q.correct?'correct':qz.selected===i?'wrong':''):''}" data-action="answer" data-index="${i}" aria-label="${e(who.name)}, вариант ${i+1}" ${done?'disabled':''}>${heroAvatar(q.character,id)}<div class="label"><span>${i+1} · ${e(who.name)}</span><span class="answer-mark" aria-hidden="true">${done&&i===q.correct?'✓':''}</span></div></button>`).join('')}</div>`}
    <div class="quiz-response" aria-live="polite">${done?`<div class="feedback ${correct?'':'wrong'}"><strong>${correct?'Верно! Отличная работа 🌟':'Ничего страшного, учимся дальше 💛'}</strong>${e(EMOTIONS[q.emotion].tip)}${q.emotion==='curiosity'||q.emotion==='shyness'?'<br>Чувства лучше уточнять словами, а не судить только по лицу.':''}</div><div class="quiz-bottom"><button class="btn coral full" data-action="next-question">${qz.index===qz.questions.length-1?'Посмотреть результат':'Следующий вопрос'} ${ico('arrow','sm')}</button></div>`:''}</div>`;}
  function finishQuiz(){const qz=ui.quiz;let oldStars=starsTotal(),newStars=0,previous=0;
    if(qz.mode==='path'){newStars=qz.correct>=7?3:qz.correct>=5?2:1;previous=Number(progress.levelStars[qz.level]||0);progress.levelStars[qz.level]=Math.max(previous,newStars);progress.unlockedLevel=Math.min(17,Math.max(progress.unlockedLevel,qz.level+1));}
    if(qz.mode==='daily'&&!doneToday()) progress.dailyDates.push(dateKey());
    save();ui.quizResult={...qz,score:qz.correct,newStars,addedStars:starsTotal()-oldStars};ui.quiz=null;ui.screen='result';render(true);
  }
  function result(){const r=ui.quizResult,isPath=r.mode==='path',num=isPath?Math.max(1,r.newStars):r.score>=7?3:r.score>=5?2:1,newOne=isPath?DATA.stories.find(s=>s.unlock===r.level+1&&!progress.storiesDone.includes(s.id)):null;return `${head('Результат','Маленькая победа — это тоже победа',r.mode==='path'?'training':'home')}<section class="result-hero"><span class="big-emoji">${r.score===r.questions.length?'🏆':'🎉'}</span><h1>${r.score===r.questions.length?'Потрясающе!':'Молодец!'}</h1><p>Ты узнаёшь эмоции всё лучше</p>${isPath?`<div class="result-stars">${[1,2,3].map(i=>`<span class="${i>num?'off':''}">⭐</span>`).join('')}</div>`:''}</section><div class="stat-pair"><div class="stat"><strong>${r.score}/${r.questions.length}</strong><span>Правильных ответов</span></div><div class="stat"><strong>${isPath?`${r.newStars} ⭐`:'✓'}</strong><span>${isPath?'Лучший результат уровня':r.mode==='daily'?'Задание дня':'Тренировка завершена'}</span></div></div>${r.addedStars>0?`<div class="callout info">+${r.addedStars} ${r.addedStars===1?'новая звезда':'новые звезды'} в коллекцию!</div>`:''}${newOne?`<div class="home-feature" style="cursor:default"><div class="feature-icon">📖</div><div class="feature-body"><strong>Открылась история «${e(newOne.title)}»</strong><p>Её можно найти в доме</p></div>${ico('sparkles','gold')}</div>`:''}<div style="height:18px"></div><button class="btn coral full" data-action="${isPath?'start-level':'nav'}" ${isPath?`data-level="${Math.min(16,r.level+1)}"`:'data-to="training"'}>${isPath&&r.level<16?'Следующий уровень':'К тренировкам'} ${ico('arrow','sm')}</button><button class="btn full" style="margin-top:9px" data-action="nav" data-to="home">Вернуться домой</button>`;}
  function stories(){return `${head('Истории семьи','Нажми на комнату, чтобы увидеть события','home')}<div class="callout info" style="margin-bottom:17px">Истории открываются, когда ты проходишь уровни «Пути эмоций». Сами комнаты всегда доступны.</div><div class="room-list">${DATA.rooms.map(r=>{const list=DATA.stories.filter(s=>s.room===r.id),unlocked=list.filter(s=>s.unlock<=progress.unlockedLevel),complete=list.filter(s=>progress.storiesDone.includes(s.id));return `<button class="room-button" data-action="room" data-room="${r.id}"><div class="room-square ${r.accent}">${roomIcon(r)}</div><div class="spacer"><strong>${e(r.name)}</strong><p>${e(r.description)} · ${complete.length}/${list.length} историй</p></div>${unlocked.some(s=>!progress.storiesDone.includes(s.id))?pill('Новое','peach'):ico('chevron','sm muted')}</button>`;}).join('')}</div><div class="section-head"><h3>Семейный альбом</h3>${pill(`${progress.storiesDone.length}/${DATA.stories.length}`)}</div><div class="card"><p class="subtle">Каждая история — небольшая ситуация, два вопроса и объяснение. Ты узнаёшь, почему люди испытывают разные чувства и как можно поддерживать друг друга.</p></div>`;}
  function room(){
    const r=DATA.rooms.find(x=>x.id===ui.room),st=DATA.stories.filter(s=>s.room===r.id);
    return `${head(r.name,r.description,'stories')}<div class="room-hero ${r.accent}"><div class="hero-icon">${roomIcon(r)}</div><h2>Истории в комнате</h2><p class="subtle">Узнавай чувства всей семьи!</p>${roomResidents(r)}</div>${st.map(s=>{const un=s.unlock<=progress.unlockedLevel,done=progress.storiesDone.includes(s.id);return `<button class="story-item" data-action="story" data-story="${s.id}" ${un?'':'disabled'}><div class="story-art">${storyImage(s,'story-thumbnail')}</div><div class="details"><strong>${e(s.title)}</strong><small>${done?'✓ История пройдена':un?e(s.subtitle):`Откроется после уровня ${s.unlock-1}`}</small></div><span class="trailing">${ico(un?'chevron':'lock','sm')}</span></button>`;}).join('')}${st.length?'<p class="subtle" style="margin-top:15px;text-align:center">Истории можно повторять без ограничений.</p>':'<div class="card empty">Новые истории для этой комнаты появятся позже.</div>'}`;
  }
  function story(){const st=DATA.stories.find(s=>s.id===ui.story.id),flow=ui.story,room=DATA.rooms.find(r=>r.id===st.room);
    if(flow.step===3){return `${head('История завершена','Ты узнал кое-что важное','room')}<div class="result-hero"><span class="big-emoji">${st.sticker}</span><h1>Отличная работа!</h1><p>«${e(st.title)}»</p></div><div class="card" style="margin-top:15px"><h3>Чему мы научились</h3><p class="subtle" style="margin-top:7px">${e(st.explain)} ${e(st.followExplain)}</p></div><div style="height:16px"></div><button class="btn coral full" data-action="nav" data-to="room">К историям комнаты ${ico('arrow','sm')}</button>`;}
    const options=flow.step===1?st.options:flow.step===2?st.followOptions:[],correct=flow.step===1?st.correct:st.followCorrect;
    return `${head(st.title,room.name,'room')}<div class="story-stepbar" aria-label="Шаг ${flow.step+1} из 3">${[0,1,2].map(i=>`<i class="${i<=flow.step?'active':''}"></i>`).join('')}</div><div class="story-stage ${flow.step===0?'story-intro':'story-question-stage'}"><button class="story-image-button" data-action="zoom-story-image" data-story="${st.id}" aria-label="Увеличить иллюстрацию: ${e(st.title)}">${storyImage(st,'story-illustration')}<span class="story-zoom-hint">Рассмотреть ↗</span></button>${flow.step===0?`<div class="speech">${e(st.scene)}</div>`:''}</div>${flow.step===0?`<p class="story-intro-hint">Посмотри на лица и подумай, что чувствуют герои.</p><button class="btn coral full" data-action="story-next">Ответить на вопросы ${ico('arrow','sm')}</button>`:
    `<h3 class="story-question">${e(flow.step===1?st.question:st.follow)}</h3><div class="choice-list">${options.map((choice,i)=>`<button class="choice ${flow.choice!==null?(i===correct?'correct':flow.choice===i?'wrong':''):''}" data-action="story-answer" data-index="${i}" ${flow.choice!==null?'disabled':''}><span class="choice-index">${String.fromCharCode(65+i)}</span>${e(choice)}</button>`).join('')}</div>${flow.choice!==null?`<div class="feedback ${flow.choice===correct?'':'wrong'}"><strong>${flow.choice===correct?'Верно! 💚':'Хорошая попытка!'}</strong>${e(flow.step===1?st.explain:st.followExplain)}</div><button class="btn coral full" style="margin-top:14px" data-action="story-next">${flow.step===2?'Завершить историю':'Продолжить'} ${ico('arrow','sm')}</button>`:''}`}`;
  }
  function rewards(){const count=weeklyDays(),claimed=weeklyClaimed(),earned=progress.storiesDone.map(id=>DATA.stories.find(s=>s.id===id)).filter(Boolean); const collectedWeekly=progress.weeklyClaimed.map((d,i)=>({id:d,sticker:DATA.weeklyStickers[i%DATA.weeklyStickers.length],title:`Награда недели ${i+1}`}));const cards=[...DATA.stories.map(s=>({id:s.id,sticker:s.sticker,title:s.title,locked:!progress.storiesDone.includes(s.id)})),...collectedWeekly.map(w=>({...w,locked:false}))];return `${head('Награды','Твои достижения и коллекция','home')}<div class="reward-big"><span>🏆</span><div><strong>${starsTotal()} / 48 ⭐</strong><p>Звёзды на Пути эмоций</p><div class="progress-track" style="background:#f1e3be"><div class="progress-fill" style="background:#efba55;width:${starsTotal()/48*100}%"></div></div></div></div><div class="section-head"><h3>Награда этой недели</h3>${pill(`${count}/3 дня`,'lilac')}</div><div class="card"><p class="subtle" style="margin-bottom:13px">Пройди ежедневное задание в любые 3 разных дня этой недели.</p><div class="day-grid">${[1,2,3].map(i=>`<div class="day ${count>=i?'done':''}"><span class="symbol">${count>=i?'✅':'☆'}</span><span>День ${i}</span></div>`).join('')}</div><div style="height:13px"></div><button class="btn ${count>=3&&!claimed?'coral':''} full" data-action="claim-week" ${count<3||claimed?'disabled':''}>${claimed?'Наклейка получена ✓':count>=3?'Получить наклейку 🎁':'До награды осталось '+(3-count)+' дн.'}</button></div><div class="section-head"><h3>Коллекция наклеек</h3><span class="micro">${earned.length+collectedWeekly.length} собрано</span></div><div class="sticker-grid">${cards.map(c=>`<div class="sticker ${c.locked?'locked':''}"><span class="symbol">${c.locked?'🔒':c.sticker}</span><span>${c.locked?'Ещё не открыто':e(c.title)}</span></div>`).join('')}</div><div class="section-head"><h3>Прогресс игры</h3></div><div class="card"><div class="progress-row"><div><strong>${completedLevels()} из 16</strong><p class="subtle">Пройдено уровней</p></div>${ico('check','lg mint-text')}</div><div class="progress-track"><div class="progress-fill" style="width:${completedLevels()/16*100}%"></div></div><p class="subtle" style="margin-top:12px">${progress.storiesDone.length} из ${DATA.stories.length} историй изучено · ${progress.dailyDates.length} ежедневных заданий выполнено</p></div><button class="btn ghost full" style="color:#9b8980;margin-top:21px;font-size:11px" data-action="reset">Сбросить прогресс прототипа</button>`;}
  function weeklyClaim(){if(weeklyDays()<3||weeklyClaimed())return;progress.weeklyClaimed.push(weekKey());save();ui.toast='Новая наклейка в коллекции! 🎁';render();}
  function pickView(){switch(ui.screen){case 'home':return home();case 'training':return training();case 'difficulty':return difficulty();case 'quiz':return quiz();case 'result':return result();case 'stories':return stories();case 'room':return room();case 'story':return story();case 'rewards':return rewards();default:return home();}}
  function render(top=false){
    const oldScroll=$('.scroll-area')?.scrollTop||0;
    game.innerHTML=outer(pickView(),!['quiz','result','story','difficulty','room'].includes(ui.screen));
    $('.page').classList.toggle('home-page',ui.screen==='home');
    $('.page').classList.toggle('quiz-page',ui.screen==='quiz');
    $('.page').classList.toggle('training-page',ui.screen==='training');
    $('.page').classList.toggle('story-page',ui.screen==='story');
    $('.device')?.classList.toggle('home-device',ui.screen==='home');
    const variant=ui.screen==='quiz'?`quiz-${ui.quiz.questions[ui.quiz.index].kind}`:ui.screen==='story'?`story-${ui.story.id}-${Math.min(ui.story.step,3)}`:ui.screen==='room'?`room-${ui.room}`:ui.screen==='difficulty'?`difficulty-${ui.freeType}`:ui.screen;
    window.DesignRuntime.rendered(variant);
    if(!top&&$('.scroll-area'))$('.scroll-area').scrollTop=oldScroll;
    if(ui.zoomedStory){$('.story-zoom-close')?.focus();const pan=$('.story-zoom-pan');if(pan)pan.scrollLeft=(pan.scrollWidth-pan.clientWidth)/2;}
  }
  function showToast(message){ui.toast=message;render();setTimeout(()=>{if(ui.toast===message){ui.toast='';render();}},2400);}
  document.addEventListener('click',ev=>{const btn=ev.target.closest('[data-action]');if(!btn||btn.disabled)return;const act=btn.dataset.action;
    if(act==='nav'){
      ui.zoomedStory=null;
      let target=btn.dataset.to;
      if(target==='room'&&!ui.room)target='stories';
      ui.screen=target;ui.toast='';render(true);return;
    }
    if(act==='room'){ui.room=btn.dataset.room;ui.screen='room';render(true);return;}
    if(act==='zoom-story-image'){ui.zoomedStory=btn.dataset.story;render();return;}
    if(act==='close-story-image'){ui.zoomedStory=null;render();$('.story-image-button')?.focus();return;}
    if(act==='start-level'){const n=Number(btn.dataset.level);if(!available(n))return;startQuiz('path',n,'mixed','path');return;}
    if(act==='free-mode'){ui.freeType=btn.dataset.mode;ui.difficulty='easy';ui.screen='difficulty';render(true);return;}
    if(act==='set-difficulty'){ui.difficulty=btn.dataset.difficulty;render();return;}
    if(act==='start-free'){startQuiz('free',lvl(),ui.freeType,ui.difficulty);return;}
    if(act==='daily'){if(doneToday()){showToast('Сегодня выполнено! Новое задание появится завтра ☀️');return;}startQuiz('daily',lvl(),'mixed','daily');return;}
    if(act==='answer'){const qz=ui.quiz;if(!qz||qz.selected!==null)return;qz.selected=Number(btn.dataset.index);if(qz.selected===qz.questions[qz.index].correct)qz.correct++;render();return;}
    if(act==='next-question'){const qz=ui.quiz;if(!qz||qz.selected===null)return;if(qz.index===qz.questions.length-1){finishQuiz();}else{qz.index++;qz.selected=null;render(true);}return;}
    if(act==='quit-quiz'){ui.quiz=null;ui.screen='training';render(true);return;}
    if(act==='story'){const id=btn.dataset.story,s=DATA.stories.find(s=>s.id===id);if(!s||s.unlock>progress.unlockedLevel)return;ui.room=s.room;ui.story={id,step:0,choice:null};ui.screen='story';render(true);return;}
    if(act==='story-answer'){if(!ui.story||ui.story.choice!==null)return;ui.story.choice=Number(btn.dataset.index);render();return;}
    if(act==='story-next'){if(!ui.story)return;if(ui.story.step>0&&ui.story.choice===null)return;ui.story.step++;ui.story.choice=null;if(ui.story.step===3&&!progress.storiesDone.includes(ui.story.id)){progress.storiesDone.push(ui.story.id);save();}render(true);return;}
    if(act==='claim-week'){weeklyClaim();return;}
    if(act==='reset'){if(window.confirm('Сбросить уровни, истории и награды в этом браузере?')){progress=freshProgress();save();ui.screen='home';render(true);}return;}
  });
  document.addEventListener('keydown',ev=>{
    if(!ui.zoomedStory)return;
    if(ev.key==='Escape'){ev.preventDefault();ui.zoomedStory=null;render();$('.story-image-button')?.focus();}
    if(ev.key==='Tab'){const close=$('.story-zoom-close'),pan=$('.story-zoom-pan');ev.preventDefault();(document.activeElement===close?pan:close)?.focus();}
  });
  window.EmotionGame={
    render, getState:()=>({screen:ui.screen,quiz:ui.quiz,story:ui.story,progress:JSON.parse(JSON.stringify(progress))}),
    preview(view){
      ui.toast='';
      if(view.startsWith('quiz-')){startQuiz('free',1,view.endsWith('find')?'find':'name','easy');return;}
      if(view.startsWith('difficulty-')){ui.freeType=view.endsWith('find')?'find':'name';ui.screen='difficulty';}
      else if(view.startsWith('room-')){ui.room=view.slice(5);ui.screen='room';}
      else if(view.startsWith('story-')){const parts=view.split(':');const id=parts[0].slice(6),st=DATA.stories.find(s=>s.id===id);if(!st)return;ui.room=st.room;ui.story={id,step:Number(parts[1]||0),choice:null};ui.screen='story';}
      else if(view==='result'){ui.quizResult={mode:'path',level:1,score:7,questions:Array(8).fill(null),newStars:3,addedStars:3};ui.screen='result';}
      else if(['home','training','stories','rewards'].includes(view))ui.screen=view;
      render(true);
    }
  };
  render(true);
})();
