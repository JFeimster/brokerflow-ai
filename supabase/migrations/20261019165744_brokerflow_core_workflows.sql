-- Additive BrokerFlow workflows over canonical platform-core leads, referrals,
-- partners and lead_events. No shared roles, policies or permission grants change.
-- Apply only after owner review. All public RPCs are service-only and recheck
-- current organization membership and explicit BrokerFlow permission before reads.
begin;

create table public.brokerflow_deals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  lead_id uuid not null references public.leads(id) on delete restrict,
  review_id uuid references public.brokerflow_review_requests(id) on delete restrict,
  pipeline_stage text not null default 'intake_captured' check (pipeline_stage in ('intake_captured','review_requested','documents_pending')),
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, lead_id),
  unique (organization_id, review_id)
);
create index brokerflow_deals_queue_idx on public.brokerflow_deals(organization_id, created_at desc, id desc);

create table public.brokerflow_document_requests (
  id uuid primary key references public.brokerflow_follow_up_tasks(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  lead_id uuid references public.leads(id) on delete restrict,
  deal_id uuid references public.brokerflow_deals(id) on delete restrict,
  review_id uuid references public.brokerflow_review_requests(id) on delete restrict,
  checklist_reference text not null,
  checklist jsonb not null,
  submitted_documents jsonb not null,
  missing_documents jsonb not null,
  draft text not null check (char_length(draft) <= 8000),
  status text not null default 'task_created' check (status = 'task_created'),
  delivery_status text not null default 'not_sent' check (delivery_status = 'not_sent'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  idempotency_hash text not null,
  request_fingerprint text not null,
  result jsonb not null,
  unique (organization_id, created_by, idempotency_hash),
  check (lead_id is not null or review_id is not null)
);
create index brokerflow_document_requests_deal_idx on public.brokerflow_document_requests(organization_id,deal_id,created_at desc);
create index brokerflow_document_requests_review_idx on public.brokerflow_document_requests(organization_id,review_id,created_at desc);
alter table public.brokerflow_deals enable row level security;
alter table public.brokerflow_document_requests enable row level security;
revoke all on public.brokerflow_deals, public.brokerflow_document_requests from public, anon, authenticated, service_role;
grant select on public.brokerflow_deals, public.brokerflow_document_requests to service_role;

create function app_private.brokerflow_require_permission(p_org uuid,p_actor uuid,p_permission text)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if p_actor is null or not exists (
    select 1 from public.memberships m
    join public.organizations o on o.id=m.organization_id and o.status='active'
    join public.role_permissions rp on rp.organization_id=m.organization_id and rp.role_id=m.role_id
    join public.permissions p on p.id=rp.permission_id and p.key=p_permission
    where m.organization_id=p_org and m.user_id=p_actor and m.status='active'
  ) then raise exception 'workspace permission denied' using errcode='42501'; end if;
end $$;

create function app_private.brokerflow_operation_key(p_operation text,p_actor uuid,p_key text)
returns text language plpgsql immutable set search_path = pg_catalog as $$
begin
  if p_key is null or char_length(p_key) not between 16 and 200 then
    raise exception 'invalid idempotency key' using errcode='22023';
  end if;
  return 'brokerflow:'||p_operation||':'||p_actor::text||':'||encode(sha256(convert_to(p_key,'UTF8')),'hex');
end $$;

create function public.brokerflow_capture_borrower_intake(p_organization_id uuid,p_actor_user_id uuid,p_input jsonb,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_key text; v_fp text; v_event public.lead_events%rowtype; v_lead public.leads%rowtype;
  v_deal public.brokerflow_deals%rowtype; v_result jsonb; v_reference text;
begin
  perform app_private.brokerflow_require_permission(p_organization_id,p_actor_user_id,'brokerflow.reviews.write');
  perform app_private.brokerflow_require_permission(p_organization_id,p_actor_user_id,'brokerflow.reviews.read');
  v_key:=app_private.brokerflow_operation_key('intake',p_actor_user_id,p_idempotency_key);
  v_fp:=encode(sha256(convert_to(p_input::text,'UTF8')),'hex');
  if p_input is null or coalesce(p_input->>'external_reference','') !~ '^[A-Za-z0-9_.:-]{1,120}$'
    or coalesce(trim(p_input->>'contact_name'),'')='' or char_length(p_input->>'contact_name')>160
    or coalesce(p_input#>>'{scenario,state}','') !~ '^[A-Z]{2}$'
    or coalesce(p_input#>>'{scenario,borrower_type}','') not in ('individual','business','real_estate_investor','commercial_borrower','referral_partner_lead','unknown')
    or coalesce(p_input#>>'{scenario,loan_purpose}','') not in ('business_working_capital','equipment_financing','commercial_real_estate','residential_purchase','residential_refinance','debt_consolidation','bridge_loan','construction','invoice_financing','sba_review','personal_loan','other')
    or coalesce((p_input#>>'{scenario,requested_amount}')::numeric,0)<=0
    or (p_input#>>'{scenario,requested_amount}')::numeric>1000000000
    or coalesce(p_input#>>'{consent,status}','') not in ('granted','denied','unknown')
    or coalesce(p_input#>>'{consent,source}','')=''
    or jsonb_typeof(p_input#>'{consent,channels}') is distinct from 'array'
    or (p_input#>>'{consent,status}'='granted' and (coalesce(p_input#>>'{consent,captured_at}','')='' or jsonb_array_length(p_input#>'{consent,channels}')=0 or (p_input#>>'{consent,captured_at}')::timestamptz>now()))
    then raise exception 'invalid intake' using errcode='22023'; end if;
  v_reference:='brokerflow:'||(p_input->>'external_reference');
  perform pg_advisory_xact_lock(hashtextextended(p_organization_id::text||'|intake|'||v_reference,0));
  select * into v_event from public.lead_events where organization_id=p_organization_id and idempotency_key=v_key;
  if found then
    if v_event.payload->>'request_fingerprint' is distinct from v_fp then raise exception 'idempotency conflict' using errcode='23505'; end if;
    return (v_event.payload->'result')||'{"duplicate":true}'::jsonb;
  end if;
  select * into v_lead from public.leads where organization_id=p_organization_id and external_id=v_reference;
  if found then
    if v_lead.metadata#>>'{brokerflow_intake,request_fingerprint}' is distinct from v_fp then raise exception 'intake reference conflict' using errcode='23505'; end if;
    select * into v_deal from public.brokerflow_deals where organization_id=p_organization_id and lead_id=v_lead.id;
    v_result:=jsonb_build_object('intake_id',v_lead.id,'deal_id',v_deal.id,'organization_id',p_organization_id,'status','intake_captured','completeness',p_input->'completeness','next_action','broker_review','duplicate',true);
  else
    if p_input->>'assigned_to' is not null and not exists(select 1 from public.memberships where organization_id=p_organization_id and user_id=(p_input->>'assigned_to')::uuid and status='active') then raise exception 'invalid owner' using errcode='23503'; end if;
    insert into public.leads(organization_id,external_id,source,status,first_name,email,phone,company_name,consent_at,metadata,assigned_to,created_by)
    values(p_organization_id,v_reference,'brokerflow_mcp','new',p_input->>'contact_name',p_input->>'email',p_input->>'phone',p_input#>>'{scenario,business_name}',
      case when p_input#>>'{consent,status}'='granted' then (p_input#>>'{consent,captured_at}')::timestamptz else null end,
      jsonb_build_object('brokerflow_intake',(p_input-'email'-'phone'-'contact_name')||jsonb_build_object('request_fingerprint',v_fp)),nullif(p_input->>'assigned_to','')::uuid,p_actor_user_id) returning * into v_lead;
    insert into public.brokerflow_deals(organization_id,lead_id,assigned_to,created_by) values(p_organization_id,v_lead.id,v_lead.assigned_to,p_actor_user_id) returning * into v_deal;
    v_result:=jsonb_build_object('intake_id',v_lead.id,'deal_id',v_deal.id,'organization_id',p_organization_id,'status','intake_captured','completeness',p_input->'completeness','next_action','broker_review','duplicate',false);
  end if;
  insert into public.lead_events(organization_id,lead_id,event_type,actor_user_id,source,payload,idempotency_key)
  values(p_organization_id,v_lead.id,case when (v_result->>'duplicate')::boolean then 'brokerflow_intake_duplicate' else 'brokerflow_intake_captured' end,p_actor_user_id,'brokerflow_mcp',jsonb_build_object('request_fingerprint',v_fp,'result',v_result),v_key);
  return v_result;
end $$;

create function public.brokerflow_request_lender_match_review(p_organization_id uuid,p_actor_user_id uuid,p_input jsonb,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_deal public.brokerflow_deals%rowtype; v_review jsonb; v_key text; v_scenario jsonb;
begin
  perform app_private.brokerflow_require_permission(p_organization_id,p_actor_user_id,'brokerflow.reviews.write');
  perform app_private.brokerflow_require_permission(p_organization_id,p_actor_user_id,'brokerflow.reviews.read');
  v_key:=app_private.brokerflow_operation_key('review_link',p_actor_user_id,p_idempotency_key);
  select * into v_deal from public.brokerflow_deals where organization_id=p_organization_id and lead_id=(p_input->>'intake_id')::uuid for update;
  if not found then raise exception 'intake not found' using errcode='P0002'; end if;
  select metadata#>'{brokerflow_intake,scenario}' into v_scenario from public.leads where id=v_deal.lead_id and organization_id=p_organization_id;
  if v_scenario is null or exists (
    select 1 from jsonb_each(v_scenario) field
    where field.key in ('borrower_type','loan_purpose','requested_amount','state','business_name','monthly_revenue','annual_revenue','time_in_business_months','credit_score_range','urgency','property_type','occupancy_type','collateral_available')
      and (p_input->'scenario'->field.key) is distinct from field.value
  ) then raise exception 'review scenario differs from captured intake' using errcode='22023'; end if;
  v_review:=public.brokerflow_create_review(p_organization_id,p_actor_user_id,p_idempotency_key,p_input->'scenario');
  if v_deal.review_id is not null and v_deal.review_id<>(v_review->>'id')::uuid then raise exception 'review already linked' using errcode='23505'; end if;
  if v_deal.review_id is null then
    update public.brokerflow_deals set review_id=(v_review->>'id')::uuid,pipeline_stage='review_requested',updated_at=now() where id=v_deal.id;
    insert into public.lead_events(organization_id,lead_id,event_type,actor_user_id,source,payload,idempotency_key)
    values(p_organization_id,v_deal.lead_id,'brokerflow_review_linked',p_actor_user_id,'brokerflow_mcp',jsonb_build_object('deal_id',v_deal.id,'review_id',v_review->>'id'),v_key);
  end if;
  return v_review;
end $$;

create function public.brokerflow_trigger_missing_document_request(p_organization_id uuid,p_actor_user_id uuid,p_input jsonb,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_key text; v_fp text; v_existing public.brokerflow_document_requests%rowtype; v_task jsonb;
  v_deal public.brokerflow_deals%rowtype; v_lead uuid; v_review uuid; v_result jsonb;
begin
  perform app_private.brokerflow_require_permission(p_organization_id,p_actor_user_id,'brokerflow.reviews.write');
  perform app_private.brokerflow_require_permission(p_organization_id,p_actor_user_id,'brokerflow.reviews.read');
  v_key:=app_private.brokerflow_operation_key('documents',p_actor_user_id,p_idempotency_key);
  v_fp:=encode(sha256(convert_to(p_input::text,'UTF8')),'hex');
  perform pg_advisory_xact_lock(hashtextextended(p_organization_id::text||'|'||v_key,0));
  select * into v_existing from public.brokerflow_document_requests where organization_id=p_organization_id and created_by=p_actor_user_id and idempotency_hash=v_key;
  if found then
    if v_existing.request_fingerprint<>v_fp then raise exception 'idempotency conflict' using errcode='23505'; end if;
    return v_existing.result||'{"duplicate":true}'::jsonb;
  end if;
  v_lead:=nullif(p_input->>'intake_id','')::uuid; v_review:=nullif(p_input->>'review_id','')::uuid;
  if p_input->>'deal_id' is not null then
    select * into v_deal from public.brokerflow_deals where id=(p_input->>'deal_id')::uuid and organization_id=p_organization_id for update;
    if not found then raise exception 'deal not found' using errcode='P0002'; end if;
  elsif v_lead is not null then
    select * into v_deal from public.brokerflow_deals where lead_id=v_lead and organization_id=p_organization_id for update;
    if not found then raise exception 'intake not found' using errcode='P0002'; end if;
  elsif v_review is not null then
    select * into v_deal from public.brokerflow_deals where review_id=v_review and organization_id=p_organization_id for update;
  else raise exception 'reference required' using errcode='22023'; end if;
  if v_deal.id is not null then
    if (v_lead is not null and v_lead<>v_deal.lead_id) or (v_review is not null and v_review is distinct from v_deal.review_id) then raise exception 'reference mismatch' using errcode='23503'; end if;
    v_lead:=v_deal.lead_id; v_review:=v_deal.review_id;
  end if;
  if v_lead is not null and not exists(select 1 from public.leads where id=v_lead and organization_id=p_organization_id and source='brokerflow_mcp') then raise exception 'intake not found' using errcode='P0002'; end if;
  if v_review is not null and not exists(select 1 from public.brokerflow_review_requests where id=v_review and organization_id=p_organization_id) then raise exception 'review not found' using errcode='P0002'; end if;
  if jsonb_typeof(p_input->'missing_documents') is distinct from 'array' or jsonb_typeof(p_input->'checklist') is distinct from 'object' then raise exception 'invalid checklist' using errcode='22023'; end if;
  if jsonb_array_length(p_input->'missing_documents')=0 then
    return jsonb_build_object('request_id',null,'task_id',null,'intake_id',v_lead,'deal_id',v_deal.id,'review_id',v_review,'status','no_missing_documents','draft_status','not_needed','delivery_status','not_sent','missing_documents','[]'::jsonb,'draft','','next_action','broker_review','duplicate',false);
  end if;
  v_task:=public.brokerflow_create_follow_up_task(p_organization_id,p_actor_user_id,'documents:'||encode(sha256(convert_to(p_idempotency_key,'UTF8')),'hex'),jsonb_build_object(
    'title','Review missing-document request','description','Draft prepared from user-reported document metadata. Review consent and verified secure upload channel before any external send.',
    'task_type','document_follow_up','review_id',v_review,'assigned_to',nullif(p_input->>'assigned_to','')::uuid,'due_date',p_input->>'due_date'));
  v_result:=jsonb_build_object('request_id',v_task->>'id','task_id',v_task->>'id','intake_id',v_lead,'deal_id',v_deal.id,'review_id',v_review,'status','task_created','draft_status','draft_prepared','delivery_status','not_sent','missing_documents',p_input->'missing_documents','draft',p_input->>'draft','next_action','review_consent_and_draft_before_send','duplicate',false);
  insert into public.brokerflow_document_requests(id,organization_id,lead_id,deal_id,review_id,checklist_reference,checklist,submitted_documents,missing_documents,draft,created_by,idempotency_hash,request_fingerprint,result)
  values((v_task->>'id')::uuid,p_organization_id,v_lead,v_deal.id,v_review,p_input->>'checklist_reference',p_input->'checklist',p_input->'submitted_documents',p_input->'missing_documents',p_input->>'draft',p_actor_user_id,v_key,v_fp,v_result);
  if v_deal.id is not null then update public.brokerflow_deals set pipeline_stage='documents_pending',updated_at=now() where id=v_deal.id; end if;
  if v_lead is not null then
    insert into public.lead_events(organization_id,lead_id,event_type,actor_user_id,source,payload,idempotency_key)
    values(p_organization_id,v_lead,'brokerflow_document_request_tracked',p_actor_user_id,'brokerflow_mcp',jsonb_build_object('request_id',v_task->>'id','deal_id',v_deal.id,'delivery_status','not_sent'),v_key);
  end if;
  return v_result;
end $$;

create function public.brokerflow_capture_partner_referral(p_organization_id uuid,p_actor_user_id uuid,p_input jsonb,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_key text; v_fp text; v_event public.lead_events%rowtype; v_ref public.referrals%rowtype;
  v_lead public.leads%rowtype; v_deal public.brokerflow_deals%rowtype; v_result jsonb;
  v_partner uuid:=(p_input->>'partner_id')::uuid; v_intake uuid:=(p_input->>'intake_id')::uuid;
begin
  perform app_private.brokerflow_require_permission(p_organization_id,p_actor_user_id,'brokerflow.reviews.write');
  perform app_private.brokerflow_require_permission(p_organization_id,p_actor_user_id,'brokerflow.reviews.read');
  v_key:=app_private.brokerflow_operation_key('referral',p_actor_user_id,p_idempotency_key);
  v_fp:=encode(sha256(convert_to(p_input::text,'UTF8')),'hex');
  perform pg_advisory_xact_lock(hashtextextended(p_organization_id::text||'|referral|'||v_partner::text||'|'||v_intake::text,0));
  select * into v_event from public.lead_events where organization_id=p_organization_id and idempotency_key=v_key;
  if found then
    if v_event.payload->>'request_fingerprint' is distinct from v_fp then raise exception 'idempotency conflict' using errcode='23505'; end if;
    return (v_event.payload->'result')||'{"duplicate":true}'::jsonb;
  end if;
  if not exists(select 1 from public.partners where id=v_partner and organization_id=p_organization_id and status='active') then raise exception 'partner not found' using errcode='P0002'; end if;
  select * into v_lead from public.leads where id=v_intake and organization_id=p_organization_id and source='brokerflow_mcp' for update;
  if not found then raise exception 'intake not found' using errcode='P0002'; end if;
  select * into v_deal from public.brokerflow_deals where lead_id=v_intake and organization_id=p_organization_id;
  if not found then raise exception 'deal not found' using errcode='P0002'; end if;
  if jsonb_typeof(p_input->'permission_to_contact') is distinct from 'boolean' or jsonb_typeof(p_input->'warm_intro_available') is distinct from 'boolean' or coalesce(p_input->>'source_reference','')='' then raise exception 'permission metadata required' using errcode='22023'; end if;
  if (p_input->>'permission_to_contact')::boolean and v_lead.metadata#>>'{brokerflow_intake,consent,status}' is distinct from 'granted' then raise exception 'contact permission conflicts with intake' using errcode='22023'; end if;
  if p_input->>'assigned_to' is not null and not exists(select 1 from public.memberships where organization_id=p_organization_id and user_id=(p_input->>'assigned_to')::uuid and status='active') then raise exception 'invalid assigned broker' using errcode='23503'; end if;
  select * into v_ref from public.referrals where organization_id=p_organization_id and partner_id=v_partner and lead_id=v_intake;
  if found then
    if v_ref.metadata#>>'{brokerflow,request_fingerprint}' is distinct from v_fp then raise exception 'referral conflict' using errcode='23505'; end if;
    v_result:=v_ref.metadata#>'{brokerflow,result}';
    v_result:=v_result||'{"duplicate":true}'::jsonb;
  else
    insert into public.referrals(organization_id,partner_id,lead_id,status,metadata) values(p_organization_id,v_partner,v_intake,'submitted',jsonb_build_object('brokerflow',p_input||jsonb_build_object('deal_id',v_deal.id,'review_id',v_deal.review_id,'scenario',v_lead.metadata#>'{brokerflow_intake,scenario}','assigned_to',coalesce(nullif(p_input->>'assigned_to','')::uuid,v_deal.assigned_to),'attribution_status','attributed','request_fingerprint',v_fp,'created_by',p_actor_user_id))) returning * into v_ref;
    v_result:=jsonb_build_object('referral_id',v_ref.id,'organization_id',p_organization_id,'intake_id',v_intake,'deal_id',v_deal.id,'review_id',v_deal.review_id,'partner_id',v_partner,'attribution_status','attributed','status','referral_captured','next_action',p_input->>'recommended_next_step','duplicate',false);
    update public.referrals set metadata=jsonb_set(metadata,'{brokerflow,result}',v_result),updated_at=now() where id=v_ref.id;
    update public.leads set attribution=attribution||jsonb_build_object('brokerflow_referral_ids',coalesce(attribution->'brokerflow_referral_ids','[]'::jsonb)||jsonb_build_array(v_ref.id)),updated_at=now() where id=v_intake;
    insert into public.lead_events(organization_id,lead_id,event_type,actor_user_id,source,payload,idempotency_key)
    values(p_organization_id,v_intake,'brokerflow_partner_attribution_updated',p_actor_user_id,'brokerflow_mcp',jsonb_build_object('referral_id',v_ref.id,'partner_id',v_partner),v_key||':attribution');
  end if;
  insert into public.lead_events(organization_id,lead_id,event_type,actor_user_id,source,payload,idempotency_key)
  values(p_organization_id,v_intake,case when (v_result->>'duplicate')::boolean then 'brokerflow_referral_duplicate' else 'brokerflow_referral_captured' end,p_actor_user_id,'brokerflow_mcp',jsonb_build_object('request_fingerprint',v_fp,'result',v_result),v_key);
  return v_result;
end $$;

create function public.brokerflow_lookup_deal_status(p_organization_id uuid,p_actor_user_id uuid,p_input jsonb)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_limit integer:=coalesce((p_input->>'limit')::integer,25); v_cursor integer:=coalesce((p_input->>'cursor')::integer,0); v_items jsonb; v_more boolean;
begin
  perform app_private.brokerflow_require_permission(p_organization_id,p_actor_user_id,'brokerflow.reviews.read');
  if v_limit not between 1 and 100 or v_cursor not between 0 and 100000 then raise exception 'invalid page' using errcode='22023'; end if;
  with page as (
    select d.* from public.brokerflow_deals d where d.organization_id=p_organization_id
      and (p_input->>'deal_id' is null or d.id=(p_input->>'deal_id')::uuid)
      and (p_input->>'intake_id' is null or d.lead_id=(p_input->>'intake_id')::uuid)
    order by d.created_at desc,d.id desc offset v_cursor limit v_limit+1
  ), details as (
    select d.created_at,d.id,jsonb_build_object(
      'deal_id',d.id,'organization_id',d.organization_id,'intake_id',d.lead_id,'pipeline_stage',d.pipeline_stage,'assigned_owner',d.assigned_to,
      'review_id',d.review_id,'review_status',r.status,
      'tasks',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'status',t.status,'due_date',t.due_date) order by t.created_at,t.id) from public.brokerflow_follow_up_tasks t where t.organization_id=p_organization_id and (t.review_id=d.review_id or exists(select 1 from public.brokerflow_document_requests q where q.id=t.id and q.organization_id=p_organization_id and q.deal_id=d.id))),'[]'::jsonb),
      'last_activity',greatest(d.updated_at,l.updated_at,r.updated_at,(select max(e.occurred_at) from public.lead_events e where e.organization_id=p_organization_id and e.lead_id=d.lead_id),(select max(coalesce(t.completed_at,t.created_at)) from public.brokerflow_follow_up_tasks t where t.organization_id=p_organization_id and (t.review_id=d.review_id or exists(select 1 from public.brokerflow_document_requests q where q.id=t.id and q.organization_id=p_organization_id and q.deal_id=d.id)))),
      'next_action',case when d.pipeline_stage='documents_pending' then
        case when exists(select 1 from public.brokerflow_document_requests q join public.brokerflow_follow_up_tasks t on t.id=q.id and t.organization_id=p_organization_id where q.organization_id=p_organization_id and q.deal_id=d.id and t.status='open') then 'review_missing_document_task' else 'broker_review_document_state' end
        when r.status='needs_information' then 'collect_information_for_human_review' when r.status='reviewed' then 'broker_review_next_operational_step' when d.review_id is null then 'request_lender_match_review' else 'human_review' end
    ) as item from page d join public.leads l on l.id=d.lead_id and l.organization_id=p_organization_id left join public.brokerflow_review_requests r on r.id=d.review_id and r.organization_id=p_organization_id
  ), numbered as (select *,row_number() over(order by created_at desc,id desc) as n from details)
  select coalesce(jsonb_agg(item order by created_at desc,id desc) filter(where n<=v_limit),'[]'::jsonb),coalesce(bool_or(n>v_limit),false) into v_items,v_more from numbered;
  if jsonb_array_length(v_items)=0 and (p_input->>'deal_id' is not null or p_input->>'intake_id' is not null) then raise exception 'deal not found' using errcode='P0002'; end if;
  return jsonb_build_object('items',v_items,'next_cursor',case when v_more then v_cursor+v_limit else null end);
end $$;

revoke all on function app_private.brokerflow_require_permission(uuid,uuid,text),app_private.brokerflow_operation_key(text,uuid,text) from public,anon,authenticated,service_role;
revoke all on function public.brokerflow_capture_borrower_intake(uuid,uuid,jsonb,text),public.brokerflow_request_lender_match_review(uuid,uuid,jsonb,text),public.brokerflow_trigger_missing_document_request(uuid,uuid,jsonb,text),public.brokerflow_capture_partner_referral(uuid,uuid,jsonb,text),public.brokerflow_lookup_deal_status(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.brokerflow_capture_borrower_intake(uuid,uuid,jsonb,text),public.brokerflow_request_lender_match_review(uuid,uuid,jsonb,text),public.brokerflow_trigger_missing_document_request(uuid,uuid,jsonb,text),public.brokerflow_capture_partner_referral(uuid,uuid,jsonb,text),public.brokerflow_lookup_deal_status(uuid,uuid,jsonb) to service_role;
commit;
