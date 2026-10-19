# GPT Builder Action Setup

File path: `docs/gpt-builder-action-setup.md`

## Correct setup

Use one GPT Builder Action block for the BrokerFlow API domain.

Do not create separate action blocks for each endpoint when they share the same host.

Correct:

```text
One action block
Host: https://brokerflow-ai.vercel.app
Actions:
- createPersistedLenderMatchReview
- requestLenderMatchReview
- routeLenderFitScenario
```

Incorrect:

```text
Action block 1: https://brokerflow-ai.vercel.app → requestLenderMatchReview
Action block 2: https://brokerflow-ai.vercel.app → routeLenderFitScenario
```

GPT Builder may reject duplicate domains across separate action blocks.

## Schema to paste

Use:

```text
schemas/no-auth-brokerflow-actions.combined.schema.yaml
```

## Server block

Use production only:

```yaml
servers:
  - url: https://brokerflow-ai.vercel.app
    description: Production Vercel deployment
```

Do not include:

```yaml
- url: http://localhost:3000
  description: Local development
```

## Authentication

Set the Action authentication to **API Key → Bearer** and store the separately provisioned `BROKERFLOW_INGEST_API_KEY` as the credential. Keep it in GPT Builder's credential field; do not paste it into the schema, instructions, examples, GitHub, or a prompt. BrokerFlow validates this credential on the protected ingestion operation; the legacy no-auth endpoints remain separately nonpersistent. Configure the key through the owner-controlled Vercel and GPT Builder setup.

```text
Authentication type: API Key
Auth type: Bearer
```

Use `createPersistedLenderMatchReview` for durable trusted intake. Its required `Idempotency-Key` must be a unique opaque value for each new request and reused unchanged with the same payload on retries. The `requestLenderMatchReview` endpoint remains a legacy nonpersistent acknowledgment; it does not create a Review Queue record.

The durable integration remains bound to `BROKERFLOW_INGEST_ORGANIZATION_ID` on the server. The Action cannot select or override the target organization. Review access still depends on that organization's owner-provisioned permissions and the configured Preview/Production environment.

## Privacy policy

Use the live site URL until a dedicated privacy page exists:

```text
https://brokerflow-ai.vercel.app/
```

## Builder test

Use the GPT Builder `Test` button beside:

```text
createPersistedLenderMatchReview
```

GPT Builder may auto-generate the payload and ask for permission to call `brokerflow-ai.vercel.app`. Click Allow.

## Confirmed behavior

A successful persisted intake should produce:

```text
Trusted GPT Action with bearer credential and Idempotency-Key
→ /api/ingest/lender-match-review
→ persisted review + trusted_integration audit event
→ authorized organization's Review Queue
```

The response returns the stable review identifier, `queued_for_human_review`, `next_step: manual_review`, and `duplicate` status. It never makes an automated borrower decision.
