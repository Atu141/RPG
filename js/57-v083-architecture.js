/* V0.83 — Refatoração interna segura.
   Objetivo: reduzir duplicação sem alterar APIs públicas usadas pela interface.
   - Registro único dos módulos ativos.
   - Persistência de estado delegada a saveLocal().
   - Diagnóstico de wrappers de renderização.
   - Compatibilidade preservada para módulos históricos ainda referenciados.
*/
(function(){
  'use strict';
  const VERSION='0.83';
  const MODULES=[
    ['core','01-core.js'],['players','02-players.js'],['inventory','03-inventory.js'],
    ['master','04-master-campaign.js'],['map-horror','05-horror-map.js'],['data-dice','06-data-dice.js'],
    ['campaign','10-campaign-engine.js'],['investigation','11-investigation.js'],['puzzles','12-puzzles.js'],
    ['combat','13-combat-engine.js'],['state','17-state-machine.js'],['rules','32-rules-engine.js'],
    ['conditions','33-conditions.js'],['rules-final','37-final-rules.js'],['class-skills','38-class-skills-ui.js'],
    ['motor','40-motor-v070.js'],['threats','45-threats-v0708.js'],['threats-ui','46-threats-ui-v0708.js'],
    ['session','47-session-sync-v080.js'],['session-ui','48-session-tools-ui-v080.js'],
    ['multiplayer','53-v071-combat-multiplayer.js'],['mobile','54-v072-mobile.js'],['sheet-viewer','56-v082-master-sheet-viewer.js']
  ];
  function getModules(){return MODULES.map(([id,file])=>({id,file}));}
  function state(){return {
    version:VERSION,
    players:Array.isArray(data?.jogadores)?data.jogadores.length:0,
    monsters:Array.isArray(data?.monstros)?data.monstros.length:0,
    assassins:Array.isArray(data?.assassinos)?data.assassinos.length:0,
    storageKey:'op-fichas-state',
    persistence:'saveLocal',
    renderMaster:typeof window.renderMaster==='function',
    renderSheet:typeof window.renderSheet==='function'
  };}
  function audit(){
    const issues=[], warnings=[];
    if(typeof saveLocal!=='function')issues.push('saveLocal() não está disponível.');
    if(typeof window.renderMaster!=='function')issues.push('renderMaster() não está disponível.');
    if(typeof window.renderSheet!=='function')issues.push('renderSheet() não está disponível.');
    if(typeof GameEngineV070==='undefined')warnings.push('GameEngineV070 não carregado.');
    if(typeof InvestigationEngine==='undefined')warnings.push('InvestigationEngine não carregado.');
    if(typeof CombatEngine==='undefined')warnings.push('CombatEngine não carregado.');
    return {version:VERSION,ok:issues.length===0,issues,warnings,state:state(),modules:getModules()};
  }
  function persist(reason='refactor'){
    if(!data||typeof saveLocal!=='function')return false;
    if(data.campanha){
      data.campanha.arquitetura=data.campanha.arquitetura||{};
      data.campanha.arquitetura.ultimaPersistencia={reason,at:Date.now(),versao:VERSION};
    }
    saveLocal();
    return true;
  }
  window.ArchitectureV083={VERSION,getModules,state,audit,persist};
  window.runArchitectureAudit=()=>ArchitectureV083.audit();
  const boot=()=>{
    if(!data){setTimeout(boot,100);return;}
    try{
      data.campanha=data.campanha||{};
      data.campanha.arquitetura=data.campanha.arquitetura||{};
      data.campanha.arquitetura.versao=VERSION;
      data.campanha.arquitetura.modulosAtivos=MODULES.map(x=>x[0]);
    }catch(e){console.warn('V0.83 architecture boot:',e);}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
