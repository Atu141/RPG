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
