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

## Schema

```text
schemas/no-auth-followup-workflow.schema.yaml
```

## Optional env vars

```text
FOLLOWUP_WORKFLOW_SHARED_SECRET
FOLLOWUP_WORKFLOW_WEBHOOK_URL
```

## Guardrail

Draft workflow support only. No funding decision is made.
