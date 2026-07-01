# Workflow: No-Auth Lender Match Review

File path: `workflows/no-auth-lender-match-review-workflow.md`

## Trigger

`POST /api/no-auth/lender-match-review`

## Intent

Create a controlled review queue item when lender-match review is required.

## Flow

1. GPT collects scenario details.
2. GPT calls `requestLenderMatchReview`.
3. Vercel validates the request.
4. Vercel creates a `review_request_id`.
5. If `LENDER_MATCH_REVIEW_WEBHOOK_URL` is configured, Vercel forwards the payload to the automation platform.
6. Automation creates an internal broker review task.
7. Automation sends the internal alert template.
8. Reviewer handles final regulated steps outside the GPT.

## Output

- Review request ID
- Queue status
- Manual review next step
- Compliance notice

## Human Review Boundary

Manual review is required before approval, denial, underwriting, formal pricing, funding, or lender submission. Manual review should not block basic intake, logging, task creation, alerting, or checklist generation.
