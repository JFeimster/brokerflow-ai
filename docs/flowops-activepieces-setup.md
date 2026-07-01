# FlowOps / Activepieces Setup

File path: `docs/flowops-activepieces-setup.md`

## Current confirmed state

- GitHub PR #4 was merged into `main`.
- BrokerFlow Vercel project has the lender action endpoints deployed.
- GPT Builder uses one combined BrokerFlow action block.
- The combined action block exposes both operations:
  - `requestLenderMatchReview`
  - `routeLenderFitScenario`
- The local development server entry was removed from GPT Builder schema paste.
- Vercel environment variable `LENDER_FIT_ROUTING_WEBHOOK_URL` was added with the Activepieces / FlowOps webhook URL.
- `routeLenderFitScenario` was tested from GPT Builder.
- The call reached BrokerFlow's Vercel endpoint.
- Activepieces / FlowOps received the webhook event.
- The Activepieces run succeeded.

## FlowOps workspace

Workspace name used during setup:

```text
FlowOps
```

## Activepieces flow

Flow name used during setup:

```text
BrokerFlow Lender Fit Router
```

Trigger:

```text
Catch Webhook
```

Webhook URL stored in Vercel:

```text
LENDER_FIT_ROUTING_WEBHOOK_URL
```

## BrokerFlow action sequence

```text
Custom GPT
→ routeLenderFitScenario
→ https://brokerflow-ai.vercel.app/api/no-auth/lender-fit-routing
→ Vercel function scores/routes scenario
→ Vercel forwards routed payload to LENDER_FIT_ROUTING_WEBHOOK_URL
→ Activepieces / FlowOps receives event
```

## Do not confuse these systems

- Custom GPT is the operator-facing front door for this tool.
- Vercel is the API execution layer.
- Activepieces / FlowOps is the automation receiver/router.
- Tally is not required for this GPT action flow unless a separate public form intake is intentionally added later.

## Current next build item

Finish the Activepieces flow by adding one post-webhook action:

1. Create record in `BrokerFlow Routes` table, or
2. Send an internal email/Slack alert, or
3. Forward to another system of record.

The webhook trigger itself has already been proven to work.
