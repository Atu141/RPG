/* V0.65 — Perfil do Mestre: resumo operacional da sessão. */
const MasterProfile=(()=>{
  function render(){
    const host=document.getElementById('masterProfilePanel');
    if(!host||!data)return;
    const c=data.campanha||{};
    const players=Array.isArray(data.jogadores)?data.jogadores:[];
    const active=players.filter(p=>p && (p.nome||p.name)).length;
    const classReady=c.escolhaClasseLiberada?'Liberada':'Bloqueada';
    const pursuit=c.perseguicao||'Normal';
    const floor=Number(c.andarAtual??5);
    const objective=c.objetivoAtual||'Nenhum objetivo definido.';
    host.innerHTML=`
      <div class="master-profile">
        <div class="master-profile-identity">
          <div class="master-profile-avatar">♟</div>
          <div>
            <p class="eyebrow">PERFIL DO MESTRE</p>
            <h2>Mestre da Sessão</h2>
            <p class="muted">Controle da campanha e suporte ao jogo presencial</p>
          </div>
          <span class="master-profile-status"><i></i> Online</span>
        </div>
        <div>
          <div class="master-profile-grid">
            <div class="master-profile-stat"><span>Campanha</span><strong>${esc(c.nome||'O Hotel Espelho')}</strong><small>${esc(c.tipo||'One-Shot')}</small></div>
            <div class="master-profile-stat"><span>Sistema</span><strong>${esc(c.sistema||'Ordem Paranormal RPG')}</strong><small>NEX ${esc(c.nex||'5%')}</small></div>
            <div class="master-profile-stat"><span>Jogadores</span><strong>${active}</strong><small>fichas cadastradas</small></div>
            <div class="master-profile-stat"><span>Local atual</span><strong>${floor===0?'Térreo':floor+'º Andar'}</strong><small>${esc(c.local||'Hotel Espelho')}</small></div>
            <div class="master-profile-stat"><span>Perseguição</span><strong>${esc(pursuit)}</strong><small>estado atual</small></div>
            <div class="master-profile-stat"><span>Classes</span><strong>${classReady}</strong><small>seleção dos jogadores</small></div>
          </div>
        </div>
      </div>
      <div class="master-profile-section"><div class="panel-title"><div><span class="icon">🎯</span><div><h3>Objetivo atual</h3><p>${esc(objective)}</p></div></div></div></div>`;
  }
  function focus(id){const el=document.getElementById(id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});}
  function esc(v){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  return {render};
})();
(function(){
  const boot=()=>{if(typeof data==='undefined'||!data){setTimeout(boot,100);return;}MasterProfile.render();};
  const old=window.renderMaster;
  if(typeof old==='function'){
    window.renderMaster=function(){old();MasterProfile.render();};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
