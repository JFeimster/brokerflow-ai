# Lender Matching + Routing Actions

File path: `actions/no-auth/lender-matching-routing-actions.md`

## Purpose

This action family expands BrokerFlow beyond basic lead qualification into lender path selection, option ranking, shortlisting, and manual-review control.

These actions do **not** approve, deny, underwrite, price, fund, or submit a borrower.

## Base URL

```text
https://brokerflow-ai.vercel.app
```

## Optional environment variables

```text
LENDER_MATCHING_ROUTING_SHARED_SECRET
LENDER_MATCHING_ROUTING_WEBHOOK_URL
```

## Actions

| # | operationId | Endpoint | Status |
| --- | --- | --- | --- |
| 6 | `routeLenderFitScenario` | `POST /api/no-auth/lender-fit-routing` | Existing |
| 7 | `requestLenderMatchReview` | `POST /api/no-auth/lender-match-review` | Existing |
| 8 | `rankLenderOptions` | `POST /api/no-auth/rank-lender-options` | Added |
| 9 | `generateLenderShortlist` | `POST /api/no-auth/generate-lender-shortlist` | Added |
| 10 | `flagManualReviewRequired` | `POST /api/no-auth/flag-manual-review-required` | Added |

## GPT Builder schema

```text
schemas/no-auth-lender-matching-routing.schema.yaml
```

## Typical GPT flow

```text
1. classifyFundingScenario
2. scoreBorrowerReadiness
3. qualifyFundingLead
4. routeLenderFitScenario
5. flagManualReviewRequired
6. rankLenderOptions
7. generateLenderShortlist
8. requestLenderMatchReview if human review is needed
```

## Example request for rankLenderOptions

```json
{
  "source": "custom_gpt",
  "action_type": "rank_lender_options",
  "borrower_type": "business",
  "loan_purpose": "business_working_capital",
  "requested_amount": 75000,
  "state": "VA",
  "monthly_revenue": 35000,
  "time_in_business_months": 30,
  "credit_score_range": "660_699",
  "primary_route": "business_working_capital",
  "secondary_routes": ["sba_or_bank_review"],
  "fit_tier": "strong_fit",
  "fit_score": 82,
  "urgency": "high"
}
```

## Example request for generateLenderShortlist

```json
{
  "source": "custom_gpt",
  "action_type": "generate_lender_shortlist",
  "borrower_type": "business",
  "loan_purpose": "equipment_financing",
  "requested_amount": 90000,
  "state": "NC",
  "monthly_revenue": 42000,
  "time_in_business_months": 40,
  "credit_score_range": "700_739",
  "primary_route": "equipment_financing",
  "secondary_routes": ["business_working_capital"],
  "max_results": 3
}
```

## Example request for flagManualReviewRequired

```json
{
  "source": "custom_gpt",
  "action_type": "flag_manual_review_required",
  "borrower_type": "unknown",
  "loan_purpose": "other",
  "requested_amount": 250000,
  "state": "FL",
  "fit_tier": "insufficient_information",
  "missing_information": ["borrower_type", "loan_purpose", "business_revenue"],
  "risk_flags": ["unknown_borrower_type", "high_amount_relative_to_monthly_revenue"],
  "primary_route": "manual_exception"
}
```

## Output utility

- `rankLenderOptions` returns a ranked option list with score parts and match notes.
- `generateLenderShortlist` returns a limited shortlist and fallback status.
- `flagManualReviewRequired` returns manual-review flags, queue, priority, and next step.

## Language rules

Use:

```text
match
ranking
shortlist
route
review path
manual review
next step
```

Do not use:

```text
approved
declined
pre-approved
guaranteed
funded
underwritten
priced
submitted to lender
```
