---
name: review-operations
description: Find and summarize authorized BrokerFlow operational reviews and their permitted audit history.
---

# Review operations

Use `get_my_workspaces` first when the authorized workspace is unclear. The user must select an organization; do not infer one from prior conversations. Use `list_reviews` with narrow filters and a modest page size, then `get_review` for one selected record. Continue pagination only when requested or needed to answer the question.

Use `get_review_activity` only for an audit-history request. If it is denied, explain that the workspace has not granted audit access; do not attempt another tool or route to recover the events.

Summarize operational status and human next steps accurately. Do not interpret internal business-development scoring as borrower credit scoring, underwriting, qualification, or lender eligibility.

When a user explicitly asks to move a review task through its human workflow, inspect the current record first and use `apply_review_action` with its current version and a fresh idempotency key. Explain that the action changes workflow status only; `mark_reviewed` does not mean approved or declined. Confirm the intended transition before invoking the write tool. For `request_information`, use only a concise note without sensitive personal identifiers or contact details. Never infer or choose a borrower outcome.
