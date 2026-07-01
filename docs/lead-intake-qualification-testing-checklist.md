# Lead Intake + Qualification Testing Checklist

File path: `docs/lead-intake-qualification-testing-checklist.md`

## Endpoint family

Base URL:

```text
https://brokerflow-ai.vercel.app
```

Endpoints:

```text
POST /api/no-auth/normalize-broker-lead
POST /api/no-auth/detect-missing-funding-info
POST /api/no-auth/classify-funding-scenario
POST /api/no-auth/score-borrower-readiness
POST /api/no-auth/qualify-funding-lead
```

## GPT Builder schema

```text
schemas/no-auth-lead-intake-qualification.schema.yaml
```

## Test payload: strong business working capital lead

Use the matching `action_type` for the endpoint being tested.

```json
{
  "source": "custom_gpt",
  "action_type": "qualify_funding_lead",
  "borrower_type": "business",
  "loan_purpose": "business_working_capital",
  "requested_amount": 75000,
  "state": "VA",
  "business_name": "Example Services LLC",
  "contact_name": "Example Owner",
  "email": "OWNER@EXAMPLE.COM",
  "phone": "(555) 555-1212",
  "monthly_revenue": 35000,
  "time_in_business_months": 30,
  "credit_score_range": "660_699",
  "urgency": "high",
  "collateral_available": false,
  "consent_to_contact": true,
  "notes": "Needs working capital for payroll and inventory."
}
```

Expected results:

- `normalizeBrokerLead` returns normalized state, email, phone, and canonical lead fields.
- `detectMissingFundingInfo` returns limited or no critical missing fields.
- `classifyFundingScenario` returns `business_working_capital` as the primary route.
- `scoreBorrowerReadiness` returns medium or high readiness depending on fields.
- `qualifyFundingLead` returns a qualification tier and next step.

## Test payload: incomplete lead

```json
{
  "source": "custom_gpt",
  "action_type": "detect_missing_funding_info",
  "borrower_type": "unknown",
  "loan_purpose": "other",
  "notes": "Lead asked about funding but gave almost no details."
}
```

Expected results:

- Missing fields should include `borrower_type`, `loan_purpose`, `requested_amount`, and `state`.
- Next step should be missing-information collection.

## Test payload: real estate / bridge scenario

```json
{
  "source": "custom_gpt",
  "action_type": "classify_funding_scenario",
  "borrower_type": "real_estate_investor",
  "loan_purpose": "bridge_loan",
  "requested_amount": 250000,
  "state": "FL",
  "property_type": "single_family",
  "occupancy_type": "investment_property",
  "credit_score_range": "620_659",
  "urgency": "normal",
  "consent_to_contact": true
}
```

Expected results:

- Primary route should be `bridge_or_private_lending`.
- Secondary routes should include `commercial_real_estate`.

## Failure cases to confirm

- `GET` should return `405`.
- Missing `source` should return `400`.
- Wrong `action_type` should return `400`.
- Negative `requested_amount` should return `400`.
- Invalid enum values should return `400`.

## Compliance language to verify

Responses and downstream payloads must not claim:

```text
approved
declined
pre-approved
guaranteed
funded
submitted to lender
underwritten
priced
```

Permitted language:

```text
qualified
readiness
route
fit
review path
missing information
next step
manual review
```
