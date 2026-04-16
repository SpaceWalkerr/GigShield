begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create or replace function public.owns_worker_profile(target_profile_id uuid)
returns boolean
language sql
stable
as $$
  select target_profile_id = auth.uid() or public.is_admin();
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'worker' check (role in ('worker', 'admin')),
  is_demo_account boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.worker_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  worker_id text unique not null,
  city text not null,
  age integer,
  vehicle_type text,
  work_pattern text,
  weekly_earnings_band text,
  weekly_earnings_estimate numeric(12,2),
  preferred_language text default 'en',
  preferred_zones jsonb not null default '[]'::jsonb,
  onboarding_status text not null default 'draft' check (onboarding_status in ('draft', 'verified', 'active', 'suspended')),
  rider_id text,
  rider_proof_url text,
  last_active_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.worker_platform_accounts (
  id uuid primary key default gen_random_uuid(),
  worker_profile_id uuid not null references public.worker_profiles(profile_id) on delete cascade,
  platform_name text not null,
  platform_worker_ref text,
  is_primary boolean not null default false,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists worker_platform_accounts_unique_platform
on public.worker_platform_accounts (worker_profile_id, platform_name);

create table if not exists public.weekly_policies (
  id uuid primary key default gen_random_uuid(),
  worker_profile_id uuid not null references public.worker_profiles(profile_id) on delete cascade,
  plan_id text not null,
  plan_name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'expired', 'cancelled')),
  coverage_hours integer,
  weekly_premium numeric(12,2) not null default 0,
  weekly_payout_cap numeric(12,2) not null default 0,
  coverage_triggers jsonb not null default '[]'::jsonb,
  exclusions jsonb not null default '["health","life","accident","vehicle_repair"]'::jsonb,
  starts_on date,
  ends_on date,
  activated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists weekly_policies_worker_status_idx
on public.weekly_policies (worker_profile_id, status, created_at desc);

