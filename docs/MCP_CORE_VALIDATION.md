# Seven core tools validation

Local validation on 2026-10-19:

| Check | Observed outcome |
| --- | --- |
| Build and lint | Passed; syntax validation includes all API, library and script modules. |
| Unit/protocol/compatibility/compliance/skill/site suite | 193 passed, zero skipped. Actual MCP initialization, discovery and tool calls use the SDK transports; static-route tests cover all seven public pages and their links. |
| PostgreSQL 17 suites | 28 passed, zero skipped; isolated PostgreSQL 17.6 on loopback, synthetic records only. |
| Seven-step synthetic workflow | Passed through registered MCP handlers and actual services/RPCs; a fresh connection sees durable deal, review and task state. |
| Existing ten tool definitions | Schemas, annotations and descriptions match the `38665ba` baseline fixture exactly. |
| REST compatibility | Legacy routing responses/forwarded events and checklist/audit/packet/summary output match baseline fixtures. Partner REST behavior remains compatible. |
| Atomicity, retries and isolation | Concurrent intake retries deduplicate; changed requests conflict; audit failure rolls back lead/deal; denied contact permission, viewer/cross-tenant/revoked-member access and direct anon/authenticated access fail as expected. |
| Private plugin package | Version 1.3.0, ten skills, four references, three templates, seventeen tool-selection cases, six n8n exports (five inactive protected preview starters), 24 packaged plugin files. |
| Existing deployed OAuth connection | Read-only `get_my_workspaces` succeeded through the current BrokerFlow private-plugin connector. Its available catalog still contains the ten existing tools. |

The database suite uses an injected test authenticator and a test-only PostgreSQL adapter rather than GoTrue/PostgREST. It applies all local migrations to a synthetic baseline and verifies shared columns/policies stay intact. The core suite creates/drops a separate test database and therefore requires `CREATE DATABASE` on a disposable PostgreSQL server. CI supplies an ephemeral PostgreSQL 17 service, runs both database suites with `REQUIRE_POSTGRES_TESTS=1`, and packages the private plugin.

One additive migration is prepared: `supabase/migrations/20261019165744_brokerflow_core_workflows.sql`. It adds only deal/document-request tables, scoped server-only RPCs and private permission/idempotency helpers. It does not alter existing shared table columns, policies, permission definitions or assignments. It has **not** been applied to shared platform-core by this build. Existing review/rate-limit/task migrations were confirmed in live migration history under their already-applied timestamps; do not replay them.

Code/CI/Preview success does not establish deployed seven-tool OAuth acceptance. Deployment of the new server, the approved migration, Preview OAuth configuration if needed, and private-plugin refresh must precede real authenticated discovery and the live synthetic workflow. No production release, shared migration, OAuth reconfiguration, plugin publication or borrower-facing delivery is performed by this PR. The consolidated activation gate is in [MCP_RELEASE_CHECKLIST.md](MCP_RELEASE_CHECKLIST.md).
