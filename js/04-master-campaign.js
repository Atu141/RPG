function renderMasterBase(){
  const players=$('#masterPlayers'); if(players){
    players.innerHTML=data.jogadores.map(p=>`<div class="entity master-player-card"><div class="entity-avatar">${esc(p.nome.split(' ').map(x=>x[0]).slice(0,2).join(''))}</div><div class="entity-info"><b>${esc(p.nome)}</b><small>${esc(p.classe||'Classe não definida')} • Defesa ${p.defesa}</small></div><div class="master-class-control"><select class="control-select" data-class-player="${p.id}"><option value="">${p.classe?'Classe escolhida':'Sem classe'}</option><option value="Combatente" ${p.classe==='Combatente'?'selected':''}>Combatente</option><option value="Especialista" ${p.classe==='Especialista'?'selected':''}>Especialista</option><option value="Ocultista" ${p.classe==='Ocultista'?'selected':''}>Ocultista</option></select>${p.classe?`<button class="dice-btn secondary" data-config-class-skills="${p.id}">PERÍCIAS</button><button class="dice-btn secondary" data-reset-class="${p.id}">REINICIAR</button>`:''}</div><div class="manual-resources"><label>PV<input type="number" min="0" max="${p.pvMax}" value="${p.pv}" data-resource="pv" data-id="${p.id}"></label><label>PE<input type="number" min="0" max="${p.peMax}" value="${p.pe}" data-resource="pe" data-id="${p.id}"></label><label>SAN<input type="number" min="0" max="${p.sanMax}" value="${p.san}" data-resource="san" data-id="${p.id}"></label></div><details class="master-skills"><summary>PERÍCIAS / TREINAMENTO</summary><div class="master-skill-grid">${(p.pericias||[]).map((x,i)=>`<label title="${x.requerTreinamento?'Perícia com asterisco: exige treinamento.':'Pode ser usada sem treinamento.'}"><input type="checkbox" data-train-player="${p.id}" data-train-index="${i}" ${x.treinada?'checked':''}>${esc(skillLabel(x))}</label>`).join('')}</div></details><details class="master-identity"><summary>IDENTIDADE / HISTÓRICO</summary><div class="master-identity-grid"><span><b>Idade</b>${esc(p.idade||'Não definida')}</span><span><b>Profissão</b>${esc(p.profissao||'Não definida')}</span><span><b>Aparência</b>${esc(p.aparencia||'Não definida')}</span><span><b>Personalidade</b>${esc(p.personalidade||'Não definida')}</span><span><b>Histórico</b>${esc(p.historico||'Não definido')}</span></div></details>${ritualMasterBlock(p)}${renderInventoryMaster(p)}</div>`).join('');
    players.querySelectorAll('[data-resource]').forEach(i=>i.onchange=()=>updatePlayerResource(i.dataset.id,i.dataset.resource,+i.value));
    players.querySelectorAll('[data-class-player]').forEach(i=>i.onchange=()=>setMasterClass(i.dataset.classPlayer,i.value));
    players.querySelectorAll('[data-reset-class]').forEach(b=>b.onclick=()=>resetClassChoice(b.dataset.resetClass));
    players.querySelectorAll('[data-config-class-skills]').forEach(b=>b.onclick=()=>configureClassSkills(b.dataset.configClassSkills));
    players.querySelectorAll('[data-train-player]').forEach(i=>i.onchange=()=>setSkillTraining(i.dataset.trainPlayer,+i.dataset.trainIndex,i.checked));
    players.querySelectorAll('[data-add-item]').forEach(b=>b.onclick=()=>{const sel=b.parentElement.querySelector('[data-item-select]');const [type,index]=String(sel?.value||'').split(':');if(!type||index==='')return toast('Selecione um item ou arma.');addPlayerItem(b.dataset.addItem,type,index,b.parentElement.querySelector('[data-item-qty]').value);});
    players.querySelectorAll('[data-new-item]').forEach(b=>b.onclick=()=>createAndAddPlayerItem(b.dataset.newItem));
    players.querySelectorAll('[data-toggle-equip]').forEach(b=>b.onclick=()=>togglePlayerItemEquipped(b.dataset.toggleEquip,+b.dataset.itemIndex));
    players.querySelectorAll('[data-remove-item]').forEach(b=>b.onclick=()=>removePlayerItem(b.dataset.removeItem,+b.dataset.itemIndex,1));
    players.querySelectorAll('[data-add-ritual]').forEach(b=>b.onclick=()=>{const sel=b.parentElement.querySelector('[data-ritual-select]');addRitualToPlayer(b.dataset.addRitual,sel?.value);});
    players.querySelectorAll('[data-remove-ritual]').forEach(b=>b.onclick=()=>removeRitualFromPlayer(b.dataset.removeRitual,+b.dataset.ritualIndex));
    players.querySelectorAll('[data-toggle-ritual]').forEach(b=>b.onclick=()=>toggleRitualAvailability(b.dataset.toggleRitual,+b.dataset.ritualIndex));
  }
  const monsters=$('#masterMonsters'); if(monsters){
    const catalog=Array.isArray(window.THREAT_CATALOG)?window.THREAT_CATALOG:[];
    const options=catalog.map(m=>`<option value="${esc(m.catalogId||m.id)}">${esc(m.nome)}${m.vd!=null?` — VD ${esc(m.vd)}`:``}${m.elemento?` • ${esc(m.elemento)}`:``}</option>`).join('');
    const rows=data.monstros.map(m=>{
      const attacks=(m.ataques||[]).slice(0,3).map(a=>`${esc(a.nome)}: ${esc(a.teste||'—')} • ${esc(a.dano||'—')}`).join('<br>')||'Nenhum ataque cadastrado';
      return `<article class="entity master-monster-card">
        <div class="entity-avatar">☠</div>
        <div class="entity-info"><b>${esc(m.nome)}</b><small>${esc(m.tipo||'Criatura')} • ${esc(m.elemento||'—')} • VD ${esc(m.vd??'—')} • Defesa ${esc(m.defesa??'—')}</small><small>PV ${esc(m.pv??0)}/${esc(m.pvMax??m.pvBase??0)}${m.catalogId?` • Catálogo: ${esc(m.catalogId)}`:''}</small><small class="monster-attacks">${attacks}</small></div>
        <div class="manual-hp"><input type="number" min="0" max="${Number(m.pvMax??m.pvBase??m.pv??0)}" value="${Number(m.pv??0)}" data-id="${esc(m.id)}" data-monster="1"><small>/ ${Number(m.pvMax??m.pvBase??m.pv??0)} PV</small></div>
        <div class="monster-actions"><button class="dice-btn" data-monster-roll="${esc(m.id)}">ROLAR</button><button class="dice-btn secondary" data-monster-delete="${esc(m.id)}">EXCLUIR</button></div>
      </article>`;
    }).join('');
    monsters.innerHTML=`<div class="monster-manager-toolbar"><div class="monster-manager-copy"><b>Adicionar monstro</b><small>Catálogo carregado de <code>ameacas.json</code>. A criação adiciona uma instância à sessão.</small></div><select id="masterMonsterCatalogSelect" class="control-select"><option value="">Selecionar ameaça...</option>${options}</select><button class="dice-btn" id="masterMonsterAddBtn">＋ ADICIONAR</button></div><div class="master-monster-list">${rows||'<p class="muted">Nenhum monstro adicionado à sessão.</p>'}</div>`;
    monsters.querySelector('#masterMonsterAddBtn')?.addEventListener('click',()=>{const id=monsters.querySelector('#masterMonsterCatalogSelect')?.value;if(!id)return toast('Selecione uma ameaça.');try{if(window.ThreatEngine?.add)ThreatEngine.add(id);else throw Error('Catálogo de ameaças ainda não carregado.');toast('Monstro adicionado à sessão.');renderMaster();}catch(err){toast(err.message||'Não foi possível adicionar o monstro.');}});
    monsters.querySelectorAll('[data-monster-delete]').forEach(b=>b.onclick=()=>{const id=b.dataset.monsterDelete,m=data.monstros.find(x=>x.id===id);if(!m)return;if(!confirm(`Excluir "${m.nome}" da sessão?`))return;data.monstros=data.monstros.filter(x=>x.id!==id);GameEngineV070?.log?.('THREAT_REMOVED',{nome:m.nome,resumo:`Ameaça removida: ${m.nome}`});saveLocal();renderMaster();toast('Monstro excluído.');});
    monsters.querySelectorAll('[data-monster-roll]').forEach(b=>b.onclick=()=>openMonsterDice(b.dataset.monsterRoll));
    monsters.querySelectorAll('.manual-hp input[data-monster]').forEach(i=>i.onchange=()=>{const m=data.monstros.find(x=>x.id===i.dataset.id);if(!m)return;m.pv=Math.max(0,Math.min(Number(m.pvMax??m.pvBase??m.pv??0),+i.value||0));saveLocal();toast('PV do monstro atualizado');});
  }
}
function setMasterClass(pid,classe){
  const allowed=Object.keys(CLASS_PROFILES); const p=data.jogadores.find(x=>x.id===pid);
  if(!p)return; if(!classe){ resetClassChoice(pid); return; } if(!allowed.includes(classe))return;
  applyClassProfile(p,classe); p.classeEscolhidaEm=p.classeEscolhidaEm||'Definida pelo Mestre';
  logAction(`${p.nome}: classe definida pelo Mestre como ${classe}.`); saveLocal(); renderMaster(); renderPlayerCards();
  if(selectedPlayer?.id===pid){selectedPlayer=p;renderSheet();} toast(`${p.nome}: ${classe}`);
}
function updatePlayerResource(id,resource,value){
  const p=data.jogadores.find(x=>x.id===id); if(!p)return;
  const maxKey=resource+'Max'; const max=Number(p[maxKey])||0;
  p[resource]=Math.max(0,Math.min(max,Number(value)||0));
  logAction(`${p.nome}: ${resource.toUpperCase()} atualizado para ${p[resource]}/${max}.`);
  saveLocal();
  if(selectedPlayer && selectedPlayer.id===id){ selectedPlayer=p; renderSheet(); }
  renderMaster(); toast(`${resource.toUpperCase()} atualizado`);
}
function setSkillTraining(pid,index,trained){
  const player=data.jogadores.find(x=>x.id===pid); const skill=player?.pericias?.[index]; if(!skill)return;
  skill.treinada=Boolean(trained);
  logAction(`${player.nome}: ${skill.nome} ${skill.treinada?'marcada como treinada':'marcada como não treinada'}.`);
  saveLocal(); renderMaster(); if(selectedPlayer?.id===pid){ selectedPlayer=player; renderSheet(); }
  toast(`${skill.nome}: ${skill.treinada?'Treinada (+5)':'Não treinada'}`);
}

