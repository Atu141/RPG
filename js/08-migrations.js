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

