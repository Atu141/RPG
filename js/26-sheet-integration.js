/* V0.51 — Ficha em jogo: bônus efetivos, condições, histórico de rolagens e integração com combate. */
const SheetIntegration=(()=>{
  function ensure(p){
    if(!p)return null;
    p.historicoRolagens=Array.isArray(p.historicoRolagens)?p.historicoRolagens:[];
    p.condicoes=Array.isArray(p.condicoes)?p.condicoes:[];
    return p;
  }
  function effectiveSkill(player,skill){
    const p=ensure(player);if(!p||!skill)return 0;
    const attr=String(skill.atributo||'INT');let base=0;
    if(attr==='INT/PRE')base=Math.max(Number(p.atributos?.INT)||0,Number(p.atributos?.PRE)||0);else base=Number(p.atributos?.[attr])||0;
    const grau=skill.grau|| (skill.treinada?'treinado':'nao_treinada'); const treino=grau==='expert'?15:grau==='veterano'?10:skill.treinada?5:0;
    return base+treino+(typeof originSkillBonus==='function'?originSkillBonus(p,skill):0);
  }
  function rollSkill(pid,index,dt){
    const p=data.jogadores.find(x=>x.id===pid),skill=p?.pericias?.[index];if(!p||!skill)return;
    const total=rollSimple('1d20',effectiveSkill(p,skill));const target=Math.max(1,Math.min(50,Number(dt)||getSkillDT()||10));const success=total>=target;
    const entry={at:Date.now(),tipo:'pericia',pericia:skill.nome,resultado:total,dt:target,sucesso:success};ensure(p).historicoRolagens.unshift(entry);ensure(p).historicoRolagens=p.historicoRolagens.slice(0,30);logAction(`${p.nome}: ${skill.nome} → ${total} vs DT ${target} — ${success?'sucesso':'falha'}.`);saveLocal();renderSheet();toast(`${skill.nome}: ${success?'SUCESSO':'FALHA'} (${total} vs ${target})`);return entry;
  }
  function rollSimple(formula,bonus=0){const m=String(formula).match(/^(\d+)d(\d+)$/i);if(!m)return Number(bonus)||0;let total=0;for(let i=0;i<Number(m[1]);i++)total+=Math.floor(Math.random()*Number(m[2]))+1;return total+(Number(bonus)||0);}
  function setCondition(pid,name,active=true){const p=data.jogadores.find(x=>x.id===pid);if(!p)return;const list=ensure(p).condicoes;if(active&&!list.includes(name))list.push(name);if(!active)p.condicoes=list.filter(x=>x!==name);saveLocal();renderMaster();if(selectedPlayer?.id===pid)renderSheet();}
  function addRoll(player,entry){ensure(player).historicoRolagens.unshift(entry);player.historicoRolagens=player.historicoRolagens.slice(0,30);}
  function render(){const host=$('#sheetIntegrationPanel');if(!host||!selectedPlayer)return;const p=ensure(selectedPlayer),recent=p.historicoRolagens.slice(0,6);const conditions=p.condicoes.length?p.condicoes.map(x=>`<span class="chips-pill">${esc(x)}</span>`).join(''):'<small class="muted">Nenhuma condição ativa.</small>';host.innerHTML=`<div class="si-head"><div><span class="eyebrow">V0.51 • INTEGRAÇÃO</span><h2>Estado em Jogo</h2><p>Bônus da origem e estados atuais aplicados sem permitir alteração indevida da ficha.</p></div></div><div class="si-grid"><div><h3>Condições</h3><div class="si-chips">${conditions}</div></div><div><h3>Rolagens recentes</h3>${recent.map(r=>`<div class="si-roll"><b>${esc(r.pericia||r.tipo||'Rolagem')}</b><span>${r.resultado} vs DT ${r.dt||'—'} • ${r.sucesso?'✓':'✕'}</span></div>`).join('')||'<small class="muted">Nenhuma rolagem registrada.</small>'}</div></div>`;}
  return {ensure,effectiveSkill,rollSkill,setCondition,addRoll,render};
})();
