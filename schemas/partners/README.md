# Partner Action OpenAPI Schemas

This folder contains Action-ready OpenAPI 3.1.0 schemas and implementation docs for internal partner, affiliate, channel partner, referral-partner, and partner-ops-intelligence workflows in BrokerFlow AI.

These schemas are designed for Custom GPT Actions and automation backends such as n8n, Zapier, Make, Airtable, HubSpot, GoHighLevel, or a controlled BrokerFlow API wrapper.

## Core Rules

- No Action may approve, decline, qualify, guarantee, underwrite, fund, pay, or activate automatically.
- Funding-adjacent partner work must route to human review.
- No-auth schemas are for low-risk intake, triggers, logging, and workflow starts.
- API-key schemas are for controlled backend operations such as CRM sync, attribution, onboarding, activity summaries, payout review, assets, portal provisioning, program review, fit scoring, training progress, outreach, lifecycle routing, playbooks, health monitoring, resource recommendations, and quarterly reviews.
- OAuth schemas are for per-user integrations such as Calendar and Drive.
- Every write Action uses `x-openai-isConsequential: true`.
- No raw borrower documents, bank statements, tax returns, or private lender credentials belong in Action payloads.
- Use `event_id` for dedupe and `shared_secret` for no-auth webhook hardening.

## Schema Files

| File | Auth | Purpose |
| --- | --- | --- |
| `openapi-no-auth-partner-signup.yaml` | None | Capture affiliate/partner signups from GPT, Tally, or public forms. |
| `openapi-no-auth-referral-lead-intake.yaml` | None | Let partners submit referred borrower leads with attribution. |
| `openapi-no-auth-channel-partner-prospect.yaml` | None | Log niche COI prospects such as CPAs, attorneys, consultants, and business brokers. |
| `openapi-no-auth-warm-intro-request.yaml` | None | Queue warm intro requests for human review. |
| `openapi-no-auth-partner-followup-trigger.yaml` | None | Trigger approved partner nurture/onboarding follow-up sequences. |
| `openapi-api-key-partner-crm-sync.yaml` | API Key Bearer | Create/update partner CRM records, stages, and notes through a backend. |
| `openapi-api-key-partner-attribution.yaml` | API Key Bearer | Log and retrieve partner attribution events. |
| `openapi-api-key-partner-onboarding.yaml` | API Key Bearer | Create and update partner onboarding checklists. |
| `openapi-api-key-partner-activity-summary.yaml` | API Key Bearer | Read and generate internal partner activity summaries. |
| `openapi-api-key-partner-payout-readiness.yaml` | API Key Bearer | Queue payout-readiness reviews for human approval; no money movement. |
| `openapi-api-key-co-marketing-assets.yaml` | API Key Bearer | Request, list, and review partner co-marketing assets. |
| `openapi-api-key-partner-portal-provisioning.yaml` | API Key Bearer | Provision partner portals, tracking links, and portal status. |
| `openapi-oauth-partner-calendar-scheduling.yaml` | OAuth | Schedule partner discovery and onboarding calls. |
| `openapi-oauth-partner-drive-folder.yaml` | OAuth | Create partner resource folders and add approved asset references. |
| `openapi-api-key-partner-program-review.yaml` | API Key Bearer | Queue partner program readiness reviews and internal notes. |
| `openapi-api-key-partner-fit-scoring.yaml` | API Key Bearer | Score partner fit for internal routing and segment assignment. |
| `openapi-api-key-partner-training-progress.yaml` | API Key Bearer | Track partner training progress and assigned modules. |
| `openapi-api-key-partner-outreach-campaigns.yaml` | API Key Bearer | Create partner outreach campaign plans and queue internal outreach tasks. |
| `openapi-api-key-partner-lifecycle-automation.yaml` | API Key Bearer | Track partner lifecycle events and recommend internal next actions. |
| `openapi-api-key-partner-segment-playbooks.yaml` | API Key Bearer | List and assign partner segment playbooks. |
| `openapi-api-key-partner-health-monitor.yaml` | API Key Bearer | Run internal partner health checks and route health flags. |
| `openapi-api-key-partner-resource-recommendations.yaml` | API Key Bearer | Recommend approved resources, assets, and training modules by partner stage. |
| `openapi-api-key-partner-quarterly-review.yaml` | API Key Bearer | Prepare internal partner quarterly reviews and follow-up tasks. |

## Implementation Docs

| File | Purpose |
| --- | --- |
| `gpt-builder-import-guide.md` | Step-by-step GPT Builder import, auth, and test guidance. |
| `action-testing-checklist.md` | Pre-production validation checklist for no-auth, API-key, and OAuth Actions. |
| `backend-implementation-notes.md` | Backend validation, idempotency, rate-limit, logging, and review-queue notes. |
| `action-rollout-plan.md` | Phased rollout plan from no-auth intake to OAuth integrations. |
| `partner-openapi-registry.json` | Machine-readable index of schemas and docs. |

## Base URL Placeholders

Replace these before using in GPT Builder:

```txt
https://YOUR-AUTOMATION-DOMAIN.com
https://brokerflow-ai.vercel.app/api
https://brokerflow-ai.vercel.app/api/calendar
https://brokerflow-ai.vercel.app/api/drive
```

OAuth files use placeholder provider URLs. Replace those with the real Google, Microsoft, HubSpot, or wrapper OAuth authorization/token URLs before production use.

## Recommended Build Order

1. Partner signup
2. Referral lead intake
3. Channel partner prospect capture
4. Warm intro request
5. Partner CRM sync
6. Partner attribution
7. Partner follow-up trigger
8. Partner onboarding
9. Partner portal provisioning
10. Co-marketing asset requests
11. Partner activity summaries
12. Partner payout readiness review
13. Partner calendar scheduling
14. Partner resource folder setup
15. Partner program review
16. Partner fit scoring
17. Partner training progress
18. Partner outreach campaigns
19. Partner lifecycle automation
20. Partner segment playbooks
21. Partner health monitor
22. Partner resource recommendations
23. Partner quarterly review
24. GPT Builder import guide
25. Action testing checklist
26. Backend implementation notes
27. Action rollout plan

## Workflow Map

```txt
Partner signup
  -> partner CRM record
  -> fit/program review task
  -> onboarding checklist
  -> training assignment
  -> portal/tracking setup
  -> outreach campaign/playbook
  -> referral lead intake
  -> attribution event
  -> broker review task
  -> partner update/follow-up
  -> lifecycle next action
  -> health monitor
  -> resource recommendations
  -> activity summary
  -> quarterly review
  -> payout readiness review
  -> GPT Builder testing
  -> backend implementation
  -> phased rollout
```
