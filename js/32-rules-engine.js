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
