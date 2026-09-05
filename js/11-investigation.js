/* V0.41 — Investigação: pistas, evidências, DTs e descobertas públicas/secretas. */
const InvestigationEngine=(()=>{
  const CATEGORIES=['Visual','Sonora','Documento','Vestígio','Item','Pista','Testemunho'];
  function ensure(){
    if(!data)return null;const c=data.campanha;
    c.investigacao=c.investigacao||{};const i=c.investigacao;
    i.versao=i.versao||1;i.pistas=Array.isArray(i.pistas)?i.pistas:[];i.descobertas=Array.isArray(i.descobertas)?i.descobertas:[];i.catalogo=Array.isArray(i.catalogo)?i.catalogo:[];
    if(!i.catalogo.length){
      i.catalogo=[
        {id:'pista-cozinha',nome:'Mancha de sangue impossível',categoria:'Vestígio',andar:4,sala:'Cozinha Industrial',pericia:'Investigação',dt:15,mestre:'O sangue não pertence a nenhum humano conhecido. Há marcas de arrasto.',jogador:'Uma mancha escura termina abruptamente, como se alguém tivesse desaparecido dali.',assassino:'k1',chave:2},
        {id:'pista-espelho',nome:'Reflexo atrasado',categoria:'Visual',andar:5,sala:'Sala de Jogos',pericia:'Percepção',dt:12,mestre:'O reflexo de quem olha para o espelho reage um instante depois.',jogador:'Seu reflexo parece não acompanhar exatamente seus movimentos.',assassino:'k3',chave:3},
        {id:'pista-seguranca',nome:'Registro de acesso impossível',categoria:'Documento',andar:2,sala:'Sala de Segurança',pericia:'Investigação',dt:14,mestre:'O registro mostra entradas de pessoas que não existem nos registros de hóspedes.',jogador:'Há nomes e horários que não parecem pertencer a nenhum hóspede.',assassino:'k3',chave:4},
        {id:'pista-gerador',nome:'Circuito fora do padrão',categoria:'Visual',andar:8,sala:'Gerador Principal',pericia:'Tecnologia',dt:15,mestre:'O gerador está funcionando de maneira impossível e parece responder a ruídos.',jogador:'Os cabos vibram mesmo sem carga aparente.',assassino:'k4',chave:null},
        {id:'pista-corredor',nome:'Pegadas que terminam na parede',categoria:'Vestígio',andar:3,sala:'Corredor Central',pericia:'Sobrevivência',dt:13,mestre:'As pegadas não retornam e nenhuma passagem é encontrada.',jogador:'Pegadas úmidas seguem pelo corredor e simplesmente desaparecem.',assassino:'k2',chave:1}
      ];
    }
    return i;
  }
  function all(){const i=ensure();return i?.catalogo||[];}
  function reveal(id,source='Mestre'){const i=ensure(),p=i.catalogo.find(x=>x.id===id);if(!p)return;const old=i.pistas.find(x=>x.id===id);if(old)return toast('Pista já revelada.');i.pistas.unshift({...p,reveladaEm:Date.now(),fonte:source});i.descobertas.unshift({id:'d-'+Date.now(),pistaId:id,player:source,at:Date.now()});if(data.campanha.pistasReveladas&&!data.campanha.pistasReveladas.includes(id))data.campanha.pistasReveladas.push(id);if(p.chave&&data.campanha.v041){}logAction(`Pista descoberta: ${p.nome}.`);saveLocal();renderMaster();if(selectedPlayer)renderSheet();toast(`Pista descoberta: ${p.nome}`);}
  function hide(id){const i=ensure();i.pistas=i.pistas.filter(x=>x.id!==id);data.campanha.pistasReveladas=(data.campanha.pistasReveladas||[]).filter(x=>x!==id);saveLocal();renderMaster();if(selectedPlayer)renderSheet();}
  function inspectRoom(floor,room){const p=all().filter(x=>Number(x.andar)===Number(floor)&&(!x.sala||String(x.sala).toLowerCase()===String(room).toLowerCase()));if(!p.length)return toast('Nenhuma pista cadastrada para este ambiente.');p.forEach(x=>{if(!ensure().pistas.some(r=>r.id===x.id))reveal(x.id,'Exploração');});}
  function refresh(){renderMaster();if(selectedPlayer)renderSheet();}
  return {CATEGORIES,ensure,all,reveal,hide,inspectRoom,refresh};
})();
