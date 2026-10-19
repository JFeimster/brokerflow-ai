-- Additive, organization-scoped follow-up tasks. The MCP server performs current
-- membership/permission checks; these RPCs keep writes atomic and attributable.
create table public.brokerflow_follow_up_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  review_id uuid references public.brokerflow_review_requests(id) on delete restrict,
  assigned_to uuid references auth.users(id) on delete set null,
  task_type text not null check (task_type in ('call','email','request_information','document_follow_up','internal_review','other')),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '' check (char_length(description) <= 500),
  due_date date,
  status text not null default 'open' check (status in ('open','completed')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  completed_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  create_idempotency_hash text not null check (create_idempotency_hash ~ '^[0-9a-f]{64}$'),
  create_request_fingerprint text not null check (create_request_fingerprint ~ '^[0-9a-f]{64}$'),
  completion_idempotency_hash text check (completion_idempotency_hash is null or completion_idempotency_hash ~ '^[0-9a-f]{64}$'),
  completion_request_fingerprint text check (completion_request_fingerprint is null or completion_request_fingerprint ~ '^[0-9a-f]{64}$'),
  unique (organization_id, created_by, create_idempotency_hash),
  check ((status = 'open' and completed_by is null and completed_at is null and completion_idempotency_hash is null and completion_request_fingerprint is null)
      or (status = 'completed' and completed_by is not null and completed_at is not null and completion_idempotency_hash is not null and completion_request_fingerprint is not null))
);

create table public.brokerflow_follow_up_task_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  task_id uuid not null references public.brokerflow_follow_up_tasks(id) on delete restrict,
  event_type text not null check (event_type in ('task_created','task_completed')),
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  idempotency_hash text not null check (idempotency_hash ~ '^[0-9a-f]{64}$'),
  request_fingerprint text not null check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  unique (organization_id, task_id, event_type, actor_user_id, idempotency_hash)
);

create index brokerflow_follow_up_tasks_queue_idx
  on public.brokerflow_follow_up_tasks (organization_id, status, due_date, created_at desc);
create index brokerflow_follow_up_tasks_owner_idx
  on public.brokerflow_follow_up_tasks (organization_id, assigned_to, status, due_date);
create index brokerflow_follow_up_tasks_review_idx
  on public.brokerflow_follow_up_tasks (organization_id, review_id, created_at desc);
create index brokerflow_follow_up_task_events_task_idx
  on public.brokerflow_follow_up_task_events (organization_id, task_id, created_at desc);

alter table public.brokerflow_follow_up_tasks enable row level security;
alter table public.brokerflow_follow_up_task_events enable row level security;
revoke all on public.brokerflow_follow_up_tasks, public.brokerflow_follow_up_task_events from anon, authenticated, service_role;
grant select on public.brokerflow_follow_up_tasks, public.brokerflow_follow_up_task_events to service_role;

