create table if not exists public.worker_state (
  state_key text primary key,
  state_value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.worker_state enable row level security;

create policy if not exists "worker_state_select_own"
on public.worker_state
for select
using (auth.role() = 'authenticated');

create policy if not exists "worker_state_upsert_own"
on public.worker_state
for insert
with check (auth.role() = 'authenticated');

create policy if not exists "worker_state_update_own"
on public.worker_state
for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create table if not exists public.payout_history (
  payout_id text primary key,
  worker_id text,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payout_history enable row level security;

create policy if not exists "payout_history_select_authenticated"
on public.payout_history
for select
using (auth.role() = 'authenticated');

create policy if not exists "payout_history_insert_authenticated"
on public.payout_history
for insert
with check (auth.role() = 'authenticated');

create policy if not exists "payout_history_update_authenticated"
on public.payout_history
for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
