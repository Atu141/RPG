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
  renderCampaign(); renderHotelMap();
  if(selectedPlayer) renderSheet();
  toast(`Mapa: ${n}º andar`);
}
function toggleMapRoom(floorId,room){ toggleRoomInvestigated(Number(floorId),room); renderHotelMap(); }
function moveKillerFromMap(id){ moveKiller(id); renderHotelMap(); }

function renderMaster(){ renderMasterBase(); renderHotelMap(); }

// ===== Inicialização e rolagem =====
