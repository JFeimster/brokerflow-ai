# Testing Checklist: Automated Lender Fit Routing

File path: `docs/automated-lender-fit-routing-testing-checklist.md`

## OpenAPI

- [ ] Paste `schemas/no-auth-automated-lender-fit-routing.schema.yaml` into GPT Builder.
- [ ] Confirm authentication is set to None.
- [ ] Confirm operation ID is `routeLenderFitScenario`.
- [ ] Confirm server URL is `https://brokerflow-ai.vercel.app`.

## Endpoint

- [ ] `POST /api/no-auth/lender-fit-routing` returns `200` for valid payloads.
- [ ] `GET /api/no-auth/lender-fit-routing` returns `405`.
- [ ] Missing required fields return `400`.
- [ ] Invalid enum values return `400`.
- [ ] Invalid amount returns `400`.

## Routing Logic

- [ ] Business working capital routes to `business_working_capital`.
- [ ] Equipment financing routes to `equipment_financing`.
- [ ] Commercial real estate routes to `commercial_real_estate`.
- [ ] Bridge/construction routes to `bridge_or_private_lending`.
- [ ] Insufficient data returns missing-info actions.
- [ ] High urgency adds `mark_high_priority`.

## Automation Forwarding

- [ ] Blank `LENDER_FIT_ROUTING_WEBHOOK_URL` logs payload only.
- [ ] Configured webhook receives the forwarded payload.
- [ ] `WEBHOOK_SHARED_SECRET` is forwarded as `x-brokerflow-secret` when configured.

## Boundary

- [ ] Response returns routing/scoring only.
- [ ] Response does not approve, deny, underwrite, price, fund, or submit.
