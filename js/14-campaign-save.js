/* V0.41 — Salvamento/exportação/importação de campanha. */
const CampaignSave=(()=>{
  function save(){saveLocal();toast('Campanha salva no navegador.');}
  function exportJSON(){if(!data)return;const payload=JSON.stringify(data,null,2),blob=new Blob([payload],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='hotel-espelho-campanha.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);logAction('Campanha exportada para JSON.');}
  function importJSON(file){if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const incoming=JSON.parse(reader.result);if(!incoming.campanha||!Array.isArray(incoming.jogadores))throw new Error('Formato inválido');data=normalizeData(incoming);saveLocal();selectedPlayer=null;renderMaster();renderPlayerHome();toast('Campanha importada com sucesso.');}catch(e){console.error(e);toast('Não foi possível importar a campanha.');}};reader.readAsText(file);}
  function reset(){if(!confirm('Criar uma nova campanha apagará o progresso salvo neste navegador. Continuar?'))return;localStorage.removeItem('op-fichas-state');location.reload();}
  return {save,exportJSON,importJSON,reset};
})();
