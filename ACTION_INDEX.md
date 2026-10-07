# Action Index

## No-Auth GPT Actions

| Action | Operation ID | API Endpoint | Schema | Purpose |
| --- | --- | --- | --- | --- |
| Lender Match Review | `requestLenderMatchReview` | `POST /api/no-auth/lender-match-review` | `schemas/no-auth-lender-match-review.schema.yaml` | Queue a scenario for controlled manual review when required. |
| Automated Lender Fit Routing | `routeLenderFitScenario` | `POST /api/no-auth/lender-fit-routing` | `schemas/no-auth-automated-lender-fit-routing.schema.yaml` | Score/rank/route a funding scenario and trigger downstream workflow actions. |
| Affiliate Partner Signup | `submitAffiliatePartnerSignup` | `POST /api/no-auth/affiliate-partner-signup` | `schemas/no-auth-affiliate-partner-signup.schema.yaml` | Capture partner consent and profile details, then assign an internal onboarding segment and next step. |
| Channel Partner Prospect Capture | `captureChannelPartnerProspect` | `POST /api/no-auth/channel-partner-prospect` | `schemas/no-auth-channel-partner-prospect-capture.schema.yaml` | Capture and prioritize COI prospects for internal business-development follow-up. |
| COI Niche Scoring | `scoreCoiPartnerProspect` | `POST /api/no-auth/coi-niche-scoring` | `schemas/no-auth-coi-niche-scoring.schema.yaml` | Calculate a documented internal partner-development score and outreach priority. |
| Partner Outreach Campaign Builder | `createPartnerOutreachCampaign` | `POST /api/no-auth/partner-outreach-campaign` | `schemas/no-auth-partner-outreach-campaign.schema.yaml` | Draft targeted messaging and classify the campaign for optional workflow routing. |
| Partner Objection Handler / Response Draft | `draftPartnerObjectionResponse` | `POST /api/no-auth/partner-objection-response` | `schemas/no-auth-partner-objection-response.schema.yaml` | Draft trust-preserving responses and next steps without compensation or lending commitments. |
| Partner Meeting / Call Prep Brief | `createPartnerCallPrepBrief` | `POST /api/no-auth/partner-call-prep-brief` | `schemas/no-auth-partner-call-prep-brief.schema.yaml` | Separate supplied partner context from category-specific meeting recommendations. |
| Partner Onboarding Checklist Generator | `generatePartnerOnboardingChecklist` | `POST /api/no-auth/partner-onboarding-checklist` | `schemas/no-auth-partner-onboarding-checklist.schema.yaml` | Generate partner-specific onboarding items and an internal next step; compensation remains descriptive only. |
| Partner Training / Enablement Content Request | `requestPartnerEnablementContent` | `POST /api/no-auth/partner-enablement-content` | `schemas/no-auth-partner-enablement-content.schema.yaml` | Prepare tailored educational partner content without lending or funding promises. |
| Partner Reactivation / Nurture Trigger | `triggerPartnerReactivation` | `POST /api/no-auth/partner-reactivation` | `schemas/no-auth-partner-reactivation.schema.yaml` | Select a deterministic reactivation route, message, channel, and bounded cadence. |

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

### Affiliate Partner Signup

- `actions/no-auth/affiliate-partner-signup-actions.md`
- `schemas/no-auth-affiliate-partner-signup.schema.yaml`
- `api/no-auth/affiliate-partner-signup.js`
- `knowledge/affiliate-partner-signup-guardrails.md`
- `workflows/no-auth-affiliate-partner-signup-workflow.md`
- `docs/affiliate-partner-signup-testing-checklist.md`

### Channel Partner Prospect Capture

- `actions/no-auth/channel-partner-prospect-capture-actions.md`
- `schemas/no-auth-channel-partner-prospect-capture.schema.yaml`
- `api/no-auth/channel-partner-prospect.js`
- `knowledge/channel-partner-prospect-guardrails.md`
- `workflows/no-auth-channel-partner-prospect-capture-workflow.md`
- `docs/channel-partner-prospect-capture-testing-checklist.md`

