-- Additive BrokerFlow review ledger. This file is prepared for owner application;
-- it is intentionally not applied by PR implementation.
create table if not exists public.brokerflow_review_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  review_request_id text not null unique,
  source text not null,
  requester_name text not null,
  borrower_type text not null,
  business_name text,
  loan_purpose text not null,
  requested_amount numeric(14,2) not null check (requested_amount > 0),
  state text not null,
  urgency text not null default 'normal' check (urgency in ('low','normal','high','same_day')),
  recommended_review_path text,
  scenario jsonb not null default '{}'::jsonb,
  status text not null default 'queued_for_human_review' check (status in ('queued_for_human_review','in_review','needs_information','reviewed')),
  version integer not null default 1 check (version > 0),
  create_idempotency_hash text not null,
  create_actor_scope text not null,
  request_fingerprint text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, source, create_actor_scope, create_idempotency_hash)
);

create table if not exists public.brokerflow_review_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  review_id uuid not null references public.brokerflow_review_requests(id) on delete restrict,
  event_type text not null check (event_type in ('review_created','review_started','information_requested','review_marked_reviewed')),
  actor_user_id uuid references auth.users(id) on delete set null,
  action_actor_scope text,
  actor_source text not null check (actor_source in ('user','trusted_integration')),
  previous_status text,
  new_status text not null check (new_status in ('queued_for_human_review','in_review','needs_information','reviewed')),
  note text check (note is null or char_length(note) <= 500),
  version integer not null check (version > 0),
  idempotency_hash text not null,
  request_fingerprint text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, review_id, action_actor_scope, idempotency_hash)
);

create index if not exists brokerflow_review_queue_idx on public.brokerflow_review_requests (organization_id, status, created_at desc);
create index if not exists brokerflow_review_events_idx on public.brokerflow_review_events (organization_id, created_at desc);
create index if not exists brokerflow_review_events_review_idx on public.brokerflow_review_events (organization_id, review_id, created_at desc);

alter table public.brokerflow_review_requests enable row level security;
alter table public.brokerflow_review_events enable row level security;
revoke all on public.brokerflow_review_requests, public.brokerflow_review_events from anon, authenticated;
grant select on public.brokerflow_review_requests to service_role;
grant select on public.brokerflow_review_events to service_role;

create or replace function public.brokerflow_create_review(p_organization_id uuid, p_actor_user_id uuid, p_idempotency_key text, p_scenario jsonb)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_key text := encode(sha256(convert_to(p_idempotency_key, 'UTF8')), 'hex');
        v_actor_scope text := coalesce(p_actor_user_id::text,'trusted_integration');
        v_fingerprint text := encode(sha256(convert_to(p_scenario::text, 'UTF8')), 'hex');
        v_review public.brokerflow_review_requests%rowtype;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_organization_id::text||'|'||coalesce(p_scenario->>'source','custom_gpt')||'|'||v_actor_scope||'|'||v_key,0));
  select * into v_review from public.brokerflow_review_requests
   where organization_id=p_organization_id and source=coalesce(p_scenario->>'source','custom_gpt') and create_actor_scope=v_actor_scope and create_idempotency_hash=v_key;
  if found then
    if v_review.request_fingerprint <> v_fingerprint then raise exception 'idempotency conflict' using errcode='23505'; end if;
    return (to_jsonb(v_review) - 'create_idempotency_hash' - 'create_actor_scope' - 'request_fingerprint') || jsonb_build_object('duplicate',true);
  end if;
  insert into public.brokerflow_review_requests(organization_id,review_request_id,source,requester_name,borrower_type,business_name,loan_purpose,requested_amount,state,urgency,recommended_review_path,scenario,create_idempotency_hash,create_actor_scope,request_fingerprint,created_by)
  values(p_organization_id,'lmr_'||replace(gen_random_uuid()::text,'-',''),p_scenario->>'source',p_scenario->>'requester_name',p_scenario->>'borrower_type',p_scenario->>'business_name',p_scenario->>'loan_purpose',(p_scenario->>'requested_amount')::numeric,p_scenario->>'state',coalesce(p_scenario->>'urgency','normal'),p_scenario->>'recommended_review_path',p_scenario,v_key,v_actor_scope,v_fingerprint,p_actor_user_id)
  returning * into v_review;
  insert into public.brokerflow_review_events(organization_id,review_id,event_type,actor_user_id,action_actor_scope,actor_source,new_status,version,idempotency_hash,request_fingerprint)
  values(p_organization_id,v_review.id,'review_created',p_actor_user_id,v_actor_scope,case when p_actor_user_id is null then 'trusted_integration' else 'user' end,v_review.status,1,v_key,v_fingerprint);
  return (to_jsonb(v_review) - 'create_idempotency_hash' - 'create_actor_scope' - 'request_fingerprint') || jsonb_build_object('duplicate',false);
