/* V0.49 — Laboratório de testes. Permite validar a campanha sem jogar toda a sessão. */
const CampaignQA=(()=>{
  function run(){
    const checks=[];const add=(name,ok,detail)=>checks.push({name,ok,detail});
    try{CampaignEngine.ensure();add('Motor de campanha',true,'Estado disponível.');}catch(e){add('Motor de campanha',false,e.message);}
    try{InvestigationEngine.ensure();add('Investigação',true,`${InvestigationEngine.all().length} pistas no catálogo.`);}catch(e){add('Investigação',false,e.message);}
    try{PuzzleEngine.ensure();add('Enigmas',true,`${PuzzleEngine.ensure().chaves.length} chaves configuradas.`);}catch(e){add('Enigmas',false,e.message);}
    try{CombatPlus.ensure();add('Combate',true,'Estado de combate válido.');}catch(e){add('Combate',false,e.message);}
    const valid=IntegrityEngine.validate();add('Integridade',valid.ok,valid.issues.length?valid.issues.join('; '):'Nenhum problema estrutural detectado.');
    return checks;
  }
  function simulate(){const m=CampaignEngine.ensure();const snapshot=JSON.stringify(data);const original=m.cenaAtualId;const results=[];for(const s of CampaignEngine.SCENES){CampaignEngine.applyScene(s,false);results.push({cena:s.titulo,ok:CampaignEngine.currentScene()?.id===s.id});}data=normalizeData(JSON.parse(snapshot));saveLocal();renderMaster();if(selectedPlayer)renderSheet();return results;}
  function resetProgress(){if(!confirm('Resetar somente o progresso narrativo e manter as fichas?'))return;const fresh=normalizeData(JSON.parse(JSON.stringify(data)));const keepPlayers=data.jogadores;fresh.jogadores=keepPlayers;data=fresh;saveLocal();location.reload();}
  return {run,simulate,resetProgress};
})();
