/* Hotel Espelho RPG — módulo consolidado. */

/* --- 10-campaign-engine.js --- */
/* V0.41 — Motor de Campanha
 * Estado narrativo central, atos, cenas, objetivos, consequências e relógio da sessão.
 */
const CampaignEngine = (() => {
  const ACTS = [
    {numero:1,nome:'O Pós-Evento & O Descanso',descricao:'Chegada ao hotel, descanso e primeiros sinais de anormalidade.'},
    {numero:2,nome:'O Despertar do Pesadelo',descricao:'A Grande Noite começa, o hotel é isolado e as ameaças surgem.'},
    {numero:3,nome:'A Corrida pela Sobrevivência',descricao:'Os personagens escolhem uma rota e lutam para sair vivos.'}
  ];
  const SCENES = [
    {id:'a1-chegada',ato:1,titulo:'Chegada ao Hotel',clima:'Normal',andar:5,texto:'Após o grande evento de Taekwondo, vocês chegam ao Hotel Espelho para descansar. O atendimento é impecável e nada parece fora do lugar.',objetivo:'Instalar-se no 5º andar e reconhecer o ambiente.',next:'a1-descanso'},
    {id:'a1-descanso',ato:1,titulo:'O Descanso',clima:'Normal',andar:5,texto:'O tempo passa. O hotel continua funcionando normalmente, mas pequenos ruídos começam a surgir nas tubulações e corredores.',objetivo:'Investigar o 5º andar sem chamar atenção.',next:'a1-primeiros-sinais'},
    {id:'a1-primeiros-sinais',ato:1,titulo:'Primeiros Sinais',clima:'Tensão',andar:5,texto:'As luzes piscam. Um elevador abre sozinho. Por um instante, o reflexo no espelho parece atrasado.',objetivo:'Encontrar a primeira pista sobre o que está acontecendo.',next:'a2-grande-noite'},
    {id:'a2-grande-noite',ato:2,titulo:'A Grande Noite',clima:'Grande Noite',andar:5,texto:'A energia cai. O silêncio toma o hotel e uma névoa cobre as janelas. O mundo exterior parece ter desaparecido.',objetivo:'Descobrir uma rota de fuga e sobreviver.',next:'a2-primeira-ameaca'},
    {id:'a2-primeira-ameaca',ato:2,titulo:'Primeira Ameaça',clima:'Terror',andar:4,texto:'Um ruído metálico ecoa do andar inferior. Algo está se movendo no hotel.',objetivo:'Investigar a ameaça ou encontrar uma rota segura.',next:'a2-descoberta'},
    {id:'a2-descoberta',ato:2,titulo:'A Verdade por Trás do Hotel',clima:'Terror',andar:5,texto:'As pistas começam a se conectar. O hotel não está apenas assombrado: ele está preso a uma manifestação paranormal.',objetivo:'Encontrar as quatro chaves e descobrir uma saída.',next:'a3-corrida'},
    {id:'a3-corrida',ato:3,titulo:'Corrida pela Sobrevivência',clima:'Perseguição',andar:5,texto:'A hora chegou. Com as pistas reunidas, vocês precisam escolher entre descer até o Hall ou subir até o Terraço.',objetivo:'Escolher e concluir uma rota de fuga.',next:null}
  ];
  function ensure(){
    if(!data)return null;
    const c=data.campanha;
    c.motor=c.motor||{};
    const m=c.motor;
    m.versao=m.versao||1;
    m.atoAtual=Math.max(1,Math.min(3,Number(m.atoAtual)||1));
    m.cenaAtualId=m.cenaAtualId||null;
    m.cenasHistorico=Array.isArray(m.cenasHistorico)?m.cenasHistorico:[];
    m.objetivos=Array.isArray(m.objetivos)?m.objetivos:[];
    m.consequencias=Array.isArray(m.consequencias)?m.consequencias:[];
    m.relogio=m.relogio||{hora:17,minuto:0,pausado:false};
    m.estado=m.estado||'Em andamento';
    m.sessao=m.sessao||{inicio:null,rodada:0};
    m.flags=(m.flags&&typeof m.flags==='object')?m.flags:{};
    if(!m.objetivos.length) m.objetivos=[{id:'obj-inicial',titulo:'Explorar o 5º andar',descricao:'Investigar os primeiros sinais e descobrir uma rota de fuga.',status:'Em andamento',tipo:'principal'}];
    if(!m.cenaAtualId){const first=SCENES[0];m.cenaAtualId=first.id; m.atoAtual=first.ato;}
    return m;
  }
  function currentScene(){const m=ensure();return SCENES.find(s=>s.id===m?.cenaAtualId)||null;}
  function save(){saveLocal();}
  function applyScene(scene,manual=false){if(!scene)return;const m=ensure();m.atoAtual=scene.ato;m.cenaAtualId=scene.id;m.cenasHistorico.unshift({id:scene.id,titulo:scene.titulo,ato:scene.ato,at:Date.now()});m.cenasHistorico=m.cenasHistorico.slice(0,50);data.campanha.andarAtual=Math.max(1,Math.min(9,Number(scene.andar)||5));data.campanha.objetivoAtual=scene.objetivo||data.campanha.objetivoAtual;data.campanha.eventoAtual=scene.titulo+' — '+scene.texto;const old=data.campanha.v039?.cenaAtual;if(data.campanha.v039){if(old)old.ativa=false;data.campanha.v039.cenaAtual={id:'engine-'+scene.id,titulo:scene.titulo,texto:scene.texto,clima:scene.clima,andar:scene.andar,at:Date.now(),ativa:true};data.campanha.v039.cenas=Array.isArray(data.campanha.v039.cenas)?data.campanha.v039.cenas:[];}
    if(scene.id==='a2-grande-noite'){m.flags.grandeNoite=true;data.campanha.horror=data.campanha.horror||{};data.campanha.horror.grandeNoite=true;}
    logAction(`Cena ativada: ${scene.titulo}.`);save();renderMaster();if(selectedPlayer)renderSheet();if(typeof showAlert==='function'&&manual)showAlert(scene.titulo,scene.texto,scene.clima==='Terror'||scene.clima==='Perseguição'?'danger':'warning');toast(`Cena: ${scene.titulo}`);
  }
  function nextScene(){const s=currentScene();const next=SCENES.find(x=>x.id===s?.next);if(!next)return toast('Esta cena não possui próxima cena.');applyScene(next,true);}
  function setAct(n){const act=ACTS.find(x=>x.numero===Number(n));if(!act)return;const scene=SCENES.find(x=>x.ato===act.numero);if(scene)applyScene(scene,true);}
  function addObjective(titulo,descricao='',tipo='secundario'){const m=ensure();const title=String(titulo||'').trim();if(!title)return null;const o={id:'obj-'+Date.now(),titulo:title,descricao:String(descricao||''),status:'Bloqueado',tipo};m.objetivos.push(o);save();refresh();return o;}
  function setObjectiveStatus(id,status){const m=ensure(),o=m.objetivos.find(x=>x.id===id);if(!o)return;o.status=['Bloqueado','Em andamento','Concluído'].includes(status)?status:'Em andamento';if(o.status==='Concluído')o.concluidaEm=Date.now();logAction(`Objetivo "${o.titulo}": ${o.status}.`);save();refresh();}
  function addConsequence(titulo,descricao){const m=ensure();m.consequencias.unshift({id:'con-'+Date.now(),titulo:String(titulo||'').trim(),descricao:String(descricao||'').trim(),at:Date.now()});m.consequencias=m.consequencias.slice(0,50);save();refresh();}
  function setFlag(key,value=true){const m=ensure();m.flags[key]=value;save();refresh();}
  function tick(minutes=10){const m=ensure();if(m.relogio.pausado)return;let total=(Number(m.relogio.hora)||0)*60+(Number(m.relogio.minuto)||0)+Number(minutes||0);total=((total%1440)+1440)%1440;m.relogio.hora=Math.floor(total/60);m.relogio.minuto=total%60;save();refresh();}
  function toggleClock(){const m=ensure();m.relogio.pausado=!m.relogio.pausado;save();refresh();}
  function formatTime(){const m=ensure();return `${String(m.relogio.hora).padStart(2,'0')}:${String(m.relogio.minuto).padStart(2,'0')}`;}
  function refresh(){if(typeof renderMaster==='function')renderMaster();if(selectedPlayer&&typeof renderSheet==='function')renderSheet();}
  return {ACTS,SCENES,ensure,currentScene,applyScene,nextScene,setAct,addObjective,setObjectiveStatus,addConsequence,setFlag,tick,toggleClock,formatTime,refresh};
})();


