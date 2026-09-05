function show(id){document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active')); $('#'+id).classList.add('active'); document.querySelectorAll('.role-btn').forEach(b=>b.classList.toggle('active',b.dataset.screen===id|| (id==='playerSheet'&&b.dataset.screen==='playerHome')))}

function renderPlayerCards(){ $('#playerCards').innerHTML=data.jogadores.map(p=>`<button class="player-card" data-id="${p.id}"><div class="avatar">${esc(p.nome.split(' ').map(x=>x[0]).slice(0,2).join(''))}</div><div><b>${esc(p.nome)}</b><small>${esc(p.classe||'Classe não definida')} • NEX ${esc(p.nex)}</small></div><span>→</span></button>`).join(''); document.querySelectorAll('.player-card').forEach(b=>b.onclick=()=>openSheet(b.dataset.id)); }

function openCreateSheetModal(){
  const modal=$('#createSheetModal'); if(!modal)return;
  $('#newCharacterName').value=''; if($('#newCharacterOrigin')) $('#newCharacterOrigin').value=''; $('#createSheetError').textContent='';
  modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
  setTimeout(()=>$('#newCharacterName')?.focus(),50);
}
function closeCreateSheetModal(){
  const modal=$('#createSheetModal'); if(!modal)return;
  modal.classList.remove('show'); modal.setAttribute('aria-hidden','true');
}

function openCharacterCustomization(pid){
  const player=data?.jogadores?.find(x=>x.id===pid); if(!player)return;
  $('#customCharacterPlayer').value=pid;
  $('#customCharacterName').value=player.nome||'';
  $('#customCharacterAge').value=player.idade||'';
  $('#customCharacterProfession').value=player.origem||player.profissao||'';
  $('#customCharacterAppearance').value=player.aparencia||'';
  $('#customCharacterPersonality').value=player.personalidade||'';
  $('#customCharacterHistory').value=player.historico||'';
  $('#customCharacterError').textContent='';
  const modal=$('#customCharacterModal'); modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
  setTimeout(()=>$('#customCharacterName')?.focus(),50);
}
function closeCharacterCustomization(){
  const modal=$('#customCharacterModal'); if(!modal)return;
  modal.classList.remove('show'); modal.setAttribute('aria-hidden','true');
}
function saveCharacterCustomization(){
  const pid=$('#customCharacterPlayer')?.value;
  const player=data?.jogadores?.find(x=>x.id===pid); if(!player)return;
  const name=String($('#customCharacterName')?.value||'').trim();
  const age=String($('#customCharacterAge')?.value||'').trim();
  const profession=player.origem||player.profissao||'';
  const appearance=String($('#customCharacterAppearance')?.value||'').trim();
  const personality=String($('#customCharacterPersonality')?.value||'').trim();
  const history=String($('#customCharacterHistory')?.value||'').trim();
  const error=$('#customCharacterError');
  if(!ORIGIN_PROFILES[profession]){if(error)error.textContent='A Profissão / Origem desta ficha não é válida. Selecione uma origem oficial na criação do personagem.'; return;}
  if(name.length<2){error.textContent='Informe um nome com pelo menos 2 caracteres.'; return;}
  if(name.length>50){error.textContent='O nome deve ter no máximo 50 caracteres.'; return;}
  const duplicate=data.jogadores.some(x=>x.id!==pid&&String(x.nome||'').trim().toLowerCase()===name.toLowerCase());
  if(duplicate){error.textContent='Já existe outra ficha com esse nome. Escolha outro nome.'; return;}
  player.nome=name; player.idade=age; player.profissao=profession; player.origem=profession; player.aparencia=appearance; player.personalidade=personality; player.historico=history;
  logAction(`${player.nome}: identidade e histórico personalizados pelo jogador.`);
  saveLocal(); renderPlayerCards(); renderMaster();
  selectedPlayer=player; renderSheet(); closeCharacterCustomization();
  toast('Personalização salva');
}
function buildNewPlayer(name, origem){
  const now=Date.now();
  const baseId='p_'+now.toString(36)+'_'+Math.random().toString(36).slice(2,7);
  const pericias=SKILL_CATALOG.map(([nome,atributo,requerTreinamento])=>({
    nome,atributo,
    atributoLabel:atributo==='INT/PRE'?'Intelecto ou Presença':({AGI:'Agilidade',FOR:'Força',INT:'Intelecto',PRE:'Presença',VIG:'Vigor'}[atributo]||atributo),
    requerTreinamento,treinada:false,teste:'AUTO'
  }));
  return {
    id:baseId,nome:name.trim(),nex:'5%',classe:null,origem:origem,profissao:origem,
    pv:16,pvMax:16,pe:10,peMax:10,san:18,sanMax:18,defesa:11,
    atributos:{FOR:1,AGI:1,INT:1,PRE:1,VIG:1},
    ataques:[{nome:'Soco',teste:'1d20+1',dano:'1d3+1',categoria:'corpo-a-corpo'},{nome:'Improvisado',teste:'1d20+1',dano:'1d4',categoria:'corpo-a-corpo'}],
    pericias,
    itens:[{nome:'Lanterna',descricao:'Iluminação portátil.',quantidade:1,tipo:'equipamento',equipado:false,teste:'',dano:'',bonus:''}]
  };
}
function createPlayerSheet(){
  const input=$('#newCharacterName'), originInput=$('#newCharacterOrigin'), error=$('#createSheetError');
  const name=String(input?.value||'').trim();
  const origem=String(originInput?.value||'').trim();
  if(!ORIGIN_PROFILES[origem]){if(error)error.textContent='Selecione uma profissão/origem válida do sistema.'; originInput?.focus(); return;}
  if(name.length<2){if(error)error.textContent='Informe um nome com pelo menos 2 caracteres.'; input?.focus(); return;}
  if(data.jogadores.some(p=>String(p.nome||'').trim().toLowerCase()===name.toLowerCase())){if(error)error.textContent='Já existe uma ficha com esse nome. Escolha outro nome.'; input?.focus(); return;}
  const player=buildNewPlayer(name,origem);
  applyOriginProfile(player);
  data.jogadores.push(player);
  if(typeof V030!=='undefined'&&V030.ensure)V030.ensure();
  logAction(`${player.nome}: nova ficha criada pelo jogador com regras iniciais da campanha.`);
  saveLocal(); renderPlayerCards(); renderMaster(); renderCampaign();
  closeCreateSheetModal();
  selectedPlayer=player; show('playerSheet'); renderSheet();
  toast(`Ficha criada: ${player.nome}`);
}

function openSheet(id){selectedPlayer=data.jogadores.find(p=>p.id===id); show('playerSheet'); renderSheet();}
function classChoiceOpen(){ return Boolean(data?.campanha?.escolhaClasseLiberada) && Number(data?.campanha?.andarAtual)===5; }
function chooseClass(pid, classe){
  const allowed=Object.keys(CLASS_PROFILES);
  const p=data.jogadores.find(x=>x.id===pid);
  if(!p || !classChoiceOpen() || p.classe || !allowed.includes(classe)) return;
  applyClassProfile(p,classe);
  p.classeEscolhidaEm='5º andar — O Despertar';
  logAction(`${p.nome} descobriu e escolheu a classe ${classe}.`);
  saveLocal(); renderPlayerCards(); renderMaster(); renderSheet();
  toast(`Classe descoberta: ${classe}`);
  setTimeout(()=>configureClassSkills(pid),120);
}
function resetClassChoice(pid){
  const p=data.jogadores.find(x=>x.id===pid); if(!p)return;
  restoreBaseSheet(p); p.classe=null; delete p.classeEscolhidaEm;
  logAction(`${p.nome}: descoberta de classe reiniciada pelo Mestre.`); saveLocal(); renderMaster(); renderPlayerCards();
  if(selectedPlayer?.id===pid){selectedPlayer=p;renderSheet();} toast('Ficha retornou ao estado inicial');
}
function setClassChoiceRelease(value){
  data.campanha.escolhaClasseLiberada=Boolean(value);
  logAction(`Escolha de classe ${data.campanha.escolhaClasseLiberada?'liberada':'bloqueada'}.`);
  saveLocal(); renderMaster(); if(selectedPlayer) renderSheet();
  toast(data.campanha.escolhaClasseLiberada?'Escolha de classe liberada':'Escolha de classe bloqueada');
}
function renderSheetBase(){
  const p=selectedPlayer;
  const pericias=p.pericias||[];
  const className=p.classe||'Classe não definida';
  const classProfile=p.classe?CLASS_PROFILES[p.classe]:null;
  const classDerived=p.classe?classDerivedResources(p,p.classe):null;
  const classSummary=p.classe?classTrainingSummary(p,p.classe):null;
  const classTrained=(p.treinadasClasse||[]).join(', ')||'Configurar pelo Mestre';
  const classEffectBlock=classProfile?`<div class="panel class-effect-panel"><p class="eyebrow">CLASSE • REGRAS V1.3</p><h2>${esc(p.classe)}</h2><p class="muted">${esc(classProfile.descricao)}</p><div class="class-effect-grid"><span>PV Máx. <b>${classDerived.pvMax}</b></span><span>PE Máx. <b>${classDerived.peMax}</b></span><span>SAN Máx. <b>${classDerived.sanMax}</b></span><span>Defesa <b>${classDerived.defesa}</b></span></div><div class="class-attribute-build"><b>Distribuição automática de atributos</b><p>FOR <strong>${p.atributos.FOR}</strong> · AGI <strong>${p.atributos.AGI}</strong> · INT <strong>${p.atributos.INT}</strong> · PRE <strong>${p.atributos.PRE}</strong> · VIG <strong>${p.atributos.VIG}</strong></p><small>${esc(getClassAttributeBuild(p.classe)?.prioridade||'Configuração recomendada para a classe')}</small></div><div class="class-rules-detail"><b>Habilidade no NEX ${esc(p.nex)}</b><p>${esc(classProfile.habilidadeNEX5)}</p><b>Perícias da classe</b><p>${esc(classProfile.escolhaPericias?.length?classProfile.escolhaPericias.join(' / ')+' + '+classSummary.required+' à escolha':' '+classSummary.required+' à escolha')}</p><small>Selecionadas: ${esc(classTrained)}</small><b>Proficiências</b><p>${esc((classProfile.proficiencias||[]).join(', '))}</p><details><summary>Progressão da classe</summary><div class="class-progression">${(classProfile.progressao||[]).map(x=>`<span><b>${esc(x[0])}</b>${esc(x[1])}</span>`).join('')}</div></details></div></div>`:'';
  const originProfile=getOriginProfile(p); const originBlock=originProfile?`<div class="panel origin-effect-panel"><p class="eyebrow">PROFISSÃO / ORIGEM</p><h2>${esc(p.origem||p.profissao)}</h2><p class="muted">Perícias treinadas: ${esc(originProfile.treinadas.length?originProfile.treinadas.join(' e '):'definidas pelo Mestre')}</p><div class="origin-power"><b>${esc(originProfile.poder)}</b><span>${esc(originProfile.descricao)}</span></div>${originProfile.bonus?.defesa?`<small>Defesa: +${originProfile.bonus.defesa}</small>`:''}${originProfile.bonus?.sanPor5NEX?`<small>Sanidade: +${Math.floor((parseInt(String(p.nex||'5'),10)||5)/5)*originProfile.bonus.sanPor5NEX} no NEX atual</small>`:''}</div>`:'';
  const classChoiceBlock=(!p.classe && classChoiceOpen()) ? `<div class="panel class-choice-panel"><p class="eyebrow">MOMENTO DE DECISÃO</p><h2>Escolha sua classe</h2><p class="muted">Vocês acordaram sem qualquer contato anterior com o paranormal. Depois de investigar o 5º andar, chegou o momento de decidir como seu personagem enfrentará o que está acontecendo.</p><div class="class-choice-grid"><button class="class-choice" data-class-choice="${p.id}" data-class="Combatente"><b>Combatente</b><small>Foco em combate, resistência e confronto físico.</small></button><button class="class-choice" data-class-choice="${p.id}" data-class="Especialista"><b>Especialista</b><small>Foco em investigação, perícias e soluções práticas.</small></button><button class="class-choice" data-class-choice="${p.id}" data-class="Ocultista"><b>Ocultista</b><small>Foco em compreender e lidar com fenômenos inexplicáveis.</small></button></div></div>` : '';
  const storyNotice=`<div class="panel story-notice"><p class="eyebrow">O DESPERTAR</p><b>${p.classe?'Você ainda se lembra de como tudo começou: vocês acordaram no 5º andar, sem experiência anterior com o paranormal.':'Vocês acordaram no 5º andar, sem qualquer contato anterior com o paranormal. Investiguem o local antes de decidir quem vocês serão nesta situação.'}</b></div>`;
  const identityBlock=`<div class="panel identity-panel"><div class="identity-head"><div><p class="eyebrow">IDENTIDADE</p><h2>Quem é ${esc(p.nome)}?</h2><p class="muted">Personalize apenas a história e a identidade. Os valores mecânicos da campanha permanecem protegidos.</p></div><button class="ghost" data-customize-character="${p.id}">✎ EDITAR PERSONAGEM</button></div><div class="identity-grid"><div><span>IDADE</span><b>${esc(p.idade||'Não definida')}</b></div><div><span>PROFISSÃO / ORIGEM</span><b>${esc(p.origem||p.profissao||'Não definida')}</b></div><div class="identity-wide"><span>APARÊNCIA</span><p>${esc(p.aparencia||'Não definida')}</p></div><div><span>PERSONALIDADE</span><p>${esc(p.personalidade||'Não definida')}</p></div><div><span>HISTÓRICO</span><p>${esc(p.historico||'Não definido')}</p></div></div></div>`;
  $('#sheetContent').innerHTML=`<div class="player-header"><div><p class="eyebrow">FICHA DO AGENTE</p><h1>${esc(p.nome)}</h1><p class="muted">${esc(className)} • NEX ${esc(p.nex)} • ${esc(data.campanha.nome)}</p></div><div class="player-badge">AGENTE</div></div>${storyNotice}${identityBlock}${originBlock}${classChoiceBlock}${classEffectBlock}<div class="player-layout">
  <div class="panel character-panel"><div class="character-top"><div class="avatar">${esc(p.nome.split(' ').map(x=>x[0]).slice(0,2).join(''))}</div><div><h2>${esc(p.nome)}</h2><p>${esc(className)}</p></div><div class="nex"><span>NEX</span><b>${esc(p.nex)}</b></div></div><div class="stats"><div class="stat"><span>PV</span><strong>${p.pv}</strong><small> / ${p.pvMax}</small></div><div class="stat"><span>PE</span><strong>${p.pe}</strong><small> / ${p.peMax}</small></div><div class="stat"><span>SAN</span><strong>${p.san}</strong><small> / ${p.sanMax}</small></div></div><div class="bar"><i style="width:${Math.max(0,p.pv/p.pvMax*100)}%"></i></div><div class="attributes">${Object.entries(p.atributos).map(([k,v])=>`<button class="attribute-card" data-attribute-player="${p.id}" data-attribute="${k}"><span>${k}</span><b>${v}</b><small>TESTAR</small></button>`).join('')}</div></div>
  <div class="panel items-panel"><div class="panel-title"><div><span class="icon">▤</span><div><h2>Inventário</h2><p>Itens da ficha</p></div></div></div>${p.itens.map((i,idx)=>`<div class="item"><span class="item-icon">${i.tipo==='arma'?'⚔':'▣'}</span><div><b>${esc(i.nome)} ${i.equipado?'<small class="equipped-tag">EQUIPADO</small>':''}</b><small>${itemLabel(i)}${i.tipo==='arma'&&i.teste?` • Teste ${esc(i.teste)}`:''}${i.tipo==='arma'&&i.dano?` • Dano ${esc(i.dano)}`:''}${i.bonus?` • Bônus ${esc(i.bonus)}`:''}</small><small>${esc(i.descricao)}</small></div><strong>${i.quantidade}</strong></div>`).join('')}</div>
  <div class="panel combat-panel"><div class="panel-title"><div><span class="icon">⚔</span><div><h2>Combate corpo a corpo</h2><p>Ataques sem armas</p></div></div></div><div class="combat-row"><span>Defesa</span><b>${p.defesa}</b></div>${unarmedAttacks(p).map(({a,i})=>`<div class="attack"><div><b>${esc(a.nome)}</b><small>Teste ${esc(a.teste)} • Dano ${esc(originAttackDamageFormula(p,a))}</small></div><div><button class="dice-btn" data-roll="attack" data-player="${p.id}" data-index="${i}">ATACAR</button><button class="dice-btn secondary" data-roll="damage" data-player="${p.id}" data-index="${i}">DANO</button></div></div>`).join('') || '<small class="empty-inventory">Nenhum ataque corpo a corpo sem arma cadastrado.</small>'}</div>
  <div class="panel weapon-panel"><div class="panel-title"><div><span class="icon">⚔</span><div><h2>Armas equipadas</h2><p>Armas e outras formas de combate equipadas/cadastradas</p></div></div></div>${otherCombatAttacks(p).map(({a,i})=>`<div class="attack"><div><b>${esc(a.nome)}</b><small>Teste ${esc(a.teste)} • Dano ${esc(originAttackDamageFormula(p,a))}</small></div><div><button class="dice-btn" data-roll="attack" data-player="${p.id}" data-index="${i}">ATACAR</button><button class="dice-btn secondary" data-roll="damage" data-player="${p.id}" data-index="${i}">DANO</button></div></div>`).join('')}${p.itens.filter(i=>itemCombatReady(i)).map((i)=>{const realIndex=p.itens.indexOf(i);return `<div class="attack"><div><b>${esc(i.nome)}</b><small>Teste ${esc(itemFormula(i,'attack'))} • Dano ${esc(itemFormula(i,'damage'))}${i.bonus?` • Bônus ${esc(i.bonus)}`:''}</small></div><div><button class="dice-btn" data-item-roll="attack" data-player="${p.id}" data-item-index="${realIndex}">ATACAR</button><button class="dice-btn secondary" data-item-roll="damage" data-player="${p.id}" data-item-index="${realIndex}">DANO</button></div></div>`}).join('') || (otherCombatAttacks(p).length?'':'<small class="empty-inventory">Nenhuma arma ou outro ataque cadastrado/equipado.</small>')}</div>
  ${ritualPlayerBlock(p)}
  <div class="panel abilities-panel"><div class="panel-title"><div><span class="icon">✧</span><div><h2>Perícias</h2><p>Testes disponíveis</p></div></div></div><div class="skill-list">${pericias.map((x,i)=>`<div class="skill-row"><div><b>${esc(skillLabel(x))}</b><small>${esc(x.atributoLabel||x.atributo||'Perícia')} • ${x.treinada?'Treinada (+5)':'Não treinada'} • Teste ${esc(skillFormula(p,x))}</small></div>${x.requerTreinamento&&!x.treinada?'<button class="dice-btn secondary" disabled title="Esta perícia exige treinamento.">NÃO TREINADA</button>':'<button class="dice-btn secondary" data-skill-player="'+p.id+'" data-skill-index="'+i+'">TESTAR</button>'}</div>`).join('')}</div></div>
  <div class="panel campaign-player"><div class="panel-title"><div><span class="icon">◈</span><div><h2>Campanha</h2><p>Informações públicas da sessão</p></div></div></div><div class="campaign-info"><div><span>ANDAR</span><b>${data.campanha.andarAtual}º</b></div><div><span>OBJETIVO</span><b>${esc(data.campanha.objetivoAtual)}</b></div><div><span>PERSEGUIÇÃO</span><b>${esc(data.campanha.perseguicao)}</b></div><div><span>DT DE PERÍCIAS</span><b>${getSkillDT()}</b></div><div><span>CHAVES ENCONTRADAS</span><b>${data.campanha.chavesEncontradas.filter(x=>Number(x)>=1&&Number(x)<=4).length}/4</b></div></div></div>
  </div>`;
  document.querySelectorAll('.dice-btn[data-roll]').forEach(b=>b.onclick=()=>openDice(b.dataset.roll,b.dataset.player,+b.dataset.index));
  document.querySelectorAll('[data-skill-player]').forEach(b=>b.onclick=()=>openSkillDice(b.dataset.skillPlayer,+b.dataset.skillIndex));
  document.querySelectorAll('[data-attribute-player]').forEach(b=>b.onclick=()=>openAttributeDice(b.dataset.attributePlayer,b.dataset.attribute));
  document.querySelectorAll('[data-class-choice]').forEach(b=>b.onclick=()=>chooseClass(b.dataset.classChoice,b.dataset.class));
  document.querySelectorAll('[data-item-roll]').forEach(b=>b.onclick=()=>openItemDice(b.dataset.player,+b.dataset.itemIndex,b.dataset.itemRoll));
  document.querySelectorAll('[data-customize-character]').forEach(b=>b.onclick=()=>openCharacterCustomization(b.dataset.customizeCharacter));
}
