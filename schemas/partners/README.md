# Partner Action OpenAPI Schemas

This folder contains Action-ready OpenAPI 3.1.0 schemas for internal partner, affiliate, channel partner, and referral-partner workflows in BrokerFlow AI.

These schemas are designed for Custom GPT Actions and automation backends such as n8n, Zapier, Make, Airtable, HubSpot, GoHighLevel, or a controlled BrokerFlow API wrapper.

## Core Rules

- No Action may approve, decline, qualify, guarantee, underwrite, or fund.
- Funding-adjacent partner work must route to human review.
- No-auth schemas are for low-risk intake, triggers, logging, and workflow starts.
- API-key schemas are for controlled backend operations such as CRM sync, attribution, onboarding, performance, and payout review.
- OAuth schemas are for per-user integrations such as Calendar and Drive.
- Every write Action uses `x-openai-isConsequential: true`.
- No raw borrower documents, bank statements, tax returns, or private lender credentials belong in Action payloads.
- Use `event_id` for dedupe and `shared_secret` for no-auth webhook hardening.

## Files

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
| `openapi-api-key-partner-performance.yaml` | API Key Bearer | Read internal partner performance summaries and leaderboards. |
| `openapi-api-key-partner-payout-readiness.yaml` | API Key Bearer | Queue payout-readiness reviews for human approval. |
| `partner-openapi-registry.json` | n/a | Machine-readable index of the partner schema set. |

## Base URL Placeholders

Replace these before using in GPT Builder:

```txt
https://YOUR-AUTOMATION-DOMAIN.com
https://brokerflow-ai.vercel.app/api
```

## Recommended Build Order

1. Partner signup
2. Referral lead intake
3. Channel partner prospect capture
4. Warm intro request
5. Partner CRM sync
6. Partner attribution
7. Partner follow-up trigger
8. Partner onboarding
9. Partner performance
10. Partner payout readiness

## Workflow Map

```txt
Partner signup
  -> partner CRM record
  -> fit/compliance review task
  -> onboarding checklist
  -> portal/tracking setup
  -> referral lead intake
  -> attribution event
  -> broker review task
  -> partner update/follow-up
  -> performance summary
  -> payout readiness review
```
