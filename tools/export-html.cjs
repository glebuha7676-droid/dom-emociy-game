// Shared standalone game generation for builds and saving from the editor.
module.exports=(bundle,project)=>{
  const p={...project,assets:{house:bundle.house,homeBackground:bundle.homeBackground,homePath:bundle.homePath,...bundle.defaults,...project.assets}};
  const json=JSON.stringify(p).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
  const title=String(p.name).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>'+title+'</title><style>'+bundle.css+'</style></head><body><div id="viewport"><main id="game" aria-live="polite"></main></div>'+script('window.EMOTION_PROJECT='+json+';')+bundle.scripts.map(script).join('')+'</body></html>';
};
