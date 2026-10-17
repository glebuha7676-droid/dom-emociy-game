const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{
 const root=path.resolve(__dirname,'..'),file=path.join(root,'assets','house-five-rooms-v1.png');
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const center=Math.floor(info.width/2);
 const opaque=(x,y)=>{const i=(y*info.width+x)*4;return data[i+3]>240&&data[i]>145&&data[i+1]>90&&data[i+2]>45;};
 let bottom=info.height-1;for(;bottom>0;bottom--)if(opaque(center,bottom)&&opaque(center-10,bottom)&&opaque(center+10,bottom))break;
 const row=bottom-5;let left=center,right=center;while(left>0&&opaque(left-1,row))left--;while(right<info.width-1&&opaque(right+1,row))right++;
 const geometry={imageWidth:info.width,imageHeight:info.height,stairsLeft:left,stairsRight:right+1,stairsBottom:bottom+1,roadViewWidth:1024,roadViewHeight:512,roadTopLeft:360,roadTopRight:664};
 fs.writeFileSync(path.join(root,'assets','yard-geometry.json'),JSON.stringify(geometry,null,2));
 await sharp(file).extract({left:Math.max(0,left-30),top:bottom-100,width:right-left+61,height:150}).resize({width:900}).png().toFile(path.join(__dirname,'stairs-reference.png'));
 console.log(JSON.stringify(geometry));
})().catch(e=>{console.error(e);process.exitCode=1;});
