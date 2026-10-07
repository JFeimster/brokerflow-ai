# Internal Partner Action Packs Test Plan

## Automated commands

```powershell
node --test
python scripts/validate-partner-outreach-conversion.py
python scripts/validate-partner-onboarding-enablement.py
python scripts/validate-partner-referral-operations.py
Get-ChildItem api/no-auth/*.js | ForEach-Object { node --check $_.FullName }
git diff --check
```

The handler suite covers all 12 partner Actions: POST success, unique tracking IDs, non-POST 405, required fields, enums/types/lengths, action shared-secret validation, webhook forwarding with `x-brokerflow-secret`, inbound-secret exclusion, and generic downstream-failure responses. Action-specific tests cover outreach behavior, COI scoring, referral readiness and consent routing, status disclosure filtering, and attribution review routing.

## Schema and registry checks

- Validate OpenAPI 3.1.x and duplicate YAML keys for canonical Batch 2–4 contracts.
- Validate request/response examples against schemas and actual handler responses where a validator provides that check.
- Validate partner schema registry IDs and canonical schema file references.
- Verify the new Batch 4 `operationId` and POST path pairs are unique. Existing unrelated duplicate legacy operation IDs/path samples and two malformed legacy YAML documents are reported as existing repo exceptions rather than Batch 4 failures.

## Integration checks

- Exercise referral contact permission true/false and warm-introduction paths.
- Exercise every partner deal stage and keep free-text status/notes out of generated status drafts.
- Exercise disclosure levels and filter restricted detail, including credit, financial, bank, tax, debt, lender, document, and pricing information.
- Exercise each attribution dispute/duplicate trigger and confirm external payout states remain descriptive only.
- Verify webhook behavior with mocked success, timeout, and non-2xx responses; no live borrower or partner data should be used in smoke tests.

## Current known limits

There is no durable idempotency key/store or local persistence. Webhook retries can duplicate CRM records, tasks, status drafts, or attribution events. Deployment readiness also requires configured destinations, protected secrets, auth-boundary decisions, and live smoke tests documented in `partner-action-deployment-readiness.md`.
