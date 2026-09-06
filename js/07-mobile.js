/* Hotel Espelho RPG — módulo consolidado. */

/* --- 54-v072-mobile.js --- */
/* V0.72 — experiência mobile para Mestre e Jogadores. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  function addMasterMobileNav(){
    const master=$('masterScreen'); if(!master||$('v072MasterNav')) return;
    const nav=document.createElement('nav'); nav.id='v072MasterNav'; nav.className='v072-master-nav';
    nav.innerHTML=`<button data-target="hotelMap">🗺️<span>Mapa</span></button><button data-target="masterPlayers">👥<span>Jogadores</span></button><button data-target="masterMonsters">👹<span>Ameaças</span></button><button data-target="v071CombatPanel">⚔️<span>Combate</span></button><button data-target="v071MultiplayerPanel">🔗<span>Mesa</span></button>`;
    master.appendChild(nav);
    nav.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const t=$(b.dataset.target);if(!t)return;const panel=t.closest('.panel,section')||t;t.scrollIntoView({behavior:'smooth',block:'start'});});
  }
  function addPlayerQuickNav(){
    const home=$('playerHome'); if(!home||$('v072PlayerHint')) return;
    const hint=document.createElement('div'); hint.id='v072PlayerHint'; hint.className='v072-player-hint';
    const invite=new URLSearchParams(location.search).has('convite');
    hint.innerHTML=invite?'<b>🔗 Ficha sincronizada</b><small>Você entrou pelo convite do Mestre. Escolha ou crie sua ficha; PV, PE e SAN ficam salvos durante a sessão.</small>':'<b>📱 Ficha digital</b><small>Use seu celular para acompanhar PV, PE, SAN, inventário e demais informações sem anotações em papel.</small>';
    home.querySelector('.player-create-bar')?.after(hint);
  }
  function ensureSheetTracker(){
    const sheet=$('playerSheet'); if(!sheet||$('v071PlayerTracker')) return;
    const box=document.createElement('section'); box.id='v071PlayerTracker'; box.className='panel v071-player-tracker';
    const content=$('sheetContent'); if(content) content.before(box); else sheet.appendChild(box);
  }
  function boot(){addMasterMobileNav();addPlayerQuickNav();ensureSheetTracker();}
  const oldInit=window.initializeApp;
  if(typeof oldInit==='function'&&!oldInit.__v072mobile){window.initializeApp=function(){const r=oldInit.apply(this,arguments);setTimeout(boot,250);return r;};window.initializeApp.__v072mobile=true;}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,300));else setTimeout(boot,300);
})();

