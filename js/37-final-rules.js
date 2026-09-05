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
