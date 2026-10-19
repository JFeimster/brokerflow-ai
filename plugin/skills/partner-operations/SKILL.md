---
name: partner-operations
description: Capture confirmed partner referrals with canonical intake links, permission metadata and operational attribution.
---

Use an explicitly selected workspace and actual active partner UUID from authorized context. Do not invent a partner record or search other organizations. The referred borrower must have a `capture_borrower_intake` record; retain its intake/deal reference. Contact permission must be supplied, and a true permission flag must agree with granted intake consent.

Summarize the partner, opaque source reference, intake, intended broker and contact/warm-introduction permission before saving. After explicit user confirmation call `capture_partner_referral` with `confirmed: true` and a stable idempotency key. Reuse the key for retries. A duplicate returns the original reference; a conflicting capture must be resolved by the operator, not bypassed with another key.

Report the stored referral ID, related deal/review IDs and operational attribution status. Attribution links a supplied source to the opportunity; it does not determine compensation, commissions, payouts, borrower eligibility or funding. Use `lookup_deal_status` for later operational status. This workflow never sends a referral to a lender or contacts the borrower.
