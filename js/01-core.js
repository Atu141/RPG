let data=null, selectedPlayer=null, diceState=null;
let horrorAudio=null;
const HORROR_EVENTS=[
  {titulo:'AS LUZES APAGAM',texto:'Por alguns segundos, tudo fica em silêncio. Então você ouve passos atrás de você.',tipo:'tensão'},
  {titulo:'UM RUÍDO NO CORREDOR',texto:'Algo pesado arrasta-se do outro lado da porta.',tipo:'tensão'},
  {titulo:'A PORTA BATE',texto:'Uma porta fecha violentamente. Você não está sozinho.',tipo:'ameaça'},
  {titulo:'VOCÊ OUVIU ISSO?',texto:'Um som distante se aproxima. Talvez seja melhor continuar andando.',tipo:'tensão'},
  {titulo:'MOVIMENTO',texto:'Uma sombra atravessa o fim do corredor.',tipo:'ameaça'},
  {titulo:'SILÊNCIO ABSOLUTO',texto:'Até o som da sua própria respiração parece desaparecer.',tipo:'medo'}
];
const PURSUIT_STAGES=['Normal','Alerta','Caça','Perseguição'];
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));


const ORIGIN_PROFILES={
  'Acadêmico':{treinadas:['Ciências','Investigação'],poder:'Saber é Poder',descricao:'Quando faz um teste usando Intelecto, pode gastar 2 PE para receber +5 nesse teste.'},
  'Agente de Saúde':{treinadas:['Intuição','Medicina'],poder:'Técnica Medicinal',descricao:'Sempre que cura um personagem, adiciona seu Intelecto ao total de PV curados.'},
  'Amnésico':{treinadas:[],poder:'Vislumbres do Passado',descricao:'Duas perícias à escolha do Mestre. Uma vez por sessão, pode testar Intelecto (DT 10) para reconhecer algo familiar; com sucesso, recebe 1d4 PE temporários e uma informação útil.',requiresMasterSkills:true},
  'Artista':{treinadas:['Artes','Enganação'],poder:'Magnum Opus',descricao:'Uma vez por missão, pode ser reconhecido por uma pessoa envolvida em uma cena de interação e recebe +5 em testes de Presença e perícias baseadas em Presença contra ela.'},
  'Atleta':{treinadas:['Acrobacia','Atletismo'],poder:'110%',descricao:'Uma vez por cena, em teste de perícia usando Força ou Agilidade (exceto Luta e Pontaria), pode gastar 2 PE para receber +5.'},
  'Chef':{treinadas:['Fortitude','Profissão'],poder:'Ingrediente Secreto',descricao:'Em interlúdios, pode cozinhar um prato especial. Quem se alimentar recebe o benefício de dois pratos, com efeitos acumulativos quando aplicável.',profissaoEspecialidade:'cozinheiro'},
  'Criminoso':{treinadas:['Crime','Furtividade'],poder:'O Crime Compensa',descricao:'Ao fim de uma missão, escolhe um item encontrado para incluir na próxima missão sem contar no limite de itens por patente.'},
  'Cultista Arrependido':{treinadas:['Ocultismo','Religião'],poder:'Traços do Outro Lado',descricao:'Possui um poder paranormal à escolha, mas começa com metade da Sanidade normal para sua classe.'},
  'Desgarrado':{treinadas:['Fortitude','Sobrevivência'],poder:'Calejado',descricao:'Recebe +1 PV para cada 5% de NEX.',bonus:{pvPor5NEX:1}},
  'Engenheiro':{treinadas:['Profissão','Tecnologia'],poder:'Ferramenta Favorita',descricao:'Um item à escolha, exceto armas, conta como uma categoria abaixo.'},
  'Executivo':{treinadas:['Diplomacia','Profissão'],poder:'Processo Otimizado',descricao:'Pode pagar 2 PE para receber +5 em testes de perícia durante testes estendidos ou ao revisar documentos.'},
  'Investigador':{treinadas:['Investigação','Percepção'],poder:'Faro para Pistas',descricao:'Uma vez por cena, ao procurar pistas, pode gastar 1 PE para receber +5 nesse teste.'},
  'Lutador':{treinadas:['Luta','Reflexos'],poder:'Mão Pesada',descricao:'Recebe +2 em rolagens de dano com ataques corpo a corpo.',bonus:{danoCorpo:2}},
  'Magnata':{treinadas:['Diplomacia','Pilotagem'],poder:'Patrocinador da Ordem',descricao:'Seu limite de crédito é sempre considerado um acima do atual.'},
  'Mercenário':{treinadas:['Iniciativa','Intimidação'],poder:'Posição de Combate',descricao:'No primeiro turno de cada cena de ação, pode gastar 2 PE para receber uma ação de movimento adicional.'},
  'Militar':{treinadas:['Pontaria','Tática'],poder:'Para Bellum',descricao:'Recebe +2 em rolagens de dano com armas de fogo.',bonus:{danoArmaFogo:2}},
  'Operário':{treinadas:['Fortitude','Profissão'],poder:'Ferramenta de Trabalho',descricao:'Escolhe uma arma simples ou tática que possa ser usada como ferramenta de sua profissão. Com ela, recebe +1 em ataque, dano e margem de ameaça.',bonus:{ferramentaTrabalho:1}},
  'Policial':{treinadas:['Percepção','Pontaria'],poder:'Patrulha',descricao:'Recebe +2 em Defesa.',bonus:{defesa:2}},
  'Religioso':{treinadas:['Religião','Vontade'],poder:'Acalentar',descricao:'Recebe +5 em testes de Religião para acalmar. Ao acalmar, o alvo recupera 1d6 + sua Presença de Sanidade.'},
  'Servidor Público':{treinadas:['Intuição','Vontade'],poder:'Espírito Cívico',descricao:'Ao fazer um teste para ajudar, pode gastar 1 PE para aumentar o bônus concedido em +2.'},
  'Teórico da Conspiração':{treinadas:['Investigação','Ocultismo'],poder:'Eu Já Sabia',descricao:'Recebe resistência a dano mental igual ao seu Intelecto.'},
  'T.I.':{treinadas:['Investigação','Tecnologia'],poder:'Motor de Busca',descricao:'A critério do Mestre, com acesso à internet, pode gastar 2 PE para substituir um teste de perícia por Tecnologia.'},
  'Trabalhador Rural':{treinadas:['Adestramento','Sobrevivência'],poder:'Desbravador',descricao:'Pode gastar 2 PE para receber +5 em Adestramento ou Sobrevivência e não sofre penalidade de deslocamento por terreno difícil.'},
  'Trambiqueiro':{treinadas:['Crime','Enganação'],poder:'Impostor',descricao:'Uma vez por cena, pode gastar 2 PE para substituir um teste de perícia qualquer por Enganação.'},
  'Universitário':{treinadas:['Atualidades','Investigação'],poder:'Dedicação',descricao:'Recebe +1 PE e +1 PE adicional a cada NEX ímpar a partir de 15%. Seu limite de PE por turno aumenta em 1.',bonus:{peMax:1,peTurno:1}},
  'Vítima':{treinadas:['Reflexos','Vontade'],poder:'Cicatrizes Psicológicas',descricao:'Recebe +1 de Sanidade para cada 5% de NEX.',bonus:{sanPor5NEX:1}}
};
const ORIGIN_NAMES=Object.keys(ORIGIN_PROFILES);
function getOriginProfile(p){ return ORIGIN_PROFILES[String(p?.origem||p?.profissao||'').trim()]||null; }
function applyOriginProfile(p){
  const profile=getOriginProfile(p); if(!profile)return;
  p.origem=Object.keys(ORIGIN_PROFILES).find(x=>x===String(p.origem||p.profissao||'').trim())||p.origem;
  p.profissao=p.origem;
  const trained=profile.treinadas||[];
  (p.pericias||[]).forEach(sk=>{ if(trained.includes(sk.nome)) sk.treinada=true; });
  p.bonusOrigem={...(profile.bonus||{})};
  const b=profile.bonus||{};
  if(b.pericias) p.bonusOrigem.pericias={...b.pericias};
  if(b.defesa) p.defesa+=b.defesa;
  if(b.peMax){p.peMax+=b.peMax;p.pe=Math.min(p.pe+b.peMax,p.peMax);}
  if(b.sanPor5NEX){const nex=parseInt(String(p.nex||'5'),10)||5;p.sanMax+=Math.floor(nex/5)*b.sanPor5NEX;p.san=Math.min(p.san+b.sanPor5NEX*Math.floor(nex/5),p.sanMax);}
}
function originSkillBonus(player,skill){ const b=getOriginProfile(player)?.bonus||{}; return Number(b.pericias?.[skill.nome]||0) + (b.intPericia && skill.atributo==='INT' ? Number(b.intPericia) : 0); }
function originAttackDamageFormula(player,attack){
  let formula=String(attack?.dano||'');
  const b=getOriginProfile(player)?.bonus||{};
  const add=(b.danoCorpo&&attack?.categoria==='corpo-a-corpo'?b.danoCorpo:0) + (b.danoArmaFogo && (attack?.subtipo==='fogo'||/pistola|fuzil|espingarda|revólver|arma de fogo/i.test(String(attack?.nome||''))) ? b.danoArmaFogo:0);
  if(add) formula += `+${add}`;
  return formula;
}