function openAttributeDice(pid,attribute){
  const player=data.jogadores.find(x=>x.id===pid); if(!player)return;
  const value=Number(player.atributos?.[attribute]);
  if(!Number.isFinite(value))return toast('Atributo não encontrado');
  const labels={FOR:'Força',AGI:'Agilidade',INT:'Intelecto',PRE:'Presença',VIG:'Vigor'};
  diceState={type:'attribute',pid,formula:`1d20${value>=0?'+':''}${value}`,title:`${labels[attribute]||attribute} — Teste de Atributo`,dt:getSkillDT(),attribute:true};
  $('#diceTitle').textContent=diceState.title;
  $('#diceFormula').textContent=`${labels[attribute]||attribute} ${value>=0?'+':''}${value} • ${diceState.formula}`;
  $('#diceResult').textContent='—'; $('#diceBreakdown').textContent='';
  $('#diceDTWrap').style.display='block'; $('#diceDT').value=diceState.dt; $('#diceDT').disabled=true;
  $('#diceOutcome').textContent=''; $('#diceOutcome').className='dice-outcome';
  $('#rollAgain').style.display='block'; $('#diceModal').classList.add('show'); roll();
}

function openSkillDice(pid,index){
  const player=data.jogadores.find(x=>x.id===pid); if(!player)return;
  const skill=(player.pericias||[])[index]; if(!skill)return;
  const formula=skillFormula(player,skill);
  diceState={type:'skill',pid,formula,title:`${skill.nome} — Perícia`,dt:getSkillDT(),skill:true};
  $('#diceTitle').textContent=diceState.title;
  $('#diceFormula').textContent=`${skill.treinada?'Treinada (+5)':'Não treinada'} • ${skill.atributoLabel||skill.atributo||'Perícia'} • ${diceState.formula}`;
  $('#diceResult').textContent='—'; $('#diceBreakdown').textContent='';
  $('#diceDTWrap').style.display='block'; $('#diceDT').value=diceState.dt; $('#diceDT').disabled=true;
  $('#diceOutcome').textContent=''; $('#diceModal').classList.add('show'); roll();
}
function openKillerSheet(id){
  const k=data.assassinos.find(x=>x.id===id); if(!k)return;
  const attacks=(k.ataques||[]).map((a,i)=>`<div class="killer-sheet-attack"><div><b>${esc(a.nome)}</b><small>Teste ${esc(a.teste)} • Dano ${esc(a.dano)}</small></div><div><button class="dice-btn" onclick="openKillerRoll('${k.id}',${i},'attack')">ATACAR</button><button class="dice-btn secondary" onclick="openKillerRoll('${k.id}',${i},'damage')">DANO</button></div></div>`).join('');
  const weaknesses=(k.fraquezas||[]).map(w=>`<li>${esc(w)}</li>`).join('') || '<li>Nenhuma cadastrada</li>';
  $('#diceTitle').textContent=k.nome; $('#diceFormula').textContent=`${k.elemento} • Defesa ${k.defesa} • PV ${k.pv}`;
  $('#diceResult').innerHTML='';
  $('#diceBreakdown').innerHTML=`<div class="killer-sheet"><p>${esc(k.descricao)}</p><div class="killer-meta"><span>Andar: <b>${k.andar}º</b></span><span>Estado: <b>${esc(k.estado)}</b></span><span>Sala: <b>${esc(k.sala)}</b></span></div><h3>Fraquezas</h3><ul>${weaknesses}</ul><h3>Ataques</h3>${attacks}</div>`;
  $('#rollAgain').style.display='none'; $('#diceModal').classList.add('show');
}
function openKillerRoll(kid,index,type){
  const k=data.assassinos.find(x=>x.id===kid); const a=k?.ataques?.[index]; if(!a)return;
  diceState={type,formula:type==='attack'?a.teste:a.dano,title:`${k.nome} — ${a.nome} (${type==='attack'?'Ataque':'Dano'})`};
  $('#diceTitle').textContent=diceState.title; $('#diceFormula').textContent=diceState.formula; $('#diceResult').textContent='—'; $('#diceBreakdown').textContent=''; $('#rollAgain').style.display='block'; $('#diceModal').classList.add('show'); roll();
}

