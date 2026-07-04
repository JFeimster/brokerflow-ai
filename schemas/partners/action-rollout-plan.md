# Partner Action Rollout Plan

This rollout plan turns the partner OpenAPI schema library into a controlled implementation sequence.

## Rollout Principles

- Import and test one schema at a time.
- Start with no-auth intake workflows before API-key writes.
- Keep OAuth integrations last.
- Use staging endpoints before production endpoints.
- Preserve human review on all partner activation, payout, outreach, and funding-adjacent workflows.

## Phase 1 — No-Auth Intake Layer

Goal: prove GPT-to-workflow intake without touching sensitive systems.

Schemas:

```txt
openapi-no-auth-partner-signup.yaml
openapi-no-auth-referral-lead-intake.yaml
openapi-no-auth-channel-partner-prospect.yaml
openapi-no-auth-warm-intro-request.yaml
openapi-no-auth-partner-followup-trigger.yaml
```

Backend targets:

- n8n webhook
- Zapier webhook
- Make webhook
- Airtable form-style endpoint
- lightweight Vercel Function gateway

Acceptance criteria:

- GPT Builder imports each schema successfully.
- Backend validates `shared_secret`.
- Backend dedupes `event_id`.
- Synthetic tests create the correct internal records/tasks.
- No external partner-facing messages are sent automatically.

## Phase 2 — Partner System of Record

Goal: centralize partner CRM, attribution, onboarding, and partner operations.

Schemas:

```txt
openapi-api-key-partner-crm-sync.yaml
openapi-api-key-partner-attribution.yaml
openapi-api-key-partner-onboarding.yaml
openapi-api-key-partner-program-review.yaml
openapi-api-key-partner-fit-scoring.yaml
openapi-api-key-partner-training-progress.yaml
```

Backend targets:

- HubSpot wrapper
- Airtable wrapper
- Notion database wrapper
- custom Vercel API route

Acceptance criteria:

- API-key auth works in staging.
- Partner records can be created and updated.
- Attribution events are logged.
- Onboarding and training status can be read and updated.
- Fit scoring and program review only create internal review states.
- No Action can mark a partner active without review.

## Phase 3 — Partner Enablement Layer

Goal: automate internal partner enablement without automatically publishing or sending external content.

Schemas:

```txt
openapi-api-key-co-marketing-assets.yaml
openapi-api-key-partner-portal-provisioning.yaml
openapi-api-key-partner-outreach-campaigns.yaml
openapi-api-key-partner-lifecycle-automation.yaml
openapi-api-key-partner-segment-playbooks.yaml
openapi-api-key-partner-resource-recommendations.yaml
```

Acceptance criteria:

- Partner asset requests are queued for review.
- Portal/tracking setup returns draft or queued status.
- Outreach tasks are internal only.
- Lifecycle next actions are recommendations, not automatic external actions.
- Resource recommendations use approved assets only.

## Phase 4 — Partner Ops Intelligence

Goal: monitor partner health and prepare internal reviews.

Schemas:

```txt
openapi-api-key-partner-health-monitor.yaml
openapi-api-key-partner-activity-summary.yaml
openapi-api-key-partner-quarterly-review.yaml
openapi-api-key-partner-payout-readiness.yaml
```

Acceptance criteria:

- Partner health returns internal status and recommended action.
- Activity summary excludes borrower-sensitive details.
- Quarterly review generates internal summary sections.
- Payout readiness queues human review only and does not move money.

## Phase 5 — OAuth Integrations

Goal: add calendar and document workspace convenience after core workflows are stable.

Schemas:

```txt
openapi-oauth-partner-calendar-scheduling.yaml
openapi-oauth-partner-drive-folder.yaml
```

Acceptance criteria:

- OAuth provider URLs are configured.
- Scopes are least-privilege.
- Calendar events exclude sensitive borrower data.
- Partner resource folders exclude borrower documents.
- Revoked OAuth access fails safely.

## Production Cutover Checklist

Before turning on production:

- [ ] All staging tests passed.
- [ ] All placeholder URLs replaced.
- [ ] All API keys rotated from staging to production.
- [ ] Human-review queue is live.
- [ ] Logs are reviewed.
- [ ] Rate limits are active.
- [ ] Error responses are GPT-readable.
- [ ] Partner-facing templates are approved.
- [ ] OAuth scopes are reviewed.
- [ ] No endpoint can auto-approve, auto-fund, auto-pay, auto-activate, or auto-submit.

## Suggested PR Sequence

```txt
PR 1: no-auth partner webhook implementation
PR 2: API-key partner CRM / attribution wrapper
PR 3: onboarding / review / training backend workflows
PR 4: enablement / portal / asset request workflows
PR 5: health / resource / quarterly review workflows
PR 6: OAuth calendar and resource folder wrappers
```

## Suggested First Production Workflow

Start with partner signup intake:

```txt
Custom GPT
  -> POST /webhook/partner-signup
  -> validate shared_secret
  -> create partner prospect record
  -> create fit review task
  -> send internal notification
  -> wait for human review
```

This gives immediate operational value with minimal risk.
