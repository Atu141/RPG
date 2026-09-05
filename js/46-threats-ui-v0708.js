/* V0.70.10 — Gerenciador de ameaças integrado ao painel Monstros.
   O painel principal é renderizado por 04-master-campaign.js para evitar
   cartões dinâmicos aninhados no grid principal do Mestre. */
(function(){
  function render(){
    if(typeof renderMaster==='function' && window.data) renderMaster();
  }
  function addSelected(){
    const id=document.getElementById('masterMonsterCatalogSelect')?.value;
    if(!id)return toast('Selecione uma ameaça.');
    try{ThreatEngine.add(id);toast('Monstro adicionado à sessão.');render();}catch(e){toast(e.message||'Erro ao adicionar monstro.');}
  }
  window.ThreatUI={render,addSelected,filterCatalog:()=>{}};
})();
