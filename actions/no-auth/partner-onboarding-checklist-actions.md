# Partner Onboarding Checklist Generator

**Endpoint:** `POST /api/no-auth/partner-onboarding-checklist`
**Operation ID:** `generatePartnerOnboardingChecklist`
**Canonical schema:** `schemas/no-auth-partner-onboarding-checklist.schema.yaml`

Send a partner type and available context to generate a structured checklist, missing items, priority, and a CRM/workflow-ready next step. The handler supports COI, affiliate, channel, embedded, and general referral partners. Set `training_required`, `approved_messaging_required`, and `crm_setup_required` to tailor requirements; provide completed item keys to reconcile progress.

## Request fields

Required: `source`, `action_type: partner_onboarding_checklist`, `partner_type`. Optional context includes `partner_id`, `partner_name`, `company_name`, `business_type`, `state`, `referral_model`, `compensation_model`, requirement booleans, `current_onboarding_status`, `completed_items`, and `notes`. Add `shared_secret` only when `PARTNER_ONBOARDING_CHECKLIST_SHARED_SECRET` is configured.

Compensation is descriptive only. This Action does not approve compensation, calculate payouts, decide legal eligibility, or create binding terms.

## Outputs and environment

The response includes `onboarding_checklist_id`, `onboarding_priority`, `partner_segment`, `checklist_sections`, `missing_items`, `completed_items`, and `recommended_next_step`. Configure optional `PARTNER_ONBOARDING_CHECKLIST_WEBHOOK_URL`; outbound authentication reuses `WEBHOOK_SHARED_SECRET` in `x-brokerflow-secret`.

```sh
curl -X POST https://brokerflow-ai.vercel.app/api/no-auth/partner-onboarding-checklist \
  -H 'Content-Type: application/json' \
  -d '{"source":"webhook_test","action_type":"partner_onboarding_checklist","partner_type":"professional_services_coi","business_type":"accounting practice","referral_model":"warm_introduction","training_required":true}'
```
