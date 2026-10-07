# Partner Status Update Guardrails

- Use a controlled stage message and default to `minimal` disclosure.
- `known_status` and `notes` are context only and are not copied into the partner message.
- Only consider caller-provided `allowed_details` when disclosure is declared `expanded_with_consent`; filter sensitive terms and entries that match `restricted_details`.
- Do not disclose credit scores, bank balances, detailed financials, decline reasons, private lender notes, tax information, sensitive document contents, or unapproved pricing and terms.
- Do not promise lender acceptance, approval, qualification, or funding.
- The returned message is a draft. Confirm recipient and consent basis before sending.
- Optional webhook forwarding sends the generated draft and allowlisted request context. No persistence or retry deduplication is provided by this endpoint.
