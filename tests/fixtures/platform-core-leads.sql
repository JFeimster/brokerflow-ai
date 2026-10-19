-- Synthetic contract copied from read-only information_schema/pg_constraint
-- inspection of platform-core on 2026-10-19. No private records are imported.
create table public.leads (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  external_id text, source text not null, status text not null default 'new' check(status in ('new','qualified','nurture','referred','won','lost','archived')),
  first_name text,last_name text,email text,phone text,company_name text,consent_at timestamptz,
  attribution jsonb not null default '{}',qualification jsonb not null default '{}',metadata jsonb not null default '{}',
  assigned_to uuid references auth.users(id) on delete set null,created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(organization_id,external_id)
);
create table public.partners (
  id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,
  partner_code text not null,external_id text,name text not null,status text not null default 'pending' check(status in ('pending','active','paused','terminated')),
  contact_email text,contact_phone text,terms jsonb not null default '{}',metadata jsonb not null default '{}',created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(organization_id,partner_code),unique(organization_id,external_id)
);
create table public.referrals (
  id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete restrict,lead_id uuid not null references public.leads(id) on delete cascade,
  status text not null default 'submitted' check(status in ('submitted','accepted','qualified','converted','rejected')),referred_at timestamptz not null default now(),converted_at timestamptz,
  metadata jsonb not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(organization_id,partner_id,lead_id)
);
create table public.lead_events (
  id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,event_type text not null,occurred_at timestamptz not null default now(),
  actor_user_id uuid references auth.users(id) on delete set null,source text not null default 'platform-core',payload jsonb not null default '{}',idempotency_key text,created_at timestamptz not null default now(),unique(organization_id,idempotency_key)
);
alter table public.leads enable row level security;
alter table public.partners enable row level security;
alter table public.referrals enable row level security;
alter table public.lead_events enable row level security;
grant select on public.leads,public.partners,public.referrals,public.lead_events to service_role;
insert into public.permissions(key) values ('brokerflow.reviews.read'),('brokerflow.reviews.write');
insert into public.role_permissions(organization_id,role_id,permission_id)
select r.organization_id,r.id,p.id from public.roles r cross join public.permissions p
where (r.key='broker' and p.key in ('brokerflow.reviews.read','brokerflow.reviews.write')) or (r.key='viewer' and p.key='brokerflow.reviews.read');
insert into public.partners(id,organization_id,partner_code,name,status) values
('50000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','synthetic-a','Synthetic Equipment Partner','active'),
('50000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','synthetic-b','Synthetic Other Partner','active');
