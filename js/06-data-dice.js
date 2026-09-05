function normalizeData(source){
  const base = source || {};
  const needsSkillMigration = Number(base._skillSchemaVersion||0) < 2;
  const needsStoryMigration = Number(base._storySchemaVersion||0) < 1;
  const needsClassMigration = Number(base._classSchemaVersion||0) < 1;
  base.campanha = base.campanha || {};
  base.campanha.andarAtual = Math.max(1,Math.min(9,Number(base.campanha.andarAtual)||5));
  base.campanha.objetivoAtual = base.campanha.objetivoAtual || 'Explorar o 5º andar, investigar os primeiros sinais e descobrir qual rota de fuga será possível.';
  base.campanha.perseguicao = ['Normal','Alerta','Caça','Perseguição'].includes(base.campanha.perseguicao) ? base.campanha.perseguicao : 'Normal';
  base.campanha.dtPericias = Math.max(1,Math.min(50,Number(base.campanha.dtPericias)||10));
  base.campanha.chavesEncontradas = Array.isArray(base.campanha.chavesEncontradas) ? base.campanha.chavesEncontradas : [];
  base.campanha.escolhaClasseLiberada = Boolean(base.campanha.escolhaClasseLiberada);
  base.campanha.introducao = base.campanha.introducao || 'Vocês acordam no 5º andar sem qualquer contato anterior com o paranormal. A verdade deve ser descoberta durante a investigação.';
  base.campanha.pistasReveladas = Array.isArray(base.campanha.pistasReveladas) ? base.campanha.pistasReveladas : [];
  base.campanha.salasInvestigadas = (base.campanha.salasInvestigadas && typeof base.campanha.salasInvestigadas==='object') ? base.campanha.salasInvestigadas : {};
  base.assassinos=(Array.isArray(base.assassinos)?base.assassinos:[]).map(k=>{const n=Number(k.andar);k.andar=[1,2,3,4,6,7,8,9].includes(n)?n:4; if(n===5)k.andar=4; return k;});
  base.campanha.eventoAtual = base.campanha.eventoAtual || 'Nenhum evento em andamento.';
  base.campanha.horror=base.campanha.horror||{};
  base.campanha.horror.alertas=Array.isArray(base.campanha.horror.alertas)?base.campanha.horror.alertas:[];
  base.campanha.horror.eventos=Array.isArray(base.campanha.horror.eventos)?base.campanha.horror.eventos:[];
  base.campanha.perseguicaoAlvo=base.campanha.perseguicaoAlvo||'';
  base.campanha.perseguicaoAssassino=base.campanha.perseguicaoAssassino||'';
  base.campanha.perseguicaoDistancia=Math.max(0,Number(base.campanha.perseguicaoDistancia)||0);
  base.campanha.perseguicaoRodada=Math.max(1,Number(base.campanha.perseguicaoRodada)||1);
  base.campanha.perseguicaoAtiva=Boolean(base.campanha.perseguicaoAtiva);
  base.pistas = Array.isArray(base.pistas) ? base.pistas : [];
  base.pistas.forEach(x=>{x.revelada=Boolean(x.revelada || base.campanha.pistasReveladas.includes(x.id));});
  base.andares = Array.isArray(base.andares) ? base.andares : [];
  base.andares = base.andares.filter(x=>Number(x.id)>=1 && Number(x.id)<=9).sort((a,b)=>Number(a.id)-Number(b.id));
  base.jogadores = Array.isArray(base.jogadores) ? base.jogadores : [];
  // V0.40.4: a campanha passa a iniciar somente com a ficha aprovada de Arthur Reis.
  // A limpeza é aplicada uma única vez também sobre estados antigos do localStorage;
  // depois disso, novas fichas criadas pelo jogador continuam permitidas.
  if(Number(base._rosterSchemaVersion||0) < 1){
    base.jogadores = base.jogadores.filter(p => p?.id === 'p1' || String(p?.nome||'').trim() === 'Arthur Reis');
    const arthur = base.jogadores.find(p => p?.id === 'p1') || base.jogadores[0];
    base.jogadores = arthur ? [arthur] : [];
  }
  base._rosterSchemaVersion = 1;
  base.jogadores.forEach(p=>{
    p.idade = String(p.idade ?? '').trim();
    p.profissao = String(p.profissao ?? '').trim();
    p.origem = String(p.origem ?? p.profissao ?? '').trim();
    if(p.origem && ORIGIN_PROFILES[p.origem]) p.profissao=p.origem;
    p.aparencia = String(p.aparencia ?? '').trim();
    p.personalidade = String(p.personalidade ?? '').trim();
    p.historico = String(p.historico ?? '').trim();
    if(needsStoryMigration || needsClassMigration){ p.classe=null; delete p.classeEscolhidaEm; restoreBaseSheet(p); }
    else if(p.origem && ORIGIN_PROFILES[p.origem]) { const cls=p.classe; const trained=Array.isArray(p.treinadasClasse)?[...p.treinadasClasse]:[]; const perito=Array.isArray(p.peritoPericias)?[...p.peritoPericias]:[]; restoreBaseSheet(p); if(cls){ applyClassProfile(p,cls); p.treinadasClasse=trained; p.peritoPericias=perito; (p.pericias||[]).forEach(sk=>{ if(trained.includes(sk.nome)) sk.treinada=true; sk.grau=sk.treinada?'treinado':'nao_treinada'; }); } }

    const current=Array.isArray(p.pericias)?p.pericias.map(x=>typeof x==='string'?{nome:x}:x):[];
    const byName=new Map(current.map(x=>[String(x.nome).toLowerCase(),x]));
    p.pericias=SKILL_CATALOG.map(([nome,atributo,treinada])=>{
      const existing=byName.get(nome.toLowerCase())||{};
      const atributoLabel=atributo==='INT/PRE'?'Intelecto ou Presença':({AGI:'Agilidade',FOR:'Força',INT:'Intelecto',PRE:'Presença',VIG:'Vigor'}[atributo]||atributo);
      const inferredTrained=needsSkillMigration ? Boolean(existing.teste&&existing.teste!=='AUTO') : Boolean(existing.treinada); return {...existing,nome,atributo,atributoLabel,requerTreinamento:treinada,treinada:inferredTrained,teste:existing.teste||'AUTO'};
    });
  });
  base.jogadores.forEach(p=>{p.itens=Array.isArray(p.itens)?p.itens.map(normalizeItem):[];});
  base.itensDisponiveis=Array.isArray(base.itensDisponiveis)?base.itensDisponiveis.map(normalizeItem):[];
  const itemMap=new Map(base.itensDisponiveis.map(i=>[i.nome.toLowerCase(),i]));
  base.jogadores.forEach(p=>(p.itens||[]).forEach(i=>{if(!itemMap.has(i.nome.toLowerCase())) itemMap.set(i.nome.toLowerCase(),{nome:i.nome,descricao:i.descricao,quantidade:1});}));
  base.itensDisponiveis=[...itemMap.values()];
  base.monstros = Array.isArray(base.monstros) ? base.monstros : [];
  base.assassinos = Array.isArray(base.assassinos) ? base.assassinos : [];
  base.assassinos.forEach(k=>{ k.ataques=Array.isArray(k.ataques)?k.ataques:[]; k.fraquezas=Array.isArray(k.fraquezas)?k.fraquezas:[]; });
  base.enigmas = Array.isArray(base.enigmas) ? base.enigmas : [];
  base.atividades = Array.isArray(base.atividades) ? base.atividades : [];
  base.logs = Array.isArray(base.logs) ? base.logs : [];
  base._skillSchemaVersion = 2;
  base._itemSchemaVersion = 2;
  base._storySchemaVersion = 1;
  base._classSchemaVersion = 1;
  base._identitySchemaVersion = 2;
  base._originSchemaVersion = 1;
  base._explorationSchemaVersion = 1;
  base._explorationSchemaVersion = 1;
  base._horrorSchemaVersion = 1;
  base._releaseVersion = 'v0.61-investigacao-regras-pdf';
  return base;
}

