export const host=(window.parent as any).game?.saga;
export const sessionKey=(window.frameElement as HTMLElement|null)?.dataset.sagaSession || new URLSearchParams(location.search).get('session') || '';
export const scope=`saga-foundry-${(window.parent as any).game?.world?.id}-${(window.parent as any).game?.user?.id}`;
export const fail=(e:unknown)=>alert(e instanceof Error?e.message:String(e));

export const imageURL=(path:string)=>/^(data:|https?:|blob:|\/)/.test(path)?path:new URL((window.parent as any).foundry?.utils?.getRoute(path)||('/'+path),window.parent.location.href).href;
