# No-Auth Action: Lender Match Review

File path: `actions/no-auth/lender-match-review-actions.md`

## Purpose

Queue a structured borrower or business funding scenario for controlled lender-match review when manual review is required.

This action is not a decision engine. It creates a review request, forwards it to the configured automation workflow when available, and returns a tracking ID.

## Endpoint

`POST /api/no-auth/lender-match-review`

## Operation ID

`requestLenderMatchReview`

## Authentication

GPT Action authentication: **None**.

Optional abuse-reduction check: set `LENDER_MATCH_REVIEW_SHARED_SECRET` in Vercel and include the matching `shared_secret` field in the request body.

## Required Fields

- `source`
- `action_type`: must be `lender_match_review`
- `requester_name`
- `borrower_type`
- `loan_purpose`
- `requested_amount`
- `state`
- `human_review_required`: must be `true`

## Optional Fields

- `borrower_name`
- `business_name`
- `email`
- `phone`
- `credit_score_range`
- `monthly_revenue`
- `annual_revenue`
- `time_in_business_months`
- `employment_type`
- `property_type`
- `occupancy_type`
- `collateral_available`
- `urgency`
- `recommended_review_path`
- `consent_to_contact`
- `notes`
- `shared_secret`

## Allowed Automation

- Create an internal review queue item
- Trigger n8n, Zapier, Make, Pipedream, or custom webhook
- Send internal alerts
- Generate checklist/task payloads
- Log the scenario for broker review

## Boundary

Human review should only block final regulated steps such as approval, denial, underwriting, formal pricing, funding, or lender submission. This action is the manual queue path for cases where the workflow requires controlled review before moving forward.

## Sample Request

```json
{
  "source": "custom_gpt",
  "action_type": "lender_match_review",
  "requester_name": "Internal Broker",
  "borrower_type": "business",
  "business_name": "Example Logistics LLC",
  "email": "owner@example.com",
  "loan_purpose": "business_working_capital",
  "requested_amount": 75000,
  "state": "VA",
  "credit_score_range": "660_699",
  "monthly_revenue": 35000,
  "time_in_business_months": 30,
  "urgency": "high",
  "recommended_review_path": "business_funding_review",
  "human_review_required": true,
  "notes": "Needs review before lender submission."
}
```

## Sample Success Response

```json
{
  "success": true,
  "review_request_id": "lmr_20260701_ab12cd",
  "status": "queued_for_human_review",
  "message": "Lender match review request created. A human reviewer must evaluate the scenario before any borrower-facing recommendation or lender submission.",
  "next_step": "manual_review"
}
```
