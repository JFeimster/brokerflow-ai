# Tool selection

## Workspace and reviews

Use `get_my_workspaces` to see current authorized organizations. Use `get_review_queue_summary`, `list_reviews`, `get_review`, and `get_review_activity` for permitted review reads. `create_review_request` remains supported; `request_lender_match_review` is its intake-linking compatibility operation. Use `apply_review_action` only for a clearly specified human workflow transition and current record version.

## Follow-up tasks

Use `create_follow_up_task`, `list_follow_up_tasks`, `get_follow_up_task`, and `complete_follow_up_task` for internal broker tasks. Use `get_follow_up_task` when a specific task ID needs detail, including its review link, assignee, deadline, and state. The operation requires workspace read permission and returns allowlisted metadata for only that task in the selected organization. Task operations do not send messages or sync a CRM. Apply the user's explicit request and current workspace write permission for mutations; do not create tasks implicitly from a recommendation.

## Seven core operations

| Tool | Use | Effect |
| --- | --- | --- |
| `capture_borrower_intake` | Save a user-confirmed, permissioned intake | Persistent write; requires `confirmed: true` and idempotency key |
| `route_lender_fit` | Compute preliminary deterministic product paths | Read-only; legacy scores are internal heuristics, not underwriting or offers |
| `request_lender_match_review` | Create the same human review record as `create_review_request`, optionally linked to intake | Persistent write; requires confirmation and idempotency key |
| `generate_document_checklist` | Generate preliminary scenario guidance | Read-only; no checklist or file is persisted |
| `trigger_missing_document_request` | Record reported missing statuses and create an internal task/draft | Persistent write; requires confirmation; delivery is `not_sent` |
| `lookup_deal_status` | Read an authorized workspace's operational deal stage and links | Read-only; review status is a distinct field |
| `capture_partner_referral` | Attribute an active same-workspace partner to a captured intake | Persistent write; requires confirmation and idempotency key |

All writes are organization scoped and checked again by the server. Do not retry a conflicting request with a different key to bypass deduplication.
