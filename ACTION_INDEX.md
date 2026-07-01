# Action Index

## No-Auth GPT Actions

| Action | Operation ID | API Endpoint | Schema | Purpose |
| --- | --- | --- | --- | --- |
| Lender Match Review | `requestLenderMatchReview` | `POST /api/no-auth/lender-match-review` | `schemas/no-auth-lender-match-review.schema.yaml` | Queue a scenario for controlled manual review when required. |
| Automated Lender Fit Routing | `routeLenderFitScenario` | `POST /api/no-auth/lender-fit-routing` | `schemas/no-auth-automated-lender-fit-routing.schema.yaml` | Score/rank/route a funding scenario and trigger downstream workflow actions. |

## Automation Boundary

BrokerFlow AI may recommend, draft, prepare, route, score, queue, alert, log, and trigger workflow actions.

Human review should block only final regulated steps:

- Approval
- Denial
- Underwriting
- Formal pricing
- Funding
- Lender submission

## Files

### Lender Match Review

- `actions/no-auth/lender-match-review-actions.md`
- `schemas/no-auth-lender-match-review.schema.yaml`
- `api/no-auth/lender-match-review.js`
- `knowledge/lender-match-review-guardrails.md`
- `workflows/no-auth-lender-match-review-workflow.md`
- `workflows/n8n/no-auth-lender-match-review.n8n.json`
- `workflows/zapier/no-auth-lender-match-review-zapier.md`
- `workflows/make/no-auth-lender-match-review-make.md`
- `templates/lender-match-review-internal-alert.md`
- `templates/lender-match-review-human-review-task.md`
- `sops/lender-match-review-sop.md`
- `docs/lender-match-review-testing-checklist.md`
- `docs/lender-match-review-vercel-env.md`

### Automated Lender Fit Routing

- `actions/no-auth/automated-lender-fit-routing-actions.md`
- `schemas/no-auth-automated-lender-fit-routing.schema.yaml`
- `api/no-auth/lender-fit-routing.js`
- `knowledge/automated-lender-fit-routing-guardrails.md`
- `workflows/no-auth-automated-lender-fit-routing-workflow.md`
- `docs/automated-lender-fit-routing-testing-checklist.md`