/* --- 12-puzzles.js --- */
/* V0.55.2 — Enigmas completos da campanha. Cada chave possui enunciado, dados, resposta, dica e consequência. */
const PuzzleEngine=(()=>{
  const DEFAULTS=[
    {id:'key1',chave:1,nome:'O Registro dos Hóspedes',local:'Andar 3 — Biblioteca',tipo:'Chave 1',categoria:'Código',
      descricao:'Na mesa há quatro fichas: 302 = 18:40, 305 = 19:25, 308 = 18:55 e 301 = 20:10. O bilhete diz: “Leia os horários do mais antigo para o mais recente e use o último algarismo do número do quarto.”',
      pista:'Ordene primeiro os quatro horários, sem alterar os números dos quartos.',
      solucao:'302 → 308 → 305 → 301',resposta:'2851',
      dica:'18:40, 18:55, 19:25, 20:10. Pegue o último dígito de 301, 308, 305 e 302? Não: confira a ordem correta: 302 (18:40), 308 (18:55), 305 (19:25), 301 (20:10). O código é 2851.',
      falha:'Uma tentativa incorreta faz o registro emitir um alarme e aumenta a tensão da cena; o Mestre pode iniciar um evento de horror.',
      recompensa:'Chave 1 — acesso à progressão da rota.',status:'bloqueado',tentativas:0},
    {id:'key2',chave:2,nome:'A Cozinha Trancada',local:'Andar 4 — Cozinha Industrial',tipo:'Chave 2',categoria:'Sequência',
      descricao:'Quatro símbolos aparecem na porta: 🔥 fogo, 💧 água, 🌬️ ar e 🩸 sangue. Uma receita encontrada na bancada traz as etapas: “Aquecer. Ferver. Ventilar. Temperar.” Associe cada etapa ao símbolo correspondente e pressione os símbolos nessa ordem.',
      pista:'A ordem está nas ações da receita, não na posição dos símbolos na porta.',
      solucao:'🔥 → 💧 → 🌬️ → 🩸',resposta:'FOGO AGUA AR SANGUE',
      dica:'Aquecer = fogo; ferver = água; ventilar = ar; temperar = sangue.',
      falha:'A cozinha reage ao erro: as luzes se apagam por alguns segundos e o Mestre pode gerar um evento de ameaça.',
      recompensa:'Chave 2 — acesso à progressão da rota.',status:'bloqueado',tentativas:0},
    {id:'key3',chave:3,nome:'O Corredor dos Espelhos',local:'Andar 5 — Sala de Jogos',tipo:'Chave 3',categoria:'Observação',
      descricao:'Há três espelhos lado a lado. Ao levantar a mão direita, os reflexos fazem o mesmo. Ao fechar os olhos, dois reflexos fecham os olhos; um permanece olhando diretamente para você. O reflexo do espelho do meio é o único que respeita o movimento de fechar os olhos.',
      pista:'O reflexo verdadeiro deve repetir tudo o que você faz, inclusive fechar os olhos.',
      solucao:'Espelho 2 — o reflexo do meio.',resposta:'ESPELHO 2',
      dica:'Peça ao Mestre para numerar os espelhos da esquerda para a direita. O correto é o que fecha os olhos junto com o personagem.',
      falha:'Um reflexo errado sorri e a iluminação da sala oscila; o Mestre pode iniciar uma manifestação de Conhecimento.',
      recompensa:'Chave 3 — acesso à progressão da rota.',status:'bloqueado',tentativas:0},
    {id:'key4',chave:4,nome:'A Sala de Segurança',local:'Andar 2 — Sala de Segurança',tipo:'Chave 4',categoria:'Investigação',
      descricao:'O painel pede o horário de um acesso impossível. No log aparecem: 21:10 — Recepção; 21:25 — Quarto 204; 21:40 — “Sem identificação”; 21:55 — Recepção. A pista encontrada no monitor diz: “O único acesso que não poderia existir abre a porta.”',
      pista:'Procure a linha que não possui uma pessoa ou local identificável.',
      solucao:'21:40',resposta:'2140',
      dica:'Não procure o horário mais antigo ou mais recente. Procure o registro que não deveria existir.',
      falha:'O painel bloqueia por 30 segundos e registra a tentativa; o Mestre pode acrescentar uma consequência temporal ou de perseguição.',
      recompensa:'Chave 4 — acesso à saída.',status:'bloqueado',tentativas:0}
  ];
  function ensure(){
    if(!data)return null;
    data.campanha.puzzleEngine=data.campanha.puzzleEngine||{};
    const p=data.campanha.puzzleEngine;
    p.chaves=Array.isArray(p.chaves)?p.chaves:DEFAULTS.map(x=>({...x}));
    // Completa campos ausentes de versões anteriores sem apagar progresso.
    DEFAULTS.forEach(def=>{const k=p.chaves.find(x=>Number(x.chave)===def.chave);if(k)Object.keys(def).forEach(key=>{if(k[key]===undefined)k[key]=def[key];});});
    p.tentativas=p.tentativas&&typeof p.tentativas==='object'?p.tentativas:{};
    p.dicas=p.dicas&&typeof p.dicas==='object'?p.dicas:{};
    return p;
  }
  function key(n){return ensure()?.chaves.find(x=>Number(x.chave)===Number(n));}
  function setStatus(n,status){
    const k=key(n);if(!k)return;
    k.status=['bloqueado','em-andamento','resolvido'].includes(status)?status:'em-andamento';
    if(k.status==='resolvido'){
      data.campanha.chavesEncontradas=Array.isArray(data.campanha.chavesEncontradas)?data.campanha.chavesEncontradas:[];
      if(!data.campanha.chavesEncontradas.includes(Number(n)))data.campanha.chavesEncontradas.push(Number(n));
    } else data.campanha.chavesEncontradas=(data.campanha.chavesEncontradas||[]).filter(x=>Number(x)!==Number(n));
    logAction(`Chave ${n}: ${k.status}.`);saveLocal();renderMaster();if(selectedPlayer)renderSheet();toast(k.status==='resolvido'?`Chave ${n} obtida`:'Status da chave atualizado');
  }
  function toggle(n){const k=key(n);if(!k)return;setStatus(n,k.status==='resolvido'?'em-andamento':'resolvido');}
  function attempt(n,answer){
    const k=key(n);if(!k)return false;const a=String(answer||'').trim();k.tentativas=(Number(k.tentativas)||0)+1;ensure().tentativas[n]=k.tentativas;
    logAction(`Tentativa no enigma ${n}: ${a||'sem resposta'}.`);saveLocal();renderMaster();if(selectedPlayer)renderSheet();return a;
  }
  function hint(n,text){ensure().dicas[n]=String(text||'').trim();saveLocal();renderMaster();if(selectedPlayer)renderSheet();}
  return {DEFAULTS,ensure,key,setStatus,toggle,attempt,hint};
})();


/* --- 16-integrity.js --- */
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


/* --- 17-state-machine.js --- */
/* V0.44 — Máquina de estados da campanha. Regras de transição ficam centralizadas. */
const CampaignState=(()=>{
  const STATES=['Em andamento','Pausada','Grande Noite','Finalizada'];
  function ensure(){const m=CampaignEngine.ensure();m.transicoes=Array.isArray(m.transicoes)?m.transicoes:[];m.estado=STATES.includes(m.estado)?m.estado:'Em andamento';return m;}
  function setState(state){const m=ensure();if(!STATES.includes(state))return;const old=m.estado;m.estado=state;m.transicoes.unshift({de:old,para:state,at:Date.now()});if(state==='Grande Noite'){m.flags.grandeNoite=true;data.campanha.horror=data.campanha.horror||{};data.campanha.horror.grandeNoite=true;}if(state==='Finalizada')m.flags.campanhaFinalizada=true;logAction(`Estado da campanha: ${old} → ${state}.`);saveLocal();CampaignEngine.refresh();toast(`Campanha: ${state}`);}
  function transitionToScene(id){const m=ensure(),scene=CampaignEngine.SCENES.find(s=>s.id===id);if(!scene)return false;const current=CampaignEngine.currentScene();if(current&&scene.ato<current.ato)return false;CampaignEngine.applyScene(scene,true);if(scene.id==='a2-grande-noite')setState('Grande Noite');return true;}
  function canAdvance(){const m=ensure();if(m.estado==='Finalizada'||m.estado==='Pausada')return false;return true;}
  return {STATES,ensure,setState,transitionToScene,canAdvance};
})();


/* --- 20-killer-ai.js --- */
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


/* --- 22-campaign-state-save.js --- */
/* V0.43 — Salvamento robusto: autosave, slots, backups e histórico. */
const CampaignStorage=(()=>{
  const KEY='op-fichas-state';
  function ensure(){data.campanha.storage=data.campanha.storage||{};const s=data.campanha.storage;s.autosave=s.autosave!==false;s.slot=s.slot||'principal';s.ultimoSalvamento=s.ultimoSalvamento||null;s.historico=Array.isArray(s.historico)?s.historico:[];return s;}
  function save(reason='manual'){const s=ensure();if(!s.autosave&&reason==='autosave')return;s.ultimoSalvamento=Date.now();s.historico.unshift({reason,at:s.ultimoSalvamento});s.historico=s.historico.slice(0,30);try{if(typeof saveLocal==='function')saveLocal();else localStorage.setItem(KEY,JSON.stringify(data));}catch(e){console.error(e);toast('Não foi possível salvar: armazenamento indisponível.');}}
  function toggleAutosave(){const s=ensure();s.autosave=!s.autosave;save('configuração');CampaignEngine.refresh();toast(`Autosave ${s.autosave?'ativado':'desativado'}.`);}
  function slot(name){const s=ensure();s.slot=String(name||'principal').slice(0,30);save('slot');}
  function backup(){IntegrityEngine.backup();}
  return {ensure,save,toggleAutosave,slot,backup};
})();


/* --- 31-rituals.js --- */
/* V0.56 — Grimório de Rituais. Catálogo baseado na Lista de Rituais do livro Ordem Paranormal RPG v1.3 (p. 122-123). Apenas nome, elemento/tipo e círculo; regras completas permanecem no livro. */
let RITUAL_CATALOG = [];
let RITUAL_CATALOG_READY = false;
async function loadRitualCatalog(){
  try{
    const response=await fetch('rituais.json?ts='+Date.now(),{cache:'no-store'});
    if(!response.ok) throw new Error('HTTP '+response.status);
    const payload=await response.json();
    const list=Array.isArray(payload)?payload:payload.rituais;
    if(!Array.isArray(list)||!list.length) throw new Error('Catálogo vazio');
    RITUAL_CATALOG=list.map((r,i)=>({id:r.id||`ritual_${String(i+1).padStart(3,'0')}`,nome:String(r.nome||''),tipo:String(r.tipo||''),circulo:Number(r.circulo)||1,custo:Number(r.custo)||({1:1,2:3,3:6,4:10}[Number(r.circulo)]||1),dano:String(r.dano||'')})).filter(r=>r.nome&&r.tipo&&[1,2,3,4].includes(r.circulo));
    RITUAL_CATALOG_READY=true;
    return true;
  }catch(error){
    console.error('Erro ao carregar rituais.json:',error);
    toast('Não foi possível carregar rituais.json.');
    RITUAL_CATALOG=[]; RITUAL_CATALOG_READY=false;
    return false;
  }
}

const RITUAL_DAMAGE = {
  'cinerária|medo|1':'10d6', 'chamas do caos|energia|2':'4d6', 'cicatrização|morte|1':'3d8+3',
  'contenção fantasmagórica|energia|2':'2d6+2', 'consumir manancial|morte|1':'3d6', 'decadência|morte|1':'2d8+2',
  'deflagração de energia|energia|4':'3d10x10', 'descarnar|sangue|2':'6d8', 'eletrocussão|energia|1':'3d6',
  'flagelo de sangue|sangue|2':'10d6', 'hemofagia|sangue|2':'6d6', 'inexistir|conhecimento|4':'10d12+10',
  'invadir mente|conhecimento|2':'6d6', 'lâmina do medo|medo|4':'10d8', 'miasma entrópico|morte|2':'4d8',
  'paradoxo|morte|2':'6d6', 'perturbação|conhecimento|1':'3d8', 'purgatório|sangue|3':'6d6',
  'vomitar pestes|sangue|3':'4d8'
};

function ritualKey(nome,tipo,circulo){ return `${String(nome).trim().toLowerCase()}|${String(tipo).trim().toLowerCase()}|${Number(circulo)}`; }

