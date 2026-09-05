/* V0.71 — Central de Combate + ficha de mesa multiplayer (presencial). */
(function(){
  'use strict';
  const MP={version:1,role:'offline',peer:null,hostPeerId:null,roomCode:null,connections:new Map(),owners:new Map(),ownerId:null,connected:false,applying:false};
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
  function playerSnapshot(playerId){const p=(data.jogadores||[]).find(x=>x.id===playerId);return {campanha:clone(data.campanha||{}),jogador:p?clone(p):null};}
  function send(conn,msg){try{if(conn?.open)conn.send(msg)}catch(e){console.warn(e)}}
  function broadcast(msg){MP.connections.forEach(c=>send(c,msg));}
  function hostBroadcastPlayerStates(){if(MP.role!=='host')return;MP.connections.forEach((conn,peer)=>{const pid=MP.owners.get(peer);if(pid)send(conn,{type:'player-state',...playerSnapshot(pid)});});}
  function applyPlayerSnapshot(msg){if(MP.role!=='player'||!msg)return;MP.applying=true;try{const p=msg.jogador;if(p){data.jogadores=[clone(p)];MP.ownerId=p.id;selectedPlayer=data.jogadores[0];}if(msg.campanha)data.campanha=clone(msg.campanha);localStorage.setItem('op-fichas-state',JSON.stringify(data));renderPlayerCards();if(selectedPlayer)renderSheet();renderMPUI();}finally{MP.applying=false;}}
  function hostReceive(conn,msg){
    if(!msg)return;
    if(msg.type==='hello'){send(conn,{type:'welcome',ownerId:null,players:publicSnapshot().jogadores,room:MP.roomCode});return;}
    if(msg.type==='claim'){const p=data.jogadores.find(x=>x.id===msg.playerId);if(!p)return;MP.connections.set(conn.peer,conn);MP.owners.set(conn.peer,p.id);send(conn,{type:'player-state',...playerSnapshot(p.id)});return;}
    if(msg.type==='player-upsert'&&msg.player){const incoming=msg.player;const existing=data.jogadores.find(x=>x.id===incoming.id);if(existing)Object.assign(existing,clone(incoming));else data.jogadores.push(clone(incoming));logCombat(`${incoming.nome}: ficha sincronizada.`);persist();send(conn,{type:'player-state',...playerSnapshot(incoming.id)});broadcastRoster();renderMaster();renderPlayerCards();return;}
    if(msg.type==='player-request-create'){const base=typeof buildNewPlayer==='function'?buildNewPlayer(String(msg.name||'Jogador'),String(msg.origem||'Atleta')):null;if(!base)return;applyOriginProfile?.(base);data.jogadores.push(base);persist();MP.owners.set(conn.peer,base.id);const target=conn;send(target,{type:'created',...playerSnapshot(base.id),ownerId:base.id});broadcastRoster();renderMaster();renderPlayerCards();}
  }
  function broadcastRoster(){broadcast({type:'roster',players:clone(data.jogadores||[]),room:MP.roomCode});}
  function buildPlayerLink(){
    if(!MP.hostPeerId)return '';
    const url=new URL(window.location.href);
    url.search=''; url.hash='';
    url.searchParams.set('mesa',MP.hostPeerId);
    return url.toString();
  }
  function copyPlayerLink(){
    const link=buildPlayerLink();
    if(!link)return toast('Primeiro clique em CRIAR LINK DOS JOGADORES.');
    if(navigator.clipboard?.writeText){navigator.clipboard.writeText(link).then(()=>toast('Link dos jogadores copiado.')).catch(()=>window.prompt('Copie o link dos jogadores:',link));}
    else window.prompt('Copie o link dos jogadores:',link);
  }
  function claimPlayer(id){
    const conn=MP.connections.values().next().value;
    if(!conn)return toast('A conexão com o Mestre ainda não está pronta.');
    MP.ownerId=id; send(conn,{type:'claim',playerId:id});
  }
  function requestCreate(){
    if(MP.role!=='player'||!MP.connected)return toast('Aguarde a conexão automática com o Mestre.');
    if(typeof openCreateSheetModal==='function'){
      openCreateSheetModal();
      const title=document.querySelector('#createSheetModal h2');
      const note=document.querySelector('#createSheetModal .create-sheet-note small');
      if(title)title.textContent='Criar minha ficha';
      if(note)note.textContent='A ficha será criada neste dispositivo e enviada automaticamente ao Mestre. PV, PE, SAN e demais recursos ficarão sincronizados durante a sessão.';
      const modal=$id('createSheetModal'); if(modal)modal.dataset.multiplayerCreate='true';
    }
  }
  function sendOwnState(){
    if(MP.role!=='player'||MP.applying||!MP.connected||!MP.ownerId)return;
    const conn=MP.connections.values().next().value;
    const p=data.jogadores.find(x=>x.id===MP.ownerId);
    if(conn&&p)send(conn,{type:'player-upsert',player:clone(p)});
  }
  function renderPlayerChooser(players){
    const host=$id('mpPlayerChooser');if(!host)return;
    host.innerHTML=`<div class="v071-chooser"><b>Sua ficha</b><small>Escolha uma ficha existente ou crie a sua. Depois disso, suas alterações ficam sincronizadas com o Mestre.</small><div>${players.map(p=>`<button class="v071-player-choice" onclick="MultiplayerV071.claim('${h(p.id)}')"><span>${h(p.nome)}</span><small>${h(p.classe||'Classe não definida')} • NEX ${h(p.nex)}</small></button>`).join('')||'<small class="muted">Nenhuma ficha disponível.</small>'}</div><button class="ghost small" onclick="MultiplayerV071.requestCreate()">＋ CRIAR MINHA FICHA</button></div>`;
  }
  function renderMPUI(){
    const host=$id('v071MultiplayerPanel');if(!host)return;
    const state=MP.role==='host'?`MESTRE • ${MP.connected?'ONLINE':'ABRINDO'}`:MP.role==='player'?`JOGADOR • ${MP.connected?'ONLINE':'CONECTANDO'}`:'OFFLINE';
    const link=buildPlayerLink();
    const hostArea=MP.role==='host'
      ?`<div><b>Link dos jogadores</b><input class="control-input" readonly value="${h(link||'Gerando link...')}" onclick="this.select()"><small>Envie este link diretamente pelo WhatsApp, Discord ou onde preferir. O jogador não precisa digitar código nem entrar em uma sala manualmente.</small><div class="v071-link-actions"><button class="primary" onclick="MultiplayerV071.copyLink()">⧉ COPIAR LINK</button><button class="ghost small" onclick="MultiplayerV071.newLink()">↻ NOVO LINK</button></div></div><div><b>Jogadores conectados</b><strong class="v071-connected-count">${MP.connections.size}</strong><small>As fichas ficam sincronizadas enquanto o Mestre estiver com a mesa aberta.</small><button class="ghost small" onclick="MultiplayerV071.stop()">ENCERRAR MESA</button></div>`
      :`<div><b>Modo jogador</b><small>O link enviado pelo Mestre conecta automaticamente este dispositivo. Não é necessário informar código de sala.</small>${MP.role==='player'?`<button class="ghost" onclick="MultiplayerV071.local()">USAR SOMENTE NESTE DISPOSITIVO</button>`:''}</div>`;
    host.innerHTML=`<div class="panel-title"><div><span class="icon">◉</span><div><h2>Fichas da Mesa</h2><p>Compartilhamento por link • sem código de sala • sem anotações em papel.</p></div></div><span class="sync-badge">${h(state)}</span></div><div class="v071-mp-grid">${hostArea}</div>`;
    const ps=$id('v071PlayerStatus'); if(ps) ps.textContent=MP.role==='player'?(MP.connected?'Conectado ao Mestre. Escolha ou crie sua ficha.':'Conectando ao Mestre...'):'Nenhum link de mesa ativo neste dispositivo.';
    if(MP.role==='player'&&MP.connected&&!MP.ownerId)renderPlayerChooser(data.jogadores||[]);
  }
  function renderPlayerTracker(){
    const host=$id('v071PlayerTracker');if(!host||!data||!selectedPlayer)return;
    const p=selectedPlayer; const status=MP.role==='player'?(MP.connected?'Ficha sincronizada com o Mestre':'Conexão interrompida'):MP.role==='host'?'Controlado pelo Mestre':'Somente neste dispositivo';
    host.innerHTML=`<div class="panel-title"><div><span class="icon">♥</span><div><h2>Recursos da ficha</h2><p>${h(status)} • mantenha PV, PE e SAN atualizados sem papel.</p></div></div></div><div class="v071-resource-editor">${[['pv','PV'],['pe','PE'],['san','SAN']].map(([k,l])=>`<label>${l}<div><input type="number" min="0" max="${Number(p[k+'Max'])||999}" value="${Number(p[k])||0}" onchange="MultiplayerV071.resource('${h(p.id)}','${k}',this.value)"><span>/ ${Number(p[k+'Max'])||0}</span></div></label>`).join('')}</div>`;
  }
  function mountMP(){
    if(!$id('v071MultiplayerPanel')){const p=document.createElement('section');p.id='v071MultiplayerPanel';p.className='panel v071-multiplayer-panel';$id('masterScreen')?.prepend(p);}
    if(!$id('v071PlayerMP')){const p=document.createElement('section');p.id='v071PlayerMP';p.className='panel v071-player-mp';$id('playerHome')?.prepend(p);}
    const ph=$id('v071PlayerMP');
    if(ph)ph.innerHTML=`<div class="panel-title"><div><span class="icon">◉</span><div><h2>Ficha do jogador</h2><p>Se você recebeu um link do Mestre, a conexão é automática. Sem códigos de sala.</p></div></div></div><div id="v071PlayerStatus" class="muted">${MP.role==='player'?(MP.connected?'Conectado ao Mestre.':'Conectando ao Mestre...'):'Nenhum link de mesa ativo neste dispositivo.'}</div><div id="mpPlayerChooser"></div>`;
    renderMPUI();
  }
  function local(){if(MP.peer){try{MP.peer.destroy()}catch(e){}}MP.role='offline';MP.connected=false;MP.connections.clear();MP.owners.clear();MP.ownerId=null;renderMPUI();toast('Modo somente neste dispositivo.');}
  function stop(){if(MP.peer){try{MP.peer.destroy()}catch(e){}}MP.role='offline';MP.connected=false;MP.connections.clear();MP.owners.clear();MP.roomCode=null;MP.hostPeerId=null;MP.ownerId=null;renderMPUI();toast('Mesa encerrada.');}
  function setupPeerHost(){
    if(!window.Peer)return toast('Multiplayer requer internet para a conexão entre os dispositivos.');
    if(MP.peer)return renderMPUI();
    MP.role='host'; MP.roomCode=null;
    const id=`hotel-espelho-${shortCode().toLowerCase()}`;
    MP.peer=new Peer(id);
    MP.peer.on('open',()=>{MP.connected=true;MP.hostPeerId=id;renderMPUI();toast('Link dos jogadores criado.');});
    MP.peer.on('connection',conn=>{MP.connections.set(conn.peer,conn);conn.on('open',()=>send(conn,{type:'hello',players:clone(data.jogadores||[])}));conn.on('data',msg=>hostReceive(conn,msg));conn.on('close',()=>{MP.connections.delete(conn.peer);MP.owners.delete(conn.peer);renderMPUI();});});
    MP.peer.on('error',e=>{console.warn(e);MP.connected=false;renderMPUI();toast('Falha ao criar a conexão. Gere um novo link.');});
    renderMPUI();
  }
  function newLink(){
    if(MP.peer){try{MP.peer.destroy()}catch(e){}}
    MP.peer=null;MP.connected=false;MP.hostPeerId=null;setupPeerHost();
  }
  function connectPlayer(hostId){
    if(!window.Peer)return toast('Este modo requer internet para conectar ao Mestre.');
    const clean=String(hostId||'').trim();
    if(!clean)return toast('Link de mesa inválido.');
    if(MP.connected&&MP.hostPeerId===clean)return;
    if(MP.peer){try{MP.peer.destroy()}catch(e){}}
    MP.role='player';MP.hostPeerId=clean;MP.peer=new Peer();renderMPUI();
    MP.peer.on('open',()=>{
      const conn=MP.peer.connect(clean,{reliable:true});MP.connections.set(clean,conn);
      conn.on('open',()=>{MP.connected=true;send(conn,{type:'hello'});renderMPUI();toast('Ficha conectada ao Mestre.');});
      conn.on('data',msg=>{if(msg.type==='welcome'){renderPlayerChooser(msg.players||[]);}if(msg.type==='roster'&&!MP.ownerId){renderPlayerChooser(msg.players||[]);}if(msg.type==='player-state'||msg.type==='created')applyPlayerSnapshot(msg);});
      conn.on('close',()=>{MP.connected=false;renderMPUI();toast('Conexão com o Mestre encerrada.');});
    });
    MP.peer.on('error',e=>{console.warn(e);MP.connected=false;renderMPUI();toast('Não foi possível conectar ao Mestre. Abra novamente o link quando a mesa estiver online.');});
  }
  function autoConnectFromLink(){
    try{const host=new URLSearchParams(window.location.search).get('mesa');if(host)connectPlayer(host);}catch(e){console.warn(e)}
  }
  const oldCreatePlayerSheet=window.createPlayerSheet;
  if(typeof oldCreatePlayerSheet==='function'&&!oldCreatePlayerSheet.__v071link){
    const wrappedCreate=function(){
      const before=new Set((data.jogadores||[]).map(x=>String(x.id)));
      const r=oldCreatePlayerSheet.apply(this,arguments);
      if(MP.role==='player'&&MP.connected){
        const created=(data.jogadores||[]).find(x=>!before.has(String(x.id)));
        if(created){MP.ownerId=created.id;setTimeout(()=>sendOwnState(),0);toast('Sua ficha foi enviada ao Mestre.');}
      }
      return r;
    };
    wrappedCreate.__v071link=true;window.createPlayerSheet=wrappedCreate;
  }
  const oldSave=window.saveLocal;
  if(typeof oldSave==='function'&&!oldSave.__v071mp){const wrapped=function(){const r=oldSave.apply(this,arguments);if(!MP.applying)setTimeout(()=>{sendOwnState();hostBroadcastPlayerStates();},0);return r};wrapped.__v071mp=true;window.saveLocal=wrapped;}
  const oldRenderMaster=window.renderMaster;window.renderMaster=function(){if(typeof oldRenderMaster==='function')oldRenderMaster.apply(this,arguments);if(document.getElementById('v071CombatPanel'))renderCombatPanel();renderThreatButtons();renderMPUI();};
  const oldRenderSheet=window.renderSheet;window.renderSheet=function(){if(typeof oldRenderSheet==='function')oldRenderSheet.apply(this,arguments);renderPlayerTracker();};
  const oldRenderCards=window.renderPlayerCards;window.renderPlayerCards=function(){if(typeof oldRenderCards==='function')oldRenderCards.apply(this,arguments);if(MP.role==='player'&&MP.ownerId){const cards=$id('playerCards');if(cards)cards.innerHTML=data.jogadores.filter(p=>p.id===MP.ownerId).map(p=>`<button class="player-card" data-id="${h(p.id)}"><div class="avatar">${h(p.nome.split(' ').map(x=>x[0]).slice(0,2).join(''))}</div><div><b>${h(p.nome)}</b><small>${h(p.classe||'Classe não definida')} • NEX ${h(p.nex)}</small></div><span>→</span></button>`).join('');cards?.querySelector('.player-card')?.addEventListener('click',()=>openSheet(MP.ownerId));}};
  const boot=()=>{if(!data)return setTimeout(boot,100);mountMP();mount();autoConnectFromLink();};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.CombatV071={start,startFromUI,stop,next,prev,setHP,damage,heal,detail,rollAttack:(id,i)=>rollAttack(id,i),rollDamage:(id,i)=>rollDamageFor(id,i)};
  window.MultiplayerV071={host:setupPeerHost,connect:connectPlayer,claim:claimPlayer,requestCreate,resource,local,stop,copyLink:copyPlayerLink,newLink,status:()=>({role:MP.role,hostPeerId:MP.hostPeerId,connected:MP.connected,players:MP.connections.size})};
})();
