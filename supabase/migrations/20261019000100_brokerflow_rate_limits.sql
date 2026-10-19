-- Durable, atomic rate limits for BrokerFlow protected review writes.
create table if not exists public.brokerflow_rate_limits (
  scope text not null check (scope in ('trusted_ingest', 'review_create', 'review_action')),
  identity_hash text not null check (identity_hash ~ '^[0-9a-f]{64}$'),
  window_start timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (scope, identity_hash, window_start)
);

create index if not exists brokerflow_rate_limits_window_idx
  on public.brokerflow_rate_limits (window_start);

alter table public.brokerflow_rate_limits enable row level security;
revoke all on public.brokerflow_rate_limits from anon, authenticated, service_role;
-- Supabase's public-schema default grants may otherwise allow service_role
-- to write directly, bypassing the transactional SECURITY DEFINER RPC.
grant select on public.brokerflow_rate_limits to service_role;

create or replace function public.brokerflow_consume_rate_limit(
  p_scope text,
  p_identity text,
  p_limit integer,
  p_window_seconds integer default 60
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_start timestamptz;
  v_identity_hash text;
  v_count integer;
  v_retry_after integer;
begin
  if p_scope not in ('trusted_ingest', 'review_create', 'review_action')
     or p_identity is null or char_length(p_identity) < 1 or char_length(p_identity) > 512
     or p_limit < 1 or p_limit > 1000
     or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid rate limit parameters' using errcode = '22023';
  end if;

  v_window_start := to_timestamp(floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds);
  v_identity_hash := encode(sha256(convert_to(p_identity, 'UTF8')), 'hex');

  insert into public.brokerflow_rate_limits(scope, identity_hash, window_start, request_count)
  values (p_scope, v_identity_hash, v_window_start, 1)
  on conflict (scope, identity_hash, window_start)
  do update set request_count = public.brokerflow_rate_limits.request_count + 1
  returning request_count into v_count;

  v_retry_after := greatest(1, ceil(extract(epoch from (v_window_start + make_interval(secs => p_window_seconds) - v_now)))::integer);

  -- Retain recent operational evidence while bounding storage during long-running use.
  if random() < 0.01 then
    delete from public.brokerflow_rate_limits where window_start < v_now - interval '7 days';
  end if;

  return jsonb_build_object(
    'allowed', v_count <= p_limit,
    'limit', p_limit,
    'remaining', greatest(0, p_limit - v_count),
    'retry_after', v_retry_after
  );
end
$$;

revoke all on function public.brokerflow_consume_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.brokerflow_consume_rate_limit(text, text, integer, integer) to service_role;
