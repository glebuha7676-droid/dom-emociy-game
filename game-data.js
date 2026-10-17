/* КОНТЕНТ ИГРЫ: здесь можно добавлять персонажей, эмоции, уровни и истории. */
window.GAME_DATA = {
  // Готовые портреты описаны в portrait-data.js; замены из редактора имеют приоритет.
  yardGeometry:{imageWidth:1133,imageHeight:1388,stairsLeft:385,stairsRight:748,stairsBottom:1314,roadViewWidth:1024,roadViewHeight:512,roadTopLeft:360,roadTopRight:664},
  characters: [
    { id:'grandma', name:'Бабушка', short:'Бабушка', skin:'#F5C9A5', hair:'#CFD5D9', clothes:'#C98AB5', style:'grandma', accent:'#F6E7F3' },
    { id:'grandpa', name:'Дедушка', short:'Дедушка', skin:'#E7B98F', hair:'#D5D7DA', clothes:'#75A5BC', style:'grandpa', accent:'#DBEEF8' },
    { id:'mother', name:'Мама', short:'Мама', skin:'#F2BB94', hair:'#85503D', clothes:'#EF9A7C', style:'mother', accent:'#FFE9DE' },
    { id:'father', name:'Папа', short:'Папа', skin:'#DFA77E', hair:'#634639', clothes:'#86B3A1', style:'father', accent:'#E4F6EB' },
    { id:'brother', name:'Брат', short:'Брат', skin:'#F4C59E', hair:'#87563D', clothes:'#89B6E6', style:'brother', accent:'#E5F3FF' },
    { id:'sister', name:'Сестра', short:'Сестра', skin:'#F1BC98', hair:'#8D543A', clothes:'#E8A7B5', style:'sister', accent:'#FFF0F3' }
  ],
  emotions: [
    {id:'joy', name:'Радость', icon:'😊', group:1, tip:'Уголки губ приподняты, человек улыбается.'},
    {id:'sadness', name:'Грусть', icon:'😢', group:1, tip:'Уголки рта опущены, взгляд может быть печальным.'},
    {id:'anger', name:'Злость', icon:'😠', group:1, tip:'Брови сдвинуты, лицо выглядит напряжённым.'},
    {id:'surprise', name:'Удивление', icon:'😮', group:1, tip:'Брови подняты, глаза и рот могут быть раскрыты.'},
    {id:'fear', name:'Страх', icon:'😨', group:2, tip:'Глаза широко раскрыты, лицо может выглядеть напряжённым.'},
    {id:'disgust', name:'Отвращение', icon:'🤢', group:2, tip:'Нос может морщиться, губы сжимаются или приподнимаются.'},
    {id:'curiosity', name:'Интерес', icon:'🤔', group:3, tip:'Взгляд внимательный; чтобы понять чувство, полезен контекст.'},
    {id:'shyness', name:'Смущение', icon:'☺️', group:3, tip:'Человек может отводить взгляд, улыбаться и краснеть.'}
  ],
  chapters: [
    {number:1,name:'Первые чувства',subtitle:'Учимся узнавать эмоции',levels:[1,2,3,4],emotions:['joy','sadness','anger','surprise'],color:'peach',icon:'smile'},
    {number:2,name:'Замечаем детали',subtitle:'Страх и отвращение',levels:[5,6,7,8],emotions:['joy','sadness','anger','surprise','fear','disgust'],color:'mint',icon:'eye'},
    {number:3,name:'Тонкие сигналы',subtitle:'Интерес и смущение',levels:[9,10,11,12],emotions:['joy','sadness','anger','surprise','fear','disgust','curiosity','shyness'],color:'lilac',icon:'sparkles'},
    {number:4,name:'Детектив эмоций',subtitle:'Все эмоции вместе',levels:[13,14,15,16],emotions:['joy','sadness','anger','surprise','fear','disgust','curiosity','shyness'],color:'gold',icon:'award'}
  ],
  rooms: [
    {id:'living',name:'Гостиная',emoji:'🛋️',icon:'sofa',iconImage:'assets/room-icons/living-v1.png',residents:[],accent:'peach',description:'Тёплые семейные моменты'},
    {id:'kitchen',name:'Кухня',emoji:'🍲',icon:'chef',iconImage:'assets/room-icons/kitchen-v1.png',residents:[],accent:'mint',description:'Сюрпризы и разговоры'},
    {id:'kids',name:'Детская',emoji:'🧸',icon:'toy',iconImage:'assets/room-icons/kids-v1.png',residents:['brother','sister'],accent:'lilac',description:'Приключения брата и сестры'},
    {id:'grandparents',name:'Спальня 2',emoji:'🛏️',icon:'book',iconImage:'assets/room-icons/grandparents-v1.png',residents:['grandma','grandpa'],accent:'peach',description:'Уютная комната бабушки и дедушки'},
    {id:'parents',name:'Спальня 1',emoji:'🛏️',icon:'heart',iconImage:'assets/room-icons/parents-v1.png',residents:['mother','father'],accent:'mint',description:'Комната мамы и папы'}
  ],
  stories: [], // Иллюстрированные сюжеты подключаются из story-data.js.
  weeklyStickers: ['🌈','🦋','🌟','🧸','🎈','🪁','🎨','🐣','💛','🌸','🍀','🏅']
};
