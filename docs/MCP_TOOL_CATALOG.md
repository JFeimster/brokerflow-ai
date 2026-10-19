# BrokerFlow MCP V1 tool catalog

All tools require an OAuth bearer token for the MCP resource. Each tool reloads the user's active workspace roles and permissions. Select an organization explicitly; its ID is never trusted without membership validation.

| Tool | Permission | Behavior |
| --- | --- | --- |
| `get_my_workspaces` | `brokerflow.reviews.read` | Returns active workspaces and read/write/audit capabilities. |
| `list_reviews` | `brokerflow.reviews.read` | Server-filtered, paginated review rows; page size 1–100. |
| `get_review` | `brokerflow.reviews.read` | One organization's allowlisted operational review fields. |
| `get_review_activity` | `brokerflow.reviews.read` and `brokerflow.reviews.audit` | One review's audit events, paginated separately. |
| `create_review_request` | `brokerflow.reviews.read` and `brokerflow.reviews.write` | Validated, idempotent, rate-limited request for human review. |
| `apply_review_action` | `brokerflow.reviews.read` and `brokerflow.reviews.write` | Version-checked, idempotent human workflow transition with an attributable audit event. |

`create_review_request` returns `review_id` (the UUID accepted by `get_review` and `get_review_activity`) and `review_request_id` (the stable external request reference). Use `review_id` for subsequent MCP reads.

Creation is not a borrower decision and does not perform qualification, underwriting, approval, pricing, funding, or lender submission. No tool returns raw private documents, bank data, SSNs, credentials, or full conversation transcripts. Errors fail closed on missing backend configuration, permission changes, rate-limit failures, and persistence errors.

`apply_review_action` supports `start_review`, `request_information`, and `mark_reviewed`, following the existing status-transition rules. Supply the current `expected_version` and a unique `idempotency_key`. `request_information` requires a short note; notes reject common personal identifiers and contact details. The tool returns the resulting status and version without treating `reviewed` as a borrower decision. Confirm the intended state change with the user before invoking it.
