---
name: lender-fit-routing
description: Return preliminary deterministic product paths for a supplied funding scenario without external side effects.
---

Select an authorized workspace using `get_my_workspaces` when needed. Use `route_lender_fit` with structured borrower type, purpose, amount and state. Include only supplied revenue, time in business, property, credit range and collateral details. Report missing fields without inventing them.

The computation is read-only. Explain that `fit_score` and `fit_tier` are legacy internal routing heuristics, not underwriting, lending eligibility, a current lender matrix or an offer. Do not rank actual lenders from this output. Present the preliminary route and required broker-review step.

Use `generate_document_checklist` for a preliminary checklist. Use `request_lender_match_review` only after explicit confirmation of persistent review creation, with `confirmed: true` and a retained idempotency key. No routing call sends a message, triggers a lender submission or makes a borrower decision.
