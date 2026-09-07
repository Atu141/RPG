/* Arquivo Paranormal — V1.1 Supabase + PostgreSQL + Realtime
 * Substitui o transporte PeerJS. O banco é a fonte oficial do estado da mesa.
 */
(function(){
  'use strict';
  const C=window.SUPABASE_CONFIG||{};
  const ready=C.url&&C.anonKey&&!String(C.url).startsWith('COLE_AQUI');
  const clone=o=>JSON.parse(JSON.stringify(o));
  const $=id=>document.getElementById(id);
  const toastSafe=m=>typeof toast==='function'?toast(m):console.warn(m);
  const state={role:'offline',connected:false,sessionId:null,code:null,userId:null,memberId:null,playerId:null,memberCount:0,channel:null,pushTimer:null,pollTimer:null,applying:false};
  let client=null;

  function snapshot(){return clone({campanha:data?.campanha||{},jogadores:data?.jogadores||[],monstros:data?.monstros||[],assassinos:data?.assassinos||[]});}
  function valid(){return !!client;}
  async function ensureAuth(){
    if(!valid())return null;
    const {data:sd}=await client.auth.getSession();
    if(sd?.session?.user){state.userId=sd.session.user.id;return sd.session.user;}
    const {data,error}=await client.auth.signInAnonymously();
    if(error)throw error;
    state.userId=data.user.id;return data.user;
  }
  function inviteUrl(){const base=location.href.split('#')[0].split('?')[0];return `${base}?convite=${encodeURIComponent(state.code||'')}`;}
  async function copyInvite(){const url=inviteUrl();try{await navigator.clipboard.writeText(url);toastSafe('Link de convite copiado.');}catch(e){prompt('Copie o link de convite:',url)}return url;}
  function render(){
    const host=$('v071MultiplayerPanel'); if(!host)return;
    // O painel da mesa existe estaticamente no HTML para não depender de
    // montagem dinâmica durante a troca de telas/login.
    host.hidden=false;
    const status=state.role==='host'?`MESTRE • ${state.connected?'ONLINE':'CONECTANDO'}`:state.role==='player'?`JOGADOR • ${state.connected?'ONLINE':'CONECTANDO'}`:'OFFLINE';
    const hostArea=state.role==='host'
      ? `<div><b>Link de convite</b><div class="v071-invite-url">${esc(inviteUrl())}</div><small>O estado da sessão fica salvo no PostgreSQL. O Mestre não precisa manter uma conexão PeerJS aberta.</small><div class="v071-actions"><button class="primary" onclick="MultiplayerV071.copyInvite()">🔗 COPIAR LINK</button><button class="ghost small" onclick="MultiplayerV071.stop()">ENCERRAR MESA</button></div></div><div><b>Jogadores</b><strong class="v071-connected-count">${state.memberCount}</strong><small>${(data.jogadores||[]).length} ficha(s) cadastrada(s) • sincronização em tempo real pelo Supabase.</small></div>`
      : `<div><b>Mesa do Hotel Espelho</b><small>Crie uma mesa online para sincronizar Mestre e Jogadores pelo Supabase.</small><button class="primary" onclick="MultiplayerV071.host()">＋ CRIAR MESA (MESTRE)</button></div><div><b>Sem mesa ativa</b><small>Se você estiver usando somente a ficha local, pode continuar sem sincronização.</small><button class="ghost" onclick="MultiplayerV071.local()">USAR FICHA SEM SINCRONIZAÇÃO</button></div>`;
    host.innerHTML=`<div class="panel-title"><div><span class="icon">◉</span><div><h2>Sala da Mesa</h2><p>PostgreSQL + Realtime • estado persistente da campanha.</p></div></div><span class="sync-badge">${esc(status)}</span></div><div class="v071-mp-grid">${hostArea}</div>`;
    if(state.role==='player'&&state.connected)renderChooser(data.jogadores||[]);
  }
  function renderChooser(players){const host=$('mpPlayerChooser');if(!host)return;host.innerHTML=`<div class="v071-chooser"><b>Escolha sua ficha</b><div>${players.map(p=>`<button class="v071-player-choice" onclick="MultiplayerV071.claim('${esc(p.id)}')"><span>${esc(p.nome)}</span><small>${esc(p.classe||'Classe não definida')} • NEX ${esc(p.nex)}</small></button>`).join('')||'<small class="muted">Nenhuma ficha disponível.</small>'}</div><button class="ghost small" onclick="MultiplayerV071.requestCreate()">＋ CRIAR MINHA FICHA</button></div>`;}
  async function createSession(){
    if(!valid())return toastSafe('Configure o Supabase em config/supabase-config.js antes de criar a mesa.');
    try{
      await ensureAuth();
      const {data:r,error}=await client.rpc('create_rpg_session',{initial_state:snapshot()});
      if(error)throw error;
      state.role='host';state.connected=true;state.sessionId=r.id;state.code=r.code;state.memberId=r.member_id;state.playerId=null;
      subscribe();render();toastSafe(`Mesa criada: ${state.code}`);
    }catch(e){console.error(e);toastSafe(`Não foi possível criar a mesa: ${e.message||e}`)}
  }
  async function connectPlayer(code){
    if(!valid())return toastSafe('Configure o Supabase em config/supabase-config.js antes de entrar na mesa.');
    const clean=String(code||'').trim().toUpperCase();if(!clean)return toastSafe('Convite inválido.');
    try{
      await ensureAuth();
      const {data:r,error}=await client.rpc('join_rpg_session',{session_code:clean});
      if(error)throw error;
      state.role='player';state.connected=true;state.sessionId=r.session_id;state.code=r.code;state.memberId=r.member_id;state.playerId=r.player_id||null;
      applyState(r.state);
      subscribe();render();toastSafe('Conectado à mesa.');
    }catch(e){console.error(e);toastSafe(`Não foi possível entrar na mesa: ${e.message||e}`)}
  }
  async function refreshServerState(){
    if(!valid()||!state.sessionId||state.applying)return;
    try{
      const {data:r,error}=await client.from('rpg_sessions').select('state,updated_at').eq('id',state.sessionId).single();
      if(error)throw error;
      if(r?.state)applyState(r.state);
    }catch(e){console.warn('Supabase state refresh',e.message||e)}
  }
  async function refreshMemberCount(){
    if(!valid()||!state.sessionId)return;
    try{
      const {count,error}=await client.from('rpg_session_members').select('id',{count:'exact',head:true}).eq('session_id',state.sessionId).eq('role','player');
      if(error)throw error;
      state.memberCount=Number(count)||0;
      render();
    }catch(e){console.warn('Supabase member count',e.message||e)}
  }
  function startPolling(){
    clearInterval(state.pollTimer);
    state.pollTimer=setInterval(()=>{
      if(!state.sessionId||state.role==='offline'){clearInterval(state.pollTimer);state.pollTimer=null;return;}
      refreshServerState();
      refreshMemberCount();
    },1500);
    refreshMemberCount();
  }
  function subscribe(){
    if(state.channel)client.removeChannel(state.channel);
    state.channel=client.channel(`rpg-session-${state.sessionId}`).on('postgres_changes',{event:'UPDATE',schema:'public',table:'rpg_sessions',filter:`id=eq.${state.sessionId}`},payload=>{
      if(payload?.new?.state)applyState(payload.new.state);
      refreshMemberCount();
    }).subscribe(status=>{if(status==='SUBSCRIBED'){state.connected=true;render();refreshServerState();refreshMemberCount();startPolling();}});
  }
  function applyState(st){if(!st||state.applying)return;state.applying=true;try{
    data.campanha=clone(st.campanha||{});data.monstros=clone(st.monstros||[]);data.assassinos=clone(st.assassinos||[]);
    const incoming=clone(st.jogadores||[]);
    if(state.role==='player'&&state.playerId){const mine=incoming.find(p=>String(p.id)===String(state.playerId));if(mine){data.jogadores=[mine];selectedPlayer=data.jogadores[0];}else{data.jogadores=[];selectedPlayer=null;state.playerId=null;toastSafe('Sua ficha não está mais disponível nesta mesa.');}}
    else if(state.role==='host'){data.jogadores=incoming;}
    if(typeof saveLocal==='function')saveLocal();
    renderPlayerCards?.();if(selectedPlayer)renderSheet?.();renderMaster?.();render?.();
  }finally{state.applying=false;}}
  async function saveServer(nextState){
    if(!valid()||!state.sessionId||state.applying)return;
    try{
      if(state.role==='host'){
        const {error}=await client.from('rpg_sessions').update({state:nextState,updated_at:new Date().toISOString()}).eq('id',state.sessionId);if(error)throw error;
      } else if(state.role==='player'&&state.playerId){
        const p=(data.jogadores||[]).find(x=>String(x.id)===String(state.playerId));if(!p)return;
        const {error}=await client.rpc('update_rpg_player',{p_session_id:state.sessionId,p_player_id:state.playerId,p_player:p});if(error)throw error;
      }
    }catch(e){console.error('Supabase save',e);toastSafe(`Falha ao salvar sincronização: ${e.message||e}`)}
  }
  function schedulePush(){clearTimeout(state.pushTimer);state.pushTimer=setTimeout(()=>saveServer(snapshot()),100);}
  async function claimPlayer(id){
    if(state.role!=='player')return;
    try{const {data:r,error}=await client.rpc('claim_rpg_player',{p_session_id:state.sessionId,p_player_id:String(id)});if(error)throw error;state.playerId=String(id);applyState(r.state);render();toastSafe(`Ficha selecionada: ${r.player_name||id}`);}
    catch(e){console.error(e);toastSafe(`Não foi possível assumir a ficha: ${e.message||e}`)}
  }
  async function requestCreate(){
    if(state.role!=='player')return;const name=prompt('Nome do personagem:');if(!name)return;const origem=prompt('Profissão / Origem (ex.: Atleta):','Atleta');if(!ORIGIN_PROFILES[origem])return toastSafe('Origem inválida.');
    try{
      const {data:r,error}=await client.rpc('create_rpg_player',{p_session_id:state.sessionId,p_name:name,p_origin:origem});if(error)throw error;
      state.playerId=r.player_id;
      let base=typeof buildNewPlayer==='function'?buildNewPlayer(name,origem):{id:r.player_id,nome:name,origem,profissao:origem};
      base.id=r.player_id;base.nome=name;base.origem=origem;base.profissao=origem;if(typeof applyOriginProfile==='function')applyOriginProfile(base);
      data.jogadores=[base];selectedPlayer=base;saveLocal();
      await saveServer(snapshot());
      const {data:joined,error:readError}=await client.from('rpg_sessions').select('state').eq('id',state.sessionId).single();if(readError)throw readError;
      applyState(joined.state);render();toastSafe('Ficha criada e vinculada à mesa.');
    }
    catch(e){console.error(e);toastSafe(`Não foi possível criar a ficha: ${e.message||e}`)}
  }
  async function deletePlayer(id){if(state.role!=='host')return;try{const st=snapshot();st.jogadores=st.jogadores.filter(p=>String(p.id)!==String(id));await saveServer(st);applyState(st);}catch(e){console.error(e)}}
  async function resource(pid,key,value){if(state.role==='host'){const p=data.jogadores.find(x=>String(x.id)===String(pid));if(!p)return;const max=Number(p[key+'Max'])||0;p[key]=Math.max(0,Math.min(max,Number(value)||0));persist();selectedPlayer=p;renderSheet();schedulePush();}else if(state.role==='player'){const p=data.jogadores.find(x=>String(x.id)===String(pid));if(!p)return;const max=Number(p[key+'Max'])||0;p[key]=Math.max(0,Math.min(max,Number(value)||0));persist();selectedPlayer=p;renderSheet();schedulePush();}}
  function local(){stop(false);toastSafe('Modo local ativo.');}
  function stop(show=true){if(state.channel&&client)client.removeChannel(state.channel);state.channel=null;clearInterval(state.pollTimer);state.pollTimer=null;clearTimeout(state.pushTimer);state.role='offline';state.connected=false;state.sessionId=null;state.code=null;state.memberId=null;state.playerId=null;state.memberCount=0;render();if(show)toastSafe('Sala encerrada.');}
  function boot(){
    if(!ready){console.warn('Supabase não configurado.');return;}
    if(!window.supabase?.createClient){toastSafe('Biblioteca Supabase não carregou.');return;}
    // Cada aba/dispositivo precisa ter uma identidade Supabase independente.
    // O armazenamento padrão do Supabase usa localStorage e, por isso, Mestre
    // e Jogador abertos no mesmo navegador poderiam reutilizar o mesmo usuário
    // anônimo. Isso fazia o JOIN reaproveitar o membro do Mestre e o contador
    // permanecia em zero. sessionStorage mantém a sessão durante a aba, mas
    // isola o Mestre e cada Jogador.
    const tabKey='hotel-espelho-tab-id';
    let tabId=sessionStorage.getItem(tabKey);
    if(!tabId){tabId=(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));sessionStorage.setItem(tabKey,tabId);}
    client=window.supabase.createClient(C.url,C.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storage:sessionStorage,storageKey:`hotel-espelho-auth-${tabId}`}});
    const invite=new URLSearchParams(location.search).get('convite');
    if(invite){setTimeout(()=>connectPlayer(invite),300);}
    const oldSave=window.saveLocal;
    if(typeof oldSave==='function'&&!oldSave.__supabaseV11){const wrapped=function(){const r=oldSave.apply(this,arguments);if(!state.applying)schedulePush();return r};wrapped.__supabaseV11=true;window.saveLocal=wrapped;}
    render();
  }
  window.MultiplayerV071={host:createSession,connect:connectPlayer,copyInvite,claim:claimPlayer,requestCreate,publishCreatedPlayer:()=>true,resource,deletePlayer,local,stop,sync:()=>saveServer(snapshot()),syncPlayer:()=>saveServer(snapshot()),status:()=>clone({role:state.role,room:state.code,connected:state.connected,players:(data?.jogadores||[]).length,connectedPlayers:state.memberCount})};
  window.HotelSupabase={state,client:()=>client,snapshot,saveServer,applyState};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