function ensureRitualState(player){
  if(!player) return;
  if(!Array.isArray(player.rituais)) player.rituais=[];
  player.rituais=player.rituais.map(r=>{const nome=String(r.nome||'').trim(),tipo=String(r.tipo||'').trim(),circulo=Number(r.circulo)||1; const cat=RITUAL_CATALOG.find(x=>ritualKey(x.nome,x.tipo,x.circulo)===ritualKey(nome,tipo,circulo)); return {nome,tipo,circulo,custo:Number(r.custo)||cat?.custo||({1:1,2:3,3:6,4:10}[circulo]||1),dano:String(r.dano||cat?.dano||''),disponivel:r.disponivel!==false};}).filter(r=>r.nome&&r.tipo&&[1,2,3,4].includes(r.circulo));
}
function ritualCatalogOptions(player){
  ensureRitualState(player);
  const known=new Set(player.rituais.map(r=>ritualKey(r.nome,r.tipo,r.circulo)));
  const available=RITUAL_CATALOG.filter(r=>!known.has(ritualKey(r.nome,r.tipo,r.circulo)));
  return [1,2,3,4].map(c=>{
    const list=available.filter(r=>Number(r.circulo)===c);
    return list.length?`<optgroup label="${c}º CÍRCULO">${list.map(r=>`<option value="${r.id}">${esc(r.nome)} — ${esc(r.tipo)} • ${r.custo} PE</option>`).join('')}</optgroup>`:'';
  }).join('');
}
function addRitualToPlayer(pid, ritualId){
  const p=data.jogadores.find(x=>x.id===pid), r=RITUAL_CATALOG.find(x=>x.id===ritualId); if(!p||!r||p.classe!=='Ocultista') return;
  ensureRitualState(p); if(p.rituais.some(x=>ritualKey(x.nome,x.tipo,x.circulo)===ritualKey(r.nome,r.tipo,r.circulo))) return toast('Esse ritual já está na ficha.');
  const maxCircle=p.classe==='Ocultista'?(Number(String(p.nex||'5').replace('%',''))>=85?4:Number(String(p.nex||'5').replace('%',''))>=55?3:Number(String(p.nex||'5').replace('%',''))>=25?2:1):1;
  if(Number(r.circulo)>maxCircle)return toast(`Este personagem ainda não pode conjurar ${r.circulo}º círculo no NEX ${p.nex}.`);
  p.rituais.push({nome:r.nome,tipo:r.tipo,circulo:r.circulo,custo:r.custo,dano:r.dano,disponivel:true});
  logAction(`${p.nome}: ritual adicionado — ${r.nome} (${r.tipo}, ${r.circulo}º círculo).`); saveLocal(); renderMaster(); if(selectedPlayer?.id===pid){selectedPlayer=p;renderSheet();} toast(`Ritual adicionado: ${r.nome}`);
}
function removeRitualFromPlayer(pid,index){
  const p=data.jogadores.find(x=>x.id===pid); if(!p)return; ensureRitualState(p); const r=p.rituais[index]; if(!r)return;
  p.rituais.splice(index,1); logAction(`${p.nome}: ritual removido — ${r.nome}.`); saveLocal(); renderMaster(); if(selectedPlayer?.id===pid){selectedPlayer=p;renderSheet();} toast('Ritual removido');
}
function toggleRitualAvailability(pid,index){
  const p=data.jogadores.find(x=>x.id===pid); if(!p)return; ensureRitualState(p); const r=p.rituais[index]; if(!r)return;
  r.disponivel=!r.disponivel; logAction(`${p.nome}: ritual ${r.nome} ${r.disponivel?'liberado':'bloqueado'} para o jogador.`); saveLocal(); renderMaster(); if(selectedPlayer?.id===pid){selectedPlayer=p;renderSheet();} toast(r.disponivel?'Ritual liberado':'Ritual ocultado do jogador');
}
function ritualPlayerBlock(p){
  if(p.classe!=='Ocultista') return '';
  ensureRitualState(p); const list=p.rituais.filter(r=>r.disponivel);
  const content=list.length ? [1,2,3,4].map(c=>{
    const xs=list.filter(r=>r.circulo===c);
    return xs.length?`<div class="ritual-circle"><span>${c}º CÍRCULO</span>${xs.map((r,idx)=>{
      const globalIndex=list.indexOf(r);
      const usage=r.teste||r.uso||`Ocultismo vs DT ${20+(Number(r.custo)||1)}`;
      const damage=r.dano||'';
      return `<div class="ritual-row"><div class="ritual-main"><b>${esc(r.nome)}</b><small>${esc(r.tipo)} • ${r.circulo}º círculo${usage?` • Utilização: ${esc(usage)}`:''}${damage?` • Dano: ${esc(damage)}`:''}</small></div><div class="ritual-actions"><button class="dice-btn" data-use-ritual="${p.id}" data-ritual-index="${globalIndex}">UTILIZAR</button>${damage?`<button class="dice-btn secondary" data-ritual-damage="${p.id}" data-ritual-index="${globalIndex}">DANO</button>`:''}</div></div>`;
    }).join('')}</div>`:'';
  }).join('') : '<p class="muted">Nenhum ritual foi liberado pelo Mestre.</p>';
  return `<div class="panel rituals-player-panel"><div class="panel-title"><div><span class="icon">✦</span><div><h2>Rituais Conhecidos</h2><p>Rituais liberados pelo Mestre. O botão UTILIZAR faz o teste de Ocultismo do Custo do Paranormal e, quando houver dano direto cadastrado, realiza a rolagem de dano.</p></div></div></div>${content}</div>`;
}
function useRitual(pid,index,damage=false){
  const p=data.jogadores.find(x=>x.id===pid); if(!p)return; ensureRitualState(p); const r=p.rituais.filter(x=>x.disponivel)[index]; if(!r)return;
  if(damage && !r.dano) return toast('Este ritual não possui dano direto cadastrado.');
  if(damage) return openRitualDamageDice(pid,index);
  openRitualCastDice(pid,index);
}
function ritualOccultismBonus(p){
  const sk=(p.pericias||[]).find(x=>String(x.nome||'').toLowerCase()==='ocultismo');
  const attr=Number(p.atributos?.INT)||0;
  return attr+(sk?.treinada?5:0);
}
function openRitualCastDice(pid,index){
  const p=data.jogadores.find(x=>x.id===pid); if(!p)return; ensureRitualState(p); const r=p.rituais.filter(x=>x.disponivel)[index]; if(!r)return;
  const cost=Number(r.custo)||({1:1,2:3,3:6,4:10}[Number(r.circulo)]||1);
  if(Number(p.pe)<cost) return toast(`PE insuficiente. Este ritual custa ${cost} PE.`);
  p.pe=Math.max(0,Number(p.pe)-cost);
  if(String(r.tipo).toLowerCase()==='medo'){
    p.san=Math.max(0,Number(p.san)-cost);
    p.sanMax=Math.max(0,Number(p.sanMax||0)-1); logAction(`${p.nome}: conjurou ${r.nome} (Medo) — custo ${cost} PE e ${cost} SAN + 1 SAN permanente.`);
    saveLocal(); renderSheet();
    diceState={type:'ritual',pid,ritual:r,title:`${r.nome} — Conjuração`,formula:'—',dt:null,ritualAuto:true,ritualCost:cost};
    $('#diceTitle').textContent=diceState.title;
    $('#diceFormula').textContent=`MEDO • ${cost} PE • sem teste de Custo do Paranormal`;
    $('#diceResult').textContent='✓'; $('#diceOutcome').textContent='✓ RITUAL FUNCIONOU'; $('#diceOutcome').className='dice-outcome success';
    $('#diceBreakdown').textContent=`Custo: ${cost} PE • Sanidade: −${cost} SAN • −1 SAN permanente`;
    if(r.dano) setTimeout(()=>rollRitualDamage(pid,r),120);
    $('#diceDTWrap').style.display='none'; $('#rollAgain').style.display='none'; $('#diceModal').classList.add('show');
    return;
  }
  const dt=20+cost, bonus=ritualOccultismBonus(p);
  diceState={type:'ritual',pid,ritual:r,title:`${r.nome} — Custo do Paranormal`,formula:`1d20${bonus>=0?'+':''}${bonus}`,dt,skill:true,ritualAuto:true,ritualCost:cost};
  $('#diceTitle').textContent=diceState.title;
  $('#diceFormula').textContent=`Ocultismo • ${diceState.formula} • DT ${dt}`;
  $('#diceResult').textContent='—'; $('#diceBreakdown').textContent=''; $('#diceOutcome').textContent=''; $('#diceOutcome').className='dice-outcome';
  $('#diceDTWrap').style.display='block'; $('#diceDT').value=dt; $('#diceDT').disabled=true; $('#rollAgain').style.display='none'; $('#diceModal').classList.add('show'); roll();
}
function rollRitualDamage(pid,r){
  if(!r?.dano) return;
  const formula=String(r.dano).replace(/\s/g,'');
  const m=formula.match(/^(\d+)d(\d+)([+-]\d+)?(?:x(\d+))?$/i);
  if(!m) return;
  const n=Number(m[1]),s=Number(m[2]),mod=Number(m[3]||0),mult=Number(m[4]||1);
  const rolls=Array.from({length:n},()=>Math.floor(Math.random()*s)+1); const subtotal=rolls.reduce((a,b)=>a+b,0)+mod; const total=subtotal*mult;
  const old=$('#diceBreakdown').textContent; const multText=mult!==1?` × ${mult}`:'';
  $('#diceBreakdown').textContent=`${old}\nDANO: ${rolls.join(' + ')}${mod?` ${mod>0?'+ ':''}${mod}`:''}${multText} = ${total} (${r.tipo})`;
  logAction(`${data.jogadores.find(x=>x.id===pid)?.nome||''}: dano de ${r.nome} → ${total}.`); saveLocal();
}

function openRitualDamageDice(pid,index){
  const p=data.jogadores.find(x=>x.id===pid); if(!p)return; ensureRitualState(p); const r=p.rituais.filter(x=>x.disponivel)[index]; if(!r?.dano)return toast('Este ritual não possui dano direto cadastrado.');
  diceState={type:'ritual-damage',pid,ritual:r,title:`${r.nome} — Dano`,formula:r.dano};
  $('#diceTitle').textContent=diceState.title; $('#diceFormula').textContent=`Dano ${r.tipo} • ${r.dano}`; $('#diceResult').textContent='—'; $('#diceBreakdown').textContent=''; $('#diceOutcome').textContent=''; $('#diceOutcome').className='dice-outcome'; $('#diceDTWrap').style.display='none'; $('#rollAgain').style.display='none'; $('#diceModal').classList.add('show');
  rollRitualDamage(pid,r);
  const last=$('#diceBreakdown').textContent.split('\n').pop(); const match=last.match(/= ([-0-9]+)/); $('#diceResult').textContent=match?match[1]:'—';
}

function ritualMasterBlock(p){
  if(p.classe!=='Ocultista') return '';
  ensureRitualState(p);
  const list=p.rituais.length?p.rituais.map((r,i)=>`<div class="master-ritual-row"><div><b>${esc(r.nome)}</b><small>${esc(r.tipo)} • ${r.circulo}º círculo • ${r.custo||1} PE${r.dano?` • Dano ${esc(r.dano)}`:''} • ${r.disponivel?'Liberado':'Oculto do jogador'}</small></div><button class="dice-btn secondary" data-toggle-ritual="${p.id}" data-ritual-index="${i}">${r.disponivel?'OCULTAR':'LIBERAR'}</button><button class="dice-btn danger" data-remove-ritual="${p.id}" data-ritual-index="${i}">REMOVER</button></div>`).join(''):'<small class="muted">Nenhum ritual cadastrado.</small>';
  const options=ritualCatalogOptions(p);
  const pending=p.classe==='Ocultista'?Math.max(0,3-p.rituais.filter(r=>Number(r.circulo)===1).length):0;
  return `<details class="master-rituals"><summary>GRIMÓRIO / RITUAIS</summary>${pending?`<div class="ritual-pending"><b>⚠ ${pending} ritual(is) inicial(is) pendente(s)</b><small>No NEX 5%, o Ocultista começa com três rituais de 1º círculo. O Mestre deve escolhê-los no catálogo abaixo.</small></div>`:''}<div class="master-ritual-list">${list}</div><div class="master-ritual-add"><select class="control-select" data-ritual-select="${p.id}"><option value="">Adicionar ritual do livro...</option>${options}</select><button class="dice-btn" data-add-ritual="${p.id}">ADICIONAR</button></div><small class="muted">Catálogo v1.3. Custo e Custo do Paranormal seguem o livro; alcance, resistência, duração e efeitos completos permanecem no livro.</small></details>`;
}

window.ensureRitualState=ensureRitualState;
window.ritualPlayerBlock=ritualPlayerBlock;
window.ritualMasterBlock=ritualMasterBlock;
window.addRitualToPlayer=addRitualToPlayer;
window.removeRitualFromPlayer=removeRitualFromPlayer;
window.toggleRitualAvailability=toggleRitualAvailability;
window.useRitual=useRitual;
(function(){
  document.addEventListener('click',e=>{
    const use=e.target.closest('[data-use-ritual]'); if(use){useRitual(use.dataset.useRitual,+use.dataset.ritualIndex,false); return;}
    const dmg=e.target.closest('[data-ritual-damage]'); if(dmg){useRitual(dmg.dataset.ritualDamage,+dmg.dataset.ritualIndex,true); return;}
  });
  const oldRenderSheet=window.renderSheet;
  if(typeof oldRenderSheet==='function'){
    window.renderSheet=function(){ if(selectedPlayer) ensureRitualState(selectedPlayer); return oldRenderSheet.apply(this,arguments); };
  }
})();


