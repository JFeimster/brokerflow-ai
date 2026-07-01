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

Set authentication to:

```text
None
```

## Privacy policy

Use the live site URL until a dedicated privacy page exists:

```text
https://brokerflow-ai.vercel.app/
```

## Builder test

Use the GPT Builder `Test` button beside:

```text
routeLenderFitScenario
```

GPT Builder may auto-generate the payload and ask for permission to call `brokerflow-ai.vercel.app`. Click Allow.

## Confirmed behavior

A successful test should produce:

```text
GPT Builder test
→ BrokerFlow Vercel endpoint
→ Activepieces / FlowOps webhook run
```
