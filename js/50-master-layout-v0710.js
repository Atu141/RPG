/* V0.70.10 — Layout estrutural definitivo da Central do Mestre.
   Todos os painéis dinâmicos de sistema ficam fora do grid de Jogadores/Monstros/
   Assassinos, eliminando sobreposição causada por inserções posteriores. */
(function(){
  const SYSTEM_IDS=['conditionsV059Panel','rulesV060Panel','investigationV061Panel','motorV070Panel'];
  function ensureHost(){
    const screen=document.getElementById('masterScreen');
    if(!screen)return null;
    let host=document.getElementById('masterSystemTools');
    if(!host){
      host=document.createElement('section');host.id='masterSystemTools';host.className='master-system-tools';
      const grid=screen.querySelector('.master-grid');
      if(grid)grid.insertAdjacentElement('afterend',host);else screen.appendChild(host);
    }
    return host;
  }
  function organize(){
    const screen=document.getElementById('masterScreen'); if(!screen)return;
    const host=ensureHost(); if(!host)return;
    SYSTEM_IDS.forEach(id=>{const el=document.getElementById(id);if(el&&el.parentElement!==host)host.appendChild(el);});
    const session=document.getElementById('sessionToolsPanel');
    if(session&&session.parentElement!==host)host.appendChild(session);
    const threat=document.getElementById('threatManagerPanel');
    if(threat){ threat.remove(); }
    host.hidden=!Array.from(host.children).some(el=>!el.hidden);
  }
  function wrap(){
    const old=window.renderMaster;
    if(typeof old!=='function'||old.__v0710)return;
    const fn=function(){const r=old.apply(this,arguments);setTimeout(organize,0);return r;};
    fn.__v0710=true;window.renderMaster=fn;
  }
  const boot=()=>{wrap();organize();setTimeout(organize,50);setTimeout(organize,250);};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.MasterLayoutV0710={organize};
})();
