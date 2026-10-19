# Seven core tools validation

Local validation on 2026-10-19:

| Check | Observed outcome |
| --- | --- |
| Build and lint | Passed; syntax validation includes all API, library and script modules. |
| Unit/protocol/compatibility/compliance/skill/site suite | 195 passed, zero skipped on the v1.3.1 source branch. Actual MCP initialization, discovery and tool calls use the SDK transports; static-route tests cover all seven public pages and their links. |
| PostgreSQL 17 suites | 28 passed, zero skipped; isolated PostgreSQL 17.6 on loopback, synthetic records only. |
| Seven-step synthetic workflow | Passed through registered MCP handlers and actual services/RPCs; a fresh connection sees durable deal, review and task state. |
| Existing ten tool definitions | Schemas, annotations and descriptions match the `38665ba` baseline fixture exactly. |
| REST compatibility | Legacy routing responses/forwarded events and checklist/audit/packet/summary output match baseline fixtures. Partner REST behavior remains compatible. |
| Atomicity, retries and isolation | Concurrent intake retries deduplicate; changed requests conflict; audit failure rolls back lead/deal; denied contact permission, viewer/cross-tenant/revoked-member access and direct anon/authenticated access fail as expected. |
| Private plugin source package | Version 1.3.1 candidate, ten skills, four references, three templates, eighteen tool-selection cases, six n8n exports (five inactive protected preview starters), 24 packaged plugin files. |
| Authenticated ChatGPT activation | At the v1.3.0 activation, owner confirmed OAuth was functioning, all seventeen then-registered tools were discovered, and nine live read-only MCP calls succeeded. The new single-task lookup has not had a live authenticated call. |

The database suite uses an injected test authenticator and a test-only PostgreSQL adapter rather than GoTrue/PostgREST. It applies all local migrations to a synthetic baseline and verifies shared columns/policies stay intact. The core suite creates/drops a separate test database and therefore requires `CREATE DATABASE` on a disposable PostgreSQL server. CI supplies an ephemeral PostgreSQL 17 service, runs both database suites with `REQUIRE_POSTGRES_TESTS=1`, and packages the private plugin.

One additive migration is `supabase/migrations/20261019165744_brokerflow_core_workflows.sql`. It adds only deal/document-request tables, scoped server-only RPCs and private permission/idempotency helpers. It does not alter existing shared table columns, policies, permission definitions or assignments. The repository owner confirmed it has been applied to the active platform-core project. Existing review/rate-limit/task migrations were confirmed in live migration history under their already-applied timestamps; do not replay them.

Owner-confirmed production activation is complete: the migration is applied, OAuth functions, all seventeen tools are discovered in ChatGPT, and nine live read-only calls passed. The live calls did not include persistent writes; the full synthetic workflow still needs authenticated live write acceptance. No borrower-facing delivery or lender submission is implemented. The [MCP_RELEASE_CHECKLIST.md](MCP_RELEASE_CHECKLIST.md) records both completed milestones and the remaining validation.

The subsequent v1.3.1 source adds `get_follow_up_task` using the existing task table, authenticated workspace read permission, and an organization-plus-task filtered lookup. It requires no migration. Unit/protocol coverage verifies read-only workspace access, cross-tenant denial, missing-task behavior, and the selected fields; the PostgreSQL integration path exercises a persisted task lookup. Private plugin refresh and live verification of this addition remain pending.
