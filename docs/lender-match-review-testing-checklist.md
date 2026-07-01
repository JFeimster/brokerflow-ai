# Testing Checklist: Lender Match Review

File path: `docs/lender-match-review-testing-checklist.md`

## OpenAPI

- [ ] Paste `schemas/no-auth-lender-match-review.schema.yaml` into GPT Builder.
- [ ] Confirm authentication is set to None.
- [ ] Confirm operation ID is `requestLenderMatchReview`.
- [ ] Confirm server URL is `https://brokerflow-ai.vercel.app`.

## Endpoint

- [ ] `POST /api/no-auth/lender-match-review` returns `200` for valid payloads.
- [ ] `GET /api/no-auth/lender-match-review` returns `405`.
- [ ] Missing required fields return `400`.
- [ ] `human_review_required: false` returns `400`.
- [ ] Invalid enum values return `400`.

## Automation Forwarding

- [ ] Blank `LENDER_MATCH_REVIEW_WEBHOOK_URL` logs payload only.
- [ ] Configured webhook receives the forwarded payload.
- [ ] `WEBHOOK_SHARED_SECRET` is forwarded as `x-brokerflow-secret` when configured.

## Boundary

- [ ] Response does not approve, deny, underwrite, price, fund, or submit.
- [ ] Response confirms review queue status and next step.
