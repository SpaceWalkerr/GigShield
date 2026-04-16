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
  onboarding_status text not null default 'draft' check (onboarding_status in ('draft', 'verified', 'active', 'suspended')),
  rider_id text,
  preferred_zones jsonb not null default '[]'::jsonb,
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

commit;
