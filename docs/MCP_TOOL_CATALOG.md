# BrokerFlow MCP V1 tool catalog

All tools require an OAuth bearer token for the MCP resource. Each tool reloads the user's active workspace roles and permissions. Select an organization explicitly; its ID is never trusted without membership validation.

| Tool | Permission | Behavior |
| --- | --- | --- |
| `get_my_workspaces` | `brokerflow.reviews.read` | Returns active workspaces and read/write/audit capabilities. |
| `list_reviews` | `brokerflow.reviews.read` | Server-filtered, paginated review rows; page size 1–100. |
| `get_review` | `brokerflow.reviews.read` | One organization's allowlisted operational review fields. |
| `get_review_activity` | `brokerflow.reviews.read` and `brokerflow.reviews.audit` | One review's audit events, paginated separately. |
| `create_review_request` | `brokerflow.reviews.read` and `brokerflow.reviews.write` | Validated, idempotent, rate-limited request for human review. |

Creation is not a borrower decision and does not perform qualification, underwriting, approval, pricing, funding, or lender submission. No tool returns raw private documents, bank data, SSNs, credentials, or full conversation transcripts. Errors fail closed on missing backend configuration, permission changes, rate-limit failures, and persistence errors.
