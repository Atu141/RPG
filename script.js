let data=null, selectedPlayer=null, diceState=null;
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

const SKILL_CATALOG=[
  ['Acrobacia','AGI',false],['Adestramento','PRE',true],['Artes','PRE',true],['Atletismo','FOR',false],
  ['Atualidades','INT',false],['Ciências','INT',true],['Crime','AGI',true],['Diplomacia','PRE',false],
  ['Enganação','PRE',false],['Fortitude','VIG',false],['Furtividade','AGI',false],['Iniciativa','AGI',false],
  ['Intimidação','PRE',false],['Intuição','INT',false],['Investigação','INT',false],['Luta','FOR',false],
  ['Medicina','INT',false],['Ocultismo','INT',true],['Percepção','PRE',false],['Pilotagem','AGI',true],
  ['Pontaria','AGI',false],['Profissão','INT',true],['Reflexos','AGI',false],['Religião','INT',true],
  ['Sobrevivência','INT/PRE',false],['Tática','INT',true],['Tecnologia','INT',true],['Vontade','PRE',false]
];
function skillFormula(player,skill){
  if(skill.teste && skill.teste!=='AUTO') return skill.teste;
  const attrs=player.atributos||{};
  const bonus=skill.treinada ? 5 : 0;
  if(skill.atributo==='INT/PRE') return `1d20+${Math.max(Number(attrs.INT)||0,Number(attrs.PRE)||0)+bonus}`;
  return `1d20+${(Number(attrs[skill.atributo])||0)+bonus}`;
}
function isMaster(){ return sessionStorage.getItem('master-auth')==='1'; }
function getSkillDT(){
  const dt=Number(data?.campanha?.dtPericias);
  return Number.isFinite(dt) && dt>=1 && dt<=50 ? dt : 10;
}
function setSkillDT(value){
  const dt=Math.max(1,Math.min(50,Number(value)||10));
  data.campanha.dtPericias=dt;
  logAction(`DT padrão de perícias alterada para ${dt}.`);
  saveLocal();
  renderCampaign();
  toast(`DT de perícias: ${dt}`);
}
function skillLabel(skill){ return `${skill.requerTreinamento?'* ':''}${skill.nome}`; }

