/* V0.43 — Salvamento robusto: autosave, slots, backups e histórico. */
const CampaignStorage=(()=>{
  const KEY='op-fichas-state';
  function ensure(){data.campanha.storage=data.campanha.storage||{};const s=data.campanha.storage;s.autosave=s.autosave!==false;s.slot=s.slot||'principal';s.ultimoSalvamento=s.ultimoSalvamento||null;s.historico=Array.isArray(s.historico)?s.historico:[];return s;}
  function save(reason='manual'){const s=ensure();if(!s.autosave&&reason==='autosave')return;s.ultimoSalvamento=Date.now();s.historico.unshift({reason,at:s.ultimoSalvamento});s.historico=s.historico.slice(0,30);try{localStorage.setItem(KEY,JSON.stringify(data));}catch(e){console.error(e);toast('Não foi possível salvar: armazenamento indisponível.');}}
  function toggleAutosave(){const s=ensure();s.autosave=!s.autosave;save('configuração');CampaignEngine.refresh();toast(`Autosave ${s.autosave?'ativado':'desativado'}.`);}
  function slot(name){const s=ensure();s.slot=String(name||'principal').slice(0,30);save('slot');}
  function backup(){IntegrityEngine.backup();}
  return {ensure,save,toggleAutosave,slot,backup};
})();
