(function(){
 const KEY='hotelEspelho.syncV080'; let channel=null,applying=false;
 function ensure(){if(!data)return null;const c=data.campanha=data.campanha||{};c.syncV080=c.syncV080&&typeof c.syncV080==='object'?c.syncV080:{};const s=c.syncV080;s.schema=1;s.revisao=Number(s.revisao)||0;s.sessionId=s.sessionId||`sess_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;s.deviceId=localStorage.getItem(KEY+'.device')||(()=>{const x=`dev_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;localStorage.setItem(KEY+'.device',x);return x})();s.modo=s.modo||'local';return s}
 function snapshot(){return JSON.parse(JSON.stringify({campanha:data?.campanha,jogadores:data?.jogadores,monstros:data?.monstros,assassinos:data?.assassinos}))}
 function touch(type='STATE_CHANGED',payload={}){const s=ensure();if(!s||applying)return;s.revisao++;s.ultimoEvento={type,at:Date.now(),device:s.deviceId};if(channel&&s.modo==='broadcast')channel.postMessage({schema:1,sessionId:s.sessionId,revisao:s.revisao,deviceId:s.deviceId,type,payload,snapshot:snapshot()});return s.revisao}
 function start(mode='local'){const s=ensure();if(!s)return;stop();s.modo=mode==='broadcast'&&'BroadcastChannel' in window?'broadcast':'local';if(s.modo==='broadcast'){channel=new BroadcastChannel('hotel-espelho-session-v080');channel.onmessage=receive}if(typeof saveLocal==='function')saveLocal();return status()}
 function stop(){if(channel){channel.close();channel=null}if(data?.campanha?.syncV080)data.campanha.syncV080.modo='local'}
 function receive(packet){const s=ensure();if(!s||!packet||packet.sessionId!==s.sessionId||packet.deviceId===s.deviceId||Number(packet.revisao)<=Number(s.revisao))return;s.pendente={revisao:packet.revisao,deviceId:packet.deviceId,type:packet.type,at:Date.now()};if(typeof renderMaster==='function')renderMaster()}
 function status(){const s=ensure();return s?{modo:s.modo,revisao:s.revisao,sessionId:s.sessionId,deviceId:s.deviceId,pendente:s.pendente||null}:null}
 function reset(){const s=ensure();if(!s)return;s.sessionId=`sess_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;s.revisao=0;s.pendente=null;if(typeof saveLocal==='function')saveLocal()}
 const originalSave=window.saveLocal;
 if(typeof originalSave==='function'&&!originalSave.__syncV080){
   const wrappedSave=function(){if(!applying)touch('STATE_SAVED',{});return originalSave.apply(this,arguments)};
   wrappedSave.__syncV080=true;window.saveLocal=wrappedSave;
 }
 window.SessionSyncV080={ensure,snapshot,touch,start,stop,receive,status,reset,isApplying:()=>applying};
 const boot=()=>{if(!data)return setTimeout(boot,100);ensure();start('local')};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