function renderCampaign(){
  const c=data.campanha;
  const f=data.andares.find(x=>x.id===Number(c.andarAtual));
  const pursuitStates=['Normal','Alerta','Caça','Perseguição'];
  $('#campaignInfo').innerHTML=`
    <div><span>ANDAR ATUAL</span><b>${c.andarAtual}º — ${esc(f?.nome||'')}</b></div>
    <div><span>ELEMENTO</span><b>${esc(f?.elemento||'')}</b></div>
    <div><span>OBJETIVO ATUAL</span><b>${esc(c.objetivoAtual)}</b></div>
    <div><span>PERSEGUIÇÃO</span><b class="pursuit-${String(c.perseguicao).toLowerCase()}">${esc(c.perseguicao)}</b></div>
    <div><span>CHAVES</span><b>${c.chavesEncontradas.length}/${data.andares.length}</b></div>
    <div class="master-controls campaign-controls">
      <button class="ghost small" id="prevFloor">↑ Subir</button>
      <button class="ghost small" id="nextFloor">↓ Descer</button>
      <select id="floorSelect" class="control-select">${data.andares.slice().sort((a,b)=>b.id-a.id).map(a=>`<option value="${a.id}" ${a.id===c.andarAtual?'selected':''}>${a.id}º — ${esc(a.nome)}</option>`).join('')}</select>
      <input id="objectiveInput" class="control-input" value="${esc(c.objetivoAtual)}" aria-label="Novo objetivo">
      <button class="ghost small" id="saveObjective">✓ Salvar objetivo</button>
      <select id="pursuitSelect" class="control-select">${pursuitStates.map(x=>`<option value="${x}" ${x===c.perseguicao?'selected':''}>${x}</option>`).join('')}</select>
      <button class="ghost small" id="savePursuit">⚠ Aplicar perseguição</button>
      <label class="dt-control">DT padrão das perícias<input id="skillDTInput" class="control-input" type="number" min=1 max=50 value="${getSkillDT()}"></label>
      <button class="ghost small" id="saveSkillDT">🎯 Aplicar DT</button>
      <label class="class-release-control"><input id="classChoiceToggle" type="checkbox" ${c.escolhaClasseLiberada?'checked':''}> Liberar escolha de classe no 5º andar</label>
    </div>`;
  $('#prevFloor').onclick=()=>changeFloor(1);
  $('#nextFloor').onclick=()=>changeFloor(-1);
  $('#floorSelect').onchange=e=>setFloor(Number(e.target.value));
  $('#saveObjective').onclick=()=>setObjective($('#objectiveInput').value);
  $('#savePursuit').onclick=()=>setPursuit($('#pursuitSelect').value);
  $('#saveSkillDT').onclick=()=>setSkillDT($('#skillDTInput').value);
  $('#classChoiceToggle').onchange=e=>setClassChoiceRelease(e.target.checked);
  renderKillers();renderPuzzles();renderActivities();
}
function saveLocal(){localStorage.setItem('op-fichas-state',JSON.stringify(data));}
function logAction(message){if(!Array.isArray(data.logs))data.logs=[];data.logs.push(`${new Date().toLocaleTimeString()} — ${message}`);}
function setFloor(floor){const next=Math.max(1,Math.min(9,Number(floor)||5));data.campanha.andarAtual=next;logAction(`Andar alterado para ${next}º.`);saveLocal();renderMaster();renderCampaign();if(selectedPlayer)renderSheet();toast(`Andar ${next}º`)}
function changeFloor(delta){setFloor(Number(data.campanha.andarAtual)+delta)}
function setObjective(value){const x=String(value||'').trim();if(!x){toast('Digite um objetivo');return}data.campanha.objetivoAtual=x;logAction('Objetivo da campanha alterado.');saveLocal();renderCampaign();if(selectedPlayer)renderSheet();toast('Objetivo atualizado')}
function editObjective(){setObjective(prompt('Novo objetivo:',data.campanha.objetivoAtual))}
function setPursuit(value){
  if(!PURSUIT_STAGES.includes(value))return;
  const previous=data.campanha.perseguicao||'Normal';
  data.campanha.perseguicao=value;
  if(value==='Perseguição'){
    data.campanha.perseguicaoAtiva=true;
    data.campanha.perseguicaoRodada=Number(data.campanha.perseguicaoRodada)||1;
    showAlert('PERSEGUIÇÃO INICIADA', data.campanha.perseguicaoAlvo ? `Alvo: ${data.campanha.perseguicaoAlvo}` : 'Uma ameaça está muito próxima.', 'danger');
    playHorrorSound('chase');
  } else if(previous==='Perseguição' && value!=='Perseguição'){
    data.campanha.perseguicaoAtiva=false;
    showAlert('PERSEGUIÇÃO ENCERRADA','O perigo parece ter se afastado.','success');
    playHorrorSound('release');
  } else if(value==='Alerta' || value==='Caça'){
    showAlert(value.toUpperCase(), value==='Alerta'?'Algo chamou a atenção da ameaça.':'A ameaça começou a procurar vocês.','warning');
    playHorrorSound('warning');
  }
  logAction(`Estado de perseguição: ${value}.`);saveLocal();renderCampaign();renderMaster();if(selectedPlayer)renderSheet();toast(value);
  if(value==='Perseguição' && selectedPlayer) openHorrorScreen(selectedPlayer);
}
function cyclePursuit(){const states=['Normal','Alerta','Caça','Perseguição'];let i=states.indexOf(data.campanha.perseguicao);setPursuit(states[(i+1)%states.length])}
function renderKillers(){
  if(!$('#killerInfo'))return;
  $('#killerInfo').innerHTML=data.assassinos.map(k=>`<div class="entity killer"><div class="entity-avatar">🔪</div><div class="entity-info"><b>${esc(k.nome)}</b><small>${esc(k.elemento)} • Andar ${k.andar}º • ${esc(k.inspiracao)}</small><small>Movimentação: 1º–4º e 6º–9º • 5º andar bloqueado</small><small>Estado: <b>${esc(k.estado)}</b> • Sala: ${esc(k.sala)}</small></div><div class="killer-actions"><button class="dice-btn secondary" onclick="openKillerSheet('${k.id}')">FICHA</button><button class="dice-btn" onclick="toggleKiller('${k.id}')">${k.ativo?'DESATIVAR':'ATIVAR'}</button><button class="dice-btn secondary" onclick="moveKiller('${k.id}')">MOVER</button></div></div>`).join('');
}
function renderPuzzles(){
  const el=$('#puzzleInfo'); if(!el)return;
  const progressKeys=data.enigmas.filter(e=>Number(e.chave)>=1&&Number(e.chave)<=4).sort((a,b)=>Number(a.chave)-Number(b.chave));
  const other=data.enigmas.filter(e=>!(Number(e.chave)>=1&&Number(e.chave)<=4));
  const keyCards=progressKeys.map(e=>`<div class="entity puzzle-key ${e.resolvido?'puzzle-done':''}"><div class="entity-avatar key-avatar">${e.resolvido?'✓':`K${e.chave}`}</div><div class="entity-info puzzle-details"><b>${esc(e.tipo||`Chave ${e.chave}`)} — ${esc(e.nome)}</b><small><strong>Rota:</strong> Hall ou Terraço — enigma compartilhado</small><small><strong>Local:</strong> ${esc(e.local||'Localização definida pelo Mestre')}</small><small><strong>Uso:</strong> ${esc(e.uso||'Pode ser utilizado independentemente da rota escolhida.')}</small><small><strong>Enigma:</strong> ${esc(e.descricao)}</small><small><strong>Pista:</strong> ${esc(e.pista)}</small><small><strong>Solução:</strong> ${esc(e.solucao)}</small><small><strong>Recompensa:</strong> ${esc(e.recompensa)}</small></div><button class="dice-btn" onclick="togglePuzzle('${e.id}')">${e.resolvido?'REABRIR':'RESOLVER'}</button></div>`).join('');
  const otherCards=other.map(e=>`<div class="entity"><div class="entity-avatar">${e.resolvido?'✓':'?'}</div><div class="entity-info"><b>${esc(e.nome)}</b><small>${e.andar ? `Andar ${e.andar}º` : 'Rota especial'} • Recompensa: ${esc(e.recompensa)}</small><small>Pista: ${esc(e.pista)}</small></div><button class="dice-btn" onclick="togglePuzzle('${e.id}')">${e.resolvido?'REABRIR':'RESOLVER'}</button></div>`).join('');
  el.innerHTML=`<div class="puzzle-progress"><div class="puzzle-progress-title"><b>Progressão por chaves</b><span>${progressKeys.filter(e=>e.resolvido).length}/4 concluídas</span></div>${keyCards}</div>${otherCards?`<div class="puzzle-other-title">Outros enigmas</div>${otherCards}`:''}`;
}
function renderActivities(){
  const el=$('#activityInfo'); if(!el)return;
  const statuses=['Bloqueada','Em andamento','Concluída'];
  el.innerHTML=data.atividades.map(a=>`<div class="entity activity-row"><div class="entity-avatar">${a.status==='Concluída'?'✓':a.status==='Em andamento'?'▶':'🔒'}</div><div class="entity-info"><b>${esc(a.nome)}</b><small>Status: ${esc(a.status)}</small></div><select class="control-select activity-status" data-activity="${a.id}">${statuses.map(st=>`<option value="${st}" ${st===a.status?'selected':''}>${st}</option>`).join('')}</select></div>`).join('');
  document.querySelectorAll('.activity-status').forEach(s=>s.onchange=()=>setActivityStatus(Number(s.dataset.activity),s.value));
}
function setActivityStatus(id,status){const a=data.atividades.find(x=>x.id===id);if(!a)return;a.status=status;logAction(`Atividade "${a.nome}": ${status}.`);saveLocal();renderActivities();toast('Atividade atualizada')}
function toggleKiller(id){const k=data.assassinos.find(x=>x.id===id);k.ativo=!k.ativo;k.estado=k.ativo?'Caçando':'Oculto';logAction(`${k.nome}: ${k.estado}.`);saveLocal();renderKillers();toast(`${k.nome}: ${k.estado}`)}
function moveKiller(id){const k=data.assassinos.find(x=>x.id===id);if(!k)return;const allowed=[1,2,3,4,6,7,8,9];const raw=prompt('Novo andar (1-4 ou 6-9). O 5º andar é protegido e não pode receber assassinos:',k.andar);if(raw===null)return;const n=Number(raw);if(!allowed.includes(n)){toast('Andar inválido: assassinos não podem ocupar o 5º andar.');return}k.andar=n;k.sala=prompt('Sala/localização secreta:',k.sala)||k.sala;logAction(`${k.nome} movido para o ${n}º andar.`);saveLocal();renderKillers();toast('Assassino movido')}
function togglePuzzle(id){const e=data.enigmas.find(x=>x.id===id);if(!e)return;e.resolvido=!e.resolvido;const keyValue=Number(e.chave);if(keyValue>=1&&keyValue<=4){data.campanha.chavesEncontradas=Array.isArray(data.campanha.chavesEncontradas)?data.campanha.chavesEncontradas.filter(x=>Number(x)!==keyValue):[];if(e.resolvido)data.campanha.chavesEncontradas.push(keyValue);}else{const floor=data.andares.find(x=>x.id===e.andar);if(e.resolvido&&floor&&!data.campanha.chavesEncontradas.includes(floor.chave))data.campanha.chavesEncontradas.push(floor.chave);if(!e.resolvido&&floor)data.campanha.chavesEncontradas=data.campanha.chavesEncontradas.filter(x=>x!==floor.chave);}logAction(`${e.nome}: ${e.resolvido?'resolvido':'reaberto'}.`);saveLocal();renderPuzzles();renderCampaign();if(selectedPlayer)renderSheet();toast(e.resolvido?'Enigma resolvido':'Enigma reaberto')}



// ===== v0.20: horror, perseguição, alertas, áudio e efeitos =====

function configureClassSkills(pid){
  const p=data.jogadores.find(x=>x.id===pid); if(!p||!p.classe)return;
  const profile=CLASS_PROFILES[p.classe];
  const current=(p.treinadasClasse||[]).join(', ');
  const mandatory=profile.escolhaPericias?.length?`
Obrigatórias de escolha: ${profile.escolhaPericias.join(' / ')}`:'';
  const required=profile.periciasQuantidade(p);
  const text=prompt(`${p.nome} — ${p.classe}\n\nPerícias escolhidas pela classe: ${required}.${mandatory}\nDigite os nomes separados por vírgula.\n\nAtuais: ${current||'nenhuma'}` ,current);
  if(text===null)return;
  setClassTraining(pid,text.split(','));
}
