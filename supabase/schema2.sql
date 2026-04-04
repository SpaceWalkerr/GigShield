begin;

create table if not exists public.predictive_assessments (
  assessment_id text primary key,
  worker_id text not null,
  owner_auth_uid uuid,
  city text,
  trigger_id text,
  status text,
  probability_adjusted numeric,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.predictive_assessments
add column if not exists city text;

alter table public.predictive_assessments
add column if not exists owner_auth_uid uuid;

alter table public.predictive_assessments
alter column owner_auth_uid set default auth.uid();

update public.predictive_assessments
set owner_auth_uid = auth.uid()
where owner_auth_uid is null and auth.uid() is not null;

create index if not exists predictive_assessments_worker_created_idx
on public.predictive_assessments (worker_id, created_at desc);

create index if not exists predictive_assessments_city_created_idx
on public.predictive_assessments (city, created_at desc);

alter table public.predictive_assessments enable row level security;

drop policy if exists predictive_assessments_select_authenticated on public.predictive_assessments;
drop policy if exists predictive_assessments_insert_authenticated on public.predictive_assessments;
drop policy if exists predictive_assessments_update_authenticated on public.predictive_assessments;

create policy if not exists predictive_assessments_select_own
on public.predictive_assessments
for select
using (owner_auth_uid = auth.uid());

create policy if not exists predictive_assessments_insert_own
on public.predictive_assessments
for insert
with check (owner_auth_uid = auth.uid());

create policy if not exists predictive_assessments_update_own
on public.predictive_assessments
for update
using (owner_auth_uid = auth.uid())
with check (owner_auth_uid = auth.uid());

create table if not exists public.team_protection_groups (
  owner_worker_id text primary key,
  owner_auth_uid uuid,
  invite_code text,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.team_protection_groups
add column if not exists owner_auth_uid uuid;

alter table public.team_protection_groups
alter column owner_auth_uid set default auth.uid();

update public.team_protection_groups
set owner_auth_uid = auth.uid()
where owner_auth_uid is null and auth.uid() is not null;

alter table public.team_protection_groups enable row level security;

drop policy if exists team_protection_groups_select_authenticated on public.team_protection_groups;
drop policy if exists team_protection_groups_insert_authenticated on public.team_protection_groups;
drop policy if exists team_protection_groups_update_authenticated on public.team_protection_groups;

create policy if not exists team_protection_groups_select_own
on public.team_protection_groups
for select
using (owner_auth_uid = auth.uid());

create policy if not exists team_protection_groups_insert_own
on public.team_protection_groups
for insert
with check (owner_auth_uid = auth.uid());

create policy if not exists team_protection_groups_update_own
on public.team_protection_groups
for update
using (owner_auth_uid = auth.uid())
with check (owner_auth_uid = auth.uid());

commit;
