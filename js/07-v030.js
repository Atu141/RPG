/* V0.30 — Camada integrada de mapa, exploração, movimento, eventos, combate, condições e visão do jogador. */
const V030={
  floors:[1,2,3,4,5,6,7,8,9],
  doors:{},
  ensure(){
    const c=data.campanha;
    c.v030=c.v030||{};
    const v=c.v030;
    v.portas=v.portas||{}; v.posicoesJogadores=v.posicoesJogadores||{}; v.reveladas=v.reveladas||{};
    v.eventosSalas=v.eventosSalas||{}; v.condicoes=v.condicoes||{}; v.combate=v.combate||{ativo:false,turno:null,iniciativa:[],alvos:{}};
    data.jogadores.forEach((p,i)=>{if(!v.posicoesJogadores[p.id])v.posicoesJogadores[p.id]={andar:5,sala:`50${i+1}`}; if(!v.condicoes[p.id])v.condicoes[p.id]=[];});
    this.buildDoors();
  },
  buildDoors(){
    const v=data.campanha.v030;
    for(let f=1;f<=9;f++){
      const rooms=getFloorRooms(f)||[];
      rooms.forEach((r,i)=>{const a=String(r.codigo||r.id||r.nome||'').replace(/\D/g,''); if(!a)return; const b=rooms[i+1]; if(b){const bb=String(b.codigo||b.id||b.nome||'').replace(/\D/g,''); if(bb){const key=`${a}-${bb}`; if(!v.portas[key])v.portas[key]={estado:'aberta',requerChave:null};}}});
      if(f>1){const key=`escada-${f}-${f-1}`;if(!v.portas[key])v.portas[key]={estado:'aberta',requerChave:null};}
      if(f<9){const key=`escada-${f}-${f+1}`;if(!v.portas[key])v.portas[key]={estado:'aberta',requerChave:null};}
    }
    ['hall-terreo','terraco-9'].forEach(k=>{if(!v.portas[k])v.portas[k]={estado:'trancada',requerChave:null};});
  },
  roomCode(r){const raw=String(r?.codigo||r?.id||r?.nome||r||'').trim();const digits=raw.replace(/\D/g,'');return digits||raw.replace(/^Quarto\s+/i,'').replace(/\s+/g,'-').toLowerCase();},
  rooms(f){return getFloorRooms(f)||[];},
  room(f,code){return this.rooms(f).find(r=>this.roomCode(r)===String(code))},
  position(pid){return data.campanha.v030.posicoesJogadores[pid]||{andar:5,sala:'501'}},
  save(){saveLocal();},
  movePlayer(pid){
    const p=data.jogadores.find(x=>x.id===pid); if(!p)return;
    const pos=this.position(pid); const floor=prompt('Novo andar (1–9):',pos.andar); if(floor===null)return; const f=Number(floor); if(!this.floors.includes(f))return toast('Andar inválido.');
    if(f===5 && pos.andar!==5){} // 5º é acessível apenas como ponto protegido; não recebe assassinos.
    const rooms=this.rooms(f); const choices=rooms.map(r=>this.roomCode(r)).filter(Boolean); const room=prompt(`Sala/localização em ${f}º andar.\nOpções: ${choices.join(', ')}`,choices[0]||''); if(room===null)return;
    if(!choices.includes(String(room))){return toast('Sala inexistente nesse andar.');}
    pos.andar=f;pos.sala=String(room); this.revealRoom(f,String(room)); logAction(`${p.nome} movido para ${f}º andar — sala ${room}.`);this.save();this.render();toast(`${p.nome}: ${f}º andar, sala ${room}`);
  },
  revealRoom(f,room){data.campanha.v030.reveladas[`${f}:${room}`]=true;},
  investigate(f,room){
    const key=`${f}:${room}`, ev=data.campanha.v030.eventosSalas[key];
    this.revealRoom(f,room); if(!ev){const r=this.room(f,room); const special=isSpecialRoom(r); const title=special?'Ambiente diferencial':'Quarto do Hotel Espelho'; const text=special?'O ambiente parece normal, mas há detalhes que não combinam com o restante do hotel. O Mestre pode disparar um evento daqui.':'O quarto está arrumado demais. Há sinais discretos de que alguém esteve aqui recentemente.'; data.campanha.v030.eventosSalas[key]={id:`expl-${f}-${this.roomCode(r)}`,titulo:title,tipo:special?'Investigação':'Exploração',texto:text,status:'descoberto',andar:f,sala:this.roomCode(r),origem:'exploracao',ativo:false,at:Date.now()};}
    else { ev.id=ev.id||`expl-${f}-${this.roomCode(this.room(f,room)||room)}`; ev.tipo=ev.tipo||'Exploração'; ev.andar=Number(ev.andar||f); ev.sala=ev.sala||this.roomCode(this.room(f,room)||room); ev.origem=ev.origem||'exploracao'; ev.ativo=!!ev.ativo; }
    logAction(`Sala ${room} do ${f}º andar investigada.`);this.save();this.render();toast(`Sala ${room} investigada`);
  },
  setDoor(key){const v=data.campanha.v030;const d=v.portas[key]||{estado:'aberta',requerChave:null};const states=['aberta','trancada','bloqueada','nada','chave'];const idx=states.indexOf(d.estado);d.estado=states[(idx+1)%states.length];if(d.estado==='chave'){const raw=prompt('Qual chave libera esta porta? (1–4)',d.requerChave||1);d.requerChave=Number(raw)||1;}else d.requerChave=null;v.portas[key]=d;logAction(`Porta ${key}: ${d.estado}${d.requerChave?' — Chave '+d.requerChave:''}.`);this.save();this.render();},
  toggleCondition(pid){openConditionModal(pid);},
  startCombat(){const c=data.campanha.v030.combate;c.ativo=!c.ativo;if(c.ativo){c.turno=data.jogadores[0]?.id||null;c.iniciativa=data.jogadores.map(p=>p.id);logAction('Combate iniciado.');toast('Combate iniciado');}else{c.turno=null;c.iniciativa=[];logAction('Combate encerrado.');toast('Combate encerrado');}this.save();this.render();},
  nextTurn(){const c=data.campanha.v030.combate;if(!c.ativo||!c.iniciativa.length)return;let i=c.iniciativa.indexOf(c.turno);c.turno=c.iniciativa[(i+1)%c.iniciativa.length];this.save();this.render();},
  playerView(pid){
    const p=data.jogadores.find(x=>x.id===pid);if(!p)return;
    selectedPlayer=p;show('playerSheet');renderSheet();
  },
  renderPlayerSystems(){
    const el=$('#playerSystems'); if(!el||!data)return;
    const pid=selectedPlayer?.id; if(!pid){el.innerHTML='';return;}
    const pos=this.position(pid), cond=data.campanha.v030.condicoes[pid]||[], combat=data.campanha.v030.combate;
    const floor=data.andares.find(a=>Number(a.id)===Number(pos.andar));
    const rooms=getFloorRooms(floor), revealed=data.campanha.v030.reveladas;
    const roomValue=(r)=>String(r).replace(/^Quarto\s+/i,'').trim();
    const sameRoom=(a,b)=>roomValue(a)===roomValue(b);
    const mapRooms=rooms.map(r=>{
      const code=this.roomCode(r),key=`${pos.andar}:${code}`,rev=!!revealed[key],mine=sameRoom(pos.sala,r);
      return `<div class="player-map-room ${rev?'revealed':''} ${isSpecialRoom(r)?'special':''} ${mine?'player-here':''}"><span>${esc(code)}</span><b>${esc(String(r).replace(/^Quarto\s+/i,''))}</b><small>${mine?'● VOCÊ':rev?'✓ Investigada':isSpecialRoom(r)?'✦ Ambiente especial':'Quarto'}</small></div>`;
    }).join('');
    const revealedCount=rooms.filter(r=>revealed[`${pos.andar}:${this.roomCode(r)}`]).length;
    const activeEvent=data.campanha.v030.eventoAtivo;
    const eventRelevant=activeEvent && (Number(activeEvent.andar)===Number(pos.andar)) && (!activeEvent.sala || roomValue(activeEvent.sala)===roomValue(pos.sala));
    const event=eventRelevant?`${activeEvent.titulo} — ${activeEvent.texto}`:'Nenhum evento ativo no seu local.';
    const publicFloors=[floor].map(f=>{
      const rs=getFloorRooms(f);
      const myFloor=Number(f.id)===Number(pos.andar);
      return `<div class="player-public-floor ${myFloor?'current':''}"><div class="player-public-floor-head"><b>${f.id}º Andar — ${esc(String(f.nome).replace(/^\d+º Andar — /,''))}</b><span>${myFloor?'● VOCÊ ESTÁ AQUI':'somente leitura'}</span></div><div class="player-public-grid">${rs.map(r=>{const code=this.roomCode(r),key=`${f.id}:${code}`,rev=!!revealed[key],mine=myFloor&&sameRoom(pos.sala,r);return `<div class="player-public-room ${rev?'revealed':''} ${mine?'player-here':''} ${isSpecialRoom(r)?'special':''}"><b>${esc(String(r).replace(/^Quarto\s+/i,''))}</b><small>${mine?'● Você':rev?'✓ Investigada':isSpecialRoom(r)?'✦ Ambiente especial':'Localização'}</small></div>`}).join('')}</div></div>`;
    }).join('');
    el.innerHTML=`<div class="v030-playerbar panel"><div><span class="eyebrow">VISÃO DO JOGADOR • MAPA</span><b>Você está no ${pos.andar}º Andar — sala ${esc(roomValue(pos.sala))}</b><small>Mapa completo somente leitura • nenhuma alteração de andar, sala ou porta é permitida.</small></div><span class="readonly-badge">🔒 SOMENTE LEITURA</span></div>${combat.ativo?`<div class="v030-turn panel"><b>COMBATE ATIVO</b><span>Turno: ${esc(data.jogadores.find(x=>x.id===combat.turno)?.nome||'—')}</span></div>`:''}<div class="player-map panel"><div class="player-map-head"><div><p class="eyebrow">MAPA DO ANDAR ATUAL</p><h2>Andar atual • somente leitura</h2></div><span class="readonly-badge">🔒 SEM CONTROLES DE ANDAR</span></div><div class="player-map-legend"><span>● Você</span><span>✓ Investigada</span><span>✦ Ambiente especial</span><span>🔒 Somente leitura</span></div><div class="player-public-map">${publicFloors}</div><div class="player-map-event ${eventRelevant?'active':''}"><span>EVENTO NO SEU LOCAL</span><b>${esc(event)}</b></div></div>`;
  },
  renderMasterSystems(){
    const el=$('#v030Systems');if(!el||!data)return;const v=data.campanha.v030;const c=v.combate;
    const playerRows=data.jogadores.map(p=>{const pos=this.position(p.id),co=v.condicoes[p.id]||[];return `<div class="v030-row"><div><b>${esc(p.nome)}</b><small>${pos.andar}º andar • sala ${esc(pos.sala)}${co.length?' • '+esc(co.join(', ')):''}</small></div><button class="dice-btn secondary" onclick="V030.movePlayer('${p.id}')">MOVER</button><button class="dice-btn secondary" onclick="V030.toggleCondition('${p.id}')">CONDIÇÃO</button><button class="dice-btn" onclick="V030.playerView('${p.id}')">VER</button></div>`}).join('');
    const mapRooms=this.rooms(data.campanha.andarAtual).map(r=>{const code=this.roomCode(r),key=`${data.campanha.andarAtual}:${code}`,d=v.eventosSalas[key],rev=!!v.reveladas[key];return `<button class="v030-room ${rev?'revealed':''} ${isSpecialRoom(r)?'special':''}" onclick="V030.investigate(${data.campanha.andarAtual},'${esc(code)}')"><b>${esc(code)}</b><small>${rev?'✓ investigada':'não investigada'}</small></button>`}).join('');
    const doorKeys=Object.keys(v.portas).filter(k=>k.includes(String(data.campanha.andarAtual))||k.startsWith('escada-'+data.campanha.andarAtual));
    const doors=doorKeys.slice(0,20).map(k=>{const d=v.portas[k];return `<button class="v030-door" onclick="V030.setDoor('${esc(k)}')">🚪 ${esc(k)}<small>${esc(d.estado)}${d.requerChave?' • 🔑'+d.requerChave:''}</small></button>`}).join('');
    const floor=Number(data.campanha.andarAtual);const killers=data.assassinos.filter(k=>Number(k.andar)===floor).map(k=>`<span class="v030-killer">☠ ${esc(k.nome)} — ${esc(k.sala)}</span>`).join('')||'<span class="muted">Nenhum assassino neste andar.</span>';
    el.innerHTML=`<div class="v030-grid"><div class="panel v030-panel"><div class="panel-title"><div><span class="icon">👤</span><div><h2>Movimentação & Estado</h2><p>V0.22–V0.25 • posições, perseguição e condições</p></div></div></div>${playerRows}</div><div class="panel v030-panel"><div class="panel-title"><div><span class="icon">🚪</span><div><h2>Mapa funcional</h2><p>${floor}º andar • clique em uma sala para investigar; portas alternam estado</p></div></div></div><div class="v030-rooms">${mapRooms}</div><div class="v030-doors">${doors||'<span class="muted">Sem portas parametrizadas.</span>'}</div><div class="v030-killers">${killers}</div></div><div class="panel v030-panel"><div class="panel-title"><div><span class="icon">⚔</span><div><h2>Encontro & Combate</h2><p>V0.28–V0.29 • turno e condições</p></div></div></div><div class="v030-combat-state"><b>${c.ativo?'COMBATE ATIVO':'FORA DE COMBATE'}</b>${c.ativo?`<span>Turno: ${esc(data.jogadores.find(x=>x.id===c.turno)?.nome||'—')}</span>`:''}</div><div class="v030-actions"><button class="dice-btn" onclick="V030.startCombat()">${c.ativo?'ENCERRAR':'INICIAR'} COMBATE</button>${c.ativo?'<button class="dice-btn secondary" onclick="V030.nextTurn()">PRÓXIMO TURNO</button>':''}</div><div class="v030-event-list">${Object.entries(v.eventosSalas).filter(([k])=>k.startsWith(floor+':')).slice(-6).map(([k,e])=>`<div><b>${esc(k)}</b><small>${esc(e.titulo)} — ${esc(e.texto)}</small></div>`).join('')||'<span class="muted">Nenhum evento de sala registrado.</span>'}</div></div></div>`;
  },
  render(){this.ensure();this.renderMasterSystems();this.renderPlayerSystems();}
};

