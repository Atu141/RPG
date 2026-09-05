/* V0.41 — Combate estruturado: iniciativa, rodadas, ações, dano e registro. */
const CombatEngine=(()=>{
  function ensure(){if(!data)return null;const c=data.campanha.combateEngine=data.campanha.combateEngine||{};c.ativo=Boolean(c.ativo);c.rodada=Math.max(1,Number(c.rodada)||1);c.turnoId=c.turnoId||null;c.iniciativa=Array.isArray(c.iniciativa)?c.iniciativa:[];c.log=Array.isArray(c.log)?c.log:[];c.participantes=Array.isArray(c.participantes)?c.participantes:[];return c;}
  function start(){const c=ensure();if(c.ativo)return toast('Já existe um combate ativo.');c.ativo=true;c.rodada=1;c.iniciativa=data.jogadores.map(p=>({id:p.id,tipo:'jogador',nome:p.nome,resultado:null}));data.assassinos.filter(k=>k.ativo).forEach(k=>c.iniciativa.push({id:k.id,tipo:'assassino',nome:k.nome,resultado:null}));c.participantes=c.iniciativa.map(x=>x.id);c.turnoId=c.iniciativa[0]?.id||null;pushLog('Combate iniciado.');syncLegacy();saveLocal();refresh();toast('Combate iniciado');}
  function end(){const c=ensure();c.ativo=false;c.turnoId=null;c.iniciativa=[];c.participantes=[];pushLog('Combate encerrado.');syncLegacy();saveLocal();refresh();toast('Combate encerrado');}
  function next(){const c=ensure();if(!c.ativo||!c.iniciativa.length)return;let i=c.iniciativa.findIndex(x=>x.id===c.turnoId);if(i<0)i=0;i++;if(i>=c.iniciativa.length){i=0;c.rodada++;}c.turnoId=c.iniciativa[i].id;pushLog(`Turno: ${name(c.turnoId)}.`);syncLegacy();saveLocal();refresh();}
  function setInitiative(id,value){const c=ensure(),x=c.iniciativa.find(y=>y.id===id);if(!x)return;x.resultado=Math.max(0,Number(value)||0);c.iniciativa.sort((a,b)=>Number(b.resultado||0)-Number(a.resultado||0));c.turnoId=c.iniciativa[0]?.id||null;saveLocal();refresh();}
  function attack(attackerId,targetId,roll,damage){const c=ensure();if(!c.ativo)return toast('Inicie o combate.');const attacker=find(attackerId),target=find(targetId);if(!attacker||!target)return toast('Atacante ou alvo inválido.');const r=Number(roll)||0,d=Number(damage)||0;if(target.pv!==undefined)target.pv=Math.max(0,target.pv-d);pushLog(`${attacker.nome} atacou ${target.nome}: teste ${r}, dano ${d}.`);saveLocal();refresh();}
  function find(id){return data.jogadores.find(p=>p.id===id)||data.assassinos.find(k=>k.id===id)||data.monstros.find(m=>m.id===id);}
  function name(id){return find(id)?.nome||id||'—';}
  function pushLog(text){const c=ensure();c.log.unshift({text,at:Date.now()});c.log=c.log.slice(0,60);}
  function syncLegacy(){const c=ensure();if(data.campanha.v030){const l=data.campanha.v030.combate;l.ativo=c.ativo;l.turno=c.turnoId;l.iniciativa=c.iniciativa.filter(x=>x.tipo==='jogador').map(x=>x.id);}}
  function refresh(){if(typeof renderMaster==='function')renderMaster();if(selectedPlayer&&typeof renderSheet==='function')renderSheet();}
  return {ensure,start,end,next,setInitiative,attack,find,name,pushLog,refresh};
})();
