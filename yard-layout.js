/* Coordinates of the generated path are tied to the actual fitted house image. */
(() => {
  'use strict';
  const position=value=>{
    const parts=String(value||'50% 50%').split(/\s+/);
    if(parts.length===1)parts.splice(0,1,...(['top','bottom'].includes(parts[0])?['50%',parts[0]]:[parts[0],'50%']));
    return parts.map(v=>v==='left'||v==='top'?0:v==='right'||v==='bottom'?1:v==='center'?.5:v.endsWith('%')?Number.parseFloat(v)/100:.5);
  };
  window.EmotionYardPlacement=box=>{
    const a=box.anchor,nw=box.naturalWidth||a.imageWidth,nh=box.naturalHeight||a.imageHeight;
    const factor=box.fit==='cover'?Math.max(box.width/nw,box.height/nh):Math.min(box.width/nw,box.height/nh);
    const w=box.fit==='fill'?box.width:nw*factor,h=box.fit==='fill'?box.height:nh*factor;
    const [px,py]=position(box.position),left=box.left+(box.width-w)*px,top=box.top+(box.height-h)*py;
    const center=left+w*(a.stairsLeft+a.stairsRight)/(2*a.imageWidth);
    const nearWidth=w*(a.stairsRight-a.stairsLeft)/a.imageWidth;
    const ground=top+h*a.stairsBottom/a.imageHeight;
    const pathTop=ground-1;
    return {center,nearWidth,ground,top:pathTop,width:nearWidth*a.roadViewWidth/(a.roadTopRight-a.roadTopLeft),height:Math.max(0,box.pageHeight-pathTop)};
  };
})();
