/* Hotel Espelho RPG — módulo consolidado. */

/* --- 01-core.js --- */
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
  Combatente:{FOR:3,AGI:2,INT:1,PRE:1,VIG:2,prioridade:'Força + Vigor, com Agilidade como apoio'},
  Especialista:{FOR:1,AGI:3,INT:3,PRE:1,VIG:1,prioridade:'Agilidade + Intelecto, foco em perícias e investigação'},
  Ocultista:{FOR:1,AGI:1,INT:3,PRE:3,VIG:1,prioridade:'Intelecto + Presença, foco em rituais e testes'}
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
  // Perícias usam 1d20 + atributo + grau de treinamento.
  // Versões antigas geravam fórmulas como 2d20 (melhor), que o rolador não aceita.
  if(skill?.teste && skill.teste!=='AUTO' && /^\d+d\d+(?:[+-]\d+)?$/i.test(String(skill.teste).replace(/\s/g,''))) return String(skill.teste).replace(/\s/g,'');
  const attrs=player?.atributos||{};
  const value=skill?.atributo==='INT/PRE'
    ? Math.max(Number(attrs.INT)||0,Number(attrs.PRE)||0)
    : (Number(attrs[skill?.atributo])||0);
  const grau=skill?.grau||(skill?.treinada?'treinado':'nao_treinada');
  const treino=grau==='expert'?15:grau==='veterano'?10:grau==='treinado'||skill?.treinada?5:0;
  const bonus=Number(value)+Number(treino)+Number(originSkillBonus(player,skill)||0);
  return `1d20${bonus>=0?'+':''}${bonus}`;
}
function resolveAttackTestFormula(player,attack){
  const raw=String(attack?.teste||'').trim();
  if(/^\d+d\d+(?:[+-]\d+)?$/i.test(raw.replace(/\s/g,''))) return raw.replace(/\s/g,'');
  const skill=(player?.pericias||[]).find(s=>String(s?.nome||'').trim().toLowerCase()===raw.toLowerCase());
  if(skill) return skillFormula(player,skill);
  // Compatibilidade com armas cadastradas como Luta/Pontaria ou nomes de perícia.
  const normalized=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const fallback=(player?.pericias||[]).find(s=>String(s?.nome||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()===normalized);
  return fallback?skillFormula(player,fallback):'';
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
  const response = await fetch('../data/fichas.json?ts=' + Date.now(), {cache:'no-store'});
  if(!response.ok) throw new Error(`Não foi possível carregar fichas.json (HTTP ${response.status})`);
  const jsonData = await response.json();
  data = normalizeData(jsonData);
  ensureHorrorState();
  if(useSaved){
    const saved = localStorage.getItem('op-fichas-state');
    if(saved){
      try {
        const savedData = normalizeData(JSON.parse(saved));
        const campaignKillers = Array.isArray(jsonData.assassinos) ? jsonData.assassinos : [];
        const savedKillers = Array.isArray(savedData.assassinos) ? savedData.assassinos : [];
        const byId = new Map(savedKillers.map(k=>[String(k.id),k]));
        // Os 4 assassinos são registros fixos da campanha. Se um estado antigo
        // não os tiver, recupera os registros originais sem apagar alterações existentes.
        campaignKillers.forEach(k=>{ if(!byId.has(String(k.id))) byId.set(String(k.id), JSON.parse(JSON.stringify(k))); });
        savedData.assassinos=[...byId.values()];
        data = savedData;
        localStorage.setItem('op-fichas-state',JSON.stringify(data));
      }
      catch(error){ console.warn('Estado local inválido; usando fichas.json.', error); localStorage.removeItem('op-fichas-state'); }
    }
  }
  if(typeof loadGameCatalogs==='function') await loadGameCatalogs();
  renderPlayerCards();
  renderMaster();
  renderCampaign();
  renderAlerts();
  if(selectedPlayer){
    selectedPlayer = data.jogadores.find(p => p.id === selectedPlayer.id) || null;
    if(selectedPlayer) renderSheet();
  }
}


/* --- 02-players.js --- */
function show(id){document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active')); $('#'+id).classList.add('active'); document.querySelectorAll('.role-btn').forEach(b=>b.classList.toggle('active',b.dataset.screen===id|| (id==='playerSheet'&&b.dataset.screen==='playerHome')))}

function renderPlayerCards(){ $('#playerCards').innerHTML=data.jogadores.map(p=>`<button class="player-card" data-id="${p.id}"><div class="avatar">${esc(p.nome.split(' ').map(x=>x[0]).slice(0,2).join(''))}</div><div><b>${esc(p.nome)}</b><small>${esc(p.classe||'Classe não definida')} • NEX ${esc(p.nex)}</small></div><span>→</span></button>`).join(''); document.querySelectorAll('.player-card').forEach(b=>b.onclick=()=>openSheet(b.dataset.id)); }

function openCreateSheetModal(){
  const modal=$('#createSheetModal'); if(!modal)return;
  $('#newCharacterName').value=''; if($('#newCharacterOrigin')) $('#newCharacterOrigin').value=''; $('#createSheetError').textContent='';
  modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
  setTimeout(()=>$('#newCharacterName')?.focus(),50);
}
function closeCreateSheetModal(){
  const modal=$('#createSheetModal'); if(!modal)return;
  modal.classList.remove('show'); modal.setAttribute('aria-hidden','true');
}

function openCharacterCustomization(pid){
  const player=data?.jogadores?.find(x=>x.id===pid); if(!player)return;
  $('#customCharacterPlayer').value=pid;
  $('#customCharacterName').value=player.nome||'';
  $('#customCharacterAge').value=player.idade||'';
  $('#customCharacterProfession').value=player.origem||player.profissao||'';
  $('#customCharacterAppearance').value=player.aparencia||'';
  $('#customCharacterPersonality').value=player.personalidade||'';
  $('#customCharacterHistory').value=player.historico||'';
  $('#customCharacterError').textContent='';
  const modal=$('#customCharacterModal'); modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
  setTimeout(()=>$('#customCharacterName')?.focus(),50);
}
function closeCharacterCustomization(){
  const modal=$('#customCharacterModal'); if(!modal)return;
  modal.classList.remove('show'); modal.setAttribute('aria-hidden','true');
}
function saveCharacterCustomization(){
  const pid=$('#customCharacterPlayer')?.value;
  const player=data?.jogadores?.find(x=>x.id===pid); if(!player)return;
  const name=String($('#customCharacterName')?.value||'').trim();
  const age=String($('#customCharacterAge')?.value||'').trim();
  const profession=player.origem||player.profissao||'';
  const appearance=String($('#customCharacterAppearance')?.value||'').trim();
  const personality=String($('#customCharacterPersonality')?.value||'').trim();
  const history=String($('#customCharacterHistory')?.value||'').trim();
  const error=$('#customCharacterError');
  if(!ORIGIN_PROFILES[profession]){if(error)error.textContent='A Profissão / Origem desta ficha não é válida. Selecione uma origem oficial na criação do personagem.'; return;}
  if(name.length<2){error.textContent='Informe um nome com pelo menos 2 caracteres.'; return;}
  if(name.length>50){error.textContent='O nome deve ter no máximo 50 caracteres.'; return;}
  const duplicate=data.jogadores.some(x=>x.id!==pid&&String(x.nome||'').trim().toLowerCase()===name.toLowerCase());
  if(duplicate){error.textContent='Já existe outra ficha com esse nome. Escolha outro nome.'; return;}
  player.nome=name; player.idade=age; player.profissao=profession; player.origem=profession; player.aparencia=appearance; player.personalidade=personality; player.historico=history;
  logAction(`${player.nome}: identidade e histórico personalizados pelo jogador.`);
  saveLocal(); renderPlayerCards(); renderMaster();
  selectedPlayer=player; renderSheet(); closeCharacterCustomization();
  toast('Personalização salva');
}
function buildNewPlayer(name, origem){
  const now=Date.now();
  const baseId='p_'+now.toString(36)+'_'+Math.random().toString(36).slice(2,7);
  const pericias=SKILL_CATALOG.map(([nome,atributo,requerTreinamento])=>({
    nome,atributo,
    atributoLabel:atributo==='INT/PRE'?'Intelecto ou Presença':({AGI:'Agilidade',FOR:'Força',INT:'Intelecto',PRE:'Presença',VIG:'Vigor'}[atributo]||atributo),
    requerTreinamento,treinada:false,teste:'AUTO'
  }));
  return {
    id:baseId,nome:name.trim(),nex:'5%',classe:null,origem:origem,profissao:origem,
    pv:16,pvMax:16,pe:10,peMax:10,san:18,sanMax:18,defesa:11,
    atributos:{FOR:1,AGI:1,INT:1,PRE:1,VIG:1},
    ataques:[{nome:'Soco',teste:'1d20+1',dano:'1d3+1',categoria:'corpo-a-corpo'},{nome:'Improvisado',teste:'1d20+1',dano:'1d4',categoria:'corpo-a-corpo'}],
    pericias,
    itens:[{nome:'Lanterna',descricao:'Iluminação portátil.',quantidade:1,tipo:'equipamento',equipado:false,teste:'',dano:'',bonus:''}]
  };
}
function createPlayerSheet(){
  const input=$('#newCharacterName'), originInput=$('#newCharacterOrigin'), error=$('#createSheetError');
  const name=String(input?.value||'').trim();
  const origem=String(originInput?.value||'').trim();
  if(!ORIGIN_PROFILES[origem]){if(error)error.textContent='Selecione uma profissão/origem válida do sistema.'; originInput?.focus(); return;}
  if(name.length<2){if(error)error.textContent='Informe um nome com pelo menos 2 caracteres.'; input?.focus(); return;}
  if(data.jogadores.some(p=>String(p.nome||'').trim().toLowerCase()===name.toLowerCase())){if(error)error.textContent='Já existe uma ficha com esse nome. Escolha outro nome.'; input?.focus(); return;}
  const player=buildNewPlayer(name,origem);
  applyOriginProfile(player);
  data.jogadores.push(player);
  if(typeof V030!=='undefined'&&V030.ensure)V030.ensure();
  logAction(`${player.nome}: nova ficha criada pelo jogador com regras iniciais da campanha.`);
  saveLocal(); renderPlayerCards(); renderMaster(); renderCampaign();
  // Em uma mesa multiplayer, a ficha criada no dispositivo do jogador
  // precisa ser enviada ao Mestre. O saveLocal sozinho não basta porque
  // o jogador ainda não possui MP.ownerId neste momento.
  if(window.MultiplayerV071?.publishCreatedPlayer && window.MultiplayerV071.status?.().role==='player'){
    window.MultiplayerV071.publishCreatedPlayer(player);
  }
  closeCreateSheetModal();
  selectedPlayer=player; show('playerSheet'); renderSheet();
  toast(`Ficha criada: ${player.nome}`);
}

function openSheet(id){selectedPlayer=data.jogadores.find(p=>p.id===id); show('playerSheet'); renderSheet();}
function classChoiceOpen(pid){
  const c=data?.campanha||{};
  if(Number(c.andarAtual)!==5) return false;
  if(pid!=null && Array.isArray(c.escolhaClasseLiberadaPara)){
    return c.escolhaClasseLiberadaPara.map(String).includes(String(pid));
  }
  return Boolean(c.escolhaClasseLiberada);
}
function chooseClass(pid, classe){
  const allowed=Object.keys(CLASS_PROFILES);
  const p=data.jogadores.find(x=>x.id===pid);
  if(!p || !classChoiceOpen(pid) || p.classe || !allowed.includes(classe)) return;
  applyClassProfile(p,classe);
  p.classeEscolhidaEm='5º andar — O Despertar';
  logAction(`${p.nome} descobriu e escolheu a classe ${classe}.`);
  saveLocal(); renderPlayerCards(); renderMaster(); renderSheet();
  toast(`Classe descoberta: ${classe}`);
  setTimeout(()=>configureClassSkills(pid),120);
}
function resetClassChoice(pid){
  const p=data.jogadores.find(x=>x.id===pid); if(!p)return;
  restoreBaseSheet(p); p.classe=null; delete p.classeEscolhidaEm;
  logAction(`${p.nome}: descoberta de classe reiniciada pelo Mestre.`); saveLocal(); renderMaster(); renderPlayerCards();
  if(selectedPlayer?.id===pid){selectedPlayer=p;renderSheet();} toast('Ficha retornou ao estado inicial');
}
function setClassChoiceRelease(value){
  data.campanha.escolhaClasseLiberada=Boolean(value);
  logAction(`Escolha de classe ${data.campanha.escolhaClasseLiberada?'liberada':'bloqueada'}.`);
  saveLocal(); renderMaster(); if(selectedPlayer) renderSheet();
  toast(data.campanha.escolhaClasseLiberada?'Escolha de classe liberada':'Escolha de classe bloqueada');
}
function renderSheetBase(){
  const p=selectedPlayer;
  const pericias=p.pericias||[];
  const className=p.classe||'Classe não definida';
  const classProfile=p.classe?CLASS_PROFILES[p.classe]:null;
  const classDerived=p.classe?classDerivedResources(p,p.classe):null;
  const classSummary=p.classe?classTrainingSummary(p,p.classe):null;
  const classTrained=(p.treinadasClasse||[]).join(', ')||'Configurar pelo Mestre';
  const classEffectBlock=classProfile?`<div class="panel class-effect-panel"><p class="eyebrow">CLASSE • REGRAS V1.3</p><h2>${esc(p.classe)}</h2><p class="muted">${esc(classProfile.descricao)}</p><div class="class-effect-grid"><span>PV Máx. <b>${classDerived.pvMax}</b></span><span>PE Máx. <b>${classDerived.peMax}</b></span><span>SAN Máx. <b>${classDerived.sanMax}</b></span><span>Defesa <b>${classDerived.defesa}</b></span></div><div class="class-attribute-build"><b>Distribuição automática de atributos</b><p>FOR <strong>${p.atributos.FOR}</strong> · AGI <strong>${p.atributos.AGI}</strong> · INT <strong>${p.atributos.INT}</strong> · PRE <strong>${p.atributos.PRE}</strong> · VIG <strong>${p.atributos.VIG}</strong></p><small>${esc(getClassAttributeBuild(p.classe)?.prioridade||'Configuração recomendada para a classe')}</small></div><div class="class-rules-detail"><b>Habilidade no NEX ${esc(p.nex)}</b><p>${esc(classProfile.habilidadeNEX5)}</p><b>Perícias da classe</b><p>${esc(classProfile.escolhaPericias?.length?classProfile.escolhaPericias.join(' / ')+' + '+classSummary.required+' à escolha':' '+classSummary.required+' à escolha')}</p><small>Selecionadas: ${esc(classTrained)}</small><b>Proficiências</b><p>${esc((classProfile.proficiencias||[]).join(', '))}</p><details><summary>Progressão da classe</summary><div class="class-progression">${(classProfile.progressao||[]).map(x=>`<span><b>${esc(x[0])}</b>${esc(x[1])}</span>`).join('')}</div></details></div></div>`:'';
  const originProfile=getOriginProfile(p); const originBlock=originProfile?`<div class="panel origin-effect-panel"><p class="eyebrow">PROFISSÃO / ORIGEM</p><h2>${esc(p.origem||p.profissao)}</h2><p class="muted">Perícias treinadas: ${esc(originProfile.treinadas.length?originProfile.treinadas.join(' e '):'definidas pelo Mestre')}</p><div class="origin-power"><b>${esc(originProfile.poder)}</b><span>${esc(originProfile.descricao)}</span></div>${originProfile.bonus?.defesa?`<small>Defesa: +${originProfile.bonus.defesa}</small>`:''}${originProfile.bonus?.sanPor5NEX?`<small>Sanidade: +${Math.floor((parseInt(String(p.nex||'5'),10)||5)/5)*originProfile.bonus.sanPor5NEX} no NEX atual</small>`:''}</div>`:'';
  const classChoiceBlock=(!p.classe && classChoiceOpen(p.id)) ? `<div class="panel class-choice-panel"><p class="eyebrow">MOMENTO DE DECISÃO</p><h2>Escolha sua classe</h2><p class="muted">Vocês acordaram sem qualquer contato anterior com o paranormal. Depois de investigar o 5º andar, chegou o momento de decidir como seu personagem enfrentará o que está acontecendo.</p><div class="class-choice-grid"><button class="class-choice" data-class-choice="${p.id}" data-class="Combatente"><b>Combatente</b><small>Foco em combate, resistência e confronto físico.</small></button><button class="class-choice" data-class-choice="${p.id}" data-class="Especialista"><b>Especialista</b><small>Foco em investigação, perícias e soluções práticas.</small></button><button class="class-choice" data-class-choice="${p.id}" data-class="Ocultista"><b>Ocultista</b><small>Foco em compreender e lidar com fenômenos inexplicáveis.</small></button></div></div>` : '';
  const storyNotice=`<div class="panel story-notice"><p class="eyebrow">O DESPERTAR</p><b>${p.classe?'Você ainda se lembra de como tudo começou: vocês acordaram no 5º andar, sem experiência anterior com o paranormal.':'Vocês acordaram no 5º andar, sem qualquer contato anterior com o paranormal. Investiguem o local antes de decidir quem vocês serão nesta situação.'}</b></div>`;
  const identityBlock=`<div class="panel identity-panel"><div class="identity-head"><div><p class="eyebrow">IDENTIDADE</p><h2>Quem é ${esc(p.nome)}?</h2><p class="muted">Personalize apenas a história e a identidade. Os valores mecânicos da campanha permanecem protegidos.</p></div><button class="ghost" data-customize-character="${p.id}">✎ EDITAR PERSONAGEM</button></div><div class="identity-grid"><div><span>IDADE</span><b>${esc(p.idade||'Não definida')}</b></div><div><span>PROFISSÃO / ORIGEM</span><b>${esc(p.origem||p.profissao||'Não definida')}</b></div><div class="identity-wide"><span>APARÊNCIA</span><p>${esc(p.aparencia||'Não definida')}</p></div><div><span>PERSONALIDADE</span><p>${esc(p.personalidade||'Não definida')}</p></div><div><span>HISTÓRICO</span><p>${esc(p.historico||'Não definido')}</p></div></div></div>`;
  $('#sheetContent').innerHTML=`<div class="player-header player-header-mobile"><div><p class="eyebrow">FICHA DO AGENTE</p><h1>${esc(p.nome)}</h1><p class="muted">${esc(className)} • NEX ${esc(p.nex)} • ${esc(data.campanha.nome)}</p></div><div class="player-badge">AGENTE</div></div><nav class="player-mobile-nav" aria-label="Atalhos da ficha"><button type="button" data-player-jump="summary">Resumo</button><button type="button" data-player-jump="combat">Combate</button><button type="button" data-player-jump="inventory">Itens</button><button type="button" data-player-jump="skills">Perícias</button><button type="button" data-player-jump="rituals">Rituais</button></nav><div class="player-secondary-info">${storyNotice}${identityBlock}${originBlock}${classChoiceBlock}${classEffectBlock}</div><div class="player-layout">
  <div id="playerSummary" class="panel character-panel"><div class="character-top"><div class="avatar">${esc(p.nome.split(' ').map(x=>x[0]).slice(0,2).join(''))}</div><div><h2>${esc(p.nome)}</h2><p>${esc(className)}</p></div><div class="nex"><span>NEX</span><b>${esc(p.nex)}</b></div></div><div class="stats"><div class="stat"><span>PV</span><strong>${p.pv}</strong><small> / ${p.pvMax}</small></div><div class="stat"><span>PE</span><strong>${p.pe}</strong><small> / ${p.peMax}</small></div><div class="stat"><span>SAN</span><strong>${p.san}</strong><small> / ${p.sanMax}</small></div></div><div class="bar"><i style="width:${Math.max(0,p.pv/p.pvMax*100)}%"></i></div><div class="attributes">${Object.entries(p.atributos).map(([k,v])=>`<button class="attribute-card" data-attribute-player="${p.id}" data-attribute="${k}"><span>${k}</span><b>${v}</b><small>TESTAR</small></button>`).join('')}</div></div>
  <div id="playerInventory" class="panel items-panel"><div class="panel-title"><div><span class="icon">▤</span><div><h2>Inventário</h2><p>Itens da ficha</p></div></div></div>${p.itens.map((i,idx)=>`<div class="item"><span class="item-icon">${i.tipo==='arma'?'⚔':'▣'}</span><div><b>${esc(i.nome)} ${i.equipado?'<small class="equipped-tag">EQUIPADO</small>':''}</b><small>${itemLabel(i)}${i.tipo==='arma'&&i.teste?` • Teste ${esc(i.teste)}`:''}${i.tipo==='arma'&&i.dano?` • Dano ${esc(i.dano)}`:''}${i.bonus?` • Bônus ${esc(i.bonus)}`:''}</small><small>${esc(i.descricao)}</small></div><strong>${i.quantidade}</strong></div>`).join('')}</div>
  <div id="playerCombat" class="panel combat-panel"><div class="panel-title"><div><span class="icon">⚔</span><div><h2>Combate corpo a corpo</h2><p>Ataques sem armas</p></div></div></div><div class="combat-row"><span>Defesa</span><b>${p.defesa}</b></div>${unarmedAttacks(p).map(({a,i})=>`<div class="attack"><div><b>${esc(a.nome)}</b><small>Teste ${esc(resolveAttackTestFormula(p,a)||a.teste||'—')} • Dano ${esc(originAttackDamageFormula(p,a))}</small></div><div><button class="dice-btn" data-roll="attack" data-player="${p.id}" data-index="${i}">ATACAR</button><button class="dice-btn secondary" data-roll="damage" data-player="${p.id}" data-index="${i}">DANO</button></div></div>`).join('') || '<small class="empty-inventory">Nenhum ataque corpo a corpo sem arma cadastrado.</small>'}</div>
  <div id="playerWeapons" class="panel weapon-panel"><div class="panel-title"><div><span class="icon">⚔</span><div><h2>Armas equipadas</h2><p>Armas e outras formas de combate equipadas/cadastradas</p></div></div></div>${otherCombatAttacks(p).map(({a,i})=>`<div class="attack"><div><b>${esc(a.nome)}</b><small>Teste ${esc(resolveAttackTestFormula(p,a)||a.teste||'—')} • Dano ${esc(originAttackDamageFormula(p,a))}</small></div><div><button class="dice-btn" data-roll="attack" data-player="${p.id}" data-index="${i}">ATACAR</button><button class="dice-btn secondary" data-roll="damage" data-player="${p.id}" data-index="${i}">DANO</button></div></div>`).join('')}${p.itens.filter(i=>itemCombatReady(i)).map((i)=>{const realIndex=p.itens.indexOf(i);return `<div class="attack"><div><b>${esc(i.nome)}</b><small>Teste ${esc(itemFormula(i,'attack',p))} • Dano ${esc(itemFormula(i,'damage',p))}${i.bonus?` • Bônus ${esc(i.bonus)}`:''}</small></div><div><button class="dice-btn" data-item-roll="attack" data-player="${p.id}" data-item-index="${realIndex}">ATACAR</button><button class="dice-btn secondary" data-item-roll="damage" data-player="${p.id}" data-item-index="${realIndex}">DANO</button></div></div>`}).join('') || (otherCombatAttacks(p).length?'':'<small class="empty-inventory">Nenhuma arma ou outro ataque cadastrado/equipado.</small>')}</div>
  ${ritualPlayerBlock(p)}
  <div id="playerSkills" class="panel abilities-panel"><div class="panel-title"><div><span class="icon">✧</span><div><h2>Perícias</h2><p>Testes disponíveis</p></div></div></div><div class="skill-list">${pericias.map((x,i)=>`<div class="skill-row"><div><b>${esc(skillLabel(x))}</b><small>${esc(x.atributoLabel||x.atributo||'Perícia')} • ${x.treinada?'Treinada (+5)':'Não treinada'} • Teste ${esc(skillFormula(p,x))}</small></div>${x.requerTreinamento&&!x.treinada?'<button class="dice-btn secondary" disabled title="Esta perícia exige treinamento.">NÃO TREINADA</button>':'<button class="dice-btn secondary" data-skill-player="'+p.id+'" data-skill-index="'+i+'">TESTAR</button>'}</div>`).join('')}</div></div>
  <div id="playerCampaign" class="panel campaign-player"><div class="panel-title"><div><span class="icon">◈</span><div><h2>Campanha</h2><p>Informações públicas da sessão</p></div></div></div><div class="campaign-info"><div><span>ANDAR</span><b>${data.campanha.andarAtual}º</b></div><div><span>OBJETIVO</span><b>${esc(data.campanha.objetivoAtual)}</b></div><div><span>PERSEGUIÇÃO</span><b>${esc(data.campanha.perseguicao)}</b></div><div><span>DT DE PERÍCIAS</span><b>${getSkillDT()}</b></div><div><span>CHAVES ENCONTRADAS</span><b>${data.campanha.chavesEncontradas.filter(x=>Number(x)>=1&&Number(x)<=4).length}/4</b></div></div></div>
  </div>`;
  document.querySelectorAll('.dice-btn[data-roll]').forEach(b=>b.onclick=()=>openDice(b.dataset.roll,b.dataset.player,+b.dataset.index));
  document.querySelectorAll('[data-skill-player]').forEach(b=>b.onclick=()=>openSkillDice(b.dataset.skillPlayer,+b.dataset.skillIndex));
  document.querySelectorAll('[data-attribute-player]').forEach(b=>b.onclick=()=>openAttributeDice(b.dataset.attributePlayer,b.dataset.attribute));
  document.querySelectorAll('[data-class-choice]').forEach(b=>b.onclick=()=>{
    const handler=window.chooseClass;
    if(typeof handler==='function') handler(b.dataset.classChoice,b.dataset.class);
  });
  document.querySelectorAll('[data-item-roll]').forEach(b=>b.onclick=()=>openItemDice(b.dataset.player,+b.dataset.itemIndex,b.dataset.itemRoll));
  document.querySelectorAll('[data-customize-character]').forEach(b=>b.onclick=()=>openCharacterCustomization(b.dataset.customizeCharacter));
  document.querySelectorAll('[data-player-jump]').forEach(b=>b.onclick=()=>{
    const key=b.dataset.playerJump;
    const target={summary:'#playerSummary',combat:'#playerCombat',inventory:'#playerInventory',skills:'#playerSkills',rituals:'.rituals-player-panel'}[key];
    const el=target?document.querySelector(target):null;
    if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
  });
}


/* --- 03-inventory.js --- */
function normalizeItem(item){
  if(typeof item==='string') return {nome:item,descricao:'',quantidade:1,tipo:'equipamento',equipado:false,teste:'',dano:'',bonus:''};
  const tipo=String(item?.tipo||'equipamento').toLowerCase()==='arma'?'arma':'equipamento';
  return {
    nome:String(item?.nome||'Item'),
    descricao:String(item?.descricao||''),
    quantidade:Math.max(1,Number(item?.quantidade)||1),
    tipo,
    equipado:Boolean(item?.equipado),
    teste:String(item?.teste||''),
    dano:String(item?.dano||''),
    bonus:String(item?.bonus||'')
  };
}
function itemLabel(item){ return item.tipo==='arma' ? 'Arma' : 'Equipamento'; }
function normalizeWeapon(weapon){
  return {
    id:String(weapon?.id||''), nome:String(weapon?.nome||'Arma'), descricao:String(weapon?.grupo||''), quantidade:1, tipo:'arma', equipado:false,
    teste:String(weapon?.teste||'Pontaria'), dano:String(weapon?.dano||''), bonus:'', categoria:String(weapon?.categoria||''), grupo:String(weapon?.grupo||''),
    critico:String(weapon?.critico||''), alcance:String(weapon?.alcance||''), tipoDano:String(weapon?.tipoDano||''), espacos:Number(weapon?.espacos)||0, proficiencia:String(weapon?.proficiencia||'')
  };
}
function getWeaponCatalog(){ return Array.isArray(window.WEAPON_CATALOG)?window.WEAPON_CATALOG:[]; }
function getMasterItemCatalog(){
  return {items:getItemCatalog(),weapons:getWeaponCatalog()};
}

function itemCombatReady(item){ return item?.tipo==='arma' && Boolean(item?.equipado) && Boolean(item?.teste) && Boolean(item?.dano); }
function isUnarmedAttack(attack){
  const category=String(attack?.categoria||attack?.tipo||'').toLowerCase();
  if(['corpo-a-corpo','corpo','desarmado','unarmed','melee-unarmed'].includes(category)) return true;
  if(['arma','weapon','fogo','corte','perfuração','perfuracao'].includes(category)) return false;
  const name=String(attack?.nome||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  return ['soco','chute','cabecada','cotovelada','joelhada'].some(x=>name===x || name.startsWith(x+' '));
}
function unarmedAttacks(player){ return (player?.ataques||[]).map((a,i)=>({a,i})).filter(x=>isUnarmedAttack(x.a)); }
function otherCombatAttacks(player){ return (player?.ataques||[]).map((a,i)=>({a,i})).filter(x=>!isUnarmedAttack(x.a)); }
function itemFormula(item,type,player){
  const raw=String(type==='attack'?item?.teste:item?.dano||'').trim();
  if(!raw) return '';
  if(type==='attack') return resolveAttackTestFormula(player,item) || raw;
  // Catálogo pode trazer dano alternativo, como 1d4/1d6. Para o rolador,
  // usa a primeira expressão cadastrada até que o usuário escolha uma variante.
  const base=raw.split('/')[0].replace(/\s/g,'');
  const bonus=Number(String(item?.bonus||'').replace(',','.'));
  if(!Number.isFinite(bonus) || bonus===0) return base;
  const m=base.match(/^([0-9]+)d([0-9]+)([+-][0-9]+)?$/i);
  if(!m) return base;
  const current=Number(m[3]||0)+bonus;
  return `${m[1]}d${m[2]}${current>=0?'+':''}${current}`;
}
function openItemDice(pid,index,type){
  const player=data.jogadores.find(x=>x.id===pid); const item=player?.itens?.[index];
  if(!item || item.tipo!=='arma') return toast('Arma não encontrada');
  const formula=itemFormula(item,type,player);
  if(!formula) return toast(type==='attack'?'Esta arma não possui teste cadastrado.':'Esta arma não possui dano cadastrado.');
  diceState={type:type==='attack'?'item-attack':'item-damage',formula,title:`${item.nome} — ${type==='attack'?'Teste de ataque':'Dano'}`};
  $('#diceTitle').textContent=diceState.title;
  $('#diceFormula').textContent=`${formula}${item.bonus?` • Bônus ${item.bonus}`:''}`;
  $('#diceResult').textContent='—'; $('#diceBreakdown').textContent=''; $('#diceOutcome').textContent=''; $('#diceOutcome').className='dice-outcome';
  $('#diceDTWrap').style.display='none'; $('#rollAgain').style.display='block'; $('#diceModal').classList.add('show'); roll();
}
function getItemCatalog(){
  const catalog=Array.isArray(data.itensDisponiveis)?data.itensDisponiveis:[];
  const map=new Map();
  catalog.forEach(i=>{const x=normalizeItem(i); map.set(x.nome.toLowerCase(),x);});
  (data.jogadores||[]).forEach(p=>(p.itens||[]).forEach(i=>{const x=normalizeItem(i); if(!map.has(x.nome.toLowerCase())) map.set(x.nome.toLowerCase(),{...x,quantidade:1});}));
  data.itensDisponiveis=[...map.values()];
  return data.itensDisponiveis;
}
function addPlayerItem(pid, catalogType, catalogIndex, quantity){
  const p=data.jogadores.find(x=>x.id===pid); if(!p)return;
  const type=String(catalogType||'item'); const idx=Number(catalogIndex);
  const source=type==='weapon'?getWeaponCatalog()[idx]:getItemCatalog()[idx];
  if(!source)return;
  const base=type==='weapon'?normalizeWeapon(source):normalizeItem(source);
  const qty=Math.max(1,Number(quantity)||1); p.itens=Array.isArray(p.itens)?p.itens:[];
  const existing=p.itens.find(i=>String(i.nome).toLowerCase()===base.nome.toLowerCase());
  if(existing) existing.quantidade=(Number(existing.quantidade)||0)+qty;
  else p.itens.push(normalizeItem({...base,quantidade:qty,equipado:false}));
  logAction(`${p.nome}: ${qty}x ${base.nome} adicionado ao inventário${type==='weapon'?' (arma)':''}.`); saveLocal(); window.MultiplayerV071?.syncPlayer?.(pid); renderMaster();
  if(selectedPlayer?.id===pid){selectedPlayer=p;renderSheet();} toast(`${qty}x ${base.nome} adicionado`);
}
function openReadyItemCatalog(pid){
  const player=data.jogadores.find(x=>x.id===pid); if(!player)return;
  const modal=$('#readyItemModal'); if(!modal)return;
  $('#readyItemModalPlayer').value=pid;
  $('#readyItemModalPlayerName').textContent=player.nome;
  $('#readyItemSearch').value='';
  $('#readyItemCategory').value='all';
  renderReadyItemCatalog();
  modal.classList.add('show');
  setTimeout(()=>$('#readyItemSearch')?.focus(),50);
}
function closeReadyItemCatalog(){ $('#readyItemModal')?.classList.remove('show'); }
function renderReadyItemCatalog(){
  const host=$('#readyItemList'); if(!host)return;
  const catalog=getMasterItemCatalog();
  const search=String($('#readyItemSearch')?.value||'').trim().toLowerCase();
  const category=String($('#readyItemCategory')?.value||'all');
  const rows=[];
  if(category==='all'||category==='item'){
    catalog.items.forEach((item,index)=>{
      const x=normalizeItem(item);
      const hay=`${x.nome} ${x.descricao} ${x.tipo}`.toLowerCase();
      if(search&&!hay.includes(search))return;
      rows.push(`<article class="ready-item-card">
        <div class="ready-item-icon">🎒</div>
        <div class="ready-item-info">
          <b>${esc(x.nome)}</b>
          <span>Equipamento • itens.json</span>
          <small>${esc(x.descricao||'Sem descrição')}</small>
        </div>
        <div class="ready-item-add">
          <input class="control-input ready-item-qty" type="number" min="1" max="999" value="1" aria-label="Quantidade de ${esc(x.nome)}">
          <button type="button" class="dice-btn" data-ready-add="item:${index}">ADICIONAR</button>
        </div>
      </article>`);
    });
  }
  if(category==='all'||category==='weapon'){
    catalog.weapons.forEach((weapon,index)=>{
      const w=normalizeWeapon(weapon);
      const hay=`${w.nome} ${w.categoria} ${w.grupo} ${w.proficiencia} ${w.dano}`.toLowerCase();
      if(search&&!hay.includes(search))return;
      rows.push(`<article class="ready-item-card">
        <div class="ready-item-icon">⚔️</div>
        <div class="ready-item-info">
          <b>${esc(w.nome)}</b>
          <span>Arma • armas.json</span>
          <small>Dano ${esc(w.dano||'—')} • Crítico ${esc(w.critico||'—')} • Alcance ${esc(w.alcance||'—')}</small>
          <small>${esc(w.categoria||'')} ${w.proficiencia?`• ${esc(w.proficiencia)}`:''}</small>
        </div>
        <div class="ready-item-add">
          <input class="control-input ready-item-qty" type="number" min="1" max="999" value="1" aria-label="Quantidade de ${esc(w.nome)}">
          <button type="button" class="dice-btn" data-ready-add="weapon:${index}">ADICIONAR</button>
        </div>
      </article>`);
    });
  }
  host.innerHTML=rows.join('')||'<p class="muted ready-item-empty">Nenhum item encontrado no catálogo.</p>';
  host.querySelectorAll('[data-ready-add]').forEach(button=>{
    button.onclick=()=>{
      const pid=$('#readyItemModalPlayer')?.value;
      const [type,index]=String(button.dataset.readyAdd||'').split(':');
      const qty=button.closest('.ready-item-card')?.querySelector('.ready-item-qty')?.value||1;
      if(!pid||!type||index==='')return;
      addPlayerItem(pid,type,index,qty);
      closeReadyItemCatalog();
    };
  });
}
function createAndAddPlayerItem(pid){
  const player=data.jogadores.find(x=>x.id===pid); if(!player)return;
  $('#itemModalPlayer').value=pid;
  $('#itemModalPlayerName').textContent=player.nome;
  $('#newItemName').value=''; $('#newItemDescription').value=''; $('#newItemQuantity').value=1; $('#newItemType').value='equipamento'; $('#newItemEquipped').checked=false; $('#newItemTest').value=''; $('#newItemDamage').value=''; $('#newItemBonus').value=''; toggleItemWeaponFields();
  $('#itemModal').classList.add('show');
  setTimeout(()=>$('#newItemName').focus(),50);
}
function toggleItemWeaponFields(){
  const type=$('#newItemType')?.value;
  const wrap=$('#weaponFields');
  if(wrap) wrap.style.display=type==='arma'?'block':'none';
  if(type!=='arma'){
    if($('#newItemEquipped')) $('#newItemEquipped').checked=false;
    if($('#newItemTest')) $('#newItemTest').value='';
    if($('#newItemDamage')) $('#newItemDamage').value='';
    if($('#newItemBonus')) $('#newItemBonus').value='';
  }
}
function closeItemModal(){ $('#itemModal')?.classList.remove('show'); }
function saveNewItem(){
  const pid=$('#itemModalPlayer').value;
  const name=String($('#newItemName').value||'').trim();
  if(!name){ toast('Informe o nome do item'); $('#newItemName').focus(); return; }
  const descricao=String($('#newItemDescription').value||'').trim();
  const qty=Math.max(1,Number($('#newItemQuantity').value)||1);
  const catalog=getItemCatalog();
  const tipo=$('#newItemType').value==='arma'?'arma':'equipamento';
  const equipado=$('#newItemEquipped').checked;
  const teste=String($('#newItemTest').value||'').trim();
  const dano=String($('#newItemDamage').value||'').trim();
  const bonus=String($('#newItemBonus').value||'').trim();
  if(tipo==='arma' && !dano){ toast('Informe o dado de dano da arma'); $('#newItemDamage').focus(); return; }
  if(tipo==='arma' && !teste){ toast('Informe o teste da arma'); $('#newItemTest').focus(); return; }
  if(tipo==='arma' && equipado===false) { /* permitido: o mestre pode entregar a arma sem equipá-la */ }
  const newData={nome:name,descricao,quantidade:1,tipo,equipado,teste,dano,bonus};
  let base=catalog.find(i=>i.nome.toLowerCase()===name.toLowerCase());
  if(!base){ base={...newData,equipado:false}; data.itensDisponiveis.push(base); }
  else Object.assign(base,{...newData,equipado:false});
  const player=data.jogadores.find(x=>x.id===pid); if(!player)return;
  player.itens=Array.isArray(player.itens)?player.itens:[];
  const existing=player.itens.find(i=>String(i.nome).toLowerCase()===name.toLowerCase());
  if(existing) { existing.quantidade=(Number(existing.quantidade)||0)+qty; Object.assign(existing,{descricao:base.descricao,tipo:base.tipo,teste:base.teste,dano:base.dano,bonus:base.bonus}); }
  else player.itens.push(normalizeItem({...base,quantidade:qty,equipado}));
  logAction(`${player.nome}: novo item ${qty}x ${base.nome} criado/adicionado.`);
  saveLocal(); window.MultiplayerV071?.syncPlayer?.(pid); closeItemModal(); renderMaster();
  if(selectedPlayer?.id===pid){selectedPlayer=player;renderSheet();}
  toast(`Item criado: ${base.nome}`);
}
function togglePlayerItemEquipped(pid,itemIndex){
  const p=data.jogadores.find(x=>x.id===pid); const item=p?.itens?.[Number(itemIndex)];
  if(!item)return;
  item.equipado=!Boolean(item.equipado);
  logAction(`${p.nome}: ${item.nome} ${item.equipado?'equipado':'desequipado'}.`);
  saveLocal(); window.MultiplayerV071?.syncPlayer?.(pid); renderMaster();
  if(selectedPlayer?.id===pid){selectedPlayer=p;renderSheet();}
  toast(`${item.nome} ${item.equipado?'equipado':'desequipado'}`);
}
function removePlayerItem(pid,itemIndex,quantity){
  const p=data.jogadores.find(x=>x.id===pid); const item=p?.itens?.[Number(itemIndex)]; if(!item)return;
  const qty=Math.max(1,Number(quantity)||1); item.quantidade=(Number(item.quantidade)||0)-qty;
  if(item.quantidade<=0)p.itens.splice(Number(itemIndex),1);
  logAction(`${p.nome}: ${qty}x ${item.nome} removido do inventário.`); saveLocal(); window.MultiplayerV071?.syncPlayer?.(pid); renderMaster();
  if(selectedPlayer?.id===pid){selectedPlayer=p;renderSheet();} toast(`${qty}x ${item.nome} removido`);
}
function renderInventoryMaster(p){
  const items=(p.itens||[]).map((i,idx)=>`<div class="master-item-row"><div><b>${esc(i.nome)}</b><small>${itemLabel(i)}${i.equipado?' • Equipado':' • Não equipado'}${i.tipo==='arma'&&i.teste?` • Teste ${esc(i.teste)}`:''}${i.tipo==='arma'&&i.dano?` • Dano ${esc(i.dano)}`:''}${i.tipo==='arma'&&i.critico?` • Crítico ${esc(i.critico)}`:''}${i.tipo==='arma'&&i.alcance?` • Alcance ${esc(i.alcance)}`:''}${i.bonus?` • Bônus ${esc(i.bonus)}`:''}</small><em>${esc(i.descricao||'Sem descrição')}</em></div><strong>x${i.quantidade}</strong><button class="dice-btn ${i.equipado?'secondary':''}" data-toggle-equip="${p.id}" data-item-index="${idx}">${i.equipado?'DESEQUIPAR':'EQUIPAR'}</button><button class="dice-btn secondary" data-remove-item="${p.id}" data-item-index="${idx}">REMOVER</button></div>`).join('') || '<small class="empty-inventory">Inventário vazio.</small>';
  return `<details class="master-inventory">
    <summary>INVENTÁRIO / ITENS / ARMAS</summary>
    <div class="master-inventory-list">${items}</div>
    <div class="inventory-add-menu">
      <div class="inventory-add-card ready">
        <div class="inventory-add-card-icon">📦</div>
        <div class="inventory-add-card-copy"><b>VER LISTA DE ITENS PRONTOS</b><small>Itens de <strong>itens.json</strong> e armas de <strong>armas.json</strong>.</small></div>
        <button type="button" class="dice-btn" data-open-ready-items="${p.id}">ABRIR CATÁLOGO</button>
      </div>
      <div class="inventory-add-card custom">
        <div class="inventory-add-card-icon">✦</div>
        <div class="inventory-add-card-copy"><b>CRIAR ITEM</b><small>Crie um item ou arma personalizado para este jogador.</small></div>
        <button type="button" class="dice-btn secondary" data-new-item="${p.id}">CRIAR ITEM</button>
      </div>
    </div>
  </details>`;
}


(function(){
  function bindReadyCatalog(){
    const search=$('#readyItemSearch'), category=$('#readyItemCategory');
    if(search && !search.__readyBound){search.__readyBound=true;search.addEventListener('input',renderReadyItemCatalog);}
    if(category && !category.__readyBound){category.__readyBound=true;category.addEventListener('change',renderReadyItemCatalog);}
    const close=$('#closeReadyItemModal'), cancel=$('#cancelReadyItem');
    if(close && !close.__readyBound){close.__readyBound=true;close.onclick=closeReadyItemCatalog;}
    if(cancel && !cancel.__readyBound){cancel.__readyBound=true;cancel.onclick=closeReadyItemCatalog;}
    const modal=$('#readyItemModal');
    if(modal && !modal.__readyBound){modal.__readyBound=true;modal.addEventListener('click',e=>{if(e.target===modal)closeReadyItemCatalog();});}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindReadyCatalog,{once:true});else bindReadyCatalog();
})();


/* --- 04-master-campaign.js --- */
function renderMasterBase(){
  const players=$('#masterPlayers'); if(players){
    players.innerHTML=data.jogadores.map(p=>`<div class="entity master-player-card"><div class="entity-avatar">${esc(p.nome.split(' ').map(x=>x[0]).slice(0,2).join(''))}</div><div class="entity-info"><b>${esc(p.nome)}</b><small>${esc(p.classe||'Classe não definida')} • Defesa ${p.defesa}</small></div><div class="master-class-control"><span class="class-status">${p.classe?`Classe: <b>${esc(p.classe)}</b>`:'Classe: <b>não definida</b>'}</span>${p.classe?`<button class="dice-btn secondary" data-config-class-skills="${p.id}">PERÍCIAS</button><button class="dice-btn secondary" data-reset-class="${p.id}">REINICIAR DESCOBERTA</button>`:''}</div><div class="manual-resources"><label>PV<input type="number" min="0" max="${p.pvMax}" value="${p.pv}" data-resource="pv" data-id="${p.id}"></label><label>PE<input type="number" min="0" max="${p.peMax}" value="${p.pe}" data-resource="pe" data-id="${p.id}"></label><label>SAN<input type="number" min="0" max="${p.sanMax}" value="${p.san}" data-resource="san" data-id="${p.id}"></label></div><details class="master-skills"><summary>PERÍCIAS / TREINAMENTO</summary><div class="master-skill-grid">${(p.pericias||[]).map((x,i)=>`<label title="${x.requerTreinamento?'Perícia com asterisco: exige treinamento.':'Pode ser usada sem treinamento.'}"><input type="checkbox" data-train-player="${p.id}" data-train-index="${i}" ${x.treinada?'checked':''}>${esc(skillLabel(x))}</label>`).join('')}</div></details><details class="master-identity"><summary>IDENTIDADE / HISTÓRICO</summary><div class="master-identity-grid"><span><b>Idade</b>${esc(p.idade||'Não definida')}</span><span><b>Profissão</b>${esc(p.profissao||'Não definida')}</span><span><b>Aparência</b>${esc(p.aparencia||'Não definida')}</span><span><b>Personalidade</b>${esc(p.personalidade||'Não definida')}</span><span><b>Histórico</b>${esc(p.historico||'Não definido')}</span></div></details>${ritualMasterBlock(p)}${renderInventoryMaster(p)}</div>`).join('');
    players.querySelectorAll('[data-resource]').forEach(i=>i.onchange=()=>updatePlayerResource(i.dataset.id,i.dataset.resource,+i.value));
    players.querySelectorAll('[data-reset-class]').forEach(b=>b.onclick=()=>resetClassChoice(b.dataset.resetClass));
    players.querySelectorAll('[data-config-class-skills]').forEach(b=>b.onclick=()=>configureClassSkills(b.dataset.configClassSkills));
    players.querySelectorAll('[data-train-player]').forEach(i=>i.onchange=()=>setSkillTraining(i.dataset.trainPlayer,+i.dataset.trainIndex,i.checked));
    players.querySelectorAll('[data-open-ready-items]').forEach(b=>b.onclick=()=>openReadyItemCatalog(b.dataset.openReadyItems));
    players.querySelectorAll('[data-new-item]').forEach(b=>b.onclick=()=>createAndAddPlayerItem(b.dataset.newItem));
    players.querySelectorAll('[data-toggle-equip]').forEach(b=>b.onclick=()=>togglePlayerItemEquipped(b.dataset.toggleEquip,+b.dataset.itemIndex));
    players.querySelectorAll('[data-remove-item]').forEach(b=>b.onclick=()=>removePlayerItem(b.dataset.removeItem,+b.dataset.itemIndex,1));
    players.querySelectorAll('[data-add-ritual]').forEach(b=>b.onclick=()=>{const sel=b.parentElement.querySelector('[data-ritual-select]');addRitualToPlayer(b.dataset.addRitual,sel?.value);});
    players.querySelectorAll('[data-remove-ritual]').forEach(b=>b.onclick=()=>removeRitualFromPlayer(b.dataset.removeRitual,+b.dataset.ritualIndex));
    players.querySelectorAll('[data-toggle-ritual]').forEach(b=>b.onclick=()=>toggleRitualAvailability(b.dataset.toggleRitual,+b.dataset.ritualIndex));
  }
  const monsters=$('#masterMonsters'); if(monsters){
    const catalog=Array.isArray(window.THREAT_CATALOG)?window.THREAT_CATALOG:[];
    const options=catalog.map(m=>`<option value="${esc(m.catalogId||m.id)}">${esc(m.nome)}${m.vd!=null?` — VD ${esc(m.vd)}`:``}${m.elemento?` • ${esc(m.elemento)}`:``}</option>`).join('');
    const rows=data.monstros.map(m=>{
      const attacks=(m.ataques||[]).slice(0,3).map(a=>`${esc(a.nome)}: ${esc(a.teste||'—')} • ${esc(a.dano||'—')}`).join('<br>')||'Nenhum ataque cadastrado';
      return `<article class="entity master-monster-card">
        <div class="entity-avatar">☠</div>
        <div class="entity-info"><b>${esc(m.nome)}</b><small>${esc(m.tipo||'Criatura')} • ${esc(m.elemento||'—')} • VD ${esc(m.vd??'—')} • Defesa ${esc(m.defesa??'—')}</small><small>PV ${esc(m.pv??0)}/${esc(m.pvMax??m.pvBase??0)}${m.catalogId?` • Catálogo: ${esc(m.catalogId)}`:''}</small><small class="monster-attacks">${attacks}</small></div>
        <div class="manual-hp"><input type="number" min="0" max="${Number(m.pvMax??m.pvBase??m.pv??0)}" value="${Number(m.pv??0)}" data-id="${esc(m.id)}" data-monster="1"><small>/ ${Number(m.pvMax??m.pvBase??m.pv??0)} PV</small></div>
        <div class="monster-actions"><button class="dice-btn" data-monster-roll="${esc(m.id)}">ROLAR</button><button class="dice-btn secondary" data-monster-delete="${esc(m.id)}">EXCLUIR</button></div>
      </article>`;
    }).join('');
    monsters.innerHTML=`<div class="monster-manager-toolbar"><div class="monster-manager-copy"><b>Adicionar monstro</b><small>Catálogo carregado de <code>ameacas.json</code>. A criação adiciona uma instância à sessão.</small></div><select id="masterMonsterCatalogSelect" class="control-select"><option value="">Selecionar ameaça...</option>${options}</select><button class="dice-btn" id="masterMonsterAddBtn">＋ ADICIONAR</button></div><div class="master-monster-list">${rows||'<p class="muted">Nenhum monstro adicionado à sessão.</p>'}</div>`;
    monsters.querySelector('#masterMonsterAddBtn')?.addEventListener('click',()=>{const id=monsters.querySelector('#masterMonsterCatalogSelect')?.value;if(!id)return toast('Selecione uma ameaça.');try{if(window.ThreatEngine?.add)ThreatEngine.add(id);else throw Error('Catálogo de ameaças ainda não carregado.');toast('Monstro adicionado à sessão.');renderMaster();}catch(err){toast(err.message||'Não foi possível adicionar o monstro.');}});
    monsters.querySelectorAll('[data-monster-delete]').forEach(b=>b.onclick=()=>{const id=b.dataset.monsterDelete,m=data.monstros.find(x=>x.id===id);if(!m)return;if(!confirm(`Excluir "${m.nome}" da sessão?`))return;data.monstros=data.monstros.filter(x=>x.id!==id);GameEngineV070?.log?.('THREAT_REMOVED',{nome:m.nome,resumo:`Ameaça removida: ${m.nome}`});saveLocal();renderMaster();toast('Monstro excluído.');});
    monsters.querySelectorAll('[data-monster-roll]').forEach(b=>b.onclick=()=>openMonsterDice(b.dataset.monsterRoll));
    monsters.querySelectorAll('.manual-hp input[data-monster]').forEach(i=>i.onchange=()=>{const m=data.monstros.find(x=>x.id===i.dataset.id);if(!m)return;m.pv=Math.max(0,Math.min(Number(m.pvMax??m.pvBase??m.pv??0),+i.value||0));saveLocal();toast('PV do monstro atualizado');});
  }
}
function setMasterClass(pid,classe){
  const allowed=Object.keys(CLASS_PROFILES); const p=data.jogadores.find(x=>x.id===pid);
  if(!p)return; if(!classe){ resetClassChoice(pid); return; } if(!allowed.includes(classe))return;
  applyClassProfile(p,classe); p.classeEscolhidaEm=p.classeEscolhidaEm||'Definida pelo Mestre';
  logAction(`${p.nome}: classe definida pelo Mestre como ${classe}.`); saveLocal(); window.MultiplayerV071?.syncPlayer?.(pid); renderMaster(); renderPlayerCards();
  if(selectedPlayer?.id===pid){selectedPlayer=p;renderSheet();} toast(`${p.nome}: ${classe}`);
}
function updatePlayerResource(id,resource,value){
  const p=data.jogadores.find(x=>x.id===id); if(!p)return;
  const maxKey=resource+'Max'; const max=Number(p[maxKey])||0;
  p[resource]=Math.max(0,Math.min(max,Number(value)||0));
  logAction(`${p.nome}: ${resource.toUpperCase()} atualizado para ${p[resource]}/${max}.`);
  saveLocal(); window.MultiplayerV071?.syncPlayer?.(id);
  if(selectedPlayer && selectedPlayer.id===id){ selectedPlayer=p; renderSheet(); }
  renderMaster(); toast(`${resource.toUpperCase()} atualizado`);
}
function setSkillTraining(pid,index,trained){
  const player=data.jogadores.find(x=>x.id===pid); const skill=player?.pericias?.[index]; if(!skill)return;
  skill.treinada=Boolean(trained);
  logAction(`${player.nome}: ${skill.nome} ${skill.treinada?'marcada como treinada':'marcada como não treinada'}.`);
  saveLocal(); window.MultiplayerV071?.syncPlayer?.(pid); renderMaster(); if(selectedPlayer?.id===pid){ selectedPlayer=player; renderSheet(); }
  toast(`${skill.nome}: ${skill.treinada?'Treinada (+5)':'Não treinada'}`);
}

function openAttributeDice(pid,attribute){
  const player=data.jogadores.find(x=>x.id===pid); if(!player)return;
  const value=Number(player.atributos?.[attribute]);
  if(!Number.isFinite(value))return toast('Atributo não encontrado');
  const labels={FOR:'Força',AGI:'Agilidade',INT:'Intelecto',PRE:'Presença',VIG:'Vigor'};
  diceState={type:'attribute',pid,formula:`1d20${value>=0?'+':''}${value}`,title:`${labels[attribute]||attribute} — Teste de Atributo`,dt:getSkillDT(),attribute:true};
  $('#diceTitle').textContent=diceState.title;
  $('#diceFormula').textContent=`${labels[attribute]||attribute} ${value>=0?'+':''}${value} • ${diceState.formula}`;
  $('#diceResult').textContent='—'; $('#diceBreakdown').textContent='';
  $('#diceDTWrap').style.display='block'; $('#diceDT').value=diceState.dt; $('#diceDT').disabled=true;
  $('#diceOutcome').textContent=''; $('#diceOutcome').className='dice-outcome';
  $('#rollAgain').style.display='block'; $('#diceModal').classList.add('show'); roll();
}

function openSkillDice(pid,index){
  const player=data.jogadores.find(x=>x.id===pid); if(!player)return;
  const skill=(player.pericias||[])[index]; if(!skill)return;
  const formula=skillFormula(player,skill);
  diceState={type:'skill',pid,formula,title:`${skill.nome} — Perícia`,dt:getSkillDT(),skill:true};
  $('#diceTitle').textContent=diceState.title;
  $('#diceFormula').textContent=`${skill.treinada?'Treinada (+5)':'Não treinada'} • ${skill.atributoLabel||skill.atributo||'Perícia'} • ${diceState.formula}`;
  $('#diceResult').textContent='—'; $('#diceBreakdown').textContent='';
  $('#diceDTWrap').style.display='block'; $('#diceDT').value=diceState.dt; $('#diceDT').disabled=true;
  $('#diceOutcome').textContent=''; $('#diceModal').classList.add('show'); roll();
}
function openKillerSheet(id){
  const k=data.assassinos.find(x=>x.id===id); if(!k)return;
  const attacks=(k.ataques||[]).map((a,i)=>`<div class="killer-sheet-attack"><div><b>${esc(a.nome)}</b><small>Teste ${esc(a.teste)} • Dano ${esc(a.dano)}</small></div><div><button class="dice-btn" onclick="openKillerRoll('${k.id}',${i},'attack')">ATACAR</button><button class="dice-btn secondary" onclick="openKillerRoll('${k.id}',${i},'damage')">DANO</button></div></div>`).join('');
  const weaknesses=(k.fraquezas||[]).map(w=>`<li>${esc(w)}</li>`).join('') || '<li>Nenhuma cadastrada</li>';
  $('#diceTitle').textContent=k.nome; $('#diceFormula').textContent=`${k.elemento} • Defesa ${k.defesa} • PV ${k.pv}`;
  $('#diceResult').innerHTML='';
  $('#diceBreakdown').innerHTML=`<div class="killer-sheet"><p>${esc(k.descricao)}</p><div class="killer-meta"><span>Andar: <b>${k.andar}º</b></span><span>Estado: <b>${esc(k.estado)}</b></span><span>Sala: <b>${esc(k.sala)}</b></span></div><h3>Fraquezas</h3><ul>${weaknesses}</ul><h3>Ataques</h3>${attacks}</div>`;
  $('#rollAgain').style.display='none'; $('#diceModal').classList.add('show');
}
function openKillerRoll(kid,index,type){
  const k=data.assassinos.find(x=>x.id===kid); const a=k?.ataques?.[index]; if(!a)return;
  diceState={type,formula:type==='attack'?a.teste:a.dano,title:`${k.nome} — ${a.nome} (${type==='attack'?'Ataque':'Dano'})`};
  $('#diceTitle').textContent=diceState.title; $('#diceFormula').textContent=diceState.formula; $('#diceResult').textContent='—'; $('#diceBreakdown').textContent=''; $('#rollAgain').style.display='block'; $('#diceModal').classList.add('show'); roll();
}

function renderCampaign(){
  const c=data.campanha;
  const f=data.andares.find(x=>x.id===Number(c.andarAtual));
  const pursuitStates=['Normal','Alerta','Caça','Perseguição'];
  $('#campaignInfo').innerHTML=`
    <div><span>ANDAR ATUAL</span><b>${c.andarAtual}º — ${esc(f?.nome||'')}</b></div>
    <div><span>ELEMENTO</span><b>${esc(f?.elemento||'')}</b></div>
    <div><span>OBJETIVO ATUAL</span><b>${esc(c.objetivoAtual)}</b></div>
    <div><span>PERSEGUIÇÃO</span><b class="pursuit-${String(c.perseguicao).toLowerCase()}">${esc(c.perseguicao)}</b></div>
    <div><span>CHAVES</span><b>${c.chavesEncontradas.length}/${data.andares.length}</b></div>
    <div class="master-controls campaign-controls">
      <button class="ghost small" id="prevFloor">↑ Subir</button>
      <button class="ghost small" id="nextFloor">↓ Descer</button>
      <select id="floorSelect" class="control-select">${data.andares.slice().sort((a,b)=>b.id-a.id).map(a=>`<option value="${a.id}" ${a.id===c.andarAtual?'selected':''}>${a.id}º — ${esc(a.nome)}</option>`).join('')}</select>
      <input id="objectiveInput" class="control-input" value="${esc(c.objetivoAtual)}" aria-label="Novo objetivo">
      <button class="ghost small" id="saveObjective">✓ Salvar objetivo</button>
      <select id="pursuitSelect" class="control-select">${pursuitStates.map(x=>`<option value="${x}" ${x===c.perseguicao?'selected':''}>${x}</option>`).join('')}</select>
      <button class="ghost small" id="savePursuit">⚠ Aplicar perseguição</button>
      <label class="dt-control">DT padrão das perícias<input id="skillDTInput" class="control-input" type="number" min=1 max=50 value="${getSkillDT()}"></label>
      <button class="ghost small" id="saveSkillDT">🎯 Aplicar DT</button>
      <label class="class-release-control"><input id="classChoiceToggle" type="checkbox" ${c.escolhaClasseLiberada?'checked':''}> Liberar escolha de classe no 5º andar</label>
    </div>`;
  $('#prevFloor').onclick=()=>changeFloor(1);
  $('#nextFloor').onclick=()=>changeFloor(-1);
  $('#floorSelect').onchange=e=>setFloor(Number(e.target.value));
  $('#saveObjective').onclick=()=>setObjective($('#objectiveInput').value);
  $('#savePursuit').onclick=()=>setPursuit($('#pursuitSelect').value);
  $('#saveSkillDT').onclick=()=>setSkillDT($('#skillDTInput').value);
  $('#classChoiceToggle').onchange=e=>setClassChoiceRelease(e.target.checked);
  renderKillers();renderPuzzles();renderActivities();
}
function saveLocal(){localStorage.setItem('op-fichas-state',JSON.stringify(data));}
function logAction(message){if(!Array.isArray(data.logs))data.logs=[];data.logs.push(`${new Date().toLocaleTimeString()} — ${message}`);}
function setFloor(floor){const next=Math.max(1,Math.min(9,Number(floor)||5));data.campanha.andarAtual=next;logAction(`Andar alterado para ${next}º.`);saveLocal();renderMaster();renderCampaign();if(selectedPlayer)renderSheet();toast(`Andar ${next}º`)}
function changeFloor(delta){setFloor(Number(data.campanha.andarAtual)+delta)}
function setObjective(value){const x=String(value||'').trim();if(!x){toast('Digite um objetivo');return}data.campanha.objetivoAtual=x;logAction('Objetivo da campanha alterado.');saveLocal();renderCampaign();if(selectedPlayer)renderSheet();toast('Objetivo atualizado')}
function editObjective(){setObjective(prompt('Novo objetivo:',data.campanha.objetivoAtual))}
function setPursuit(value){
  if(!PURSUIT_STAGES.includes(value))return;
  const previous=data.campanha.perseguicao||'Normal';
  data.campanha.perseguicao=value;
  if(value==='Perseguição'){
    data.campanha.perseguicaoAtiva=true;
    data.campanha.perseguicaoRodada=Number(data.campanha.perseguicaoRodada)||1;
    showAlert('PERSEGUIÇÃO INICIADA', data.campanha.perseguicaoAlvo ? `Alvo: ${data.campanha.perseguicaoAlvo}` : 'Uma ameaça está muito próxima.', 'danger');
    playHorrorSound('chase');
  } else if(previous==='Perseguição' && value!=='Perseguição'){
    data.campanha.perseguicaoAtiva=false;
    showAlert('PERSEGUIÇÃO ENCERRADA','O perigo parece ter se afastado.','success');
    playHorrorSound('release');
  } else if(value==='Alerta' || value==='Caça'){
    showAlert(value.toUpperCase(), value==='Alerta'?'Algo chamou a atenção da ameaça.':'A ameaça começou a procurar vocês.','warning');
    playHorrorSound('warning');
  }
  logAction(`Estado de perseguição: ${value}.`);saveLocal();renderCampaign();renderMaster();if(selectedPlayer)renderSheet();toast(value);
  if(value==='Perseguição' && selectedPlayer) openHorrorScreen(selectedPlayer);
}
function cyclePursuit(){const states=['Normal','Alerta','Caça','Perseguição'];let i=states.indexOf(data.campanha.perseguicao);setPursuit(states[(i+1)%states.length])}
function renderKillers(){
  if(!$('#killerInfo'))return;
  $('#killerInfo').innerHTML=data.assassinos.map(k=>`<div class="entity killer"><div class="entity-avatar">🔪</div><div class="entity-info"><b>${esc(k.nome)}</b><small>${esc(k.elemento)} • Andar ${k.andar}º • ${esc(k.inspiracao)}</small><small>Movimentação: 1º–4º e 6º–9º • 5º andar bloqueado</small><small>Estado: <b>${esc(k.estado)}</b> • Sala: ${esc(k.sala)}</small></div><div class="killer-actions"><button class="dice-btn secondary" onclick="openKillerSheet('${k.id}')">FICHA</button><button class="dice-btn" onclick="toggleKiller('${k.id}')">${k.ativo?'DESATIVAR':'ATIVAR'}</button><button class="dice-btn secondary" onclick="moveKiller('${k.id}')">MOVER</button></div></div>`).join('');
}
function renderPuzzles(){
  const el=$('#puzzleInfo'); if(!el)return;
  const progressKeys=data.enigmas.filter(e=>Number(e.chave)>=1&&Number(e.chave)<=4).sort((a,b)=>Number(a.chave)-Number(b.chave));
  const other=data.enigmas.filter(e=>!(Number(e.chave)>=1&&Number(e.chave)<=4));
  const keyCards=progressKeys.map(e=>`<div class="entity puzzle-key ${e.resolvido?'puzzle-done':''}"><div class="entity-avatar key-avatar">${e.resolvido?'✓':`K${e.chave}`}</div><div class="entity-info puzzle-details"><b>${esc(e.tipo||`Chave ${e.chave}`)} — ${esc(e.nome)}</b><small><strong>Rota:</strong> Hall ou Terraço — enigma compartilhado</small><small><strong>Local:</strong> ${esc(e.local||'Localização definida pelo Mestre')}</small><small><strong>Uso:</strong> ${esc(e.uso||'Pode ser utilizado independentemente da rota escolhida.')}</small><small><strong>Enigma:</strong> ${esc(e.descricao)}</small><small><strong>Pista:</strong> ${esc(e.pista)}</small><small><strong>Solução:</strong> ${esc(e.solucao)}</small><small><strong>Recompensa:</strong> ${esc(e.recompensa)}</small></div><button class="dice-btn" onclick="togglePuzzle('${e.id}')">${e.resolvido?'REABRIR':'RESOLVER'}</button></div>`).join('');
  const otherCards=other.map(e=>`<div class="entity"><div class="entity-avatar">${e.resolvido?'✓':'?'}</div><div class="entity-info"><b>${esc(e.nome)}</b><small>${e.andar ? `Andar ${e.andar}º` : 'Rota especial'} • Recompensa: ${esc(e.recompensa)}</small><small>Pista: ${esc(e.pista)}</small></div><button class="dice-btn" onclick="togglePuzzle('${e.id}')">${e.resolvido?'REABRIR':'RESOLVER'}</button></div>`).join('');
  el.innerHTML=`<div class="puzzle-progress"><div class="puzzle-progress-title"><b>Progressão por chaves</b><span>${progressKeys.filter(e=>e.resolvido).length}/4 concluídas</span></div>${keyCards}</div>${otherCards?`<div class="puzzle-other-title">Outros enigmas</div>${otherCards}`:''}`;
}
function renderActivities(){
  const el=$('#activityInfo'); if(!el)return;
  const statuses=['Bloqueada','Em andamento','Concluída'];
  el.innerHTML=data.atividades.map(a=>`<div class="entity activity-row"><div class="entity-avatar">${a.status==='Concluída'?'✓':a.status==='Em andamento'?'▶':'🔒'}</div><div class="entity-info"><b>${esc(a.nome)}</b><small>Status: ${esc(a.status)}</small></div><select class="control-select activity-status" data-activity="${a.id}">${statuses.map(st=>`<option value="${st}" ${st===a.status?'selected':''}>${st}</option>`).join('')}</select></div>`).join('');
  document.querySelectorAll('.activity-status').forEach(s=>s.onchange=()=>setActivityStatus(Number(s.dataset.activity),s.value));
}
function setActivityStatus(id,status){const a=data.atividades.find(x=>x.id===id);if(!a)return;a.status=status;logAction(`Atividade "${a.nome}": ${status}.`);saveLocal();renderActivities();toast('Atividade atualizada')}
function toggleKiller(id){const k=data.assassinos.find(x=>x.id===id);k.ativo=!k.ativo;k.estado=k.ativo?'Caçando':'Oculto';logAction(`${k.nome}: ${k.estado}.`);saveLocal();renderKillers();toast(`${k.nome}: ${k.estado}`)}
function moveKiller(id){const k=data.assassinos.find(x=>x.id===id);if(!k)return;const allowed=[1,2,3,4,6,7,8,9];const raw=prompt('Novo andar (1-4 ou 6-9). O 5º andar é protegido e não pode receber assassinos:',k.andar);if(raw===null)return;const n=Number(raw);if(!allowed.includes(n)){toast('Andar inválido: assassinos não podem ocupar o 5º andar.');return}k.andar=n;k.sala=prompt('Sala/localização secreta:',k.sala)||k.sala;logAction(`${k.nome} movido para o ${n}º andar.`);saveLocal();renderKillers();toast('Assassino movido')}
function togglePuzzle(id){const e=data.enigmas.find(x=>x.id===id);if(!e)return;e.resolvido=!e.resolvido;const keyValue=Number(e.chave);if(keyValue>=1&&keyValue<=4){data.campanha.chavesEncontradas=Array.isArray(data.campanha.chavesEncontradas)?data.campanha.chavesEncontradas.filter(x=>Number(x)!==keyValue):[];if(e.resolvido)data.campanha.chavesEncontradas.push(keyValue);}else{const floor=data.andares.find(x=>x.id===e.andar);if(e.resolvido&&floor&&!data.campanha.chavesEncontradas.includes(floor.chave))data.campanha.chavesEncontradas.push(floor.chave);if(!e.resolvido&&floor)data.campanha.chavesEncontradas=data.campanha.chavesEncontradas.filter(x=>x!==floor.chave);}logAction(`${e.nome}: ${e.resolvido?'resolvido':'reaberto'}.`);saveLocal();renderPuzzles();renderCampaign();if(selectedPlayer)renderSheet();toast(e.resolvido?'Enigma resolvido':'Enigma reaberto')}



// ===== v0.20: horror, perseguição, alertas, áudio e efeitos =====

function configureClassSkills(pid){
  const p=data.jogadores.find(x=>x.id===pid); if(!p||!p.classe)return;
  const profile=CLASS_PROFILES[p.classe];
  const current=(p.treinadasClasse||[]).join(', ');
  const mandatory=profile.escolhaPericias?.length?`
Obrigatórias de escolha: ${profile.escolhaPericias.join(' / ')}`:'';
  const required=profile.periciasQuantidade(p);
  const text=prompt(`${p.nome} — ${p.classe}\n\nPerícias escolhidas pela classe: ${required}.${mandatory}\nDigite os nomes separados por vírgula.\n\nAtuais: ${current||'nenhuma'}` ,current);
  if(text===null)return;
  setClassTraining(pid,text.split(','));
}


/* --- 05-horror-map.js --- */
function ensureHorrorState(){
  data.campanha.horror=data.campanha.horror||{};
  data.campanha.horror.alertas=Array.isArray(data.campanha.horror.alertas)?data.campanha.horror.alertas:[];
  data.campanha.horror.eventos=Array.isArray(data.campanha.horror.eventos)?data.campanha.horror.eventos:[];
  data.campanha.perseguicaoAlvo=data.campanha.perseguicaoAlvo||'';
  data.campanha.perseguicaoAssassino=data.campanha.perseguicaoAssassino||'';
  data.campanha.perseguicaoDistancia=Math.max(0,Number(data.campanha.perseguicaoDistancia)||0);
  data.campanha.perseguicaoRodada=Math.max(1,Number(data.campanha.perseguicaoRodada)||1);
  data.campanha.perseguicaoAtiva=Boolean(data.campanha.perseguicaoAtiva);
}
function showAlert(title,text,type='warning',playerOnly=false){
  ensureHorrorState();
  const alert={id:'a'+Date.now()+Math.random().toString(16).slice(2),title:String(title),text:String(text),type,playerOnly,at:Date.now()};
  data.campanha.horror.alertas.unshift(alert); data.campanha.horror.alertas=data.campanha.horror.alertas.slice(0,20);
  renderAlerts(); saveLocal();
}
function dismissAlert(id){
  ensureHorrorState(); data.campanha.horror.alertas=data.campanha.horror.alertas.filter(x=>x.id!==id); saveLocal(); renderAlerts();
}
function renderAlerts(){
  const layer=$('#alertLayer'); if(!layer||!data)return;
  const alerts=(data.campanha.horror?.alertas||[]).filter(x=>!x.playerOnly || selectedPlayer).slice(0,4);
  layer.innerHTML=alerts.map(x=>`<div class="horror-alert ${esc(x.type)}"><div class="alert-symbol">${x.type==='danger'?'☠':x.type==='success'?'✓':'!'}</div><div><b>${esc(x.title)}</b><span>${esc(x.text)}</span></div><button onclick="dismissAlert('${x.id}')">×</button></div>`).join('');
  if(alerts.length) setTimeout(()=>{ const first=alerts[alerts.length-1]; if(first) dismissAlert(first.id); },5200);
}
function playHorrorSound(kind='warning'){
  try{
    const C=window.AudioContext||window.webkitAudioContext; if(!C)return;
    if(horrorAudio) horrorAudio.close(); horrorAudio=new C(); const ctx=horrorAudio;
    const gain=ctx.createGain(); gain.gain.value=0.0001; gain.connect(ctx.destination);
    const osc=ctx.createOscillator(); osc.connect(gain);
    const now=ctx.currentTime;
    if(kind==='chase'){osc.type='sawtooth';osc.frequency.setValueAtTime(110,now);osc.frequency.exponentialRampToValueAtTime(55,now+0.9);gain.gain.exponentialRampToValueAtTime(0.16,now+0.05);gain.gain.exponentialRampToValueAtTime(0.0001,now+1.2);osc.start(now);osc.stop(now+1.2);}
    else if(kind==='release'){osc.type='sine';osc.frequency.setValueAtTime(180,now);osc.frequency.exponentialRampToValueAtTime(360,now+0.45);gain.gain.exponentialRampToValueAtTime(0.08,now+0.03);gain.gain.exponentialRampToValueAtTime(0.0001,now+0.55);osc.start(now);osc.stop(now+0.55);}
    else {osc.type='triangle';osc.frequency.setValueAtTime(kind==='warning'?180:80,now);osc.frequency.exponentialRampToValueAtTime(kind==='warning'?90:45,now+0.5);gain.gain.exponentialRampToValueAtTime(0.1,now+0.02);gain.gain.exponentialRampToValueAtTime(0.0001,now+0.65);osc.start(now);osc.stop(now+0.65);}
  }catch(e){console.debug('Áudio indisponível',e);}
}
function applyHorrorEffect(effect='shake'){
  document.body.classList.remove('horror-shake','horror-flash','horror-dark');
  void document.body.offsetWidth;
  document.body.classList.add(effect==='flash'?'horror-flash':effect==='dark'?'horror-dark':'horror-shake');
  setTimeout(()=>document.body.classList.remove('horror-shake','horror-flash','horror-dark'),900);
}
function triggerRandomHorror(){
  const e=HORROR_EVENTS[Math.floor(Math.random()*HORROR_EVENTS.length)];
  data.campanha.eventoAtual=e.texto; ensureHorrorState(); data.campanha.horror.eventos.unshift({...e,at:Date.now()}); data.campanha.horror.eventos=data.campanha.horror.eventos.slice(0,20);
  showAlert(e.titulo,e.texto,e.tipo==='ameaça'?'danger':'warning'); playHorrorSound(e.tipo==='ameaça'?'warning':'tension'); applyHorrorEffect(e.tipo==='ameaça'?'flash':'shake');
  logAction(`Evento de horror: ${e.titulo}.`); saveLocal(); renderMaster(); renderCampaign(); if(selectedPlayer)renderSheet();
}
function renderQuickPlayerTools(){
  const p=selectedPlayer; if(!p)return; const existing=$('#playerQuickTools'); if(existing) existing.remove();
  const current=getCurrentFloor(); const revealed=(data.pistas||[]).filter(x=>x.revelada && Number(x.andar)===Number(data.campanha.andarAtual));
  const rooms=(current?.salas||[]).map(r=>`<span class="room-chip ${getInvestigatedRooms(current.id).includes(r)?'done':''}">${getInvestigatedRooms(current.id).includes(r)?'✓ ':''}${esc(r)}</span>`).join('');
  const clues=revealed.map(x=>`<div class="public-clue"><b>🔎 ${esc(x.nome)}</b><span>${esc(x.texto)}</span></div>`).join('')||'<small class="muted">Nenhuma pista foi revelada neste andar.</small>';
  const box=document.createElement('div'); box.id='playerQuickTools'; box.className='player-quick-tools panel'; box.innerHTML=`<div class="quick-head"><div><p class="eyebrow">AÇÕES RÁPIDAS</p><h2>Você está no ${data.campanha.andarAtual}º andar</h2></div><div class="quick-resource"><b>PV ${p.pv}/${p.pvMax}</b><b>PE ${p.pe}/${p.peMax}</b><b>SAN ${p.san}/${p.sanMax}</b></div></div><div class="quick-actions"><button class="dice-btn" onclick="openAttributeDice('${p.id}','FOR')">TESTAR FOR</button><button class="dice-btn" onclick="openAttributeDice('${p.id}','AGI')">TESTAR AGI</button><button class="dice-btn" onclick="openAttributeDice('${p.id}','INT')">TESTAR INT</button><button class="dice-btn" onclick="openAttributeDice('${p.id}','PRE')">TESTAR PRE</button><button class="dice-btn" onclick="openAttributeDice('${p.id}','VIG')">TESTAR VIG</button>${data.campanha.perseguicaoAtiva?'<button class="dice-btn danger-action" onclick="openHorrorScreen(selectedPlayer)">☠ PERSEGUIÇÃO</button>':''}</div><div class="exploration-public"><div><p class="eyebrow">EXPLORAÇÃO</p><div class="room-chips">${rooms}</div></div><div><p class="eyebrow">PISTAS REVELADAS</p><div class="public-clues">${clues}</div></div><div><p class="eyebrow">EVENTO</p><b>${esc(data.campanha.eventoAtual||'Nenhum evento em andamento.')}</b></div></div>`;
  const target=$('#sheetContent'); if(target) target.prepend(box);
}
function renderSheet(){ if(selectedPlayer && typeof ensureRitualState==='function') ensureRitualState(selectedPlayer); renderSheetBase(); renderQuickPlayerTools(); renderAlerts(); if(window.ConditionUI?.renderPlayer) window.ConditionUI.renderPlayer(); if(window.V030?.renderPlayerSystems) window.V030.renderPlayerSystems(); }

function getFloorRooms(floor){
  const obj=typeof floor==='number'||typeof floor==='string' ? data?.andares?.find(a=>Number(a.id)===Number(floor)) : floor;
  return Array.isArray(obj?.salas) ? obj.salas : [];
}
function isSpecialRoom(name){
  const n=String(name||'').toLowerCase();
  return !n.startsWith('quarto ');
}
function roomKiller(floorId,room){
  return (data.assassinos||[]).filter(k=>Number(k.andar)===Number(floorId)&&String(k.sala||'')===String(room));
}
function renderHotelMap(){
  const el=$('#hotelMap'); if(!el||!data)return;
  const current=Number(data.campanha.andarAtual)||5;
  const floor=data.andares.find(x=>Number(x.id)===current) || data.andares.find(x=>Number(x.id)===5);
  const rooms=getFloorRooms(floor);
  const investigated=getInvestigatedRooms(floor.id);
  const routeDown=[5,4,3,2,1].includes(Number(floor.id));
  const routeUp=[5,6,7,8,9].includes(Number(floor.id));
  const killersHere=(data.assassinos||[]).filter(k=>Number(k.andar)===Number(floor.id));
  const floorButtons=data.andares.slice().sort((a,b)=>b.id-a.id).map(a=>`<button class="map-floor-btn ${Number(a.id)===Number(floor.id)?'active':''}" onclick="setMapFloor(${a.id})"><span>${a.id}º</span><small>${esc(a.nome.replace(/^\d+º Andar — /,''))}</small></button>`).join('');
  const roomCards=rooms.map((room,i)=>{
    const done=investigated.includes(room), special=isSpecialRoom(room), ks=roomKiller(floor.id,room);
    return `<button class="hotel-room ${done?'investigated':''} ${special?'special':''} ${ks.length?'killer-present':''}" onclick="toggleMapRoom(${floor.id},'${String(room).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')"><span class="room-number">${special?'✦':String(i+1).padStart(2,'0')}</span><span class="room-name">${esc(room)}</span>${done?'<span class="room-status">✓</span>':''}${ks.length?`<span class="killer-marker">☠ ${ks.length}</span>`:''}</button>`;
  }).join('');
  const killerLegend=killersHere.length ? killersHere.map(k=>`<div class="map-killer-row"><span>☠</span><div><b>${esc(k.nome)}</b><small>${esc(k.sala||'Localização secreta')} • ${esc(k.estado)}</small></div><button class="dice-btn secondary" onclick="moveKillerFromMap('${k.id}')">MOVER</button></div>`).join('') : '<small class="muted">Nenhum assassino neste andar.</small>';
  const routeLabel=floor.id===5?'⭐ PONTO INICIAL':routeDown&&routeUp?'↕ DUAS ROTAS':routeDown?'↓ ROTA DO HALL':routeUp?'↑ ROTA DO TERRAÇO':'ANDAR';
  el.innerHTML=`<div class="panel-title"><div><span class="icon">▦</span><div><h2>Mapa do Hotel Espelho</h2><p>Exploração, salas, rotas e posições secretas</p></div></div><div class="map-current-badge">${routeLabel}</div></div><div class="hotel-map-layout"><aside class="map-floors"><div class="map-floor-title">ANDARES</div>${floorButtons}<div class="map-exits"><b>SAÍDAS</b><span>↘ Térreo — Hall</span><span>↗ Terraço — acima do 9º</span></div></aside><div class="map-main"><div class="map-floor-header"><div><p class="eyebrow">ANDAR ${floor.id}</p><h3>${esc(floor.nome)}</h3></div><div class="map-route-tags">${routeDown?'<span>↓ Hall</span>':''}${routeUp?'<span>↑ Terraço</span>':''}</div></div><div class="hotel-floor-plan"><div class="floor-corridor"><span>◎ CORREDOR CENTRAL</span><i></i><span>↕ ESCADA / ELEVADORES</span></div><div class="hotel-rooms-grid">${roomCards}</div></div></div><aside class="map-side"><h3>AMEAÇAS</h3>${killerLegend}<h3>CONTROLES</h3><div class="map-help"><small>• Clique em uma sala para marcar/desmarcar como investigada.</small><small>• ☠ indica assassino oculto neste ambiente.</small><small>• O 5º andar é protegido e não recebe assassinos.</small></div></aside></div>`;
}
function setMapFloor(floor){
  const n=Number(floor); if(!data.andares.some(a=>Number(a.id)===n))return;
  data.campanha.andarAtual=n; logAction(`Mapa: andar selecionado ${n}º.`); saveLocal();
  renderCampaign(); renderHotelMap();
  if(selectedPlayer) renderSheet();
  toast(`Mapa: ${n}º andar`);
}
function toggleMapRoom(floorId,room){ toggleRoomInvestigated(Number(floorId),room); renderHotelMap(); }
function moveKillerFromMap(id){ moveKiller(id); renderHotelMap(); }

function renderMaster(){ renderMasterBase(); if(window.V030?.render) window.V030.render(); if(window.V085?.render) window.V085.render(); else renderHotelMap(); window.MasterPlayerTools?.refresh?.(); window.ConditionUI?.renderMaster?.(); window.CombatV090?.render?.(); window.SyncV092?.render?.(); window.renderSessionPanel?.(); }

// ===== Inicialização e rolagem =====


/* --- 06-data-dice.js --- */
function normalizeData(source){
  const base = source || {};
  const needsSkillMigration = Number(base._skillSchemaVersion||0) < 2;
  const needsStoryMigration = Number(base._storySchemaVersion||0) < 1;
  const needsClassMigration = Number(base._classSchemaVersion||0) < 1;
  base.campanha = base.campanha || {};
  base.campanha.andarAtual = Math.max(1,Math.min(9,Number(base.campanha.andarAtual)||5));
  base.campanha.objetivoAtual = base.campanha.objetivoAtual || 'Explorar o 5º andar, investigar os primeiros sinais e descobrir qual rota de fuga será possível.';
  base.campanha.perseguicao = ['Normal','Alerta','Caça','Perseguição'].includes(base.campanha.perseguicao) ? base.campanha.perseguicao : 'Normal';
  base.campanha.dtPericias = Math.max(1,Math.min(50,Number(base.campanha.dtPericias)||10));
  base.campanha.chavesEncontradas = Array.isArray(base.campanha.chavesEncontradas) ? base.campanha.chavesEncontradas : [];
  base.campanha.escolhaClasseLiberada = Boolean(base.campanha.escolhaClasseLiberada);
  base.campanha.introducao = base.campanha.introducao || 'Vocês acordam no 5º andar sem qualquer contato anterior com o paranormal. A verdade deve ser descoberta durante a investigação.';
  base.campanha.pistasReveladas = Array.isArray(base.campanha.pistasReveladas) ? base.campanha.pistasReveladas : [];
  base.campanha.salasInvestigadas = (base.campanha.salasInvestigadas && typeof base.campanha.salasInvestigadas==='object') ? base.campanha.salasInvestigadas : {};
  base.assassinos=(Array.isArray(base.assassinos)?base.assassinos:[]).map(k=>{const n=Number(k.andar);k.andar=[1,2,3,4,6,7,8,9].includes(n)?n:4; if(n===5)k.andar=4; return k;});
  base.campanha.eventoAtual = base.campanha.eventoAtual || 'Nenhum evento em andamento.';
  base.campanha.horror=base.campanha.horror||{};
  base.campanha.horror.alertas=Array.isArray(base.campanha.horror.alertas)?base.campanha.horror.alertas:[];
  base.campanha.horror.eventos=Array.isArray(base.campanha.horror.eventos)?base.campanha.horror.eventos:[];
  base.campanha.perseguicaoAlvo=base.campanha.perseguicaoAlvo||'';
  base.campanha.perseguicaoAssassino=base.campanha.perseguicaoAssassino||'';
  base.campanha.perseguicaoDistancia=Math.max(0,Number(base.campanha.perseguicaoDistancia)||0);
  base.campanha.perseguicaoRodada=Math.max(1,Number(base.campanha.perseguicaoRodada)||1);
  base.campanha.perseguicaoAtiva=Boolean(base.campanha.perseguicaoAtiva);
  base.pistas = Array.isArray(base.pistas) ? base.pistas : [];
  base.pistas.forEach(x=>{x.revelada=Boolean(x.revelada || base.campanha.pistasReveladas.includes(x.id));});
  base.andares = Array.isArray(base.andares) ? base.andares : [];
  base.andares = base.andares.filter(x=>Number(x.id)>=1 && Number(x.id)<=9).sort((a,b)=>Number(a.id)-Number(b.id));
  base.jogadores = Array.isArray(base.jogadores) ? base.jogadores : [];
  // V0.40.4: a campanha passa a iniciar somente com a ficha aprovada de Arthur Reis.
  // A limpeza é aplicada uma única vez também sobre estados antigos do localStorage;
  // depois disso, novas fichas criadas pelo jogador continuam permitidas.
  if(Number(base._rosterSchemaVersion||0) < 1){
    base.jogadores = base.jogadores.filter(p => p?.id === 'p1' || String(p?.nome||'').trim() === 'Arthur Reis');
    const arthur = base.jogadores.find(p => p?.id === 'p1') || base.jogadores[0];
    base.jogadores = arthur ? [arthur] : [];
  }
  base._rosterSchemaVersion = 1;
  base.jogadores.forEach(p=>{
    p.idade = String(p.idade ?? '').trim();
    p.profissao = String(p.profissao ?? '').trim();
    p.origem = String(p.origem ?? p.profissao ?? '').trim();
    if(p.origem && ORIGIN_PROFILES[p.origem]) p.profissao=p.origem;
    p.aparencia = String(p.aparencia ?? '').trim();
    p.personalidade = String(p.personalidade ?? '').trim();
    p.historico = String(p.historico ?? '').trim();
    if(needsStoryMigration || needsClassMigration){ p.classe=null; delete p.classeEscolhidaEm; restoreBaseSheet(p); }
    else if(p.origem && ORIGIN_PROFILES[p.origem]) { const cls=p.classe; const trained=Array.isArray(p.treinadasClasse)?[...p.treinadasClasse]:[]; const perito=Array.isArray(p.peritoPericias)?[...p.peritoPericias]:[]; restoreBaseSheet(p); if(cls){ applyClassProfile(p,cls); p.treinadasClasse=trained; p.peritoPericias=perito; (p.pericias||[]).forEach(sk=>{ if(trained.includes(sk.nome)) sk.treinada=true; sk.grau=sk.treinada?'treinado':'nao_treinada'; }); } }

    const current=Array.isArray(p.pericias)?p.pericias.map(x=>typeof x==='string'?{nome:x}:x):[];
    const byName=new Map(current.map(x=>[String(x.nome).toLowerCase(),x]));
    p.pericias=SKILL_CATALOG.map(([nome,atributo,treinada])=>{
      const existing=byName.get(nome.toLowerCase())||{};
      const atributoLabel=atributo==='INT/PRE'?'Intelecto ou Presença':({AGI:'Agilidade',FOR:'Força',INT:'Intelecto',PRE:'Presença',VIG:'Vigor'}[atributo]||atributo);
      const inferredTrained=needsSkillMigration ? Boolean(existing.teste&&existing.teste!=='AUTO') : Boolean(existing.treinada); return {...existing,nome,atributo,atributoLabel,requerTreinamento:treinada,treinada:inferredTrained,teste:existing.teste||'AUTO'};
    });
  });
  base.jogadores.forEach(p=>{p.itens=Array.isArray(p.itens)?p.itens.map(normalizeItem):[];});
  base.itensDisponiveis=Array.isArray(base.itensDisponiveis)?base.itensDisponiveis.map(normalizeItem):[];
  const itemMap=new Map(base.itensDisponiveis.map(i=>[i.nome.toLowerCase(),i]));
  base.jogadores.forEach(p=>(p.itens||[]).forEach(i=>{if(!itemMap.has(i.nome.toLowerCase())) itemMap.set(i.nome.toLowerCase(),{nome:i.nome,descricao:i.descricao,quantidade:1});}));
  base.itensDisponiveis=[...itemMap.values()];
  base.monstros = Array.isArray(base.monstros) ? base.monstros : [];
  base.assassinos = Array.isArray(base.assassinos) ? base.assassinos : [];
  base.assassinos.forEach(k=>{ k.ataques=Array.isArray(k.ataques)?k.ataques:[]; k.fraquezas=Array.isArray(k.fraquezas)?k.fraquezas:[]; });
  base.enigmas = Array.isArray(base.enigmas) ? base.enigmas : [];
  base.atividades = Array.isArray(base.atividades) ? base.atividades : [];
  base.logs = Array.isArray(base.logs) ? base.logs : [];
  base._skillSchemaVersion = 2;
  base._itemSchemaVersion = 2;
  base._storySchemaVersion = 1;
  base._classSchemaVersion = 1;
  base._identitySchemaVersion = 2;
  base._originSchemaVersion = 1;
  base._explorationSchemaVersion = 1;
  base._explorationSchemaVersion = 1;
  base._horrorSchemaVersion = 1;
  base._releaseVersion = 'v0.61-investigacao-regras-pdf';
  return base;
}

async function initializeApp(){
  try {
    await loadData(true);
  } catch(error) {
    console.error('Erro ao carregar fichas.json:', error);
    const msg = 'Não foi possível carregar fichas.json. Execute o projeto pelo VS Code usando Live Server.';
    const loginError = $('#loginError');
    if(loginError) loginError.textContent = msg;
    toast(msg);
  }

  const loginBtn = $('#loginBtn');
  if(loginBtn) loginBtn.onclick = () => {
    if($('#masterUser').value.trim() === 'mestre' && $('#masterPass').value === '1234'){
      sessionStorage.setItem('master-auth','1');
      $('#loginError').textContent='';
      show('masterScreen');
    } else {
      $('#loginError').textContent='Usuário ou senha incorretos.';
    }
  };

  const logoutBtn = $('#logoutBtn');
  if(logoutBtn) logoutBtn.onclick = () => {
    sessionStorage.removeItem('master-auth');
    show('playerHome');
  };

  const reloadBtn = $('#reloadJson');
  if(reloadBtn) reloadBtn.onclick = async () => {
    localStorage.removeItem('op-fichas-state');
    selectedPlayer = null;
    try {
      await loadData(false);
      toast('Dados originais do fichas.json restaurados');
    } catch(error) {
      console.error(error);
      toast('Erro ao recarregar fichas.json');
    }
  };

  const closeCharacterCustomizationBtn = $('#closeCharacterCustomization');
  if(closeCharacterCustomizationBtn) closeCharacterCustomizationBtn.onclick = closeCharacterCustomization;
  const cancelCharacterCustomizationBtn = $('#cancelCharacterCustomization');
  if(cancelCharacterCustomizationBtn) cancelCharacterCustomizationBtn.onclick = closeCharacterCustomization;
  const saveCharacterCustomizationBtn = $('#saveCharacterCustomization');
  if(saveCharacterCustomizationBtn) saveCharacterCustomizationBtn.onclick = saveCharacterCustomization;
  const customCharacterModal = $('#customCharacterModal');
  if(customCharacterModal) customCharacterModal.onclick = event => { if(event.target === customCharacterModal) closeCharacterCustomization(); };
  const customCharacterForm = document.querySelector('.custom-character-box');
  if(customCharacterForm) customCharacterForm.addEventListener('keydown', event => { if(event.key==='Enter' && event.target.tagName !== 'TEXTAREA'){ event.preventDefault(); saveCharacterCustomization(); } });

  const closeItemModalBtn = $('#closeItemModal');
  if(closeItemModalBtn) closeItemModalBtn.onclick = closeItemModal;
  const cancelNewItem = $('#cancelNewItem');
  if(cancelNewItem) cancelNewItem.onclick = closeItemModal;
  const saveNewItemBtn = $('#saveNewItem');
  if(saveNewItemBtn) saveNewItemBtn.onclick = saveNewItem;
  const newItemType=$('#newItemType');
  if(newItemType) newItemType.onchange=toggleItemWeaponFields;
  toggleItemWeaponFields();
  const itemModal = $('#itemModal');
  if(itemModal) itemModal.onclick = event => { if(event.target === itemModal) closeItemModal(); };
  const itemForm = document.querySelector('.item-form');
  if(itemForm) itemForm.addEventListener('keydown', event => { if(event.key==='Enter' && event.target.tagName !== 'TEXTAREA'){ event.preventDefault(); saveNewItem(); } });

  const openCreateSheet = $('#openCreateSheet');
  if(openCreateSheet) openCreateSheet.onclick = openCreateSheetModal;
  const closeCreateSheet = $('#closeCreateSheet');
  if(closeCreateSheet) closeCreateSheet.onclick = closeCreateSheetModal;
  const cancelCreateSheet = $('#cancelCreateSheet');
  if(cancelCreateSheet) cancelCreateSheet.onclick = closeCreateSheetModal;
  const saveCreateSheet = $('#saveCreateSheet');
  if(saveCreateSheet) saveCreateSheet.onclick = createPlayerSheet;
  const originSelect=$('#newCharacterOrigin'); const originInfo=$('#newCharacterOriginInfo');
  if(originSelect) originSelect.onchange=()=>{ const o=ORIGIN_PROFILES[originSelect.value]; if(originInfo) originInfo.textContent=o?`Perícias: ${o.treinadas.length?o.treinadas.join(' e '):'duas à escolha do Mestre'}. Poder: ${o.poder}. Benefícios aplicados automaticamente.`:'A escolha aplica automaticamente as duas perícias treinadas e os benefícios da origem.'; };
  const createSheetModal = $('#createSheetModal');
  if(createSheetModal) createSheetModal.onclick = event => { if(event.target === createSheetModal) closeCreateSheetModal(); };
  const createSheetForm = document.querySelector('.create-sheet-box');
  if(createSheetForm) createSheetForm.addEventListener('keydown', event => { if(event.key==='Enter' && event.target.tagName !== 'TEXTAREA'){ event.preventDefault(); createPlayerSheet(); } });

  const closeDice = $('#closeDice');
  if(closeDice) closeDice.onclick = () => $('#diceModal').classList.remove('show');
  const rollAgain = $('#rollAgain');
  if(rollAgain) rollAgain.onclick = roll;
  const modal = $('#diceModal');
  if(modal) modal.onclick = event => { if(event.target === modal){ modal.classList.remove('show'); $('#rollAgain').style.display='block'; } };
}

function openDice(type,pid,index){
  const player = data?.jogadores?.find(x => x.id === pid);
  const attack = player?.ataques?.[index];
  if(!attack) return toast('Ataque não encontrado');
  diceState = {
    type,
    pid,
    formula: type === 'attack' ? resolveAttackTestFormula(player,attack) : originAttackDamageFormula(player,attack),
    title: type === 'attack' ? `${attack.nome} — Ataque` : `${attack.nome} — Dano`
  };
  $('#diceTitle').textContent = diceState.title;
  $('#diceFormula').textContent = diceState.formula;
  $('#diceResult').textContent = '—';
  $('#diceBreakdown').textContent = '';
  $('#diceDTWrap').style.display='none';
  $('#rollAgain').style.display='block';
  $('#diceModal').classList.add('show');
  roll();
}

function openMonsterDice(mid){
  const monster = data?.monstros?.find(x => x.id === mid);
  const attack = monster?.ataques?.[0];
  if(!attack) return toast('Ataque do monstro não encontrado');
  diceState = {type:'attack', formula:attack.teste, title:`${monster.nome} — ${attack.nome}`};
  $('#diceTitle').textContent = diceState.title;
  $('#diceFormula').textContent = `Teste: ${attack.teste} • Dano: ${attack.dano}`;
  $('#diceResult').textContent = '—';
  $('#diceBreakdown').textContent = '';
  $('#rollAgain').style.display='block';
  $('#diceModal').classList.add('show');
  roll();
}

function roll(){
  if(!diceState) return;
  const formula = String(diceState.formula || '').replace(/\s/g,'');
  const match = formula.match(/^([0-9]+)d([0-9]+)([+-][0-9]+)?$/i);
  if(!match){
    $('#diceResult').textContent='Fórmula inválida';
    $('#diceBreakdown').textContent='Use o formato NdS+modificador, por exemplo 1d20+3.';
    return;
  }
  const number=Number(match[1]), sides=Number(match[2]), modifier=Number(match[3]||0);
  if(number<1||number>100||sides<2||sides>1000){ $('#diceResult').textContent='Fórmula inválida'; return; }
  const rolls=Array.from({length:number},()=>Math.floor(Math.random()*sides)+1);
  const base=diceState.keepWorst?Math.min(...rolls):diceState.keepBest?Math.max(...rolls):rolls.reduce((sum,value)=>sum+value,0);
  const total=base+modifier;
  $('#diceResult').textContent=total;
  const selection=(diceState.keepBest||diceState.keepWorst)?` → ${base}`:'';
  $('#diceBreakdown').textContent=`${rolls.join(' + ')}${selection}${modifier ? ` ${modifier>0?'+ ':''}${modifier}`:''} = ${total}`;
  if(diceState.pid){ const rp=data?.jogadores?.find(x=>x.id===diceState.pid); if(rp){ const label=diceState.title||diceState.type; logAction(`${rp.nome}: ${label} → ${total}${diceState.dt?` (DT ${diceState.dt})`:''}.`); saveLocal(); } }
  if(diceState.skill || diceState.attribute){
    const dt=Number(diceState.dt)||10;
    const success=total>=dt;
    $('#diceOutcome').textContent=success?`✓ SUCESSO — ${total} ≥ DT ${dt}`:`✕ FALHA — ${total} < DT ${dt}`;
    $('#diceOutcome').className=`dice-outcome ${success?'success':'failure'}`;
    if(diceState.ritualAuto){
      const rp=data?.jogadores?.find(x=>x.id===diceState.pid);
      if(rp && !success){
        const cost=Number(diceState.ritualCost)||0;
        rp.san=Math.max(0,Number(rp.san)-cost);
        const permanentLoss=total<=dt-5;
        if(permanentLoss) rp.sanMax=Math.max(0,Number(rp.sanMax||0)-1);
        logAction(`${rp.nome}: falha no Custo do Paranormal de ${diceState.ritual?.nome||'ritual'} — −${cost} SAN${permanentLoss?' e −1 SAN permanente':''}.`);
        saveLocal();
        $('#diceBreakdown').textContent += `\nPenalidade: −${cost} SAN${permanentLoss?' • −1 SAN permanente':''}.`;
        renderSheet();
      }else if(success && diceState.ritual?.dano && typeof rollRitualDamage==='function'){
        setTimeout(()=>rollRitualDamage(diceState.pid,diceState.ritual),120);
      }
    }
  }else{
    $('#diceOutcome').textContent='';
    $('#diceOutcome').className='dice-outcome';
  }
}

function toast(message){
  const element = $('#toast');
  if(!element) return;
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => element.classList.remove('show'), 1800);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-screen]').forEach(button => {
    if(button.__hotelScreenBound)return;
    button.__hotelScreenBound=true;
    button.addEventListener('click', () => show(button.dataset.screen));
  });
  document.addEventListener('click',e=>{if(e.target.id==='closeHorror')closeHorrorScreen();});
