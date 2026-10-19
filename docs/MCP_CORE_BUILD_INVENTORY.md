# Seven core tools: inspection and implementation

Inspected from `origin/main` commit `38665ba` on 2026-10-19, including `lib/mcp/server.js`, OAuth authentication, reviews/tasks, partner utilities, lead/routing/document/referral REST Actions, trusted review ingestion, console routes, plugin and migrations. Actual MCP registrations were ten tools: workspace discovery; list/get/summary/activity/create/action reviews; create/list/complete tasks. None of the seven requested names was registered.

| Capability | Existing/reusable | Implementation in this batch |
| --- | --- | --- |
| Routing | Deterministic REST routing and legacy heuristics | Shared `lib/lender-fit` computation; read-only `route_lender_fit`; REST response/webhook unchanged. |
| Checklist | REST templates/generator/audit | Shared `lib/documents` templates and generator; typed preliminary checklist; legacy wrapper retained. |
| Review | `create_review_request`, atomic review RPC, queue and audit | Confirmed compatibility operation `request_lender_match_review`; original retained; optional atomic intake/deal association. |
| Intake | Lead normalization and gap detection | Authenticated confirmed capture in canonical `leads`; consent/completeness metadata; canonical `lead_events` audit/idempotency; linked durable deal. |
| Documents | Templates, metadata audit, internal task service | Confirmed tracked draft/task; immutable checklist/report snapshot; actual `not_sent` delivery state. |
| Deal status | No canonical persistent Deal entity | Small `brokerflow_deals` table linked to canonical lead and existing review; read-only status/pagination RPC. |
| Referral | Partner validation and REST builder; canonical platform-core `partners`/`referrals` | Confirmed scoped capture, active partner check, natural-key deduplication, source/consent/scenario/broker metadata and `lead_events` creation/attribution audit. |

Read-only platform-core metadata inspection confirmed `leads`, `lead_events`, `partners` and `referrals` contracts and existing unique keys. No private records were read. Reusing these avoids parallel intake, partner, attribution and audit tables. The only new tables are `brokerflow_deals` and `brokerflow_document_requests`. Existing schemas, RLS policies, permissions and membership records remain intact. The isolated test fixture mirrors these relevant contracts; it is not a complete clone of the shared database.

Live migration history already includes the review, rate-limit and follow-up task migrations under their applied timestamps. This batch adds one new local migration, `20261019165744_brokerflow_core_workflows.sql`; the PR does not apply it to shared infrastructure.
