# BrokerFlow MCP V1 tool catalog

All tools require an OAuth bearer token for the MCP resource. Each tool reloads the user's active workspace roles and permissions. Select an organization explicitly; its ID is never trusted without membership validation.

| Tool | Permission | Behavior |
| --- | --- | --- |
| `get_my_workspaces` | `brokerflow.reviews.read` | Returns active workspaces and read/write/audit capabilities. |
| `list_reviews` | `brokerflow.reviews.read` | Server-filtered, paginated review rows; page size 1–100. |
| `get_review_queue_summary` | `brokerflow.reviews.read` | Organization-scoped status and urgency counts, open/overdue totals, aging buckets, needs-information count, oldest outstanding references, and suggested operational next steps. |
| `get_review` | `brokerflow.reviews.read` | One organization's allowlisted operational review fields. |
| `get_review_activity` | `brokerflow.reviews.read` and `brokerflow.reviews.audit` | One review's audit events, paginated separately. |
| `create_review_request` | `brokerflow.reviews.read` and `brokerflow.reviews.write` | Validated, idempotent, rate-limited request for human review. |
| `apply_review_action` | `brokerflow.reviews.read` and `brokerflow.reviews.write` | Version-checked, idempotent human workflow transition with an attributable audit event. |
| `create_follow_up_task` | `brokerflow.reviews.read` and `brokerflow.reviews.write` | Persistent, idempotent internal task creation with optional active member assignment and same-organization review link. |
| `list_follow_up_tasks` | `brokerflow.reviews.read` | Filtered, paginated internal task list with owners, due dates, status, and creation/completion attribution. |
| `complete_follow_up_task` | `brokerflow.reviews.read` and `brokerflow.reviews.write` | Idempotent task completion with actor attribution and an audit event. |

`create_review_request` returns `review_id` (the UUID accepted by `get_review` and `get_review_activity`) and `review_request_id` (the stable external request reference). Use `review_id` for subsequent MCP reads.

Creation is not a borrower decision and does not perform qualification, underwriting, approval, pricing, funding, or lender submission. No tool returns raw private documents, bank data, SSNs, credentials, or full conversation transcripts. Errors fail closed on missing backend configuration, permission changes, rate-limit failures, and persistence errors.

`apply_review_action` supports `start_review`, `request_information`, and `mark_reviewed`, following the existing status-transition rules. Supply the current `expected_version` and a unique `idempotency_key`. `request_information` requires a short note; notes reject common personal identifiers and contact details. The tool returns the resulting status and version without treating `reviewed` as a borrower decision. Confirm the intended state change with the user before invoking it.

`get_review_queue_summary` uses organization-filtered server-side counts and returns no borrower scenario fields. Status counts include all reviews; urgency counts, overdue counts, and age buckets cover open reviews only. The response includes up to five oldest open reviews and up to five oldest `needs_information` references. It classifies open reviews as overdue by elapsed age: `same_day` 24 hours, `high` 48 hours, `normal` 120 hours, and `low` 168 hours. These are operational triage thresholds, not borrower deadlines or eligibility rules. Age buckets are under 1 day, 1–3 days, 3–7 days, and over 7 days.

Follow-up tasks are internal workflow records. Task status is `open` or `completed`; task types are `call`, `email`, `request_information`, `document_follow_up`, `internal_review`, and `other`. Creation and completion write actor-attributed audit events. Idempotency keys are stored as hashes. Task text must stay operational and cannot contain common personal identifiers or contact details. Assignment and review links must belong to the selected active organization. MCP task tools never send a message or perform an external CRM write.

An explicit user request can authorize a permitted internal task create or completion without another confirmation prompt. Tasks are never created as an automatic side effect of triage. External message delivery and CRM synchronization require separate opt-in and authorization.
