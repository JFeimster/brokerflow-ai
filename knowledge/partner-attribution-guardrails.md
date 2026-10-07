# Partner Attribution and Commission Log Guardrails

- This no-auth Action records descriptive metadata only.
- Never authorize or initiate payment, calculate a binding commission, update a private payout ledger, or resolve a compensation dispute from this request.
- External-system payout values are caller-supplied descriptions and are not verified by this endpoint.
- Route a dispute flag or disputed status for review. Route `duplicate_check_needed` for duplicate review.
- Do not treat a log entry as proof of entitlement or payment.
- The endpoint does not persist data locally. Webhook retries may produce duplicate downstream logs; deduplicate using the action tracking ID or referral ID in a durable downstream store.
