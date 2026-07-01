# Lead Intake + Qualification Actions

File path: `actions/no-auth/lead-intake-qualification-actions.md`

## Purpose

This action family turns BrokerFlow from a single routing test into a practical intake and deal desk assistant. These actions help a broker or operator normalize lead data, identify missing information, classify the funding scenario, score readiness, and qualify the lead before deeper lender routing.

These actions do **not** approve, deny, underwrite, price, fund, or submit a borrower.

## Authentication

```text
No auth by default.
```

Optional shared secret support:

```text
LEAD_INTAKE_SHARED_SECRET
```

Optional automation forwarding destination:

```text
LEAD_INTAKE_QUALIFICATION_WEBHOOK_URL
```

## Base URL

```text
https://brokerflow-ai.vercel.app
```

## Actions

| # | operationId | Endpoint | Purpose |
| --- | --- | --- | --- |
| 1 | `qualifyFundingLead` | `POST /api/no-auth/qualify-funding-lead` | Qualifies a lead and returns score, tier, route, missing info, and next step. |
| 2 | `scoreBorrowerReadiness` | `POST /api/no-auth/score-borrower-readiness` | Scores borrower readiness across identity, funding request, revenue, credit/risk, and routing completeness. |
| 3 | `detectMissingFundingInfo` | `POST /api/no-auth/detect-missing-funding-info` | Detects missing critical and optional funding fields and generates follow-up questions. |
| 4 | `classifyFundingScenario` | `POST /api/no-auth/classify-funding-scenario` | Classifies the scenario into route family, secondary routes, and risk flags. |
| 5 | `normalizeBrokerLead` | `POST /api/no-auth/normalize-broker-lead` | Converts messy broker intake data into BrokerFlow canonical lead format. |

## GPT Builder schema

Use:

```text
schemas/no-auth-lead-intake-qualification.schema.yaml
```

## Canonical request fields

```json
{
  "source": "custom_gpt",
  "action_type": "qualify_funding_lead",
  "borrower_type": "business",
  "loan_purpose": "business_working_capital",
  "requested_amount": 75000,
  "state": "VA",
  "monthly_revenue": 35000,
  "time_in_business_months": 30,
  "credit_score_range": "660_699",
  "urgency": "high",
  "collateral_available": false,
  "consent_to_contact": true,
  "notes": "Borrower needs working capital for payroll and inventory."
}
```

## Action-specific `action_type` values

```text
qualify_funding_lead
score_borrower_readiness
detect_missing_funding_info
classify_funding_scenario
normalize_broker_lead
```

## Typical GPT flow

```text
1. normalizeBrokerLead
2. detectMissingFundingInfo
3. classifyFundingScenario
4. scoreBorrowerReadiness
5. qualifyFundingLead
6. routeLenderFitScenario
```

## Recommended behavior inside the GPT

- Ask only for missing fields that materially affect routing.
- Never state that the borrower is approved, declined, pre-approved, guaranteed, funded, or submitted.
- Use phrases such as readiness, fit, route, review path, missing information, and next step.
- Send strong or complete leads into lender-fit routing.
- Send incomplete leads into missing-information collection.