/* --- 32-rules-engine.js --- */
/* V0.58 — Motor de regras base. Ordem Paranormal RPG v1.3. */
const RuleEngine=(()=>{
  const ATTR={FOR:'Força',AGI:'Agilidade',INT:'Intelecto',PRE:'Presença',VIG:'Vigor'};
  function ensure(p){
    if(!p)return null;
    p.recursos=Array.isArray(p.recursos)?p.recursos:[];
    p.condicoes=Array.isArray(p.condicoes)?p.condicoes:[];
    p.historicoRolagens=Array.isArray(p.historicoRolagens)?p.historicoRolagens:[];
    return p;
  }
  function rollD20(attribute){
    const a=Number(attribute)||0;
    const count=a>0?a:2;
    const rolls=Array.from({length:count},()=>Math.floor(Math.random()*20)+1);
    return {rolls,result:a>0?Math.max(...rolls):Math.min(...rolls),modo:a>0?'melhor':'pior'};
  }
  function skillBonus(p,skill){const grau=skill?.grau|| (skill?.treinada?'treinado':'nao_treinada');const treino=grau==='expert'?15:grau==='veterano'?10:skill?.treinada?5:0;return treino+(typeof originSkillBonus==='function'?originSkillBonus(p,skill):0);}
  function testAttribute(p,attribute,dt=10){
    const result=rollD20(p?.atributos?.[attribute]); const total=result.result; return {tipo:'atributo',attribute,rolls:result.rolls,total,dt:Number(dt)||10,sucesso:total>=Number(dt||10),modo:result.modo};
  }
  function testSkill(p,skill,dt=10,extra=0){
    const attr=String(skill?.atributo||'INT');const value=attr==='INT/PRE'?Math.max(Number(p?.atributos?.INT)||0,Number(p?.atributos?.PRE)||0):Number(p?.atributos?.[attr])||0;
    const result=rollD20(value);const bonus=skillBonus(p,skill)+Number(extra||0);const total=result.result+bonus;
    return {tipo:'pericia',pericia:skill.nome,atributo:attr,rolls:result.rolls,bonus,total,dt:Number(dt)||10,sucesso:total>=Number(dt||10),modo:result.modo};
  }
  function testSkillDiceModifier(p,skill,dt=10,diceModifier=0,extra=0){
    const attr=String(skill?.atributo||'INT');const value=attr==='INT/PRE'?Math.max(Number(p?.atributos?.INT)||0,Number(p?.atributos?.PRE)||0):Number(p?.atributos?.[attr])||0;
    const baseCount=value>0?value:2; const count=Math.max(1,baseCount+Number(diceModifier||0)); const rolls=Array.from({length:count},()=>Math.floor(Math.random()*20)+1); const result=diceModifier<0?Math.min(...rolls):Math.max(...rolls); const bonus=skillBonus(p,skill)+Number(extra||0); const total=result+bonus;
    return {tipo:'pericia',pericia:skill.nome,atributo:attr,rolls,bonus,total,dt:Number(dt)||10,sucesso:total>=Number(dt||10),modo:'modificador de dados'};
  }
  function resist(p,tipo){
    const skill=(p?.pericias||[]).find(s=>String(s.nome).toLowerCase()===String(tipo||'').toLowerCase());
    if(!skill)return null; return testSkill(p,skill,10);
  }
  function applyResource(p,key,delta,reason=''){
    ensure(p);const max=Number(p[key+'Max'])||0;const old=Number(p[key])||0;const next=Math.max(0,Math.min(max,old+Number(delta||0)));p[key]=next;
    p.recursos.unshift({at:Date.now(),recurso:key,delta:next-old,antes:old,depois:next,motivo:reason});p.recursos=p.recursos.slice(0,50);return {old,next,delta:next-old};
  }
  function spend(p,key,cost,reason=''){const n=Math.max(0,Number(cost)||0);if((Number(p?.[key])||0)<n)return false;applyResource(p,key,-n,reason);return true;}
  function heal(p,key,amount,reason='Cura'){return applyResource(p,key,Math.max(0,Number(amount)||0),reason);}
  function damage(p,key,amount,reason='Dano'){return applyResource(p,key,-Math.max(0,Number(amount)||0),reason);}
  function recordRoll(p,entry){ensure(p);p.historicoRolagens.unshift({...entry,at:Date.now()});p.historicoRolagens=p.historicoRolagens.slice(0,50);}

  function maxRitualCircle(p){const n=classNexNumber(p);return n>=85?4:n>=55?3:n>=25?2:1;}
  function classNexNumber(p){return Math.max(5,Math.min(99,parseInt(String(p?.nex||'5'),10)||5));}
  function setNex(pid,nex){
    const p=data.jogadores.find(x=>x.id===pid);if(!p)return false;const next=Math.max(5,Math.min(99,Number(nex)||5));const old=classNexNumber(p);p.nex=`${next}%`;
    if(p.classe){const before={pv:p.pvMax,pe:p.peMax,san:p.sanMax};const d=classDerivedResources(p,p.classe);p.pvMax=d.pvMax;p.peMax=d.peMax;p.sanMax=d.sanMax;p.defesa=d.defesa;p.pv=Math.min(p.pv+(d.pvMax-before.pv),p.pvMax);p.pe=Math.min(p.pe+(d.peMax-before.pe),p.peMax);p.san=Math.min(p.san+(d.sanMax-before.san),p.sanMax);}
    logAction(`${p.nome}: NEX ${old}% → ${next}%.`);saveLocal();renderMaster();if(selectedPlayer?.id===pid)renderSheet();return true;
  }
  function elementalRelation(source,target){
    const next={Sangue:'Conhecimento',Conhecimento:'Energia',Energia:'Morte',Morte:'Sangue'};
    if(!source||!target||source==='Medo'||target==='Medo')return 'neutro';
    if(next[source]===target)return 'opressor';
    if(next[target]===source)return 'oprimido';
    if(source===target)return 'mesmo';
    return 'neutro';
  }
  function resistanceModifier(source,target){const r=elementalRelation(source,target);return r==='opressor'?-2:r==='mesmo'?2:0;}
  return {ATTR,ensure,rollD20,testAttribute,testSkill,testSkillDiceModifier,resist,applyResource,spend,heal,damage,recordRoll,maxRitualCircle,setNex,elementalRelation,resistanceModifier};
})();


/* --- 33-conditions.js --- */
/* V0.59 — Condições, durações e recursos. */
const ConditionEngine=(()=>{
  const C={
    Alquebrado:'O custo em PE das habilidades e rituais aumenta em +1.',Apavorado:'Sofre penalidade em testes de perícia e deve fugir da fonte do medo quando possível.',Asfixiado:'Não pode respirar; após o limite de Vigor, faz Fortitude progressiva ou perde PV.',Atordoado:'Fica desprevenido e não pode fazer ações.',Caído:'Sofre penalidade em ataques corpo a corpo e Defesa; bônus contra ataques à distância.',Cego:'Fica desprevenido e lento; não pode observar e sofre penalidades em perícias de FOR/AGI.',Confuso:'Comporta-se aleatoriamente no início dos turnos.',Debilitado:'Sofre penalidade em testes de Agilidade, Força e Vigor; nova aplicação piora a condição.',Desprevenido:'−5 Defesa e penalidade em Reflexos.',Doente:'Sob efeito de doença.','Em Chamas':'Sofre 1d6 de fogo no início do turno.',Fascinado:'Atenção presa; sofre penalidade em Percepção e não pode agir fora do foco.',Fatigado:'Fica fraco e vulnerável; nova aplicação torna-se exausto.',Fraco:'Sofre penalidade em testes de Agilidade, Força e Vigor; nova aplicação torna-se debilitado.',Frustrado:'Sofre penalidade em testes de Intelecto e Presença.',Imóvel:'Deslocamento reduzido a 0m.',Inconsciente:'Indefeso e sem ações, incluindo reações.',Indefeso:'Desprevenido, −10 Defesa e falha automaticamente em Reflexos.',Lento:'Deslocamento pela metade e não pode correr ou investir.',Machucado:'Metade ou menos dos PV máximos.',Morrendo:'Com 0 PV; acumula turnos morrendo e pode exigir Medicina para estabilizar.',Ofuscado:'Sofre penalidade em ataques e Percepção.',Paralisado:'Imóvel e indefeso; apenas ações puramente mentais.',Pasmo:'Não pode fazer ações.',Perturbado:'Na primeira ocorrência da cena, recebe um efeito de insanidade.',Petrificado:'Inconsciente e resistência a dano 10.',Sangrando:'Teste de Vigor no início do turno; falha causa 1d6 PV e mantém a condição.'
  };
  function ensure(p){if(!p)return null;p.condicoes=Array.isArray(p.condicoes)?p.condicoes:[];return p.condicoes;}
  function add(pid,nome,rodadas=null,origem='Mestre'){const p=data.jogadores.find(x=>x.id===pid);if(!p||!C[nome])return false;const list=ensure(p);const existing=list.find(x=>x.nome===nome);if(existing){existing.rodadas=rodadas==null?existing.rodadas:rodadas;return true;}list.push({nome,rodadas:rodadas==null?null:Number(rodadas),origem,at:Date.now()});saveLocal();renderMaster();if(selectedPlayer?.id===pid)renderSheet();return true;}
  function remove(pid,nome){const p=data.jogadores.find(x=>x.id===pid);if(!p)return;ensure(p);p.condicoes=p.condicoes.filter(x=>x.nome!==nome);saveLocal();renderMaster();if(selectedPlayer?.id===pid)renderSheet();}
  function tick(){data.jogadores.forEach(p=>{ensure(p);p.condicoes.forEach(c=>{if(Number.isFinite(c.rodadas)){c.rodadas--;}});p.condicoes=p.condicoes.filter(c=>c.rodadas==null||c.rodadas>0);});saveLocal();}
  function renderPlayer(p){const list=ensure(p);return list.length?list.map(c=>`<span class="condition-chip" title="${esc(C[c.nome]||'')}">${esc(c.nome)}${c.rodadas!=null?` • ${c.rodadas}r`:''}</span>`).join(''):'<small class="muted">Nenhuma condição ativa.</small>';}
  return {C,ensure,add,remove,tick,renderPlayer};
})();
(function(){
  function ensureMasterPanel(){
    if(!data||!$('#masterScreen'))return null;let host=$('#conditionsV059Panel');if(!host){host=document.createElement('div');host.id='conditionsV059Panel';host.className='panel conditions-v059-panel';const anchor=$('#masterPlayers');anchor?.after(host);}return host;}
  function renderMasterPanel(){const host=ensureMasterPanel();if(!host||!data)return;const rows=data.jogadores.map(p=>`<div class="condition-master-row"><b>${esc(p.nome)}</b><div class="condition-master-actions"><select id="cond-${p.id}" class="control-select">${Object.keys(ConditionEngine.C).map(c=>`<option>${esc(c)}</option>`).join('')}</select><input id="condr-${p.id}" class="control-input" type="number" min="1" max="99" placeholder="rodadas"><button class="dice-btn" onclick="ConditionEngine.add('${p.id}',$('#cond-${p.id}').value,$('#condr-${p.id}').value||null)">APLICAR</button></div><div class="condition-chips">${ConditionEngine.renderPlayer(p)}</div></div>`).join('');host.innerHTML=`<div class="panel-title"><div><span class="icon">◉</span><div><h2>Condições & Estados</h2><p>Controle de condições conforme a referência do livro. Duração em rodadas é opcional e fica sob controle do Mestre.</p></div></div></div>${rows}`;}
  const oldMaster=window.renderMaster; if(typeof oldMaster==='function'){window.renderMaster=function(){oldMaster.apply(this,arguments);renderMasterPanel();};}
  const oldSheet=window.renderSheet; if(typeof oldSheet==='function'){window.renderSheet=function(){oldSheet.apply(this,arguments);if(selectedPlayer&&$('#sheetContent')){let host=$('#playerConditionsV059');if(!host){host=document.createElement('div');host.id='playerConditionsV059';host.className='panel player-conditions-v059';$('#sheetContent')?.prepend(host);}host.innerHTML=`<div class="panel-title"><div><span class="icon">◉</span><div><h2>Condições</h2><p>Estados atuais do personagem.</p></div></div></div><div class="condition-chips">${ConditionEngine.renderPlayer(selectedPlayer)}</div>`;}};}
})();


