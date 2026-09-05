/* V0.73–V0.80 — Redesign visual/UX do Hotel Espelho.
   Camada exclusivamente visual: não altera regras, cálculos, catálogo ou estado mecânico.
*/
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function initials(name){return String(name||'HE').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'HE';}

  function addPlayerLanding(){
    const home=$('playerHome'); if(!home||$('v073PlayerLanding')) return;
    const el=document.createElement('div'); el.id='v073PlayerLanding'; el.className='v073-player-landing';
    el.innerHTML=`
      <div class="v073-landing-mark"><span>✦</span></div>
      <div class="v073-landing-copy"><span class="v073-kicker">ARQUIVO DE SOBREVIVÊNCIA</span><strong>Seu celular é sua ficha.</strong><small>Acompanhe PV, PE, SAN, perícias, inventário, armas e rituais durante a sessão — sem papel.</small></div>
      <div class="v073-landing-tags"><span>FICHA DIGITAL</span><span>NEX 5%</span><span>HOTEL ESPELHO</span></div>`;
    const hero=home.querySelector('.hero'); if(hero) hero.after(el); else home.prepend(el);
  }

  function addMasterOverview(){
    const master=$('masterScreen'); if(!master||$('v073MasterOverview')) return;
    const el=document.createElement('section'); el.id='v073MasterOverview'; el.className='v073-overview';
    el.innerHTML=`<div class="v073-overview-head"><div><span class="v073-kicker">CENTRAL OPERACIONAL</span><strong>Estado da sessão</strong></div><span class="v073-live"><i></i> AO VIVO</span></div><div class="v073-overview-grid"><div class="v073-overview-card" data-stat="players"><span>👥</span><div><b>0</b><small>Jogadores</small></div></div><div class="v073-overview-card" data-stat="threats"><span>☠</span><div><b>0</b><small>Ameaças ativas</small></div></div><div class="v073-overview-card" data-stat="floor"><span>⌂</span><div><b>5º</b><small>Andar atual</small></div></div><div class="v073-overview-card" data-stat="combat"><span>⚔</span><div><b>—</b><small>Combate</small></div></div></div></section>`;
    const profile=$('masterProfilePanel'); if(profile) profile.after(el); else master.prepend(el);
  }

  function updateOverview(){
    const root=$('v073MasterOverview'); if(!root) return;
    const players=(window.data&&Array.isArray(data.jogadores))?data.jogadores:[];
    const threats=(window.data&&Array.isArray(data.ameacasSessao))?data.ameacasSessao:[];
    const p=root.querySelector('[data-stat="players"] b'); if(p) p.textContent=players.length;
    const t=root.querySelector('[data-stat="threats"] b'); if(t) t.textContent=threats.length;
    const floor=(window.data&&data.campanha&&data.campanha.andarAtual!=null)?data.campanha.andarAtual:(window.data&&data.andarAtual!=null?data.andarAtual:5);
    const f=root.querySelector('[data-stat="floor"] b'); if(f) f.textContent=`${floor}º`;
    const combat=root.querySelector('[data-stat="combat"] b');
    const active=window.data&&data.campanha&&data.campanha.combateV071&&data.campanha.combateV071.ativo;
    if(combat) combat.textContent=active?'ATIVO':'—';
  }

  function addSheetToolbar(){
    const sheet=$('playerSheet'); if(!sheet||$('v073SheetToolbar')) return;
    const bar=document.createElement('div'); bar.id='v073SheetToolbar'; bar.className='v073-sheet-toolbar';
    bar.innerHTML=`<div><span class="v073-kicker">ARQUIVO PESSOAL</span><strong>Ficha operacional</strong></div><div class="v073-sheet-actions"><button type="button" data-sheet-action="top">INÍCIO</button><button type="button" data-sheet-action="resources">PV • PE • SAN</button><button type="button" data-sheet-action="content">DETALHES</button></div>`;
    const back=sheet.querySelector('.back'); if(back) back.after(bar); else sheet.prepend(bar);
    bar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const action=b.dataset.sheetAction;const target=action==='resources'?$(`v071PlayerTracker`):$('sheetContent');if(target)target.scrollIntoView({behavior:'smooth',block:'start'});else window.scrollTo({top:0,behavior:'smooth'});});
  }

  function decoratePlayerCards(){
    const cards=$('playerCards'); if(!cards) return;
    cards.querySelectorAll('.player-card').forEach(card=>{
      if(card.dataset.v073Decorated)return;
      card.dataset.v073Decorated='1';
      const avatar=card.querySelector('.avatar'); if(avatar) avatar.textContent=initials(card.querySelector('b')?.textContent);
      card.classList.add('v073-player-card');
    });
  }

  function addMapControls(){
    const map=$('hotelMap'); if(!map||map.dataset.v073MapControls)return;
    map.dataset.v073MapControls='1';
    const wrap=document.createElement('div'); wrap.className='v073-map-controls';
    wrap.innerHTML=`<button type="button" data-map-zoom="out" aria-label="Diminuir zoom">−</button><span>ZOOM</span><button type="button" data-map-zoom="in" aria-label="Aumentar zoom">＋</button><button type="button" data-map-zoom="reset" aria-label="Restaurar zoom">1×</button>`;
    map.appendChild(wrap);
    let zoom=1;
    const apply=()=>{const plan=map.querySelector('.hotel-floor-plan');if(!plan)return;plan.style.setProperty('--v073-map-zoom',zoom);plan.classList.toggle('v073-zoomed',zoom!==1);};
    wrap.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.mapZoom;if(a==='in')zoom=Math.min(1.35,+(zoom+.1).toFixed(2));if(a==='out')zoom=Math.max(.85,+(zoom-.1).toFixed(2));if(a==='reset')zoom=1;apply();});
    new MutationObserver(()=>setTimeout(apply,0)).observe(map,{childList:true,subtree:true});
  }

  function updateHorrorState(){
    const text=(document.body.innerText||'').toUpperCase();
    let level='normal';
    if(text.includes('PERSEGUIÇÃO'))level='pursuit';
    else if(text.includes('CAÇA'))level='hunt';
    else if(text.includes('ALERTA'))level='alert';
    document.body.dataset.horrorLevel=level;
  }

  function observeUI(){
    const obs=new MutationObserver(()=>{
      updateOverview();decoratePlayerCards();addMapControls();updateHorrorState();
    });
    obs.observe(document.body,{childList:true,subtree:true});
    setInterval(updateOverview,1500);
    setInterval(updateHorrorState,1200);
  }

  function boot(){
    addPlayerLanding();addMasterOverview();addSheetToolbar();decoratePlayerCards();addMapControls();updateOverview();updateHorrorState();observeUI();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,450));else setTimeout(boot,450);
})();
