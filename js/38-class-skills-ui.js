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
