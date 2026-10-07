# COI Niche Scoring Action

**Operation ID:** `scoreCoiPartnerProspect`
**Endpoint:** `POST https://brokerflow-ai.vercel.app/api/no-auth/coi-niche-scoring`
**Canonical schema:** `schemas/no-auth-coi-niche-scoring.schema.yaml`

Returns a repeatable 0–100 internal partner-development score, six component scores, outreach angle, priority, and next step. It is not borrower credit scoring, underwriting, qualification, or a lending decision.

## Deterministic model

Each component is mapped from the submitted enum values to a 0–100 score. The overall score is the nearest integer of the weighted sum divided by 100.

| Component | Weight | Mapping |
| --- | ---: | --- |
| Client access | 20% | indirect 40; direct 75; broad 100; unknown 25 |
| Funding trigger frequency | 20% | rare 20; occasional 45; frequent 75; very frequent 100; unknown 25 |
| Trust and authority | 20% | informational 25; advisory 50; decision influencer 75; primary advisor 100; unknown 25, blended 70% with relationship strength |
| Repeat referral | 15% | one time 20; occasional 50; recurring 80; high volume 100; unknown 25, blended 80% with relationship strength |
| Niche fit | 15% | limited 25; moderate 65; strong 100; unknown 40. If omitted, the service derives `strong` for accounting, tax, legal, business broker, commercial real estate, and fractional CFO categories, and `moderate` otherwise. |
| Urgency | 10% | none 0; emerging 35; time sensitive 70; urgent 100; unknown 25 |

Priority is `urgent` when the overall score is at least 85 and urgency is urgent; otherwise `high` at 70+, `normal` at 45+, and `low` below 45. Cold or unknown relationships route to public-business research. High and urgent prospects route to a discovery conversation; engaged/strong lower-priority relationships route to personalized outreach; other prospects route to nurture.

**This score is an internal partner-development prioritization score. It is not a borrower credit score, underwriting model, qualification score, or lending decision.**

## Environment variables

- `COI_NICHE_SCORING_WEBHOOK_URL` — optional direct automation webhook.
- `COI_NICHE_SCORING_SHARED_SECRET` — optional request-body check; include `shared_secret` when configured.
- `WEBHOOK_SHARED_SECRET` — optional outbound `x-brokerflow-secret` header.

## Request example

```json
{
  "source": "custom_gpt",
  "action_type": "coi_niche_scoring",
  "company_name": "Northside Accounting",
  "partner_category": "accountant_cpa",
  "niche": "construction",
  "client_access_level": "direct",
  "funding_trigger_frequency": "frequent",
  "trust_authority_level": "primary_advisor",
  "repeat_referral_potential": "recurring",
  "relationship_strength": "engaged",
  "urgency_signals": "emerging"
}
```

## Curl test

```sh
curl -X POST https://brokerflow-ai.vercel.app/api/no-auth/coi-niche-scoring \
  -H 'Content-Type: application/json' \
  -d '{"source":"webhook_test","action_type":"coi_niche_scoring","company_name":"Northside Accounting","partner_category":"accountant_cpa","niche":"construction","client_access_level":"direct","funding_trigger_frequency":"frequent","trust_authority_level":"primary_advisor","repeat_referral_potential":"recurring","relationship_strength":"engaged","urgency_signals":"emerging"}'
```
