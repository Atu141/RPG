/* V0.56 — Grimório de Rituais. Catálogo baseado na Lista de Rituais do livro Ordem Paranormal RPG v1.3 (p. 122-123). Apenas nome, elemento/tipo e círculo; regras completas permanecem no livro. */
const RITUAL_CATALOG = [
  // 1º círculo
  ['Amaldiçoar Arma','Conhecimento',1],['Compreensão Paranormal','Conhecimento',1],['Enfeitiçar','Conhecimento',1],['Perturbação','Conhecimento',1],['Ouvir os Sussurros','Conhecimento',1],['Tecer Ilusão','Conhecimento',1],['Terceiro Olho','Conhecimento',1],
  ['Amaldiçoar Arma','Energia',1],['Amaldiçoar Tecnologia','Energia',1],['Coincidência Forçada','Energia',1],['Eletrocussão','Energia',1],['Embaralhar','Energia',1],['Luz','Energia',1],['Polarização Caótica','Energia',1],
  ['Amaldiçoar Arma','Morte',1],['Cicatrização','Morte',1],['Consumir Manancial','Morte',1],['Decadência','Morte',1],['Definhar','Morte',1],['Espirais da Perdição','Morte',1],['Nuvem de Cinzas','Morte',1],
  ['Amaldiçoar Arma','Sangue',1],['Arma Atroz','Sangue',1],['Armadura de Sangue','Sangue',1],['Corpo Adaptado','Sangue',1],['Distorcer Aparência','Sangue',1],['Fortalecimento Sensorial','Sangue',1],['Ódio Incontrolável','Sangue',1],
  ['Cinerária','Medo',1],
  // 2º círculo
  ['Aprimorar Mente','Conhecimento',2],['Detecção de Ameaças','Conhecimento',2],['Esconder dos Olhos','Conhecimento',2],['Invadir Mente','Conhecimento',2],['Localização','Conhecimento',2],
  ['Chamas do Caos','Energia',2],['Contenção Fantasmagórica','Energia',2],['Dissonância Acústica','Energia',2],['Sopro do Caos','Energia',2],['Tela de Ruído','Energia',2],
  ['Desacelerar Impacto','Morte',2],['Eco Espiral','Morte',2],['Paradoxo','Morte',2],['Miasma Entrópico','Morte',2],['Velocidade Mortal','Morte',2],
  ['Aprimorar Físico','Sangue',2],['Descarnar','Sangue',2],['Flagelo de Sangue','Sangue',2],['Hemofagia','Sangue',2],['Transfusão Vital','Sangue',2],
  ['Proteção contra Rituais','Medo',2],['Rejeitar Névoa','Medo',2],
  // 3º círculo
  ['Alterar Memória','Conhecimento',3],['Contato Paranormal','Conhecimento',3],['Mergulho Mental','Conhecimento',3],['Vidência','Conhecimento',3],
  ['Convocação Instantânea','Energia',3],['Salto Fantasma','Energia',3],['Transfigurar Água','Energia',3],['Transfigurar Terra','Energia',3],
  ['Âncora Temporal','Morte',3],['Poeira da Podridão','Morte',3],['Tentáculos de Lodo','Morte',3],['Zerar Entropia','Morte',3],
  ['Ferver Sangue','Sangue',3],['Forma Monstruosa','Sangue',3],['Purgatório','Sangue',3],['Vomitar Pestes','Sangue',3],
  ['Dissipar Ritual','Medo',3],
  // 4º círculo
  ['Controle Mental','Conhecimento',4],['Inexistir','Conhecimento',4],['Possessão','Conhecimento',4],
  ['Alterar Destino','Energia',4],['Deflagração de Energia','Energia',4],['Teletransporte','Energia',4],
  ['Convocar o Algoz','Morte',4],['Distorção Temporal','Morte',4],['Fim Inevitável','Morte',4],
  ['Capturar o Coração','Sangue',4],['Invólucro de Carne','Sangue',4],['Vínculo de Sangue','Sangue',4],
  ['Canalizar o Medo','Medo',4],['Conhecendo o Medo','Medo',4],['Lâmina do Medo','Medo',4],['Medo Tangível','Medo',4],['Presença do Medo','Medo',4]
].map(([nome,tipo,circulo],i)=>({id:`ritual_${String(i+1).padStart(3,'0')}`,nome,tipo,circulo,custo:{1:1,2:3,3:6,4:10}[circulo]||1,dano:''}));

