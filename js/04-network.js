/* V1.1 — PeerJS legado desativado. A sincronização online é feita pelo Supabase em js/08-supabase.js. */
if (window.HOTEL_USE_SUPABASE !== false) {
  // Não inicializa o transporte PeerJS legado nesta versão.
} else {
/* Hotel Espelho RPG — módulo consolidado. */

/* --- 47-session-sync-v080.js --- */
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


/* --- 53-v071-combat-multiplayer.js --- */
/* V0.71 — Central de Combate + ficha de mesa multiplayer (presencial). */
(function(){
  'use strict';
  const MP={version:1,role:'offline',peer:null,hostPeerId:null,roomCode:null,connections:new Map(),owners:new Map(),ownerId:null,connected:false,applying:false,playerRevisions:new Map(),localRevision:0};
  const $id=id=>document.getElementById(id);
  const h=v=>typeof esc==='function'?esc(v):String(v??'');
  const clone=o=>JSON.parse(JSON.stringify(o));
  const shortCode=()=>Math.random().toString(36).slice(2,8).toUpperCase();
  function ensureCampaign(){
    data.campanha=data.campanha||{};
    data.campanha.combateV071=data.campanha.combateV071||{ativo:false,rodada:1,ordem:[],indice:0,historico:[]};
    const c=data.campanha.combateV071;
    c.ordem=Array.isArray(c.ordem)?c.ordem:[]; c.historico=Array.isArray(c.historico)?c.historico:[];
    return c;
  }
  function entities(){return [...(data.jogadores||[]),...(data.monstros||[]),...(data.assassinos||[])];}
  function entity(id){return entities().find(x=>String(x.id)===String(id));}
  function entityType(x){return data.jogadores?.some(p=>p.id===x.id)?'Jogador':data.assassinos?.some(p=>p.id===x.id)?'Assassino':'Monstro';}
  function formulaRoll(f){
    const m=String(f||'1d20').replace(/\s/g,'').match(/^(\d+)d(\d+)([+-]\d+)?$/i); if(!m)return null;
    const n=+m[1],s=+m[2],mod=+(m[3]||0),rolls=Array.from({length:n},()=>Math.floor(Math.random()*s)+1);
    return {formula:String(f),rolls,mod,total:rolls.reduce((a,b)=>a+b,0)+mod};
  }
  function attackList(x){return Array.isArray(x?.ataques)?x.ataques:[];}
  function currentTurn(){const c=ensureCampaign();return entity(c.ordem[c.indice])||null;}
  function alive(x){return x && Number(x.pv??1)>0;}
  function combatParticipants(){return entities().filter(alive);}
  function logCombat(text){const c=ensureCampaign();c.historico.unshift({at:Date.now(),text:String(text)});c.historico=c.historico.slice(0,60);if(typeof logAction==='function')logAction(`[COMBATE] ${text}`);}
  function persist(){if(typeof saveLocal==='function')saveLocal();}
  function start(ids){
    const c=ensureCampaign(); const chosen=(ids?.length?ids:combatParticipants().map(x=>x.id)).map(String);
    if(chosen.length<2)return toast('Selecione pelo menos dois participantes.');
    const order=chosen.filter(id=>entity(id)).map(id=>({id,initiative:null}));
    order.forEach(o=>{const x=entity(o.id);const agi=Number(x?.atributos?.AGI)||0;o.initiative=(Math.floor(Math.random()*20)+1)+agi;});
    order.sort((a,b)=>b.initiative-a.initiative); c.ordem=order.map(o=>o.id); c.indice=0;c.rodada=1;c.ativo=true;c.historico=[];
    logCombat(`Combate iniciado: ${order.map(o=>entity(o.id)?.nome).join(', ')}.`); persist(); render();
  }
  function stop(){const c=ensureCampaign();c.ativo=false;logCombat('Combate encerrado.');persist();render();}
  function next(){const c=ensureCampaign();if(!c.ativo)return toast('Nenhum combate ativo.');let next=c.indice+1,round=c.rodada;if(next>=c.ordem.length){next=0;round++;}while(c.ordem.length&& !alive(entity(c.ordem[next]))){next=(next+1)%c.ordem.length;if(next===c.indice)break;}c.indice=next;c.rodada=round;logCombat(`Turno: ${entity(c.ordem[c.indice])?.nome||'—'}.`);persist();render();}
  function prev(){const c=ensureCampaign();if(!c.ativo)return;let prev=c.indice-1,round=c.rodada;if(prev<0){prev=c.ordem.length-1;round=Math.max(1,round-1);}c.indice=prev;c.rodada=round;persist();render();}
  function setHP(id,value){const x=entity(id);if(!x)return;x.pv=Math.max(0,Math.min(Number(x.pvMax??x.pvBase??9999),Number(value)||0));logCombat(`${x.nome}: PV ${x.pv}/${x.pvMax??x.pvBase??'—'}.`);persist();render();}
  function damage(id,value){const x=entity(id);if(!x)return;const amount=Math.max(0,Number(value)||0);x.pv=Math.max(0,Number(x.pv||0)-amount);logCombat(`${x.nome} sofreu ${amount} de dano. PV ${x.pv}/${x.pvMax??x.pvBase??'—'}.`);persist();render();}
  function heal(id,value){const x=entity(id);if(!x)return;const max=Number(x.pvMax??x.pvBase??9999);const amount=Math.max(0,Number(value)||0);x.pv=Math.min(max,Number(x.pv||0)+amount);logCombat(`${x.nome} recuperou ${amount} PV. PV ${x.pv}/${max}.`);persist();render();}
  function rollAttack(id,index){
    const x=entity(id),a=attackList(x)[index];if(!x||!a)return;const r=formulaRoll(a.teste||'1d20');if(!r)return toast('Fórmula de ataque inválida.');const t=prompt(`Ataque de ${x.nome}: ${a.nome}\nResultado: ${r.total}\n\nDefesa do alvo (opcional):`);if(t===null)return;const def=Number(t);const hit=!Number.isFinite(def)||t.trim()===''?null:r.total>=def;logCombat(`${x.nome} rolou ${a.nome}: ${r.total}${hit===null?'':` vs Defesa ${def} — ${hit?'ACERTO':'FALHA'}`}.`);showCombatRoll(`${x.nome} • ${a.nome}`,r,hit===null?'Resultado registrado':hit?'ACERTO':'FALHA');persist();}
  function rollDamageFor(id,index){const x=entity(id),a=attackList(x)[index];if(!x||!a)return;const r=formulaRoll(a.dano||'1d4');if(!r)return toast('Fórmula de dano inválida.');logCombat(`${x.nome} rolou dano de ${a.nome}: ${r.total}.`);showCombatRoll(`${x.nome} • Dano`,r,'DANO');persist();}
  function showCombatRoll(title,r,outcome){
    const modal=$id('diceModal');if(!modal)return; $id('diceTitle').textContent=title;$id('diceFormula').textContent=r.formula;$id('diceResult').textContent=r.total;$id('diceBreakdown').textContent=`Dados: ${r.rolls.join(' + ')}${r.mod?` ${r.mod>0?'+':''}${r.mod}`:''}`;$id('diceOutcome').textContent=outcome;$id('diceOutcome').className='dice-outcome';$id('diceDTWrap').style.display='none';$id('rollAgain').style.display='none';modal.classList.add('show');
  }
  function detail(id){
    const x=entity(id);if(!x)return;const attacks=attackList(x).map((a,i)=>`<div class="v071-attack"><div><b>${h(a.nome)}</b><small>Teste: ${h(a.teste||'—')} • Dano: ${h(a.dano||'—')}</small></div><div><button class="dice-btn" onclick="CombatV071.rollAttack('${x.id}',${i})">ATAQUE</button><button class="dice-btn secondary" onclick="CombatV071.rollDamage('${x.id}',${i})">DANO</button></div></div>`).join('')||'<small class="muted">Nenhum ataque cadastrado.</small>';
    const modal=document.createElement('div');modal.className='modal show';modal.id='v071ThreatModal';modal.innerHTML=`<div class="v071-threat-modal panel"><button class="close" onclick="this.closest('.modal').remove()">×</button><p class="eyebrow">FICHA DA AMEAÇA</p><h2>${h(x.nome)}</h2><div class="v071-meta"><span>Tipo <b>${h(x.tipo||entityType(x))}</b></span><span>Elemento <b>${h(x.elemento||'—')}</b></span><span>VD <b>${h(x.vd??'—')}</b></span><span>Defesa <b>${h(x.defesa??'—')}</b></span></div><div class="v071-hp"><label>PV ATUAL<input type="number" min="0" max="${Number(x.pvMax??x.pvBase??9999)}" value="${Number(x.pv??0)}" onchange="CombatV071.setHP('${x.id}',this.value)"></label><span>/ ${h(x.pvMax??x.pvBase??'—')}</span></div><h3>Ataques</h3>${attacks}<details><summary>Informações adicionais</summary><pre class="v071-pre">${h(JSON.stringify({resistencias:x.resistencias,imunidades:x.imunidades,vulnerabilidades:x.vulnerabilidades,habilidades:x.habilidades,movimento:x.movimento,fraquezas:x.fraquezas,descricao:x.descricao},null,2))}</pre></details></div>`;document.body.appendChild(modal);
  }
  function renderCombatPanel(){
    const host=$id('v071CombatPanel');if(!host||!data)return;const c=ensureCampaign();const all=entities();const current=currentTurn();
    if(!c.ativo){
      const checks=all.map(x=>`<label class="v071-check"><input type="checkbox" value="${h(x.id)}" checked> <span>${h(x.nome)}</span><small>${h(entityType(x))} • PV ${h(x.pv??0)}/${h(x.pvMax??x.pvBase??'—')}</small></label>`).join('');
      host.innerHTML=`<div class="panel-title"><div><span class="icon">⚔</span><div><h2>Central de Combate • V0.71</h2><p>Feita para a mesa presencial: o Mestre controla e a ficha dos jogadores acompanha os recursos.</p></div></div></div><div class="v071-start"><div><b>Participantes</b><small>Marque jogadores, monstros e assassinos que estarão no combate.</small><div class="v071-check-grid">${checks||'<small class="muted">Nenhum participante disponível.</small>'}</div></div><button class="primary" onclick="CombatV071.startFromUI()">⚔ INICIAR COMBATE</button></div>`;return;
    }
    const rows=c.ordem.map((id,i)=>{const x=entity(id);return x?`<div class="v071-turn-row ${i===c.indice?'active':''} ${alive(x)?'':'dead'}"><span class="v071-init">${i===c.indice?'▶':''} ${i+1}</span><div><b>${h(x.nome)}</b><small>${h(entityType(x))} • Iniciativa ${h((c.ordem||[]).find(o=>o===id)?'—':'')}</small></div><strong>PV ${h(x.pv??0)}/${h(x.pvMax??x.pvBase??'—')}</strong><button class="dice-btn secondary" onclick="CombatV071.detail('${x.id}')">FICHA</button></div>`:''}).join('');
    const attacks=current?attackList(current).map((a,i)=>`<button class="dice-btn" onclick="CombatV071.rollAttack('${current.id}',${i})">${h(a.nome)} • ATAQUE</button>`).join(''):'<small class="muted">Nenhum turno selecionado.</small>';
    const hpControls=all.map(x=>`<div class="v071-hp-row"><div><b>${h(x.nome)}</b><small>${h(entityType(x))}</small></div><input type="number" min="0" max="${Number(x.pvMax??x.pvBase??9999)}" value="${Number(x.pv??0)}" onchange="CombatV071.setHP('${x.id}',this.value)"><button class="dice-btn secondary" onclick="CombatV071.damage('${x.id}',prompt('Dano em ${h(x.nome)}:')||0)">− DANO</button><button class="dice-btn secondary" onclick="CombatV071.heal('${x.id}',prompt('Cura em ${h(x.nome)}:')||0)">＋ CURA</button></div>`).join('');
    const hist=(c.historico||[]).slice(0,10).map(e=>`<div><time>${new Date(e.at).toLocaleTimeString()}</time><span>${h(e.text)}</span></div>`).join('')||'<small class="muted">Sem eventos.</small>';
    host.innerHTML=`<div class="panel-title"><div><span class="icon">⚔</span><div><h2>Combate em andamento</h2><p>Rodada ${c.rodada} • Turno de <b>${h(current?.nome||'—')}</b></p></div></div><button class="ghost small" onclick="CombatV071.stop()">ENCERRAR</button></div><div class="v071-combat-grid"><section><h3>Ordem de iniciativa</h3>${rows}</section><section><h3>Ações do turno</h3><div class="v071-actions"><button class="primary" onclick="CombatV071.prev()">← TURNO ANTERIOR</button><button class="primary" onclick="CombatV071.next()">PRÓXIMO TURNO →</button>${attacks}</div><h3>Recursos</h3><div class="v071-hp-list">${hpControls}</div></section></div><details class="v071-history"><summary>Histórico do combate</summary>${hist}</details>`;
  }
  function mount(){
    if(!$id('v071CombatPanel')){const p=document.createElement('section');p.id='v071CombatPanel';p.className='panel v071-combat-panel';const host=$id('masterMonsters');(host?.parentNode||$id('masterScreen'))?.insertBefore(p,host?.parentNode?.children[host.parentNode.children.length-1]||null);}
    const master=$id('masterScreen');if(master&&!$id('v071ThreatTools')){const p=document.createElement('section');p.id='v071ThreatTools';p.className='panel v071-threat-tools';p.innerHTML='<div class="panel-title"><div><span class="icon">☠</span><div><h2>Consulta rápida de ameaças</h2><p>Abra a ficha completa de qualquer ameaça da sessão.</p></div></div></div><div id="v071ThreatButtons"></div>';master.insertBefore(p,$id('v071CombatPanel'));}
    renderCombatPanel();renderThreatButtons();
  }
  function renderThreatButtons(){const host=$id('v071ThreatButtons');if(!host||!data)return;const xs=[...(data.monstros||[]),...(data.assassinos||[])];host.innerHTML=xs.map(x=>`<button class="v071-threat-chip" onclick="CombatV071.detail('${h(x.id)}')">☠ ${h(x.nome)} <small>PV ${h(x.pv??0)}/${h(x.pvMax??x.pvBase??'—')}</small></button>`).join('')||'<small class="muted">Adicione uma ameaça na seção Monstros ou use os quatro assassinos da campanha.</small>';}
  function startFromUI(){const ids=[...document.querySelectorAll('#v071CombatPanel input[type=checkbox]:checked')].map(x=>x.value);start(ids);}
  function publicSnapshot(){return {campanha:clone(data.campanha||{}),jogadores:clone(data.jogadores||[])};}
  function bumpPlayerRevision(playerId){const key=String(playerId||'');const next=Number(MP.playerRevisions.get(key)||0)+1;MP.playerRevisions.set(key,next);return next;}
  function playerSnapshot(playerId){const p=(data.jogadores||[]).find(x=>x.id===playerId);return {campanha:clone(data.campanha||{}),jogador:p?clone(p):null,revision:Number(MP.playerRevisions.get(String(playerId))||0),ownerId:playerId};}
  function send(conn,msg){try{if(!conn)return false;if(conn.open){conn.send(msg);return true;}if(typeof conn.once==='function'){const key='__hotelEspelhoSendQueue';conn[key]=conn[key]||[];conn[key].push(msg);if(!conn.__hotelEspelhoSendHook){conn.__hotelEspelhoSendHook=true;conn.once('open',()=>{const q=conn[key]||[];conn[key]=[];conn.__hotelEspelhoSendHook=false;q.forEach(m=>send(conn,m));});}return false;}return false}catch(e){console.warn(e);return false}}
  function broadcast(msg){MP.connections.forEach(c=>send(c,msg));}
  function broadcastCombatState(){if(MP.role!=='host')return;const c=ensureCampaign();broadcast({type:'combat-state',combate:clone(c)});}
  function broadcastSessionState(){if(MP.role!=='host')return;broadcast({type:'session-state',campanha:clone(data.campanha||{})});}

  function syncPlayerToPeer(peer){if(MP.role!=='host')return false;const conn=MP.connections.get(peer);const pid=MP.owners.get(peer);if(!conn||!pid)return false;bumpPlayerRevision(pid);return send(conn,{type:'player-state',...playerSnapshot(pid)});}
  function hostBroadcastPlayerStates(){if(MP.role!=='host')return;MP.connections.forEach((conn,peer)=>syncPlayerToPeer(peer));}
  function hostSyncAll(){if(MP.role!=='host')return;broadcastSessionState();hostBroadcastPlayerStates();}
  function applySessionSnapshot(msg){if(MP.role!=='player'||!msg)return;MP.applying=true;try{if(msg.campanha)data.campanha=clone(msg.campanha);if(typeof saveLocal==='function')saveLocal();if(typeof renderMaster==='function')renderMaster();if(typeof renderSheet==='function'&&selectedPlayer)renderSheet();renderMPUI();}finally{MP.applying=false;}}
  function applyPlayerSnapshot(msg){if(MP.role!=='player'||!msg)return;const incomingRev=Number(msg.revision||0);if(incomingRev<=Number(MP.localRevision||0)&&MP.localRevision>0)return;MP.localRevision=incomingRev;MP.applying=true;try{const p=msg.jogador;if(p){data.jogadores=[clone(p)];MP.ownerId=p.id;selectedPlayer=data.jogadores[0];}if(msg.campanha)data.campanha=clone(msg.campanha);if(typeof saveLocal==='function')saveLocal();renderPlayerCards();if(selectedPlayer){renderSheet();setTimeout(()=>{if(MP.role==='player'&&selectedPlayer)renderSheet();},0);}renderMPUI();}finally{MP.applying=false;}}
  function hostReceive(conn,msg){
    if(!msg)return;
    if(msg.type==='hello'){send(conn,{type:'welcome',ownerId:null,players:publicSnapshot().jogadores,room:MP.roomCode,campanha:clone(data.campanha||{})});return;}
    if(msg.type==='sync-request'){const pid=MP.owners.get(conn.peer);if(pid){bumpPlayerRevision(pid);send(conn,{type:'player-state',...playerSnapshot(pid),ownerId:pid});}else{send(conn,{type:'welcome',ownerId:null,players:publicSnapshot().jogadores,room:MP.roomCode,campanha:clone(data.campanha||{})});}return;}
    if(msg.type==='claim'){const p=data.jogadores.find(x=>x.id===msg.playerId);if(!p)return;MP.connections.set(conn.peer,conn);MP.owners.set(conn.peer,p.id);if(!MP.playerRevisions.has(String(p.id)))MP.playerRevisions.set(String(p.id),0);bumpPlayerRevision(p.id);send(conn,{type:'player-state',...playerSnapshot(p.id)});return;}
    if(msg.type==='player-deleted'&&msg.playerId){
      const deletedId=String(msg.playerId);
      if(MP.owners.get(conn.peer)===deletedId){MP.owners.delete(conn.peer);send(conn,{type:'player-deleted',playerId:deletedId});}
      broadcastRoster();
      return;
    }
    if(msg.type==='player-upsert'&&msg.player){
      const incoming=msg.player;
      const existing=data.jogadores.find(x=>x.id===incoming.id);
      if(existing)Object.assign(existing,clone(incoming));else data.jogadores.push(clone(incoming));
      // O primeiro envio de uma ficha criada no celular também estabelece
      // a propriedade da conexão. A partir daqui as atualizações dessa
      // ficha podem ser roteadas automaticamente para o mesmo jogador.
      MP.owners.set(conn.peer,incoming.id);
      bumpPlayerRevision(incoming.id);
      logCombat(`${incoming.nome}: ficha sincronizada.`);
      persist();
      send(conn,{type:'player-state',...playerSnapshot(incoming.id),ownerId:incoming.id});
      broadcastRoster();
      renderMaster();
      renderPlayerCards();
      return;
    }
    if(msg.type==='player-request-create'){const base=typeof buildNewPlayer==='function'?buildNewPlayer(String(msg.name||'Jogador'),String(msg.origem||'Atleta')):null;if(!base)return;applyOriginProfile?.(base);data.jogadores.push(base);persist();MP.owners.set(conn.peer,base.id);const target=conn;send(target,{type:'created',...playerSnapshot(base.id),ownerId:base.id});broadcastRoster();renderMaster();renderPlayerCards();}
  }
  function broadcastRoster(){broadcast({type:'roster',players:clone(data.jogadores||[]),room:MP.roomCode});}
  function inviteUrl(){const base=window.location.href.split('#')[0].split('?')[0];return `${base}?convite=${encodeURIComponent(MP.hostPeerId||`hotel-espelho-${String(MP.roomCode||'').toLowerCase()}`)}`;}
  async function copyInvite(){const url=inviteUrl();try{await navigator.clipboard.writeText(url);toast('Link de convite copiado.');}catch(e){window.prompt('Copie o link de convite:',url);}return url;}
  const PEER_OPTIONS={host:'0.peerjs.com',port:443,path:'/',secure:true,debug:1,config:{iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]}};
  function newPeer(id){try{return id?new Peer(id,PEER_OPTIONS):new Peer(PEER_OPTIONS)}catch(e){console.warn(e);return null}}
  function setupPeerHost(){
    if(window.HOTEL_USE_SUPABASE!==false)return;
    if(!window.Peer)return toast('Canal multiplayer indisponível: biblioteca PeerJS não carregou.');
    if(MP.peer&&!MP.peer.destroyed){try{MP.peer.destroy()}catch(e){}}
    MP.role='host';MP.roomCode=shortCode();MP.playerRevisions=new Map((data.jogadores||[]).map(p=>[String(p.id),1]));
    MP.peer=newPeer();
    if(!MP.peer)return toast('Não foi possível iniciar o servidor da mesa.');
    MP.peer.on('open',id=>{MP.connected=true;MP.hostPeerId=id;renderMPUI();toast('Mesa pronta. Gere o link de convite.');});
    MP.peer.on('connection',conn=>{
      MP.connections.set(conn.peer,conn);
      const hello=()=>send(conn,{type:'hello',room:MP.roomCode,players:clone(data.jogadores||[]),campanha:clone(data.campanha||{})});
      conn.on('open',hello);
      conn.on('data',msg=>hostReceive(conn,msg));
      conn.on('error',e=>{console.warn('PeerJS data connection error',e);toast(`Falha na conexão do jogador (${e?.type||'webrtc'}).`);});
      conn.on('close',()=>{MP.connections.delete(conn.peer);MP.owners.delete(conn.peer);renderMPUI();});
    });
    MP.peer.on('disconnected',()=>{MP.connected=false;renderMPUI();try{MP.peer.reconnect()}catch(e){}});
    MP.peer.on('error',e=>{console.warn('PeerJS host error',e);toast(`Falha no canal multiplayer (${e?.type||'erro'}).`);});
    renderMPUI();
  }
  function connectPlayer(code){
    if(window.HOTEL_USE_SUPABASE!==false)return;
    if(!window.Peer)return toast('Canal multiplayer indisponível: biblioteca PeerJS não carregou.');
    const raw=String(code||'').trim();
    const targetId=raw;
    if(targetId.length<4)return toast('Convite inválido.');
    const clean=targetId.replace(/^hotel-espelho-/i,'').toUpperCase();
    if(MP.peer&&!MP.peer.destroyed){try{MP.peer.destroy()}catch(e){}}
    MP.role='player';MP.roomCode=clean;MP.connected=false;MP.ownerId=null;MP.localRevision=0;
    MP.peer=newPeer();
    if(!MP.peer)return toast('Não foi possível iniciar a conexão com a mesa.');
    let settled=false;
    const failTimer=setTimeout(()=>{if(!settled){console.warn('PeerJS player connection timeout');toast('Tempo esgotado para conectar ao Mestre. Abra novamente o link com o Mestre mantendo a página dele aberta.');}},15000);
    MP.peer.on('open',()=>{
      const hostId=targetId;
      const conn=MP.peer.connect(hostId,{reliable:true,serialization:'json',metadata:{room:clean}});
      MP.hostPeerId=hostId;
      conn.on('open',()=>{settled=true;clearTimeout(failTimer);MP.connected=true;MP.connections.set(conn.peer,conn);send(conn,{type:'hello'});setTimeout(()=>send(conn,{type:'sync-request'}),500);renderMPUI();toast('Conectado à mesa.');});
      conn.on('data',msg=>{if(msg.type==='welcome'){MP.ownerId=null;if(msg.campanha){MP.applying=true;try{data.campanha=clone(msg.campanha);if(typeof saveLocal==='function')saveLocal();}finally{MP.applying=false;}}renderPlayerChooser(msg.players||[]);renderMPUI();}if(msg.type==='session-state')applySessionSnapshot(msg);if(msg.type==='roster'&&!MP.ownerId){renderPlayerChooser(msg.players||[]);}if(msg.type==='player-deleted'){MP.applying=true;try{data.jogadores=[];selectedPlayer=null;if(typeof saveLocal==='function')saveLocal();renderPlayerCards();renderMPUI();toast('Sua ficha foi removida pelo Mestre.');}finally{MP.applying=false;}}if(msg.type==='combat-state'&&msg.combate){MP.applying=true;try{data.campanha=data.campanha||{};data.campanha.combateV071=clone(msg.combate);if(typeof saveLocal==='function')saveLocal();if(typeof renderCombatPanel==='function')renderCombatPanel();}finally{MP.applying=false;}}if(msg.type==='player-state'||msg.type==='created')applyPlayerSnapshot(msg);});
      conn.on('error',e=>{settled=true;clearTimeout(failTimer);console.warn('PeerJS player connection error',e);toast(`Não foi possível conectar ao Mestre (${e?.type||'webrtc'}).`);});
      conn.on('close',()=>{MP.connected=false;renderMPUI();toast('Conexão com o Mestre encerrada.');});
    });
    MP.peer.on('disconnected',()=>{try{MP.peer.reconnect()}catch(e){}});
    MP.peer.on('error',e=>{console.warn('PeerJS player error',e);if(e?.type==='peer-unavailable')toast('Mesa não encontrada. O Mestre precisa manter a página aberta.');else toast(`Não foi possível entrar na sala (${e?.type||'erro'}).`);});
    renderMPUI();
  }
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&MP.role==='player'&&MP.connected){const conn=MP.connections.values().next().value;if(conn)send(conn,{type:'sync-request'});}});
  window.addEventListener('focus',()=>{if(MP.role==='player'&&MP.connected){const conn=MP.connections.values().next().value;if(conn)send(conn,{type:'sync-request'});}});
  setInterval(()=>{if(MP.role==='host'&&MP.connected)hostSyncAll();},3000);
  function deletePlayer(id){if(MP.role!=='host')return false;const sid=String(id);MP.connections.forEach((conn,peer)=>{if(String(MP.owners.get(peer))===sid)send(conn,{type:'player-deleted',playerId:sid});});return true;}
  function claimPlayer(id){const conn=MP.connections.values().next().value;if(!conn)return;MP.ownerId=id;send(conn,{type:'claim',playerId:id});}
  function requestCreate(){const name=prompt('Nome do personagem:');if(!name)return;const origem=prompt('Profissão / Origem (ex.: Atleta):','Atleta');if(!ORIGIN_PROFILES[origem])return toast('Origem inválida. Use uma das origens oficiais da criação de personagem.');const conn=MP.connections.values().next().value;if(!conn)return;send(conn,{type:'player-request-create',name,origem});}
  function sendOwnState(){if(MP.role!=='player'||MP.applying||!MP.connected||!MP.ownerId)return;const conn=MP.connections.values().next().value;const p=data.jogadores.find(x=>x.id===MP.ownerId);if(conn&&p)send(conn,{type:'player-upsert',player:clone(p)});}
  function publishCreatedPlayer(player){
    if(MP.role!=='player'||!MP.connected||!player)return false;
    const conn=MP.connections.values().next().value;
    if(!conn)return false;
    MP.ownerId=player.id;
    send(conn,{type:'player-upsert',player:clone(player),created:true});
    renderMPUI();
    return true;
  }
  function renderPlayerChooser(players){const host=$id('mpPlayerChooser');if(!host)return;host.innerHTML=`<div class="v071-chooser"><b>Escolha sua ficha</b><div>${players.map(p=>`<button class="v071-player-choice" onclick="MultiplayerV071.claim('${h(p.id)}')"><span>${h(p.nome)}</span><small>${h(p.classe||'Classe não definida')} • NEX ${h(p.nex)}</small></button>`).join('')||'<small class="muted">Nenhuma ficha disponível.</small>'}</div><button class="ghost small" onclick="MultiplayerV071.requestCreate()">＋ CRIAR MINHA FICHA</button></div>`;}
  function renderMPUI(){
    const host=$id('v071MultiplayerPanel');if(!host)return;const state=MP.role==='host'?`MESTRE • ${MP.connected?'ONLINE':'ABRINDO'}`:MP.role==='player'?`JOGADOR • ${MP.connected?'ONLINE':'CONECTANDO'}`:'OFFLINE';
    const hostArea=MP.role==='host'?`<div><b>Link de convite</b><div class="v071-invite-url">${h(inviteUrl())}</div><small>Envie este link. O jogador abre e entra automaticamente, sem digitar código.</small><div class="v071-actions"><button class="primary" onclick="MultiplayerV071.copyInvite()">🔗 COPIAR LINK</button><button class="ghost small" onclick="MultiplayerV071.stop()">ENCERRAR MESA</button></div></div><div><b>Jogadores conectados</b><strong class="v071-connected-count">${MP.connections.size}</strong><small>O Mestre deve manter esta página aberta durante a sessão para sincronizar as fichas.</small></div>`:`<div><b>Modo jogador</b><small>O link de convite abre esta página e conecta automaticamente à mesa. Não é necessário informar código.</small><button class="primary" onclick="MultiplayerV071.host()">＋ CRIAR MESA (MESTRE)</button></div><div><button class="ghost" onclick="MultiplayerV071.local()">USAR FICHA SEM SINCRONIZAÇÃO</button></div>`;
    host.innerHTML=`<div class="panel-title"><div><span class="icon">◉</span><div><h2>Sala da Mesa</h2><p>Fichas digitais sincronizadas para ninguém precisar anotar PV, PE ou SAN no papel.</p></div></div><span class="sync-badge">${h(state)}</span></div><div class="v071-mp-grid">${hostArea}</div>`;
    if(MP.role==='player'&&MP.connected)renderPlayerChooser(data.jogadores||[]);
  }
  function renderPlayerTracker(){
    const host=$id('v071PlayerTracker');if(!host||!data||!selectedPlayer)return;
    const p=selectedPlayer; const status=MP.role==='player'?(MP.connected?'Conectado à mesa':'Desconectado'):MP.role==='host'?'Controlado pelo Mestre':'Modo local';
    host.innerHTML=`<div class="panel-title"><div><span class="icon">♥</span><div><h2>Recursos da ficha</h2><p>${h(status)} • mantenha PV, PE e SAN atualizados sem papel.</p></div></div></div><div class="v071-resource-editor">${[['pv','PV'],['pe','PE'],['san','SAN']].map(([k,l])=>`<label>${l}<div><input type="number" min="0" max="${Number(p[k+'Max'])||999}" value="${Number(p[k])||0}" onchange="MultiplayerV071.resource('${h(p.id)}','${k}',this.value)"><span>/ ${Number(p[k+'Max'])||0}</span></div></label>`).join('')}</div>`;
  }
  function resource(pid,key,value){const p=data.jogadores.find(x=>x.id===pid);if(!p)return;const max=Number(p[key+'Max'])||0;p[key]=Math.max(0,Math.min(max,Number(value)||0));persist();selectedPlayer=p;renderSheet();}
  function mountMP(){
    const master=$id('masterScreen');
    const system=$id('masterSystemTools')||master;
    if(master&&!$id('v071MultiplayerPanel')){const p=document.createElement('section');p.id='v071MultiplayerPanel';p.className='panel v071-multiplayer-panel';system?.appendChild(p);}
    if(!$id('v071PlayerMP')&&$id('playerHome')){const p=document.createElement('section');p.id='v071PlayerMP';p.className='panel v071-player-mp';$id('playerHome').prepend(p);}
    const ph=$id('v071PlayerMP');
    if(ph)ph.innerHTML=`<div class="panel-title"><div><span class="icon">◉</span><div><h2>Ficha do Jogador</h2><p>Seu link de convite já identifica a mesa. Você não precisa digitar código.</p></div></div></div><div id="v071PlayerStatus" class="muted">${new URLSearchParams(location.search).has('convite')?'Conectando automaticamente à mesa…':'Modo ficha local. Use o link enviado pelo Mestre para sincronizar.'}</div><div id="mpPlayerChooser"></div>`;
    renderMPUI();
    const invite=new URLSearchParams(location.search).get('convite');
    if(invite&&MP.role==='offline'&&!MP.connected){setTimeout(()=>connectPlayer(invite),250);}
  }
  function local(){if(MP.peer){try{MP.peer.destroy()}catch(e){}}MP.role='offline';MP.connected=false;MP.connections.clear();MP.owners.clear();MP.ownerId=null;MP.playerRevisions.clear();MP.localRevision=0;renderMPUI();toast('Modo local ativo.');}
  function stop(){if(MP.peer){try{MP.peer.destroy()}catch(e){}}MP.role='offline';MP.connected=false;MP.connections.clear();MP.owners.clear();MP.roomCode=null;MP.ownerId=null;MP.playerRevisions.clear();MP.localRevision=0;renderMPUI();toast('Sala encerrada.');}
  const oldSave=window.saveLocal;
  let syncTimer=null;
  if(typeof oldSave==='function'&&!oldSave.__v071mp){const wrapped=function(){const r=oldSave.apply(this,arguments);if(!MP.applying){clearTimeout(syncTimer);syncTimer=setTimeout(()=>{if(MP.role==='player')sendOwnState();if(MP.role==='host')hostSyncAll();},40);}return r};wrapped.__v071mp=true;window.saveLocal=wrapped;}
  const oldRenderMaster=window.renderMaster;window.renderMaster=function(){if(typeof oldRenderMaster==='function')oldRenderMaster.apply(this,arguments);if(document.getElementById('v071CombatPanel'))renderCombatPanel();renderThreatButtons();renderMPUI();};
  const oldRenderSheet=window.renderSheet;window.renderSheet=function(){if(typeof oldRenderSheet==='function')oldRenderSheet.apply(this,arguments);renderPlayerTracker();};
  const oldRenderCards=window.renderPlayerCards;window.renderPlayerCards=function(){if(typeof oldRenderCards==='function')oldRenderCards.apply(this,arguments);if(MP.role==='player'&&MP.ownerId){const cards=$id('playerCards');if(cards)cards.innerHTML=data.jogadores.filter(p=>p.id===MP.ownerId).map(p=>`<button class="player-card" data-id="${h(p.id)}"><div class="avatar">${h(p.nome.split(' ').map(x=>x[0]).slice(0,2).join(''))}</div><div><b>${h(p.nome)}</b><small>${h(p.classe||'Classe não definida')} • NEX ${h(p.nex)}</small></div><span>→</span></button>`).join('');cards?.querySelector('.player-card')?.addEventListener('click',()=>openSheet(MP.ownerId));}};
  const boot=()=>{if(!data)return setTimeout(boot,100);mountMP();mount();};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.CombatV071={start,startFromUI,stop,next,prev,setHP,damage,heal,detail,rollAttack:(id,i)=>rollAttack(id,i),rollDamage:(id,i)=>rollDamageFor(id,i)};
  window.MultiplayerV071={host:setupPeerHost,connect:connectPlayer,copyInvite,claim:claimPlayer,requestCreate,publishCreatedPlayer,resource,deletePlayer,local,stop,broadcastCombat:broadcastCombatState,sync:hostSyncAll,syncPlayer:(pid)=>{if(MP.role!=='host')return false;let ok=false;MP.connections.forEach((conn,peer)=>{if(String(MP.owners.get(peer))===String(pid))ok=syncPlayerToPeer(peer)||ok});return ok},status:()=>({role:MP.role,room:MP.roomCode,connected:MP.connected,players:MP.connections.size})};
})();


/* --- 61-v087-combat-sync.js --- */
/* V0.87 — Sincronização explícita do estado de combate Mestre ↔ Jogadores. */
(function(){
  'use strict';
  const clone=o=>JSON.parse(JSON.stringify(o));
  function combatSnapshot(){const c=data?.campanha?.combateV071;return c?clone(c):null;}
  function broadcast(){if(window.MultiplayerV071?.broadcastCombat)window.MultiplayerV071.broadcastCombat();}
  function wrap(name){const fn=window.CombatV071?.[name];if(typeof fn!=='function'||fn.__v087)return;const w=function(){const r=fn.apply(this,arguments);setTimeout(broadcast,0);return r};w.__v087=true;window.CombatV071[name]=w;}
  function boot(){if(!data||!window.CombatV071||!window.MultiplayerV071)return setTimeout(boot,100);['start','stop','next','prev','setHP','damage','heal'].forEach(wrap);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.CombatSyncV087={snapshot:combatSnapshot,broadcast};
})();


}
