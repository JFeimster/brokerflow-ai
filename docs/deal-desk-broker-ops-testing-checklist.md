# Deal Desk + Broker Ops Testing Checklist

## Endpoints

```text
POST /api/no-auth/create-internal-summary
POST /api/no-auth/generate-broker-call-prep
POST /api/no-auth/create-internal-broker-task
POST /api/no-auth/generate-lender-submission-notes
POST /api/no-auth/create-funding-scenario-memo
```

## Router

```text
api/no-auth/ops-router.js
```

## Test payload

Change `action_type` for each endpoint.

```json
{
  "source": "custom_gpt",
  "action_type": "create_funding_scenario_memo",
  "business_name": "Example Services LLC",
  "borrower_type": "business",
  "primary_route": "business_working_capital",
  "requested_amount": 75000,
  "state": "VA",
  "fit_tier": "qualified_review",
  "missing_documents": ["business_bank_statements_3_months"]
}
```
