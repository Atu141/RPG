/* V0.70.4 — Núcleo enxuto do mapa funcional.
   Mantém apenas exploração, portas, posições sincronizadas e visão do jogador.
   Movimentação/condições/eventos narrativos usam os módulos consolidados.
*/
const V030={
  floors:[1,2,3,4,5,6,7,8,9],
  ensure(){
    if(!data)return;
    const c=data.campanha;c.v030=c.v030||{};const v=c.v030;
    v.portas=v.portas||{};v.reveladas=v.reveladas||{};v.eventosSalas=v.eventosSalas||{};
    v.condicoes=v.condicoes||{};v.combate=v.combate||{ativo:false,turno:null,iniciativa:[],alvos:{}};
    if(typeof HotelGame!=='undefined'&&HotelGame.ensure){
      const h=HotelGame.ensure();
      data.jogadores.forEach((p,i)=>{
        if(!h.posicoes[p.id])h.posicoes[p.id]=v.posicoesJogadores?.[p.id]||{andar:5,sala:`Quarto 5${String(i+1).padStart(2,'0')}`};
      });
    }else{
      v.posicoesJogadores=v.posicoesJogadores||{};
      data.jogadores.forEach((p,i)=>{if(!v.posicoesJogadores[p.id])v.posicoesJogadores[p.id]={andar:5,sala:`Quarto 5${String(i+1).padStart(2,'0')}`};});
    }
    this.buildDoors();
  },
  buildDoors(){
    const v=data.campanha.v030;
    for(let f=1;f<=9;f++){
      const rooms=getFloorRooms(f)||[];
      rooms.forEach((r,i)=>{
        const a=this.roomCode(r),b=rooms[i+1];if(!a||!b)return;
        const bb=this.roomCode(b),key=`${a}-${bb}`;
        if(!v.portas[key])v.portas[key]={estado:'aberta',requerChave:null};
      });
      if(f>1){const key=`escada-${f}-${f-1}`;if(!v.portas[key])v.portas[key]={estado:'aberta',requerChave:null};}
      if(f<9){const key=`escada-${f}-${f+1}`;if(!v.portas[key])v.portas[key]={estado:'aberta',requerChave:null};}
    }
    ['hall-terreo','terraco-9'].forEach(k=>{if(!v.portas[k])v.portas[k]={estado:'trancada',requerChave:null};});
  },
  roomCode(r){const raw=String(r?.codigo||r?.id||r?.nome||r||'').trim();const digits=raw.replace(/\D/g,'');return digits||raw.replace(/^Quarto\s+/i,'').replace(/\s+/g,'-').toLowerCase();},
  rooms(f){return getFloorRooms(f)||[];},
  room(f,code){return this.rooms(f).find(r=>this.roomCode(r)===String(code));},
  position(pid){
    if(typeof HotelGame!=='undefined'&&HotelGame.ensure){const h=HotelGame.ensure();if(h.posicoes[pid])return h.posicoes[pid];}
    return data.campanha.v030.posicoesJogadores?.[pid]||{andar:5,sala:'501'};
  },
  save(){saveLocal();},
  revealRoom(f,room){data.campanha.v030.reveladas[`${Number(f)}:${room}`]=true;},
  investigate(f,room){
    this.ensure();
    const code=this.roomCode(this.room(f,room)||room);
    this.revealRoom(f,code);
    const key=`${Number(f)}:${code}`;
    const r=this.room(f,code);
    if(!data.campanha.v030.eventosSalas[key])data.campanha.v030.eventosSalas[key]={id:`expl-${f}-${code}`,titulo:isSpecialRoom(r)?'Ambiente diferencial':'Quarto do Hotel Espelho',tipo:isSpecialRoom(r)?'Investigação':'Exploração',texto:isSpecialRoom(r)?'O ambiente apresenta detalhes que não combinam com o restante do hotel.':'O quarto está arrumado demais. Há sinais discretos de que alguém esteve aqui recentemente.',andar:Number(f),sala:code,origem:'exploracao',ativo:false,at:Date.now()};
    logAction(`Sala ${room} do ${f}º andar investigada.`);this.save();renderMaster();if(selectedPlayer)renderSheet();toast(`Sala ${room} investigada`);
  },
  setDoor(key){
    this.ensure();const v=data.campanha.v030,d=v.portas[key]||{estado:'aberta',requerChave:null};
    const states=['aberta','trancada','bloqueada','nada','chave'],idx=states.indexOf(d.estado);
    d.estado=states[(idx+1)%states.length];
    d.requerChave=d.estado==='chave'?(Number(prompt('Qual chave libera esta porta? (1–4)',d.requerChave||1))||1):null;
    v.portas[key]=d;logAction(`Porta ${key}: ${d.estado}${d.requerChave?' — Chave '+d.requerChave:''}.`);this.save();renderMaster();toast(`Porta: ${key} → ${d.estado}`);
  },
  renderPlayerSystems(){
    const el=$('#playerSystems');if(!el||!data||!selectedPlayer)return;
    const pid=selectedPlayer.id,pos=this.position(pid),floor=data.andares.find(a=>Number(a.id)===Number(pos.andar));
    const rooms=this.rooms(floor),revealed=data.campanha.v030.reveladas||{};
    const roomValue=r=>String(r).replace(/^Quarto\s+/i,'').trim(),same=(a,b)=>roomValue(a)===roomValue(b);
    const mapRooms=rooms.map(r=>{const code=this.roomCode(r),key=`${pos.andar}:${code}`,rev=!!revealed[key],mine=same(pos.sala,r);return `<div class="player-map-room ${rev?'revealed':''} ${isSpecialRoom(r)?'special':''} ${mine?'player-here':''}"><span>${esc(code)}</span><b>${esc(String(r).replace(/^Quarto\s+/i,''))}</b><small>${mine?'● VOCÊ':rev?'✓ Investigada':isSpecialRoom(r)?'✦ Ambiente especial':'Quarto'}</small></div>`;}).join('');
    el.innerHTML=`<div class="v030-playerbar panel"><div><span class="eyebrow">VISÃO DO JOGADOR • MAPA</span><b>Você está no ${pos.andar}º Andar — sala ${esc(roomValue(pos.sala))}</b><small>Mapa em modo somente leitura.</small></div><span class="readonly-badge">🔒 SOMENTE LEITURA</span></div><div class="player-map panel"><div class="player-map-head"><div><p class="eyebrow">MAPA DO ANDAR ATUAL</p><h2>${floor?esc(floor.nome.replace(/^\d+º Andar — /,'')):'Andar atual'}</h2></div></div><div class="player-map-legend"><span>● Você</span><span>✓ Investigada</span><span>✦ Ambiente especial</span></div><div class="player-floor-map"><div class="player-map-grid">${mapRooms}</div></div></div>`;
  },
  renderMasterSystems(){
    const el=$('#v030Systems');if(!el||!data)return;
    this.ensure();
    const floor=Number(data.campanha.andarAtual)||5,currentFloor=data.andares.find(a=>Number(a.id)===floor),v=data.campanha.v030;
    const rooms=this.rooms(floor),positions=data.jogadores.filter(p=>Number(this.position(p.id).andar)===floor);
    const regular=rooms.filter(r=>!isSpecialRoom(r)),left=regular.filter((_,i)=>i%2===0),right=regular.filter((_,i)=>i%2===1),specials=rooms.filter(r=>isSpecialRoom(r));
    const roomCard=r=>{const code=this.roomCode(r),key=`${floor}:${code}`,rev=!!v.reveladas[key],ks=roomKiller(floor,r).length,ps=positions.filter(p=>String(this.position(p.id).sala).replace(/^Quarto\s+/i,'')===String(r).replace(/^Quarto\s+/i,''));return `<button class="v030-map-room ${rev?'revealed':''} ${isSpecialRoom(r)?'special':''} ${ks?'danger':''}" onclick="V030.investigate(${floor},'${String(r).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')"><span class="room-code">${esc(code)}</span><b>${esc(String(r).replace(/^Quarto\s+/i,''))}</b><em>${rev?'✓ Investigada':'Não investigada'}</em>${ps.length?`<div class="map-player-dots">${ps.map(p=>`<span title="${esc(p.nome)}">${esc(p.nome.split(' ').map(x=>x[0]).slice(0,2).join(''))}</span>`).join('')}</div>`:''}${ks?`<span class="map-killer-dot">☠ ${ks}</span>`:''}</button>`;};
    const doorKeys=Object.keys(v.portas).filter(k=>k.includes(String(floor))||k.startsWith('escada-'+floor)).slice(0,24);
    const doorHtml=doorKeys.map(k=>{const d=v.portas[k],labels={aberta:'ABERTA',trancada:'TRANCADA',bloqueada:'BLOQUEADA',nada:'NÃO EXISTE',chave:`CHAVE ${d.requerChave||'?'}`};return `<button class="v030-map-door state-${d.estado}" onclick="V030.setDoor('${esc(k)}')"><span>🚪</span><b>${esc(k)}</b><small>${labels[d.estado]||esc(d.estado)}</small></button>`;}).join('');
    const routeUp=floor<9?'TERRAÇO':'',routeDown=floor>5?floor-1:'Térreo';
    el.innerHTML=`<div class="v030-grid refined single-map"><div class="panel v030-panel map-functional-panel"><div class="panel-title"><div><span class="icon">▦</span><div><h2>Mapa funcional</h2><p>${floor}º andar — ${esc(currentFloor?.nome?.replace(/^\d+º Andar — /,'')||'')} • salas, jogadores, portas e ameaças</p></div></div><span class="map-floor-pill">${floor}º</span></div><div class="functional-map"><div class="map-connector top"><span>↑ ${routeDown}</span></div><div class="map-wing"><div class="map-room-column">${left.map(roomCard).join('')}</div><div class="map-core"><div class="map-core-title">CORREDOR CENTRAL</div><div class="map-core-line"></div><div class="map-core-stairs">↕<small>ESCADAS / ELEVADORES</small></div></div><div class="map-room-column">${right.map(roomCard).join('')}</div></div><div class="map-specials">${specials.map(roomCard).join('')}</div><div class="map-connector bottom"><span>↓ ${routeUp||'TERRAÇO'}</span></div></div><div class="map-door-list"><div class="subsection-title">PORTAS E CONEXÕES</div>${doorHtml||'<small class="muted">Sem conexões cadastradas.</small>'}</div></div></div>`;
  },
  render(){this.ensure();this.renderMasterSystems();this.renderPlayerSystems();}
};

const __renderMasterV030=renderMaster;
renderMaster=function(){__renderMasterV030();V030.render();};
const __renderSheetV030=renderSheet;
renderSheet=function(){__renderSheetV030();V030.renderPlayerSystems();};
const __loadDataV030=loadData;
loadData=async function(useSaved=true){await __loadDataV030(useSaved);V030.render();};