create or replace function public.brokerflow_create_follow_up_task(
  p_organization_id uuid,
  p_actor_user_id uuid,
  p_idempotency_key text,
  p_task jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_key text;
  v_fingerprint text;
  v_task public.brokerflow_follow_up_tasks%rowtype;
begin
  if p_actor_user_id is null or p_idempotency_key is null or char_length(p_idempotency_key) not between 16 and 200
     or p_task is null or jsonb_typeof(p_task) <> 'object'
     or coalesce(p_task->>'title','') = '' or char_length(p_task->>'title') > 160
     or char_length(coalesce(p_task->>'description','')) > 500
     or p_task->>'task_type' not in ('call','email','request_information','document_follow_up','internal_review','other')
     or (p_task ? 'assigned_to' and p_task->>'assigned_to' is not null and (p_task->>'assigned_to') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
     or (p_task ? 'review_id' and p_task->>'review_id' is not null and (p_task->>'review_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
     or (p_task ? 'due_date' and p_task->>'due_date' is not null and (p_task->>'due_date') !~ '^\d{4}-\d{2}-\d{2}$') then
    raise exception 'invalid task input' using errcode = '22023';
  end if;
  v_key := encode(sha256(convert_to(p_idempotency_key, 'UTF8')), 'hex');
  v_fingerprint := encode(sha256(convert_to(p_task::text, 'UTF8')), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(p_organization_id::text || '|' || p_actor_user_id::text || '|' || v_key, 0));

  select * into v_task from public.brokerflow_follow_up_tasks
   where organization_id = p_organization_id and created_by = p_actor_user_id and create_idempotency_hash = v_key;
  if found then
    if v_task.create_request_fingerprint <> v_fingerprint then raise exception 'idempotency conflict' using errcode = '23505'; end if;
    return (to_jsonb(v_task) - 'create_idempotency_hash' - 'create_request_fingerprint' - 'completion_idempotency_hash' - 'completion_request_fingerprint') || jsonb_build_object('duplicate', true);
  end if;

  if not exists (
    select 1 from public.memberships m join public.organizations o on o.id = m.organization_id
    where m.organization_id = p_organization_id and m.user_id = p_actor_user_id and m.status = 'active' and o.status = 'active'
  ) then raise exception 'active organization membership required' using errcode = '23503'; end if;
  if p_task->>'assigned_to' is not null and not exists (
    select 1 from public.memberships m where m.organization_id = p_organization_id and m.user_id = (p_task->>'assigned_to')::uuid and m.status = 'active'
  ) then raise exception 'active assigned owner membership required' using errcode = '23503'; end if;
  if p_task->>'review_id' is not null and not exists (
    select 1 from public.brokerflow_review_requests r where r.organization_id = p_organization_id and r.id = (p_task->>'review_id')::uuid
  ) then raise exception 'related review must belong to organization' using errcode = '23503'; end if;

  insert into public.brokerflow_follow_up_tasks(
    organization_id, review_id, assigned_to, task_type, title, description, due_date,
    created_by, create_idempotency_hash, create_request_fingerprint
  ) values (
    p_organization_id,
    nullif(p_task->>'review_id','')::uuid,
    nullif(p_task->>'assigned_to','')::uuid,
    p_task->>'task_type',
    trim(p_task->>'title'),
    trim(coalesce(p_task->>'description','')),
    nullif(p_task->>'due_date','')::date,
    p_actor_user_id, v_key, v_fingerprint
  ) returning * into v_task;

  insert into public.brokerflow_follow_up_task_events(organization_id, task_id, event_type, actor_user_id, idempotency_hash, request_fingerprint)
  values (p_organization_id, v_task.id, 'task_created', p_actor_user_id, v_key, v_fingerprint);
  return (to_jsonb(v_task) - 'create_idempotency_hash' - 'create_request_fingerprint' - 'completion_idempotency_hash' - 'completion_request_fingerprint') || jsonb_build_object('duplicate', false);
end
$$;

create or replace function public.brokerflow_complete_follow_up_task(
  p_organization_id uuid,
  p_task_id uuid,
  p_actor_user_id uuid,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_key text;
  v_fingerprint text;
  v_task public.brokerflow_follow_up_tasks%rowtype;
begin
  if p_actor_user_id is null or p_idempotency_key is null or char_length(p_idempotency_key) not between 16 and 200 then
    raise exception 'invalid completion input' using errcode = '22023';
  end if;
  v_key := encode(sha256(convert_to(p_idempotency_key, 'UTF8')), 'hex');
  v_fingerprint := encode(sha256(convert_to(jsonb_build_object('task_id', p_task_id)::text, 'UTF8')), 'hex');
  select * into v_task from public.brokerflow_follow_up_tasks
   where organization_id = p_organization_id and id = p_task_id for update;
  if not found then raise exception 'task missing' using errcode = 'P0002'; end if;

  if v_task.status = 'completed' then
    if v_task.completed_by = p_actor_user_id and v_task.completion_idempotency_hash = v_key and v_task.completion_request_fingerprint = v_fingerprint then
      return (to_jsonb(v_task) - 'create_idempotency_hash' - 'create_request_fingerprint' - 'completion_idempotency_hash' - 'completion_request_fingerprint') || jsonb_build_object('duplicate', true);
    end if;
    raise exception 'task already completed' using errcode = '40001';
  end if;

  if not exists (
    select 1 from public.memberships m join public.organizations o on o.id = m.organization_id
    where m.organization_id = p_organization_id and m.user_id = p_actor_user_id and m.status = 'active' and o.status = 'active'
  ) then raise exception 'active organization membership required' using errcode = '23503'; end if;
  update public.brokerflow_follow_up_tasks
     set status = 'completed', completed_by = p_actor_user_id, completed_at = now(),
         completion_idempotency_hash = v_key, completion_request_fingerprint = v_fingerprint
   where id = p_task_id
  returning * into v_task;
  insert into public.brokerflow_follow_up_task_events(organization_id, task_id, event_type, actor_user_id, idempotency_hash, request_fingerprint)
  values (p_organization_id, p_task_id, 'task_completed', p_actor_user_id, v_key, v_fingerprint);
  return (to_jsonb(v_task) - 'create_idempotency_hash' - 'create_request_fingerprint' - 'completion_idempotency_hash' - 'completion_request_fingerprint') || jsonb_build_object('duplicate', false);
end
$$;

revoke all on function public.brokerflow_create_follow_up_task(uuid,uuid,text,jsonb) from public, anon, authenticated;
revoke all on function public.brokerflow_complete_follow_up_task(uuid,uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.brokerflow_create_follow_up_task(uuid,uuid,text,jsonb) to service_role;
grant execute on function public.brokerflow_complete_follow_up_task(uuid,uuid,uuid,text) to service_role;
