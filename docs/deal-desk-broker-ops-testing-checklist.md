# Deal Desk + Broker Ops Testing Checklist

## Endpoints

```text
POST /api/no-auth/create-internal-summary
POST /api/no-auth/generate-broker-call-prep
POST /api/no-auth/create-internal-broker-task
POST /api/no-auth/generate-lender-submission-notes
POST /api/no-auth/create-funding-scenario-memo
```

## Schema

```text
schemas/no-auth-deal-desk-broker-ops.schema.yaml
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
  "monthly_revenue": 35000,
  "time_in_business_months": 30,
  "credit_score_range": "660_699",
  "fit_tier": "qualified_review",
  "missing_documents": ["business_bank_statements_3_months"]
}
```

## Expected behavior

- Summary endpoint returns summary points and next step.
- Call prep endpoint returns questions and talking points.
- Task endpoint returns task priority and task items.
- Notes endpoint returns internal notes.
- Memo endpoint returns memo sections.
