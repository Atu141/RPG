/* V0.47 — Comportamento dos assassinos. IA determinística e controlável pelo Mestre. */
const KillerAI=(()=>{
  const STATES=['Oculto','Observando','Alerta','Caçando','Perseguindo','Atacando','Retirando'];
  function ensure(){if(!data)return null;data.assassinos.forEach(k=>{k.ai=k.ai||{};k.ai.estado=STATES.includes(k.ai.estado)?k.ai.estado:'Oculto';k.ai.alvoId=k.ai.alvoId||'';k.ai.ultimaAcao=k.ai.ultimaAcao||null;k.ai.patamar=Number(k.ai.patamar)||0;});return data.assassinos;}
  function setState(id,state){const k=data.assassinos.find(x=>x.id===id);if(!k||!STATES.includes(state))return;k.ai=k.ai||{};k.ai.estado=state;k.ai.ultimaAcao=Date.now();if(state==='Perseguindo')data.campanha.perseguicaoAtiva=true;logAction(`${k.nome}: estado ${state}.`);saveLocal();renderMaster();toast(`${k.nome}: ${state}`);}
  function setTarget(id,targetId){const k=data.assassinos.find(x=>x.id===id),p=data.jogadores.find(x=>x.id===targetId);if(!k||!p)return;k.ai=k.ai||{};k.ai.alvoId=p.id;logAction(`${k.nome} escolheu ${p.nome} como alvo.`);saveLocal();renderMaster();}
  function move(id,floor){const k=data.assassinos.find(x=>x.id===id);const n=Number(floor);if(!k||![1,2,3,4,6,7,8,9].includes(n))return toast('Assassinos não podem ocupar o 5º andar.');k.andar=n;saveLocal();renderMaster();toast(`${k.nome} → ${n}º andar`);}
  function step(id){const k=data.assassinos.find(x=>x.id===id);if(!k)return;const order=['Oculto','Observando','Alerta','Caçando','Perseguindo','Atacando'];const i=Math.min(order.length-1,order.indexOf(k.ai?.estado||'Oculto')+1);setState(id,order[i]);}
  return {STATES,ensure,setState,setTarget,move,step};
})();
