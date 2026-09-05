function ensureHorrorState(){
  data.campanha.horror=data.campanha.horror||{};
  data.campanha.horror.alertas=Array.isArray(data.campanha.horror.alertas)?data.campanha.horror.alertas:[];
  data.campanha.horror.eventos=Array.isArray(data.campanha.horror.eventos)?data.campanha.horror.eventos:[];
  data.campanha.perseguicaoAlvo=data.campanha.perseguicaoAlvo||'';
  data.campanha.perseguicaoAssassino=data.campanha.perseguicaoAssassino||'';
  data.campanha.perseguicaoDistancia=Math.max(0,Number(data.campanha.perseguicaoDistancia)||0);
  data.campanha.perseguicaoRodada=Math.max(1,Number(data.campanha.perseguicaoRodada)||1);
  data.campanha.perseguicaoAtiva=Boolean(data.campanha.perseguicaoAtiva);
}
function showAlert(title,text,type='warning',playerOnly=false){
  ensureHorrorState();
  const alert={id:'a'+Date.now()+Math.random().toString(16).slice(2),title:String(title),text:String(text),type,playerOnly,at:Date.now()};
  data.campanha.horror.alertas.unshift(alert); data.campanha.horror.alertas=data.campanha.horror.alertas.slice(0,20);
  renderAlerts(); saveLocal();
}
function dismissAlert(id){
  ensureHorrorState(); data.campanha.horror.alertas=data.campanha.horror.alertas.filter(x=>x.id!==id); saveLocal(); renderAlerts();
}
function renderAlerts(){
  const layer=$('#alertLayer'); if(!layer||!data)return;
  const alerts=(data.campanha.horror?.alertas||[]).filter(x=>!x.playerOnly || selectedPlayer).slice(0,4);
  layer.innerHTML=alerts.map(x=>`<div class="horror-alert ${esc(x.type)}"><div class="alert-symbol">${x.type==='danger'?'☠':x.type==='success'?'✓':'!'}</div><div><b>${esc(x.title)}</b><span>${esc(x.text)}</span></div><button onclick="dismissAlert('${x.id}')">×</button></div>`).join('');
  if(alerts.length) setTimeout(()=>{ const first=alerts[alerts.length-1]; if(first) dismissAlert(first.id); },5200);
}
function playHorrorSound(kind='warning'){
  try{
    const C=window.AudioContext||window.webkitAudioContext; if(!C)return;
    if(horrorAudio) horrorAudio.close(); horrorAudio=new C(); const ctx=horrorAudio;
    const gain=ctx.createGain(); gain.gain.value=0.0001; gain.connect(ctx.destination);
    const osc=ctx.createOscillator(); osc.connect(gain);
    const now=ctx.currentTime;
    if(kind==='chase'){osc.type='sawtooth';osc.frequency.setValueAtTime(110,now);osc.frequency.exponentialRampToValueAtTime(55,now+0.9);gain.gain.exponentialRampToValueAtTime(0.16,now+0.05);gain.gain.exponentialRampToValueAtTime(0.0001,now+1.2);osc.start(now);osc.stop(now+1.2);}
    else if(kind==='release'){osc.type='sine';osc.frequency.setValueAtTime(180,now);osc.frequency.exponentialRampToValueAtTime(360,now+0.45);gain.gain.exponentialRampToValueAtTime(0.08,now+0.03);gain.gain.exponentialRampToValueAtTime(0.0001,now+0.55);osc.start(now);osc.stop(now+0.55);}
    else {osc.type='triangle';osc.frequency.setValueAtTime(kind==='warning'?180:80,now);osc.frequency.exponentialRampToValueAtTime(kind==='warning'?90:45,now+0.5);gain.gain.exponentialRampToValueAtTime(0.1,now+0.02);gain.gain.exponentialRampToValueAtTime(0.0001,now+0.65);osc.start(now);osc.stop(now+0.65);}
  }catch(e){console.debug('Áudio indisponível',e);}
}
function applyHorrorEffect(effect='shake'){
  document.body.classList.remove('horror-shake','horror-flash','horror-dark');
  void document.body.offsetWidth;
  document.body.classList.add(effect==='flash'?'horror-flash':effect==='dark'?'horror-dark':'horror-shake');
  setTimeout(()=>document.body.classList.remove('horror-shake','horror-flash','horror-dark'),900);
}
function triggerRandomHorror(){
  const e=HORROR_EVENTS[Math.floor(Math.random()*HORROR_EVENTS.length)];
  data.campanha.eventoAtual=e.texto; ensureHorrorState(); data.campanha.horror.eventos.unshift({...e,at:Date.now()}); data.campanha.horror.eventos=data.campanha.horror.eventos.slice(0,20);
  showAlert(e.titulo,e.texto,e.tipo==='ameaça'?'danger':'warning'); playHorrorSound(e.tipo==='ameaça'?'warning':'tension'); applyHorrorEffect(e.tipo==='ameaça'?'flash':'shake');
  logAction(`Evento de horror: ${e.titulo}.`); saveLocal(); renderMaster(); renderCampaign(); if(selectedPlayer)renderSheet();
}
function setPursuitTarget(pid){
  const p=data.jogadores.find(x=>x.id===pid); if(!p)return; data.campanha.perseguicaoAlvo=p.nome; saveLocal(); renderMaster(); showAlert('ALVO DEFINIDO',`A perseguição está focada em ${p.nome}.`,'danger');
}
function setPursuitKiller(id){const k=data.assassinos.find(x=>x.id===id);if(!k)return;data.campanha.perseguicaoAssassino=k.nome;saveLocal();renderMaster();}
function changePursuitDistance(delta){ensureHorrorState();data.campanha.perseguicaoDistancia=Math.max(0,Math.min(10,data.campanha.perseguicaoDistancia+Number(delta||0)));data.campanha.perseguicaoRodada++;saveLocal();renderMaster();if(selectedPlayer)renderSheet();}
function openHorrorScreen(p=selectedPlayer){
  ensureHorrorState(); const o=$('#horrorOverlay'); if(!o)return;
  const killer=data.assassinos.find(k=>k.nome===data.campanha.perseguicaoAssassino);
  $('#horrorTitle').textContent=data.campanha.perseguicao==='Perseguição'?'VOCÊ ESTÁ SENDO CAÇADO':'ALGO ESTÁ OBSERVANDO VOCÊ';
  $('#horrorText').textContent=killer?`${killer.nome} está em perseguição.`:'A ameaça está próxima. Encontre uma saída.';
  $('#horrorMeta').innerHTML=`<span>ANDAR ${data.campanha.andarAtual}º</span><span>RODADA ${data.campanha.perseguicaoRodada}</span><span>DISTÂNCIA ${data.campanha.perseguicaoDistancia}</span>`;
  o.classList.add('active'); o.setAttribute('aria-hidden','false'); playHorrorSound('chase'); applyHorrorEffect('shake');
}
function closeHorrorScreen(){const o=$('#horrorOverlay');if(o){o.classList.remove('active');o.setAttribute('aria-hidden','true');}}
function advancePursuit(){
  const i=PURSUIT_STAGES.indexOf(data.campanha.perseguicao); const next=PURSUIT_STAGES[Math.min(PURSUIT_STAGES.length-1,i+1)]; if(next===data.campanha.perseguicao && next==='Perseguição'){changePursuitDistance(-1);return;} setPursuit(next);
}
function retreatPursuit(){const i=PURSUIT_STAGES.indexOf(data.campanha.perseguicao);setPursuit(PURSUIT_STAGES[Math.max(0,i-1)]);}
function masterHorrorEvent(){triggerRandomHorror();}

