/* Hotel Espelho RPG — módulo consolidado. */

/* --- 56-v082-master-sheet-viewer.js --- */
/* V0.82 — Gerenciador de Fichas dos Jogadores (Mestre)
   Somente leitura: consulta a ficha atual armazenada no estado do Mestre.
*/
(function(){
  'use strict';
  const $=s=>document.querySelector(s);
  const escV=s=>typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const val=(x,d='—')=>x===undefined||x===null||x===''?d:x;
  const pct=(x,max)=>{const a=Number(x)||0,b=Number(max)||0;return b?Math.max(0,Math.min(100,a/b*100)):0};

  function ensureModal(){
    let m=$('#masterPlayerSheetModal');
    if(m)return m;
    m=document.createElement('div');
    m.id='masterPlayerSheetModal';
    m.className='v082-sheet-modal';
    m.setAttribute('aria-hidden','true');
    m.innerHTML='<div class="v082-sheet-backdrop" data-close-master-sheet></div><section class="v082-sheet-dialog" role="dialog" aria-modal="true" aria-labelledby="masterPlayerSheetTitle"><header class="v082-sheet-head"><div><span class="eyebrow">MESTRE • FICHA DO JOGADOR</span><h2 id="masterPlayerSheetTitle">Ficha</h2><p id="masterPlayerSheetSubtitle" class="muted">Somente leitura</p></div><button class="ghost" data-close-master-sheet>✕ FECHAR</button></header><div id="masterPlayerSheetBody" class="v082-sheet-body"></div></section>';
    document.body.appendChild(m);
    m.querySelectorAll('[data-close-master-sheet]').forEach(b=>b.addEventListener('click',close));
    return m;
  }
  function close(){const m=$('#masterPlayerSheetModal');if(m){m.classList.remove('show');m.setAttribute('aria-hidden','true')}}
  function resource(label,current,max,cls){return `<div class="v082-resource ${cls}"><span>${label}</span><b>${val(current,0)}</b><small>/ ${val(max,0)}</small><i><em style="width:${pct(current,max)}%"></em></i></div>`}
  function render(p){
    const m=ensureModal();
    const attrs=p.atributos||{};
    const skills=p.pericias||[];
    const items=p.itens||[];
    const attacks=p.ataques||[];
    const rituals=p.rituais||[];
    const conditions=p.condicoes||p.condicoesAtuais||[];
    const classProfile=(typeof CLASS_PROFILES!=='undefined'&&p.classe)?CLASS_PROFILES[p.classe]:null;
    $('#masterPlayerSheetTitle').textContent=val(p.nome,'Jogador');
    $('#masterPlayerSheetSubtitle').textContent=`${val(p.origem||p.profissao,'Origem não definida')} • ${val(p.classe,'Classe não definida')} • NEX ${val(p.nex,'5%')} • atualização local do Mestre`;
    $('#masterPlayerSheetBody').innerHTML=`
      <div class="v082-identity-strip"><div class="v082-avatar">${escV(String(p.nome||'?').split(' ').map(x=>x[0]).slice(0,2).join(''))}</div><div><strong>${escV(val(p.nome))}</strong><span>${escV(val(p.profissao||p.origem,'Origem não definida'))}</span></div><div class="v082-nex"><small>NEX</small><b>${escV(val(p.nex,'5%'))}</b></div></div>
      <div class="v082-resources">${resource('PV',p.pv,p.pvMax,'pv')}${resource('PE',p.pe,p.peMax,'pe')}${resource('SAN',p.san,p.sanMax,'san')}</div>
      <div class="v082-grid">
        <section class="v082-card"><h3>Atributos</h3><div class="v082-attrs">${Object.entries(attrs).map(([k,v])=>`<div><span>${escV(k)}</span><b>${escV(v)}</b></div>`).join('')||'<small class="muted">Não definidos.</small>'}</div><div class="v082-facts"><span><b>Defesa</b>${escV(val(p.defesa))}</span><span><b>Idade</b>${escV(val(p.idade))}</span><span><b>Origem</b>${escV(val(p.origem||p.profissao))}</span></div></section>
        <section class="v082-card"><h3>Classe</h3><div class="v082-class"><b>${escV(val(p.classe,'Classe não definida'))}</b>${classProfile?`<p>${escV(classProfile.descricao||'')}</p><small>Habilidade NEX 5%: ${escV(classProfile.habilidadeNEX5||'')}</small>`:'<p class="muted">A classe ainda não foi definida.</p>'}</div></section>
        <section class="v082-card v082-wide"><h3>Perícias</h3><div class="v082-list">${skills.map(x=>`<div><b>${escV(typeof skillLabel==='function'?skillLabel(x):x.nome)}</b><span>${x.treinada?'Treinada (+5)':'Não treinada'} • ${escV(typeof skillFormula==='function'?skillFormula(p,x):val(x.teste))}</span></div>`).join('')||'<small class="muted">Nenhuma perícia cadastrada.</small>'}</div></section>
        <section class="v082-card"><h3>Inventário</h3><div class="v082-list">${items.map(i=>`<div><b>${escV(i.nome)} ${i.equipado?'• EQUIPADO':''}</b><span>${escV(val(i.descricao,''))} ${i.quantidade!=null?`• Qtd. ${escV(i.quantidade)}`:''}</span></div>`).join('')||'<small class="muted">Inventário vazio.</small>'}</div></section>
        <section class="v082-card"><h3>Ataques e armas</h3><div class="v082-list">${attacks.map(a=>`<div><b>${escV(a.nome)}</b><span>Teste ${escV(val(a.teste))} • Dano ${escV(val(a.dano))}</span></div>`).join('')||'<small class="muted">Nenhum ataque cadastrado.</small>'}</div></section>
        <section class="v082-card"><h3>Rituais</h3><div class="v082-list">${rituals.map(r=>`<div><b>${escV(r.nome)}</b><span>${escV(val(r.elemento||r.circulo,'Ritual'))}</span></div>`).join('')||'<small class="muted">Nenhum ritual cadastrado.</small>'}</div></section>
        <section class="v082-card"><h3>Condições</h3><div class="v082-chips">${(Array.isArray(conditions)?conditions:Object.values(conditions||{})).map(c=>`<span>${escV(typeof c==='string'?c:(c.nome||c.condicao||'Condição'))}</span>`).join('')||'<small class="muted">Nenhuma condição registrada.</small>'}</div></section>
        <section class="v082-card v082-wide"><h3>Identidade e histórico</h3><div class="v082-story"><div><b>Aparência</b><p>${escV(val(p.aparencia,'Não definida'))}</p></div><div><b>Personalidade</b><p>${escV(val(p.personalidade,'Não definida'))}</p></div><div><b>Histórico</b><p>${escV(val(p.historico,'Não definido'))}</p></div></div></section>
      </div>`;
    m.classList.add('show');m.setAttribute('aria-hidden','false');
  }
  function open(id){
    if(typeof data==='undefined'||!Array.isArray(data.jogadores))return;
    const p=data.jogadores.find(x=>x.id===id);if(!p)return;
    render(p);
  }
  function injectButtons(){
    const host=$('#masterPlayers');if(!host)return;
    host.querySelectorAll('[data-master-view-sheet]').forEach(b=>b.remove());
    host.querySelectorAll('.master-player-card').forEach(card=>{
      const id=card.querySelector('[data-resource]')?.dataset.id;
      if(!id)return;
      const actions=document.createElement('div');actions.className='v082-sheet-action';
      actions.innerHTML=`<button class="dice-btn v082-view-sheet" data-master-view-sheet="${escV(id)}">▣ VER FICHA COMPLETA</button>`;
      card.appendChild(actions);
    });
  }
  function hook(){
    const host=$('#masterPlayers');if(!host||host.__v082)return;
    host.__v082=true;
    host.addEventListener('click',e=>{const b=e.target.closest('[data-master-view-sheet]');if(b)open(b.dataset.masterViewSheet)});
    const original=window.renderMasterBase;
    if(typeof original==='function'&&!original.__v082){
      const wrapped=function(){const r=original.apply(this,arguments);injectButtons();return r};wrapped.__v082=true;window.renderMasterBase=wrapped;
      if(typeof renderMaster==='function'){const oldRender=window.renderMaster;if(!oldRender.__v082){window.renderMaster=function(){const r=oldRender.apply(this,arguments);injectButtons();return r};window.renderMaster.__v082=true;}}
    }
    injectButtons();
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(hook,0));
  setTimeout(hook,600);
  window.MasterPlayerSheetV082={open,close,injectButtons};
})();


