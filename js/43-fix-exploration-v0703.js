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