/* --- 37-final-rules.js --- */
/* V0.62 — Fechamento de regras para sessão presencial. Complementa os módulos anteriores sem exigir servidor. */
(function(){
  const NEX_STEPS=[5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,99];
  const NEX_LIMIT={5:1,10:2,15:3,20:4,25:5,30:6,35:7,40:8,45:9,50:10,55:11,60:12,65:13,70:14,75:15,80:16,85:17,90:18,95:19,99:20};
  function nexValue(p){return Math.max(5,Math.min(99,parseInt(String(p?.nex||5).replace('%',''),10)||5));}
  function peLimit(p){
    const n=nexValue(p); let k=NEX_STEPS.reduce((a,b)=>b<=n?b:a,5); let bonus=0;
    const ob=typeof getOriginProfile==='function'?getOriginProfile(p)?.bonus||{}:{};
    bonus+=Number(ob.peTurno||0);
    return (NEX_LIMIT[k]||1)+bonus;
  }
  function refreshResourceDerived(p){
    if(!p?.classe || typeof classDerivedResources!=='function') return;
    const d=classDerivedResources(p,p.classe);
    p.pvMax=d.pvMax; p.peMax=d.peMax; p.sanMax=d.sanMax; p.defesa=d.defesa; p.limitePEPorTurno=peLimit(p);
    p.pv=Math.min(Number(p.pv??p.pvMax),p.pvMax); p.pe=Math.min(Number(p.pe??p.peMax),p.peMax); p.san=Math.min(Number(p.san??p.sanMax),p.sanMax);
  }
  const oldSetNex=window.RuleEngine?.setNex;
  if(window.RuleEngine){
    window.RuleEngine.setNex=function(pid,value){
      const p=data?.jogadores?.find(x=>x.id===pid); if(!p) return false;
      const n=Math.max(5,Math.min(99,parseInt(String(value).replace('%',''),10)||5));
      p.nex=`${n}%`; refreshResourceDerived(p);
      p.nexHistory=Array.isArray(p.nexHistory)?p.nexHistory:[]; p.nexHistory.push({nex:n,at:new Date().toISOString()});
      logAction(`${p.nome}: NEX ajustado para ${n}%. Limite de PE/turno: ${p.limitePEPorTurno}.`); saveLocal(); renderMaster(); if(selectedPlayer?.id===pid)renderSheet(); toast(`NEX ${n}% aplicado.`); return true;
    };
  }
  function spendPE(p,cost){
    cost=Math.max(0,Number(cost)||0); if(cost===0)return true;
    if(Number(p.pe)<cost)return false;
    p.pe-=cost; return true;
  }
  window.RuleEngineExtra={peLimit,refreshResourceDerived,spendPE};

  // Correção da distribuição automática: 9 pontos, máximo 3 por atributo.
  window.CLASS_ATTRIBUTE_BUILDS={
    Combatente:{FOR:3,AGI:2,INT:1,PRE:1,VIG:2,prioridade:'Força + Vigor, com Agilidade como apoio'},
    Especialista:{FOR:1,AGI:3,INT:3,PRE:1,VIG:1,prioridade:'Agilidade + Intelecto, foco em perícias e investigação'},
    Ocultista:{FOR:1,AGI:1,INT:3,PRE:3,VIG:1,prioridade:'Intelecto + Presença, foco em rituais e testes'}
  };
  window.getClassAttributeBuild=function(c){return window.CLASS_ATTRIBUTE_BUILDS[c]||null;};
  window.applyClassAttributeBuild=function(p,c){const b=window.getClassAttributeBuild(c);if(!b)return;p.atributos={FOR:b.FOR,AGI:b.AGI,INT:b.INT,PRE:b.PRE,VIG:b.VIG};p.configuracaoAtributosClasse={classe:c,prioridade:b.prioridade,automatico:true};};
  if(typeof applyClassProfile==='function'){
    const original=applyClassProfile;
    window.applyClassProfile=function(p,c){original(p,c);window.applyClassAttributeBuild(p,c);if(typeof refreshResourceDerived==='function')refreshResourceDerived(p);};
  }

  // Crítico oficial: dobra somente os dados de dano; bônus numérico permanece.
  function criticalDamageFormula(formula){
    const s=String(formula||'').replace(/\s/g,'');
    const parts=s.match(/^(.+?)([+-]\d+)?$/); if(!parts)return s;
    const dice=parts[1],bonus=parts[2]||'';
    const dm=dice.match(/^(\d+)d(\d+)(.*)$/i); if(!dm)return s;
    return `${Number(dm[1])*2}d${dm[2]}${dm[3]||''}${bonus}`;
  }
  window.criticalDamageFormula=criticalDamageFormula;
  // Registra o último crítico da sessão para que a rolagem de dano subsequente dobre apenas os dados.
  const baseRoll=window.roll;
  if(typeof baseRoll==='function') window.roll=function(){
    const state=window.diceState || diceState;
    baseRoll();
    if(state && (state.type==='attack'||state.type==='item-attack')){
      const text=String(document.querySelector('#diceBreakdown')?.textContent||'');
      const first=Number((text.match(/^(\d+)/)||[])[1]);
      const p=data?.jogadores?.find(x=>x.id===state.pid);
      if(p){p.ultimoAtaqueCritico=(first===20); if(first===20){document.querySelector('#diceOutcome').textContent='★ ACERTO CRÍTICO — use o dobro dos dados de dano';document.querySelector('#diceOutcome').className='dice-outcome success';saveLocal();}}
    }
  };
  const baseOpenDice=window.openDice;
  if(typeof baseOpenDice==='function') window.openDice=function(type,pid,index){
    const p=data?.jogadores?.find(x=>x.id===pid);
    if(type==='damage' && p?.ultimoAtaqueCritico){
      const attack=p.ataques?.[index]; if(!attack)return;
      const formula=criticalDamageFormula(typeof originAttackDamageFormula==='function'?originAttackDamageFormula(p,attack):attack.dano);
      diceState={type:'damage',pid,formula,title:`${attack.nome} — Dano CRÍTICO`};
      $('#diceTitle').textContent=diceState.title;$('#diceFormula').textContent=formula;$('#diceResult').textContent='—';$('#diceBreakdown').textContent='';$('#diceOutcome').textContent='Dano crítico: dados dobrados';$('#diceOutcome').className='dice-outcome success';$('#diceDTWrap').style.display='none';$('#rollAgain').style.display='block';$('#diceModal').classList.add('show');
      baseRoll(); p.ultimoAtaqueCritico=false; saveLocal(); return;
    }
    return baseOpenDice(type,pid,index);
  };
  const baseOpenItemDice=window.openItemDice;
  if(typeof baseOpenItemDice==='function') window.openItemDice=function(pid,index,type){
    const p=data?.jogadores?.find(x=>x.id===pid), item=p?.itens?.[index];
    if(type==='damage' && p?.ultimoAtaqueCritico && item){
      const formula=criticalDamageFormula(itemFormula(item,'damage'));
      diceState={type:'item-damage',pid,formula,title:`${item.nome} — Dano CRÍTICO`};$('#diceTitle').textContent=diceState.title;$('#diceFormula').textContent=formula;$('#diceResult').textContent='—';$('#diceBreakdown').textContent='Dano crítico: dados dobrados';$('#diceOutcome').textContent='★ ACERTO CRÍTICO';$('#diceOutcome').className='dice-outcome success';$('#diceDTWrap').style.display='none';$('#rollAgain').style.display='block';$('#diceModal').classList.add('show');baseRoll();p.ultimoAtaqueCritico=false;saveLocal();return;
    }
    return baseOpenItemDice(pid,index,type);
  };

  // Elementos oficiais: Sangue > Conhecimento > Energia > Morte > Sangue; Medo neutro.
  window.resolveElementalModifier=function(source,target){
    const a=String(source||'').toLowerCase(),b=String(target||'').toLowerCase(); if(!a||!b||a==='medo'||b==='medo'||a===b)return 0;
    const strong={sangue:'conhecimento',conhecimento:'energia',energia:'morte',morte:'sangue'}; if(strong[a]===b)return -2; if(strong[b]===a)return 2; return 0;
  };

  // Carregamento dos catálogos externos: itens, armas e rituais.
  window.loadGameCatalogs=async function(){
    let itemsOk=false; let weaponsOk=false;
    try{
      const r=await fetch('itens.json?ts='+Date.now(),{cache:'no-store'}); if(!r.ok)throw Error('HTTP '+r.status); const j=await r.json(); const list=Array.isArray(j)?j:j.itens;
      if(Array.isArray(list)){ data.itensDisponiveis=list.map(x=>normalizeItem(x)); itemsOk=true; }
    }catch(e){console.error('Erro ao carregar itens.json',e);toast('Não foi possível carregar itens.json.');}
    try{
      const r=await fetch('armas.json?ts='+Date.now(),{cache:'no-store'}); if(!r.ok)throw Error('HTTP '+r.status);
      const j=await r.json(); const list=Array.isArray(j)?j:j.armas;
      if(Array.isArray(list)){ window.WEAPON_CATALOG=list.map((x,i)=>({id:x.id||`arma_${String(i+1).padStart(3,'0')}`,nome:String(x.nome||''),categoria:String(x.categoria||''),grupo:String(x.grupo||''),dano:String(x.dano||''),critico:String(x.critico||''),alcance:String(x.alcance||''),tipoDano:String(x.tipoDano||''),espacos:Number(x.espacos)||0,proficiencia:String(x.proficiencia||''),teste:String(x.teste||'Pontaria')})).filter(x=>x.nome&&x.dano); weaponsOk=true; }
    }catch(e){console.error('Erro ao carregar armas.json',e);toast('Não foi possível carregar armas.json.'); window.WEAPON_CATALOG=[];}
    let ritualsOk=false;
    if(typeof loadRitualCatalog==='function')ritualsOk=await loadRitualCatalog();
    return itemsOk&&weaponsOk&&ritualsOk;
  };

  // Auditoria de invariantes da ficha.
  window.runFinalAudit=function(){
    const out=[];
    (data?.jogadores||[]).forEach(p=>{
      const a=p.atributos||{}; const total=['FOR','AGI','INT','PRE','VIG'].reduce((s,k)=>s+(Number(a[k])||0),0);
      out.push({personagem:p.nome,atributos:total===9&&Object.values(a).every(v=>Number(v)>=1&&Number(v)<=3),recursos:p.classe?Number(p.pvMax)>0&&Number(p.peMax)>0&&Number(p.sanMax)>0:true,limitePE:Number(p.limitePEPorTurno||peLimit(p))});
    });
    const ritualCount=Array.isArray(window.RITUAL_CATALOG)?window.RITUAL_CATALOG.length:0;
    return {ok:out.every(x=>x.atributos&&x.recursos)&&ritualCount>0,players:out,rituais:ritualCount,itens:Array.isArray(data?.itensDisponiveis)?data.itensDisponiveis.length:0};
  };

  // Após normalização, garante o limite de PE/turno.
  const oldNormalize=window.normalizeData;
  if(typeof oldNormalize==='function'){
    window.normalizeData=function(source){const d=oldNormalize(source);(d.jogadores||[]).forEach(p=>{if(p.classe)refreshResourceDerived(p);});return d;};
  }
})();


