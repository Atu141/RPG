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

  /* V0.98 — interface final */
  const UI_V098={
    activeTab:'visao',
    mount(){
      const master=$('masterScreen');if(!master||$('v098MasterConsole'))return;
      const consoleEl=document.createElement('section');consoleEl.id='v098MasterConsole';consoleEl.className='panel v098-console';master.insertBefore(consoleEl,$('hotelMap'));
      this.render();
      const player=$('playerHome');if(player&&!$('v098PlayerHint')){const h=document.createElement('div');h.id='v098PlayerHint';h.className='v098-player-hint';h.innerHTML='<b>📱 MODO JOGADOR</b><span>Use o celular apenas para consultar sua ficha. O Mestre controla alterações de PV, PE, SAN e combate.</span>';player.prepend(h);}
    },
    render(){const el=$('v098MasterConsole');if(!el||!data)return;const c=campaign(),combat=CombatV090.ensure(),s=state(),online=SyncV092.label();const tabs=[['visao','⌂ Visão'],['mapa','🗺️ Mapa'],['jogadores','👥 Jogadores'],['combate','⚔️ Combate'],['ameaças','👹 Ameaças'],['sessao','💾 Sessão']];const nav=tabs.map(([id,label])=>`<button class="${this.activeTab===id?'active':''}" onclick="UIV098.tab('${id}')">${label}</button>`).join('');
      let body='';
      if(this.activeTab==='visao')body=`<div class="v098-overview"><div class="v098-stat"><span>JOGADORES</span><b>${(data.jogadores||[]).length}</b></div><div class="v098-stat"><span>ANDAR</span><b>${Number(c.andarAtual)||5}º</b></div><div class="v098-stat"><span>AMEAÇAS ATIVAS</span><b>${(data.assassinos||[]).filter(k=>k.ativo).length+(data.monstros||[]).filter(m=>Number(m.pv??1)>0).length}</b></div><div class="v098-stat"><span>COMBATE</span><b>${combat.ativo?'ATIVO':'INATIVO'}</b></div></div><div class="v098-quick"><button class="primary" onclick="UIV098.tab('mapa')">🗺️ ABRIR MAPA</button><button class="primary" onclick="UIV098.tab('combate')">⚔️ CONTROLE DE COMBATE</button><button class="ghost" onclick="HorrorV096.random()">🎭 EVENTO DE HORROR</button></div><div class="v098-session-status"><b>${escv(online)}</b><span>Objetivo: ${escv(c.objetivoAtual||'—')}</span><span>Evento: ${escv(c.eventoAtual||'Nenhum')}</span></div>`;
      if(this.activeTab==='mapa')body=`<div id="v098MapHost"></div>`;
      if(this.activeTab==='jogadores')body=`<div class="v098-player-grid">${(data.jogadores||[]).map(p=>`<article class="v098-player-card"><div><b>${escv(p.nome)}</b><small>${escv(p.classe||'Classe não definida')} • NEX ${escv(p.nex||'5%')}</small></div><div class="v098-res"><span>❤️ ${Number(p.pv)||0}/${Number(p.pvMax)||0}</span><span>⚡ ${Number(p.pe)||0}/${Number(p.peMax)||0}</span><span>🧠 ${Number(p.san)||0}/${Number(p.sanMax)||0}</span></div><button class="ghost" onclick="openSheet('${escv(p.id)}')">▣ VER FICHA</button><button class="ghost" onclick="UIV098.adjustResource('${escv(p.id)}','pv')">PV</button><button class="ghost" onclick="UIV098.adjustResource('${escv(p.id)}','pe')">PE</button><button class="ghost" onclick="UIV098.adjustResource('${escv(p.id)}','san')">SAN</button></article>`).join('')}</div>`;
      if(this.activeTab==='combate')body=`<div id="v098CombatHost"></div>`;
      if(this.activeTab==='ameaças')body=`<div class="v098-threat-grid"><div><h3>🔪 Assassinos</h3>${(data.assassinos||[]).map(k=>`<article class="v098-threat-card ${k.ativo?'active':''}"><b>${escv(k.nome)}</b><small>${escv(k.elemento)} • ${Number(k.pv)||0} PV • DEF ${Number(k.defesa)||0} • ${Number(k.andar)||'?'}º</small><div><button class="ghost small" onclick="ThreatV094.toggleKiller('${escv(k.id)}')">${k.ativo?'OCULTAR':'ATIVAR'}</button><button class="ghost small" onclick="ThreatV094.moveKiller('${escv(k.id)}')">MOVER</button><button class="ghost small" onclick="CombatV090.addParticipant('${escv(k.id)}')">+ COMBATE</button></div></article>`).join('')}</div><div><h3>👹 Monstros</h3>${(data.monstros||[]).map(m=>`<article class="v098-threat-card"><b>${escv(m.nome)}</b><small>${escv(m.tipo||'Monstro')} • ${Number(m.pv)||0}/${Number(m.pvMax??m.pv)||0} PV • DEF ${Number(m.defesa)||10}</small><div><button class="ghost small" onclick="CombatV090.addParticipant('${escv(m.id)}')">+ COMBATE</button><button class="ghost small" onclick="CombatV090.damage('${escv(m.id)}',prompt('Dano em ${escv(m.nome)}:')||0)">− DANO</button></div></article>`).join('')}</div></div>`;
      if(this.activeTab==='sessao')body=`<div class="v098-session-grid"><div><h3>💾 Sessão</h3><p class="muted">Backup local da mesa e restauração do estado.</p><div class="v098-actions"><button class="primary" onclick="SessionV097.export()">EXPORTAR BACKUP</button><button class="ghost" onclick="SessionV097.import()">IMPORTAR BACKUP</button><button class="ghost" onclick="SessionV097.newSession()">NOVA SESSÃO</button></div></div><div><h3>📜 Histórico</h3><div class="v098-history">${SessionV097.renderHistory()}</div></div></div>`;
      el.innerHTML=`<div class="v098-console-head"><div><p class="eyebrow">V0.89 → V0.98 • MODO PRESENCIAL</p><h2>Central do Mestre</h2><p>O Mestre controla a mesa; os jogadores consultam suas fichas pelo celular.</p></div><span class="v098-version">V0.98</span></div><nav class="v098-nav">${nav}</nav><div class="v098-body">${body}</div>`;
      if(this.activeTab==='mapa'){const host=$('v098MapHost');if(host){host.appendChild($('hotelMap'));HotelMapV093.render();}}
      if(this.activeTab==='combate'){const host=$('v098CombatHost');const panel=$('v071CombatPanel');if(panel)host.appendChild(panel);CombatV090.render();}
    },
    tab(id){this.activeTab=id;this.render();},
    adjustResource(id,key){const p=(data.jogadores||[]).find(x=>String(x.id)===String(id));if(!p)return;const max=Number(p[key+'Max'])||0;const v=prompt(`${p.nome} — ${key.toUpperCase()} (0-${max})`,String(Number(p[key])||0));if(v===null)return;p[key]=Math.max(0,Math.min(max,Number(v)||0));persist(`${key.toUpperCase()} de ${p.nome} alterado pelo Mestre.`);refreshAll();this.render();},
    syncRefresh(){SyncV092.render();}
  };

  /* Patch seguro de recursos: somente o Mestre altera valores mecânicos. */
  const oldResource=window.MultiplayerV071?.resource;
  if(window.MultiplayerV071&&typeof oldResource==='function'&&!oldResource.__v098){
    const wrapped=function(pid,key,value){const st=SyncV092.status();if(st.role==='player')return toast('Somente o Mestre pode alterar PV, PE e SAN.');return oldResource(pid,key,value);};wrapped.__v098=true;window.MultiplayerV071.resource=wrapped;
  }

  /* Corrige a antiga UI de combate: a V0.90 passa a ser a fonte visual. */
  const boot=()=>{
    if(typeof data==='undefined'||!data)return setTimeout(boot,100);
    StabilityV089.migrate();
    UI_V098.mount();
    SheetV091.renderToolbar();
    SyncV092.mount();
    HotelMapV093.render();
    ThreatV094.render();
    CombatV090.render();
    setInterval(()=>{try{SyncV092.render();SheetV091.renderToolbar();}catch(e){}},2000);
    // Re-render the new console whenever the Master screen becomes visible.
    const oldRender=window.renderMaster;
    if(typeof oldRender==='function'&&!oldRender.__v098suite){
      const w=function(){const r=oldRender.apply(this,arguments);setTimeout(()=>{UI_V098.render();ThreatV094.render();SyncV092.render();},0);return r;};w.__v098suite=true;window.renderMaster=w;
    }
    // Keep map/combat panels available even when legacy modules repaint them.
    setInterval(()=>{if($('masterScreen')?.classList.contains('active')){try{UI_V098.render();}catch(e){}}},2500);
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
  window.UIV098=UI_V098;
  window.openSimpleModal=openSimpleModal;
  window.closeSimpleModal=closeSimpleModal;
  window.runHotelQualityAudit=()=>({v089:StabilityV089.audit(),sync:SyncV092.status(),combat:CombatV090.ensure(),version:VERSION});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();


/* --- 65-v0982-rules-final.js --- */
/* V0.98.2 — Auditoria de regras: resolvedor oficial da mesa.
   Mantém a interface existente, mas concentra a resolução de ataques/dano
   na camada de regras e aplica os casos que o V0.90 simplificado ignorava.
*/
(function(){
  'use strict';
  const ELEM={Sangue:'Conhecimento',Conhecimento:'Energia',Energia:'Morte',Morte:'Sangue'};
  const D20=()=>Math.floor(Math.random()*20)+1;
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const esc2=v=>typeof esc==='function'?esc(v):String(v??'');
  function entity(id){return typeof GameEngineV070!=='undefined'&&GameEngineV070.getEntity?GameEngineV070.getEntity(id):[...(data?.jogadores||[]),...(data?.monstros||[]),...(data?.assassinos||[])].find(x=>String(x.id)===String(id));}
  function attrKey(skill){const map={Luta:'FOR',Pontaria:'AGI',Acrobacia:'AGI',Adestramento:'PRE',Artes:'PRE',Atletismo:'FOR',Atualidades:'INT','Ciências':'INT',Crime:'AGI',Diplomacia:'PRE',Enganação:'PRE',Fortitude:'VIG',Furtividade:'AGI',Iniciativa:'AGI',Intimidação:'PRE',Intuição:'PRE',Investigação:'INT',Medicina:'INT',Ocultismo:'INT',Percepção:'PRE',Pilotagem:'AGI',Profissão:'INT',Reflexos:'AGI',Religião:'PRE',Sobrevivência:'INT',Tática:'INT',Tecnologia:'INT',Vontade:'PRE'};return map[skill]||'AGI';}
  function trainedBonus(p,skill){const s=(p?.pericias||[]).find(x=>String(x.nome).toLowerCase()===String(skill).toLowerCase());if(!s)return 0;const grau=s.grau||(s.treinada?'treinado':'nao_treinada');return ({leigo:0,nao_treinada:0,treinado:5,veterano:10,expert:15}[grau]??0);}
  function parse(formula){
    const raw=String(formula??'').trim();
    const clean=raw.replace(/\s+/g,'');
    const m=clean.match(/^(\d+)d(\d+)([+-](?:\d+|SAN|PV|FOR|AGI|INT|PRE|VIG))?(?:([xX×])(\d+))?(?:[;,|:]?(?:mental|balístico|corte|eletricidade|fogo|frio|impacto|paranormal|perfuração|químico|conhecimento|energia|morte|sangue|medo))?$/i);
    if(!m)return null;
    return {raw,n:Number(m[1]),sides:Number(m[2]),modToken:String(m[3]||'0'),mod:/^[+-]\d+$/.test(String(m[3]||''))?Number(m[3]):0,mult:Number(m[5]||1)};
  }
  function rollFormula(formula,critical=false,context=null,diceMultiplier=1){
    const p=parse(formula);if(!p)return {valid:false,formula:String(formula??''),dice:[],total:0,mod:0};
    const mult=critical?Math.max(1,Number(diceMultiplier)||p.mult||1):1;
    const n=Math.min(100,p.n*mult);const dice=Array.from({length:n},()=>Math.floor(Math.random()*p.sides)+1);let variable=0;if(p.modToken&&!/^[+-]\d+$/.test(p.modToken)){const key=p.modToken.replace(/^[-+]/,'').toUpperCase();variable=(num(context?.[key])+num(context?.atributos?.[key]));if(String(p.modToken).startsWith('-'))variable=-variable;}return {valid:true,formula:p.raw,dice,total:dice.reduce((a,b)=>a+b,0)+p.mod+variable,mod:p.mod+variable,sides:p.sides,n,critical,variable};
  }
  function attackMeta(a,atk){
    const text=String(atk?.teste||'');
    const m=text.replace(/\s+/g,'').match(/^(?:\d+d20)([+-]\d+)?/i);
    let bonus=m?Number(m[1]||0):0;
    let crit=20,mult=2;
    const weapon=a?.itens?.find(i=>i.tipo==='arma'&&i.equipado&&String(i.nome)===String(atk?.nome));
    const source=weapon||atk;
    const cm=String(source?.critico||atk?.critico||'').match(/(18|19|20)(?:\s*[/xX×]\s*(2|3|4))?/);
    if(cm){crit=Number(cm[1]);mult=Number(cm[2]||2);}
    if(source?.criticoMargem)crit=Number(source.criticoMargem)||crit;
    if(source?.criticoMultiplicador)mult=Number(source.criticoMultiplicador)||mult;
    return {bonus,crit,mult,weapon:weapon||null};
  }
  function currentUnarmed(a,atk){
    const name=String(atk?.nome||'').toLowerCase();
    if(!['soco','improvisado'].includes(name))return atk;
    const forca=num(a?.atributos?.FOR);const agi=num(a?.atributos?.AGI);
    const skill=name==='soco'?'Luta':'Luta';
    const bonus=trainedBonus(a,skill)+forca;
    return {...atk,teste:`1d20+${bonus}`,dano:name==='soco'?`1d3+${forca}`:`1d4+${forca}`,tipoDano:'Impacto',critico:'20/x2',categoria:'corpo-a-corpo'};
  }
  function defense(t){
    let d=num(t?.defesa)||10;
    const has=n=>typeof GameEngineV070!=='undefined'&&GameEngineV070.conditionHas?GameEngineV070.conditionHas(t,n):(t?.condicoes||[]).some(c=>String(c.nome||c)===n);
    if(has('Desprevenido'))d-=5;if(has('Indefeso'))d-=10;if(has('Caído'))d-=5;return d;
  }
  function rd(t,damageType,element){
    if(!t)return 0;
    const type=String(damageType||'').toLowerCase(),el=String(element||'').toLowerCase();
    const immunity=[...(t.imunidades||t.imunidade||[])].map(String).map(x=>x.toLowerCase());
    if(immunity.includes(type)||immunity.includes(el)||immunity.includes('todos'))return Infinity;
    const res=[...(t.resistencias||[])].map(x=>typeof x==='string'?{tipo:x,valor:5}:x);
    const hit=res.find(x=>String(x.tipo||x.elemento||'').toLowerCase()===type||String(x.elemento||'').toLowerCase()===el);
    const generic=num(t.resistenciaDano);return Math.max(generic,hit?num(hit.valor||hit.resistencia):0);
  }
  function vulnerability(t,damageType,element){
    const vals=[...(t?.vulnerabilidades||t?.fraquezas||[])].map(x=>typeof x==='string'?x:String(x?.tipo||x?.elemento||''));
    const target=[String(damageType||''),String(element||'')].map(x=>x.toLowerCase());
    return vals.some(v=>target.includes(v.toLowerCase()))?2:1;
  }
  function relation(source,target){
    if(!source||!target||source==='Medo'||target==='Medo')return 'neutro';
    if(source===target)return 'mesmo';
    if(ELEM[source]===target)return 'opressor';
    if(ELEM[target]===source)return 'oprimido';
    return 'neutro';
  }
  function resist(target,skill,dt,sourceElement){
    const attr=attrKey(skill);const bonus=trainedBonus(target,skill);let dice=target?.atributos?.[attr];dice=num(dice);const rolls=Array.from({length:dice>0?dice:2},D20);let best=dice>0?Math.max(...rolls):Math.min(...rolls);let mod=0;const rel=relation(sourceElement,target?.elemento);if(rel==='opressor')best+=0; // -2d20 é tratado abaixo
    if(rel==='opressor'||rel==='mesmo'){
      const extra=2;const ex=Array.from({length:extra},D20);
      if(rel==='opressor')rolls.push(...ex),best=Math.max(...rolls);
      else rolls.push(...ex),best=Math.min(...rolls);
    }
    return {rolls,result:best,total:best+bonus,dt:Number(dt)||10,sucesso:best+bonus>=Number(dt)||10,relacaoElemental:rel,bonus};
  }
  function addCondition(p,name,origin){if(typeof GameEngineV070!=='undefined'&&GameEngineV070.conditionAdd)return GameEngineV070.conditionAdd(p,name,null,origin);p.condicoes=p.condicoes||[];if(!(p.condicoes||[]).some(c=>String(c.nome||c)===name))p.condicoes.push({nome:name,origem:origin,at:Date.now()});}
  function resolveAttack(attackerId,targetId,indexOrAttack,opts={}){
    const a=entity(attackerId),t=entity(targetId);if(!a||!t)throw Error('Atacante ou alvo inválido.');
    let atk=typeof indexOrAttack==='object'?indexOrAttack:a?.ataques?.[Number(indexOrAttack)];if(!atk)throw Error('Ataque não encontrado.');atk=currentUnarmed(a,atk);
    const meta=attackMeta(a,atk);const skill=atk.skill||atk.pericia||((String(atk.categoria||'').toLowerCase().includes('dist')||/pontaria|tiro|revólver|pistola|fuzil|metralhadora/i.test(atk.nome||''))?'Pontaria':'Luta');
    let attackRoll;
    const explicit=String(atk.teste||'').replace(/\s+/g,'').match(/^(\d+)d(20)([+-]\d+)?/i);
    if(a.atributos){const attr=num(a.atributos[attrKey(skill)]);const count=attr>0?attr:2;const rolls=Array.from({length:count},D20);const result=attr>0?Math.max(...rolls):Math.min(...rolls);const bonus=attr+trainedBonus(a,skill)+num(opts.bonus);attackRoll={rolls,result,total:result+bonus,bonus,critico:result>=meta.crit};}
    else {const r=rollFormula(atk.teste||'1d20');attackRoll={...r,result:r.dice?.[0]||0,rolls:r.dice||[],critico:(r.dice?.[0]||0)>=meta.crit};}
    const def=defense(t);const hit=attackRoll.total>=def;let damage=null,final=0,immune=false,damageType=atk.tipoDano||atk.tipo||(/mental/i.test(String(atk.dano||''))?'Mental':'Impacto'),element=atk.elemento||a.elemento||null;
    if(hit&&atk.dano){damage=rollFormula(String(atk.dano).split('/')[0],attackRoll.critico&&meta.mult>1,t,meta.mult);if(!damage.valid)throw Error(`Fórmula de dano inválida: ${atk.dano}`);damage.critico=attackRoll.critico;damage.multiplicador=attackRoll.critico?meta.mult:1;damageType=damageType||'Impacto';const resistance=rd(t,damageType,element);immune=!Number.isFinite(resistance);if(!immune){const vuln=vulnerability(t,damageType,element);final=Math.max(0,damage.total-resistance)*vuln;}if(t.pv!==undefined&&!immune){t.pv=Math.max(0,num(t.pv)-final);if(t.pv===0&&t.atributos)addCondition(t,'Morrendo',a.nome);}}
    const entry={id:`r98_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,atacante:a.nome,alvo:t.nome,ataque:atk.nome,teste:attackRoll.total,defesa:def,acertou:hit,critico:attackRoll.critico,danoRolado:damage?.total||0,danoFinal:final,resistencia:rd(t,damageType,element),imune:immune,tipoDano:damageType,elemento:element,criticoMargem:meta.crit,criticoMultiplicador:meta.mult,at:Date.now()};
    const c=typeof CombatV090!=='undefined'?CombatV090.ensure():null;if(c){c.historico.unshift({at:Date.now(),text:`${a.nome} usou ${atk.nome} contra ${t.nome}: ${attackRoll.total} vs ${def} — ${hit?'ACERTO':'FALHA'}${damage?` — ${final} dano`:''}${attackRoll.critico?' — CRÍTICO':''}.`});c.historico=c.historico.slice(0,60);}
    if(typeof saveLocal==='function')saveLocal();return {entry,attackRoll,damage,hit,final};
  }
  function normalize(){
    (data?.jogadores||[]).forEach(p=>{
      p.atributos=p.atributos||{};p.condicoes=Array.isArray(p.condicoes)?p.condicoes:[];
      (p.ataques||[]).forEach(a=>{const n=currentUnarmed(p,a);Object.assign(a,n);});
      if(typeof GameEngineV070!=='undefined'&&p.classe){GameEngineV070.refresh(p);GameEngineV070.refreshProgression?.(p);}
    });
    data.campanha=data.campanha||{};data.campanha.regrasV0982={versao:'0.98.3',motor:'RulesV0983',ultimaNormalizacao:Date.now()};
    if(typeof saveLocal==='function')saveLocal();
  }
  function patchCombat(){
    if(typeof CombatV090==='undefined')return;
    CombatV090.attack=function(attackerId,targetId,index){try{const r=resolveAttack(attackerId,targetId,index);this.render();this.sync();toast(`${r.entry.acertou?'ACERTO':'FALHA'}${r.entry.critico?' • CRÍTICO':''}${r.damage?` • ${r.final} dano`:''}`);return r;}catch(e){toast(e.message);return null;}};
    const oldStart=typeof CombatV090.start==='function'?CombatV090.start.bind(CombatV090):null;CombatV090.start=function(ids){const r=oldStart?oldStart(ids):null;try{(data.jogadores||[]).forEach(p=>GameEngineV070?.ensurePlayer?.(p));}catch(_){}return r;};
    const oldNext=typeof CombatV090.next==='function'?CombatV090.next.bind(CombatV090):null;CombatV090.next=function(){const r=oldNext?oldNext():null;const c=this.ensure();const p=this.get(c.ordem[c.indice]);if(p?.atributos)GameEngineV070?.conditionTick?.(p);return r;};
  }
  function audit(){
    const issues=[],warnings=[];normalize();
    (data?.jogadores||[]).forEach(p=>{if(p.classe){const d=GameEngineV070?.derived?.(p);if(d&&(p.pvMax!==d.pvMax||p.peMax!==d.peMax||p.sanMax!==d.sanMax||p.defesa!==d.defesa))issues.push(`${p.nome}: derivados divergentes`);}const s=new Set((p.ataques||[]).map(a=>a.nome));if(s.size!==(p.ataques||[]).length)issues.push(`${p.nome}: ataques duplicados`);});
    const bad=(data?.monstros||[]).flatMap(x=>(x.ataques||[]).filter(a=>!parse(String(a.dano||''))).map(a=>`${x.nome}: ${a.nome} (${a.dano})`));if(bad.length)warnings.push(`${bad.length} ataques de ameaças possuem efeitos/fórmulas que exigem resolução narrativa: ${bad.slice(0,3).join('; ')}`);
    return {ok:issues.length===0,issues,warnings,players:data?.jogadores?.length||0,version:'0.98.3'};
  }

  function patchMap(){
    if(typeof HotelMapV093==='undefined')return;
    const old=HotelMapV093.render.bind(HotelMapV093);
    HotelMapV093.render=function(){
      const floor=Number(data?.campanha?.andarAtual)||5;
      if(floor===0){
        const el=$('hotelMap');if(!el)return;
        el.innerHTML=`<div class="panel-title"><div><span class="icon">▦</span><div><p class="eyebrow">TÉRREO</p><h2>Hall de Entrada</h2><p>Saída segura principal do Hotel Espelho.</p></div></div></div><div class="v098-ground-floor"><button class="v098-ground-room" onclick="openSimpleModal('v098GroundModal',\`<div class=\"panel\"><button class=\"close\" onclick=\"closeSimpleModal('v098GroundModal')\">×</button><p class=\"eyebrow\">TÉRREO</p><h2>Hall de Entrada</h2><p>A saída principal do hotel. A rota segura exige a resolução do enigma da porta principal.</p><p><b>Chave/solução:</b> SMCE</p></div>\`)">🚪 Hall de Entrada<small>SAÍDA PRINCIPAL</small></button></div><div class="v093-side"><b>SAÍDAS</b><small>Hall de Entrada — saída segura</small><small>↑ 1º andar</small></div>`;
        return;
      }
      old();
      const killers=(data.assassinos||[]).filter(k=>k.ativo&&Number(k.andar)===floor&&k.sala);
      document.querySelectorAll('#hotelMap .v093-room').forEach(btn=>{
        const name=(btn.querySelector('b')?.textContent||'').trim();
        killers.filter(k=>String(k.sala)===name).forEach(k=>{if(!btn.querySelector('.v098-killer-room-marker')){const s=document.createElement('span');s.className='v098-killer-room-marker';s.textContent=`☠ ${k.nome}`;btn.appendChild(s);}});
      });
    };
    const oldFloor=HotelMapV093.floor.bind(HotelMapV093);HotelMapV093.floor=function(n){const f=Number(n);if(f===0){campaign().andarAtual=0;persist('Mapa: Térreo.');this.render();return;}return oldFloor(n);};
  }
  function patchProgression(){
    if(typeof GameEngineV070==='undefined')return;
    const old=GameEngineV070.refreshProgression;
    GameEngineV070.refreshProgression=function(p){const r=old(p);p.habilidadesDesbloqueadas=(r?.pendentes||[]).map(x=>x.split(':').slice(1).join(':'));return r;};
    (data?.jogadores||[]).forEach(p=>{if(p.classe)GameEngineV070.refreshProgression(p);});
  }
  window.RulesV0982={parse,rollFormula,resolveAttack,normalize,audit,relation,defense,rollDamage:rollFormula,patchMap,patchProgression};
  window.RulesV0983=window.RulesV0982;
  const boot=()=>{if(typeof data==='undefined'||!data)return setTimeout(boot,100);try{normalize();patchCombat();patchMap();patchProgression();}catch(e){console.error(e);}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();


/* --- 67-v0984-map-combat-class-fix.js --- */
/* V0.98.4 — Correção de persistência visual do Mapa/Combate e regra de liberação da classe. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const campaign=()=>{data.campanha=data.campanha||{};return data.campanha;};

  /*
   * A Central V0.98 usa abas dentro de um único elemento.
   * Não podemos destruir #hotelMap/#v071CombatPanel com innerHTML ao trocar de aba,
   * pois os módulos mantêm esses nós como estado visual. Mantemos os nós fora da
   * renderização temporariamente e os recolocamos no host correto depois.
   */
  function patchConsolePersistence(){
    const ui=window.UIV098;
    if(!ui || ui.__v0984PersistentHosts) return;
    let stash=$('v0984PersistentModules');
    if(!stash){stash=document.createElement('div');stash.id='v0984PersistentModules';stash.hidden=true;document.body.appendChild(stash);}
    const original=ui.render.bind(ui);
    ui.render=function(){
      const map=$('hotelMap');
      const combat=$('v071CombatPanel');
      if(map && map.parentNode!==stash) stash.appendChild(map);
      if(combat && combat.parentNode!==stash) stash.appendChild(combat);
      try{original();}catch(e){console.error('[V0.98.4] render console',e);}
      const mapNode=$('hotelMap');
      const combatNode=$('v071CombatPanel');
      if(mapNode && mapNode.parentNode!==stash) stash.appendChild(mapNode);
      if(combatNode && combatNode.parentNode!==stash) stash.appendChild(combatNode);
      if(ui.activeTab==='mapa'){
        const host=$('v098MapHost');
        if(host && map) host.appendChild(map);
        window.HotelMapV093?.render?.();
      }
      if(ui.activeTab==='combate'){
        const host=$('v098CombatHost');
        if(host && combat) host.appendChild(combat);
        window.CombatV090?.render?.();
      }
    };
    ui.__v0984PersistentHosts=true;
  }

  /*
   * Regra narrativa da campanha:
   * - personagens começam sem classe;
   * - a classe só pode ser escolhida no 5º andar;
   * - o jogador só recebe a escolha quando o Mestre explicitamente libera;
   * - sair do 5º andar fecha a janela de escolha;
   * - o Mestre não escolhe a classe pelo seletor comum de jogadores.
   */
  function patchClassRelease(){
    const oldRelease=window.setClassChoiceRelease;
    if(typeof oldRelease==='function' && !oldRelease.__v0984){
      const wrapped=function(value){
        const floor=Number(campaign().andarAtual);
        if(Boolean(value) && floor!==5){
          campaign().escolhaClasseLiberada=false;
          saveLocal?.();
          renderMaster?.();
          toast('A escolha de classe só pode ser liberada enquanto o Mestre estiver no 5º andar.');
          return false;
        }
        return oldRelease.apply(this,arguments);
      };
      wrapped.__v0984=true;
      window.setClassChoiceRelease=wrapped;
    }
    const oldChoose=window.chooseClass;
    if(typeof oldChoose==='function' && !oldChoose.__v0984){
      const wrapped=function(pid,classe){
        const c=campaign();
        if(Number(c.andarAtual)!==5 || c.escolhaClasseLiberada!==true){
          toast('A escolha de classe ainda não foi liberada pelo Mestre.');
          return false;
        }
        return oldChoose.apply(this,arguments);
      };
      wrapped.__v0984=true;
      window.chooseClass=wrapped;
    }
    const oldSetMaster=window.setMasterClass;
    if(typeof oldSetMaster==='function' && !oldSetMaster.__v0984){
      const wrapped=function(pid,classe){
        /* Mantém somente a ação de correção/reinício do Mestre. A escolha narrativa é do jogador. */
        if(classe){
          toast('A classe deve ser escolhida pelo jogador após a liberação do Mestre no 5º andar.');
          return false;
        }
        return oldSetMaster.apply(this,arguments);
      };
      wrapped.__v0984=true;
      window.setMasterClass=wrapped;
    }
  }

  function enforceClassGate(){
    if(typeof data==='undefined'||!data)return;
    const c=campaign();
    if(Number(c.andarAtual)!==5 && c.escolhaClasseLiberada){
      c.escolhaClasseLiberada=false;
      try{saveLocal?.();}catch(_){}
    }
  }

  function patchFloorNormalization(){
    /* O Térreo é parte da rota de fuga e precisa ser representável no mapa. */
    const oldNormalize=window.normalizeData;
    if(typeof oldNormalize==='function' && !oldNormalize.__v0984){
      const wrapped=function(source){
        const result=oldNormalize.apply(this,arguments);
        if(result?.campanha){
          result.campanha.andarAtual=Math.max(0,Math.min(9,Number(result.campanha.andarAtual)||5));
          if(Number(result.campanha.andarAtual)!==5) result.campanha.escolhaClasseLiberada=false;
        }
        return result;
      };
      wrapped.__v0984=true;
      window.normalizeData=wrapped;
    }
    if(window.HotelMapV093 && !window.HotelMapV093.__v0984Floor){
      const map=window.HotelMapV093;
      const oldFloor=map.floor?.bind(map);
      if(oldFloor){
        map.floor=function(n){
          const f=Math.max(0,Math.min(9,Number(n)||5));
          campaign().andarAtual=f;
          if(f!==5) campaign().escolhaClasseLiberada=false;
          persist?.(`Mapa: ${f===0?'Térreo':f+'º andar'}.`);
          this.render();
          if(typeof V030!=='undefined')V030.renderPlayerSystems?.();
        };
      }
      const oldRender=map.render?.bind(map);
      if(oldRender){
        map.render=function(){
          const f=Number(campaign().andarAtual);
          if(f===0){
            const el=$('hotelMap'); if(!el)return;
            el.innerHTML=`<div class="v093-head"><div><p class="eyebrow">V0.98.4 • MAPA DO HOTEL</p><h2>Térreo</h2><p>Hall de Entrada — saída segura principal.</p></div></div><div class="v098-ground-floor"><div class="v098-ground-room"><b>🚪 Hall de Entrada</b><small>SAÍDA PRINCIPAL • Resolução da porta: SMCE</small></div></div><div class="v093-side"><b>SAÍDAS</b><small>↑ 1º andar</small><small>Hall de Entrada — saída segura</small></div>`;
            return;
          }
          oldRender();
        };
      }
      map.__v0984Floor=true;
    }
  }

  function boot(){
    if(typeof data==='undefined'||!data)return setTimeout(boot,100);
    enforceClassGate();
    patchConsolePersistence();
    patchClassRelease();
    patchFloorNormalization();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.HotelFixV0984={patchConsolePersistence,patchClassRelease,patchFloorNormalization,enforceClassGate};
})();


/* --- 69-v0988-player-card-controls.js --- */
/* V0.98.8 — Central do Mestre: controles por ficha.
   Cada card recebe: liberar/bloquear classe, adicionar item e excluir ficha.
   A liberação é individual e só pode ocorrer no 5º andar.
*/
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const campaign=()=>{data.campanha=data.campanha||{};return data.campanha;};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function releasedIds(){
    const c=campaign();
    if(!Array.isArray(c.escolhaClasseLiberadaPara)) c.escolhaClasseLiberadaPara=[];
    return c.escolhaClasseLiberadaPara.map(String);
  }
  function isReleased(id){return releasedIds().includes(String(id));}

  function releaseForPlayer(id, value){
    const c=campaign();
    if(Number(c.andarAtual)!==5){toast('A escolha de classe só pode ser liberada no 5º andar.');return;}
    const p=(data.jogadores||[]).find(x=>String(x.id)===String(id));
    if(!p)return;
    if(p.classe){toast(`${p.nome} já possui a classe ${p.classe}.`);return;}
    const ids=releasedIds();
    const sid=String(id);
    c.escolhaClasseLiberadaPara=value ? [...new Set([...ids,sid])] : ids.filter(x=>x!==sid);
    // Mantém a flag antiga apenas como compatibilidade; a decisão efetiva agora é por ficha.
    c.escolhaClasseLiberada=c.escolhaClasseLiberadaPara.length>0;
    logAction(`${p.nome}: escolha de classe ${value?'liberada':'bloqueada'} pelo Mestre.`);
    saveLocal(); renderMaster();
    if(selectedPlayer?.id===p.id) renderSheet();
    toast(value?`Classe liberada para ${p.nome}`:`Classe bloqueada para ${p.nome}`);
  }

  function addItem(id){
    if(typeof createAndAddPlayerItem==='function'){createAndAddPlayerItem(id);return;}
    toast('Função de inventário não carregada.');
  }
  function deleteSheet(id){
    if(window.MasterPlayerDeleteV084?.delete){window.MasterPlayerDeleteV084.delete(id);return;}
    toast('Função de exclusão de ficha não carregada.');
  }

  function playerIdFromCard(card){
    const resource=card.querySelector('[data-resource][data-id]');
    if(resource?.dataset.id)return resource.dataset.id;
    const sheet=card.querySelector('button[onclick*="openSheet("]');
    const m=sheet?.getAttribute('onclick')?.match(/openSheet\(['"]([^'"]+)['"]\)/);
    if(m)return m[1];
    const name=card.querySelector('b')?.textContent?.trim();
    if(name){const p=(data.jogadores||[]).find(x=>String(x.nome||'').trim()===name);if(p)return p.id;}
    return null;
  }

  function injectIntoCards(selector){
    document.querySelectorAll(selector).forEach(card=>{
      const id=playerIdFromCard(card); if(!id)return;
      const p=(data.jogadores||[]).find(x=>String(x.id)===String(id)); if(!p)return;
      card.querySelectorAll('.v0988-sheet-actions').forEach(x=>x.remove());
      const released=isReleased(id), floor=Number(campaign().andarAtual);
      const actions=document.createElement('div');
      actions.className='v0988-sheet-actions';
      actions.innerHTML=`
        <button type="button" class="dice-btn ${released?'secondary':''} v0988-class-btn" data-v0988-release="${esc(id)}" ${p.classe||floor!==5?'disabled':''}>
          ${p.classe?'✓ CLASSE DEFINIDA':released?'🔒 BLOQUEAR CLASSE':'🎓 LIBERAR CLASSE'}
        </button>
        <button type="button" class="dice-btn v0988-item-btn" data-v0988-add-item="${esc(id)}">🎒 ADICIONAR ITEM</button>
        <button type="button" class="ghost v0988-delete-btn" data-v0988-delete="${esc(id)}">🗑 EXCLUIR FICHA</button>`;
      card.appendChild(actions);
    });
  }

  let renderQueued=false;
  function safeRender(){ if(renderQueued)return; renderQueued=true; setTimeout(()=>{renderQueued=false;render();},0); }
  function render(){
    const host=$('masterPlayers');
    if(host){
      host.querySelector('.v0985-master-controls')?.remove();
      host.querySelectorAll('.v0985-sheet-actions,.v084-sheet-actions').forEach(x=>x.remove());
      injectIntoCards('#masterPlayers .master-player-card');
    }
    // V0.98 Central do Mestre: estes são os cards realmente visíveis na aba Jogadores.
    injectIntoCards('#v098MasterConsole .v098-player-card');
  }

  function bindHost(host){
    if(!host||host.__v0988)return;
    host.__v0988=true;
    host.addEventListener('click',e=>{
      const r=e.target.closest('[data-v0988-release]');
      if(r){e.preventDefault();e.stopPropagation();releaseForPlayer(r.dataset.v0988Release,!isReleased(r.dataset.v0988Release));return;}
      const a=e.target.closest('[data-v0988-add-item]');
      if(a){e.preventDefault();e.stopPropagation();addItem(a.dataset.v0988AddItem);return;}
      const d=e.target.closest('[data-v0988-delete]');
      if(d){e.preventDefault();e.stopPropagation();deleteSheet(d.dataset.v0988Delete);return;}
    });
  }

  function hook(){
    const host=$('masterPlayers');
    bindHost(host);
    bindHost($('v098MasterConsole'));
    const old=window.renderMasterBase;
    if(typeof old==='function'&&!old.__v0988){
      const wrapped=function(){const result=old.apply(this,arguments);safeRender();return result;};
      wrapped.__v0988=true;window.renderMasterBase=wrapped;
    }
    const oldUI=window.UIV098?.render;
    if(typeof oldUI==='function'&&!oldUI.__v0988Cards){
      const wrappedUI=function(){const result=oldUI.apply(this,arguments);safeRender();return result;};
      wrappedUI.__v0988Cards=true;
      window.UIV098.render=wrappedUI;
    }
    render();
  }

  // Substitui a regra de disponibilidade por uma regra individual, sem alterar as regras de escolha.
  const oldClassChoiceOpen=window.classChoiceOpen;
  window.classChoiceOpen=function(pid){
    const c=campaign();
    if(Number(c.andarAtual)!==5)return false;
    if(pid!=null){
      // A liberação individual é a regra oficial. A flag antiga só é usada
      // como compatibilidade para sessões criadas antes da V0.98.8.
      if(Array.isArray(c.escolhaClasseLiberadaPara)) return isReleased(pid);
      return Boolean(c.escolhaClasseLiberada);
    }
    return Boolean(c.escolhaClasseLiberada);
  };
  // ÚNICO ponto de entrada da escolha de classe pelo jogador.
  // CLASS_PROFILES é uma const de escopo global do script 01-core.js, portanto
  // não deve ser acessada como window.CLASS_PROFILES.
  window.chooseClass=function(pid,classe){
    const allowed=Object.keys(typeof CLASS_PROFILES!=='undefined' ? CLASS_PROFILES : {});
    const p=(data.jogadores||[]).find(x=>String(x.id)===String(pid));
    if(!p){toast('Ficha do jogador não encontrada.');return;}
    if(!window.classChoiceOpen(pid)){toast('A escolha de classe ainda não foi liberada pelo Mestre para esta ficha.');return;}
    if(p.classe){toast(`${p.nome} já possui a classe ${p.classe}.`);return;}
    if(!allowed.includes(classe)){toast('Classe inválida ou catálogo de classes não carregado.');return;}
    if(typeof applyClassProfile!=='function'){toast('Motor de classes não carregado.');return;}
    applyClassProfile(p,classe);
    p.classeEscolhidaEm='5º andar — O Despertar';
    logAction(`${p.nome} descobriu e escolheu a classe ${classe}.`);
    saveLocal(); renderPlayerCards(); renderMaster(); renderSheet();
    setTimeout(()=>{
      if(typeof window.openClassSkillPicker==='function') window.openClassSkillPicker(pid,classe);
      else toast('Seletor de perícias da classe não foi carregado.');
    },120);
  };

  // Ao sair do 5º andar, nenhuma liberação individual permanece ativa.
  const oldSetFloor=window.setFloor;
  if(typeof oldSetFloor==='function'&&!oldSetFloor.__v0988){
    const wrapped=function(f){const result=oldSetFloor.apply(this,arguments);if(Number(campaign().andarAtual)!==5){campaign().escolhaClasseLiberadaPara=[];campaign().escolhaClasseLiberada=false;saveLocal();}safeRender();return result;};
    wrapped.__v0988=true;window.setFloor=wrapped;
  }

  function boot(){hook();setTimeout(hook,300);setTimeout(hook,1000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.MasterCardControlsV0988={render,release:releaseForPlayer,isReleased};
})();

