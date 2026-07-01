# Workflow: No-Auth Automated Lender Fit Routing

File path: `workflows/no-auth-automated-lender-fit-routing-workflow.md`

## Trigger

`POST /api/no-auth/lender-fit-routing`

## Intent

Automatically score, rank, and route a funding scenario to the correct internal workflow path.

## Flow

1. GPT collects the scenario details.
2. GPT calls `routeLenderFitScenario`.
3. Vercel validates the request.
4. Vercel scores the scenario and selects a primary route.
5. Vercel returns `fit_score`, `fit_tier`, `primary_route`, `secondary_routes`, `missing_information`, and `automation_actions`.
6. If `LENDER_FIT_ROUTING_WEBHOOK_URL` is configured, Vercel forwards the routing payload to the downstream automation platform.
7. Automation creates the correct queue item, broker alert, checklist, or missing-info follow-up.

## Routes

- `business_working_capital`
- `equipment_financing`
- `commercial_real_estate`
- `residential_mortgage`
- `bridge_or_private_lending`
- `sba_or_bank_review`
- `debt_consolidation`
- `manual_exception`

## Fit Tiers

- `strong_fit`
- `possible_fit`
- `weak_fit`
- `insufficient_information`

## Boundary

This workflow moves scenarios through intake and routing. It does not approve, deny, underwrite, formally price, fund, or submit borrowers.
