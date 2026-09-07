/* Hotel Espelho RPG — módulo consolidado. */

/* --- 63-v089-098-suite.js --- */
/*
 * HOTEL ESPELHO — V0.89 → V0.98
 * Camada final para mesa presencial.
 * Mantém o estado existente compatível e concentra as novas ferramentas em uma UI única.
 */
(function(){
  'use strict';
  const VERSION='0.98';
  const $=id=>document.getElementById(id);
  const escv=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const clone=o=>{try{return JSON.parse(JSON.stringify(o));}catch(e){return o;}};
  const campaign=()=>{data.campanha=data.campanha||{};return data.campanha;};
  const state=()=>{const c=campaign();c.v098=c.v098||{};const s=c.v098;s.versao=VERSION;s.historico=Array.isArray(s.historico)?s.historico:[];s.eventos=Array.isArray(s.eventos)?s.eventos:[];s.sincronizacao=s.sincronizacao||{ultima:null};return s;};
  function persist(reason){const s=state();s.sincronizacao.ultima=Date.now();if(reason){s.historico.unshift({at:Date.now(),texto:String(reason)});s.historico=s.historico.slice(0,100);}try{if(typeof saveLocal==='function')saveLocal();}catch(e){console.error(e);}}
  function refreshAll(){try{if(typeof renderMaster==='function')renderMaster();}catch(e){}try{if(typeof renderSheet==='function'&&selectedPlayer)renderSheet();}catch(e){}try{if(window.CombatV090)window.CombatV090.render();}catch(e){}try{if(window.HotelMapV093)window.HotelMapV093.render();}catch(e){}}

  /* V0.89 — estabilidade e diagnóstico */
  const StabilityV089={
    audit(){
      const issues=[];
      if(!Array.isArray(data?.jogadores))issues.push('Jogadores inválidos');
      if(!Array.isArray(data?.andares)||data.andares.length<9)issues.push('Andares incompletos');
      if(typeof saveLocal!=='function')issues.push('Persistência ausente');
      if(typeof renderMaster!=='function')issues.push('Render do Mestre ausente');
      if(!$('hotelMap'))issues.push('Mapa não encontrado');
      return {ok:!issues.length,issues,version:VERSION,at:Date.now()};
    },
    migrate(){const s=state();s.arquitetura=s.arquitetura||{};s.arquitetura.v089='stable';s.arquitetura.camadas=['core','rules','player','master','hotel','combat','multiplayer','session','horror'];persist('V0.89: arquitetura estável inicializada.');return this.audit();}
  };

  /* V0.90 — motor de combate único para a mesa */
  const CombatV090={
    ensure(){
      const c=campaign();
      c.combateV071=c.combateV071||{};
      const x=c.combateV071;
      x.ativo=Boolean(x.ativo);x.rodada=Math.max(1,Number(x.rodada)||1);x.indice=Math.max(0,Number(x.indice)||0);x.ordem=Array.isArray(x.ordem)?x.ordem:[];x.historico=Array.isArray(x.historico)?x.historico:[];
      return x;
    },
    entities(){return [...(data.jogadores||[]),...(data.monstros||[]),...(data.assassinos||[])];},
    get(id){return this.entities().find(x=>String(x.id)===String(id));},
    log(text){const c=this.ensure();c.historico.unshift({at:Date.now(),text:String(text)});c.historico=c.historico.slice(0,60);state().historico.unshift({at:Date.now(),texto:String(text)});state().historico=state().historico.slice(0,100);},
    initiative(x){const agi=Number(x?.atributos?.AGI)||0;return Math.floor(Math.random()*20)+1+agi;},
    start(ids){
      const c=this.ensure(); if(c.ativo)return toast('Já existe um combate ativo.');
      let list=(ids||[]).map(String).map(id=>this.get(id)).filter(Boolean);
      if(!list.length)list=this.entities().filter(x=>x&&Number(x.pv??1)>0&&((x.id||'').startsWith('p')||x.ativo===true));
      if(!list.length)return toast('Não há participantes válidos para iniciar o combate.');
      c.ordem=list.map(x=>({id:x.id,init:this.initiative(x)})).sort((a,b)=>b.init-a.init).map(x=>x.id);
      c.indice=0;c.rodada=1;c.ativo=true;c.historico=[];this.log(`Combate iniciado com ${list.length} participante(s).`);persist('Combate iniciado.');this.render();this.sync();toast('Combate iniciado.');
    },
    stop(){const c=this.ensure();if(!c.ativo)return;this.log('Combate encerrado.');c.ativo=false;c.ordem=[];c.indice=0;c.rodada=1;persist('Combate encerrado.');this.render();this.sync();},
    next(){const c=this.ensure();if(!c.ativo)return toast('Nenhum combate ativo.');if(!c.ordem.length)return; c.indice++;if(c.indice>=c.ordem.length){c.indice=0;c.rodada++;this.log(`Rodada ${c.rodada} iniciada.`);}persist('Próximo turno.');this.render();this.sync();},
    prev(){const c=this.ensure();if(!c.ativo||!c.ordem.length)return;c.indice--;if(c.indice<0){c.indice=c.ordem.length-1;c.rodada=Math.max(1,c.rodada-1);}persist('Turno anterior.');this.render();this.sync();},
    setHP(id,value){const x=this.get(id);if(!x)return;const max=Number(x.pvMax??x.pvBase??9999);x.pv=Math.max(0,Math.min(max,Number(value)||0));this.log(`${x.nome}: PV ajustado para ${x.pv}/${max}.`);persist(`PV de ${x.nome} alterado.`);this.render();this.sync();},
    damage(id,value){const x=this.get(id);const n=Math.max(0,Number(value)||0);if(!x||!n)return;const before=Number(x.pv)||0;x.pv=Math.max(0,before-n);this.log(`${x.nome} sofreu ${n} dano (${before} → ${x.pv}).`);persist(`${x.nome} sofreu dano.`);this.render();this.sync();},
    heal(id,value){const x=this.get(id);const n=Math.max(0,Number(value)||0);if(!x||!n)return;const max=Number(x.pvMax??x.pvBase??9999),before=Number(x.pv)||0;x.pv=Math.min(max,before+n);this.log(`${x.nome} recuperou ${x.pv-before} PV.`);persist(`${x.nome} recuperou PV.`);this.render();this.sync();},
    addParticipant(id){const c=this.ensure(),x=this.get(id);if(!x)return;if(!c.ordem.some(v=>String(v)===String(id)))c.ordem.push(id);persist(`Participante adicionado: ${x.nome}.`);this.render();this.sync();},
    removeParticipant(id){const c=this.ensure();c.ordem=c.ordem.filter(v=>String(v)!==String(id));c.indice=Math.min(c.indice,Math.max(0,c.ordem.length-1));persist('Participante removido do combate.');this.render();this.sync();},
    attack(attackerId,targetId,index){const a=this.get(attackerId),t=this.get(targetId);if(!a||!t)return;const atk=Array.isArray(a.ataques)?a.ataques[index]:null;if(!atk)return;const roll=this.roll(atk.teste||'1d20');const def=Number(t.defesa??10);const hit=roll.total>=def;let damage=null;if(hit&&atk.dano)damage=this.roll(atk.dano);if(damage)t.pv=Math.max(0,(Number(t.pv)||0)-damage.total);this.log(`${a.nome} usou ${atk.nome} contra ${t.nome}: ${roll.total} vs ${def} — ${hit?'ACERTO':'FALHA'}${damage?` — ${damage.total} dano`:''}.`);persist('Ataque resolvido.');this.render();this.sync();return {roll,hit,damage};},
    roll(formula){const m=String(formula||'').replace(/\s/g,'').match(/^(\d+)d(\d+)([+-]\d+)?$/i);if(!m)return {total:0,formula:String(formula||''),valid:false};const n=Number(m[1]),s=Number(m[2]),mod=Number(m[3]||0),dice=Array.from({length:Math.min(n,100)},()=>Math.floor(Math.random()*s)+1);return {total:dice.reduce((a,b)=>a+b,0)+mod,dice,mod,formula:String(formula),valid:true};},
    sync(){try{window.MultiplayerV071?.broadcastCombat?.();}catch(e){}},
    render(){
      const host=$('v071CombatPanel');if(!host)return;const c=this.ensure();
      if(!c.ativo){host.innerHTML=`<div class="v090-empty-combat"><b>⚔ COMBATE INATIVO</b><small>Inicie um encontro pelo painel abaixo.</small><button class="primary" onclick="CombatV090.openStart()">INICIAR COMBATE</button></div>`;return;}
      const cur=this.get(c.ordem[c.indice]);
      const rows=c.ordem.map((id,i)=>{const x=this.get(id);if(!x)return '';const max=Number(x.pvMax??x.pvBase??1)||1,pv=Math.max(0,Number(x.pv)||0),pct=Math.min(100,pv/max*100);return `<button class="v090-turn ${i===c.indice?'current':''} ${pv<=0?'dead':''}" onclick="CombatV090.select(${i})"><span>${i+1}</span><div><b>${escv(x.nome)}</b><small>${escv(x.tipo||x.classe||'Participante')} • PV ${pv}/${max}</small><i style="width:${pct}%"></i></div>${i===c.indice?'<strong>▶</strong>':''}</button>`}).join('');
      const targets=this.entities().filter(x=>Number(x.pv??1)>0&&String(x.id)!==String(cur?.id));
      const attacks=(cur?.ataques||[]).map((a,i)=>`<button class="dice-btn" onclick="CombatV090.rollAttack('${escv(cur.id)}',${i})">🎲 ${escv(a.nome)} <small>${escv(a.teste||'—')} / ${escv(a.dano||'—')}</small></button>`).join('');
      const res=c.ordem.map(id=>this.get(id)).filter(Boolean).map(x=>`<div class="v090-resource"><div><b>${escv(x.nome)}</b><small>PV ${Number(x.pv)||0}/${Number(x.pvMax??x.pvBase??0)}</small></div><input type="number" min="0" max="${Number(x.pvMax??x.pvBase??9999)}" value="${Number(x.pv)||0}" onchange="CombatV090.setHP('${escv(x.id)}',this.value)"><button class="ghost small" onclick="CombatV090.damage('${escv(x.id)}',prompt('Dano em ${escv(x.nome)}:')||0)">−</button><button class="ghost small" onclick="CombatV090.heal('${escv(x.id)}',prompt('Cura em ${escv(x.nome)}:')||0)">＋</button></div>`).join('');
      const hist=(c.historico||[]).slice(0,12).map(e=>`<div><time>${new Date(e.at).toLocaleTimeString('pt-BR')}</time><span>${escv(e.text)}</span></div>`).join('')||'<small class="muted">Sem eventos.</small>';
      host.innerHTML=`<div class="panel-title"><div><span class="icon">⚔</span><div><p class="eyebrow">V0.90 • COMBATE</p><h2>Rodada ${c.rodada}</h2><p>Turno atual: <b>${escv(cur?.nome||'—')}</b></p></div></div><button class="ghost small" onclick="CombatV090.stop()">ENCERRAR</button></div><div class="v090-combat-grid"><section><h3>Iniciativa</h3><div class="v090-turn-list">${rows}</div></section><section><div class="v090-current"><span>TURNO ATUAL</span><h3>${escv(cur?.nome||'—')}</h3><div class="v090-turn-buttons"><button class="primary" onclick="CombatV090.prev()">← ANTERIOR</button><button class="primary" onclick="CombatV090.next()">PRÓXIMO →</button></div><h3>Ataques</h3>${attacks||'<small class="muted">Nenhum ataque cadastrado.</small>'}<label>Alvo<select id="v090Target" class="control-select"><option value="">Selecione</option>${targets.map(x=>`<option value="${escv(x.id)}">${escv(x.nome)} • DEF ${Number(x.defesa??10)}</option>`).join('')}</select></label></div><h3>Recursos</h3><div>${res}</div></section></div><details class="v090-history" open><summary>Histórico</summary>${hist}</details>`;
    },
    select(i){const c=this.ensure();if(i<0||i>=c.ordem.length)return;c.indice=i;persist('Turno selecionado.');this.render();this.sync();},
    openStart(){
      const available=this.entities().filter(x=>x&&Number(x.pv??1)>0);const choices=available.map(x=>`<label class="v090-check"><input type="checkbox" value="${escv(x.id)}" checked> ${escv(x.nome)} <small>${escv(x.tipo||x.classe||'')}</small></label>`).join('');
      openSimpleModal('v090StartModal',`<div class="panel v090-start-box"><button class="close" onclick="closeSimpleModal('v090StartModal')">×</button><p class="eyebrow">NOVO COMBATE</p><h2>Participantes</h2><div class="v090-check-list">${choices}</div><button class="primary" onclick="CombatV090.start([...document.querySelectorAll('#v090StartModal input:checked')].map(x=>x.value));closeSimpleModal('v090StartModal')">INICIAR</button></div>`);
    },
    rollAttack(id,index){const target=$('v090Target')?.value;if(!target)return toast('Selecione um alvo antes de atacar.');return this.attack(id,target,index);}
  };

  function openSimpleModal(id,html){let m=$(id);if(!m){m=document.createElement('div');m.id=id;m.className='v098-modal modal';document.body.appendChild(m);}m.innerHTML=html;m.classList.add('open');m.setAttribute('aria-hidden','false');}
  function closeSimpleModal(id){const m=$(id);if(m){m.classList.remove('open');m.setAttribute('aria-hidden','true');}}

  /* V0.91 — ficha digital + autoridade do Mestre */
  const SheetV091={
    renderToolbar(){
      const s=$('playerSheet');if(!s)return;let bar=$('v091SheetBar');if(!bar){bar=document.createElement('div');bar.id='v091SheetBar';bar.className='panel v091-sheet-bar';s.prepend(bar);}
      const p=selectedPlayer; if(!p){bar.innerHTML='';return;}bar.innerHTML=`<div><b>👤 ${escv(p.nome)}</b><small>${escv(p.classe||'Classe não definida')} • NEX ${escv(p.nex||'5%')}</small></div><div class="v091-res"><span>❤️ ${Number(p.pv)||0}/${Number(p.pvMax)||0}</span><span>⚡ ${Number(p.pe)||0}/${Number(p.peMax)||0}</span><span>🧠 ${Number(p.san)||0}/${Number(p.sanMax)||0}</span></div><span id="v092PlayerSync" class="v092-sync">● verificando…</span>`;
    }
  };

  /* V0.92 — sincronização e reconexão */
  const SyncV092={
    status(){try{return window.MultiplayerV071?.status?.()||{role:'offline',connected:false,players:0};}catch(e){return {role:'offline',connected:false,players:0};}},
    label(){const s=this.status();if(s.role==='host'&&s.connected)return `🟢 Mesa ativa • ${s.players} conectado(s)`;if(s.role==='player'&&s.connected)return '🟢 Conectado ao Mestre';if(s.role==='host')return '🟡 Mestre aguardando jogadores';if(s.role==='player')return '🟡 Conectando ao Mestre';return '⚪ Modo local';},
    render(){
      const text=this.label();const ids=['v092PlayerSync','v092MasterSync'];ids.forEach(id=>{const e=$(id);if(e)e.textContent=text;});const top=document.querySelector('.status');if(top)top.innerHTML=`<i></i> ${escv(text)}`;
    },
    mount(){
      const master=$('masterScreen');if(master&&!$('v092MasterSync')){const e=document.createElement('span');e.id='v092MasterSync';e.className='v092-sync master-sync';const h=master.querySelector('.hero');h?.appendChild(e);}this.render();
    }
  };

  /* V0.93 — mapa 2.0, sem VTT: controle narrativo presencial */
  const HotelMapV093={
    render(){
      const el=$('hotelMap');if(!el||!data)return;const floor=Number(campaign().andarAtual)||5;const rooms=typeof getFloorRooms==='function'?getFloorRooms(floor):[];const positions=campaign().v030?.posicoesJogadores||campaign().hotelEspelho?.posicoes||{};const players=(data.jogadores||[]).filter(p=>Number(positions[p.id]?.andar||floor)===floor);const killers=(data.assassinos||[]).filter(k=>Number(k.andar)===floor&&k.ativo);
      const roomHTML=rooms.map(room=>{const key=`${floor}:${room}`;const inv=campaign().salasInvestigadas?.[key]||campaign().salasInvestigadas?.[room]||false;const ps=players.filter(p=>positions[p.id]?.sala===room).map(p=>`<span class="v093-marker player">👤 ${escv(p.nome.split(' ')[0])}</span>`).join('');return `<button class="v093-room ${inv?'investigated':''}" onclick="HotelMapV093.room('${escv(room)}')"><b>${escv(room)}</b><small>${inv?'✓ Investigado':'Não investigado'}</small>${ps}</button>`}).join('');
      const floorBtns=[...Array(9)].map((_,i)=>i+1).map(n=>`<button class="${n===floor?'active':''}" onclick="HotelMapV093.floor(${n})">${n}º</button>`).join('');
      const doors=Object.entries(campaign().v030?.portas||{}).filter(([k])=>k.includes(String(floor))||k.startsWith(`escada-${floor}`)).slice(0,24).map(([k,d])=>{const label={aberta:'ABERTA',trancada:'TRANCADA',bloqueada:'BLOQUEADA',nada:'NÃO EXISTE'}[d?.estado]||`CHAVE ${d?.requerChave||'?'}`;return `<button class="v093-door" onclick="HotelMapV093.toggleDoor('${escv(k)}')">🚪 <b>${escv(k)}</b><small>${escv(label)}</small></button>`}).join('');
      el.innerHTML=`<div class="v093-head"><div><p class="eyebrow">V0.93 • MAPA DO HOTEL</p><h2>${floor}º Andar</h2><p>${escv((data.andares?.find(a=>Number(a.id)===floor)?.nome||'Hotel Espelho'))}</p></div><div class="v093-map-actions"><button class="ghost small" onclick="HotelMapV093.zoom(-10)">−</button><span id="v093Zoom">100%</span><button class="ghost small" onclick="HotelMapV093.zoom(10)">＋</button></div></div><div class="v093-floorbar">${floorBtns}</div><div class="v093-map"><div><div class="v093-grid">${roomHTML||'<small class="muted">Nenhum ambiente cadastrado.</small>'}</div><div class="v093-doors"><h3>🚪 PORTAS E CONEXÕES</h3>${doors||'<small class="muted">Sem conexões cadastradas.</small>'}</div></div><aside class="v093-side"><b>NO ANDAR</b><div>${players.map(p=>`<span class="v093-list player">👤 ${escv(p.nome)}</span>`).join('')||'<small>Nenhum jogador identificado.</small>'}</div><b>AMEAÇAS ATIVAS</b><div>${killers.map(k=>`<span class="v093-list killer">☠ ${escv(k.nome)}</span>`).join('')||'<small>Nenhuma.</small>'}</div><b>SAÍDAS</b><small>↓ Hall no térreo</small><small>↑ Terraço acima do 9º</small></aside></div>`;
      const z=Number(campaign().v098?.mapZoom)||100;el.style.setProperty('--v093-zoom',`${z/100}`);if($('v093Zoom'))$('v093Zoom').textContent=`${z}%`;
    },
    floor(n){campaign().andarAtual=Math.max(1,Math.min(9,Number(n)||5));persist(`Mapa: ${campaign().andarAtual}º andar.`);this.render();},
    zoom(delta){const s=state();s.mapZoom=Math.max(70,Math.min(140,(Number(s.mapZoom)||100)+delta));this.render();},
    room(room){const f=Number(campaign().andarAtual)||5;openSimpleModal('v093RoomModal',`<div class="panel v093-room-modal"><button class="close" onclick="closeSimpleModal('v093RoomModal')">×</button><p class="eyebrow">${f}º ANDAR</p><h2>${escv(room)}</h2><p>Use esta sala como ponto de controle narrativo. O estado da investigação permanece sob comando do Mestre.</p><div class="v093-actions"><button class="primary" onclick="HotelMapV093.investigate('${escv(room)}');closeSimpleModal('v093RoomModal')">MARCAR INVESTIGADA</button><button class="ghost" onclick="closeSimpleModal('v093RoomModal')">FECHAR</button></div></div>`);},
    investigate(room){const c=campaign();c.salasInvestigadas=c.salasInvestigadas||{};c.salasInvestigadas[`${Number(c.andarAtual)||5}:${room}`]=true;persist(`Sala investigada: ${room}.`);this.render();refreshAll();},
    toggleDoor(key){if(window.V030?.setDoor){window.V030.setDoor(key);return;}const c=campaign();c.v030=c.v030||{};c.v030.portas=c.v030.portas||{};const d=c.v030.portas[key]||{estado:'aberta',requerChave:null};const order=['aberta','trancada','bloqueada'];d.estado=order[(order.indexOf(d.estado)+1)%order.length];c.v030.portas[key]=d;persist(`Porta ${key}: ${d.estado}.`);this.render();}
  };

  /* V0.94 — ameaças e assassinos integrados ao mapa/combate */
  const ThreatV094={
    toggleKiller(id){const k=(data.assassinos||[]).find(x=>String(x.id)===String(id));if(!k)return;k.ativo=!k.ativo;k.estado=k.ativo?'Ativo':'Oculto';persist(`${k.nome} ${k.ativo?'ativado':'ocultado'}.`);refreshAll();},
    moveKiller(id){const k=(data.assassinos||[]).find(x=>String(x.id)===String(id));if(!k)return;const n=prompt(`Novo andar para ${k.nome} (1–9, exceto 5):`,String(k.andar||4));if(n===null)return;const floor=Math.max(1,Math.min(9,Number(n)||1));if(floor===5)return toast('Os assassinos não podem ocupar o 5º andar.');k.andar=floor;k.sala='Oculto';persist(`${k.nome} movido para o ${floor}º andar.`);refreshAll();},
    render(){const el=$('killerInfo');if(!el||!data)return;el.innerHTML=(data.assassinos||[]).map(k=>`<div class="v094-killer-card ${k.ativo?'active':''}"><div><b>🔪 ${escv(k.nome)}</b><small>${escv(k.elemento)} • ${k.ativo?'ATIVO':'OCULTO'} • ${Number(k.andar)||'?'}º andar</small></div><div><button class="ghost small" onclick="ThreatV094.toggleKiller('${escv(k.id)}')">${k.ativo?'OCULTAR':'ATIVAR'}</button><button class="ghost small" onclick="ThreatV094.moveKiller('${escv(k.id)}')">MOVER</button></div></div>`).join('');}
  };

  /* V0.95 — investigação compacta e integrada */
  const InvestigationV095={
    render(){
      const target=$('puzzleInfo');if(!target)return;const c=campaign();const solved=(data.enigmas||[]).filter(x=>x.resolvido||x.status==='resolvido').length;const total=(data.enigmas||[]).length;target.insertAdjacentHTML('beforeend',`<div class="v095-investigation-summary"><b>🔎 INVESTIGAÇÃO</b><span>${solved}/${total} enigmas resolvidos</span><span>${Object.values(c.salasInvestigadas||{}).filter(Boolean).length} salas investigadas</span></div>`);
    }
  };

  /* V0.96 — horror/eventos para uso do Mestre */
  const HorrorV096={
    events:[
      'As luzes do corredor piscam três vezes e apagam por alguns segundos.',
      'Um sino toca no 3º andar, embora o hotel não tenha campainha naquele setor.',
      'Uma porta se fecha violentamente em algum ponto do andar.',
      'O elevador abre sozinho. Lá dentro, não há ninguém.',
      'Um telefone toca em um quarto vazio.',
      'O som de passos se aproxima e para imediatamente atrás do grupo.',
      'Um espelho mostra o corredor alguns segundos atrasado.',
      'A energia retorna por um instante e revela uma silhueta no fim do corredor.'
    ],
    random(){const text=this.events[Math.floor(Math.random()*this.events.length)];const s=state();s.eventos.unshift({at:Date.now(),texto:text});s.eventos=s.eventos.slice(0,50);campaign().eventoAtual=text;persist(`Evento de horror: ${text}`);refreshAll();openSimpleModal('v096EventModal',`<div class="panel v096-event"><button class="close" onclick="closeSimpleModal('v096EventModal')">×</button><p class="eyebrow">EVENTO DE HORROR</p><h2>🎭 ${escv(text)}</h2><button class="primary" onclick="closeSimpleModal('v096EventModal')">CONTINUAR</button></div>`);},
    clear(){campaign().eventoAtual='Nenhum evento em andamento.';persist('Evento de horror encerrado.');refreshAll();}
  };

  /* V0.97 — sessão, histórico e backup */
  const SessionV097={
    export(){const payload={exportadoEm:new Date().toISOString(),versao:VERSION,data:clone(data)};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`hotel-espelho-save-v${VERSION.replace('.','-')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Backup da sessão exportado.');},
    import(){let input=$('v097Import');if(!input){input=document.createElement('input');input.id='v097Import';input.type='file';input.accept='.json,application/json';input.style.display='none';document.body.appendChild(input);input.addEventListener('change',()=>this.read(input));}input.value='';input.click();},
    read(input){const file=input.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const payload=JSON.parse(reader.result);const next=payload.data||payload;if(!next||!Array.isArray(next.jogadores)||!Array.isArray(next.andares))throw new Error('Arquivo não reconhecido como sessão do Hotel Espelho.');if(!confirm('Importar esta sessão substituirá o estado atual neste navegador. Continuar?'))return;data=next;persist('Sessão importada de backup.');refreshAll();toast('Sessão restaurada com sucesso.');}catch(e){toast(e.message||'Falha ao importar sessão.');}};reader.readAsText(file);},
    newSession(){if(!confirm('Criar uma nova sessão preservando fichas e catálogos?'))return;const c=campaign();c.andarAtual=5;c.objetivoAtual='Explorar o 5º andar, investigar os primeiros sinais e descobrir qual rota de fuga será possível.';c.perseguicao='Normal';c.eventoAtual='Nenhum evento em andamento.';c.salasInvestigadas={};c.pistasReveladas=[];c.chavesEncontradas=[];c.combateV071={ativo:false,rodada:1,ordem:[],indice:0,historico:[]};(data.assassinos||[]).forEach(k=>{k.ativo=false;k.estado='Oculto';});persist('Nova sessão criada.');refreshAll();toast('Nova sessão preparada.');},
    renderHistory(){const s=state();return (s.historico||[]).slice(0,20).map(x=>`<div><time>${new Date(x.at).toLocaleTimeString('pt-BR')}</time><span>${escv(x.texto)}</span></div>`).join('')||'<small class="muted">Sem ações registradas.</small>';}
  };

  window.StabilityV089=StabilityV089;
  window.CombatV090=CombatV090;
  window.SheetV091=SheetV091;
  window.SyncV092=SyncV092;
  window.HotelMapV093=HotelMapV093;
  window.ThreatV094=ThreatV094;
  window.InvestigationV095=InvestigationV095;
  window.HorrorV096=HorrorV096;
  window.SessionV097=SessionV097;
  window.openSimpleModal=openSimpleModal;
  window.closeSimpleModal=closeSimpleModal;
  window.runHotelQualityAudit=()=>({v089:StabilityV089.audit(),sync:SyncV092.status(),combat:CombatV090.ensure(),version:'1.2'});
  const boot=()=>{if(typeof data==='undefined'||!data)return setTimeout(boot,100);state();try{SheetV091.renderToolbar();SyncV092.mount();CombatV090.render();ThreatV094.render();}catch(e){console.error('Falha na inicialização dos sistemas do Mestre:',e);}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
