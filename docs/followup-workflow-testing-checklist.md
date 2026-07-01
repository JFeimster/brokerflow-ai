# Follow-up + Workflow Testing Checklist

## Endpoints

```text
POST /api/no-auth/create-broker-follow-up-plan
POST /api/no-auth/generate-borrower-follow-up-message
POST /api/no-auth/create-stalled-deal-recovery-plan
POST /api/no-auth/create-declined-lead-reactivation-plan
POST /api/no-auth/generate-referral-partner-follow-up
```

## Router

```text
api/no-auth/followup-workflow-actions.js
```

## Test payload

Change `action_type` for each endpoint.

```json
{
  "source": "custom_gpt",
  "action_type": "generate_borrower_follow_up_message",
  "contact_name": "Alex",
  "business_name": "Example Services LLC",
  "primary_route": "business_working_capital",
  "fit_tier": "qualified_review",
  "requested_amount": 75000,
  "state": "VA",
  "urgency": "high",
  "missing_information": ["business_revenue"],
  "missing_documents": ["business_bank_statements_3_months"]
}
```
