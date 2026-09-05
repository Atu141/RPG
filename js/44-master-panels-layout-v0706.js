/* V0.70.6 — Organização estrutural dos painéis auxiliares do Mestre.
   Os motores continuam ativos; somente a apresentação é reorganizada para evitar
   que painéis dinâmicos sejam inseridos dentro do cartão de Jogadores.
*/
(function(){
  const IDS=['motorV070Panel','conditionsV059Panel','rulesV060Panel','investigationV061Panel'];

  function ensureHost(){
    const screen=document.getElementById('masterScreen');
    if(!screen) return null;
    let host=document.getElementById('masterSystemTools');
    if(!host){
      host=document.createElement('section');
      host.id='masterSystemTools';
      host.className='master-system-tools';
      const grid=screen.querySelector('.master-grid');
      if(grid) grid.insertAdjacentElement('afterend',host);
      else screen.appendChild(host);
    }
    return host;
  }

  function organize(){
    const host=ensureHost();
    if(!host) return;
    IDS.forEach(id=>{
      const panel=document.getElementById(id);
      if(panel && panel.parentElement!==host) host.appendChild(panel);
    });
    host.hidden=!IDS.some(id=>document.getElementById(id));
  }

  const old=window.renderMaster;
  if(typeof old==='function'){
    window.renderMaster=function(){
      const result=old.apply(this,arguments);
      organize();
      return result;
    };
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',organize);
  }else{
    organize();
  }

  window.MasterPanelsLayoutV0706={organize};
})();
