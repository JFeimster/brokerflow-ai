# Template: Lender Match Review Task

File path: `templates/lender-match-review-human-review-task.md`

## Task Title

```text
Review lender-match request: {{review_request_id}}
```

## Task Body

```text
A lender-match review request has been queued for broker review.

Review Request ID: {{review_request_id}}
Requester: {{requester_name}}
Borrower Type: {{borrower_type}}
Business/Borrower: {{business_name}}{{borrower_name}}
Loan Purpose: {{loan_purpose}}
Requested Amount: {{requested_amount}}
State: {{state}}
Credit Range: {{credit_score_range}}
Monthly Revenue: {{monthly_revenue}}
Annual Revenue: {{annual_revenue}}
Time in Business: {{time_in_business_months}}
Property Type: {{property_type}}
Occupancy Type: {{occupancy_type}}
Collateral Available: {{collateral_available}}
Urgency: {{urgency}}
Recommended Review Path: {{recommended_review_path}}
Consent to Contact: {{consent_to_contact}}

Notes:
{{notes}}

Reviewer checklist:
- Confirm facts and missing data.
- Select potential lender/product paths.
- Decide whether additional docs are needed.
- Handle borrower-facing communication according to business rules.
- Keep final regulated steps outside the GPT action layer.
```

## Status Options

- `queued`
- `in_review`
- `needs_more_info`
- `ready_for_next_step`
- `closed`
