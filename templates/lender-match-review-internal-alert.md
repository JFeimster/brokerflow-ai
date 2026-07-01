# Template: Lender Match Review Internal Alert

File path: `templates/lender-match-review-internal-alert.md`

## Purpose

Use this template when the lender-match review endpoint creates or forwards a review request.

## Slack / Email Template

```text
New lender-match review request queued.

Review Request ID: {{review_request_id}}
Requester: {{requester_name}}
Borrower Type: {{borrower_type}}
Business/Borrower: {{business_name}}{{borrower_name}}
Loan Purpose: {{loan_purpose}}
Requested Amount: {{requested_amount}}
State: {{state}}
Credit Range: {{credit_score_range}}
Urgency: {{urgency}}
Recommended Review Path: {{recommended_review_path}}

Notes:
{{notes}}

Compliance boundary: no approval, denial, underwriting, pricing, funding, or lender submission has been made.
Next step: manual review.
```

## Suggested Channels

- Internal broker Slack channel
- CRM task comment
- Airtable/Notion status update
- Email relay for assigned reviewer
