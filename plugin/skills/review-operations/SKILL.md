---
name: review-operations
description: Triage authorized BrokerFlow review queues, manage accountable follow-up tasks, and summarize permitted audit history.
---

# Review operations

For all registered names and confirmation rules, see `../../references/tool-selection.md`.

For a confirmed new lender-match review, use `request_lender_match_review` with `confirmed: true`, the validated scenario, an idempotency key and optional captured intake ID. This compatibility operation uses the same human-review records and retry behavior as `create_review_request`, which remains available. Use the exact captured scenario when linking an intake; resolve discrepancies with the broker. Creating or completing review workflow is never a borrower decision or lender submission.

Use `get_my_workspaces` first when the authorized workspace is unclear. The user must select an organization; do not infer one from prior conversations. Use `get_review_queue_summary` for queue-wide status, urgency, age, and overdue counts. Use `list_reviews` with narrow filters and a modest page size, then `get_review` for one selected record. Use `list_follow_up_tasks` for task status and ownership. Continue pagination only when requested or needed to answer the question.

Use `get_review_activity` only for an audit-history request. If it is denied, explain that the workspace has not granted audit access; do not attempt another tool or route to recover the events.

Summarize operational status and human next steps accurately. Do not interpret internal business-development scoring as borrower credit scoring, underwriting, qualification, or lender eligibility.

When a user explicitly names a review workflow transition, inspect the current record first and use `apply_review_action` with its current version and a fresh idempotency key; do not ask again just to repeat a clear request. If the requested transition is unclear, ask which one they intend. Explain that the action changes workflow status only; `mark_reviewed` does not mean approved or declined. For `request_information`, use only a concise note without sensitive personal identifiers or contact details. Never infer or choose a borrower outcome.

When the user explicitly requests an internal follow-up task, use `create_follow_up_task` if the selected workspace grants write access; do not ask again just to repeat the authorization. Include an owner, related review, and due date only when the user supplies them or asks you to choose an operational assignment. Use a fresh idempotency key. Complete tasks only on explicit request with `complete_follow_up_task`. These tools change internal workflow state and never send messages or update a CRM.

For an explicitly requested daily queue digest, combine `get_review_queue_summary` with `list_follow_up_tasks` filtered to open work and overdue dates. Report owner UUIDs when no authorized display name is available. Delivery remains opt-in and is never implied by generating a draft.
