-- 1. Admin role infrastructure
do $$ begin
  create type public.app_role as enum ('admin', 'moderator', 'user');
exception when duplicate_object then null; end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

drop policy if exists "Users read own roles" on public.user_roles;
create policy "Users read own roles" on public.user_roles
  for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  );
$$;

-- Existing auth account(s) are the site admins.
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role from auth.users
on conflict (user_id, role) do nothing;

-- 2. Replace every "any authenticated user" admin policy with a real admin check
do $$
declare
  t text;
  p record;
  tables text[] := array[
    'answers','author_profile','badges','books','challenge_leaderboard','challenge_winners',
    'challenges','characters','contact_links','debate_comments','debate_topics',
    'landing_page_sections','member_badges','member_notifications','member_sessions','members',
    'news_posts','page_media','press_mentions','questions','testimonials','videos'
  ];
begin
  foreach t in array tables loop
    for p in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = t and policyname ilike 'Admin%'
    loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.has_role(auth.uid(), ''admin'')) with check (public.has_role(auth.uid(), ''admin''))',
      'Admins manage ' || t, t
    );
  end loop;
end $$;

-- 3. Drop forgeable custom-session policies (member access runs through trusted server code)
drop policy if exists "Members insert own answers" on public.answers;
drop policy if exists "Members read own answers" on public.answers;
drop policy if exists "Members read own" on public.members;
drop policy if exists "Members update own" on public.members;
drop policy if exists "Members read own sessions" on public.member_sessions;
drop policy if exists "Members insert comments" on public.debate_comments;
drop policy if exists "Members update own comments" on public.debate_comments;

-- Member sessions are service-role only.
drop policy if exists "Admins manage member_sessions" on public.member_sessions;
revoke all on public.member_sessions from authenticated, anon;

-- 4. Password hashes are never exposed through the Data API
revoke select (password_hash), update (password_hash) on public.members from authenticated;
revoke all on public.members from anon;

-- 5. Answer keys are not publicly readable
drop policy if exists "Anyone read questions" on public.questions;
revoke all on public.questions from anon;

-- 6. Storage: only admins may write site media
drop policy if exists "Admin write media" on storage.objects;
create policy "Admins write media" on storage.objects
  for all to authenticated
  using (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));

-- 7. Missing challenge helper routines
create or replace function public.notify_member(
  p_member_id uuid, p_type text, p_content text, p_link text default null
) returns void
language sql
set search_path = public
as $$
  insert into public.member_notifications (member_id, type, content, link)
  values (p_member_id, p_type, p_content, p_link);
$$;

create or replace function public.notify_all_members(
  p_type text, p_content text, p_link text default null
) returns integer
language plpgsql
set search_path = public
as $$
declare n integer;
begin
  insert into public.member_notifications (member_id, type, content, link)
  select id, p_type, p_content, p_link from public.members where is_active is not false;
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.award_badges(
  p_member_id uuid, p_challenge_id uuid
) returns text[]
language plpgsql
set search_path = public
as $$
declare
  v_total integer;
  v_answered integer;
  v_correct integer;
  v_fastest integer;
  v_awarded text[] := '{}';
  v_names text[] := '{}';
  v_name text;
begin
  select count(*) into v_total from public.questions where challenge_id = p_challenge_id;

  select count(*), count(*) filter (where a.is_correct), min(a.time_taken_seconds)
    into v_answered, v_correct, v_fastest
  from public.answers a
  join public.questions q on q.id = a.question_id
  where q.challenge_id = p_challenge_id and a.member_id = p_member_id;

  if coalesce(v_answered, 0) >= 1 then v_names := v_names || 'First Answer'; end if;
  if v_total > 0 and coalesce(v_answered, 0) >= v_total then v_names := v_names || 'Full Week'; end if;
  if v_total > 0 and coalesce(v_correct, 0) >= v_total then v_names := v_names || 'Perfect Score'; end if;
  if coalesce(v_fastest, 999999) <= 10 then v_names := v_names || 'Speed Demon'; end if;

  foreach v_name in array v_names loop
    insert into public.member_badges (member_id, badge_id)
    select p_member_id, b.id
    from public.badges b
    where b.name = v_name
      and not exists (
        select 1 from public.member_badges mb
        where mb.member_id = p_member_id and mb.badge_id = b.id
      )
    limit 1;
    if found then v_awarded := v_awarded || v_name; end if;
  end loop;

  return v_awarded;
end $$;

create or replace function public.run_assessment(p_challenge_id uuid)
returns integer
language plpgsql
set search_path = public
as $$
declare n integer;
begin
  delete from public.challenge_leaderboard where challenge_id = p_challenge_id;

  insert into public.challenge_leaderboard
    (challenge_id, member_id, correct_count, total_answered, average_time, rank, assessed_at)
  select p_challenge_id, s.member_id, s.correct_count, s.total_answered, s.average_time,
         row_number() over (order by s.correct_count desc, s.average_time asc),
         now()
  from (
    select a.member_id,
           count(*) filter (where a.is_correct)::int as correct_count,
           count(*)::int as total_answered,
           avg(coalesce(a.time_taken_seconds, 0))::double precision as average_time
    from public.answers a
    join public.questions q on q.id = a.question_id
    where q.challenge_id = p_challenge_id and a.member_id is not null
    group by a.member_id
  ) s;
  get diagnostics n = row_count;

  perform public.award_badges(cl.member_id, p_challenge_id)
  from public.challenge_leaderboard cl
  where cl.challenge_id = p_challenge_id and cl.member_id is not null;

  return n;
end $$;

create or replace function public.select_challenge_winner(p_challenge_id uuid)
returns integer
language plpgsql
set search_path = public
as $$
declare
  n integer;
  v_top uuid;
  v_title text;
begin
  perform public.run_assessment(p_challenge_id);

  if exists (select 1 from public.challenge_winners where challenge_id = p_challenge_id) then
    return 0;
  end if;

  insert into public.challenge_winners (challenge_id, member_id, rank, announced_at)
  select p_challenge_id, cl.member_id, cl.rank, now()
  from public.challenge_leaderboard cl
  where cl.challenge_id = p_challenge_id and cl.rank <= 3 and cl.member_id is not null;
  get diagnostics n = row_count;

  select member_id into v_top from public.challenge_winners
  where challenge_id = p_challenge_id and rank = 1;
  select title into v_title from public.challenges where id = p_challenge_id;

  if v_top is not null then
    insert into public.member_badges (member_id, badge_id)
    select v_top, b.id from public.badges b
    where b.name = 'Ultimate Fan'
      and not exists (
        select 1 from public.member_badges mb where mb.member_id = v_top and mb.badge_id = b.id
      )
    limit 1;

    perform public.notify_member(
      v_top, 'winner',
      'You won ' || coalesce(v_title, 'the challenge') || '!', '/member/leaderboard'
    );
  end if;

  return n;
end $$;

revoke all on function public.notify_member(uuid, text, text, text) from anon, authenticated;
revoke all on function public.notify_all_members(text, text, text) from anon, authenticated;
revoke all on function public.award_badges(uuid, uuid) from anon, authenticated;
revoke all on function public.run_assessment(uuid) from anon, authenticated;
revoke all on function public.select_challenge_winner(uuid) from anon, authenticated;