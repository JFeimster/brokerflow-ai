# SOP: Lender Match Review

File path: `sops/lender-match-review-sop.md`

## Objective

Standardize how BrokerFlow AI queues lender-match review requests and hands them off to a broker or operations reviewer.

## Intake Steps

1. Collect borrower/business scenario details.
2. Confirm the request is for internal review, not a final decision.
3. Call `requestLenderMatchReview`.
4. Capture the returned `review_request_id`.
5. Confirm the request was queued.

## Automation Steps

1. Vercel validates the payload.
2. Vercel logs the payload if no webhook is configured.
3. Vercel forwards the payload if `LENDER_MATCH_REVIEW_WEBHOOK_URL` is configured.
4. The downstream workflow creates a queue item, alert, or task.

## Reviewer Steps

1. Review the submitted scenario.
2. Check missing information.
3. Select potential lender/product paths.
4. Request additional data when needed.
5. Move the scenario to the next internal process.

## Boundary

The GPT action layer handles intake, queueing, routing, logging, and alerts. Final regulated steps stay outside this no-auth action layer.

## Vercel Variables

- `LENDER_MATCH_REVIEW_WEBHOOK_URL`
- `LENDER_MATCH_REVIEW_SHARED_SECRET`
- `WEBHOOK_SHARED_SECRET`
