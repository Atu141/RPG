// Painel de pistas: organização narrativa por andar, com destaque no andar atual.
const __renderMasterDashboardRefined=renderMasterDashboard;
renderMasterDashboard=function(){
  __renderMasterDashboardRefined();
  const el=$('#masterDashboard'); if(!el||!data)return;
  const c=data.campanha; const grouped=data.pistas.reduce((acc,p)=>{(acc[p.andar]??=[]).push(p);return acc;},{});
  const clueArea=Object.keys(grouped).sort((a,b)=>Number(a)-Number(b)).map(k=>{const floor=Number(k),f=data.andares.find(a=>Number(a.id)===floor),items=grouped[k];return `<div class="clue-floor ${floor===Number(c.andarAtual)?'current':''}"><div class="clue-floor-head"><b>${floor===0?'Térreo':`${floor}º Andar — ${esc((f?.nome||'').replace(/^\d+º Andar — /,''))}`}</b><span>${items.filter(x=>x.revelada).length}/${items.length}</span></div>${items.map(p=>`<div class="clue-row refined"><div><span class="clue-theme">${esc(p.tema||'Pista')}</span><b>${esc(p.nome)}</b><small>${esc(p.texto)}</small></div><button class="dice-btn ${p.revelada?'secondary':''}" onclick="toggleClue('${p.id}')">${p.revelada?'OCULTAR':'REVELAR'}</button></div>`).join('')}</div>`}).join('');
  const old=el.querySelector('.clue-list'); if(old) old.outerHTML=`<div class="clue-list organized-clues">${clueArea}</div>`;
};

// Migração automática: estados salvos anteriores recebem as novas pistas e nomenclaturas sem perder progresso de revelação.
const __loadDataRefined=loadData;
loadData=async function(useSaved=true){
  await __loadDataRefined(useSaved);
  if(!data)return;
  const clueVersion=Number(data._clueSchemaVersion||0);
  if(clueVersion<2){
    try{
      const response=await fetch('fichas.json?ts='+Date.now(),{cache:'no-store'});
      const fresh=await response.json();
      const revealed=new Set((data.campanha.pistasReveladas||[]).map(String));
      (data.pistas||[]).forEach(p=>{if(p.revelada)revealed.add(String(p.id));});
      data.pistas=(fresh.pistas||[]).map(p=>({...p,revelada:revealed.has(String(p.id))}));
      const oldNames={}; (data.andares||[]).forEach(a=>oldNames[a.id]=a.nome);
      (data.andares||[]).forEach(a=>{const freshFloor=fresh.andares?.find(f=>Number(f.id)===Number(a.id));if(freshFloor)a.nome=freshFloor.nome;});
      data.campanha.pistasReveladas=data.pistas.filter(p=>p.revelada).map(p=>p.id);
      data._clueSchemaVersion=2; data._releaseVersion='V0.30.3'; data._v030MapSchemaVersion=3; saveLocal();
      renderMaster(); renderCampaign(); if(selectedPlayer)renderSheet();
      toast('Dados atualizados para a V0.30.3');
    }catch(err){console.warn('Migração de pistas não concluída:',err);}
  }
};

window.createMasterEvent=createMasterEvent; window.setEventFloorRooms=setEventFloorRooms; window.activateSavedEvent=activateSavedEvent; window.deleteSavedEvent=deleteSavedEvent; window.clearMasterEvent=clearMasterEvent; window.openConditionModal=openConditionModal; window.closeConditionModal=closeConditionModal; window.saveConditionModal=saveConditionModal;
