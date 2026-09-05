/* V0.50 — Experiência do Mestre: navegação rápida, painéis recolhíveis e controles de sessão. */
const MasterUX=(()=>{
  function ensure(){
    if(!data)return null;
    const c=data.campanha;
    c.ui=c.ui&&typeof c.ui==='object'?c.ui:{};
    c.ui.collapsed=c.ui.collapsed&&typeof c.ui.collapsed==='object'?c.ui.collapsed:{};
    c.ui.activeTab=c.ui.activeTab||'visao';
    c.ui.versao=50;
    return c.ui;
  }
  function togglePanel(id){const u=ensure();u.collapsed[id]=!u.collapsed[id];saveLocal();renderMaster();}
  function isCollapsed(id){return Boolean(ensure()?.collapsed?.[id]);}
  function focus(section){const el=document.getElementById(section);if(el){el.scrollIntoView({behavior:'smooth',block:'start'});el.classList.add('ux-focus');setTimeout(()=>el.classList.remove('ux-focus'),900);}}
  function resetLayout(){const u=ensure();u.collapsed={};u.activeTab='visao';saveLocal();renderMaster();toast('Layout do Mestre restaurado.');}
  function render(){
    const host=$('#masterUxPanel');if(!host||!data)return;const u=ensure();
    const items=[['campaignEnginePanel','🎬 Campanha'],['campaignEvolutionPanel','⚙ Operação'],['hotelMap','🗺 Hotel'],['masterDashboard','◉ Painel rápido'],['masterPlayers','♟ Jogadores'],['masterMonsters','☠ Monstros']];
    host.innerHTML=`<div class="ux-head"><div><span class="eyebrow">V0.50 • EXPERIÊNCIA DO MESTRE</span><h2>Painel de Controle</h2><p>Acesso rápido aos módulos da sessão. As alterações continuam locais e persistentes.</p></div><div class="ux-actions"><button class="ghost small" onclick="MasterUX.resetLayout()">↺ LAYOUT</button><button class="ghost small" onclick="MasterUX.focus('campaignEnginePanel')">🎬 CAMPANHA</button><button class="ghost small" onclick="MasterUX.focus('hotelMap')">🗺 HOTEL</button><button class="ghost small" onclick="MasterUX.focus('masterPlayers')">♟ JOGADORES</button></div></div><div class="ux-shortcuts">${items.map(([id,label])=>`<button onclick="MasterUX.focus('${id}')">${label}</button>`).join('')}</div>`;
  }
  return {ensure,togglePanel,isCollapsed,focus,resetLayout,render};
})();

/* Integração dos módulos V0.50–V0.55 com as centrais existentes. */
(function(){
  function ensurePanels(){
    if(!data)return;
    const specs=[
      ['masterUxPanel','panel master-ux-panel','campaignEnginePanel'],
      ['hotelGamePanel','panel hotel-game-panel','hotelMap'],
      ['investigationFinalPanel','panel investigation-final-panel','masterDashboard'],
      ['endingsPanel','panel endings-panel','investigationFinalPanel']
    ];
    specs.forEach(([id,cls,afterId])=>{if(!document.getElementById(id)){const d=document.createElement('div');d.id=id;d.className=cls;const after=document.getElementById(afterId);if(after?.parentNode)after.parentNode.insertBefore(d,after.nextSibling);else document.querySelector('#masterScreen')?.appendChild(d);}});
  }
  const oldMaster=window.renderMaster;
  window.renderMaster=function(){oldMaster();ensurePanels();MasterUX.render();HotelGame.render();InvestigationFinal.render();EndingEngine.render();};
  const oldSheet=window.renderSheet;
  window.renderSheet=function(){oldSheet();if(typeof SheetIntegration!=='undefined'){SheetIntegration.ensure(selectedPlayer);SheetIntegration.render();}};
  const boot=()=>{if(!data){setTimeout(boot,100);return;}ensurePanels();MasterUX.render();HotelGame.render();InvestigationFinal.render();EndingEngine.render();if(selectedPlayer&&typeof SheetIntegration!=='undefined')SheetIntegration.render();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
