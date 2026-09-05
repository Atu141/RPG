/* V0.54 — Rotas e finais: desfechos determinados pelo estado real da campanha. */
const EndingEngine=(()=>{
  const ENDINGS=[
    {id:'fuga-hall',nome:'Fuga pelo Hall',rota:'Hall',descricao:'Os sobreviventes alcançam o Hall de Entrada e deixam o Hotel Espelho.',minKeys:2},
    {id:'fuga-terraco',nome:'Resgate pelo Terraço',rota:'Terraço',descricao:'Os sobreviventes chegam ao Terraço e conseguem sinalizar para o resgate.',minKeys:2},
    {id:'fuga-perfeita',nome:'Fuga Completa',rota:'Qualquer',descricao:'Todas as quatro chaves foram obtidas e o grupo escapou do hotel.',minKeys:4},
    {id:'hotel-consome',nome:'O Hotel Consome',rota:'Nenhuma',descricao:'A campanha termina sem uma rota de fuga concluída.',minKeys:99}
  ];
  function ensure(){if(!data)return null;const c=data.campanha;c.finais=c.finais&&typeof c.finais==='object'?c.finais:{};c.finais.versao=54;c.finais.finalAtual=c.finais.finalAtual||null;c.finais.historico=Array.isArray(c.finais.historico)?c.finais.historico:[];return c.finais;}
  function evaluate(route){const f=ensure(),keys=(data.campanha.chavesEncontradas||[]).length;const r=String(route||'Nenhuma');if(keys>=4)return ENDINGS.find(x=>x.id==='fuga-perfeita');if(keys>=2&&['Hall','Terraço'].includes(r))return ENDINGS.find(x=>x.rota===r)||ENDINGS.find(x=>x.id==='fuga-hall');return ENDINGS.find(x=>x.id==='hotel-consome');}
  function finish(route){const f=evaluate(route);if(!f)return null;const s=ensure();s.finalAtual=f.id;s.historico.unshift({id:f.id,route,at:Date.now()});data.campanha.motor.estado='Finalizada';CampaignEngine.ensure().flags.campanhaFinalizada=true;saveLocal();CampaignEngine.refresh();toast(`Final: ${f.nome}`);return f;}
  function reset(){const s=ensure();s.finalAtual=null;data.campanha.motor.estado='Em andamento';saveLocal();CampaignEngine.refresh();}
  function render(){const host=$('#endingsPanel');if(!host||!data)return;const s=ensure(),keys=(data.campanha.chavesEncontradas||[]).length;host.innerHTML=`<div class="en-head"><div><span class="eyebrow">V0.54 • DESFECHOS</span><h2>Rotas e Finais</h2><p>Chaves atuais: <b>${keys}/4</b>. O final é calculado a partir do estado da campanha.</p></div></div><div class="en-grid">${ENDINGS.map(x=>`<div class="en-card"><b>${esc(x.nome)}</b><small>${esc(x.rota)} • ${esc(x.descricao)}</small><button class="dice-btn ${x.id==='hotel-consome'?'secondary':''}" onclick="EndingEngine.finish('${x.rota}')">TESTAR FINAL</button></div>`).join('')}</div>${s.finalAtual?`<div class="en-result"><b>FINAL ATUAL: ${esc(ENDINGS.find(x=>x.id===s.finalAtual)?.nome||s.finalAtual)}</b><button class="ghost small" onclick="EndingEngine.reset()">REABRIR CAMPANHA</button></div>`:''}`;}
  return {ENDINGS,ensure,evaluate,finish,reset,render};
})();
