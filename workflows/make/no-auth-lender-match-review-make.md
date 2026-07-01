# Make Workflow: No-Auth Lender Match Review

File path: `workflows/make/no-auth-lender-match-review-make.md`

## Trigger

Use **Webhooks → Custom webhook**.

Set `LENDER_MATCH_REVIEW_WEBHOOK_URL` in Vercel to the Make webhook URL.

## Suggested Scenario Modules

1. Custom webhook receives the Vercel payload.
2. Router branches by `recommended_review_path`.
3. Create queue item in the chosen system.
4. Send internal alert.
5. Create review task when final regulated steps may be required.

## Required Boundary

Make can automate intake, queueing, alerts, and checklists. Final approval, denial, underwriting, formal pricing, funding, and lender submission remain outside this automation stub.
