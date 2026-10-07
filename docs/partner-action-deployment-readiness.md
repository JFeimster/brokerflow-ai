# Partner Action Deployment Readiness

## Readiness decision

**Code readiness:** all 12 partner Action handlers and canonical OpenAPI schemas are present on `main`; automated regression coverage passes for all 12. The Batch 2–4 validators, JavaScript syntax checks, canonical operation/path checks, and registry checks pass.

**Live Vercel/GPT Builder readiness:** **not ready for public or end-to-end production use.** The Vercel Git deployment setting is `deploymentEnabled: false`; the latest Production deployment is from July 1, 2026, and predates the partner action batches. Production has no partner webhook destinations configured. Referral, status, and attribution Actions are no-auth endpoints even though they accept borrower/deal or compensation metadata. The handlers have no durable persistence or idempotency store. No GPT Builder import or live action smoke test was performed.

This is a readiness review only. `vercel.json` remains unchanged and deployment remains disabled.

## Vercel evidence

- Project: `jason-feimsters-projects/brokerflow-ai`; production alias: `https://brokerflow-ai.vercel.app`.
- `vercel env ls production` showed only `LENDER_FIT_ROUTING_WEBHOOK_URL`. Therefore all 12 partner webhook destination variables, all 12 action-specific request-secret variables, and `WEBHOOK_SHARED_SECRET` are currently absent from the Vercel Production environment.
- The latest Production deployment inspected was Ready, created July 1, 2026 (98 days old on October 7, 2026). It predates these merged partner action batches. No endpoint from the current 12-action set was live-smoke-tested.
- `vercel.json` has `git.deploymentEnabled` set to `false`. No deployment settings were changed.
- Project listing reports Node.js 24.x. The repo declares Node.js >=18; the handlers use built-in serverless/runtime APIs and do not require a build step for the static site.

## Required configuration

For each partner Action, set its `*_WEBHOOK_URL` to a trusted workflow receiver if that Action must persist, create tasks, route referrals, or deliver messages. All 12 destinations are currently unset in Production:

| Action | Destination variable |
| --- | --- |
| Affiliate Partner Signup | `AFFILIATE_PARTNER_SIGNUP_WEBHOOK_URL` |
| Channel Partner Prospect Capture | `CHANNEL_PARTNER_PROSPECT_WEBHOOK_URL` |
| COI Niche Scoring | `COI_NICHE_SCORING_WEBHOOK_URL` |
| Partner Outreach Campaign | `PARTNER_OUTREACH_CAMPAIGN_WEBHOOK_URL` |
| Partner Objection Response | `PARTNER_OBJECTION_RESPONSE_WEBHOOK_URL` |
| Partner Call Prep Brief | `PARTNER_CALL_PREP_WEBHOOK_URL` |
| Partner Onboarding Checklist | `PARTNER_ONBOARDING_CHECKLIST_WEBHOOK_URL` |
| Partner Enablement Content | `PARTNER_ENABLEMENT_CONTENT_WEBHOOK_URL` |
| Partner Reactivation | `PARTNER_REACTIVATION_WEBHOOK_URL` |
| Partner Referral Submission | `PARTNER_REFERRAL_WEBHOOK_URL` |
| Partner Status Update Draft | `PARTNER_STATUS_UPDATE_WEBHOOK_URL` |
| Partner Attribution Log | `PARTNER_ATTRIBUTION_LOG_WEBHOOK_URL` |

Set the corresponding action-specific `*_SHARED_SECRET` only when the inbound caller can supply it securely. Set `WEBHOOK_SHARED_SECRET` once for outbound receiver authentication. No Production partner-specific secrets or outbound shared secret are currently configured. Do not place a production shared secret in public GPT instructions or expose it in a client-side integration.

See `docs/internal-partner-action-packs-vercel-env.md` and `.env.example` for the complete variable matrix. A handler can return a local generated response when a destination is blank, but the response's `webhook_status: not_configured` means no downstream persistence or workflow handoff occurred.

## Auth and persistence blockers

Before exposing borrower referral data publicly, route Partner Referral Submission through API-key auth or a trusted intake gateway with rate limits and audit controls. Protect Partner Status Update Draft if it is populated from live deal context. Keep Partner Attribution Log disconnected from payout ledgers and payment operations; use protected write access for any future ledger integration. The request-body shared secret is optional abuse reduction, not caller identity or tenant authorization. See `docs/partner-action-auth-boundary-review.md`.

No action has durable persistence or idempotent webhook delivery. A timeout or retry can duplicate CRM records, tasks, or attribution logs. Implement a durable idempotency store and outbox with stable event IDs before automating repeated referral and commission events. See `docs/partner-action-idempotency-persistence-plan.md`.

## GPT Builder setup

Import the 12 canonical schemas listed in `docs/internal-partner-action-packs-gpt-builder-setup.md`. Use the recommended selection and borrower/partner guardrails. Verify Action server URLs and operation IDs after import. The repo state does not establish that a GPT has been configured, published, or connected to the current Vercel deployment.

## Live smoke-test checklist

Run against a controlled Preview or production environment after deployment and authentication are configured. Use synthetic test records, not real borrower documents or financial data.

1. Verify the deployed revision contains all 12 `/api/no-auth/...` handlers and responds to unsupported methods with 405.
2. Submit a synthetic partner signup and prospect; verify the webhook receives the action tracking ID and no request secret.
3. Confirm a COI score is labeled internal partner-development prioritization, never borrower eligibility.
4. Submit a synthetic referral with permission true, permission false with warm intro, and permission false without warm intro; verify routing and that false permission never triggers direct borrower contact.
5. Verify the workflow creates or deduplicates the borrower/deal handoff and preserves partner/referral attribution.
6. Draft a status update at minimal disclosure; test restricted detail filtering and confirm the message is not sent automatically by the draft endpoint.
7. Log duplicate/disputed attribution and confirm review-task routing; confirm external payout states cannot trigger payment.
8. Verify webhook receivers validate `x-brokerflow-secret`, deduplicate stable event IDs, and store audit context.
9. Import/test the schemas in GPT Builder and confirm each Action maps to the intended endpoint and response fields.
10. Confirm logs and error responses contain no secrets or unnecessary borrower PII.

## Rollout order

1. Decide and implement the auth gateway for referral/status/attribution writes; preserve the current borrower decision boundary.
2. Add durable idempotency/persistence and receiver-side webhook verification.
3. Configure Preview environment variables and test destinations first.
4. Enable a controlled Preview deployment and complete the smoke checklist with synthetic records.
5. Import the canonical schemas in GPT Builder and validate end-to-end handoffs.
6. Review the operational evidence, configure Production variables, and explicitly choose whether to enable Production Git deployments. Deployment is intentionally not enabled by this change.

## Rollback considerations

- Keep the previous Production deployment available as rollback, but note it does not contain the current partner endpoints.
- If a new endpoint or receiver misbehaves, remove its webhook destination or disable the corresponding GPT Action while preserving the tracking and audit records already created.
- Do not replay failed referral/attribution webhooks until downstream state is checked; duplicate prevention is not currently built in.
- Roll back code and any environment changes together. Do not use rollback as a substitute for correcting attribution or payout records in the protected system of record.