/* --- 58-v084-master-delete.js --- */
/* V0.84 — Exclusão de fichas pelo Mestre.
   Exclusão da ficha da mesa atual, com confirmação e limpeza de referências locais.
*/
(function(){
  'use strict';
  const $=s=>document.querySelector(s);
  const escV=s=>typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function deletePlayer(id){
    if(typeof data==='undefined'||!Array.isArray(data.jogadores))return;
    const p=data.jogadores.find(x=>String(x.id)===String(id));
    if(!p)return toast('Ficha não encontrada.');
    const nome=String(p.nome||'Jogador');
    const ok=confirm(`Excluir a ficha de "${nome}"?\n\nEsta ação remove a ficha da mesa atual e não pode ser desfeita pelo jogador.`);
    if(!ok)return;

    // Informa o jogador conectado antes de remover a ficha do estado do Mestre.
    if(window.MultiplayerV071&&typeof MultiplayerV071.deletePlayer==='function'){
      MultiplayerV071.deletePlayer(p.id);
    }

    data.jogadores=data.jogadores.filter(x=>String(x.id)!==String(id));

    // Limpa referências de estado que apontavam para a ficha removida.
    if(data.campanha){
      if(data.campanha.v030?.posicoesJogadores)delete data.campanha.v030.posicoesJogadores[p.id];
      if(data.campanha.hotelEspelho?.posicoes)delete data.campanha.hotelEspelho.posicoes[p.id];
      if(data.campanha.posicoesJogadores)delete data.campanha.posicoesJogadores[p.id];
      const combat=data.campanha.combateV071;
      if(combat?.ordem)combat.ordem=combat.ordem.filter(x=>String(x)!==String(id));
      if(combat?.ordem?.length===0&&combat.ativo)combat.ativo=false;
      if(combat?.indice>=combat.ordem.length)combat.indice=Math.max(0,combat.ordem.length-1);
      if(data.campanha.motorV070?.combate?.iniciativa)data.campanha.motorV070.combate.iniciativa=data.campanha.motorV070.combate.iniciativa.filter(x=>String(x.id)!==String(id));
    }

    if(typeof selectedPlayer!=='undefined'&&selectedPlayer?.id===p.id)selectedPlayer=null;
    if(typeof saveLocal==='function')saveLocal();
    if(typeof renderPlayerCards==='function')renderPlayerCards();
    if(typeof renderMaster==='function')renderMaster();
    if(typeof renderCampaign==='function')renderCampaign();
    if(typeof renderSheet==='function'&&typeof selectedPlayer!=='undefined'&&selectedPlayer)renderSheet();
    toast(`Ficha de ${nome} excluída da mesa.`);
  }

  function inject(){
    const host=$('#masterPlayers');if(!host)return;
    host.querySelectorAll('.v084-delete-sheet').forEach(b=>b.remove());
    host.querySelectorAll('.master-player-card').forEach(card=>{
      const input=card.querySelector('[data-resource][data-id]');
      const id=input?.dataset.id;
      if(!id)return;
      let actions=card.querySelector('.v084-sheet-actions');
      if(!actions){actions=document.createElement('div');actions.className='v084-sheet-actions';card.appendChild(actions);}
      actions.innerHTML=`<button type="button" class="ghost v084-delete-sheet" data-master-delete-sheet="${escV(id)}">🗑 EXCLUIR FICHA</button>`;
    });
  }

  function hook(){
    const host=$('#masterPlayers');if(!host||host.__v084Delete)return;
    host.__v084Delete=true;
    host.addEventListener('click',e=>{
      const b=e.target.closest('[data-master-delete-sheet]');
      if(b){e.preventDefault();e.stopPropagation();deletePlayer(b.dataset.masterDeleteSheet);}
    });
    const old=window.renderMasterBase;
    if(typeof old==='function'&&!old.__v084Delete){
      const wrapped=function(){const r=old.apply(this,arguments);inject();return r};
      wrapped.__v084Delete=true;window.renderMasterBase=wrapped;
    }
    inject();
  }

  document.addEventListener('DOMContentLoaded',()=>setTimeout(hook,0));
  setTimeout(hook,500);
  window.MasterPlayerDeleteV084={delete:deletePlayer,inject};
})();


