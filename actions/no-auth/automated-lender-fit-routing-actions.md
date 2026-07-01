# No-Auth Action: Automated Lender Fit Routing

File path: `actions/no-auth/automated-lender-fit-routing-actions.md`

## Purpose

Score, rank, and route a borrower or business funding scenario to the best internal lender-fit workflow path.

This action is automation-first. It should reduce broker busywork by producing a route, fit score, fit tier, missing-info list, and downstream workflow actions.

## Endpoint

`POST /api/no-auth/lender-fit-routing`

## Operation ID

`routeLenderFitScenario`

## Authentication

GPT Action authentication: **None**.

Optional abuse-reduction check: set `LENDER_FIT_ROUTING_SHARED_SECRET` in Vercel and include the matching `shared_secret` field in the request body.

## Required Fields

- `source`
- `action_type`: must be `lender_fit_routing`
- `borrower_type`
- `loan_purpose`
- `requested_amount`
- `state`

## Optional Fields

- `scenario_id`
- `requester_name`
- `credit_score_range`
- `monthly_revenue`
- `annual_revenue`
- `time_in_business_months`
- `property_type`
- `occupancy_type`
- `collateral_available`
- `urgency`
- `consent_to_contact`
- `notes`
- `shared_secret`

## Returned Routing Data

- `routing_id`
- `primary_route`
- `secondary_routes`
- `fit_score`
- `fit_tier`
- `automation_actions`
- `missing_information`
- `next_step`

## Allowed Automation

- Score/rank scenario fit
- Create route-specific queue items
- Trigger broker alerts
- Create document checklist payloads
- Mark high-priority routing scenarios
- Route insufficient-information scenarios to missing-info follow-up
- Trigger n8n, Zapier, Make, Pipedream, or custom webhook workflows

## Boundary

This action must not approve, deny, underwrite, formally price, fund, or submit a borrower to a lender. Human review blocks those final regulated steps, not routine scoring, routing, intake, alerting, queueing, or workflow triggers.

## Sample Request

```json
{
  "source": "custom_gpt",
  "action_type": "lender_fit_routing",
  "scenario_id": "lead_123",
  "borrower_type": "business",
  "loan_purpose": "business_working_capital",
  "requested_amount": 75000,
  "state": "VA",
  "credit_score_range": "660_699",
  "monthly_revenue": 35000,
  "time_in_business_months": 30,
  "collateral_available": false,
  "urgency": "high"
}
```

## Sample Success Response

```json
{
  "success": true,
  "routing_id": "lfr_20260701_ab12cd",
  "primary_route": "business_working_capital",
  "secondary_routes": ["sba_or_bank_review"],
  "fit_score": 100,
  "fit_tier": "strong_fit",
  "automation_actions": [
    "create_business_working_capital_queue_item",
    "send_broker_alert",
    "create_document_checklist",
    "mark_high_priority"
  ],
  "missing_information": [],
  "next_step": "trigger_workflow"
}
```