const CLASS_PROFILES={
  Combatente:{
    descricao:'Linha de frente, treinado em combate e resistência. Valores calculados pelas regras da classe no NEX atual.',
    pvBase:20,pvPorNex:4,peBase:2,pePorNex:2,sanBase:12,sanPorNex:3,defesaBonus:0,
    proficiencias:['Armas simples','Armas táticas','Proteções leves'],
    escolhaPericias:['Luta','Pontaria','Fortitude','Reflexos'],
    periciasQuantidade:player=>1+(Number(player?.atributos?.INT)||0),
    habilidadeNEX5:'Ataque Especial — ao fazer um ataque, pode gastar 2 PE para receber +5 no teste de ataque ou na rolagem de dano.',
    ataqueEspecial:{custo:2,bonus:5},
    trilhaNEX:10,poderNEX:15,
    progressao:[['5%','Ataque Especial (2 PE, +5)'],['10%','Habilidade de trilha'],['15%','Poder de combatente'],['20%','Aumento de atributo'],['25%','Ataque Especial (3 PE, +10)'],['30%','Poder de combatente'],['35%','Grau de treinamento'],['40%','Habilidade de trilha'],['45%','Poder de combatente'],['50%','Aumento de atributo, Versatilidade'],['55%','Ataque Especial (4 PE, +15)'],['60%','Poder de combatente'],['65%','Habilidade de trilha'],['70%','Grau de treinamento'],['75%','Poder de combatente'],['80%','Aumento de atributo'],['85%','Ataque Especial (5 PE, +20)'],['90%','Poder de combatente'],['95%','Aumento de atributo'],['99%','Habilidade de trilha']],
    ataques:[]
  },
  Especialista:{
    descricao:'Versátil e habilidoso, com foco em perícias, conhecimento e improvisação.',
    pvBase:16,pvPorNex:3,peBase:3,pePorNex:3,sanBase:16,sanPorNex:4,defesaBonus:0,
    proficiencias:['Armas simples','Proteções leves'],
    escolhaPericias:[],
    periciasQuantidade:player=>7+(Number(player?.atributos?.INT)||0),
    habilidadeNEX5:'Eclético — pode gastar 2 PE para receber os benefícios de ser treinado em uma perícia. Perito — escolha duas perícias treinadas (exceto Luta e Pontaria); ao testá-las, pode gastar 2 PE para somar +1d6.',
    perito:{custo:2,dado:'1d6',periciasEscolhidas:2},
    trilhaNEX:10,poderNEX:15,
    progressao:[['5%','Eclético; Perito (2 PE, +1d6)'],['10%','Habilidade de trilha'],['15%','Poder de especialista'],['20%','Aumento de atributo'],['25%','Perito (3 PE, +1d8)'],['30%','Poder de especialista'],['35%','Grau de treinamento'],['40%','Engenhosidade (veterano); Habilidade de trilha'],['45%','Poder de especialista'],['50%','Aumento de atributo; Versatilidade'],['55%','Perito (4 PE, +1d10)'],['60%','Poder de especialista'],['65%','Habilidade de trilha'],['70%','Grau de treinamento'],['75%','Engenhosidade (expert); Poder de especialista'],['80%','Aumento de atributo'],['85%','Perito (5 PE, +1d12)'],['90%','Poder de especialista'],['95%','Aumento de atributo'],['99%','Habilidade de trilha']],
    ataques:[]
  },
  Ocultista:{
    descricao:'Estudioso do paranormal, capaz de conjurar rituais e manipular os mistérios do Outro Lado.',
    pvBase:12,pvPorNex:2,peBase:4,pePorNex:4,sanBase:20,sanPorNex:5,defesaBonus:0,
    proficiencias:['Armas simples'],
    escolhaPericias:['Ocultismo','Vontade'],
    periciasQuantidade:player=>3+(Number(player?.atributos?.INT)||0),
    habilidadeNEX5:'Escolhido pelo Outro Lado — começa com três rituais de 1º círculo. Sempre que avança de NEX, aprende um ritual de qualquer círculo que possa lançar.',
    rituaisIniciais:3,rituaisPorAvanco:1,
    trilhaNEX:10,poderNEX:15,
    progressao:[['5%','Escolhido pelo Outro Lado (1º círculo)'],['10%','Habilidade de trilha'],['15%','Poder de ocultista'],['20%','Aumento de atributo'],['25%','Escolhido pelo Outro Lado (2º círculo)'],['30%','Poder de ocultista'],['35%','Grau de treinamento'],['40%','Habilidade de trilha'],['45%','Poder de ocultista'],['50%','Aumento de atributo; Versatilidade'],['55%','Escolhido pelo Outro Lado (3º círculo)'],['60%','Poder de ocultista'],['65%','Habilidade de trilha'],['70%','Grau de treinamento'],['75%','Poder de ocultista'],['80%','Aumento de atributo'],['85%','Escolhido pelo Outro Lado (4º círculo)'],['90%','Poder de ocultista'],['95%','Aumento de atributo'],['99%','Habilidade de trilha']],
    ataques:[]
  }
};
function getClassProfile(classe){return CLASS_PROFILES?.[classe]||null;}
function classNexNumber(p){return Math.max(5,Math.min(99,parseInt(String(p?.nex||'5'),10)||5));}
function classDerivedResources(p,classe){
  const profile=getClassProfile(classe); if(!profile)return null;
  const nex=classNexNumber(p), steps=Math.floor(nex/5)-1;
  const attrs=p.atributos||{}, origin=getOriginProfile(p), ob=origin?.bonus||{};
  let pvMax=profile.pvBase+steps*profile.pvPorNex+(Number(attrs.VIG)||0);
  let peMax=profile.peBase+steps*profile.pePorNex+(Number(attrs.PRE)||0);
  let sanMax=profile.sanBase+steps*profile.sanPorNex;
  let defesa=10+(Number(attrs.AGI)||0)+(Number(ob.defesa)||0);
  if(ob.pvPor5NEX)pvMax+=Math.floor(nex/5)*Number(ob.pvPor5NEX);
  if(ob.peMax)peMax+=Number(ob.peMax)+(nex>=15?Math.floor((nex-15)/10)+1:0);
  if(ob.sanPor5NEX)sanMax+=Math.floor(nex/5)*Number(ob.sanPor5NEX);
  if(origin?.poder==='Traços do Outro Lado')sanMax=Math.floor(sanMax/2);
  return {pvMax,peMax,sanMax,defesa};
}
function classTrainingSummary(p,classe){
  const profile=getClassProfile(classe); if(!profile)return {required:0,mandatory:[],perito:0};
  return {required:profile.periciasQuantidade(p),mandatory:profile.escolhaPericias||[],perito:profile.perito?.periciasEscolhidas||0};
}

