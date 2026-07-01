# Lender Matching + Routing Testing Checklist

File path: `docs/lender-matching-routing-testing-checklist.md`

## Base URL

```text
https://brokerflow-ai.vercel.app
```

## Endpoint family

```text
POST /api/no-auth/lender-fit-routing
POST /api/no-auth/lender-match-review
POST /api/no-auth/rank-lender-options
POST /api/no-auth/generate-lender-shortlist
POST /api/no-auth/flag-manual-review-required
```

## GPT Builder schema

```text
schemas/no-auth-lender-matching-routing.schema.yaml
```

## Test: rank lender options

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

Expected:

- `success: true`
- `ranking_id`
- `ranked_lenders`
- `top_lender`
- `next_step`

## Test: generate lender shortlist

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

Expected:

- `success: true`
- `shortlist_id`
- `shortlist`
- `shortlist_count`
- `fallback_used`
- `next_step`

## Test: flag manual review required

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

Expected:

- `success: true`
- `manual_review_required: true`
- `review_priority`
- `manual_review_flags`
- `review_queue`
- `next_step: send_to_manual_review`

## Failure cases

- `GET` returns `405`.
- Missing `source` returns `400`.
- Wrong `action_type` returns `400`.
- Negative `requested_amount` returns `400`.
- Non-integer `time_in_business_months` returns `400`.

## Guardrail check

No response should claim that the borrower is approved, denied, underwritten, priced, funded, or submitted to a lender.
