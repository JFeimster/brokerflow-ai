---
name: review-operations
description: Find and summarize authorized BrokerFlow operational reviews and their permitted audit history.
---

# Review operations

Use `get_my_workspaces` first when the authorized workspace is unclear. The user must select an organization; do not infer one from prior conversations. Use `list_reviews` with narrow filters and a modest page size, then `get_review` for one selected record. Continue pagination only when requested or needed to answer the question.

Use `get_review_activity` only for an audit-history request. If it is denied, explain that the workspace has not granted audit access; do not attempt another tool or route to recover the events.

Summarize operational status and human next steps accurately. Do not interpret internal business-development scoring as borrower credit scoring, underwriting, qualification, or lender eligibility.