const BASE_PLAYER_STATE={
  pv:16,pvMax:16,pe:10,peMax:10,san:18,sanMax:18,defesa:11,
  atributos:{FOR:1,AGI:1,INT:1,PRE:1,VIG:1},
  ataques:[
    {nome:'Soco',teste:'1d20+1',dano:'1d3+1',categoria:'corpo-a-corpo'},
    {nome:'Improvisado',teste:'1d20+1',dano:'1d4',categoria:'corpo-a-corpo'}
  ]
};
function restoreBaseSheet(p){
  const base=BASE_PLAYER_STATE;
  Object.assign(p,{pv:base.pv,pvMax:base.pvMax,pe:base.pe,peMax:base.peMax,san:base.san,sanMax:base.sanMax,defesa:base.defesa,atributos:{...base.atributos},ataques:base.ataques.map(a=>({...a}))});
  (p.pericias||[]).forEach(sk=>{sk.treinada=false;sk.grau='nao_treinada';});
  p.bonusOrigem={}; delete p.treinadasClasse; delete p.peritoPericias;
  applyOriginProfile(p);
}
const CLASS_ATTRIBUTE_BUILDS={
  Combatente:{FOR:3,AGI:2,INT:1,PRE:1,VIG:3,prioridade:'Vigor + Força, com Agilidade como terceiro foco'},
  Especialista:{FOR:1,AGI:3,INT:3,PRE:2,VIG:1,prioridade:'Agilidade + Intelecto, com Presença como terceiro foco'},
  Ocultista:{FOR:1,AGI:1,INT:3,PRE:3,VIG:2,prioridade:'Intelecto + Presença, com Vigor como terceiro foco'}
};
function getClassAttributeBuild(classe){return CLASS_ATTRIBUTE_BUILDS?.[classe]||null;}
function applyClassAttributeBuild(p,classe){
  const build=getClassAttributeBuild(classe); if(!build)return;
  p.atributos={FOR:build.FOR,AGI:build.AGI,INT:build.INT,PRE:build.PRE,VIG:build.VIG};
  p.configuracaoAtributosClasse={classe,prioridade:build.prioridade,automatico:true};
}
function applyClassProfile(p,classe){
  const profile=CLASS_PROFILES[classe]; if(!profile)return;
  restoreBaseSheet(p);
  applyClassAttributeBuild(p,classe);
  p.classe=classe;
  const derived=classDerivedResources(p,classe);
  p.pvMax=derived.pvMax;p.pv=p.pvMax;
  p.peMax=derived.peMax;p.pe=p.peMax;
  p.sanMax=derived.sanMax;p.san=p.sanMax;
  p.defesa=derived.defesa;
  p.treinadasClasse=[];
  p.peritoPericias=[];
  (p.pericias||[]).forEach(sk=>{sk.grau=sk.treinada?'treinado':'nao_treinada';});
  p.classRulesVersion=2;
  p.classFeatureNEX5=profile.habilidadeNEX5;
  p.classProficiencias=[...(profile.proficiencias||[])];
  if(classe==='Ocultista') ensureRitualState?.(p);
}
function setClassTraining(pid,names){
  const p=data.jogadores.find(x=>x.id===pid),profile=p&&getClassProfile(p.classe);if(!p||!profile)return false;
  const normalized=[...new Set((names||[]).map(x=>String(x).trim()).filter(Boolean))];
  const originTrained=new Set((getOriginProfile(p)?.treinadas||[]));
  const mandatory=profile.escolhaPericias||[];
  const required=profile.periciasQuantidade(p);
  if(p.classe==='Combatente'){
    const combatA=normalized.filter(n=>['Luta','Pontaria'].includes(n)&&!originTrained.has(n)); const combatB=normalized.filter(n=>['Fortitude','Reflexos'].includes(n)&&!originTrained.has(n));
    if(combatA.length!==1||combatB.length!==1)return toast('Combatente: escolha 1 entre Luta/Pontaria e 1 entre Fortitude/Reflexos; se a origem já der uma delas, escolha a outra.'),false;
  } else if(p.classe==='Ocultista'){
    const hasOcultismo=originTrained.has('Ocultismo')||normalized.includes('Ocultismo'); const hasVontade=originTrained.has('Vontade')||normalized.includes('Vontade');
    if(!hasOcultismo||!hasVontade)return toast('Ocultista: a ficha precisa ter Ocultismo e Vontade; se a origem já fornecer uma delas, escolha outra perícia de classe no lugar da duplicada.'),false;
  }
  const optional=normalized.filter(n=>!originTrained.has(n));
  const expected=required + (p.classe==='Combatente'?2:p.classe==='Ocultista'?2:0);
  if(optional.length!==expected)return toast(`A classe exige ${expected} perícias novas nesta ficha, sem contar duplicidades já fornecidas pela origem.`),false;
  const invalid=normalized.filter(n=>!(p.pericias||[]).some(sk=>sk.nome===n));
  if(invalid.length)return toast(`Perícia inválida: ${invalid[0]}`),false;
  (p.pericias||[]).forEach(sk=>{if(!originTrained.has(sk.nome))sk.treinada=false;});
  normalized.forEach(n=>{const sk=p.pericias.find(x=>x.nome===n);if(sk)sk.treinada=true;});
  p.treinadasClasse=normalized;p.peritoPericias=(profile.perito?normalized.filter(n=>n!=='Luta'&&n!=='Pontaria').slice(0,2):[]);
  saveLocal();renderMaster();if(selectedPlayer?.id===pid)renderSheet();toast('Perícias da classe atualizadas');return true;
}
function classeHasMandatoryChoices(classe){return ['Combatente','Ocultista'].includes(classe);}

