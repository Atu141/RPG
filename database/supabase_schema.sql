-- ARQUIVO PARANORMAL — Hotel Espelho
-- Etapa 1 gratuita: Supabase Auth (anônimo) + PostgreSQL + Realtime
-- Execute este script inteiro no SQL Editor do Supabase.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.rpg_sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rpg_session_members (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.rpg_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id text,
  role text not null default 'player' check (role in ('host','player')),
  created_at timestamptz not null default now(),
  unique(session_id,user_id)
);

create index if not exists rpg_sessions_host_idx on public.rpg_sessions(host_user_id);
create index if not exists rpg_members_session_idx on public.rpg_session_members(session_id);
create index if not exists rpg_members_user_idx on public.rpg_session_members(user_id);

alter table public.rpg_sessions enable row level security;
alter table public.rpg_session_members enable row level security;

create or replace function public.create_rpg_session(initial_state jsonb)
returns jsonb language plpgsql security definer set search_path=public,auth,extensions as $$
declare v_id uuid; v_code text; v_member uuid;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  loop
    v_code := upper(substr(encode(extensions.gen_random_bytes(8),'hex'),1,6));
    exit when not exists(select 1 from public.rpg_sessions where code=v_code);
  end loop;
  insert into public.rpg_sessions(code,host_user_id,state) values(v_code,auth.uid(),coalesce(initial_state,'{}'::jsonb)) returning id into v_id;
  insert into public.rpg_session_members(session_id,user_id,role) values(v_id,auth.uid(),'host') returning id into v_member;
  return jsonb_build_object('id',v_id,'code',v_code,'member_id',v_member,'state',(select state from public.rpg_sessions where id=v_id));
end; $$;

create or replace function public.join_rpg_session(session_code text)
returns jsonb language plpgsql security definer set search_path=public,auth,extensions as $$
declare s public.rpg_sessions; m uuid; p text; v_role text;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into s from public.rpg_sessions where code=upper(trim(session_code));
  if s.id is null then raise exception 'SESSION_NOT_FOUND'; end if;
  select id, role, player_id into m, v_role, p
  from public.rpg_session_members
  where session_id=s.id and user_id=auth.uid();
  if m is not null then
    if v_role='host' then
      raise exception 'HOST_CANNOT_JOIN_AS_PLAYER';
    end if;
  else
    insert into public.rpg_session_members(session_id,user_id,role)
    values(s.id,auth.uid(),'player')
    returning id into m;
  end if;
  select player_id into p from public.rpg_session_members where id=m;
  return jsonb_build_object('session_id',s.id,'code',s.code,'member_id',m,'player_id',p,'state',s.state);
end; $$;

create or replace function public.claim_rpg_player(p_session_id uuid,p_player_id text)
returns jsonb language plpgsql security definer set search_path=public,auth,extensions as $$
declare s public.rpg_sessions; exists_player boolean; pname text;
begin
  select * into s from public.rpg_sessions where id=p_session_id;
  if s.id is null then raise exception 'SESSION_NOT_FOUND'; end if;
  if not exists(select 1 from public.rpg_session_members where session_id=p_session_id and user_id=auth.uid()) then raise exception 'NOT_MEMBER'; end if;
  if exists(select 1 from public.rpg_session_members where session_id=p_session_id and player_id=p_player_id and user_id<>auth.uid()) then raise exception 'PLAYER_ALREADY_CLAIMED'; end if;
  select exists(select 1 from jsonb_array_elements(coalesce(s.state->'jogadores','[]'::jsonb)) j where j->>'id'=p_player_id) into exists_player;
  if not exists_player then raise exception 'PLAYER_NOT_FOUND'; end if;
  update public.rpg_session_members set player_id=p_player_id where session_id=p_session_id and user_id=auth.uid();
  select j->>'nome' into pname from jsonb_array_elements(s.state->'jogadores') j where j->>'id'=p_player_id limit 1;
  return jsonb_build_object('state',s.state,'player_name',pname);
end; $$;

