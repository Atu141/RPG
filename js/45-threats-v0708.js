(function(){
  async function load(){try{const r=await fetch('ameacas.json?ts='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const j=await r.json();window.THREAT_CATALOG=Array.isArray(j)?j:(Array.isArray(j.ameacas)?j.ameacas:[]);return true}catch(e){console.error('Erro ao carregar ameacas.json',e);window.THREAT_CATALOG=[];return false}}
  const catalog=id=>(window.THREAT_CATALOG||[]).find(x=>x.id===id||x.catalogId===id)||null;
  function instance(base,extra={}){if(!base)throw Error('Ameaça não encontrada');const id=`threat_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;const x=JSON.parse(JSON.stringify(base));Object.assign(x,extra,{id,catalogId:base.catalogId||base.id,instancia:true});x.pv=Number(extra.pv??base.pvBase??base.pv??0);x.pvMax=Number(extra.pvMax??base.pvBase??base.pvMax??base.pv??0);x.condicoes=Array.isArray(extra.condicoes)?extra.condicoes:[];return x}
  function add(id,extra={}){const x=instance(catalog(id),extra);data.monstros=data.monstros||[];data.monstros.push(x);GameEngineV070?.log?.('THREAT_ADDED',{nome:x.nome,resumo:`Ameaça adicionada: ${x.nome}`});GameEngineV070?.persist?.();return x}
  function get(id){return data?.monstros?.find(x=>x.id===id)||data?.assassinos?.find(x=>x.id===id)||null}
  function damage(id,n){const x=get(id);if(!x)throw Error('Ameaça não encontrada');const amount=Math.max(0,Number(n)||0);x.pv=Math.max(0,Number(x.pv||0)-amount);GameEngineV070?.log?.('THREAT_DAMAGE',{alvo:x.nome,valor:amount,resumo:`${x.nome} sofreu ${amount} de dano`});GameEngineV070?.persist?.();return x}
  function heal(id,n){const x=get(id);if(!x)throw Error('Ameaça não encontrada');x.pv=Math.min(Number(x.pvMax||0),Number(x.pv||0)+Math.max(0,Number(n)||0));GameEngineV070?.log?.('THREAT_HEAL',{alvo:x.nome,valor:n,resumo:`${x.nome} recuperou PV`});GameEngineV070?.persist?.();return x}
  window.ThreatEngine={load,catalog,instance,add,get,damage,heal};
  const boot=async()=>{if(!data)return setTimeout(boot,100);await load();if(window.ThreatUI?.render)ThreatUI.render()};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
