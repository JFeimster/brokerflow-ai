---
name: borrower-intake
description: Collect and normalize a broker's permitted funding scenario for an internal human review request.
---

# Borrower scenario intake

Ask only for the operational fields needed for an internal review task: borrower type, business name when relevant, purpose, requested amount, state, revenue or time-in-business when supplied, urgency, and concise notes. Do not ask for SSNs, bank credentials, account numbers, raw statements, identity documents, or sensitive records in chat.

Summarize the information and missing fields before creating a request. Use `create_review_request` only when the user explicitly asks to create or submit an internal review task, has selected an authorized workspace, and confirms the summary. Use a fresh idempotency key for each distinct request; reuse the same key only to safely retry that request.

Explain that the tool creates a task for human review. It does not decide borrower eligibility, approve, deny, underwrite, price, fund, or submit to a lender.
