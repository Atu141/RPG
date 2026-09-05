/* V0.45 — Investigação avançada: testes, consequências, relações e histórico. */
const InvestigationPlus=(()=>{
  function ensure(){const i=InvestigationEngine.ensure();i.historico=Array.isArray(i.historico)?i.historico:[];i.tentativas=Array.isArray(i.tentativas)?i.tentativas:[];return i;}
  function test(id,playerId,resultado){const i=ensure(),p=i.catalogo.find(x=>x.id===id);const player=data.jogadores.find(x=>x.id===playerId);if(!p||!player)return;const total=Number(resultado)||0,success=total>=Number(p.dt||10);i.tentativas.unshift({id:'it-'+Date.now(),pistaId:id,playerId,resultado:total,dt:Number(p.dt||10),sucesso:success,at:Date.now()});if(success)InvestigationEngine.reveal(id,player?.nome||'Jogador');logAction(`${player.nome} testou ${p.nome}: ${total} vs DT ${p.dt} — ${success?'sucesso':'falha'}.`);saveLocal();ensure();CampaignEngine.refresh();return success;}
  function relation(id){const p=ensure().catalogo.find(x=>x.id===id);if(!p)return[];return ensure().catalogo.filter(x=>x.assassino===p.assassino||x.chave===p.chave).filter(x=>x.id!==p.id);}
  function hideAll(){const i=ensure();i.pistas=[];data.campanha.pistasReveladas=[];saveLocal();CampaignEngine.refresh();}
  return {ensure,test,relation,hideAll};
})();
