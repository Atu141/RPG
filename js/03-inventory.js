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
function isUnarmedAttack(attack){
  const category=String(attack?.categoria||attack?.tipo||'').toLowerCase();
  if(['corpo-a-corpo','corpo','desarmado','unarmed','melee-unarmed'].includes(category)) return true;
  if(['arma','weapon','fogo','corte','perfuração','perfuracao'].includes(category)) return false;
  const name=String(attack?.nome||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  return ['soco','chute','cabecada','cotovelada','joelhada'].some(x=>name===x || name.startsWith(x+' '));
}
function unarmedAttacks(player){ return (player?.ataques||[]).map((a,i)=>({a,i})).filter(x=>isUnarmedAttack(x.a)); }
function otherCombatAttacks(player){ return (player?.ataques||[]).map((a,i)=>({a,i})).filter(x=>!isUnarmedAttack(x.a)); }
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