// ===== v0.16-v0.19: experiência, exploração e painel do Mestre =====
function getCurrentFloor(){ return data?.andares?.find(x=>Number(x.id)===Number(data?.campanha?.andarAtual)); }
function getInvestigatedRooms(floorId){
  const map=data.campanha.salasInvestigadas||{};
  return Array.isArray(map[String(floorId)]) ? map[String(floorId)] : [];
}
function toggleRoomInvestigated(floorId,room){
  const key=String(floorId); const list=getInvestigatedRooms(floorId); const i=list.indexOf(room);
  if(i>=0) list.splice(i,1); else list.push(room);
  data.campanha.salasInvestigadas=data.campanha.salasInvestigadas||{}; data.campanha.salasInvestigadas[key]=list;
  logAction(`${room}: ${i>=0?'marcada como não investigada':'investigada'} no ${floorId}º andar.`); saveLocal(); renderMaster(); if(selectedPlayer) renderSheet(); toast(i>=0?'Sala reaberta':'Sala investigada');
}
function toggleClue(id){
  const clue=data.pistas?.find(x=>x.id===id); if(!clue)return;
  clue.revelada=!clue.revelada; data.campanha.pistasReveladas=Array.isArray(data.campanha.pistasReveladas)?data.campanha.pistasReveladas:[];
  if(clue.revelada && !data.campanha.pistasReveladas.includes(id)) data.campanha.pistasReveladas.push(id);
  if(!clue.revelada) data.campanha.pistasReveladas=data.campanha.pistasReveladas.filter(x=>x!==id);
  logAction(`Pista "${clue.nome}": ${clue.revelada?'revelada aos jogadores':'ocultada'}.`); saveLocal(); renderMaster(); if(selectedPlayer) renderSheet(); toast(clue.revelada?'Pista revelada':'Pista ocultada');
}
function setMasterEvent(){
  const value=prompt('Evento narrativo atual:',data.campanha.eventoAtual||''); if(value===null)return;
  data.campanha.eventoAtual=String(value).trim()||'Nenhum evento em andamento.'; logAction('Evento narrativo atualizado.'); saveLocal(); renderMaster(); if(selectedPlayer) renderSheet(); toast('Evento atualizado');
}
function randomEvent(){triggerRandomHorror();toast('Evento de horror sorteado')}
function quickResource(pid,resource,delta){
  const p=data.jogadores.find(x=>x.id===pid); if(!p)return; const max=Number(p[resource+'Max'])||0; p[resource]=Math.max(0,Math.min(max,(Number(p[resource])||0)+delta)); logAction(`${p.nome}: ${resource.toUpperCase()} ${delta>=0?'+':''}${delta} → ${p[resource]}/${max}.`); saveLocal(); renderMaster(); if(selectedPlayer?.id===pid){selectedPlayer=p;renderSheet();} toast(`${p.nome}: ${resource.toUpperCase()} ${p[resource]}/${max}`);
}
function renderMasterDashboard(){
  const el=$('#masterDashboard'); if(!el)return; const c=data.campanha, f=getCurrentFloor();
  const activePlayers=data.jogadores.map(p=>`<div class="dash-player"><b>${esc(p.nome)}</b><span>PV ${p.pv}/${p.pvMax}</span><span>PE ${p.pe}/${p.peMax}</span><span>SAN ${p.san}/${p.sanMax}</span><div><button class="dice-btn" onclick="quickResource('${p.id}','pv',-1)">−PV</button><button class="dice-btn" onclick="quickResource('${p.id}','pv',1)">+PV</button><button class="dice-btn secondary" onclick="quickResource('${p.id}','san',-1)">−SAN</button><button class="dice-btn secondary" onclick="quickResource('${p.id}','san',1)">+SAN</button></div></div>`).join('');
  const rooms=(f?.salas||[]).map(r=>`<button class="room-chip ${getInvestigatedRooms(f.id).includes(r)?'done':''}" onclick="toggleRoomInvestigated(${f.id},'${String(r).replace(/'/g,"\\'")}')">${getInvestigatedRooms(f.id).includes(r)?'✓ ':''}${esc(r)}</button>`).join('');
  const clues=(data.pistas||[]).map(p=>`<div class="clue-row"><div><b>${esc(p.nome)}</b><small>${p.andar}º andar • ${esc(p.texto)}</small></div><button class="dice-btn ${p.revelada?'secondary':''}" onclick="toggleClue('${p.id}')">${p.revelada?'OCULTAR':'REVELAR'}</button></div>`).join('')||'<small>Nenhuma pista cadastrada.</small>';
  el.innerHTML=`<div class="panel-title"><div><span class="icon">◉</span><div><h2>Painel rápido</h2><p>${c.andarAtual}º — ${esc(f?.nome||'')} • ${esc(c.perseguicao)}</p></div></div></div><div class="dashboard-grid"><div><h3>RECURSOS</h3><div class="dash-players">${activePlayers}</div></div><div><h3>EXPLORAÇÃO</h3><p class="dash-event"><b>Evento:</b> ${esc(c.eventoAtual||'Nenhum evento em andamento.')}</p><div class="dash-actions"><button class="ghost small" onclick="setMasterEvent()">EDITAR EVENTO</button><button class="ghost small" onclick="randomEvent()">🎲 EVENTO ALEATÓRIO</button></div><p class="dash-label">SALAS DO ${c.andarAtual}º ANDAR</p><div class="room-chips">${rooms||'<small>Sem salas cadastradas.</small>'}</div></div><div><h3>PISTAS</h3><div class="clue-list">${clues}</div></div><div class="pursuit-console"><h3>PERSEGUIÇÃO</h3><div class="pursuit-readout"><b>${esc(c.perseguicao)}</b><span>${esc(c.perseguicaoAssassino||'Sem assassino definido')}</span><span>Alvo: ${esc(c.perseguicaoAlvo||'Nenhum')}</span><span>Distância: ${c.perseguicaoDistancia} • Rodada: ${c.perseguicaoRodada}</span></div><div class="pursuit-actions"><button class="dice-btn" onclick="retreatPursuit()">← RECUAR</button><button class="dice-btn" onclick="advancePursuit()">AVANÇAR →</button><button class="dice-btn" onclick="changePursuitDistance(-1)">− DIST.</button><button class="dice-btn" onclick="changePursuitDistance(1)">+ DIST.</button><button class="dice-btn secondary" onclick="openHorrorScreen(selectedPlayer)">☠ TELA DE HORROR</button></div><div class="pursuit-selects"><select class="control-select" onchange="setPursuitTarget(this.value)"><option value="">Selecionar alvo</option>${data.jogadores.map(p=>`<option value="${p.id}" ${c.perseguicaoAlvo===p.nome?'selected':''}>${esc(p.nome)}</option>`).join('')}</select><select class="control-select" onchange="setPursuitKiller(this.value)"><option value="">Selecionar assassino</option>${data.assassinos.map(k=>`<option value="${k.id}" ${c.perseguicaoAssassino===k.nome?'selected':''}>${esc(k.nome)}</option>`).join('')}</select></div></div></div>`;
}
function renderQuickPlayerTools(){
  const p=selectedPlayer; if(!p)return; const existing=$('#playerQuickTools'); if(existing) existing.remove();
  const current=getCurrentFloor(); const revealed=(data.pistas||[]).filter(x=>x.revelada && Number(x.andar)===Number(data.campanha.andarAtual));
  const rooms=(current?.salas||[]).map(r=>`<span class="room-chip ${getInvestigatedRooms(current.id).includes(r)?'done':''}">${getInvestigatedRooms(current.id).includes(r)?'✓ ':''}${esc(r)}</span>`).join('');
  const clues=revealed.map(x=>`<div class="public-clue"><b>🔎 ${esc(x.nome)}</b><span>${esc(x.texto)}</span></div>`).join('')||'<small class="muted">Nenhuma pista foi revelada neste andar.</small>';
  const box=document.createElement('div'); box.id='playerQuickTools'; box.className='player-quick-tools panel'; box.innerHTML=`<div class="quick-head"><div><p class="eyebrow">AÇÕES RÁPIDAS</p><h2>Você está no ${data.campanha.andarAtual}º andar</h2></div><div class="quick-resource"><b>PV ${p.pv}/${p.pvMax}</b><b>PE ${p.pe}/${p.peMax}</b><b>SAN ${p.san}/${p.sanMax}</b></div></div><div class="quick-actions"><button class="dice-btn" onclick="openAttributeDice('${p.id}','FOR')">TESTAR FOR</button><button class="dice-btn" onclick="openAttributeDice('${p.id}','AGI')">TESTAR AGI</button><button class="dice-btn" onclick="openAttributeDice('${p.id}','INT')">TESTAR INT</button><button class="dice-btn" onclick="openAttributeDice('${p.id}','PRE')">TESTAR PRE</button><button class="dice-btn" onclick="openAttributeDice('${p.id}','VIG')">TESTAR VIG</button>${data.campanha.perseguicaoAtiva?'<button class="dice-btn danger-action" onclick="openHorrorScreen(selectedPlayer)">☠ PERSEGUIÇÃO</button>':''}</div><div class="exploration-public"><div><p class="eyebrow">EXPLORAÇÃO</p><div class="room-chips">${rooms}</div></div><div><p class="eyebrow">PISTAS REVELADAS</p><div class="public-clues">${clues}</div></div><div><p class="eyebrow">EVENTO</p><b>${esc(data.campanha.eventoAtual||'Nenhum evento em andamento.')}</b></div></div>`;
  const target=$('#sheetContent'); if(target) target.prepend(box);
}
function renderSheet(){ renderSheetBase(); renderQuickPlayerTools(); renderAlerts(); }

