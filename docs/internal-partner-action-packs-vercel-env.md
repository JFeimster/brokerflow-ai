# Partner Action Packs: Vercel Environment Variables

Set variables in the Vercel project for the runtime environments that will serve the API functions. The `.env.example` file is the source inventory. Blank webhook URLs disable forwarding; blank action-specific secrets mean the request `shared_secret` is not required. Do not duplicate `WEBHOOK_SHARED_SECRET` per action.

| Action | Optional webhook destination | Optional inbound body secret |
| --- | --- | --- |
| Affiliate Partner Signup | `AFFILIATE_PARTNER_SIGNUP_WEBHOOK_URL` | `AFFILIATE_PARTNER_SIGNUP_SHARED_SECRET` |
| Channel Partner Prospect Capture | `CHANNEL_PARTNER_PROSPECT_WEBHOOK_URL` | `CHANNEL_PARTNER_PROSPECT_SHARED_SECRET` |
| COI Niche Scoring | `COI_NICHE_SCORING_WEBHOOK_URL` | `COI_NICHE_SCORING_SHARED_SECRET` |
| Partner Outreach Campaign | `PARTNER_OUTREACH_CAMPAIGN_WEBHOOK_URL` | `PARTNER_OUTREACH_CAMPAIGN_SHARED_SECRET` |
| Partner Objection Response | `PARTNER_OBJECTION_RESPONSE_WEBHOOK_URL` | `PARTNER_OBJECTION_RESPONSE_SHARED_SECRET` |
| Partner Call Prep Brief | `PARTNER_CALL_PREP_WEBHOOK_URL` | `PARTNER_CALL_PREP_SHARED_SECRET` |
| Partner Onboarding Checklist | `PARTNER_ONBOARDING_CHECKLIST_WEBHOOK_URL` | `PARTNER_ONBOARDING_CHECKLIST_SHARED_SECRET` |
| Partner Enablement Content | `PARTNER_ENABLEMENT_CONTENT_WEBHOOK_URL` | `PARTNER_ENABLEMENT_CONTENT_SHARED_SECRET` |
| Partner Reactivation | `PARTNER_REACTIVATION_WEBHOOK_URL` | `PARTNER_REACTIVATION_SHARED_SECRET` |
| Partner Referral Submission | `PARTNER_REFERRAL_WEBHOOK_URL` | `PARTNER_REFERRAL_SHARED_SECRET` |
| Partner Status Update Draft | `PARTNER_STATUS_UPDATE_WEBHOOK_URL` | `PARTNER_STATUS_UPDATE_SHARED_SECRET` |
| Partner Attribution Log | `PARTNER_ATTRIBUTION_LOG_WEBHOOK_URL` | `PARTNER_ATTRIBUTION_LOG_SHARED_SECRET` |

`WEBHOOK_SHARED_SECRET` is the shared outbound credential. When set, the shared handler sends it in the `x-brokerflow-secret` request header to the configured webhook. The inbound body `shared_secret` is removed from webhook payloads. Keep destinations on trusted automation backends and rotate secrets through Vercel project settings and the receiving workflow together.

These environment variables configure forwarding and request checks; they do not create durable records. All three Batch 4 webhook destinations remain unset in the committed template. `vercel.json` deployment configuration remains unchanged.