async function initializeApp(){
  try {
    await loadData(true);
  } catch(error) {
    console.error('Erro ao carregar fichas.json:', error);
    const msg = 'Não foi possível carregar fichas.json. Execute o projeto pelo VS Code usando Live Server.';
    const loginError = $('#loginError');
    if(loginError) loginError.textContent = msg;
    toast(msg);
  }

  const loginBtn = $('#loginBtn');
  if(loginBtn) loginBtn.onclick = () => {
    if($('#masterUser').value.trim() === 'mestre' && $('#masterPass').value === '1234'){
      sessionStorage.setItem('master-auth','1');
      $('#loginError').textContent='';
      show('masterScreen');
    } else {
      $('#loginError').textContent='Usuário ou senha incorretos.';
    }
  };

  const logoutBtn = $('#logoutBtn');
  if(logoutBtn) logoutBtn.onclick = () => {
    sessionStorage.removeItem('master-auth');
    show('playerHome');
  };

  const reloadBtn = $('#reloadJson');
  if(reloadBtn) reloadBtn.onclick = async () => {
    localStorage.removeItem('op-fichas-state');
    selectedPlayer = null;
    try {
      await loadData(false);
      toast('Dados originais do fichas.json restaurados');
    } catch(error) {
      console.error(error);
      toast('Erro ao recarregar fichas.json');
    }
  };

  const closeCharacterCustomizationBtn = $('#closeCharacterCustomization');
  if(closeCharacterCustomizationBtn) closeCharacterCustomizationBtn.onclick = closeCharacterCustomization;
  const cancelCharacterCustomizationBtn = $('#cancelCharacterCustomization');
  if(cancelCharacterCustomizationBtn) cancelCharacterCustomizationBtn.onclick = closeCharacterCustomization;
  const saveCharacterCustomizationBtn = $('#saveCharacterCustomization');
  if(saveCharacterCustomizationBtn) saveCharacterCustomizationBtn.onclick = saveCharacterCustomization;
  const customCharacterModal = $('#customCharacterModal');
  if(customCharacterModal) customCharacterModal.onclick = event => { if(event.target === customCharacterModal) closeCharacterCustomization(); };
  const customCharacterForm = document.querySelector('.custom-character-box');
  if(customCharacterForm) customCharacterForm.addEventListener('keydown', event => { if(event.key==='Enter' && event.target.tagName !== 'TEXTAREA'){ event.preventDefault(); saveCharacterCustomization(); } });

  const closeItemModalBtn = $('#closeItemModal');
  if(closeItemModalBtn) closeItemModalBtn.onclick = closeItemModal;
  const cancelNewItem = $('#cancelNewItem');
  if(cancelNewItem) cancelNewItem.onclick = closeItemModal;
  const saveNewItemBtn = $('#saveNewItem');
  if(saveNewItemBtn) saveNewItemBtn.onclick = saveNewItem;
  const newItemType=$('#newItemType');
  if(newItemType) newItemType.onchange=toggleItemWeaponFields;
  toggleItemWeaponFields();
  const itemModal = $('#itemModal');
  if(itemModal) itemModal.onclick = event => { if(event.target === itemModal) closeItemModal(); };
  const itemForm = document.querySelector('.item-form');
  if(itemForm) itemForm.addEventListener('keydown', event => { if(event.key==='Enter' && event.target.tagName !== 'TEXTAREA'){ event.preventDefault(); saveNewItem(); } });

  const openCreateSheet = $('#openCreateSheet');
  if(openCreateSheet) openCreateSheet.onclick = openCreateSheetModal;
  const closeCreateSheet = $('#closeCreateSheet');
  if(closeCreateSheet) closeCreateSheet.onclick = closeCreateSheetModal;
  const cancelCreateSheet = $('#cancelCreateSheet');
  if(cancelCreateSheet) cancelCreateSheet.onclick = closeCreateSheetModal;
  const saveCreateSheet = $('#saveCreateSheet');
  if(saveCreateSheet) saveCreateSheet.onclick = createPlayerSheet;
  const originSelect=$('#newCharacterOrigin'); const originInfo=$('#newCharacterOriginInfo');
  if(originSelect) originSelect.onchange=()=>{ const o=ORIGIN_PROFILES[originSelect.value]; if(originInfo) originInfo.textContent=o?`Perícias: ${o.treinadas.length?o.treinadas.join(' e '):'duas à escolha do Mestre'}. Poder: ${o.poder}. Benefícios aplicados automaticamente.`:'A escolha aplica automaticamente as duas perícias treinadas e os benefícios da origem.'; };
  const createSheetModal = $('#createSheetModal');
  if(createSheetModal) createSheetModal.onclick = event => { if(event.target === createSheetModal) closeCreateSheetModal(); };
  const createSheetForm = document.querySelector('.create-sheet-box');
  if(createSheetForm) createSheetForm.addEventListener('keydown', event => { if(event.key==='Enter' && event.target.tagName !== 'TEXTAREA'){ event.preventDefault(); createPlayerSheet(); } });

  const closeDice = $('#closeDice');
  if(closeDice) closeDice.onclick = () => $('#diceModal').classList.remove('show');
  const rollAgain = $('#rollAgain');
  if(rollAgain) rollAgain.onclick = roll;
  const modal = $('#diceModal');
  if(modal) modal.onclick = event => { if(event.target === modal){ modal.classList.remove('show'); $('#rollAgain').style.display='block'; } };
}