function getFloorRooms(floor){
  const obj=typeof floor==='number'||typeof floor==='string' ? data?.andares?.find(a=>Number(a.id)===Number(floor)) : floor;
  return Array.isArray(obj?.salas) ? obj.salas : [];
}
function isSpecialRoom(name){
  const n=String(name||'').toLowerCase();
  return !n.startsWith('quarto ');
}
function roomKiller(floorId,room){
  return (data.assassinos||[]).filter(k=>Number(k.andar)===Number(floorId)&&String(k.sala||'')===String(room));
}
function renderHotelMap(){
  const el=$('#hotelMap'); if(!el||!data)return;
  const current=Number(data.campanha.andarAtual)||5;
  const floor=data.andares.find(x=>Number(x.id)===current) || data.andares.find(x=>Number(x.id)===5);
  const rooms=getFloorRooms(floor);
  const investigated=getInvestigatedRooms(floor.id);
  const routeDown=[5,4,3,2,1].includes(Number(floor.id));
  const routeUp=[5,6,7,8,9].includes(Number(floor.id));
  const killersHere=(data.assassinos||[]).filter(k=>Number(k.andar)===Number(floor.id));
  const floorButtons=data.andares.slice().sort((a,b)=>b.id-a.id).map(a=>`<button class="map-floor-btn ${Number(a.id)===Number(floor.id)?'active':''}" onclick="setMapFloor(${a.id})"><span>${a.id}º</span><small>${esc(a.nome.replace(/^\d+º Andar — /,''))}</small></button>`).join('');
  const roomCards=rooms.map((room,i)=>{
    const done=investigated.includes(room), special=isSpecialRoom(room), ks=roomKiller(floor.id,room);
    return `<button class="hotel-room ${done?'investigated':''} ${special?'special':''} ${ks.length?'killer-present':''}" onclick="toggleMapRoom(${floor.id},'${String(room).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')"><span class="room-number">${special?'✦':String(i+1).padStart(2,'0')}</span><span class="room-name">${esc(room)}</span>${done?'<span class="room-status">✓</span>':''}${ks.length?`<span class="killer-marker">☠ ${ks.length}</span>`:''}</button>`;
  }).join('');
  const killerLegend=killersHere.length ? killersHere.map(k=>`<div class="map-killer-row"><span>☠</span><div><b>${esc(k.nome)}</b><small>${esc(k.sala||'Localização secreta')} • ${esc(k.estado)}</small></div><button class="dice-btn secondary" onclick="moveKillerFromMap('${k.id}')">MOVER</button></div>`).join('') : '<small class="muted">Nenhum assassino neste andar.</small>';
  const routeLabel=floor.id===5?'⭐ PONTO INICIAL':routeDown&&routeUp?'↕ DUAS ROTAS':routeDown?'↓ ROTA DO HALL':routeUp?'↑ ROTA DO TERRAÇO':'ANDAR';
  el.innerHTML=`<div class="panel-title"><div><span class="icon">▦</span><div><h2>Mapa do Hotel Espelho</h2><p>Exploração, salas, rotas e posições secretas</p></div></div><div class="map-current-badge">${routeLabel}</div></div><div class="hotel-map-layout"><aside class="map-floors"><div class="map-floor-title">ANDARES</div>${floorButtons}<div class="map-exits"><b>SAÍDAS</b><span>↘ Térreo — Hall</span><span>↗ Terraço — acima do 9º</span></div></aside><div class="map-main"><div class="map-floor-header"><div><p class="eyebrow">ANDAR ${floor.id}</p><h3>${esc(floor.nome)}</h3></div><div class="map-route-tags">${routeDown?'<span>↓ Hall</span>':''}${routeUp?'<span>↑ Terraço</span>':''}</div></div><div class="hotel-floor-plan"><div class="floor-corridor"><span>◎ CORREDOR CENTRAL</span><i></i><span>↕ ESCADA / ELEVADORES</span></div><div class="hotel-rooms-grid">${roomCards}</div></div></div><aside class="map-side"><h3>AMEAÇAS</h3>${killerLegend}<h3>CONTROLES</h3><div class="map-help"><small>• Clique em uma sala para marcar/desmarcar como investigada.</small><small>• ☠ indica assassino oculto neste ambiente.</small><small>• O 5º andar é protegido e não recebe assassinos.</small></div></aside></div>`;
}
function setMapFloor(floor){
  const n=Number(floor); if(!data.andares.some(a=>Number(a.id)===n))return;
  data.campanha.andarAtual=n; logAction(`Mapa: andar selecionado ${n}º.`); saveLocal();
  renderCampaign(); renderHotelMap(); renderMasterDashboard();
  if(window.V030 && typeof V030.render==='function') V030.render();
  if(selectedPlayer) renderSheet();
  toast(`Mapa: ${n}º andar`);
}
function toggleMapRoom(floorId,room){ toggleRoomInvestigated(Number(floorId),room); renderHotelMap(); }
function moveKillerFromMap(id){ moveKiller(id); renderHotelMap(); }

function renderMaster(){ renderMasterBase(); renderHotelMap(); renderMasterDashboard(); }

// ===== Inicialização e rolagem =====
