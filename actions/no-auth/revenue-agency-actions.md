# Revenue + Agency Actions

File path: `actions/no-auth/revenue-agency-actions.md`

## Purpose

This batch turns BrokerFlow into a packaging and implementation assistant for broker automation offers.

## Actions

| # | operationId | Endpoint |
| --- | --- | --- |
| 26 | `packageAutomationOffer` | `POST /api/no-auth/package-automation-offer` |
| 27 | `generateBrokerAutomationAudit` | `POST /api/no-auth/generate-automation-audit` |
| 28 | `createAgencyClientRoadmap` | `POST /api/no-auth/create-agency-client-roadmap` |
| 29 | `recommendPaidServicePath` | `POST /api/no-auth/recommend-paid-service-path` |
| 30 | `createImplementationScope` | `POST /api/no-auth/create-project-scope` |

## Router

These routes use the existing consolidated router:

```text
api/no-auth/ops-router.js
```

## Schema

```text
schemas/no-auth-revenue-agency.schema.yaml
```