const RITUAL_DAMAGE = {
  'cinerária|medo|1':'10d6', 'chamas do caos|energia|2':'4d6', 'cicatrização|morte|1':'3d8+3',
  'contenção fantasmagórica|energia|2':'2d6+2', 'consumir manancial|morte|1':'3d6', 'decadência|morte|1':'2d8+2',
  'deflagração de energia|energia|4':'3d10x10', 'descarnar|sangue|2':'6d8', 'eletrocussão|energia|1':'3d6',
  'flagelo de sangue|sangue|2':'10d6', 'hemofagia|sangue|2':'6d6', 'inexistir|conhecimento|4':'10d12+10',
  'invadir mente|conhecimento|2':'6d6', 'lâmina do medo|medo|4':'10d8', 'miasma entrópico|morte|2':'4d8',
  'paradoxo|morte|2':'6d6', 'perturbação|conhecimento|1':'3d8', 'purgatório|sangue|3':'6d6',
  'vomitar pestes|sangue|3':'4d8'
};

function ritualKey(nome,tipo,circulo){ return `${String(nome).trim().toLowerCase()}|${String(tipo).trim().toLowerCase()}|${Number(circulo)}`; }
RITUAL_CATALOG.forEach(r=>{ r.custo={1:1,2:3,3:6,4:10}[r.circulo]||1; r.dano=RITUAL_DAMAGE[ritualKey(r.nome,r.tipo,r.circulo)]||''; });
function ensureRitualState(player){
  if(!player) return;
  if(!Array.isArray(player.rituais)) player.rituais=[];
  player.rituais=player.rituais.map(r=>{const nome=String(r.nome||'').trim(),tipo=String(r.tipo||'').trim(),circulo=Number(r.circulo)||1; const cat=RITUAL_CATALOG.find(x=>ritualKey(x.nome,x.tipo,x.circulo)===ritualKey(nome,tipo,circulo)); return {nome,tipo,circulo,custo:Number(r.custo)||cat?.custo||({1:1,2:3,3:6,4:10}[circulo]||1),dano:String(r.dano||cat?.dano||''),disponivel:r.disponivel!==false};}).filter(r=>r.nome&&r.tipo&&[1,2,3,4].includes(r.circulo));
}
function ritualCatalogOptions(player){
  ensureRitualState(player);
  const known=new Set(player.rituais.map(r=>ritualKey(r.nome,r.tipo,r.circulo)));
  return RITUAL_CATALOG.filter(r=>!known.has(ritualKey(r.nome,r.tipo,r.circulo))).map(r=>`<option value="${r.id}">${esc(r.nome)} — ${esc(r.tipo)} • ${r.circulo}º círculo</option>`).join('');
}
function addRitualToPlayer(pid, ritualId){
  const p=data.jogadores.find(x=>x.id===pid), r=RITUAL_CATALOG.find(x=>x.id===ritualId); if(!p||!r||p.classe!=='Ocultista') return;
  ensureRitualState(p); if(p.rituais.some(x=>ritualKey(x.nome,x.tipo,x.circulo)===ritualKey(r.nome,r.tipo,r.circulo))) return toast('Esse ritual já está na ficha.');
  const maxCircle=p.classe==='Ocultista'?(Number(String(p.nex||'5').replace('%',''))>=85?4:Number(String(p.nex||'5').replace('%',''))>=55?3:Number(String(p.nex||'5').replace('%',''))>=25?2:1):1;
  if(Number(r.circulo)>maxCircle)return toast(`Este personagem ainda não pode conjurar ${r.circulo}º círculo no NEX ${p.nex}.`);
  p.rituais.push({nome:r.nome,tipo:r.tipo,circulo:r.circulo,custo:r.custo,dano:r.dano,disponivel:true});
  logAction(`${p.nome}: ritual adicionado — ${r.nome} (${r.tipo}, ${r.circulo}º círculo).`); saveLocal(); renderMaster(); if(selectedPlayer?.id===pid){selectedPlayer=p;renderSheet();} toast(`Ritual adicionado: ${r.nome}`);
}
function removeRitualFromPlayer(pid,index){
  const p=data.jogadores.find(x=>x.id===pid); if(!p)return; ensureRitualState(p); const r=p.rituais[index]; if(!r)return;
  p.rituais.splice(index,1); logAction(`${p.nome}: ritual removido — ${r.nome}.`); saveLocal(); renderMaster(); if(selectedPlayer?.id===pid){selectedPlayer=p;renderSheet();} toast('Ritual removido');
}
function toggleRitualAvailability(pid,index){
  const p=data.jogadores.find(x=>x.id===pid); if(!p)return; ensureRitualState(p); const r=p.rituais[index]; if(!r)return;
  r.disponivel=!r.disponivel; logAction(`${p.nome}: ritual ${r.nome} ${r.disponivel?'liberado':'bloqueado'} para o jogador.`); saveLocal(); renderMaster(); if(selectedPlayer?.id===pid){selectedPlayer=p;renderSheet();} toast(r.disponivel?'Ritual liberado':'Ritual ocultado do jogador');
}
function ritualPlayerBlock(p){
  if(p.classe!=='Ocultista') return '';
  ensureRitualState(p); const list=p.rituais.filter(r=>r.disponivel);
  const content=list.length ? [1,2,3,4].map(c=>{
    const xs=list.filter(r=>r.circulo===c);
    return xs.length?`<div class="ritual-circle"><span>${c}º CÍRCULO</span>${xs.map((r,idx)=>{
      const globalIndex=list.indexOf(r);
      const usage=r.teste||r.uso||`Ocultismo vs DT ${20+(Number(r.custo)||1)}`;
      const damage=r.dano||'';
      return `<div class="ritual-row"><div class="ritual-main"><b>${esc(r.nome)}</b><small>${esc(r.tipo)} • ${r.circulo}º círculo${usage?` • Utilização: ${esc(usage)}`:''}${damage?` • Dano: ${esc(damage)}`:''}</small></div><div class="ritual-actions"><button class="dice-btn" data-use-ritual="${p.id}" data-ritual-index="${globalIndex}">UTILIZAR</button>${damage?`<button class="dice-btn secondary" data-ritual-damage="${p.id}" data-ritual-index="${globalIndex}">DANO</button>`:''}</div></div>`;
    }).join('')}</div>`:'';
  }).join('') : '<p class="muted">Nenhum ritual foi liberado pelo Mestre.</p>';
  return `<div class="panel rituals-player-panel"><div class="panel-title"><div><span class="icon">✦</span><div><h2>Rituais Conhecidos</h2><p>Rituais liberados pelo Mestre. O botão UTILIZAR faz o teste de Ocultismo do Custo do Paranormal e, quando houver dano direto cadastrado, realiza a rolagem de dano.</p></div></div></div>${content}</div>`;
}
function useRitual(pid,index,damage=false){
  const p=data.jogadores.find(x=>x.id===pid); if(!p)return; ensureRitualState(p); const r=p.rituais.filter(x=>x.disponivel)[index]; if(!r)return;
  if(damage && !r.dano) return toast('Este ritual não possui dano direto cadastrado.');
  if(damage) return openRitualDamageDice(pid,index);
  openRitualCastDice(pid,index);
}
function ritualOccultismBonus(p){
  const sk=(p.pericias||[]).find(x=>String(x.nome||'').toLowerCase()==='ocultismo');
  const attr=Number(p.atributos?.INT)||0;
  return attr+(sk?.treinada?5:0);
}
function openRitualCastDice(pid,index){
  const p=data.jogadores.find(x=>x.id===pid); if(!p)return; ensureRitualState(p); const r=p.rituais.filter(x=>x.disponivel)[index]; if(!r)return;
  const cost=Number(r.custo)||({1:1,2:3,3:6,4:10}[Number(r.circulo)]||1);
  if(Number(p.pe)<cost) return toast(`PE insuficiente. Este ritual custa ${cost} PE.`);
  p.pe=Math.max(0,Number(p.pe)-cost);
  if(String(r.tipo).toLowerCase()==='medo'){
    p.san=Math.max(0,Number(p.san)-cost);
    p.sanMax=Math.max(0,Number(p.sanMax||0)-1); logAction(`${p.nome}: conjurou ${r.nome} (Medo) — custo ${cost} PE e ${cost} SAN + 1 SAN permanente.`);
    saveLocal(); renderSheet();
    diceState={type:'ritual',pid,ritual:r,title:`${r.nome} — Conjuração`,formula:'—',dt:null,ritualAuto:true,ritualCost:cost};
    $('#diceTitle').textContent=diceState.title;
    $('#diceFormula').textContent=`MEDO • ${cost} PE • sem teste de Custo do Paranormal`;
    $('#diceResult').textContent='✓'; $('#diceOutcome').textContent='✓ RITUAL FUNCIONOU'; $('#diceOutcome').className='dice-outcome success';
    $('#diceBreakdown').textContent=`Custo: ${cost} PE • Sanidade: −${cost} SAN • −1 SAN permanente`;
    if(r.dano) setTimeout(()=>rollRitualDamage(pid,r),120);
    $('#diceDTWrap').style.display='none'; $('#rollAgain').style.display='none'; $('#diceModal').classList.add('show');
    return;
  }
  const dt=20+cost, bonus=ritualOccultismBonus(p);
  diceState={type:'ritual',pid,ritual:r,title:`${r.nome} — Custo do Paranormal`,formula:`1d20${bonus>=0?'+':''}${bonus}`,dt,skill:true,ritualAuto:true,ritualCost:cost};
  $('#diceTitle').textContent=diceState.title;
  $('#diceFormula').textContent=`Ocultismo • ${diceState.formula} • DT ${dt}`;
  $('#diceResult').textContent='—'; $('#diceBreakdown').textContent=''; $('#diceOutcome').textContent=''; $('#diceOutcome').className='dice-outcome';
  $('#diceDTWrap').style.display='block'; $('#diceDT').value=dt; $('#diceDT').disabled=true; $('#rollAgain').style.display='none'; $('#diceModal').classList.add('show'); roll();
}
function rollRitualDamage(pid,r){
  if(!r?.dano) return;
  const formula=String(r.dano).replace(/\s/g,'');
  const m=formula.match(/^(\d+)d(\d+)([+-]\d+)?(?:x(\d+))?$/i);
  if(!m) return;
  const n=Number(m[1]),s=Number(m[2]),mod=Number(m[3]||0),mult=Number(m[4]||1);
  const rolls=Array.from({length:n},()=>Math.floor(Math.random()*s)+1); const subtotal=rolls.reduce((a,b)=>a+b,0)+mod; const total=subtotal*mult;
  const old=$('#diceBreakdown').textContent; const multText=mult!==1?` × ${mult}`:'';
  $('#diceBreakdown').textContent=`${old}\nDANO: ${rolls.join(' + ')}${mod?` ${mod>0?'+ ':''}${mod}`:''}${multText} = ${total} (${r.tipo})`;
  logAction(`${data.jogadores.find(x=>x.id===pid)?.nome||''}: dano de ${r.nome} → ${total}.`); saveLocal();
}

