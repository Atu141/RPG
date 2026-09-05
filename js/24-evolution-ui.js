/* V0.49 — Interface final de gestão, testes e operação. */
(function(){
  function e(v){return typeof esc==='function'?esc(v):String(v??'');}
  function renderEvolution(){
    const host=$('#campaignEvolutionPanel');if(!host||!data)return;CampaignEngine.ensure();CampaignState.ensure();IntegrityEngine.ensure();KillerAI.ensure();CombatPlus.ensure();CampaignStorage.ensure();
    const m=data.campanha.motor,s=CampaignEngine.currentScene(),v=IntegrityEngine.validate();
    const stateOptions=CampaignState.STATES.map(x=>`<option ${x===m.estado?'selected':''}>${x}</option>`).join('');
    const killers=data.assassinos.map(k=>`<div class="ev-card"><div><b>☠ ${e(k.nome)}</b><small>Andar ${k.andar} • ${e(k.ai?.estado||'Oculto')} • Alvo: ${e(data.jogadores.find(p=>p.id===k.ai?.alvoId)?.nome||'nenhum')}</small></div><div class="ev-actions"><select class="control-select" onchange="KillerAI.setState('${k.id}',this.value)">${KillerAI.STATES.map(x=>`<option ${x===(k.ai?.estado||'Oculto')?'selected':''}>${x}</option>`).join('')}</select><select class="control-select" onchange="KillerAI.setTarget('${k.id}',this.value)"><option value="">Alvo</option>${data.jogadores.map(p=>`<option value="${p.id}" ${p.id===k.ai?.alvoId?'selected':''}>${e(p.nome)}</option>`).join('')}</select></div></div>`).join('');
    const qa=CampaignQA.run().map(x=>`<div class="ev-test ${x.ok?'ok':'bad'}"><b>${x.ok?'✓':'✕'} ${e(x.name)}</b><small>${e(x.detail)}</small></div>`).join('');
    const collapsed=!!data.campanha.operacaoQualidadeMinimizada;
    host.innerHTML=`<div class="ev-head"><div class="ev-title"><span class="eyebrow">V0.42 → V0.49 • CONSOLIDAÇÃO</span><h2>Operação & Qualidade</h2><p>Camada final antes da futura preparação para multiplayer. Todas as ferramentas permanecem locais.</p></div><div class="ev-head-actions"><div class="ev-health ${v.ok?'ok':'bad'}"><b>${v.ok?'✓ SISTEMA ÍNTEGRO':'⚠ REVISAR'}</b><small>${v.issues.length} ocorrência(s)</small></div><button class="ev-collapse-btn" onclick="toggleEvolutionPanel()" aria-expanded="${!collapsed}" title="${collapsed?'Expandir':'Minimizar'} Operação & Qualidade">${collapsed?'＋':'−'} ${collapsed?'EXPANDIR':'MINIMIZAR'}</button></div></div>
    <div class="ev-content ${collapsed?'is-collapsed':''}">
    <div class="ev-toolbar"><button class="primary" onclick="CampaignStorage.save('manual');toast('Campanha salva.')">💾 SALVAR</button><button class="ghost" onclick="CampaignStorage.toggleAutosave()">AUTOSAVE: ${CampaignStorage.ensure().autosave?'ON':'OFF'}</button><button class="ghost" onclick="CampaignStorage.backup()">▣ BACKUP</button><button class="ghost" onclick="IntegrityEngine.validate();toast('Diagnóstico concluído.')">✓ DIAGNÓSTICO</button><button class="ghost" onclick="CampaignQA.simulate();toast('Simulação concluída.')">🧪 SIMULAR CENAS</button></div>
    <div class="ev-grid"><section><h3>Estado da campanha</h3><label>Estado<select class="control-select" onchange="CampaignState.setState(this.value)">${stateOptions}</select></label><p>Cena: <b>${e(s?.titulo)}</b></p><p>Andar: <b>${data.campanha.andarAtual}º</b> • Chaves: <b>${(data.campanha.chavesEncontradas||[]).length}/4</b></p></section><section><h3>Assassinos</h3>${killers}</section><section><h3>Laboratório de testes</h3>${qa}</section><section><h3>Histórico técnico</h3>${(CampaignStorage.ensure().historico||[]).slice(0,8).map(x=>`<div class="ev-log"><b>${e(x.reason)}</b><small>${new Date(x.at).toLocaleString()}</small></div>`).join('')||'<small class="muted">Sem registros.</small>'}</section></div></div>`;
  }
  window.toggleEvolutionPanel=function(){
    if(!data)return;
    data.campanha.operacaoQualidadeMinimizada=!data.campanha.operacaoQualidadeMinimizada;
    if(typeof saveData==='function') saveData();
    renderEvolution();
  };
  const oldMaster=renderMaster;renderMaster=function(){oldMaster();renderEvolution();};
  const boot=()=>{if(!data){setTimeout(boot,100);return;}if(!$('#campaignEvolutionPanel')){const d=document.createElement('div');d.id='campaignEvolutionPanel';d.className='panel campaign-evolution-panel';$('#campaignEnginePanel')?.after(d);}renderEvolution();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
