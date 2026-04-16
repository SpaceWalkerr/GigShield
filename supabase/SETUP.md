# Supabase Setup

Use this when connecting GigShield to a new Supabase project.

## 1. Create a new Supabase project

- create a new project in Supabase
- wait for the database and auth services to be ready

## 2. Add frontend environment variables

Create a local `.env` file using `.env.example`:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ENABLE_BACKEND_PERSISTENCE=true
```

## 3. Apply the schema

Recommended first step:

- run `supabase/gigshield_backend_mvp.sql`

Optional later:

- move to `supabase/gigshield_backend_schema.sql` when you want fraud/admin/audit extensions

## 4. Enable Auth

- enable email or Google auth in Supabase Auth
- if using Google auth, configure the callback URL used by this app

## 5. Validate the app

After env setup and schema setup:

1. sign in
2. activate protection in onboarding
3. simulate predictive flow on dashboard
4. verify rows are being created in:
   - `profiles`
   - `worker_profiles`
   - `worker_platform_accounts`
   - `weekly_policies`
   - `weekly_policy_pricing`
   - `risk_assessments`
   - `income_radar_snapshots`

## 6. Current backend migration status

Already wired:

- onboarding persistence
- predictive assessments persistence
- Income Radar snapshot persistence

Still to migrate next:

- claims
- payouts
- deeper fraud/admin workflows
