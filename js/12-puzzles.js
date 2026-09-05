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