create table if not exists public.weekly_policy_pricing (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.weekly_policies(id) on delete cascade,
  pricing_week_start date not null,
  pricing_week_end date not null,
  base_premium numeric(12,2) not null default 0,
  risk_adjustment numeric(12,2) not null default 0,
  ai_discount numeric(12,2) not null default 0,
  final_premium numeric(12,2) not null default 0,
  pricing_inputs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists weekly_policy_pricing_unique_week
on public.weekly_policy_pricing (policy_id, pricing_week_start);

create table if not exists public.trigger_events (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  zone_id text,
  zone_name text,
  source text not null,
  trigger_type text not null check (trigger_type in ('weather', 'aqi', 'traffic', 'platform_outage', 'regional_disruption')),
  trigger_key text not null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'observed' check (status in ('observed', 'confirmed', 'expired', 'dismissed')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  signal_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists trigger_events_city_type_time_idx
on public.trigger_events (city, trigger_type, starts_at desc);

create table if not exists public.risk_assessments (
  id uuid primary key default gen_random_uuid(),
  worker_profile_id uuid not null references public.worker_profiles(profile_id) on delete cascade,
  policy_id uuid references public.weekly_policies(id) on delete set null,
  trigger_event_id uuid references public.trigger_events(id) on delete set null,
  external_assessment_id text unique,
  risk_level text not null check (risk_level in ('Low', 'Medium', 'High')),
  status text not null default 'scored' check (status in ('scored', 'approved', 'rejected', 'expired')),
  probability_raw numeric(6,5),
  probability_adjusted numeric(6,5),
  threshold numeric(6,5),
  confidence_label text,
  model_version text,
  factors jsonb not null default '{}'::jsonb,
  assessment_payload jsonb not null default '{}'::jsonb,
  reason text,
  assessed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists risk_assessments_worker_assessed_idx
on public.risk_assessments (worker_profile_id, assessed_at desc);

create table if not exists public.income_radar_snapshots (
  id uuid primary key default gen_random_uuid(),
  worker_profile_id uuid not null references public.worker_profiles(profile_id) on delete cascade,
  city text not null,
  based_on_assessment_id uuid references public.risk_assessments(id) on delete set null,
  safest_zone_id text,
  safest_zone_name text,
  highest_risk_zone_id text,
  highest_risk_zone_name text,
  best_window text,
  recommendation text,
  confidence_score integer,
  zones jsonb not null default '[]'::jsonb,
  tomorrow_outlook jsonb not null default '[]'::jsonb,
  demo_story jsonb not null default '{}'::jsonb,
  snapshot_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists income_radar_snapshots_worker_snapshot_idx
on public.income_radar_snapshots (worker_profile_id, snapshot_at desc);

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  worker_profile_id uuid not null references public.worker_profiles(profile_id) on delete cascade,
  policy_id uuid not null references public.weekly_policies(id) on delete cascade,
  trigger_event_id uuid references public.trigger_events(id) on delete set null,
  risk_assessment_id uuid references public.risk_assessments(id) on delete set null,
  claim_number text unique not null,
  status text not null default 'initiated' check (status in ('initiated', 'reviewing', 'approved', 'rejected', 'paid')),
  claim_mode text not null default 'automatic' check (claim_mode in ('automatic', 'manual_override')),
  estimated_income_loss numeric(12,2) not null default 0,
  approved_income_loss numeric(12,2),
  notes text,
  evidence_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists claims_worker_status_created_idx
on public.claims (worker_profile_id, status, created_at desc);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  worker_profile_id uuid not null references public.worker_profiles(profile_id) on delete cascade,
  payout_id text unique not null,
  status text not null default 'pending_verification' check (status in ('pending_verification', 'verified', 'processing', 'settled', 'failed', 'blocked')),
  payout_amount numeric(12,2) not null default 0,
  currency text not null default 'INR',
  payout_channel text default 'simulated_upi',
  lifecycle_status text,
  failure_reason_code text,
  failure_reason text,
  verification_payload jsonb not null default '{}'::jsonb,
  payout_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  settled_at timestamptz
);

create index if not exists payouts_worker_created_idx
on public.payouts (worker_profile_id, created_at desc);

create table if not exists public.fraud_checks (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid references public.claims(id) on delete cascade,
  payout_id uuid references public.payouts(id) on delete cascade,
  worker_profile_id uuid not null references public.worker_profiles(profile_id) on delete cascade,
  check_type text not null check (check_type in ('duplicate_claim', 'gps_validation', 'activity_validation', 'liveness', 'velocity', 'device_fingerprint', 'platform_consistency')),
  decision text not null check (decision in ('pass', 'review', 'fail')),
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  score numeric(6,3),
  detail text,
  payload jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists fraud_checks_worker_checked_idx
on public.fraud_checks (worker_profile_id, checked_at desc);

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  worker_profile_id uuid references public.worker_profiles(profile_id) on delete set null,
  claim_id uuid references public.claims(id) on delete set null,
  payout_id uuid references public.payouts(id) on delete set null,
  action_type text not null,
  decision text,
  note text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'worker')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists worker_profiles_set_updated_at on public.worker_profiles;
create trigger worker_profiles_set_updated_at
before update on public.worker_profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists worker_platform_accounts_set_updated_at on public.worker_platform_accounts;
create trigger worker_platform_accounts_set_updated_at
before update on public.worker_platform_accounts
for each row execute procedure public.set_updated_at();

drop trigger if exists weekly_policies_set_updated_at on public.weekly_policies;
create trigger weekly_policies_set_updated_at
before update on public.weekly_policies
for each row execute procedure public.set_updated_at();

drop trigger if exists weekly_policy_pricing_set_updated_at on public.weekly_policy_pricing;
create trigger weekly_policy_pricing_set_updated_at
before update on public.weekly_policy_pricing
for each row execute procedure public.set_updated_at();

drop trigger if exists trigger_events_set_updated_at on public.trigger_events;
create trigger trigger_events_set_updated_at
before update on public.trigger_events
for each row execute procedure public.set_updated_at();

drop trigger if exists risk_assessments_set_updated_at on public.risk_assessments;
create trigger risk_assessments_set_updated_at
before update on public.risk_assessments
for each row execute procedure public.set_updated_at();

drop trigger if exists income_radar_snapshots_set_updated_at on public.income_radar_snapshots;
create trigger income_radar_snapshots_set_updated_at
before update on public.income_radar_snapshots
for each row execute procedure public.set_updated_at();

drop trigger if exists claims_set_updated_at on public.claims;
create trigger claims_set_updated_at
before update on public.claims
for each row execute procedure public.set_updated_at();

drop trigger if exists payouts_set_updated_at on public.payouts;
create trigger payouts_set_updated_at
before update on public.payouts
for each row execute procedure public.set_updated_at();

drop trigger if exists fraud_checks_set_updated_at on public.fraud_checks;
create trigger fraud_checks_set_updated_at
before update on public.fraud_checks
for each row execute procedure public.set_updated_at();

drop trigger if exists admin_actions_set_updated_at on public.admin_actions;
create trigger admin_actions_set_updated_at
before update on public.admin_actions
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.worker_profiles enable row level security;
alter table public.worker_platform_accounts enable row level security;
alter table public.weekly_policies enable row level security;
alter table public.weekly_policy_pricing enable row level security;
alter table public.trigger_events enable row level security;
alter table public.risk_assessments enable row level security;
alter table public.income_radar_snapshots enable row level security;
alter table public.claims enable row level security;
alter table public.payouts enable row level security;
alter table public.fraud_checks enable row level security;
alter table public.admin_actions enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles for select
using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles for insert
with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists worker_profiles_select_own on public.worker_profiles;
create policy worker_profiles_select_own
on public.worker_profiles for select
using (public.owns_worker_profile(profile_id));

drop policy if exists worker_profiles_insert_own on public.worker_profiles;
create policy worker_profiles_insert_own
on public.worker_profiles for insert
with check (public.owns_worker_profile(profile_id));

drop policy if exists worker_profiles_update_own on public.worker_profiles;
create policy worker_profiles_update_own
on public.worker_profiles for update
using (public.owns_worker_profile(profile_id))
with check (public.owns_worker_profile(profile_id));

drop policy if exists worker_platform_accounts_access_own on public.worker_platform_accounts;
create policy worker_platform_accounts_access_own
on public.worker_platform_accounts for all
using (public.owns_worker_profile(worker_profile_id))
with check (public.owns_worker_profile(worker_profile_id));

drop policy if exists weekly_policies_access_own on public.weekly_policies;
create policy weekly_policies_access_own
on public.weekly_policies for all
using (public.owns_worker_profile(worker_profile_id))
with check (public.owns_worker_profile(worker_profile_id));

drop policy if exists weekly_policy_pricing_access_own on public.weekly_policy_pricing;
create policy weekly_policy_pricing_access_own
on public.weekly_policy_pricing for all
using (
  exists (
    select 1
    from public.weekly_policies p
    where p.id = policy_id
      and public.owns_worker_profile(p.worker_profile_id)
  )
)
with check (
  exists (
    select 1
    from public.weekly_policies p
    where p.id = policy_id
      and public.owns_worker_profile(p.worker_profile_id)
  )
);

drop policy if exists trigger_events_select_authenticated on public.trigger_events;
create policy trigger_events_select_authenticated
on public.trigger_events for select
using (auth.role() = 'authenticated');

drop policy if exists trigger_events_admin_write on public.trigger_events;
create policy trigger_events_admin_write
on public.trigger_events for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists risk_assessments_access_own on public.risk_assessments;
create policy risk_assessments_access_own
on public.risk_assessments for all
using (public.owns_worker_profile(worker_profile_id))
with check (public.owns_worker_profile(worker_profile_id));

drop policy if exists income_radar_snapshots_access_own on public.income_radar_snapshots;
create policy income_radar_snapshots_access_own
on public.income_radar_snapshots for all
using (public.owns_worker_profile(worker_profile_id))
with check (public.owns_worker_profile(worker_profile_id));

drop policy if exists claims_access_own on public.claims;
create policy claims_access_own
on public.claims for all
using (public.owns_worker_profile(worker_profile_id))
with check (public.owns_worker_profile(worker_profile_id));

drop policy if exists payouts_access_own on public.payouts;
create policy payouts_access_own
on public.payouts for all
using (public.owns_worker_profile(worker_profile_id))
with check (public.owns_worker_profile(worker_profile_id));

drop policy if exists fraud_checks_access_own on public.fraud_checks;
create policy fraud_checks_access_own
on public.fraud_checks for all
using (public.owns_worker_profile(worker_profile_id))
with check (public.owns_worker_profile(worker_profile_id));

drop policy if exists admin_actions_admin_only on public.admin_actions;
create policy admin_actions_admin_only
on public.admin_actions for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists audit_logs_admin_only on public.audit_logs;
create policy audit_logs_admin_only
on public.audit_logs for all
using (public.is_admin())
with check (public.is_admin());

commit;
