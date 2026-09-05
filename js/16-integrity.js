/* V0.42 — Integridade e migrações. Centraliza a preparação do estado e diagnóstico. */
const IntegrityEngine=(()=>{
  const VERSION='0.61';
  function ensure(){
    if(!data)return null;
    data.sistema=data.sistema||{}; data.sistema.versao=VERSION;
    data.sistema.migracoes=Array.isArray(data.sistema.migracoes)?data.sistema.migracoes:[];
    data.sistema.ultimaValidacao=data.sistema.ultimaValidacao||null;
    data.campanha.meta=data.campanha.meta||{id:'hotel-espelho',nome:'O Hotel Espelho',sistema:'Ordem Paranormal RPG'};
    return data.sistema;
  }
  function validate(){
    const issues=[]; ensure();
    if(!data.campanha)issues.push('Campanha ausente');
    if(!Array.isArray(data.jogadores))issues.push('Lista de jogadores inválida');
    if(!Array.isArray(data.assassinos))issues.push('Lista de assassinos inválida');
    if(data.jogadores.some(p=>!p.id||!p.nome))issues.push('Existe personagem sem ID ou nome');
    const ids=data.jogadores.map(p=>p.id); if(new Set(ids).size!==ids.length)issues.push('IDs de personagens duplicados');
    if(Number(data.campanha.andarAtual)===5 && data.assassinos.some(k=>Number(k.andar)===5))issues.push('Assassino encontrado no 5º andar');
    data.sistema.ultimaValidacao={at:Date.now(),ok:!issues.length,issues}; saveLocal(); return {ok:!issues.length,issues};
  }
  function backup(){const payload=JSON.stringify(data);localStorage.setItem('op-fichas-backup-'+Date.now(),payload);toast('Backup local criado.');}
  function listBackups(){return Object.keys(localStorage).filter(k=>k.startsWith('op-fichas-backup-')).sort().reverse();}
  function restore(key){if(!key)return;try{const raw=localStorage.getItem(key);const incoming=JSON.parse(raw);data=normalizeData(incoming);saveLocal();renderMaster();renderPlayerHome();toast('Backup restaurado.');}catch(e){console.error(e);toast('Backup inválido.');}}
  return {VERSION,ensure,validate,backup,listBackups,restore};
})();
