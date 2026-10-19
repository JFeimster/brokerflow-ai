---
name: borrower-intake
description: Capture a confirmed permissioned borrower intake and prepare preliminary routing and human review.
---

# Borrower scenario intake

Use `get_my_workspaces` when the workspace is unclear. Collect an opaque stable external reference, contact name, borrower type, purpose, positive requested amount and two-letter state. Record contact permission as granted, denied or unknown, with source, channels and the actual captured timestamp for granted consent. Do not infer permission. Ask only for operational details; exclude SSNs, account numbers, credentials and raw documents. Optional email and phone belong only in the authorized intake fields.

Summarize the exact record and obtain explicit user confirmation before `capture_borrower_intake`; set `confirmed: true` only after that confirmation. Reuse an already confirmed exact request without asking again. Use a fresh idempotency key per distinct request and retain it across retries. Reusing the external reference with changed details produces a conflict; do not silently create a second intake to evade it.

Retain the returned `intake_id` and `deal_id`. Report completeness as information coverage only. Use `route_lender_fit` for preliminary product paths, then `request_lender_match_review` with the same scenario and intake ID after the user confirms review creation. Keep `create_review_request` available for existing review-only workflows. No tool approves, declines, qualifies, underwrites, prices, funds or submits a borrower.

Explain that the tool creates a task for human review. It does not decide borrower eligibility, approve, deny, underwrite, price, fund, or submit to a lender.
