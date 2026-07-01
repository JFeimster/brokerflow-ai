# Zapier Workflow: No-Auth Lender Match Review

File path: `workflows/zapier/no-auth-lender-match-review-zapier.md`

## Trigger

Use **Webhooks by Zapier → Catch Hook**.

Set `LENDER_MATCH_REVIEW_WEBHOOK_URL` in Vercel to the Zapier catch-hook URL.

## Suggested Zap Steps

1. Catch Hook receives the Vercel payload.
2. Filter: continue only when `action_type` equals `lender_match_review`.
3. Create task in CRM, Airtable, Notion, ClickUp, or Google Sheet.
4. Send internal Slack/email alert using `templates/lender-match-review-internal-alert.md`.
5. Optional: create reviewer task using `templates/lender-match-review-human-review-task.md`.

## Required Boundary

The Zap may create tasks, alerts, and records. It must not approve, deny, underwrite, formally price, fund, or submit the borrower.