function openRitualDamageDice(pid,index){
  const p=data.jogadores.find(x=>x.id===pid); if(!p)return; ensureRitualState(p); const r=p.rituais.filter(x=>x.disponivel)[index]; if(!r?.dano)return toast('Este ritual não possui dano direto cadastrado.');
  diceState={type:'ritual-damage',pid,ritual:r,title:`${r.nome} — Dano`,formula:r.dano};
  $('#diceTitle').textContent=diceState.title; $('#diceFormula').textContent=`Dano ${r.tipo} • ${r.dano}`; $('#diceResult').textContent='—'; $('#diceBreakdown').textContent=''; $('#diceOutcome').textContent=''; $('#diceOutcome').className='dice-outcome'; $('#diceDTWrap').style.display='none'; $('#rollAgain').style.display='none'; $('#diceModal').classList.add('show');
  rollRitualDamage(pid,r);
  const last=$('#diceBreakdown').textContent.split('\n').pop(); const match=last.match(/= ([-0-9]+)/); $('#diceResult').textContent=match?match[1]:'—';
}

function ritualMasterBlock(p){
  if(p.classe!=='Ocultista') return '';
  ensureRitualState(p);
  const list=p.rituais.length?p.rituais.map((r,i)=>`<div class="master-ritual-row"><div><b>${esc(r.nome)}</b><small>${esc(r.tipo)} • ${r.circulo}º círculo • ${r.custo||1} PE${r.dano?` • Dano ${esc(r.dano)}`:''} • ${r.disponivel?'Liberado':'Oculto do jogador'}</small></div><button class="dice-btn secondary" data-toggle-ritual="${p.id}" data-ritual-index="${i}">${r.disponivel?'OCULTAR':'LIBERAR'}</button><button class="dice-btn danger" data-remove-ritual="${p.id}" data-ritual-index="${i}">REMOVER</button></div>`).join(''):'<small class="muted">Nenhum ritual cadastrado.</small>';
  const options=ritualCatalogOptions(p);
  const pending=p.classe==='Ocultista'?Math.max(0,3-p.rituais.filter(r=>Number(r.circulo)===1).length):0;
  return `<details class="master-rituals"><summary>GRIMÓRIO / RITUAIS</summary>${pending?`<div class="ritual-pending"><b>⚠ ${pending} ritual(is) inicial(is) pendente(s)</b><small>No NEX 5%, o Ocultista começa com três rituais de 1º círculo. O Mestre deve escolhê-los no catálogo abaixo.</small></div>`:''}<div class="master-ritual-list">${list}</div><div class="master-ritual-add"><select class="control-select" data-ritual-select="${p.id}"><option value="">Adicionar ritual do livro...</option>${options}</select><button class="dice-btn" data-add-ritual="${p.id}">ADICIONAR</button></div><small class="muted">Catálogo v1.3. Custo e Custo do Paranormal seguem o livro; alcance, resistência, duração e efeitos completos permanecem no livro.</small></details>`;
}

window.ensureRitualState=ensureRitualState;
window.ritualPlayerBlock=ritualPlayerBlock;
window.ritualMasterBlock=ritualMasterBlock;
window.addRitualToPlayer=addRitualToPlayer;
window.removeRitualFromPlayer=removeRitualFromPlayer;
window.toggleRitualAvailability=toggleRitualAvailability;
window.useRitual=useRitual;
(function(){
  document.addEventListener('click',e=>{
    const use=e.target.closest('[data-use-ritual]'); if(use){useRitual(use.dataset.useRitual,+use.dataset.ritualIndex,false); return;}
    const dmg=e.target.closest('[data-ritual-damage]'); if(dmg){useRitual(dmg.dataset.ritualDamage,+dmg.dataset.ritualIndex,true); return;}
  });
  const oldRenderSheet=window.renderSheet;
  if(typeof oldRenderSheet==='function'){
    window.renderSheet=function(){ if(selectedPlayer) ensureRitualState(selectedPlayer); return oldRenderSheet.apply(this,arguments); };
  }
})();