function openDice(type,pid,index){
  const player = data?.jogadores?.find(x => x.id === pid);
  const attack = player?.ataques?.[index];
  if(!attack) return toast('Ataque não encontrado');
  diceState = {
    type,
    pid,
    formula: type === 'attack' ? attack.teste : originAttackDamageFormula(player,attack),
    title: type === 'attack' ? `${attack.nome} — Ataque` : `${attack.nome} — Dano`
  };
  $('#diceTitle').textContent = diceState.title;
  $('#diceFormula').textContent = diceState.formula;
  $('#diceResult').textContent = '—';
  $('#diceBreakdown').textContent = '';
  $('#diceDTWrap').style.display='none';
  $('#rollAgain').style.display='block';
  $('#diceModal').classList.add('show');
  roll();
}

function openMonsterDice(mid){
  const monster = data?.monstros?.find(x => x.id === mid);
  const attack = monster?.ataques?.[0];
  if(!attack) return toast('Ataque do monstro não encontrado');
  diceState = {type:'attack', formula:attack.teste, title:`${monster.nome} — ${attack.nome}`};
  $('#diceTitle').textContent = diceState.title;
  $('#diceFormula').textContent = `Teste: ${attack.teste} • Dano: ${attack.dano}`;
  $('#diceResult').textContent = '—';
  $('#diceBreakdown').textContent = '';
  $('#rollAgain').style.display='block';
  $('#diceModal').classList.add('show');
  roll();
}

