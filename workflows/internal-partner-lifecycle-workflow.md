# Internal Partner Lifecycle Workflow

This workflow describes how the 12 partner Actions fit together. Each Vercel handler returns a draft, score, classification, or routing payload and may forward it to an optional configured webhook. The Actions do not call each other directly and do not create durable records unless a downstream system does so.

1. **Prospect discovery and capture:** identify a potential COI/channel partner and use `captureChannelPartnerProspect` to create a structured prospect payload.
2. **COI scoring:** use `scoreCoiPartnerProspect` to prioritize business-development effort. Keep this score internal; it is not borrower credit, qualification, underwriting, or eligibility.
3. **Outreach and objection handling:** draft a sequence with `createPartnerOutreachCampaign`; when a partner raises a concern, draft a response with `draftPartnerObjectionResponse`. Route legal/compliance ambiguity and compensation disputes to an appropriate specialist.
4. **Meeting preparation:** use `createPartnerCallPrepBrief` to prepare an agenda and questions from supplied context.
5. **Signup:** capture partner profile and consent using `submitAffiliatePartnerSignup`. A webhook/orchestrator may persist the partner record and create follow-up work.
6. **Onboarding:** call `generatePartnerOnboardingChecklist` and complete routine setup steps. Compensation information is descriptive and does not constitute an approval or binding calculation.
7. **Enablement:** use `requestPartnerEnablementContent` for approved educational materials and referral guidance.
8. **Reactivation:** when a partner is dormant or has not referred, use `triggerPartnerReactivation` for a bounded message and cadence.
9. **Referral submission:** use `submitPartnerReferral` to capture source attribution, scenario context, permission-to-contact, and warm-introduction status. If permission is false, keep contact partner-mediated or collect permission.
10. **Borrower/deal handoff:** send eligible structured intake and high-level scenario data to the configured orchestration destination. The existing borrower-intake, lender-fit, document, and review integrations remain separate; this action does not invoke unavailable endpoints or make a borrower decision.
11. **Partner-safe updates:** after an authorized stage change, call `draftPartnerStatusUpdate`. The result is a draft; confirm recipient and consent before sending.
12. **Attribution/commission logging:** call `logPartnerAttribution` with source and descriptive statuses. Route duplicates or disputes to review. The endpoint does not authorize payments or change payout ledgers.
13. **Reactivation loop:** return dormant partners to the reactivation step, then resume onboarding, enablement, and referral support as appropriate.

Keep system-of-record persistence, deduplication, outbound communication, and protected payout operations in downstream authenticated systems. Webhook retries can create duplicates because the current handlers have no durable idempotency store.
