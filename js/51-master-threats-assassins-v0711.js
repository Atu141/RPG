/* V0.70.11 — Correção funcional de monstros + painel completo dos 4 assassinos. */
(function(){
  const allowedFloors=[1,2,3,4,6,7,8,9];
  let loading=false;
  const esc0=s=>typeof esc==='function'?esc(s):String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  async function ensureCatalog(){
    if(Array.isArray(window.THREAT_CATALOG)&&window.THREAT_CATALOG.length)return true;
    if(loading)return false;
    loading=true;
    try{
      const r=await fetch('ameacas.json?ts='+Date.now(),{cache:'no-store'});
      if(!r.ok)throw new Error('HTTP '+r.status);
      const j=await r.json();
      window.THREAT_CATALOG=Array.isArray(j)?j:(Array.isArray(j.ameacas)?j.ameacas:[]);
      return window.THREAT_CATALOG.length>0;
    }catch(e){console.error(e);window.THREAT_CATALOG=[];return false}
    finally{loading=false}
  }

  function makeInstance(base){
    if(!base)throw new Error('Ameaça não encontrada no catálogo.');
    const x=JSON.parse(JSON.stringify(base));
    x.id='threat_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
    x.catalogId=base.catalogId||base.id;
    x.instancia=true;
    x.pvMax=Number(base.pvBase??base.pvMax??base.pv??0);
    x.pv=Number(base.pvBase??base.pvMax??base.pv??0);
    x.condicoes=[];
    return x;
  }

  async function addMonster(id){
    if(!window.data)throw new Error('Dados da campanha ainda não foram carregados.');
    await ensureCatalog();
    const base=(window.THREAT_CATALOG||[]).find(x=>String(x.id)===String(id)||String(x.catalogId)===String(id));
    if(!base)throw new Error('Ameaça não encontrada no catálogo.');
    let x;
    if(window.ThreatEngine?.add){
      x=window.ThreatEngine.add(base.catalogId||base.id);
    }else{
      x=makeInstance(base);
      data.monstros=Array.isArray(data.monstros)?data.monstros:[];
      data.monstros.push(x);
      if(typeof saveLocal==='function')saveLocal();
    }
    if(typeof renderMaster==='function')renderMaster();
    if(typeof toast==='function')toast('Monstro adicionado à sessão.');
    return x;
  }

  function renderAssassins(){
    const host=document.getElementById('killerInfo');
    if(!host||!window.data)return;
    host.innerHTML=(data.assassinos||[]).map(k=>{
      const attacks=(k.ataques||[]).slice(0,3).map((a,i)=>`<div class="killer-attack-row"><div><b>${esc0(a.nome)}</b><small>Teste: ${esc0(a.teste||'—')} • Dano: ${esc0(a.dano||'—')}</small></div><div class="killer-attack-actions"><button class="dice-btn" data-killer-roll="${esc0(k.id)}" data-killer-index="${i}" data-killer-roll-type="attack">ATACAR</button><button class="dice-btn secondary" data-killer-roll="${esc0(k.id)}" data-killer-index="${i}" data-killer-roll-type="damage">DANO</button></div></div>`).join('')||'<small class="muted">Nenhum ataque cadastrado.</small>';
      const weak=(k.fraquezas||[]).map(w=>`<span class="killer-weakness">${esc0(w)}</span>`).join('')||'<span class="muted">Nenhuma cadastrada</span>';
      return `<article class="entity killer killer-enhanced-card">
        <div class="entity-avatar">🔪</div>
        <div class="entity-info">
          <b>${esc0(k.nome)}</b>
          <small>${esc0(k.elemento||'—')} • ${esc0(k.inspiracao||'Assassino')} • Andar ${esc0(k.andar)}º</small>
          <div class="killer-stat-grid"><span><strong>PV</strong>${esc0(k.pv??'—')}</span><span><strong>DEF</strong>${esc0(k.defesa??'—')}</span><span><strong>VD</strong>${esc0(k.vd??'—')}</span><span><strong>ESTADO</strong>${esc0(k.estado||'Oculto')}</span></div>
          <small>Localização: ${esc0(k.sala||'Não definida')} • 5º andar bloqueado</small>
          <details class="killer-details"><summary>ATAQUES E FRAQUEZAS</summary><div class="killer-attack-list">${attacks}</div><div class="killer-weakness-list"><b>Fraquezas:</b> ${weak}</div></details>
        </div>
        <div class="killer-actions"><button class="dice-btn secondary" data-killer-sheet="${esc0(k.id)}">FICHA</button><button class="dice-btn" data-killer-toggle="${esc0(k.id)}">${k.ativo?'DESATIVAR':'ATIVAR'}</button><button class="dice-btn secondary" data-killer-move="${esc0(k.id)}">MOVER</button></div>
      </article>`;
    }).join('');
    host.querySelectorAll('[data-killer-sheet]').forEach(b=>b.onclick=()=>openKillerSheet(b.dataset.killerSheet));
    host.querySelectorAll('[data-killer-toggle]').forEach(b=>b.onclick=()=>toggleKiller(b.dataset.killerToggle));
    host.querySelectorAll('[data-killer-move]').forEach(b=>b.onclick=()=>moveKiller(b.dataset.killerMove));
    host.querySelectorAll('[data-killer-roll]').forEach(b=>b.onclick=()=>openKillerRoll(b.dataset.killerRoll,Number(b.dataset.killerIndex),b.dataset.killerRollType));
  }

  // Substitui o render antigo dos assassinos sem alterar os 4 registros de fichas.json.
  window.renderKillers=renderAssassins;

  // Delegação global: o botão continua funcional mesmo após qualquer re-render do Mestre.
  if(!window.__v0711MonsterEvents){
    window.__v0711MonsterEvents=true;
    document.addEventListener('click',async e=>{
      const btn=e.target.closest('#masterMonsterAddBtn');
      if(!btn)return;
      e.preventDefault();e.stopImmediatePropagation();
      const sel=document.getElementById('masterMonsterCatalogSelect');
      const id=sel?.value;
      if(!id){if(typeof toast==='function')toast('Selecione uma ameaça.');return}
      btn.disabled=true;
      try{await addMonster(id)}catch(err){console.error(err);if(typeof toast==='function')toast(err.message||'Não foi possível adicionar o monstro.');}
      finally{btn.disabled=false}
    },true);
  }

  // Depois do catálogo carregar, força uma renderização para preencher o seletor.
  const oldRender=window.renderMaster;
  if(typeof oldRender==='function' && !window.__v0711RenderWrapped){
    window.__v0711RenderWrapped=true;
    window.renderMaster=function(){
      oldRender.apply(this,arguments);
      const sel=document.getElementById('masterMonsterCatalogSelect');
      if(sel && sel.options.length<=1 && !loading){
        ensureCatalog().then(ok=>{if(ok && typeof window.renderMaster==='function')window.renderMaster();});
      }
      renderAssassins();
    };
  }

  // Se o app já estiver aberto quando este script for executado.
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{ensureCatalog();});else ensureCatalog();
})();