// Encadeia a camada V0.30 sem substituir os módulos anteriores.
const __renderMasterV030=renderMaster;
renderMaster=function(){__renderMasterV030();V030.render();};
const __renderSheetV030=renderSheet;
renderSheet=function(){__renderSheetV030();V030.renderPlayerSystems();};
const __loadDataV030=loadData;
loadData=async function(useSaved=true){await __loadDataV030(useSaved);V030.render();};

/* ===== V0.30.1 — Refinamento do painel do Mestre ===== */
function movePlayerTo(pid, floor, room){
  const p=data.jogadores.find(x=>x.id===pid); if(!p)return;
  const f=Number(floor), floorObj=data.andares.find(a=>Number(a.id)===f), rooms=getFloorRooms(floorObj), normalizeRoom=(x)=>String(x).replace(/^Quarto\s+/i,'').trim();
  const target=rooms.find(r=>normalizeRoom(r)===normalizeRoom(room));
  if(!floorObj || !target) return toast('Localização inválida.');
  const pos=data.campanha.v030.posicoesJogadores[pid]||{};
  pos.andar=f; pos.sala=String(target); data.campanha.v030.posicoesJogadores[pid]=pos;
  V030.revealRoom(f,V030.roomCode(target)); logAction(`${p.nome} movido para ${f}º andar — ${room}.`); saveLocal(); renderMaster(); if(selectedPlayer?.id===pid){selectedPlayer=p;renderSheet();} toast(`${p.nome}: ${f}º — ${room}`);
}
function refreshMoveRooms(pid, floorSelect){
  const row=floorSelect.closest('.v030-player-card'); const roomSelect=row?.querySelector('[data-move-room]'); if(!roomSelect)return;
  const rooms=getFloorRooms(Number(floorSelect.value)); roomSelect.innerHTML=rooms.map(r=>`<option value="${esc(String(r))}">${esc(String(r))}</option>`).join('');
}
function openConditionModal(pid){
  const p=data.jogadores.find(x=>x.id===pid); if(!p)return;
  const modal=$('#conditionModal'); if(!modal)return;
  V030.ensure();
  modal.dataset.pid=pid;
  modal.setAttribute('aria-hidden','false');
  $('#conditionModalPlayer').textContent=p.nome;
  const current=new Set(data.campanha.v030.condicoes[pid]||[]);
  const catalog=[
    ['Sangrando','Perda contínua de vitalidade.','🩸'],
    ['Atordoado','Ações prejudicadas até se recuperar.','💫'],
    ['Abalado','Estado emocional comprometido.','😨'],
    ['Exausto','Cansaço reduzindo a capacidade de agir.','🥀'],
    ['Queimando','Sofrendo dano por fogo ou energia.','🔥'],
    ['Marcado','Alvo de uma influência ou ameaça.','👁'],
    ['Morrendo','Estado crítico; requer atenção imediata.','☠']
  ];
  $('#conditionOptions').innerHTML=catalog.map(([name,desc,icon])=>`<label class="condition-option ${current.has(name)?'selected':''}"><input type="checkbox" value="${esc(name)}" ${current.has(name)?'checked':''}><span class="condition-icon">${icon}</span><span class="condition-copy"><b>${esc(name)}</b><small>${esc(desc)}</small></span></label>`).join('');
  modal.classList.add('show');
}
function closeConditionModal(){const m=$('#conditionModal');if(m){m.classList.remove('show');m.setAttribute('aria-hidden','true');delete m.dataset.pid;}}
function saveConditionModal(){
  const m=$('#conditionModal');const pid=m?.dataset.pid;if(!pid)return;
  V030.ensure();
  const selected=[...m.querySelectorAll('#conditionOptions input:checked')].map(i=>i.value);
  data.campanha.v030.condicoes[pid]=selected;
  const p=data.jogadores.find(x=>x.id===pid);
  if(p)logAction(`${p.nome}: condições atualizadas (${selected.length?selected.join(', '):'nenhuma'}).`);
  saveLocal(); closeConditionModal(); renderMaster();
  if(selectedPlayer?.id===pid){selectedPlayer=p;renderSheet();}
  toast('Condições atualizadas');
}
document.addEventListener('change',e=>{if(e.target.matches('#conditionOptions input[type=checkbox]')){const card=e.target.closest('.condition-option');if(card)card.classList.toggle('selected',e.target.checked);}});
document.addEventListener('click',e=>{const m=e.target.closest('#conditionModal');if(m&&e.target===m)closeConditionModal();});
function getEventLocationLabel(ev){
  if(!ev) return 'Sem localização';
  return ev.sala ? `${ev.andar}º Andar — ${ev.sala}` : `${ev.andar}º Andar — Todo o andar`;
}
function normalizeExplorationEvents(){
  V030.ensure();
  const v=data.campanha.v030;
  v.eventosSalas=v.eventosSalas||{};
  return Object.entries(v.eventosSalas).map(([key,ev])=>{
    const parts=String(key).split(':');
    const andar=Number(ev.andar||parts[0]);
    const sala=ev.sala||parts.slice(1).join(':');
    ev.id=ev.id||`expl-${andar}-${String(sala).replace(/\s+/g,'-')}`;
    ev.tipo=ev.tipo||'Exploração';
    ev.andar=andar;
    ev.sala=sala;
    ev.origem='exploracao';
    ev.ativo=!!ev.ativo;
    return ev;
  }).filter(ev=>ev.titulo||ev.texto);
}
function activateExplorationEvent(id){
  V030.ensure();
  const ev=normalizeExplorationEvents().find(x=>x.id===id);
  if(!ev)return toast('Evento de exploração não encontrado.');
  const v=data.campanha.v030;
  if(v.eventoAtivo) v.eventoAtivo.ativo=false;
  ev.ativo=true;
  v.eventoAtivo=ev;
  data.campanha.eventoAtual=`${ev.titulo} — ${ev.texto}`;
  V030.revealRoom(ev.andar,ev.sala);
  logAction(`Evento de exploração ativado: ${ev.titulo} — ${getEventLocationLabel(ev)}.`);
  saveLocal(); renderMaster(); if(selectedPlayer)renderSheet(); toast('Evento de exploração ativado');
}
function createMasterEvent(){
  V030.ensure();
  const title=String(document.querySelector('#eventTitle')?.value||'').trim();
  const type=String(document.querySelector('#eventType')?.value||'Narrativo').trim();
  const text=String(document.querySelector('#eventText')?.value||'').trim();
  const floor=Number(document.querySelector('#eventFloor')?.value||data.campanha.andarAtual);
  const room=String(document.querySelector('#eventRoom')?.value||'').trim();
  if(!title||!text)return toast('Informe título e descrição do evento.');
  if(!data.andares.some(a=>Number(a.id)===floor))return toast('Andar inválido para o evento.');
  const floorObj=data.andares.find(a=>Number(a.id)===floor); const normalizeEventRoom=x=>String(x||'').replace(/^Quarto\s+/i,'').trim(); if(room && !getFloorRooms(floorObj).some(r=>normalizeEventRoom(r)===normalizeEventRoom(room)))return toast('Sala inválida para o andar selecionado.');
  const v=data.campanha.v030;
  if(v.eventoAtivo) v.eventoAtivo.ativo=false;
  v.eventosPersonalizados=Array.isArray(v.eventosPersonalizados)?v.eventosPersonalizados:[];
  const canonicalRoom=room ? (getFloorRooms(floorObj).find(r=>normalizeEventRoom(r)===normalizeEventRoom(room))||room) : ''; const ev={id:`evt-${Date.now()}`,titulo:title,tipo,texto:text,andar:floor,sala:canonicalRoom,at:Date.now(),ativo:true};
  v.eventosPersonalizados.unshift(ev); v.eventosPersonalizados=v.eventosPersonalizados.slice(0,30);
  v.eventoAtivo=ev;
  data.campanha.eventoAtual=`${title} — ${text}`;
  if(room)V030.revealRoom(f,V030.roomCode(data.andares.find(a=>Number(a.id)===floor)?.salas?.find(r=>String(r)===room)||room));
  logAction(`Evento aplicado: ${title} — ${getEventLocationLabel(ev)}.`);
  saveLocal(); renderMaster(); if(selectedPlayer)renderSheet(); toast('Evento criado e aplicado');
}
function setEventFloorRooms(select){
  const room=document.querySelector('#eventRoom'); if(!room)return;
  const floor=Number(select.value);
  const rooms=getFloorRooms(data.andares.find(a=>Number(a.id)===floor));
  room.innerHTML='<option value="">Todo o andar</option>'+rooms.map(r=>`<option value="${esc(String(r))}">${esc(String(r))}</option>`).join('');
}
function clearMasterEvent(){
  V030.ensure();
  if(data.campanha.v030.eventoAtivo) data.campanha.v030.eventoAtivo.ativo=false;
  data.campanha.v030.eventoAtivo=null;
  data.campanha.eventoAtual='Nenhum evento em andamento.';
  logAction('Evento atual encerrado.'); saveLocal(); renderMaster(); if(selectedPlayer)renderSheet(); toast('Evento encerrado');
}
function activateSavedEvent(id){
  V030.ensure();
  const ev=data.campanha.v030.eventosPersonalizados?.find(x=>x.id===id); if(!ev)return;
  ev.ativo=true; data.campanha.v030.eventoAtivo=ev;
  data.campanha.eventoAtual=`${ev.titulo} — ${ev.texto}`;
  if(ev.sala)V030.revealRoom(ev.andar,V030.roomCode(ev.sala));
  logAction(`Evento ativado: ${ev.titulo} — ${getEventLocationLabel(ev)}.`); saveLocal(); renderMaster(); if(selectedPlayer)renderSheet(); toast('Evento ativado');
}
function deleteSavedEvent(id){const v=data.campanha.v030;v.eventosPersonalizados=(v.eventosPersonalizados||[]).filter(x=>x.id!==id);if(v.eventoAtivo?.id===id){v.eventoAtivo=null;data.campanha.eventoAtual='Nenhum evento em andamento.';}saveLocal();renderMaster();if(selectedPlayer)renderSheet();toast('Evento removido da lista');}