// A inicialização é disparada somente no final do index.html, depois que todos os módulos foram carregados.
});


/* --- 07-v030.js --- */
/* V0.70.4 — Núcleo enxuto do mapa funcional.
   Mantém apenas exploração, portas, posições sincronizadas e visão do jogador.
   Movimentação/condições/eventos narrativos usam os módulos consolidados.
*/
const V030={
  floors:[1,2,3,4,5,6,7,8,9],
  ensure(){
    if(!data)return;
    const c=data.campanha;c.v030=c.v030||{};const v=c.v030;
    v.portas=v.portas||{};v.reveladas=v.reveladas||{};v.eventosSalas=v.eventosSalas||{};
    v.condicoes=v.condicoes||{};v.combate=v.combate||{ativo:false,turno:null,iniciativa:[],alvos:{}};
    if(typeof HotelGame!=='undefined'&&HotelGame.ensure){
      const h=HotelGame.ensure();
      data.jogadores.forEach((p,i)=>{
        if(!h.posicoes[p.id])h.posicoes[p.id]=v.posicoesJogadores?.[p.id]||{andar:5,sala:`Quarto 5${String(i+1).padStart(2,'0')}`};
      });
    }else{
      v.posicoesJogadores=v.posicoesJogadores||{};
      data.jogadores.forEach((p,i)=>{if(!v.posicoesJogadores[p.id])v.posicoesJogadores[p.id]={andar:5,sala:`Quarto 5${String(i+1).padStart(2,'0')}`};});
    }
    this.buildDoors();
  },
  buildDoors(){
    const v=data.campanha.v030;
    for(let f=1;f<=9;f++){
      const rooms=getFloorRooms(f)||[];
      rooms.forEach((r,i)=>{
        const a=this.roomCode(r),b=rooms[i+1];if(!a||!b)return;
        const bb=this.roomCode(b),key=`${a}-${bb}`;
        if(!v.portas[key])v.portas[key]={estado:'aberta',requerChave:null};
      });
      if(f>1){const key=`escada-${f}-${f-1}`;if(!v.portas[key])v.portas[key]={estado:'aberta',requerChave:null};}
      if(f<9){const key=`escada-${f}-${f+1}`;if(!v.portas[key])v.portas[key]={estado:'aberta',requerChave:null};}
    }
    ['hall-terreo','terraco-9'].forEach(k=>{if(!v.portas[k])v.portas[k]={estado:'trancada',requerChave:null};});
  },
  roomCode(r){const raw=String(r?.codigo||r?.id||r?.nome||r||'').trim();const digits=raw.replace(/\D/g,'');return digits||raw.replace(/^Quarto\s+/i,'').replace(/\s+/g,'-').toLowerCase();},
  rooms(f){return getFloorRooms(f)||[];},
  room(f,code){return this.rooms(f).find(r=>this.roomCode(r)===String(code));},
  position(pid){
    if(typeof HotelGame!=='undefined'&&HotelGame.ensure){const h=HotelGame.ensure();if(h.posicoes[pid])return h.posicoes[pid];}
    return data.campanha.v030.posicoesJogadores?.[pid]||{andar:5,sala:'501'};
  },
  save(){saveLocal();},
  revealRoom(f,room){data.campanha.v030.reveladas[`${Number(f)}:${room}`]=true;},
  investigate(f,room){
    this.ensure();
    const code=this.roomCode(this.room(f,room)||room);
    this.revealRoom(f,code);
    const key=`${Number(f)}:${code}`;
    const r=this.room(f,code);
    if(!data.campanha.v030.eventosSalas[key])data.campanha.v030.eventosSalas[key]={id:`expl-${f}-${code}`,titulo:isSpecialRoom(r)?'Ambiente diferencial':'Quarto do Hotel Espelho',tipo:isSpecialRoom(r)?'Investigação':'Exploração',texto:isSpecialRoom(r)?'O ambiente apresenta detalhes que não combinam com o restante do hotel.':'O quarto está arrumado demais. Há sinais discretos de que alguém esteve aqui recentemente.',andar:Number(f),sala:code,origem:'exploracao',ativo:false,at:Date.now()};
    logAction(`Sala ${room} do ${f}º andar investigada.`);this.save();renderMaster();if(selectedPlayer)renderSheet();toast(`Sala ${room} investigada`);
  },
  setDoor(key){
    this.ensure();const v=data.campanha.v030,d=v.portas[key]||{estado:'aberta',requerChave:null};
    const states=['aberta','trancada','bloqueada','nada','chave'],idx=states.indexOf(d.estado);
    d.estado=states[(idx+1)%states.length];
    d.requerChave=d.estado==='chave'?(Number(prompt('Qual chave libera esta porta? (1–4)',d.requerChave||1))||1):null;
    v.portas[key]=d;logAction(`Porta ${key}: ${d.estado}${d.requerChave?' — Chave '+d.requerChave:''}.`);this.save();renderMaster();toast(`Porta: ${key} → ${d.estado}`);
  },
  renderPlayerSystems(){
    const el=$('#playerSystems');if(!el||!data||!selectedPlayer)return;
    const pid=selectedPlayer.id,pos=this.position(pid),floor=data.andares.find(a=>Number(a.id)===Number(pos.andar));
    const rooms=this.rooms(floor),revealed=data.campanha.v030.reveladas||{};
    const roomValue=r=>String(r).replace(/^Quarto\s+/i,'').trim(),same=(a,b)=>roomValue(a)===roomValue(b);
    const mapRooms=rooms.map(r=>{const code=this.roomCode(r),key=`${pos.andar}:${code}`,rev=!!revealed[key],mine=same(pos.sala,r);return `<div class="player-map-room ${rev?'revealed':''} ${isSpecialRoom(r)?'special':''} ${mine?'player-here':''}"><span>${esc(code)}</span><b>${esc(String(r).replace(/^Quarto\s+/i,''))}</b><small>${mine?'● VOCÊ':rev?'✓ Investigada':isSpecialRoom(r)?'✦ Ambiente especial':'Quarto'}</small></div>`;}).join('');
    el.innerHTML=`<div class="v030-playerbar panel"><div><span class="eyebrow">VISÃO DO JOGADOR • MAPA</span><b>Você está no ${pos.andar}º Andar — sala ${esc(roomValue(pos.sala))}</b><small>Mapa em modo somente leitura.</small></div><span class="readonly-badge">🔒 SOMENTE LEITURA</span></div><div class="player-map panel"><div class="player-map-head"><div><p class="eyebrow">MAPA DO ANDAR ATUAL</p><h2>${floor?esc(floor.nome.replace(/^\d+º Andar — /,'')):'Andar atual'}</h2></div></div><div class="player-map-legend"><span>● Você</span><span>✓ Investigada</span><span>✦ Ambiente especial</span></div><div class="player-floor-map"><div class="player-map-grid">${mapRooms}</div></div></div>`;
  },
  renderMasterSystems(){
    const el=$('#v030Systems');if(!el||!data)return;
    this.ensure();
    const floor=Number(data.campanha.andarAtual)||5,currentFloor=data.andares.find(a=>Number(a.id)===floor),v=data.campanha.v030;
    const rooms=this.rooms(floor),positions=data.jogadores.filter(p=>Number(this.position(p.id).andar)===floor);
    const regular=rooms.filter(r=>!isSpecialRoom(r)),left=regular.filter((_,i)=>i%2===0),right=regular.filter((_,i)=>i%2===1),specials=rooms.filter(r=>isSpecialRoom(r));
    const roomCard=r=>{const code=this.roomCode(r),key=`${floor}:${code}`,rev=!!v.reveladas[key],ks=roomKiller(floor,r).length,ps=positions.filter(p=>String(this.position(p.id).sala).replace(/^Quarto\s+/i,'')===String(r).replace(/^Quarto\s+/i,''));return `<button class="v030-map-room ${rev?'revealed':''} ${isSpecialRoom(r)?'special':''} ${ks?'danger':''}" onclick="V030.investigate(${floor},'${String(r).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')"><span class="room-code">${esc(code)}</span><b>${esc(String(r).replace(/^Quarto\s+/i,''))}</b><em>${rev?'✓ Investigada':'Não investigada'}</em>${ps.length?`<div class="map-player-dots">${ps.map(p=>`<span title="${esc(p.nome)}">${esc(p.nome.split(' ').map(x=>x[0]).slice(0,2).join(''))}</span>`).join('')}</div>`:''}${ks?`<span class="map-killer-dot">☠ ${ks}</span>`:''}</button>`;};
    const doorKeys=Object.keys(v.portas).filter(k=>k.includes(String(floor))||k.startsWith('escada-'+floor)).slice(0,24);
    const doorHtml=doorKeys.map(k=>{const d=v.portas[k],labels={aberta:'ABERTA',trancada:'TRANCADA',bloqueada:'BLOQUEADA',nada:'NÃO EXISTE',chave:`CHAVE ${d.requerChave||'?'}`};return `<button class="v030-map-door state-${d.estado}" onclick="V030.setDoor('${esc(k)}')"><span>🚪</span><b>${esc(k)}</b><small>${labels[d.estado]||esc(d.estado)}</small></button>`;}).join('');
    const routeUp=floor<9?'TERRAÇO':'',routeDown=floor>5?floor-1:'Térreo';
    el.innerHTML=`<div class="v030-grid refined single-map"><div class="panel v030-panel map-functional-panel"><div class="panel-title"><div><span class="icon">▦</span><div><h2>Mapa funcional</h2><p>${floor}º andar — ${esc(currentFloor?.nome?.replace(/^\d+º Andar — /,'')||'')} • salas, jogadores, portas e ameaças</p></div></div><span class="map-floor-pill">${floor}º</span></div><div class="functional-map"><div class="map-connector top"><span>↑ ${routeDown}</span></div><div class="map-wing"><div class="map-room-column">${left.map(roomCard).join('')}</div><div class="map-core"><div class="map-core-title">CORREDOR CENTRAL</div><div class="map-core-line"></div><div class="map-core-stairs">↕<small>ESCADAS / ELEVADORES</small></div></div><div class="map-room-column">${right.map(roomCard).join('')}</div></div><div class="map-specials">${specials.map(roomCard).join('')}</div><div class="map-connector bottom"><span>↓ ${routeUp||'TERRAÇO'}</span></div></div><div class="map-door-list"><div class="subsection-title">PORTAS E CONEXÕES</div>${doorHtml||'<small class="muted">Sem conexões cadastradas.</small>'}</div></div></div>`;
  },
  render(){this.ensure();this.renderMasterSystems();this.renderPlayerSystems();}
};



