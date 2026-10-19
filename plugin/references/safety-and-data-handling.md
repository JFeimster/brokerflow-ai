# Safety and data handling

- Treat lender routing and document templates as preliminary operational guidance. A legacy score is an internal heuristic, not a borrower credit score, underwriting decision, lender eligibility result, current lender matrix or offer.
- Never approve, decline, qualify, guarantee, underwrite, price, submit or fund a borrower. Human review owns those decisions.
- Obtain contact permission from the user or authoritative record. Never infer consent or treat a referral flag as permission to contact.
- Keep SSNs, account numbers, credentials and raw documents out of MCP arguments, task text, logs and chat. Use only protected document-provider references where an authorized workflow supplies them.
- Report document status as user-reported metadata. A missing report does not prove provider receipt; `rejected` remains missing.
- Clearly distinguish `draft_prepared`, `task_created`, `awaiting_review`, and `sent`. `sent` requires a real delivery integration and receipt. Current missing-document requests return `delivery_status: not_sent`.
- Use only records inside the explicitly selected, currently authorized organization. Do not bypass permission errors or query another tenant.
- Persistent writes require a summary and explicit confirmation. Use `confirmed: true` only after the user confirms the exact operation and retain the idempotency key for its retries.
- No plugin operation in this package sends borrower-facing messages, retrieves raw documents, writes to an external CRM, or submits lender applications.
