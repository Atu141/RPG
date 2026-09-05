/* V0.52 — Hotel como mapa de jogo: portas, pontos de interesse e posição dos personagens. */
const HotelGame=(()=>{
  function ensure(){
    if(!data)return null;const c=data.campanha;
    c.hotelGame=c.hotelGame&&typeof c.hotelGame==='object'?c.hotelGame:{};const h=c.hotelGame;
    h.versao=52;h.portas=h.portas&&typeof h.portas==='object'?h.portas:{};h.pois=Array.isArray(h.pois)?h.pois:[];h.posicoes=h.posicoes&&typeof h.posicoes==='object'?h.posicoes:{};
    data.jogadores.forEach((p,i)=>{if(!h.posicoes[p.id])h.posicoes[p.id]={andar:5,sala:`Quarto 5${String(i+1).padStart(2,'0')}`};});
    return h;
  }
  function roomId(floor,room){return `${Number(floor)}::${String(room).trim().toLowerCase()}`;}
  function setDoor(floor,room,status){const h=ensure();const id=roomId(floor,room);h.portas[id]=['aberta','fechada','trancada','selada'].includes(status)?status:'fechada';saveLocal();renderMaster();toast(`Porta: ${status}.`);}
  function setPosition(pid,floor,room){const p=data.jogadores.find(x=>x.id===pid);const n=Number(floor);if(!p||n<1||n>9)return toast('Andar inválido.');const h=ensure();h.posicoes[pid]={andar:n,sala:String(room||'Corredor Central')};data.campanha.andarAtual=n;saveLocal();renderMaster();if(selectedPlayer?.id===pid)renderSheet();toast(`${p.nome} → ${n}º / ${room||'Corredor Central'}`);}
  function addPOI(nome,andar,sala,tipo='Ponto de Interesse',descricao=''){const h=ensure();const n=String(nome||'').trim();if(!n)return null;const poi={id:'poi-'+Date.now(),nome:n,andar:Number(andar)||5,sala:String(sala||'Corredor Central'),tipo,descricao,ativo:true};h.pois.push(poi);saveLocal();renderMaster();return poi;}
  function togglePOI(id){const x=ensure().pois.find(p=>p.id===id);if(!x)return;x.ativo=!x.ativo;saveLocal();renderMaster();}
  function render(){const host=$('#hotelGamePanel');if(!host||!data)return;const h=ensure();const positions=data.jogadores.map(p=>{const x=h.posicoes[p.id]||{andar:5,sala:'—'};return `<div class="hg-row"><b>${esc(p.nome)}</b><span>${x.andar}º • ${esc(x.sala)}</span><select class="control-select" onchange="HotelGame.setPosition('${p.id}',this.value,this.options[this.selectedIndex].dataset.room||'Corredor Central')"><option value="${x.andar}" data-room="${esc(x.sala)}">${x.andar}º • ${esc(x.sala)}</option>${[1,2,3,4,5,6,7,8,9].filter(n=>n!==Number(x.andar)).map(n=>`<option value="${n}" data-room="Corredor Central">${n}º • Corredor Central</option>`).join('')}</select></div>`}).join('');const pois=h.pois.map(p=>`<div class="hg-poi ${p.ativo?'':'off'}"><div><b>◈ ${esc(p.nome)}</b><small>${p.andar}º • ${esc(p.sala)} • ${esc(p.tipo)}</small></div><button class="dice-btn secondary" onclick="HotelGame.togglePOI('${p.id}')">${p.ativo?'ATIVO':'INATIVO'}</button></div>`).join('')||'<small class="muted">Nenhum ponto de interesse personalizado.</small>';host.innerHTML=`<div class="hg-head"><div><span class="eyebrow">V0.52 • MAPA DE JOGO</span><h2>Hotel — Estado Operacional</h2><p>Posições, portas e pontos de interesse são controlados pelo Mestre.</p></div></div><div class="hg-grid"><div><h3>Posições</h3>${positions}</div><div><h3>Pontos de interesse</h3>${pois}</div></div>`;}
  return {ensure,roomId,setDoor,setPosition,addPOI,togglePOI,render};
})();
