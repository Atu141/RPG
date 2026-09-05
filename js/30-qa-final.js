/* V0.55 — QA final: diagnóstico abrangente e simulação sem corromper a campanha. */
const FinalQA=(()=>{
  function check(name,fn){try{const r=fn();return{name,ok:r!==false,detail:r===true?'OK':String(r??'OK')}}catch(e){return{name,ok:false,detail:e.message||String(e)}}}
  function run(){
    if(!data)return[];
    const results=[
      check('Estado base',()=>!!data.campanha&&Array.isArray(data.jogadores)&&Array.isArray(data.andares)),
      check('Personagens',()=>data.jogadores.every(p=>p.id&&p.nome&&p.pvMax>=0&&p.peMax>=0&&p.sanMax>=0)),
      check('Origens',()=>data.jogadores.every(p=>!p.origem||!!getOriginProfile(p))),
      check('Hotel',()=>data.andares.length===9&&data.andares.every(f=>Number(f.id)>=1&&Number(f.id)<=9)),
      check('Assassinos',()=>data.assassinos.every(k=>Number(k.andar)!==5)),
      check('Motor de campanha',()=>!!CampaignEngine.ensure()?.cenaAtualId),
      check('Investigação',()=>InvestigationEngine.all().length>=1),
      check('Enigmas',()=>PuzzleEngine.ensure().chaves.length===4),
      check('Combate',()=>!!CombatPlus.ensure()),
      check('Salvamento',()=>typeof localStorage!=='undefined'),
      check('Rotas/finais',()=>EndingEngine.ENDINGS.length>=4),
      check('Integridade',()=>IntegrityEngine.validate().ok)
    ];
    data.campanha.qa=data.campanha.qa||{};data.campanha.qa.ultimaExecucao={at:Date.now(),ok:results.every(x=>x.ok),results};saveLocal();return results;
  }
  function simulate(){
    if(!data)return[];const snapshot=JSON.stringify(data);const selected=selectedPlayer?.id||null;const results=[];
    try{
      CampaignEngine.SCENES.forEach(scene=>{CampaignEngine.applyScene(scene,false);results.push({etapa:`Cena: ${scene.titulo}`,ok:CampaignEngine.currentScene()?.id===scene.id});});
      [1,2,3,4].forEach(n=>{PuzzleEngine.setStatus(n,'resolvido');results.push({etapa:`Chave ${n}`,ok:(data.campanha.chavesEncontradas||[]).includes(n)});});
      results.push({etapa:'Final',ok:EndingEngine.evaluate('Hall')?.id==='fuga-perfeita'});
    }catch(e){results.push({etapa:'Exceção',ok:false,erro:e.message});}
    data=normalizeData(JSON.parse(snapshot));selectedPlayer=selected?data.jogadores.find(p=>p.id===selected)||null:null;saveLocal();renderMaster();if(selectedPlayer)renderSheet();return results;
  }
  function report(){const r=run();const failed=r.filter(x=>!x.ok);return {ok:!failed.length,total:r.length,failed,results:r};}
  return {run,simulate,report};
})();
