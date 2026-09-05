/* V0.82 — Gerenciador de Fichas dos Jogadores (Mestre)
   Somente leitura: consulta a ficha atual armazenada no estado do Mestre.
*/
(function(){
  'use strict';
  const $=s=>document.querySelector(s);
  const escV=s=>typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const val=(x,d='—')=>x===undefined||x===null||x===''?d:x;
  const pct=(x,max)=>{const a=Number(x)||0,b=Number(max)||0;return b?Math.max(0,Math.min(100,a/b*100)):0};

  function ensureModal(){
    let m=$('#masterPlayerSheetModal');
    if(m)return m;
    m=document.createElement('div');
    m.id='masterPlayerSheetModal';
    m.className='v082-sheet-modal';
    m.setAttribute('aria-hidden','true');
    m.innerHTML='<div class="v082-sheet-backdrop" data-close-master-sheet></div><section class="v082-sheet-dialog" role="dialog" aria-modal="true" aria-labelledby="masterPlayerSheetTitle"><header class="v082-sheet-head"><div><span class="eyebrow">MESTRE • FICHA DO JOGADOR</span><h2 id="masterPlayerSheetTitle">Ficha</h2><p id="masterPlayerSheetSubtitle" class="muted">Somente leitura</p></div><button class="ghost" data-close-master-sheet>✕ FECHAR</button></header><div id="masterPlayerSheetBody" class="v082-sheet-body"></div></section>';
    document.body.appendChild(m);
    m.querySelectorAll('[data-close-master-sheet]').forEach(b=>b.addEventListener('click',close));
    return m;
  }
  function close(){const m=$('#masterPlayerSheetModal');if(m){m.classList.remove('show');m.setAttribute('aria-hidden','true')}}
  function resource(label,current,max,cls){return `<div class="v082-resource ${cls}"><span>${label}</span><b>${val(current,0)}</b><small>/ ${val(max,0)}</small><i><em style="width:${pct(current,max)}%"></em></i></div>`}
  function render(p){
    const m=ensureModal();
    const attrs=p.atributos||{};
    const skills=p.pericias||[];
    const items=p.itens||[];
    const attacks=p.ataques||[];
    const rituals=p.rituais||[];
    const conditions=p.condicoes||p.condicoesAtuais||[];
    const classProfile=(typeof CLASS_PROFILES!=='undefined'&&p.classe)?CLASS_PROFILES[p.classe]:null;
    $('#masterPlayerSheetTitle').textContent=val(p.nome,'Jogador');
    $('#masterPlayerSheetSubtitle').textContent=`${val(p.origem||p.profissao,'Origem não definida')} • ${val(p.classe,'Classe não definida')} • NEX ${val(p.nex,'5%')} • atualização local do Mestre`;
    $('#masterPlayerSheetBody').innerHTML=`
      <div class="v082-identity-strip"><div class="v082-avatar">${escV(String(p.nome||'?').split(' ').map(x=>x[0]).slice(0,2).join(''))}</div><div><strong>${escV(val(p.nome))}</strong><span>${escV(val(p.profissao||p.origem,'Origem não definida'))}</span></div><div class="v082-nex"><small>NEX</small><b>${escV(val(p.nex,'5%'))}</b></div></div>
      <div class="v082-resources">${resource('PV',p.pv,p.pvMax,'pv')}${resource('PE',p.pe,p.peMax,'pe')}${resource('SAN',p.san,p.sanMax,'san')}</div>
      <div class="v082-grid">
        <section class="v082-card"><h3>Atributos</h3><div class="v082-attrs">${Object.entries(attrs).map(([k,v])=>`<div><span>${escV(k)}</span><b>${escV(v)}</b></div>`).join('')||'<small class="muted">Não definidos.</small>'}</div><div class="v082-facts"><span><b>Defesa</b>${escV(val(p.defesa))}</span><span><b>Idade</b>${escV(val(p.idade))}</span><span><b>Origem</b>${escV(val(p.origem||p.profissao))}</span></div></section>
        <section class="v082-card"><h3>Classe</h3><div class="v082-class"><b>${escV(val(p.classe,'Classe não definida'))}</b>${classProfile?`<p>${escV(classProfile.descricao||'')}</p><small>Habilidade NEX 5%: ${escV(classProfile.habilidadeNEX5||'')}</small>`:'<p class="muted">A classe ainda não foi definida.</p>'}</div></section>
        <section class="v082-card v082-wide"><h3>Perícias</h3><div class="v082-list">${skills.map(x=>`<div><b>${escV(typeof skillLabel==='function'?skillLabel(x):x.nome)}</b><span>${x.treinada?'Treinada (+5)':'Não treinada'} • ${escV(typeof skillFormula==='function'?skillFormula(p,x):val(x.teste))}</span></div>`).join('')||'<small class="muted">Nenhuma perícia cadastrada.</small>'}</div></section>
        <section class="v082-card"><h3>Inventário</h3><div class="v082-list">${items.map(i=>`<div><b>${escV(i.nome)} ${i.equipado?'• EQUIPADO':''}</b><span>${escV(val(i.descricao,''))} ${i.quantidade!=null?`• Qtd. ${escV(i.quantidade)}`:''}</span></div>`).join('')||'<small class="muted">Inventário vazio.</small>'}</div></section>
        <section class="v082-card"><h3>Ataques e armas</h3><div class="v082-list">${attacks.map(a=>`<div><b>${escV(a.nome)}</b><span>Teste ${escV(val(a.teste))} • Dano ${escV(val(a.dano))}</span></div>`).join('')||'<small class="muted">Nenhum ataque cadastrado.</small>'}</div></section>
        <section class="v082-card"><h3>Rituais</h3><div class="v082-list">${rituals.map(r=>`<div><b>${escV(r.nome)}</b><span>${escV(val(r.elemento||r.circulo,'Ritual'))}</span></div>`).join('')||'<small class="muted">Nenhum ritual cadastrado.</small>'}</div></section>
        <section class="v082-card"><h3>Condições</h3><div class="v082-chips">${(Array.isArray(conditions)?conditions:Object.values(conditions||{})).map(c=>`<span>${escV(typeof c==='string'?c:(c.nome||c.condicao||'Condição'))}</span>`).join('')||'<small class="muted">Nenhuma condição registrada.</small>'}</div></section>
        <section class="v082-card v082-wide"><h3>Identidade e histórico</h3><div class="v082-story"><div><b>Aparência</b><p>${escV(val(p.aparencia,'Não definida'))}</p></div><div><b>Personalidade</b><p>${escV(val(p.personalidade,'Não definida'))}</p></div><div><b>Histórico</b><p>${escV(val(p.historico,'Não definido'))}</p></div></div></section>
      </div>`;
    m.classList.add('show');m.setAttribute('aria-hidden','false');
  }
  function open(id){
    if(typeof data==='undefined'||!Array.isArray(data.jogadores))return;
    const p=data.jogadores.find(x=>x.id===id);if(!p)return;
    render(p);
  }
  function injectButtons(){
    const host=$('#masterPlayers');if(!host)return;
    host.querySelectorAll('[data-master-view-sheet]').forEach(b=>b.remove());
    host.querySelectorAll('.master-player-card').forEach(card=>{
      const id=card.querySelector('[data-resource]')?.dataset.id;
      if(!id)return;
      const actions=document.createElement('div');actions.className='v082-sheet-action';
      actions.innerHTML=`<button class="dice-btn v082-view-sheet" data-master-view-sheet="${escV(id)}">▣ VER FICHA COMPLETA</button>`;
      card.appendChild(actions);
    });
  }
  function hook(){
    const host=$('#masterPlayers');if(!host||host.__v082)return;
    host.__v082=true;
    host.addEventListener('click',e=>{const b=e.target.closest('[data-master-view-sheet]');if(b)open(b.dataset.masterViewSheet)});
    const original=window.renderMasterBase;
    if(typeof original==='function'&&!original.__v082){
      const wrapped=function(){const r=original.apply(this,arguments);injectButtons();return r};wrapped.__v082=true;window.renderMasterBase=wrapped;
      if(typeof renderMaster==='function'){const oldRender=window.renderMaster;if(!oldRender.__v082){window.renderMaster=function(){const r=oldRender.apply(this,arguments);injectButtons();return r};window.renderMaster.__v082=true;}}
    }
    injectButtons();
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(hook,0));
  setTimeout(hook,600);
  window.MasterPlayerSheetV082={open,close,injectButtons};
})();