async function loadData(useSaved=true){
  const response = await fetch('fichas.json?ts=' + Date.now(), {cache:'no-store'});
  if(!response.ok) throw new Error(`Não foi possível carregar fichas.json (HTTP ${response.status})`);
  const jsonData = await response.json();
  data = normalizeData(jsonData);
  if(useSaved){
    const saved = localStorage.getItem('op-fichas-state');
    if(saved){
      try { data = normalizeData(JSON.parse(saved)); }
      catch(error){ console.warn('Estado local inválido; usando fichas.json.', error); localStorage.removeItem('op-fichas-state'); }
    }
  }
  renderPlayerCards();
  renderMaster();
  renderCampaign();
  if(selectedPlayer){
    selectedPlayer = data.jogadores.find(p => p.id === selectedPlayer.id) || null;
    if(selectedPlayer) renderSheet();
  }
}
function show(id){document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active')); $('#'+id).classList.add('active'); document.querySelectorAll('.role-btn').forEach(b=>b.classList.toggle('active',b.dataset.screen===id|| (id==='playerSheet'&&b.dataset.screen==='playerHome')))}

function renderPlayerCards(){ $('#playerCards').innerHTML=data.jogadores.map(p=>`<button class="player-card" data-id="${p.id}"><div class="avatar">${esc(p.nome.split(' ').map(x=>x[0]).slice(0,2).join(''))}</div><div><b>${esc(p.nome)}</b><small>${esc(p.classe)} • NEX ${esc(p.nex)}</small></div><span>→</span></button>`).join(''); document.querySelectorAll('.player-card').forEach(b=>b.onclick=()=>openSheet(b.dataset.id)); }
function openSheet(id){selectedPlayer=data.jogadores.find(p=>p.id===id); show('playerSheet'); renderSheet();}
function renderSheet(){
  const p=selectedPlayer;
  const pericias=p.pericias||[];
  $('#sheetContent').innerHTML=`<div class="player-header"><div><p class="eyebrow">FICHA DO AGENTE</p><h1>${esc(p.nome)}</h1><p class="muted">${esc(p.classe)} • NEX ${esc(p.nex)} • ${esc(data.campanha.nome)}</p></div><div class="player-badge">AGENTE</div></div><div class="player-layout">
  <div class="panel character-panel"><div class="character-top"><div class="avatar">${esc(p.nome.split(' ').map(x=>x[0]).slice(0,2).join(''))}</div><div><h2>${esc(p.nome)}</h2><p>${esc(p.classe)}</p></div><div class="nex"><span>NEX</span><b>${esc(p.nex)}</b></div></div><div class="stats"><div class="stat"><span>PV</span><strong>${p.pv}</strong><small> / ${p.pvMax}</small></div><div class="stat"><span>PE</span><strong>${p.pe}</strong><small> / ${p.peMax}</small></div><div class="stat"><span>SAN</span><strong>${p.san}</strong><small> / ${p.sanMax}</small></div></div><div class="bar"><i style="width:${Math.max(0,p.pv/p.pvMax*100)}%"></i></div><div class="attributes">${Object.entries(p.atributos).map(([k,v])=>`<button class="attribute-card" data-attribute-player="${p.id}" data-attribute="${k}"><span>${k}</span><b>${v}</b><small>TESTAR</small></button>`).join('')}</div></div>
  <div class="panel items-panel"><div class="panel-title"><div><span class="icon">▤</span><div><h2>Inventário</h2><p>Itens da ficha</p></div></div></div>${p.itens.map((i,idx)=>`<div class="item"><span class="item-icon">${i.tipo==='arma'?'⚔':'▣'}</span><div><b>${esc(i.nome)} ${i.equipado?'<small class="equipped-tag">EQUIPADO</small>':''}</b><small>${itemLabel(i)}${i.tipo==='arma'&&i.teste?` • Teste ${esc(i.teste)}`:''}${i.tipo==='arma'&&i.dano?` • Dano ${esc(i.dano)}`:''}${i.bonus?` • Bônus ${esc(i.bonus)}`:''}</small><small>${esc(i.descricao)}</small></div><strong>${i.quantidade}</strong></div>`).join('')}</div>
  <div class="panel combat-panel"><div class="panel-title"><div><span class="icon">⚔</span><div><h2>Combate</h2><p>Rolagens disponíveis</p></div></div></div><div class="combat-row"><span>Defesa</span><b>${p.defesa}</b></div>${p.ataques.map((a,i)=>`<div class="attack"><div><b>${esc(a.nome)}</b><small>Teste ${esc(a.teste)} • Dano ${esc(a.dano)}</small></div><div><button class="dice-btn" data-roll="attack" data-player="${p.id}" data-index="${i}">ATACAR</button><button class="dice-btn secondary" data-roll="damage" data-player="${p.id}" data-index="${i}">DANO</button></div></div>`).join('')}</div>
  <div class="panel weapon-panel"><div class="panel-title"><div><span class="icon">⚔</span><div><h2>Armas equipadas</h2><p>Rolagens das armas cadastradas pelo Mestre</p></div></div></div>${p.itens.filter(i=>itemCombatReady(i)).map((i,idx)=>{const realIndex=p.itens.indexOf(i);return `<div class="attack"><div><b>${esc(i.nome)}</b><small>Teste ${esc(itemFormula(i,'attack'))} • Dano ${esc(itemFormula(i,'damage'))}${i.bonus?` • Bônus ${esc(i.bonus)}`:''}</small></div><div><button class="dice-btn" data-item-roll="attack" data-player="${p.id}" data-item-index="${realIndex}">ATACAR</button><button class="dice-btn secondary" data-item-roll="damage" data-player="${p.id}" data-item-index="${realIndex}">DANO</button></div></div>`}).join('') || '<small class="empty-inventory">Nenhuma arma equipada com teste e dano cadastrados.</small>'}</div>
  <div class="panel abilities-panel"><div class="panel-title"><div><span class="icon">✧</span><div><h2>Perícias</h2><p>Testes disponíveis</p></div></div></div><div class="skill-list">${pericias.map((x,i)=>`<div class="skill-row"><div><b>${esc(skillLabel(x))}</b><small>${esc(x.atributoLabel||x.atributo||'Perícia')} • ${x.treinada?'Treinada (+5)':'Não treinada'} • Teste ${esc(skillFormula(p,x))}</small></div>${x.requerTreinamento&&!x.treinada?'<button class="dice-btn secondary" disabled title="Esta perícia exige treinamento.">NÃO TREINADA</button>':'<button class="dice-btn secondary" data-skill-player="'+p.id+'" data-skill-index="'+i+'">TESTAR</button>'}</div>`).join('')}</div></div>
  <div class="panel campaign-player"><div class="panel-title"><div><span class="icon">◈</span><div><h2>Campanha</h2><p>Informações públicas da sessão</p></div></div></div><div class="campaign-info"><div><span>ANDAR</span><b>${data.campanha.andarAtual}º</b></div><div><span>OBJETIVO</span><b>${esc(data.campanha.objetivoAtual)}</b></div><div><span>PERSEGUIÇÃO</span><b>${esc(data.campanha.perseguicao)}</b></div><div><span>DT DE PERÍCIAS</span><b>${getSkillDT()}</b></div><div><span>CHAVES ENCONTRADAS</span><b>${data.campanha.chavesEncontradas.length}/${data.andares.length}</b></div></div></div>
  </div>`;
  document.querySelectorAll('.dice-btn[data-roll]').forEach(b=>b.onclick=()=>openDice(b.dataset.roll,b.dataset.player,+b.dataset.index));
  document.querySelectorAll('[data-skill-player]').forEach(b=>b.onclick=()=>openSkillDice(b.dataset.skillPlayer,+b.dataset.skillIndex));
  document.querySelectorAll('[data-attribute-player]').forEach(b=>b.onclick=()=>openAttributeDice(b.dataset.attributePlayer,b.dataset.attribute));
  document.querySelectorAll('[data-item-roll]').forEach(b=>b.onclick=()=>openItemDice(b.dataset.player,+b.dataset.itemIndex,b.dataset.itemRoll));
}
function normalizeItem(item){
  if(typeof item==='string') return {nome:item,descricao:'',quantidade:1,tipo:'equipamento',equipado:false,teste:'',dano:'',bonus:''};
  const tipo=String(item?.tipo||'equipamento').toLowerCase()==='arma'?'arma':'equipamento';
  return {
    nome:String(item?.nome||'Item'),
    descricao:String(item?.descricao||''),
    quantidade:Math.max(1,Number(item?.quantidade)||1),
    tipo,
    equipado:Boolean(item?.equipado),
    teste:String(item?.teste||''),
    dano:String(item?.dano||''),
    bonus:String(item?.bonus||'')
  };
}
function itemLabel(item){ return item.tipo==='arma' ? 'Arma' : 'Equipamento'; }
function itemCombatReady(item){ return item?.tipo==='arma' && Boolean(item?.equipado) && Boolean(item?.teste) && Boolean(item?.dano); }
function itemFormula(item,type){
  const base=String(type==='attack'?item?.teste:item?.dano||'').replace(/\s/g,'');
  const bonus=Number(String(item?.bonus||'').replace(',','.'));
  if(!base) return '';
  if(!Number.isFinite(bonus) || bonus===0) return base;
  const m=base.match(/^([0-9]+)d([0-9]+)([+-][0-9]+)?$/i);
  if(!m) return base;
  const current=Number(m[3]||0)+bonus;
  return `${m[1]}d${m[2]}${current>=0?'+':''}${current}`;
}
function openItemDice(pid,index,type){
  const player=data.jogadores.find(x=>x.id===pid); const item=player?.itens?.[index];
  if(!item || item.tipo!=='arma') return toast('Arma não encontrada');
  const formula=itemFormula(item,type);
  if(!formula) return toast(type==='attack'?'Esta arma não possui teste cadastrado.':'Esta arma não possui dano cadastrado.');
  diceState={type:type==='attack'?'item-attack':'item-damage',formula,title:`${item.nome} — ${type==='attack'?'Teste de ataque':'Dano'}`};
  $('#diceTitle').textContent=diceState.title;
  $('#diceFormula').textContent=`${formula}${item.bonus?` • Bônus ${item.bonus}`:''}`;
  $('#diceResult').textContent='—'; $('#diceBreakdown').textContent=''; $('#diceOutcome').textContent=''; $('#diceOutcome').className='dice-outcome';
  $('#diceDTWrap').style.display='none'; $('#rollAgain').style.display='block'; $('#diceModal').classList.add('show'); roll();
}
function getItemCatalog(){
  const catalog=Array.isArray(data.itensDisponiveis)?data.itensDisponiveis:[];
  const map=new Map();
  catalog.forEach(i=>{const x=normalizeItem(i); map.set(x.nome.toLowerCase(),x);});
  (data.jogadores||[]).forEach(p=>(p.itens||[]).forEach(i=>{const x=normalizeItem(i); if(!map.has(x.nome.toLowerCase())) map.set(x.nome.toLowerCase(),{...x,quantidade:1});}));
  data.itensDisponiveis=[...map.values()];
  return data.itensDisponiveis;
}
function addPlayerItem(pid, catalogIndex, quantity){
  const p=data.jogadores.find(x=>x.id===pid); const catalog=getItemCatalog(); const base=catalog[Number(catalogIndex)];
  if(!p||!base)return;
  const qty=Math.max(1,Number(quantity)||1); p.itens=Array.isArray(p.itens)?p.itens:[];
  const existing=p.itens.find(i=>String(i.nome).toLowerCase()===base.nome.toLowerCase());
  if(existing) existing.quantidade=(Number(existing.quantidade)||0)+qty;
  else p.itens.push(normalizeItem({...base,quantidade:qty,equipado:false}));
  logAction(`${p.nome}: ${qty}x ${base.nome} adicionado ao inventário.`); saveLocal(); renderMaster();
  if(selectedPlayer?.id===pid){selectedPlayer=p;renderSheet();} toast(`${qty}x ${base.nome} adicionado`);
}
function createAndAddPlayerItem(pid){
  const player=data.jogadores.find(x=>x.id===pid); if(!player)return;
  $('#itemModalPlayer').value=pid;
  $('#itemModalPlayerName').textContent=player.nome;
  $('#newItemName').value=''; $('#newItemDescription').value=''; $('#newItemQuantity').value=1; $('#newItemType').value='equipamento'; $('#newItemEquipped').checked=false; $('#newItemTest').value=''; $('#newItemDamage').value=''; $('#newItemBonus').value=''; toggleItemWeaponFields();
  $('#itemModal').classList.add('show');
  setTimeout(()=>$('#newItemName').focus(),50);
}
function toggleItemWeaponFields(){
  const type=$('#newItemType')?.value;
  const wrap=$('#weaponFields');
  if(wrap) wrap.style.display=type==='arma'?'block':'none';
  if(type!=='arma'){
    if($('#newItemEquipped')) $('#newItemEquipped').checked=false;
    if($('#newItemTest')) $('#newItemTest').value='';
    if($('#newItemDamage')) $('#newItemDamage').value='';
    if($('#newItemBonus')) $('#newItemBonus').value='';
  }
}
function closeItemModal(){ $('#itemModal')?.classList.remove('show'); }
function saveNewItem(){
  const pid=$('#itemModalPlayer').value;
  const name=String($('#newItemName').value||'').trim();
  if(!name){ toast('Informe o nome do item'); $('#newItemName').focus(); return; }
  const descricao=String($('#newItemDescription').value||'').trim();
  const qty=Math.max(1,Number($('#newItemQuantity').value)||1);
  const catalog=getItemCatalog();
  const tipo=$('#newItemType').value==='arma'?'arma':'equipamento';
  const equipado=$('#newItemEquipped').checked;
  const teste=String($('#newItemTest').value||'').trim();
  const dano=String($('#newItemDamage').value||'').trim();
  const bonus=String($('#newItemBonus').value||'').trim();
  if(tipo==='arma' && !dano){ toast('Informe o dado de dano da arma'); $('#newItemDamage').focus(); return; }
  if(tipo==='arma' && !teste){ toast('Informe o teste da arma'); $('#newItemTest').focus(); return; }
  if(tipo==='arma' && equipado===false) { /* permitido: o mestre pode entregar a arma sem equipá-la */ }
  const newData={nome:name,descricao,quantidade:1,tipo,equipado,teste,dano,bonus};
  let base=catalog.find(i=>i.nome.toLowerCase()===name.toLowerCase());
  if(!base){ base={...newData,equipado:false}; data.itensDisponiveis.push(base); }
  else Object.assign(base,{...newData,equipado:false});
  const player=data.jogadores.find(x=>x.id===pid); if(!player)return;
  player.itens=Array.isArray(player.itens)?player.itens:[];
  const existing=player.itens.find(i=>String(i.nome).toLowerCase()===name.toLowerCase());
  if(existing) { existing.quantidade=(Number(existing.quantidade)||0)+qty; Object.assign(existing,{descricao:base.descricao,tipo:base.tipo,teste:base.teste,dano:base.dano,bonus:base.bonus}); }
  else player.itens.push(normalizeItem({...base,quantidade:qty,equipado}));
  logAction(`${player.nome}: novo item ${qty}x ${base.nome} criado/adicionado.`);
  saveLocal(); closeItemModal(); renderMaster();
  if(selectedPlayer?.id===pid){selectedPlayer=player;renderSheet();}
  toast(`Item criado: ${base.nome}`);
}
function togglePlayerItemEquipped(pid,itemIndex){
  const p=data.jogadores.find(x=>x.id===pid); const item=p?.itens?.[Number(itemIndex)];
  if(!item)return;
  item.equipado=!Boolean(item.equipado);
  logAction(`${p.nome}: ${item.nome} ${item.equipado?'equipado':'desequipado'}.`);
  saveLocal(); renderMaster();
  if(selectedPlayer?.id===pid){selectedPlayer=p;renderSheet();}
  toast(`${item.nome} ${item.equipado?'equipado':'desequipado'}`);
}
function removePlayerItem(pid,itemIndex,quantity){
  const p=data.jogadores.find(x=>x.id===pid); const item=p?.itens?.[Number(itemIndex)]; if(!item)return;
  const qty=Math.max(1,Number(quantity)||1); item.quantidade=(Number(item.quantidade)||0)-qty;
  if(item.quantidade<=0)p.itens.splice(Number(itemIndex),1);
  logAction(`${p.nome}: ${qty}x ${item.nome} removido do inventário.`); saveLocal(); renderMaster();
  if(selectedPlayer?.id===pid){selectedPlayer=p;renderSheet();} toast(`${qty}x ${item.nome} removido`);
}
function renderInventoryMaster(p){
  const catalog=getItemCatalog();
  const options=catalog.length?catalog.map((i,idx)=>`<option value="${idx}">${esc(i.nome)}${i.descricao?` — ${esc(i.descricao)}`:''}</option>`).join(''):'<option value="">Nenhum item salvo</option>';
  const items=(p.itens||[]).map((i,idx)=>`<div class="master-item-row"><div><b>${esc(i.nome)}</b><small>${itemLabel(i)}${i.equipado?' • Equipado':' • Não equipado'}${i.tipo==='arma'&&i.teste?` • Teste ${esc(i.teste)}`:''}${i.tipo==='arma'&&i.dano?` • Dano ${esc(i.dano)}`:''}${i.bonus?` • Bônus ${esc(i.bonus)}`:''}</small><em>${esc(i.descricao||'Sem descrição')}</em></div><strong>x${i.quantidade}</strong><button class="dice-btn ${i.equipado?'secondary':''}" data-toggle-equip="${p.id}" data-item-index="${idx}">${i.equipado?'DESEQUIPAR':'EQUIPAR'}</button><button class="dice-btn secondary" data-remove-item="${p.id}" data-item-index="${idx}">REMOVER</button></div>`).join('') || '<small class="empty-inventory">Inventário vazio.</small>';
  return `<details class="master-inventory"><summary>INVENTÁRIO / ITENS</summary><div class="master-inventory-list">${items}</div><div class="inventory-add"><select class="control-select" data-item-select="${p.id}">${options}</select><input class="control-input inventory-qty" type="number" min="1" value="1" data-item-qty="${p.id}"><button class="dice-btn" data-add-item="${p.id}">ADICIONAR ITEM</button><button class="dice-btn secondary" data-new-item="${p.id}">CRIAR NOVO ITEM</button></div></details>`;
}
function renderMaster(){
  const players=$('#masterPlayers'); if(players){
    players.innerHTML=data.jogadores.map(p=>`<div class="entity master-player-card"><div class="entity-avatar">${esc(p.nome.split(' ').map(x=>x[0]).slice(0,2).join(''))}</div><div class="entity-info"><b>${esc(p.nome)}</b><small>${esc(p.classe)} • Defesa ${p.defesa}</small></div><div class="manual-resources"><label>PV<input type="number" min="0" max="${p.pvMax}" value="${p.pv}" data-resource="pv" data-id="${p.id}"></label><label>PE<input type="number" min="0" max="${p.peMax}" value="${p.pe}" data-resource="pe" data-id="${p.id}"></label><label>SAN<input type="number" min="0" max="${p.sanMax}" value="${p.san}" data-resource="san" data-id="${p.id}"></label></div><details class="master-skills"><summary>PERÍCIAS / TREINAMENTO</summary><div class="master-skill-grid">${(p.pericias||[]).map((x,i)=>`<label title="${x.requerTreinamento?'Perícia com asterisco: exige treinamento.':'Pode ser usada sem treinamento.'}"><input type="checkbox" data-train-player="${p.id}" data-train-index="${i}" ${x.treinada?'checked':''}>${esc(skillLabel(x))}</label>`).join('')}</div></details>${renderInventoryMaster(p)}</div>`).join('');
    players.querySelectorAll('[data-resource]').forEach(i=>i.onchange=()=>updatePlayerResource(i.dataset.id,i.dataset.resource,+i.value));
    players.querySelectorAll('[data-train-player]').forEach(i=>i.onchange=()=>setSkillTraining(i.dataset.trainPlayer,+i.dataset.trainIndex,i.checked));
    players.querySelectorAll('[data-add-item]').forEach(b=>b.onclick=()=>addPlayerItem(b.dataset.addItem, b.parentElement.querySelector('[data-item-select]').value, b.parentElement.querySelector('[data-item-qty]').value));
    players.querySelectorAll('[data-new-item]').forEach(b=>b.onclick=()=>createAndAddPlayerItem(b.dataset.newItem));
    players.querySelectorAll('[data-toggle-equip]').forEach(b=>b.onclick=()=>togglePlayerItemEquipped(b.dataset.toggleEquip,+b.dataset.itemIndex));
    players.querySelectorAll('[data-remove-item]').forEach(b=>b.onclick=()=>removePlayerItem(b.dataset.removeItem,+b.dataset.itemIndex,1));
  }
  const monsters=$('#masterMonsters'); if(monsters){
    monsters.innerHTML=data.monstros.map(m=>`<div class="entity"><div class="entity-avatar">☠</div><div class="entity-info"><b>${esc(m.nome)}</b><small>${esc(m.tipo)} • Defesa ${m.defesa}</small></div><div class="manual-hp"><input type="number" min="0" max="${m.pvMax}" value="${m.pv}" data-id="${m.id}" data-monster="1"><small>/ ${m.pvMax} PV</small></div><button class="dice-btn" data-monster-roll="${m.id}">ROLAR</button></div>`).join('');
    monsters.querySelectorAll('[data-monster-roll]').forEach(b=>b.onclick=()=>openMonsterDice(b.dataset.monsterRoll));
    monsters.querySelectorAll('.manual-hp input[data-monster]').forEach(i=>i.onchange=()=>{const m=data.monstros.find(x=>x.id===i.dataset.id);m.pv=Math.max(0,Math.min(m.pvMax,+i.value||0));saveLocal();toast('PV do monstro atualizado');});
  }
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
  diceState={type:'attribute',formula:`1d20${value>=0?'+':''}${value}`,title:`${labels[attribute]||attribute} — Teste de Atributo`,dt:getSkillDT(),attribute:true};
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
  diceState={type:'skill',formula,title:`${skill.nome} — Perícia`,dt:getSkillDT(),skill:true};
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
    </div>`;
  $('#prevFloor').onclick=()=>changeFloor(1);
  $('#nextFloor').onclick=()=>changeFloor(-1);
  $('#floorSelect').onchange=e=>setFloor(Number(e.target.value));
  $('#saveObjective').onclick=()=>setObjective($('#objectiveInput').value);
  $('#savePursuit').onclick=()=>setPursuit($('#pursuitSelect').value);
  $('#saveSkillDT').onclick=()=>setSkillDT($('#skillDTInput').value);
  renderKillers();renderPuzzles();renderActivities();
}
function saveLocal(){localStorage.setItem('op-fichas-state',JSON.stringify(data));}
function logAction(message){if(!Array.isArray(data.logs))data.logs=[];data.logs.push(`${new Date().toLocaleTimeString()} — ${message}`);}
function setFloor(floor){const next=Math.max(1,Math.min(5,Number(floor)||5));data.campanha.andarAtual=next;logAction(`Andar alterado para ${next}º.`);saveLocal();renderMaster();renderCampaign();if(selectedPlayer)renderSheet();toast(`Andar ${next}º`)}
function changeFloor(delta){setFloor(Number(data.campanha.andarAtual)+delta)}
function setObjective(value){const x=String(value||'').trim();if(!x){toast('Digite um objetivo');return}data.campanha.objetivoAtual=x;logAction('Objetivo da campanha alterado.');saveLocal();renderCampaign();if(selectedPlayer)renderSheet();toast('Objetivo atualizado')}
function editObjective(){setObjective(prompt('Novo objetivo:',data.campanha.objetivoAtual))}
function setPursuit(value){const states=['Normal','Alerta','Caça','Perseguição'];if(!states.includes(value))return;data.campanha.perseguicao=value;logAction(`Estado de perseguição: ${value}.`);saveLocal();renderCampaign();if(selectedPlayer)renderSheet();toast(value)}
function cyclePursuit(){const states=['Normal','Alerta','Caça','Perseguição'];let i=states.indexOf(data.campanha.perseguicao);setPursuit(states[(i+1)%states.length])}
function renderKillers(){
  if(!$('#killerInfo'))return;
  $('#killerInfo').innerHTML=data.assassinos.map(k=>`<div class="entity killer"><div class="entity-avatar">🔪</div><div class="entity-info"><b>${esc(k.nome)}</b><small>${esc(k.elemento)} • Andar ${k.andar}º • ${esc(k.inspiracao)}</small><small>Estado: <b>${esc(k.estado)}</b> • Sala: ${esc(k.sala)}</small></div><div class="killer-actions"><button class="dice-btn secondary" onclick="openKillerSheet('${k.id}')">FICHA</button><button class="dice-btn" onclick="toggleKiller('${k.id}')">${k.ativo?'DESATIVAR':'ATIVAR'}</button><button class="dice-btn secondary" onclick="moveKiller('${k.id}')">MOVER</button></div></div>`).join('');
}
function renderPuzzles(){if(!$('#puzzleInfo'))return;$('#puzzleInfo').innerHTML=data.enigmas.map(e=>`<div class="entity"><div class="entity-avatar">${e.resolvido?'✓':'?'}</div><div class="entity-info"><b>${esc(e.nome)}</b><small>Andar ${e.andar}º • Recompensa: ${esc(e.recompensa)}</small><small>Pista: ${esc(e.pista)}</small></div><button class="dice-btn" onclick="togglePuzzle('${e.id}')">${e.resolvido?'REABRIR':'RESOLVER'}</button></div>`).join('')}
function renderActivities(){
  const el=$('#activityInfo'); if(!el)return;
  const statuses=['Bloqueada','Em andamento','Concluída'];
  el.innerHTML=data.atividades.map(a=>`<div class="entity activity-row"><div class="entity-avatar">${a.status==='Concluída'?'✓':a.status==='Em andamento'?'▶':'🔒'}</div><div class="entity-info"><b>${esc(a.nome)}</b><small>Status: ${esc(a.status)}</small></div><select class="control-select activity-status" data-activity="${a.id}">${statuses.map(st=>`<option value="${st}" ${st===a.status?'selected':''}>${st}</option>`).join('')}</select></div>`).join('');
  document.querySelectorAll('.activity-status').forEach(s=>s.onchange=()=>setActivityStatus(Number(s.dataset.activity),s.value));
}
function setActivityStatus(id,status){const a=data.atividades.find(x=>x.id===id);if(!a)return;a.status=status;logAction(`Atividade "${a.nome}": ${status}.`);saveLocal();renderActivities();toast('Atividade atualizada')}
function toggleKiller(id){const k=data.assassinos.find(x=>x.id===id);k.ativo=!k.ativo;k.estado=k.ativo?'Caçando':'Oculto';logAction(`${k.nome}: ${k.estado}.`);saveLocal();renderKillers();toast(`${k.nome}: ${k.estado}`)}
function moveKiller(id){const k=data.assassinos.find(x=>x.id===id);const n=Number(prompt('Novo andar:',k.andar));if(n>=1&&n<=5){k.andar=n;k.sala=prompt('Sala/localização secreta:',k.sala)||k.sala;logAction(`${k.nome} movido para o ${n}º andar.`);saveLocal();renderKillers();toast('Assassino movido')}}
function togglePuzzle(id){const e=data.enigmas.find(x=>x.id===id);if(!e)return;e.resolvido=!e.resolvido;const floor=data.andares.find(x=>x.id===e.andar);if(e.resolvido&&floor&&!data.campanha.chavesEncontradas.includes(floor.chave))data.campanha.chavesEncontradas.push(floor.chave);if(!e.resolvido&&floor)data.campanha.chavesEncontradas=data.campanha.chavesEncontradas.filter(x=>x!==floor.chave);logAction(`${e.nome}: ${e.resolvido?'resolvido':'reaberto'}.`);saveLocal();renderPuzzles();renderCampaign();if(selectedPlayer)renderSheet();toast(e.resolvido?'Enigma resolvido':'Enigma reaberto')}


// ===== Inicialização e rolagem =====
function normalizeData(source){
  const base = source || {};
  const needsSkillMigration = Number(base._skillSchemaVersion||0) < 2;
  base.campanha = base.campanha || {};
  base.campanha.andarAtual = Number(base.campanha.andarAtual) || 5;
  base.campanha.objetivoAtual = base.campanha.objetivoAtual || 'Explorar o 5º andar e encontrar a primeira chave.';
  base.campanha.perseguicao = ['Normal','Alerta','Caça','Perseguição'].includes(base.campanha.perseguicao) ? base.campanha.perseguicao : 'Normal';
  base.campanha.dtPericias = Math.max(1,Math.min(50,Number(base.campanha.dtPericias)||10));
  base.campanha.chavesEncontradas = Array.isArray(base.campanha.chavesEncontradas) ? base.campanha.chavesEncontradas : [];
  base.andares = Array.isArray(base.andares) ? base.andares : [];
  base.jogadores = Array.isArray(base.jogadores) ? base.jogadores : [];
  base.jogadores.forEach(p=>{
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
    formula: type === 'attack' ? attack.teste : attack.dano,
    title: type === 'attack' ? `${attack.nome} — Ataque` : `${attack.nome} — Dano`
  };
  $('#diceTitle').textContent = diceState.title;
  $('#diceFormula').textContent = diceState.formula;
  $('#diceResult').textContent = '—';
  $('#diceBreakdown').textContent = '';
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
  const total=rolls.reduce((sum,value)=>sum+value,0)+modifier;
  $('#diceResult').textContent=total;
  $('#diceBreakdown').textContent=`${rolls.join(' + ')}${modifier ? ` ${modifier>0?'+ ':''}${modifier}`:''} = ${total}`;
  if(diceState.skill || diceState.attribute){
    const dt=Number(diceState.dt)||10;
    const success=total>=dt;
    $('#diceOutcome').textContent=success?`✓ SUCESSO — ${total} ≥ DT ${dt}`:`✕ FALHA — ${total} < DT ${dt}`;
    $('#diceOutcome').className=`dice-outcome ${success?'success':'failure'}`;
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
  initializeApp();
});
