begin;

create table if not exists public.anomaly_events (
  event_id text primary key,
  owner_auth_uid uuid not null default auth.uid(),
  worker_id text,
  event_type text not null,
  severity text not null,
  title text,
  detail text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists anomaly_events_owner_created_idx
on public.anomaly_events (owner_auth_uid, created_at desc);

create index if not exists anomaly_events_type_created_idx
on public.anomaly_events (event_type, created_at desc);

alter table public.anomaly_events enable row level security;

create policy if not exists anomaly_events_select_own
on public.anomaly_events
for select
using (owner_auth_uid = auth.uid());

create policy if not exists anomaly_events_insert_own
on public.anomaly_events
for insert
with check (owner_auth_uid = auth.uid());

create policy if not exists anomaly_events_update_own
on public.anomaly_events
for update
using (owner_auth_uid = auth.uid())
with check (owner_auth_uid = auth.uid());

create table if not exists public.moderation_actions (
  action_id text primary key,
  owner_auth_uid uuid not null default auth.uid(),
  actor_worker_id text,
  target_worker_id text,
  action_type text not null,
  decision text not null,
  reason text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists moderation_actions_owner_created_idx
on public.moderation_actions (owner_auth_uid, created_at desc);

create index if not exists moderation_actions_target_created_idx
on public.moderation_actions (target_worker_id, created_at desc);

alter table public.moderation_actions enable row level security;

create policy if not exists moderation_actions_select_own
on public.moderation_actions
for select
using (owner_auth_uid = auth.uid());

create policy if not exists moderation_actions_insert_own
on public.moderation_actions
for insert
with check (owner_auth_uid = auth.uid());

create policy if not exists moderation_actions_update_own
on public.moderation_actions
for update
using (owner_auth_uid = auth.uid())
with check (owner_auth_uid = auth.uid());

commit;