/* --- 59-v085-unified-map.js --- */
/* V0.85 — Mapa unificado: exploração + mapa funcional do Hotel Espelho. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id), h=v=>typeof esc==='function'?esc(v):String(v??'');
  function ensure(){
    data.campanha=data.campanha||{};data.campanha.v085=data.campanha.v085||{};
    data.campanha.v085.zoom=Number(data.campanha.v085.zoom)||1;
    if(typeof V030!=='undefined'&&V030.ensure)V030.ensure();
  }
  function floor(){ensure();return data.andares.find(a=>Number(a.id)===Number(data.campanha.andarAtual))||data.andares.find(a=>Number(a.id)===5);}
  function pos(pid){return typeof V030!=='undefined'&&V030.position?V030.position(pid):{andar:5,sala:'501'};}
  function roomCode(r){return typeof V030!=='undefined'&&V030.roomCode?V030.roomCode(r):String(r).replace(/\D/g,'');}
  function investigated(f,r){return typeof getInvestigatedRooms==='function'&&getInvestigatedRooms(f).includes(r);}
  function render(){
    const el=$('hotelMap');if(!el||!data)return;ensure();const f=floor(),fid=Number(f?.id||5),rooms=Array.isArray(f?.salas)?f.salas:[];
    const killers=(data.assassinos||[]).filter(k=>Number(k.andar)===fid);
    const players=(data.jogadores||[]).filter(p=>Number(pos(p.id).andar)===fid);
    const floors=(data.andares||[]).slice().sort((a,b)=>b.id-a.id).map(a=>`<button class="map-floor-btn ${Number(a.id)===fid?'active':''}" onclick="V085.setFloor(${a.id})"><span>${a.id}º</span><small>${h(String(a.nome||'').replace(/^\d+º Andar — /,''))}</small></button>`).join('');
    const cards=rooms.map((r,i)=>{const code=roomCode(r), special=typeof isSpecialRoom==='function'&&isSpecialRoom(r), done=investigated(fid,r), ps=players.filter(p=>String(pos(p.id).sala).replace(/^Quarto\s+/i,'')===String(r).replace(/^Quarto\s+/i,'')), ks=killers.filter(k=>String(k.sala||'')===String(r));return `<button class="hotel-room v085-room ${done?'investigated':''} ${special?'special':''} ${ks.length?'killer-present':''}" onclick="V085.investigate(${fid},'${String(r).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')"><span class="room-number">${special?'✦':String(i+1).padStart(2,'0')}</span><span class="room-name">${h(r)}</span><span class="v085-room-code">${h(code)}</span>${done?'<span class="room-status">✓</span>':''}${ps.length?`<span class="v085-player-marker">● ${ps.map(p=>h(p.nome.split(' ').map(x=>x[0]).slice(0,2).join(''))).join(' ')}</span>`:''}${ks.length?`<span class="killer-marker">☠ ${ks.length}</span>`:''}</button>`;}).join('');
    const exits=`<div class="v085-exits"><b>ROTAS / SAÍDAS</b><span>${fid>5?'↓ '+(fid-1)+'º andar / Hall':'↓ Térreo — Hall'}</span><span>${fid<9?'↑ '+(fid+1)+'º andar / Terraço':'↑ Terraço'}</span></div>`;
    const doorKeys=(data.campanha.v030?.portas?Object.keys(data.campanha.v030.portas):[]).filter(k=>k.includes(String(fid))||k.startsWith('escada-'+fid)).slice(0,24);
    const doors=doorKeys.map(k=>{const d=data.campanha.v030.portas[k]||{},labels={aberta:'ABERTA',trancada:'TRANCADA',bloqueada:'BLOQUEADA',nada:'NÃO EXISTE',chave:'CHAVE '+(d.requerChave||'?')};return `<button class="v085-door state-${h(d.estado||'aberta')}" onclick="V085.toggleDoor('${h(k)}')">🚪 <b>${h(k)}</b><small>${h(labels[d.estado]||d.estado||'ABERTA')}</small></button>`;}).join('');
    const threat=killers.map(k=>`<div class="v085-threat"><span>☠</span><div><b>${h(k.nome)}</b><small>${h(k.sala||'Localização secreta')} • ${h(k.estado||'Inativo')}</small></div><button class="dice-btn secondary" onclick="V085.moveKiller('${h(k.id)}')">MOVER</button></div>`).join('')||'<small class="muted">Nenhum assassino neste andar.</small>';
    const pList=players.map(p=>`<div class="v085-threat"><span>●</span><div><b>${h(p.nome)}</b><small>Sala ${h(pos(p.id).sala)} • PV ${p.pv}/${p.pvMax}</small></div></div>`).join('')||'<small class="muted">Nenhum jogador neste andar.</small>';
    el.innerHTML=`<div class="panel-title"><div><span class="icon">▦</span><div><h2>Mapa Unificado — Hotel Espelho</h2><p>Exploração, investigação, portas, posições e ameaças em uma única interface.</p></div></div><div class="v085-map-tools"><button class="ghost small" onclick="V085.zoom(-.1)">−</button><b>${Math.round(data.campanha.v085.zoom*100)}%</b><button class="ghost small" onclick="V085.zoom(.1)">＋</button></div></div><div class="hotel-map-layout v085-unified-layout"><aside class="map-floors"><div class="map-floor-title">ANDARES</div>${floors}${exits}</aside><div class="map-main"><div class="map-floor-header"><div><p class="eyebrow">ANDAR ${fid}</p><h3>${h(f.nome)}</h3></div><div class="map-route-tags"><span>🧭 MAPA UNIFICADO</span></div></div><div class="hotel-floor-plan v085-zoom" style="--map-zoom:${data.campanha.v085.zoom}"><div class="floor-corridor"><span>◎ CORREDOR CENTRAL</span><i></i><span>↕ ESCADAS / ELEVADORES</span></div><div class="hotel-rooms-grid">${cards}</div></div><div class="v085-doors"><h3>PORTAS E CONEXÕES</h3>${doors||'<small class="muted">Sem conexões cadastradas.</small>'}</div></div><aside class="map-side"><h3>JOGADORES</h3>${pList}<h3>AMEAÇAS</h3>${threat}<div class="map-help"><small>• Clique em uma sala para investigar.</small><small>• Portas alternam entre os estados cadastrados.</small><small>• ● indica jogadores no ambiente; ☠ indica assassinos.</small></div></aside></div>`;
  }
  function setFloor(f){data.campanha.andarAtual=Number(f)||5;ensure();saveLocal();render();if(typeof V030!=='undefined')V030.renderPlayerSystems?.();}
  function investigate(f,r){if(typeof V030!=='undefined'&&V030.investigate)V030.investigate(f,r);else if(typeof toggleRoomInvestigated==='function'){toggleRoomInvestigated(Number(f),r);saveLocal();render();}}
  function toggleDoor(k){if(typeof V030!=='undefined'&&V030.setDoor)V030.setDoor(k);}
  function moveKiller(id){if(typeof moveKillerFromMap==='function')moveKillerFromMap(id);}
  function zoom(delta){ensure();data.campanha.v085.zoom=Math.max(.7,Math.min(1.4,Number(data.campanha.v085.zoom)+delta));saveLocal();render();}
  const old=window.renderHotelMap;window.renderHotelMap=render;
  const boot=()=>{if(typeof data==='undefined'||!data)return setTimeout(boot,100);render();};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.V085={render,setFloor,investigate,toggleDoor,moveKiller,zoom};
})();


/* --- 60-v086-combat-ui.js --- */
/* V0.86 — Central de combate aprimorada para uso presencial. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id),h=v=>typeof esc==='function'?esc(v):String(v??'');
  function ensure(){data.campanha=data.campanha||{};data.campanha.combateV071=data.campanha.combateV071||{ativo:false,rodada:1,ordem:[],indice:0,historico:[]};return data.campanha.combateV071;}
  const ent=id=>{const all=[...(data.jogadores||[]),...(data.monstros||[]),...(data.assassinos||[])];return all.find(x=>String(x.id)===String(id));};
  const alive=x=>x&&Number(x.pv??1)>0;
  function render(){const host=$('v071CombatPanel');if(!host||!data)return;const c=ensure();if(!c.ativo){if(typeof CombatV071!=='undefined'&&CombatV071._renderBase)return CombatV071._renderBase();return;}const cur=ent(c.ordem[c.indice]);const rows=c.ordem.map((id,i)=>{const x=ent(id);if(!x)return '';const pct=Math.max(0,Math.min(100,(Number(x.pv)||0)/(Number(x.pvMax??x.pvBase??1)||1)*100));return `<button class="v086-turn-card ${i===c.indice?'active':''} ${alive(x)?'':'dead'}" onclick="CombatV086.select('${h(x.id)}')"><span class="v086-init">${i+1}</span><div><b>${h(x.nome)}</b><small>${h(x.tipo||'Participante')} • PV ${x.pv}/${x.pvMax??x.pvBase??'—'}</small><div class="v086-hp"><i style="width:${pct}%"></i></div></div><strong>${i===c.indice?'▶':''}</strong></button>`;}).join('');const attacks=(typeof attackList==='function'?attackList(cur):[]).map((a,i)=>`<button class="dice-btn" onclick="CombatV071.rollAttack('${h(cur.id)}',${i})">🎲 ${h(a.nome)}</button>`).join('');const hp=(c.ordem||[]).map(id=>ent(id)).filter(Boolean).map(x=>`<div class="v086-resource-row"><div><b>${h(x.nome)}</b><small>${h(x.tipo||'Participante')}</small></div><label>PV<input type="number" min="0" max="${Number(x.pvMax??x.pvBase??9999)}" value="${Number(x.pv??0)}" onchange="CombatV071.setHP('${h(x.id)}',this.value)"></label><button class="ghost small" onclick="CombatV071.damage('${h(x.id)}',prompt('Dano em ${h(x.nome)}:')||0)">− DANO</button><button class="ghost small" onclick="CombatV071.heal('${h(x.id)}',prompt('Cura em ${h(x.nome)}:')||0)">＋ CURA</button></div>`).join('');const hist=(c.historico||[]).slice(0,12).map(e=>`<div><time>${new Date(e.at).toLocaleTimeString()}</time><span>${h(e.text)}</span></div>`).join('')||'<small class="muted">Sem eventos.</small>';
    host.innerHTML=`<div class="panel-title"><div><span class="icon">⚔</span><div><p class="eyebrow">COMBATE EM ANDAMENTO</p><h2>Rodada ${c.rodada} • ${h(cur?.nome||'—')}</h2><p>Controle de turno, PV e ações rápidas.</p></div></div><button class="ghost small" onclick="CombatV071.stop()">ENCERRAR</button></div><div class="v086-combat-layout"><section><h3>Iniciativa</h3><div class="v086-turn-list">${rows}</div></section><section><div class="v086-current"><span>TURNO ATUAL</span><b>${h(cur?.nome||'—')}</b><div class="v086-turn-actions"><button class="primary" onclick="CombatV071.prev()">← ANTERIOR</button><button class="primary" onclick="CombatV071.next()">PRÓXIMO →</button></div>${attacks||'<small class="muted">Nenhum ataque cadastrado.</small>'}</div><h3>Recursos</h3><div class="v086-resource-list">${hp}</div></section></div><details class="v071-history" open><summary>Histórico</summary>${hist}</details>`;
  }
  function select(id){const c=ensure();const i=c.ordem.findIndex(x=>String(x)===String(id));if(i<0)return;c.indice=i;saveLocal();render();}
  function boot(){if(typeof CombatV071==='undefined'||!data)return setTimeout(boot,100);if(!CombatV071._renderBase)CombatV071._renderBase=window.renderCombatPanel;window.renderCombatPanel=render;render();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.CombatV086={render,select};
})();