/* --- 38-class-skills-ui.js --- */
/* V0.63 — seleção visual de perícias ao escolher a classe */
(function(){
  const GROUPS={
    Combatente:{
      'Luta ou Pontaria':['Luta','Pontaria'],
      'Fortitude ou Reflexos':['Fortitude','Reflexos']
    }
  };

  function ensureModal(){
    let m=document.getElementById('classSkillPickerModal');
    if(m)return m;
    m=document.createElement('div');
    m.id='classSkillPickerModal';
    m.className='modal class-skill-picker-modal';
    m.setAttribute('aria-hidden','true');
    m.innerHTML=`<div class="class-skill-picker-box panel">
      <button class="close" id="classSkillPickerClose" aria-label="Fechar">×</button>
      <div id="classSkillPickerContent"></div>
    </div>`;
    document.body.appendChild(m);
    m.addEventListener('click',e=>{if(e.target===m) closePicker();});
    document.getElementById('classSkillPickerClose').onclick=closePicker;
    return m;
  }

  function closePicker(){
    const m=document.getElementById('classSkillPickerModal');
    if(!m)return;
    m.classList.remove('show');m.setAttribute('aria-hidden','true');
  }

  function openPicker(pid,classe){
    const p=data?.jogadores?.find(x=>x.id===pid); const profile=CLASS_PROFILES?.[classe];
    if(!p||!profile)return;
    const m=ensureModal(),host=document.getElementById('classSkillPickerContent');
    const origin=new Set(getOriginProfile(p)?.treinadas||[]);
    const required=profile.periciasQuantidade(p);
    const expectedNew=required+(classe==='Combatente'?2:classe==='Ocultista'?2:0);
    const skills=p.pericias||[];
    const selected=new Set(p.treinadasClasse||[]);
    const fixed=(classe==='Ocultista' ? (profile.escolhaPericias||[]) : (profile.escolhaPericias||[]).filter(x=>origin.has(x)||selected.has(x)));
    fixed.forEach(x=>selected.add(x));

    const selectedNew=()=>[...selected].filter(n=>!origin.has(n)).length;
    const mandatoryText=classe==='Combatente'
      ?'Escolha 1 entre Luta/Pontaria, 1 entre Fortitude/Reflexos e complete as demais escolhas com outras perícias.'
      :classe==='Ocultista'
        ?'Ocultismo e Vontade são obrigatórias. Depois, escolha as demais perícias de classe.'
        :'Escolha a quantidade indicada de perícias. As perícias já treinadas pela origem não consomem suas escolhas de classe.';

    const rows=skills.map((sk,i)=>{
      const isOrigin=origin.has(sk.nome);
      const isFixed=classe==='Ocultista' && (profile.escolhaPericias||[]).includes(sk.nome);
      const checked=selected.has(sk.nome);
      return `<label class="class-skill-option ${checked?'selected':''} ${isOrigin?'origin-trained':''}">
        <input type="checkbox" data-class-skill-index="${i}" ${checked?'checked':''} ${isOrigin||isFixed?'disabled':''}>
        <span class="class-skill-check"></span>
        <span class="class-skill-main"><b>${esc(sk.nome)}</b><small>${esc(sk.atributoLabel||sk.atributo||'Perícia')}${sk.requerTreinamento?' • exige treinamento':''}</small></span>
        <span class="class-skill-tag">${isOrigin?'ORIGEM':isFixed?'OBRIGATÓRIA':sk.requerTreinamento?'*':''}</span>
      </label>`;
    }).join('');

    host.innerHTML=`<div class="class-picker-head">
      <p class="eyebrow">NOVA ESPECIALIZAÇÃO</p>
      <h2>Escolha as perícias de ${esc(classe)}</h2>
      <p class="muted">${esc(mandatoryText)}</p>
    </div>
    <div class="class-picker-status"><span>ESCOLHAS</span><strong id="classSkillCount">${selectedNew()} / ${expectedNew}</strong></div>
    <div class="class-picker-groups">
      ${classe==='Combatente'?`<div class="class-skill-group"><b>Escolha obrigatória</b><small>1 perícia</small><div class="class-skill-group-items">${GROUPS.Combatente['Luta ou Pontaria'].map(n=>`<span>${n}</span>`).join('')}</div></div>
      <div class="class-skill-group"><b>Escolha obrigatória</b><small>1 perícia</small><div class="class-skill-group-items">${GROUPS.Combatente['Fortitude ou Reflexos'].map(n=>`<span>${n}</span>`).join('')}</div></div>`:''}
      <div class="class-skill-group"><b>Demais perícias</b><small>${required} escolha(s) pela classe</small></div>
    </div>
    <div class="class-skill-grid">${rows}</div>
    <div id="classSkillPickerError" class="error"></div>
    <div class="class-picker-actions"><button class="ghost" id="classSkillPickerCancel">CANCELAR</button><button class="primary" id="classSkillPickerConfirm">CONFIRMAR PERÍCIAS</button></div>`;

    host.querySelectorAll('[data-class-skill-index]').forEach(input=>input.addEventListener('change',()=>{
      const idx=Number(input.dataset.classSkillIndex),name=skills[idx]?.nome;
      if(!name)return;
      if(input.checked)selected.add(name);else selected.delete(name);
      input.closest('.class-skill-option')?.classList.toggle('selected',input.checked);
      const count=document.getElementById('classSkillCount');if(count)count.textContent=`${selectedNew()} / ${expectedNew}`;
    }));
    document.getElementById('classSkillPickerCancel').onclick=closePicker;
    document.getElementById('classSkillPickerConfirm').onclick=()=>{
      const names=[...selected];
      const error=document.getElementById('classSkillPickerError');
      const originTrained=origin;
      const newNames=names.filter(n=>!originTrained.has(n));
      if(newNames.length!==expectedNew){error.textContent=`Selecione exatamente ${expectedNew} perícias novas para ${classe}.`;return;}
      if(classe==='Combatente'){
        if(newNames.filter(n=>GROUPS.Combatente['Luta ou Pontaria'].includes(n)).length!==1 || newNames.filter(n=>GROUPS.Combatente['Fortitude ou Reflexos'].includes(n)).length!==1){error.textContent='Combatente: escolha exatamente 1 entre Luta/Pontaria e 1 entre Fortitude/Reflexos.';return;}
        const extras=newNames.filter(n=>!GROUPS.Combatente['Luta ou Pontaria'].includes(n)&&!GROUPS.Combatente['Fortitude ou Reflexos'].includes(n));
        if(extras.length!==required){error.textContent=`Combatente: além das duas escolhas obrigatórias, selecione ${required} perícia(s) adicional(is).`;return;}
      }
      if(classe==='Ocultista'){
        const hasO=originTrained.has('Ocultismo')||names.includes('Ocultismo');
        const hasV=originTrained.has('Vontade')||names.includes('Vontade');
        if(!hasO||!hasV){error.textContent='Ocultista: Ocultismo e Vontade são obrigatórias (sem contar uma duplicidade já fornecida pela origem).';return;}
      }
      if(setClassTraining(pid,names))closePicker();
    };

    m.classList.add('show');m.setAttribute('aria-hidden','false');
  }

  // Substitui o prompt anterior por uma seleção visual sem alterar as regras de validação.
  window.chooseClass=function(pid,classe){
    const allowed=Object.keys(CLASS_PROFILES||{}),p=data?.jogadores?.find(x=>x.id===pid);
    if(!p||!classChoiceOpen()||p.classe||!allowed.includes(classe))return;
    applyClassProfile(p,classe);
    p.classeEscolhidaEm='5º andar — O Despertar';
    logAction(`${p.nome} descobriu a classe ${classe} e iniciou a escolha visual de perícias.`);
    saveLocal();renderPlayerCards();renderMaster();renderSheet();
    openPicker(pid,classe);
  };
  window.openClassSkillPicker=openPicker;
  window.closeClassSkillPicker=closePicker;
})();