const SKILL_CATALOG=[
  ['Acrobacia','AGI',false],['Adestramento','PRE',true],['Artes','PRE',true],['Atletismo','FOR',false],
  ['Atualidades','INT',false],['Ciências','INT',true],['Crime','AGI',true],['Diplomacia','PRE',false],
  ['Enganação','PRE',false],['Fortitude','VIG',false],['Furtividade','AGI',false],['Iniciativa','AGI',false],
  ['Intimidação','PRE',false],['Intuição','INT',false],['Investigação','INT',false],['Luta','FOR',false],
  ['Medicina','INT',false],['Ocultismo','INT',true],['Percepção','PRE',false],['Pilotagem','AGI',true],
  ['Pontaria','AGI',false],['Profissão','INT',true],['Reflexos','AGI',false],['Religião','INT',true],
  ['Sobrevivência','INT/PRE',false],['Tática','INT',true],['Tecnologia','INT',true],['Vontade','PRE',false]
];
function skillFormula(player,skill){
  if(skill.teste && skill.teste!=='AUTO') return skill.teste;
  const attrs=player.atributos||{}; const value=skill.atributo==='INT/PRE'?Math.max(Number(attrs.INT)||0,Number(attrs.PRE)||0):(Number(attrs[skill.atributo])||0);
  const grau=skill.grau||(skill.treinada?'treinado':'nao_treinada'); const treino=grau==='expert'?15:grau==='veterano'?10:skill.treinada?5:0; const bonus=treino+originSkillBonus(player,skill);
  const count=value>0?value:2; const mod=bonus?`${bonus>0?'+':''}${bonus}`:'';
  return `${count}d20${mod}${value>0?' (melhor)':' (pior)'}`;
}
function isMaster(){ return sessionStorage.getItem('master-auth')==='1'; }
function getSkillDT(){
  const dt=Number(data?.campanha?.dtPericias);
  return Number.isFinite(dt) && dt>=1 && dt<=50 ? dt : 10;
}
function setSkillDT(value){
  const dt=Math.max(1,Math.min(50,Number(value)||10));
  data.campanha.dtPericias=dt;
  logAction(`DT padrão de perícias alterada para ${dt}.`);
  saveLocal();
  renderCampaign();
  toast(`DT de perícias: ${dt}`);
}
function skillLabel(skill){ return `${skill.requerTreinamento?'* ':''}${skill.nome}`; }

async function loadData(useSaved=true){
  const response = await fetch('fichas.json?ts=' + Date.now(), {cache:'no-store'});
  if(!response.ok) throw new Error(`Não foi possível carregar fichas.json (HTTP ${response.status})`);
  const jsonData = await response.json();
  data = normalizeData(jsonData);
  ensureHorrorState();
  if(useSaved){
    const saved = localStorage.getItem('op-fichas-state');
    if(saved){
      try { data = normalizeData(JSON.parse(saved)); }
      catch(error){ console.warn('Estado local inválido; usando fichas.json.', error); localStorage.removeItem('op-fichas-state'); }
    }
  }
  renderPlayerCards();
  renderMaster();
  renderCampaign();
  renderAlerts();
  if(selectedPlayer){
    selectedPlayer = data.jogadores.find(p => p.id === selectedPlayer.id) || null;
    if(selectedPlayer) renderSheet();
  }
}
