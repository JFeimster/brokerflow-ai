---
name: deal-operations
description: Look up durable organization-scoped deal stages separately from review and follow-up task statuses.
---

Select the authorized workspace. Use `lookup_deal_status` with a deal ID or intake ID. Omit IDs for a bounded workspace page; follow `next_cursor` only as needed. Do not scan other workspaces to recover a missing record. A not-found response or empty page is a real empty state, not evidence of an external CRM failure.

Report `pipeline_stage`, `review_status`, assigned owner, linked task state, `last_activity` and `next_action` distinctly. Do not translate an internal stage or reviewed task into borrower approval, denial, qualification, lender submission or funding. Owner IDs are references; do not invent names. The tool performs no writes.

Deals are created by confirmed `capture_borrower_intake`. Confirmed `request_lender_match_review` with an intake reference links the review; confirmed `trigger_missing_document_request` links the document task. This package has no arbitrary deal-stage update operation.
