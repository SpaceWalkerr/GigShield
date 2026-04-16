# GigShield Backend Rollout

This file maps the existing frontend demo flows to the backend schemas:

- Full schema: `supabase/gigshield_backend_schema.sql`
- Lean MVP schema: `supabase/gigshield_backend_mvp.sql`

## Goal

Move GigShield from local demo state to real persisted product data without rewriting the whole app at once.

## Backend Domains

1. Identity and onboarding
   - `profiles`
   - `worker_profiles`
   - `worker_platform_accounts`

2. Weekly insurance model
   - `weekly_policies`
   - `weekly_policy_pricing`

3. Parametric intelligence
   - `trigger_events`
   - `risk_assessments`
   - `income_radar_snapshots`

4. Claims and payouts
   - `claims`
   - `payouts`

5. Fraud and operations
   - `fraud_checks`
   - `admin_actions`
   - `audit_logs`

## What Is Actually Required Right Now

For moving the app from demo/local values to real values, you only need:

1. `profiles`
2. `worker_profiles`
3. `worker_platform_accounts`
4. `weekly_policies`
5. `weekly_policy_pricing`
6. `trigger_events`
7. `risk_assessments`
8. `income_radar_snapshots`
9. `claims`
10. `payouts`

Those are the tables included in `supabase/gigshield_backend_mvp.sql`.

## What Is Not Required Yet

These are useful later, but not required for the first real-data migration:

- `fraud_checks`
  - Phase 3 / advanced fraud logic

- `admin_actions`
  - only needed when admin override workflows become real

- `audit_logs`
  - useful for production governance, but not required for the first live backend pass

- legacy persistence tables from the old repo flow:
  - `worker_state`
  - `predictive_assessments`
  - `team_protection_groups`
  - `anomaly_events`
  - `moderation_actions`

Those can stay for compatibility while we migrate, but they should not be the long-term target.

## Current Frontend To Backend Mapping

- `src/hooks/useVerificationFlow.js`
  - should create/update `worker_profiles` and `weekly_policies`

- `src/utils/session.js`
  - should read primarily from `profiles` and auth session instead of local storage

- `src/utils/predictiveSafetyNet.js`
  - should move from local storage into `risk_assessments`

- `src/utils/incomeRadar.js`
  - currently generates demo output in memory
  - should eventually read latest `income_radar_snapshots`

- `src/utils/payoutReceipt.js`
  - should map to `claims` and `payouts`

- `src/utils/teamProtection.js`
  - can stay on legacy `team_protection_groups` for now, then migrate later if needed

## Migration Order

1. Real auth + profile persistence
2. Onboarding saves worker profile and active weekly policy
3. Pricing saves weekly premium rows
4. Predictive engine saves `risk_assessments`
5. Income Radar reads backend snapshots
6. Payout flow writes `claims` and `payouts`
7. Fraud/admin reads and writes server-side operations data

## Recommended Schema Choice

Use this sequence:

1. Apply `gigshield_backend_mvp.sql` first
2. Move onboarding, predictive, radar, and payout flows to it
3. Add `fraud_checks`, `admin_actions`, and `audit_logs` only after the worker flow is stable

## Notes

- `gigshield_backend_schema.sql` is the full target schema.
- `gigshield_backend_mvp.sql` is the recommended starting point.