create or replace function public.create_rpg_player(p_session_id uuid,p_name text,p_origin text)
returns jsonb language plpgsql security definer set search_path=public,auth,extensions as $$
declare s public.rpg_sessions; p jsonb; pid text;
begin
  select * into s from public.rpg_sessions where id=p_session_id;
  if s.id is null then raise exception 'SESSION_NOT_FOUND'; end if;
  if not exists(select 1 from public.rpg_session_members where session_id=p_session_id and user_id=auth.uid()) then raise exception 'NOT_MEMBER'; end if;
  pid := 'player_'||replace(gen_random_uuid()::text,'-','');
  p := jsonb_build_object('id',pid,'nome',left(trim(p_name),80),'origem',trim(p_origin),'profissao',trim(p_origin),'classe',null,'nex','5%','pv',0,'pe',0,'san',0,'itens',jsonb_build_array(),'rituais',jsonb_build_array(),'pericias',jsonb_build_array());
  update public.rpg_sessions set state=jsonb_set(coalesce(state,'{}'::jsonb),'{jogadores}',coalesce(state->'jogadores','[]'::jsonb)||jsonb_build_array(p),true),updated_at=now() where id=p_session_id returning state into s.state;
  update public.rpg_session_members set player_id=pid where session_id=p_session_id and user_id=auth.uid();
  return jsonb_build_object('player_id',pid,'state',s.state);
end; $$;

create or replace function public.update_rpg_player(p_session_id uuid,p_player_id text,p_player jsonb)
returns jsonb language plpgsql security definer set search_path=public,auth,extensions as $$
declare s public.rpg_sessions; arr jsonb; outarr jsonb:='[]'::jsonb; j jsonb;
begin
  select * into s from public.rpg_sessions where id=p_session_id;
  if s.id is null then raise exception 'SESSION_NOT_FOUND'; end if;
  if not exists(select 1 from public.rpg_session_members where session_id=p_session_id and user_id=auth.uid() and player_id=p_player_id) then raise exception 'PLAYER_NOT_ASSIGNED'; end if;
  p_player := jsonb_set(coalesce(p_player,'{}'::jsonb),'{id}',to_jsonb(p_player_id),true);
  arr:=coalesce(s.state->'jogadores','[]'::jsonb);
  for j in select * from jsonb_array_elements(arr) loop
    if j->>'id'=p_player_id then outarr:=outarr||jsonb_build_array(p_player); else outarr:=outarr||jsonb_build_array(j); end if;
  end loop;
  update public.rpg_sessions set state=jsonb_set(s.state,'{jogadores}',outarr,true),updated_at=now() where id=p_session_id;
  return jsonb_build_object('ok',true);
end; $$;

drop policy if exists rpg_sessions_select_member on public.rpg_sessions;
drop policy if exists rpg_sessions_update_host on public.rpg_sessions;
drop policy if exists rpg_members_select_member on public.rpg_session_members;
create policy rpg_sessions_select_member on public.rpg_sessions for select to authenticated using (host_user_id=auth.uid() or exists(select 1 from public.rpg_session_members m where m.session_id=id and m.user_id=auth.uid()));
create policy rpg_sessions_update_host on public.rpg_sessions for update to authenticated using (host_user_id=auth.uid()) with check (host_user_id=auth.uid());
create policy rpg_members_select_member on public.rpg_session_members for select to authenticated using (user_id=auth.uid() or exists(select 1 from public.rpg_sessions s where s.id=session_id and s.host_user_id=auth.uid()));

-- Habilita os eventos de UPDATE para o Realtime, sem falhar se já estiver habilitado.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='rpg_sessions') then
    alter publication supabase_realtime add table public.rpg_sessions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='rpg_session_members') then
    alter publication supabase_realtime add table public.rpg_session_members;
  end if;
end $$;

grant execute on function public.create_rpg_session(jsonb) to authenticated;
grant execute on function public.join_rpg_session(text) to authenticated;
grant execute on function public.claim_rpg_player(uuid,text) to authenticated;
grant execute on function public.create_rpg_player(uuid,text,text) to authenticated;
grant execute on function public.update_rpg_player(uuid,text,jsonb) to authenticated;