/* --- 40-motor-v070.js --- */
/* V0.70 — Consolidação do Motor de Jogo
   Estado -> comando -> motor -> evento -> persistência/UI.
   Compatível com os módulos anteriores, mas passa a ser a API autoritativa para regras.
*/
(function(){
  const NEX_STEPS=[5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,99];
  const NEX_LIMIT={5:1,10:2,15:3,20:4,25:5,30:6,35:7,40:8,45:9,50:10,55:11,60:12,65:13,70:14,75:15,80:16,85:17,90:18,95:19,99:20};
  const ATTR=['FOR','AGI','INT','PRE','VIG'];
  const TRAIN={leigo:0,nao_treinada:0,treinado:5,veterano:10,expert:15};
  const ELEMENT={Sangue:'Conhecimento',Conhecimento:'Energia',Energia:'Morte',Morte:'Sangue'};
  const ACTIONS=['padrao','movimento','completa'];
  const CATEGORIES={0:0,1:1,2:2,3:3,4:4};
  const log=(type,payload={})=>{if(!data)return null;data.campanha=data.campanha||{};data.campanha.eventosMotor=data.campanha.eventosMotor||[];const e={id:`evt_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,type,at:Date.now(),payload};data.campanha.eventosMotor.unshift(e);data.campanha.eventosMotor=data.campanha.eventosMotor.slice(0,500);if(typeof logAction==='function')logAction(`[${type}] ${payload.resumo||''}`);return e;};
  function ensure(){
    if(!data)return null; data.campanha=data.campanha||{};
    const c=data.campanha.motorV070=data.campanha.motorV070||{};
    c.versao='0.70'; c.comandoId=Number(c.comandoId)||0; c.eventos=Array.isArray(c.eventos)?c.eventos:[];
    c.combate=c.combate||null; c.cena=c.cena||null;
    (data.jogadores||[]).forEach(ensurePlayer);
    return c;
  }
  function id(prefix='id'){return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;}
  function stableId(obj,prefix){if(!obj)return null;if(!obj.id)obj.id=id(prefix);return obj.id;}
  function ensurePlayer(p){
    if(!p)return p; stableId(p,'player'); p.atributos=p.atributos||{}; ATTR.forEach(a=>{p.atributos[a]=Number.isFinite(Number(p.atributos[a]))?Number(p.atributos[a]):1;});
    p.pericias=Array.isArray(p.pericias)?p.pericias:[];p.itens=Array.isArray(p.itens)?p.itens:[];p.condicoes=Array.isArray(p.condicoes)?p.condicoes:[];
    p.historicoRolagens=Array.isArray(p.historicoRolagens)?p.historicoRolagens:[];p.habilidades=Array.isArray(p.habilidades)?p.habilidades:[];p.poderes=Array.isArray(p.poderes)?p.poderes:[];
    p.rituaisConhecidos=Array.isArray(p.rituaisConhecidos)?p.rituaisConhecidos:[];p.reacoesUsadas=Number(p.reacoesUsadas)||0;
    p.motorV070=p.motorV070||{};p.motorV070.acoes=p.motorV070.acoes||{padrao:1,movimento:1,completa:0,livre:Infinity,reacao:0};
    p.motorV070.peGastoTurno=Number(p.motorV070.peGastoTurno)||0;p.motorV070.rodada=Number(p.motorV070.rodada)||0;
    return p;
  }
  function getPlayer(id){return (data?.jogadores||[]).find(p=>p.id===id)||null;}
  function getEntity(id){return getPlayer(id)||(data?.assassinos||[]).find(x=>x.id===id)||(data?.monstros||[]).find(x=>x.id===id)||null;}
  function nex(p){const n=parseInt(String(p?.nex??5).replace('%',''),10);return NEX_STEPS.includes(n)?n:5;}
  function nextNex(n){const i=NEX_STEPS.indexOf(Number(n));return NEX_STEPS[Math.min(NEX_STEPS.length-1,Math.max(0,i+1))];}
  function peLimit(p){let n=nex(p),v=NEX_LIMIT[n]||1;const b=getOriginProfile?.(p)?.bonus||{};return v+Number(b.peTurno||0);}
  function maxCircle(p){const n=nex(p);return n>=85?4:n>=55?3:n>=25?2:1;}
  function classBase(p){return typeof CLASS_PROFILES!=='undefined'?CLASS_PROFILES[p?.classe]:null;}
  function derived(p){const c=classBase(p);if(!c)return {pvMax:Number(p.pvMax)||16,peMax:Number(p.peMax)||10,sanMax:Number(p.sanMax)||18,defesa:10+Number(p.atributos.AGI||0)};let pv=c.pvBase+(Math.floor(nex(p)/5)-1)*c.pvPorNex+Number(p.atributos.VIG||0);let pe=c.peBase+(Math.floor(nex(p)/5)-1)*c.pePorNex+Number(p.atributos.PRE||0);let san=c.sanBase+(Math.floor(nex(p)/5)-1)*c.sanPorNex;const ob=getOriginProfile?.(p)?.bonus||{};if(ob.peMax)pe+=Number(ob.peMax);if(ob.sanPor5NEX)san+=Math.floor(nex(p)/5)*Number(ob.sanPor5NEX);let defesa=10+Number(p.atributos.AGI||0)+Number(c.defesaBonus||0)+Number(ob.defesa||0);if(p.trilha==='Tropa de Choque'&&nex(p)>=99&&Number(p.pv||0)<=pv/2)defesa+=5;return {pvMax:pv,peMax:pe,sanMax:san,defesa};}
  function refresh(p){ensurePlayer(p);const d=derived(p);const old={pvMax:p.pvMax,peMax:p.peMax,sanMax:p.sanMax};p.pvMax=d.pvMax;p.peMax=d.peMax;p.sanMax=d.sanMax;p.defesa=d.defesa;p.limitePEPorTurno=peLimit(p);p.pv=Math.min(Math.max(0,Number(p.pv??p.pvMax)),p.pvMax);p.pe=Math.min(Math.max(0,Number(p.pe??p.peMax)),p.peMax);p.san=Math.min(Math.max(0,Number(p.san??p.sanMax)),p.sanMax);return {old,now:d};}
  function rollDie(s){return Math.floor(Math.random()*s)+1;}
  function pool(attribute){const a=Number(attribute)||0;const count=a>0?a:2;const rolls=Array.from({length:count},()=>rollDie(20));return {rolls,result:a>0?Math.max(...rolls):Math.min(...rolls),modo:a>0?'melhor':'pior'};}
  function skill(p,name){return (p?.pericias||[]).find(x=>String(x.nome).toLowerCase()===String(name).toLowerCase())||null;}
  function skillBonus(p,s){if(!s)return 0;const grau=s.grau||(s.treinada?'treinado':'leigo');return (TRAIN[grau]??0)+(typeof originSkillBonus==='function'?originSkillBonus(p,s):0);}
  function test(p,kind,key,dt=10,extra=0,diceMod=0){ensurePlayer(p);let attribute=key,per=null,bonus=Number(extra)||0;if(kind==='pericia'){per=skill(p,key);if(!per)throw Error(`Perícia inexistente: ${key}`);attribute=per.atributo==='INT/PRE'?Math.max(p.atributos.INT,p.atributos.PRE):p.atributos[per.atributo]||0;bonus+=skillBonus(p,per);}else attribute=p.atributos[key]||0;let base=Number(attribute)||0,count=base>0?base:2;count=Math.max(1,count+Number(diceMod||0));const rolls=Array.from({length:count},()=>rollDie(20));const result=(diceMod<0||base<=0&&diceMod<0)?Math.min(...rolls):Math.max(...rolls);const total=result+bonus;const r={id:id('roll'),tipo:kind,chave:key,rolls,result,bonus,total,dt:Number(dt)||10,sucesso:total>=Number(dt||10),modo:base>0?'melhor':'pior',critico:rolls.includes(20)&&result===20};p.historicoRolagens.unshift(r);p.historicoRolagens=p.historicoRolagens.slice(0,100);log('ROLL_PERFORMED',{personagem:p.nome,tipo:kind,chave:key,total,dt:r.dt,sucesso:r.sucesso});return r;}
  function spendPE(p,cost,reason=''){ensurePlayer(p);const n=Math.max(0,Number(cost)||0);if(p.motorV070.peGastoTurno+n>peLimit(p))return {ok:false,reason:'limite_turno'};if(Number(p.pe)<n)return {ok:false,reason:'pe_insuficiente'};p.pe-=n;p.motorV070.peGastoTurno+=n;log('RESOURCE_CHANGED',{personagem:p.nome,recurso:'PE',delta:-n,razao:reason});return {ok:true,cost:n};}
  function resource(p,key,delta,reason=''){ensurePlayer(p);const max=Number(p[key+'Max'])||0,old=Number(p[key])||0,next=Math.max(0,Math.min(max,old+Number(delta||0)));p[key]=next;log('RESOURCE_CHANGED',{personagem:p.nome,recurso:key,delta:next-old,razao:reason});return {old,next,delta:next-old};}
  function resetTurn(p,round){ensurePlayer(p);p.motorV070.acoes={padrao:1,movimento:1,completa:0,livre:Infinity,reacao:0};p.motorV070.peGastoTurno=0;p.motorV070.rodada=round;p.reacoesUsadas=0;}
  function canAct(p){return !conditionHas(p,'Atordoado')&&!conditionHas(p,'Pasmo')&&!conditionHas(p,'Inconsciente')&&!conditionHas(p,'Paralisado');}
  function consumeAction(p,type){ensurePlayer(p);if(!canAct(p))return false;if(type==='completa'){if(p.motorV070.acoes.completa||p.motorV070.acoes.padrao<1||p.motorV070.acoes.movimento<1)return false;p.motorV070.acoes.completa=1;p.motorV070.acoes.padrao=0;p.motorV070.acoes.movimento=0;return true;}if(!ACTIONS.includes(type)||p.motorV070.acoes[type]<1)return false;p.motorV070.acoes[type]--;return true;}
  function useReaction(p){ensurePlayer(p);if(conditionHas(p,'Inconsciente'))return false;if(p.reacoesUsadas>=1)return false;p.reacoesUsadas++;return true;}
  function progression(p){const n=nex(p), profile=classBase(p);if(!profile)return [];const rows=(profile.progressao||[]).filter(x=>Number(String(x[0]).replace('%',''))<=n);return rows.map(x=>({nex:Number(String(x[0]).replace('%','')),descricao:x[1],concedida:p.evolucaoV070?.concedidas?.includes(`${x[0]}:${x[1]}`)||false}));}
  function refreshProgression(p){ensurePlayer(p);p.evolucaoV070=p.evolucaoV070||{};p.evolucaoV070.concedidas=Array.isArray(p.evolucaoV070.concedidas)?p.evolucaoV070.concedidas:[];p.evolucaoV070.pendentes=progression(p).filter(x=>!x.concedida).map(x=>`${x.nex}%:${x.descricao}`);return p.evolucaoV070;}
  function startCombat(ids=[],opts={}){
    const c=ensure();if(c.combate?.ativo)throw Error('Já existe combate ativo.');const entities=(ids.length?ids.map(getEntity).filter(Boolean):[...(data.jogadores||[]),...(data.assassinos||[]).filter(k=>k.ativo)]);const init=entities.map(e=>{const p=e.atributos?e:null;let r=null;try{r=p?test(p,'pericia','Iniciativa',0,0):null;}catch(_){r={total:Number(e.iniciativa||0),critico:false};}return {id:stableId(e,'entity'),nome:e.nome,tipo:(data.jogadores||[]).includes(e)?'jogador':'ameaça',resultado:Number(r?.total||e.iniciativa||0),surpreendido:false};}).sort((a,b)=>b.resultado-a.resultado);c.combate={ativo:true,rodada:1,turnoIndex:0,turnoId:init[0]?.id||null,iniciativa:init,log:[],historico:[],acoes:0};init.forEach(x=>{const p=getEntity(x.id);if(p&&p.atributos)resetTurn(p,1);});log('COMBAT_STARTED',{participantes:init.map(x=>x.nome),resumo:'Combate iniciado'});persist();return c.combate;}
  function currentCombat(){return ensure().combate;}
  function currentTurn(){const c=currentCombat();return c?.iniciativa?.[c.turnoIndex]||null;}
  function nextTurn(){const c=currentCombat();if(!c?.ativo)return null;const old=currentTurn();c.turnoIndex++;if(c.turnoIndex>=c.iniciativa.length){c.turnoIndex=0;c.rodada++;}c.turnoId=c.iniciativa[c.turnoIndex]?.id||null;const p=getEntity(c.turnoId);if(p&&p.atributos)resetTurn(p,c.rodada);if(typeof ConditionEngine!=='undefined'&&p&&p.atributos)ConditionEngine.tickEntity?.(p.id);log('TURN_CHANGED',{de:old?.nome,para:p?.nome,rodada:c.rodada,resumo:`Turno: ${p?.nome||'—'}`});persist();return currentTurn();}
  function endCombat(){const c=currentCombat();if(!c)return; c.ativo=false;log('COMBAT_ENDED',{resumo:'Combate encerrado'});persist();}
  function defense(t){let d=Number(t?.defesa)||10;if(ConditionEngine?.has?.(t,'Desprevenido'))d-=5;if(ConditionEngine?.has?.(t,'Indefeso'))d-=10;if(ConditionEngine?.has?.(t,'Caído'))d-=5;return d;}
  function parseDamage(formula){const s=String(formula||'').replace(/\s/g,'');const m=s.match(/^(\d+)d(\d+)([+-]\d+)?$/i);if(!m)throw Error(`Fórmula de dano inválida: ${formula}`);return {n:Number(m[1]),sides:Number(m[2]),mod:Number(m[3]||0)};}
  function rollDamage(formula,critical=false){const f=parseDamage(formula);const n=critical?f.n*2:f.n;const rolls=Array.from({length:n},()=>rollDie(f.sides));return {rolls,total:rolls.reduce((a,b)=>a+b,0)+f.mod};}
  function weaponFor(p,name){return (p.itens||[]).find(i=>i.nome===name&&i.tipo==='arma')||null;}
  function attack(attackerId,targetId,opts={}){
    const a=getEntity(attackerId),t=getEntity(targetId);if(!a||!t)throw Error('Atacante ou alvo inválido.');const skillName=opts.skill||opts.pericia||'Luta';const dt=defense(t);const r=test(a,'pericia',skillName,dt,Number(opts.bonus||0),0);const critical=!!(r.critico&&r.sucesso);let damage=null;
    if(r.sucesso){let formula=opts.damage||opts.dano;if(!formula&&opts.weapon)formula=weaponFor(a,opts.weapon)?.dano;if(!formula)formula='1d4';formula=String(formula).split('/')[0];damage=rollDamage(formula,critical);const rd=Number(t.resistenciaDano||0);const final=Math.max(0,damage.total-rd);if(t.pv!==undefined)t.pv=Math.max(0,Number(t.pv)-final);if(t.pv===0&&t.atributos)ConditionEngine?.add?.(t.id,'Morrendo',null,a.nome);}
    const entry={id:id('attack'),tipo:'ataque',atacante:a.nome,alvo:t.nome,teste:r.total,defesa:dt,acertou:r.sucesso,critico:critical,danoRolado:damage?.total||0,danoFinal:damage?Math.max(0,damage.total-Number(t.resistenciaDano||0)):0,formula:opts.damage||opts.dano||'1d4',resistencia:Number(t.resistenciaDano||0),at:Date.now()};const c=currentCombat();if(c){c.historico.unshift(entry);c.log.unshift(entry);c.historico=c.historico.slice(0,200);}log('DAMAGE_APPLIED',{atacante:a.nome,alvo:t.nome,valor:entry.danoFinal,critico:critical,resumo:`${a.nome} atacou ${t.nome}`});persist();return entry;
  }
  function resistance(targetId,skillName,dt,sourceElement=null,targetElement=null){const t=getEntity(targetId);if(!t)throw Error('Alvo inválido');let mod=0;const rel=elementalRelation(sourceElement,targetElement);if(rel==='opressor')mod=-2;if(rel==='mesmo')mod=2;const r=test(t,'pericia',skillName,dt,0,mod);r.relacaoElemental=rel;r.modificadorElemental=mod;return r;}
  function elementalRelation(source,target){if(!source||!target||source==='Medo'||target==='Medo')return 'neutro';if(source===target)return 'mesmo';if(ELEMENT[source]===target)return 'opressor';if(ELEMENT[target]===source)return 'oprimido';return 'neutro';}
  function conditionHas(p,name){return !!(p?.condicoes||[]).some(c=>String(c.nome||c)===name);}
  function conditionAdd(p,name,rounds=null,origin='Motor V0.70'){if(!p)return false;p.condicoes=p.condicoes||[];if(conditionHas(p,name))return true;p.condicoes.push({nome:name,rodadas:rounds==null?null:Number(rounds),origem:origin,at:Date.now()});log('CONDITION_ADDED',{personagem:p.nome,condicao:name});return true;}
  function conditionRemove(p,name){if(!p)return false;p.condicoes=(p.condicoes||[]).filter(c=>String(c.nome||c)!==name);log('CONDITION_REMOVED',{personagem:p.nome,condicao:name});return true;}
  function conditionTick(p){if(!p)return;p.condicoes=(p.condicoes||[]).map(c=>({...c}));p.condicoes.forEach(c=>{if(Number.isFinite(c.rodadas))c.rodadas--;});p.condicoes=p.condicoes.filter(c=>c.rodadas==null||c.rodadas>0);if(conditionHas(p,'Em Chamas'))resource(p,'pv',-rollDamage('1d6').total,'Em Chamas');if(conditionHas(p,'Sangrando')){const fort=skill(p,'Fortitude');if(fort){const r=test(p,'pericia','Fortitude',10);if(!r.sucesso)resource(p,'pv',-rollDamage('1d6').total,'Sangrando');}}}
  function itemSpaces(i){return Math.max(0,Number(i?.espacos??1));}
  function capacity(p){let v=Math.max(0,Number(p?.atributos?.FOR)||0)*5;const tech=p?.classe==='Especialista'&&nex(p)>=10&&p?.trilha==='Técnico';if(tech)v+=(Number(p.atributos.INT)||0)*5;return v;}
  function load(p){return (p?.itens||[]).reduce((s,i)=>s+itemSpaces(i)*Math.max(1,Number(i.quantidade)||1),0);}
  function encumbrance(p){const l=load(p),cap=capacity(p);return {espacos:l,limite:cap,maximo:cap*2,sobrecarregado:l>cap,excedeu:l>cap*2};}
  function addItem(p,item,qty=1){ensurePlayer(p);const q=Math.max(1,Number(qty)||1),candidate={...item,id:item.id||id('item'),quantidade:q,espacos:item.espacos??1};const e=encumbrance(p),newLoad=e.espacos+itemSpaces(candidate)*q;if(newLoad>e.maximo)throw Error('Carga excede o dobro da capacidade.');const same=p.itens.find(i=>i.id===candidate.id||i.nome===candidate.nome);if(same)same.quantidade=(Number(same.quantidade)||0)+q;else p.itens.push(candidate);log('ITEM_ADDED',{personagem:p.nome,item:candidate.nome,quantidade:q});persist();return candidate;}
  function useItem(p,itemId){const i=(p.itens||[]).find(x=>x.id===itemId);if(!i)throw Error('Item não encontrado');if((Number(i.quantidade)||0)<=0)throw Error('Quantidade inválida');i.quantidade--;if(i.quantidade===0)p.itens=p.itens.filter(x=>x!==i);log('ITEM_USED',{personagem:p.nome,item:i.nome,resumo:`${p.nome} usou ${i.nome}`});persist();return i;}
  function castRitual(p,ritual,opts={}){
    ensurePlayer(p);const r=typeof ritual==='string'?(window.RITUAL_CATALOG||[]).find(x=>x.id===ritual||x.nome===ritual):ritual;if(!r)throw Error('Ritual não encontrado');const circle=Number(r.circulo)||1;if(circle>maxCircle(p))throw Error(`NEX ${nex(p)}% não permite ${circle}º círculo.`);let cost=Number(r.custo)||([1,3,6,10][circle-1]||1);const spend=spendPE(p,cost,`Ritual: ${r.nome}`);if(!spend.ok)throw Error(spend.reason==='limite_turno'?'Limite de PE por turno excedido.':'PE insuficiente.');let custoParanormal=null;if(String(r.tipo||'')!=='Medo'){const dt=20+cost;custoParanormal=test(p,'pericia','Ocultismo',dt);if(!custoParanormal.sucesso){resource(p,'san',-cost,'Custo do Paranormal');if(custoParanormal.total<=dt-5){p.sanMax=Math.max(0,Number(p.sanMax||0)-1);p.san=Math.min(p.san,p.sanMax);log('SAN_PERMANENT_LOST',{personagem:p.nome,valor:1,razao:'Custo do Paranormal'});}}}else{resource(p,'san',-cost,'Custo de Medo');p.sanMax=Math.max(0,Number(p.sanMax||0)-1);p.san=Math.min(p.san,p.sanMax);}
    let effect=null;if(r.dano){effect=rollDamage(r.dano,!!opts.critico);}const out={id:id('ritualcast'),ritualId:r.id,nome:r.nome,circulo:circle,custo:cost,elemento:r.tipo,custoParanormal,efeito:effect,at:Date.now()};p.historicoRolagens.unshift(out);log('RITUAL_CAST',{personagem:p.nome,ritual:r.nome,circulo:circle,custo:cost});persist();return out;
  }
  function advanceNex(pid,target){const p=getPlayer(pid);if(!p)return false;const n=Number(String(target).replace('%',''));if(!NEX_STEPS.includes(n))throw Error('NEX inválido. Use 5, 10, 15 ... 95 ou 99.');const old=nex(p);p.nex=`${n}%`;if(p.classe){refresh(p);refreshProgression(p);}p.nexHistory=Array.isArray(p.nexHistory)?p.nexHistory:[];p.nexHistory.push({de:old,para:n,at:Date.now()});log('NEX_CHANGED',{personagem:p.nome,de:old,para:n,resumo:`${p.nome}: NEX ${old}% → ${n}%`});persist();return p;}
  function applyClass(pid,classe){const p=getPlayer(pid);if(!p)throw Error('Personagem inválido');if(typeof applyClassProfile==='function')applyClassProfile(p,classe);else p.classe=classe;refresh(p);log('CLASS_CHANGED',{personagem:p.nome,classe,resumo:`${p.nome}: classe ${classe}`});persist();return p;}
  function execute(command,payload={}){ensure();const c=ensure();c.comandoId++;let result;switch(command){case 'TEST':result=test(getPlayer(payload.pid),payload.kind||'pericia',payload.key,payload.dt,payload.extra,payload.diceMod);break;case 'ATTACK':result=attack(payload.attackerId,payload.targetId,payload);break;case 'RESISTANCE':result=resistance(payload.targetId,payload.skill,payload.dt,payload.sourceElement,payload.targetElement);break;case 'START_COMBAT':result=startCombat(payload.ids||[]);break;case 'NEXT_TURN':result=nextTurn();break;case 'END_COMBAT':result=endCombat();break;case 'SPEND_PE':result=spendPE(getPlayer(payload.pid),payload.cost,payload.reason);break;case 'DAMAGE':result=resource(getEntity(payload.targetId),'pv',-Math.abs(Number(payload.amount)||0),payload.reason||'Dano');break;case 'HEAL':result=resource(getEntity(payload.targetId),payload.resource||'pv',Math.abs(Number(payload.amount)||0),payload.reason||'Cura');break;case 'CONDITION_ADD':result=conditionAdd(getEntity(payload.pid),payload.name,payload.rounds,payload.origin);break;case 'CONDITION_REMOVE':result=conditionRemove(getEntity(payload.pid),payload.name);break;case 'CAST_RITUAL':result=castRitual(getPlayer(payload.pid),payload.ritual,payload);break;case 'SET_NEX':result=advanceNex(payload.pid,payload.nex);break;default:throw Error(`Comando não suportado: ${command}`);}return result;}
  function persist(){try{if(typeof saveLocal==='function')saveLocal();}catch(e){console.error(e);}try{if(typeof renderMaster==='function')renderMaster();if(selectedPlayer&&typeof renderSheet==='function')renderSheet();}catch(e){console.error(e);}}
  function migrate(){if(!data)return;ensure();(data.jogadores||[]).forEach(p=>{ensurePlayer(p);if(p.classe)refresh(p);(p.itens||[]).forEach(i=>{if(!i.id)i.id=id('item');if(i.espacos==null)i.espacos=1;});});(data.assassinos||[]).forEach(k=>stableId(k,'killer'));(data.monstros||[]).forEach(m=>stableId(m,'monster'));data.campanha.motorV070.migradoEm=data.campanha.motorV070.migradoEm||Date.now();persist();return data;}
  function audit(){ensure();const errors=[],warnings=[];const players=data.jogadores||[];const ids=players.map(p=>p.id);if(new Set(ids).size!==ids.length)errors.push('IDs de jogadores duplicados');players.forEach(p=>{ensurePlayer(p);const d=derived(p);if(p.classe&&(p.pvMax!==d.pvMax||p.peMax!==d.peMax||p.sanMax!==d.sanMax||p.defesa!==d.defesa))warnings.push(`${p.nome}: derivados serão normalizados`);const load=encumbrance(p);if(load.excedeu)errors.push(`${p.nome}: inventário acima do dobro da capacidade`);if(nex(p)!==parseInt(String(p.nex||'5').replace('%',''),10))errors.push(`${p.nome}: NEX fora da tabela oficial`);});const c=currentCombat();if(c?.ativo&&!c.iniciativa?.length)errors.push('Combate ativo sem iniciativa');return {ok:errors.length===0,errors,warnings,players:players.length,events:data.campanha.eventosMotor?.length||0,combat:!!c?.ativo};}
  window.GameEngineV070={ensure,migrate,audit,id,getPlayer,getEntity,nex,nextNex,peLimit,maxCircle,derived,refresh,rollD20:pool,test,skillBonus,spendPE,resource,startCombat,currentCombat,currentTurn,nextTurn,endCombat,defense,rollDamage,attack,resistance,elementalRelation,conditionHas,conditionAdd,conditionRemove,conditionTick,capacity,load,encumbrance,addItem,useItem,castRitual,advanceNex,applyClass,consumeAction,useReaction,canAct,progression,refreshProgression,execute,persist,log,NEX_STEPS,TRAIN};
  window.RuleEngineV070=window.GameEngineV070;
  // Compatibilidade: todas as chamadas existentes de RuleEngine passam pelo motor consolidado.
  if(window.RuleEngine){const R=window.RuleEngine;['rollD20','testAttribute','testSkill','testSkillDiceModifier','spend','heal','damage','recordRoll','maxRitualCircle','setNex','elementalRelation','resistanceModifier'].forEach(name=>{if(typeof GameEngineV070[name]==='function')R[name]=GameEngineV070[name];});R.testSkill=function(p,s,dt,extra=0){return GameEngineV070.test(p,'pericia',s?.nome||s,dt,extra,0);};R.testAttribute=function(p,a,dt=10){return GameEngineV070.test(p,'atributo',a,dt,0,0);};R.rollD20=GameEngineV070.rollD20;R.elementalRelation=GameEngineV070.elementalRelation;R.maxRitualCircle=GameEngineV070.maxCircle;}
  // Compatibilidade: módulos legados de combate chamam o mesmo resolvedor.
  if(window.CombatRulesV060){CombatRulesV060.attack=(a,t,s,d,e)=>GameEngineV070.attack(a,t,{skill:s,damage:d,element:e});CombatRulesV060.resistance=(t,s,dt,se,te)=>GameEngineV070.resistance(t,s,dt,se,te);CombatRulesV060.rollDamage=GameEngineV070.rollDamage;}
  if(window.CombatPlus){CombatPlus.rollFormula=function(formula){const r=GameEngineV070.rollDamage(formula);return {rolls:r.rolls,total:r.total};};CombatPlus.rollAttack=(a,t,f,d)=>GameEngineV070.attack(a,t,{skill:'Luta',damage:d});}
  if(window.ConditionEngine){ConditionEngine.has=(p,n)=>GameEngineV070.conditionHas(p,n);ConditionEngine.add=function(pid,n,r,o){const p=GameEngineV070.getPlayer(pid);const ok=GameEngineV070.conditionAdd(p,n,r,o);GameEngineV070.persist();return ok;};ConditionEngine.remove=function(pid,n){const p=GameEngineV070.getPlayer(pid);const ok=GameEngineV070.conditionRemove(p,n);GameEngineV070.persist();return ok;};ConditionEngine.tickEntity=function(pid){const p=GameEngineV070.getEntity(pid);GameEngineV070.conditionTick(p);};}
  // Inicialização única após todos os módulos estarem carregados.
  const boot=()=>{if(!data){setTimeout(boot,50);return;}GameEngineV070.migrate();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

