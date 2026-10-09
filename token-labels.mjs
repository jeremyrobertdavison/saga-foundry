const labels=new WeakMap();
export function clearConditionLabel(token){const label=labels.get(token);if(label&&!label.destroyed){label.parent?.removeChild(label);label.destroy();}labels.delete(token);}
export function refreshConditionLabel(token){
 if(!token||token.destroyed)return;
 const conditions=token.actor?.system?.session?.conditions||[];
 if(!conditions.length){clearConditionLabel(token);return;}
 let label=labels.get(token);
 if(!label||label.destroyed){
  label=new foundry.canvas.containers.PreciseText('',{fontFamily:'Arial',fontSize:12,fill:0xffe1a1,stroke:0x000000,strokeThickness:3,align:'center',wordWrap:true,breakWords:false});
  label.anchor.set(0.5,0);label.eventMode='none';labels.set(token,label);
 }
 if(label.parent!==token)token.addChild(label);
 const grid=globalThis.canvas?.dimensions?.size||100;
 label.style.fontSize=Math.max(10,Math.round(grid*0.12));label.style.wordWrapWidth=Math.max(token.w,grid*1.3);
 const text=conditions.join(' · ');if(label.text!==text)label.text=text;
 const name=token.nameplate;const nameBottom=name?.visible?name.y+(1-(name.anchor?.y||0))*name.height:0;
 label.position.set(token.w/2,Math.max(token.h+3,nameBottom+2));
 label.visible=token.isVisible&&(!token.document.hidden||game.user.isGM);
}
export function registerConditionLabels(){
 const Hooks=foundry.helpers.Hooks;
 for(const event of ['drawToken','refreshToken'])Hooks.on(event,refreshConditionLabel);
 Hooks.on('destroyToken',clearConditionLabel);
 Hooks.on('updateToken',doc=>{if(doc.object)refreshConditionLabel(doc.object);});
 Hooks.on('updateActor',actor=>{for(const token of globalThis.canvas?.tokens?.placeables||[]){if(token.actor===actor||token.actor?.uuid===actor.uuid||(token.document.actorLink&&token.document.actorId===actor.id))refreshConditionLabel(token);}});
 Hooks.on('canvasReady',()=>{for(const token of canvas.tokens?.placeables||[])refreshConditionLabel(token);});
 Hooks.on('canvasTearDown',()=>{for(const token of globalThis.canvas?.tokens?.placeables||[])clearConditionLabel(token);});
}