end $$;

create or replace function public.brokerflow_apply_review_action(p_organization_id uuid,p_review_id uuid,p_actor_user_id uuid,p_action text,p_note text,p_expected_version integer,p_idempotency_key text,p_next_status text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_key text := encode(sha256(convert_to(p_idempotency_key, 'UTF8')), 'hex');
        v_fingerprint text := encode(sha256(convert_to(jsonb_build_object('action',p_action,'note',p_note,'expected_version',p_expected_version)::text, 'UTF8')), 'hex');
        v_review public.brokerflow_review_requests%rowtype;
        v_event public.brokerflow_review_events%rowtype;
        v_previous_status text;
        v_event_type text;
begin
  select * into v_event from public.brokerflow_review_events where organization_id=p_organization_id and review_id=p_review_id and action_actor_scope=p_actor_user_id::text and idempotency_hash=v_key;
  if found then
    if v_event.request_fingerprint <> v_fingerprint then raise exception 'idempotency conflict' using errcode='23505'; end if;
    select * into v_review from public.brokerflow_review_requests where id=p_review_id and organization_id=p_organization_id;
    return (to_jsonb(v_review) - 'create_idempotency_hash' - 'create_actor_scope' - 'request_fingerprint') || jsonb_build_object('duplicate',true);
  end if;
  select * into v_review from public.brokerflow_review_requests where id=p_review_id and organization_id=p_organization_id for update;
  if not found then raise exception 'review missing' using errcode='P0002'; end if;
  select * into v_event from public.brokerflow_review_events where organization_id=p_organization_id and review_id=p_review_id and action_actor_scope=p_actor_user_id::text and idempotency_hash=v_key;
  if found then
    if v_event.request_fingerprint <> v_fingerprint then raise exception 'idempotency conflict' using errcode='23505'; end if;
    return (to_jsonb(v_review) - 'create_idempotency_hash' - 'create_actor_scope' - 'request_fingerprint') || jsonb_build_object('duplicate',true);
  end if;
  if v_review.version <> p_expected_version then raise exception 'review version conflict' using errcode='40001'; end if;
  v_previous_status := v_review.status;
  if not ((p_action='start_review' and v_review.status in ('queued_for_human_review','needs_information') and p_next_status='in_review') or (p_action='request_information' and v_review.status='in_review' and p_next_status='needs_information' and char_length(trim(p_note)) between 1 and 500) or (p_action='mark_reviewed' and v_review.status='in_review' and p_next_status='reviewed')) then raise exception 'invalid transition' using errcode='22023'; end if;
  v_event_type := case p_action when 'start_review' then 'review_started' when 'request_information' then 'information_requested' else 'review_marked_reviewed' end;
  update public.brokerflow_review_requests set status=p_next_status,version=version+1,updated_at=now() where id=p_review_id returning * into v_review;
  insert into public.brokerflow_review_events(organization_id,review_id,event_type,actor_user_id,action_actor_scope,actor_source,previous_status,new_status,note,version,idempotency_hash,request_fingerprint)
  values(p_organization_id,p_review_id,v_event_type,p_actor_user_id,p_actor_user_id::text,'user',v_previous_status,p_next_status,nullif(trim(p_note),''),v_review.version,v_key,v_fingerprint);
  return (to_jsonb(v_review) - 'create_idempotency_hash' - 'create_actor_scope' - 'request_fingerprint') || jsonb_build_object('duplicate',false);
end $$;

revoke all on function public.brokerflow_create_review(uuid,uuid,text,jsonb) from public, anon, authenticated;
revoke all on function public.brokerflow_apply_review_action(uuid,uuid,uuid,text,text,integer,text,text) from public, anon, authenticated;
grant execute on function public.brokerflow_create_review(uuid,uuid,text,jsonb) to service_role;
grant execute on function public.brokerflow_apply_review_action(uuid,uuid,uuid,text,text,integer,text,text) to service_role;