/* --- 08-migrations.js --- */
// Migração automática: estados salvos anteriores recebem as novas pistas e nomenclaturas sem perder progresso de revelação.
const __loadDataRefined=loadData;
loadData=async function(useSaved=true){
  await __loadDataRefined(useSaved);
  if(!data)return;
  const clueVersion=Number(data._clueSchemaVersion||0);
  if(clueVersion<2){
    try{
      const response=await fetch('../data/fichas.json?ts='+Date.now(),{cache:'no-store'});
      const fresh=await response.json();
      const revealed=new Set((data.campanha.pistasReveladas||[]).map(String));
      (data.pistas||[]).forEach(p=>{if(p.revelada)revealed.add(String(p.id));});
      data.pistas=(fresh.pistas||[]).map(p=>({...p,revelada:revealed.has(String(p.id))}));
      const oldNames={}; (data.andares||[]).forEach(a=>oldNames[a.id]=a.nome);
      (data.andares||[]).forEach(a=>{const freshFloor=fresh.andares?.find(f=>Number(f.id)===Number(a.id));if(freshFloor)a.nome=freshFloor.nome;});
      data.campanha.pistasReveladas=data.pistas.filter(p=>p.revelada).map(p=>p.id);
      data._clueSchemaVersion=2; data._releaseVersion='V0.30.3'; data._v030MapSchemaVersion=3; saveLocal();
      renderMaster(); renderCampaign(); if(selectedPlayer)renderSheet();
      toast('Dados atualizados para a V0.30.3');
    }catch(err){console.warn('Migração de pistas não concluída:',err);}
  }
};