### COI Niche Scoring

- `actions/no-auth/coi-niche-scoring-actions.md`
- `schemas/no-auth-coi-niche-scoring.schema.yaml`
- `api/no-auth/coi-niche-scoring.js`
- `knowledge/coi-niche-scoring-guardrails.md`
- `workflows/no-auth-coi-niche-scoring-workflow.md`
- `docs/coi-niche-scoring-testing-checklist.md`

### Partner Outreach Campaign Builder

- `actions/no-auth/partner-outreach-campaign-actions.md`
- `schemas/no-auth-partner-outreach-campaign.schema.yaml`
- `api/no-auth/partner-outreach-campaign.js`
- `knowledge/partner-outreach-campaign-guardrails.md`
- `workflows/no-auth-partner-outreach-campaign-workflow.md`
- `templates/partner-outreach-email-templates.md`
- `docs/partner-outreach-campaign-testing-checklist.md`

### Partner Objection Handler / Response Draft

- `actions/no-auth/partner-objection-response-actions.md`
- `schemas/no-auth-partner-objection-response.schema.yaml`
- `api/no-auth/partner-objection-response.js`
- `knowledge/partner-objection-response-guardrails.md`
- `workflows/no-auth-partner-objection-response-workflow.md`
- `templates/partner-objection-response-templates.md`
- `docs/partner-objection-response-testing-checklist.md`

### Partner Meeting / Call Prep Brief

- `actions/no-auth/partner-call-prep-brief-actions.md`
- `schemas/no-auth-partner-call-prep-brief.schema.yaml`
- `api/no-auth/partner-call-prep-brief.js`
- `knowledge/partner-call-prep-brief-guardrails.md`
- `workflows/no-auth-partner-call-prep-brief-workflow.md`
- `templates/partner-call-prep-brief-template.md`
- `docs/partner-call-prep-brief-testing-checklist.md`

### Partner Onboarding Checklist Generator

- `actions/no-auth/partner-onboarding-checklist-actions.md`
- `schemas/no-auth-partner-onboarding-checklist.schema.yaml`
- `api/no-auth/partner-onboarding-checklist.js`
- `knowledge/partner-onboarding-checklist-guardrails.md`
- `workflows/no-auth-partner-onboarding-checklist-workflow.md`
- `docs/partner-onboarding-checklist-testing-checklist.md`

### Partner Training / Enablement Content Request

- `actions/no-auth/partner-enablement-content-actions.md`
- `schemas/no-auth-partner-enablement-content.schema.yaml`
- `api/no-auth/partner-enablement-content.js`
- `knowledge/partner-enablement-content-guardrails.md`
- `workflows/no-auth-partner-enablement-content-workflow.md`
- `templates/partner-enablement-content-templates.md`
- `docs/partner-enablement-content-testing-checklist.md`

### Partner Reactivation / Nurture Trigger

- `actions/no-auth/partner-reactivation-trigger-actions.md`
- `schemas/no-auth-partner-reactivation.schema.yaml`
- `api/no-auth/partner-reactivation.js`
- `knowledge/partner-reactivation-guardrails.md`
- `workflows/no-auth-partner-reactivation-trigger-workflow.md`
- `templates/partner-reactivation-templates.md`
- `docs/partner-reactivation-trigger-testing-checklist.md`

Batch 2 runtime validation/forwarding is shared in `lib/partner-action-utils.js`.
Run `node --test tests/partner-outreach-conversion.test.js` and
`python scripts/validate-partner-outreach-conversion.py` (PyYAML + jsonschema).
The older API-key outreach schema is reference-only; its campaign operation is
`createLegacyPartnerOutreachCampaignPlan`. Import the production schema above
for `createPartnerOutreachCampaign`.

The older API-key onboarding schema and generic partner-followup webhook
envelope are reference-only for checklist generation and segment-specific
reactivation, respectively. Use the canonical Batch 3 schemas listed above.
