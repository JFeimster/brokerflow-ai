# Internal Partner Action Router

Use this map to select one canonical partner Action by the user's requested job. All current canonical partner Actions are no-auth POST endpoints with optional action-specific request secrets and optional outbound webhooks. Do not select a legacy schema from `schemas/partners/`; use the production schemas listed in `ACTION_INDEX.md` and the internal overview.

| User intent | Action | Routing rule |
| --- | --- | --- |
| Capture a new affiliate/referral partner application | `submitAffiliatePartnerSignup` | Use for a partner submitting their own profile and consent. |
| Add a prospective channel partner/COI to the pipeline | `captureChannelPartnerProspect` | Use for a prospect record before scoring/outreach. |
| Rank a COI opportunity for internal business development | `scoreCoiPartnerProspect` | Use for partner potential and outreach priority only; never borrower credit or eligibility. |
| Draft a partner outreach sequence | `createPartnerOutreachCampaign` | Use for first-touch and follow-up copy by segment, goal, tone, and channel. |
| Respond to a partner objection | `draftPartnerObjectionResponse` | Use when the user supplies the objection and wants a trust-preserving draft. Compensation/legal uncertainty is escalated for review. |
| Prepare for a partner call | `createPartnerCallPrepBrief` | Use for agenda, context organization, and discussion questions. |
| Plan partner onboarding steps | `generatePartnerOnboardingChecklist` | Use after signup/agreement when the user needs setup tasks. It does not approve compensation. |
| Request partner training or enablement material | `requestPartnerEnablementContent` | Use for referral guides, scripts, FAQs, playbooks, and related educational content. |
| Re-engage a dormant partner or prospect | `triggerPartnerReactivation` | Use for deterministic segment-specific outreach and bounded cadence. |
| Capture a referred business and its consent/intake state | `submitPartnerReferral` | Use for a new referral. If consent is false, do not recommend direct borrower contact. Prefer a partner-mediated introduction where available. |
| Draft a partner-facing deal update | `draftPartnerStatusUpdate` | Use only with the authorized stage. Default to minimal disclosure; never add private financial or lender details. |
| Record attribution or descriptive commission status | `logPartnerAttribution` | Use to log workflow metadata. It cannot approve or send payment or resolve a dispute. |

## Lifecycle routing

Prospect discovery → `captureChannelPartnerProspect` → `scoreCoiPartnerProspect` → `createPartnerOutreachCampaign` → (objection as needed) `draftPartnerObjectionResponse` → `createPartnerCallPrepBrief` → `submitAffiliatePartnerSignup` → `generatePartnerOnboardingChecklist` → `requestPartnerEnablementContent` → `triggerPartnerReactivation` when dormant.

For referred business: `submitPartnerReferral` → configured orchestrator handoff to borrower intake and automated lender-fit routing → existing document/review workflows → `draftPartnerStatusUpdate` → `logPartnerAttribution`.

Select one Action per task unless the user asks for multiple lifecycle steps. Pass returned IDs as correlation references only; do not invent endpoint routes or assume an Action persisted its output. The caller or configured downstream orchestrator owns persistence and routing. Do not tell partners that internal COI scores are borrower scores or funding decisions.