/* --- 27-hotel-game.js --- */
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
  function setPosition(pid,floor,room){const p=data.jogadores.find(x=>x.id===pid);const n=Number(floor);if(!p||n<1||n>9)return toast('Andar inválido.');const h=ensure();h.posicoes[pid]={andar:n,sala:String(room||'Corredor Central')};data.campanha.andarAtual=n;saveLocal();window.MultiplayerV071?.syncPlayer?.(pid);renderMaster();if(selectedPlayer?.id===pid)renderSheet();toast(`${p.nome} → ${n}º / ${room||'Corredor Central'}`);}
  function addPOI(nome,andar,sala,tipo='Ponto de Interesse',descricao=''){const h=ensure();const n=String(nome||'').trim();if(!n)return null;const poi={id:'poi-'+Date.now(),nome:n,andar:Number(andar)||5,sala:String(sala||'Corredor Central'),tipo,descricao,ativo:true};h.pois.push(poi);saveLocal();renderMaster();return poi;}
  function togglePOI(id){const x=ensure().pois.find(p=>p.id===id);if(!x)return;x.ativo=!x.ativo;saveLocal();renderMaster();}
  function render(){const host=$('#hotelGamePanel');if(!host||!data)return;const h=ensure();const positions=data.jogadores.map(p=>{const x=h.posicoes[p.id]||{andar:5,sala:'—'};return `<div class="hg-row"><b>${esc(p.nome)}</b><span>${x.andar}º • ${esc(x.sala)}</span><select class="control-select" onchange="HotelGame.setPosition('${p.id}',this.value,this.options[this.selectedIndex].dataset.room||'Corredor Central')"><option value="${x.andar}" data-room="${esc(x.sala)}">${x.andar}º • ${esc(x.sala)}</option>${[1,2,3,4,5,6,7,8,9].filter(n=>n!==Number(x.andar)).map(n=>`<option value="${n}" data-room="Corredor Central">${n}º • Corredor Central</option>`).join('')}</select></div>`}).join('');const pois=h.pois.map(p=>`<div class="hg-poi ${p.ativo?'':'off'}"><div><b>◈ ${esc(p.nome)}</b><small>${p.andar}º • ${esc(p.sala)} • ${esc(p.tipo)}</small></div><button class="dice-btn secondary" onclick="HotelGame.togglePOI('${p.id}')">${p.ativo?'ATIVO':'INATIVO'}</button></div>`).join('')||'<small class="muted">Nenhum ponto de interesse personalizado.</small>';host.innerHTML=`<div class="hg-head"><div><span class="eyebrow">V0.52 • MAPA DE JOGO</span><h2>Hotel — Estado Operacional</h2><p>Posições, portas e pontos de interesse são controlados pelo Mestre.</p></div></div><div class="hg-grid"><div><h3>Posições</h3>${positions}</div><div><h3>Pontos de interesse</h3>${pois}</div></div>`;}
  return {ensure,roomId,setDoor,setPosition,addPOI,togglePOI,render};
})();

