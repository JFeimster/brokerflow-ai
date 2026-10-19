# PR #26 PostgreSQL integration tests

`.github/workflows/pr26-postgres.yml` runs on pull request updates using an ephemeral PostgreSQL 17 service container. It has no Supabase or Vercel credentials and does not contact the shared `platform-core` project. The workflow runs build, lint, the full Node test suite, and `npm run test:postgres`.

The integration test first loads `supabase/tests/platform_core_baseline.sql`, then applies `supabase/migrations/20261018000100_brokerflow_reviews.sql` to the empty service database. The fixture is synthetic and limited to the baseline contract used by the migration: `auth.users.id`, organization IDs, role IDs/keys, memberships, permissions, role permissions, representative foreign keys and RLS policies. All fixture organizations, users, roles, memberships, and permissions are synthetic. A pre/post catalog snapshot verifies that existing fixture tables, their columns, and policies are unchanged and that the migration adds only the two BrokerFlow tables.

The SQL suite exercises constraints, foreign keys, indexes, row-level security flags, least-privilege grants, RPC execution restrictions, transactional creation plus event insertion, injected failure rollback, the complete review state lifecycle, optimistic version conflicts, concurrent same-key creation, conflicting idempotency payloads, successful action replay after a simulated lost response, and organization-scoped action lookup. PostgreSQL roles named `anon`, `authenticated`, and `service_role` model the database grants used by Supabase. The fixture's `auth.uid()` reads the conventional JWT-subject request setting; the test sets that value directly to exercise synthetic membership policies.

## Scope and limitations

These are direct PostgreSQL tests, not a full local Supabase stack. They do not start GoTrue, PostgREST, Storage, or Realtime; do not validate actual JWT signing/claims, invite-only email delivery, Data API schema exposure, Supabase service-key behavior, or Vercel API runtime wiring. The fixture reproduces only the relevant schema contract and representative policy shape from read-only metadata, not every platform-core migration, trigger, extension, role, policy expression, or production setting. Service-role access is intentionally privileged; end-user organization authorization remains enforced by the authenticated application API before it calls the service-only RPCs.

Run the integration suite against an isolated PostgreSQL 17 database with:

```sh
DATABASE_URL=postgres://... REQUIRE_POSTGRES_TESTS=1 npm run test:postgres
```

The integration file skips in the ordinary unit suite when `DATABASE_URL` is absent; the workflow sets `REQUIRE_POSTGRES_TESTS=1` so a missing database fails CI rather than silently skipping the database checks.