function roll(){
  if(!diceState) return;
  const formula = String(diceState.formula || '').replace(/\s/g,'');
  const match = formula.match(/^([0-9]+)d([0-9]+)([+-][0-9]+)?$/i);
  if(!match){
    $('#diceResult').textContent='Fórmula inválida';
    $('#diceBreakdown').textContent='Use o formato NdS+modificador, por exemplo 1d20+3.';
    return;
  }
  const number=Number(match[1]), sides=Number(match[2]), modifier=Number(match[3]||0);
  if(number<1||number>100||sides<2||sides>1000){ $('#diceResult').textContent='Fórmula inválida'; return; }
  const rolls=Array.from({length:number},()=>Math.floor(Math.random()*sides)+1);
  const base=diceState.keepWorst?Math.min(...rolls):diceState.keepBest?Math.max(...rolls):rolls.reduce((sum,value)=>sum+value,0);
  const total=base+modifier;
  $('#diceResult').textContent=total;
  const selection=(diceState.keepBest||diceState.keepWorst)?` → ${base}`:'';
  $('#diceBreakdown').textContent=`${rolls.join(' + ')}${selection}${modifier ? ` ${modifier>0?'+ ':''}${modifier}`:''} = ${total}`;
  if(diceState.pid){ const rp=data?.jogadores?.find(x=>x.id===diceState.pid); if(rp){ const label=diceState.title||diceState.type; logAction(`${rp.nome}: ${label} → ${total}${diceState.dt?` (DT ${diceState.dt})`:''}.`); saveLocal(); } }
  if(diceState.skill || diceState.attribute){
    const dt=Number(diceState.dt)||10;
    const success=total>=dt;
    $('#diceOutcome').textContent=success?`✓ SUCESSO — ${total} ≥ DT ${dt}`:`✕ FALHA — ${total} < DT ${dt}`;
    $('#diceOutcome').className=`dice-outcome ${success?'success':'failure'}`;
    if(diceState.ritualAuto){
      const rp=data?.jogadores?.find(x=>x.id===diceState.pid);
      if(rp && !success){
        const cost=Number(diceState.ritualCost)||0;
        rp.san=Math.max(0,Number(rp.san)-cost);
        const permanentLoss=total<=dt-5;
        if(permanentLoss) rp.sanMax=Math.max(0,Number(rp.sanMax||0)-1);
        logAction(`${rp.nome}: falha no Custo do Paranormal de ${diceState.ritual?.nome||'ritual'} — −${cost} SAN${permanentLoss?' e −1 SAN permanente':''}.`);
        saveLocal();
        $('#diceBreakdown').textContent += `\nPenalidade: −${cost} SAN${permanentLoss?' • −1 SAN permanente':''}.`;
        renderSheet();
      }else if(success && diceState.ritual?.dano && typeof rollRitualDamage==='function'){
        setTimeout(()=>rollRitualDamage(diceState.pid,diceState.ritual),120);
      }
    }
  }else{
    $('#diceOutcome').textContent='';
    $('#diceOutcome').className='dice-outcome';
  }
}

function toast(message){
  const element = $('#toast');
  if(!element) return;
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => element.classList.remove('show'), 1800);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-screen]').forEach(button => {
    button.addEventListener('click', () => show(button.dataset.screen));
  });
  document.addEventListener('click',e=>{if(e.target.id==='closeHorror')closeHorrorScreen();});
// A inicialização é disparada somente no final do index.html, depois que todos os módulos foram carregados.
});
