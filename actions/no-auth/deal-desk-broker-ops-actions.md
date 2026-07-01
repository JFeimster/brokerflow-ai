# Deal Desk + Broker Ops Actions

File path: `actions/no-auth/deal-desk-broker-ops-actions.md`

## Purpose

This batch creates internal broker operations assets: deal summaries, call prep, internal tasks, notes, and scenario memos.

## Actions

| # | operationId | Endpoint |
| --- | --- | --- |
| 21 | `createDealDeskSummary` | `POST /api/no-auth/create-internal-summary` |
| 22 | `generateBrokerCallPrep` | `POST /api/no-auth/generate-broker-call-prep` |
| 23 | `createInternalBrokerTask` | `POST /api/no-auth/create-internal-broker-task` |
| 24 | `generateLenderSubmissionNotes` | `POST /api/no-auth/generate-lender-submission-notes` |
| 25 | `createFundingScenarioMemo` | `POST /api/no-auth/create-funding-scenario-memo` |

## Router

```text
api/no-auth/ops-router.js
```

## Schema

```text
schemas/no-auth-deal-desk-broker-ops.schema.yaml
```
