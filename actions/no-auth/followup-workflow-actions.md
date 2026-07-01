# Follow-up + Workflow Actions

File path: `actions/no-auth/followup-workflow-actions.md`

## Purpose

This batch creates draft plans and draft message assets for broker workflow operations.

## Actions

| # | operationId | Endpoint |
| --- | --- | --- |
| 16 | `createBrokerFollowUpPlan` | `POST /api/no-auth/create-broker-follow-up-plan` |
| 17 | `generateBorrowerFollowUpMessage` | `POST /api/no-auth/generate-borrower-follow-up-message` |
| 18 | `createStalledDealRecoveryPlan` | `POST /api/no-auth/create-stalled-deal-recovery-plan` |
| 19 | `createDeclinedLeadReactivationPlan` | `POST /api/no-auth/create-declined-lead-reactivation-plan` |
| 20 | `generateReferralPartnerFollowUp` | `POST /api/no-auth/generate-referral-partner-follow-up` |

## Router

All public paths route through:

```text
api/no-auth/followup-workflow-actions.js
```

## Schema

```text
schemas/no-auth-followup-workflow.schema.yaml
```
