/* V0.44 — Máquina de estados da campanha. Regras de transição ficam centralizadas. */
const CampaignState=(()=>{
  const STATES=['Em andamento','Pausada','Grande Noite','Finalizada'];
  function ensure(){const m=CampaignEngine.ensure();m.transicoes=Array.isArray(m.transicoes)?m.transicoes:[];m.estado=STATES.includes(m.estado)?m.estado:'Em andamento';return m;}
  function setState(state){const m=ensure();if(!STATES.includes(state))return;const old=m.estado;m.estado=state;m.transicoes.unshift({de:old,para:state,at:Date.now()});if(state==='Grande Noite'){m.flags.grandeNoite=true;data.campanha.horror=data.campanha.horror||{};data.campanha.horror.grandeNoite=true;}if(state==='Finalizada')m.flags.campanhaFinalizada=true;logAction(`Estado da campanha: ${old} → ${state}.`);saveLocal();CampaignEngine.refresh();toast(`Campanha: ${state}`);}
  function transitionToScene(id){const m=ensure(),scene=CampaignEngine.SCENES.find(s=>s.id===id);if(!scene)return false;const current=CampaignEngine.currentScene();if(current&&scene.ato<current.ato)return false;CampaignEngine.applyScene(scene,true);if(scene.id==='a2-grande-noite')setState('Grande Noite');return true;}
  function canAdvance(){const m=ensure();if(m.estado==='Finalizada'||m.estado==='Pausada')return false;return true;}
  return {STATES,ensure,setState,transitionToScene,canAdvance};
})();
