/* V0.46 — Enigmas jogáveis: tentativas, dicas, penalidades e resolução. */
const PuzzlePlus=(()=>{
  function ensure(){const p=PuzzleEngine.ensure();p.config=p.config||{};return p;}
  function configure(n,solution){const k=PuzzleEngine.key(n);if(!k)return;k.solucao=String(solution||'').trim()||k.solucao;saveLocal();CampaignEngine.refresh();}
  function submit(n,answer){const k=PuzzleEngine.key(n);if(!k)return false;const given=String(answer||'').trim().toLowerCase();const expected=String(k.solucao||'').trim().toLowerCase();k.tentativas=(k.tentativas||0)+1;let success=false;
    // Soluções abertas podem ser validadas pelo Mestre; códigos configurados recebem comparação simples.
    if(k.resposta){success=given===normalize(k.resposta);}
    ensure().config[n]=ensure().config[n]||{};ensure().config[n].ultimaResposta=answer;ensure().config[n].ultimaSucesso=success;
    logAction(`Tentativa do enigma ${n}: ${answer||'sem resposta'} — ${success?'correta':'não validada'}.`);
    if(success)PuzzleEngine.setStatus(n,'resolvido');else{saveLocal();CampaignEngine.refresh();toast('Tentativa registrada.');} return success;
  }
  function setAnswer(n,answer){const k=PuzzleEngine.key(n);if(!k)return;k.resposta=String(answer||'').trim();saveLocal();CampaignEngine.refresh();}
  function addHint(n,text){PuzzleEngine.hint(n,text);}
  return {ensure,configure,submit,setAnswer,addHint};
})();