V030.ensure=function(){
  const c=data.campanha; c.v030=c.v030||{}; const v=c.v030;
  v.portas=v.portas||{}; v.posicoesJogadores=v.posicoesJogadores||{}; v.reveladas=v.reveladas||{}; v.eventosSalas=v.eventosSalas||{}; v.eventosPersonalizados=Array.isArray(v.eventosPersonalizados)?v.eventosPersonalizados:[]; v.eventoAtivo=v.eventoAtivo||null; v.condicoes=v.condicoes||{}; v.combate=v.combate||{ativo:false,turno:null,iniciativa:[],alvos:{}};
  data.jogadores.forEach((p,i)=>{if(!v.posicoesJogadores[p.id])v.posicoesJogadores[p.id]={andar:5,sala:`50${i+1}`};if(!v.condicoes[p.id])v.condicoes[p.id]=[];});
  this.buildDoors();
};

function filterMasterEvents(filter){
  const rows=document.querySelectorAll('#v030Systems [data-event-source]');
  const floor=Number(data.campanha.andarAtual)||5;
  rows.forEach(row=>{
    const source=row.dataset.eventSource; const rowFloor=Number(row.dataset.eventFloor)||0;
    const show=filter==='todos'||(filter==='andar'&&rowFloor===floor)||(filter==='exploracao'&&source==='exploracao')||(filter==='personalizados'&&source==='personalizado');
    row.style.display=show?'':'none';
  });
  document.querySelectorAll('#eventFilterBar button').forEach(b=>b.classList.toggle('active',b.dataset.filter===filter));
}

