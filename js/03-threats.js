/* Hotel Espelho RPG — módulo consolidado. */

/* --- 43-fix-exploration-v0703.js --- */
/* V0.70.3 — Compatibilidade da exploração do mapa.
   Restaura a API de salas investigadas usada pelo mapa e pelos módulos legados.
*/
(function(){
  function ensureStore(){
    if(!window.data) return {};
    data.campanha = data.campanha || {};
    data.campanha.salasInvestigadas = (data.campanha.salasInvestigadas && typeof data.campanha.salasInvestigadas === 'object') ? data.campanha.salasInvestigadas : {};
    return data.campanha.salasInvestigadas;
  }
  function normalizeRoom(room){ return String(room ?? '').trim(); }
  function getInvestigatedRooms(floorId){
    const store=ensureStore();
    const key=String(Number(floorId));
    const value=store[key];
    if(Array.isArray(value)) return value.map(normalizeRoom);
    if(value && typeof value==='object') return Object.keys(value).filter(k=>value[k]).map(normalizeRoom);
    return [];
  }
  function toggleRoomInvestigated(floorId,room){
    const store=ensureStore();
    const key=String(Number(floorId));
    const name=normalizeRoom(room);
    if(!name)return;
    const list=getInvestigatedRooms(floorId);
    const idx=list.indexOf(name);
    if(idx>=0) list.splice(idx,1); else list.push(name);
    store[key]=list;
    if(typeof saveLocal==='function') saveLocal();
    if(typeof logAction==='function') logAction(`Sala ${name} do ${Number(floorId)}º andar ${idx>=0?'marcada como não investigada':'marcada como investigada'}.`);
  }
  window.getInvestigatedRooms=getInvestigatedRooms;
  window.toggleRoomInvestigated=toggleRoomInvestigated;
})();


/* --- 45-threats-v0708.js --- */
(function(){
  async function load(){try{const r=await fetch('data/ameacas.json?ts='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const j=await r.json();window.THREAT_CATALOG=Array.isArray(j)?j:(Array.isArray(j.ameacas)?j.ameacas:[]);return true}catch(e){console.error('Erro ao carregar ameacas.json',e);window.THREAT_CATALOG=[];return false}}
  const catalog=id=>(window.THREAT_CATALOG||[]).find(x=>x.id===id||x.catalogId===id)||null;
  function instance(base,extra={}){if(!base)throw Error('Ameaça não encontrada');const id=`threat_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;const x=JSON.parse(JSON.stringify(base));Object.assign(x,extra,{id,catalogId:base.catalogId||base.id,instancia:true});x.pv=Number(extra.pv??base.pvBase??base.pv??0);x.pvMax=Number(extra.pvMax??base.pvBase??base.pvMax??base.pv??0);x.condicoes=Array.isArray(extra.condicoes)?extra.condicoes:[];return x}
  function add(id,extra={}){const x=instance(catalog(id),extra);data.monstros=data.monstros||[];data.monstros.push(x);GameEngineV070?.log?.('THREAT_ADDED',{nome:x.nome,resumo:`Ameaça adicionada: ${x.nome}`});GameEngineV070?.persist?.();return x}
  function get(id){return data?.monstros?.find(x=>x.id===id)||data?.assassinos?.find(x=>x.id===id)||null}
  function damage(id,n){const x=get(id);if(!x)throw Error('Ameaça não encontrada');const amount=Math.max(0,Number(n)||0);x.pv=Math.max(0,Number(x.pv||0)-amount);GameEngineV070?.log?.('THREAT_DAMAGE',{alvo:x.nome,valor:amount,resumo:`${x.nome} sofreu ${amount} de dano`});GameEngineV070?.persist?.();return x}
  function heal(id,n){const x=get(id);if(!x)throw Error('Ameaça não encontrada');x.pv=Math.min(Number(x.pvMax||0),Number(x.pv||0)+Math.max(0,Number(n)||0));GameEngineV070?.log?.('THREAT_HEAL',{alvo:x.nome,valor:n,resumo:`${x.nome} recuperou PV`});GameEngineV070?.persist?.();return x}
  window.ThreatEngine={load,catalog,instance,add,get,damage,heal};
  const boot=async()=>{if(!data)return setTimeout(boot,100);await load();if(window.ThreatUI?.render)ThreatUI.render()};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();


/* --- 46-threats-ui-v0708.js --- */
/* V0.70.10 — Gerenciador de ameaças integrado ao painel Monstros.
   O painel principal é renderizado por 04-master-campaign.js para evitar
   cartões dinâmicos aninhados no grid principal do Mestre. */
(function(){
  function render(){
    if(typeof renderMaster==='function' && window.data) renderMaster();
  }
  function addSelected(){
    const id=document.getElementById('masterMonsterCatalogSelect')?.value;
    if(!id)return toast('Selecione uma ameaça.');
    try{ThreatEngine.add(id);toast('Monstro adicionado à sessão.');render();}catch(e){toast(e.message||'Erro ao adicionar monstro.');}
  }
  window.ThreatUI={render,addSelected,filterCatalog:()=>{}};
})();

