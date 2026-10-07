# Partner Action Authentication Boundary Review

Current state: all 12 canonical partner handlers are under `/api/no-auth/`. Each accepts an optional action-specific request-body shared secret and may forward to a configured webhook using the shared `WEBHOOK_SHARED_SECRET` outbound header. This is abuse reduction, not user identity, tenant isolation, or strong authorization. No auth migration is made in this documentation phase.

| Action | Current classification | Recommendation |
| --- | --- | --- |
| Affiliate Partner Signup | Stay no-auth for public consent-based intake | Keep payload bounded; rate-limit and spam-protect at edge/orchestrator. Protect the downstream CRM write. |
| Channel Partner Prospect Capture | Stay no-auth for low-risk prospect capture | Protect downstream CRM create/update with API key. |
| COI Niche Scoring | Stay no-auth for internal scoring of supplied partner context | Keep score internal and do not accept borrower data; authenticated API is appropriate if scores are persisted. |
| Partner Outreach Campaign | Stay no-auth for draft generation | Protect any downstream campaign scheduling/sending with API key or OAuth as appropriate. |
| Partner Objection Response | Stay no-auth for draft generation | Escalate legal/compliance or compensation ambiguity; do not turn draft endpoint into a compensation write. |
| Partner Call Prep Brief | Stay no-auth for draft generation | Do not fetch private CRM records from the no-auth handler. |
| Partner Onboarding Checklist | Stay no-auth for checklist generation | Protect downstream CRM/profile/commission-term writes with API key. |
| Partner Enablement Content | Stay no-auth for educational draft generation | Protect publication/distribution and asset management writes. |
| Partner Reactivation | Stay no-auth for bounded draft/trigger payload | Protect actual CRM updates and outbound communication. |
| Partner Referral Submission | Should move to API key or a trusted intake gateway before broad public use | Payload includes borrower contact and financing context. Current optional shared secret does not provide identity or robust abuse prevention. Keep consent checks and minimize data. |
| Partner Status Update Draft | Should move to API key for production use with live deal context | A stage can reveal private workflow status. Keep current handler input-only; any CRM status retrieval requires authenticated read access. |
| Partner Attribution Log | Should use protected write access before connecting to payout/ledger systems | Current log-only no-auth version must remain disconnected from private ledgers and payment authorization. Disputes and payout changes require authenticated operator access. |

No current action requires OAuth for its present function. OAuth may be appropriate for per-user calendar/email/drive integrations, but those are separate actions. Authenticated read access should be introduced if a future action fetches a partner's live deal/referral status. Protected write access is required for CRM updates, actual communication sends, payout/ledger changes, and payment operations. Payment and compensation dispute operations are outside the no-auth action boundary.