V030.renderMasterSystems=function(){
  const el=$('#v030Systems'); if(!el||!data)return;
  const v=data.campanha.v030, c=v.combate, floor=Number(data.campanha.andarAtual)||5, currentFloor=data.andares.find(a=>Number(a.id)===floor);
  const playerRows=data.jogadores.map(p=>{
    const pos=this.position(p.id), co=v.condicoes[p.id]||[], pf=data.andares.find(a=>Number(a.id)===Number(pos.andar)), rooms=getFloorRooms(pf);
    const initials=esc(p.nome.split(' ').map(x=>x[0]).slice(0,2).join(''));
    const condHtml=co.length?co.map(x=>`<span class="state-chip condition">${esc(x)}</span>`).join(''):'<span class="state-chip clear">Sem condições</span>';
    const floorOptions=data.andares.slice().sort((a,b)=>a.id-b.id).map(a=>`<option value="${a.id}" ${Number(a.id)===Number(pos.andar)?'selected':''}>${a.id}º — ${esc(a.nome.replace(/^\d+º Andar — /,''))}</option>`).join('');
    const roomOptions=rooms.map(r=>`<option value="${esc(String(r))}" ${String(r).replace(/^Quarto\s+/i,'')===String(pos.sala).replace(/^Quarto\s+/i,'')?'selected':''}>${esc(String(r))}</option>`).join('');
    return `<div class="v030-player-card"><div class="v030-player-head"><div class="v030-avatar">${initials}</div><div class="v030-player-ident"><b>${esc(p.nome)}</b><small>${esc(p.classe||'Classe não definida')}</small></div><div class="v030-resource-mini"><span>PV <b>${p.pv}/${p.pvMax}</b></span><span>PE <b>${p.pe}/${p.peMax}</b></span><span>SAN <b>${p.san}/${p.sanMax}</b></span></div></div><div class="v030-location"><div><span class="v030-label">LOCALIZAÇÃO</span><strong>${pos.andar}º Andar</strong><small>${esc(pos.sala)}</small></div><div class="location-route"><span>●</span><i></i><span>●</span></div><div class="v030-state"><span class="v030-label">ESTADO</span><div>${condHtml}</div></div></div><div class="v030-move-controls"><select class="control-select" data-move-floor onchange="refreshMoveRooms('${p.id}',this)">${floorOptions}</select><select class="control-select" data-move-room>${roomOptions}</select><button class="dice-btn" onclick="movePlayerTo('${p.id}',this.closest('.v030-player-card').querySelector('[data-move-floor]').value,this.closest('.v030-player-card').querySelector('[data-move-room]').value)">MOVER</button><button class="dice-btn secondary" onclick="V030.toggleCondition('${p.id}')">CONDIÇÃO</button><button class="dice-btn secondary" onclick="V030.playerView('${p.id}')">VER FICHA</button></div></div>`;
  }).join('');
  const rooms=getFloorRooms(floor); const roomK=(r)=>roomKiller(floor,r).length; const positions=data.jogadores.filter(p=>Number(this.position(p.id).andar)===floor);
  const regularRooms=rooms.filter(r=>!isSpecialRoom(r)); const left=regularRooms.filter((_,i)=>i%2===0), right=regularRooms.filter((_,i)=>i%2===1), specials=rooms.filter(r=>isSpecialRoom(r));
  const roomCard=r=>{const code=this.roomCode(r),key=`${floor}:${code}`,rev=!!v.reveladas[key],ks=roomK(r),ps=positions.filter(p=>String(this.position(p.id).sala).replace(/^Quarto\s+/i,'')===String(r).replace(/^Quarto\s+/i,''));return `<button class="v030-map-room ${rev?'revealed':''} ${isSpecialRoom(r)?'special':''} ${ks?'danger':''}" onclick="V030.investigate(${floor},'${String(r).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')"><span class="room-code">${esc(code)}</span><b>${esc(String(r).replace(/^Quarto\s+/i,''))}</b>${rev?'<em>✓ Investigada</em>':'<em>Não investigada</em>'}${ps.length?`<div class="map-player-dots">${ps.map(p=>`<span title="${esc(p.nome)}">${esc(p.nome.split(' ').map(x=>x[0]).slice(0,2).join(''))}</span>`).join('')}</div>`:''}${ks?`<span class="map-killer-dot">☠ ${ks}</span>`:''}</button>`};
  const doorKeys=Object.keys(v.portas).filter(k=>k.includes(String(floor))||k.startsWith('escada-'+floor)).slice(0,24);
  const doorHtml=doorKeys.map(k=>{const d=v.portas[k];const labels={aberta:'ABERTA',trancada:'TRANCADA',bloqueada:'BLOQUEADA',nada:'NÃO EXISTE',chave:`CHAVE ${d.requerChave||'?'}`};return `<button class="v030-map-door state-${d.estado}" onclick="V030.setDoor('${esc(k)}')"><span>🚪</span><b>${esc(k)}</b><small>${labels[d.estado]||esc(d.estado)}</small></button>`}).join('');
  const explorationEvents=normalizeExplorationEvents().sort((a,b)=>(b.at||0)-(a.at||0));
  const customEvents=(v.eventosPersonalizados||[]).slice(0,10);
  const eventEntries=[...customEvents.map(ev=>({ev,source:'personalizado'})),...explorationEvents.map(ev=>({ev,source:'exploracao'}))].sort((a,b)=>(b.ev.at||0)-(a.ev.at||0)).slice(0,30);
  const eventList=eventEntries.map(({ev,source})=>`<div class="event-history-row ${v.eventoAtivo?.id===ev.id?'active-event':''} ${source==='exploracao'?'exploration-event-row':''}" data-event-source="${source}" data-event-floor="${Number(ev.andar)||0}"><div><span class="event-type">${esc(source==='exploracao'?'EXPLORAÇÃO • '+ev.tipo:ev.tipo)}</span><b>${esc(ev.titulo)}</b><small>${esc(getEventLocationLabel(ev))} • ${esc(ev.texto)}</small></div><div><button class="dice-btn" onclick="${source==='exploracao'?`activateExplorationEvent('${ev.id}')`:`activateSavedEvent('${ev.id}')`}">${v.eventoAtivo?.id===ev.id?'ATIVO':'ATIVAR'}</button>${source==='personalizado'?`<button class="dice-btn secondary" onclick="deleteSavedEvent('${ev.id}')">×</button>`:''}</div></div>`).join('')||'<small class="muted">Nenhum evento registrado.</small>';
  const explorationSummary=explorationEvents.length?`<div class="event-exploration-summary"><span>🔎 EVENTOS DA EXPLORAÇÃO</span><b>${explorationEvents.length}</b><small>Eventos gerados ao investigar salas aparecem automaticamente nesta aba.</small></div>`:'';
  const roomEventOptions=getFloorRooms(floor).map(r=>`<option value="${esc(String(r))}">${esc(String(r))}</option>`).join('');
  el.innerHTML=`<div class="v030-grid refined"><div class="panel v030-panel movement-panel"><div class="panel-title"><div><span class="icon">👤</span><div><h2>Movimentação & Estado</h2><p>Posição, recursos e condições dos jogadores</p></div></div></div><div class="v030-player-list">${playerRows}</div></div><div class="panel v030-panel map-functional-panel"><div class="panel-title"><div><span class="icon">▦</span><div><h2>Mapa funcional</h2><p>${floor}º andar — ${esc(currentFloor?.nome?.replace(/^\d+º Andar — /,'')||'')} • salas, jogadores, portas e ameaças</p></div></div><span class="map-floor-pill">${floor}º</span></div><div class="functional-map"><div class="map-connector top"><span>↑ ${floor>5?floor-1:'Térreo'}</span></div><div class="map-wing"><div class="map-room-column">${left.map(roomCard).join('')}</div><div class="map-core"><div class="map-core-title">CORREDOR CENTRAL</div><div class="map-core-line"></div><div class="map-core-stairs">↕<small>ESCADAS / ELEVADORES</small></div></div><div class="map-room-column">${right.map(roomCard).join('')}</div></div><div class="map-specials">${specials.map(roomCard).join('')}</div><div class="map-connector bottom"><span>↓ ${floor<9?floor+1:'TERRAÇO'}</span></div></div><div class="map-door-list"><div class="subsection-title">PORTAS E CONEXÕES</div>${doorHtml||'<small class="muted">Sem conexões cadastradas.</small>'}</div></div><div class="panel v030-panel event-panel"><div class="panel-title"><div><span class="icon">⚑</span><div><h2>Eventos</h2><p>Crie, aplique e encerre eventos narrativos</p></div></div></div><div class="event-current"><span>EVENTO ATUAL</span><b>${esc(data.campanha.eventoAtual||'Nenhum evento em andamento.')} ${data.campanha.v030?.eventoAtivo?`<small class="event-current-location">${esc(getEventLocationLabel(data.campanha.v030.eventoAtivo))}</small>`:''}</b><button class="ghost small" onclick="clearMasterEvent()">ENCERRAR</button></div><div class="event-form"><label>Título<input id="eventTitle" class="control-input" maxlength="80" placeholder="Ex.: O telefone toca sozinho"></label><label>Tipo<select id="eventType" class="control-select"><option>Narrativo</option><option>Tensão</option><option>Ameaça</option><option>Investigação</option><option>Perseguição</option><option>Combate</option></select></label><label>Andar<select id="eventFloor" class="control-select" onchange="setEventFloorRooms(this)">${data.andares.map(a=>`<option value="${a.id}" ${a.id===floor?'selected':''}>${a.id}º — ${esc(a.nome.replace(/^\d+º Andar — /,''))}</option>`).join('')}</select></label><label>Sala <select id="eventRoom" class="control-select"><option value="">Todo o andar</option>${roomEventOptions}</select></label><label class="event-full">Descrição<textarea id="eventText" class="control-input" rows="3" maxlength="500" placeholder="Descreva exatamente o que acontece, o que os jogadores percebem e qual é a consequência."></textarea></label><button class="primary event-create" onclick="createMasterEvent()">+ CRIAR E APLICAR EVENTO</button></div><div class="event-history"><div class="subsection-title">EVENTOS REGISTRADOS</div><div id="eventFilterBar" class="event-filter-bar"><button class="active" data-filter="todos" onclick="filterMasterEvents('todos')">TODOS</button><button data-filter="andar" onclick="filterMasterEvents('andar')">ANDAR ATUAL</button><button data-filter="exploracao" onclick="filterMasterEvents('exploracao')">EXPLORAÇÃO</button><button data-filter="personalizados" onclick="filterMasterEvents('personalizados')">PERSONALIZADOS</button></div>${explorationSummary}${eventList}</div><div class="combat-mini"><div><span>COMBATE</span><b>${c.ativo?'ATIVO':'FORA DE COMBATE'}</b>${c.ativo?`<small>Turno: ${esc(data.jogadores.find(x=>x.id===c.turno)?.nome||'—')}</small>`:''}</div><div class="v030-actions"><button class="dice-btn" onclick="V030.startCombat()">${c.ativo?'ENCERRAR':'INICIAR'}</button>${c.ativo?'<button class="dice-btn secondary" onclick="V030.nextTurn()">PRÓXIMO TURNO</button>':''}</div></div></div></div>`;
};

