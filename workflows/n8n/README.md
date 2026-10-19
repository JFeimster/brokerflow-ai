# n8n workflow exports

These importable examples are disabled preview starters. Each new `*-preview` or `*-draft` export requires a header-auth credential selected/configured in the importing n8n instance. The export contains only a placeholder credential reference, no token. Keep the workflow inactive while reviewing it.

The examples validate required field presence and return a minimal preview response. They do not read the BrokerFlow database, persist a lead/review/referral, connect to a CRM, send a borrower or partner message, schedule a renewal, or submit a lender application. `external_write` is `not_configured`; draft examples report `delivery_status: not_sent`. Send synthetic, minimized payloads during setup because the n8n execution environment may retain request data according to its own settings.

| Export | Expected input fields | Preview outcome |
| --- | --- | --- |
| `borrower-intake-to-crm.n8n.json` | intake, organization and scenario references | CRM integration is unconfigured; route for broker review |
| `missing-doc-reminder-workflow.n8n.json` | intake, missing item types and permission status | Prepare for separate human review; no delivery |
| `referral-partner-lead-routing.n8n.json` | organization, partner, referral and intake references | Verify same-workspace attribution |
| `no-auth-lender-match-review.n8n.json` | Existing REST review webhook contract | Existing REST webhook receipt example; review its endpoint contract before use |
| `renewal-reminder-workflow.n8n.json` | deal, renewal date and permission status | Broker verifies timing and separately authorizes outreach |
| `daily-pipeline-summary.n8n.json` | authorized snapshot timestamp and stage counts | Preview only; no data source or digest delivery configured |

Import one JSON file at a time in n8n, configure a private header-auth credential, inspect the Webhook, Code and Respond nodes, then test with synthetic data. Do not activate an externally reachable webhook without access controls and a reviewed data-retention policy.
