# Partner Referral Submission Workflow

1. Capture partner/source attribution, scenario details, contact permission, and warm-intro availability through `submitPartnerReferral`.
2. If contact permission is false, do not route to direct borrower contact. Create a consent-collection task or request a partner-mediated introduction.
3. When borrower name, a contact method, requested amount, and loan purpose are present, prepare a structured borrower-intake handoff. If high-level scenario fields are present, prepare a separate lender-fit routing handoff.
4. Hand off only to existing borrower-intake and lender-fit workflow integrations. This action does not directly invoke those endpoints; configure its webhook destination to an orchestrator that owns the handoff.
5. Continue through document and review workflows, then draft a partner-safe update with `draftPartnerStatusUpdate`.
6. Record attribution and descriptive commission status with `logPartnerAttribution`.

Lifecycle: Partner Referral Submission → Borrower Intake / structured deal payload → Automated Lender Fit Routing → Document / review workflows → Partner Status Update Draft → Attribution Log. No direct lender submission, approval, or funding occurs here. Webhook retries are not durably deduplicated by the handler.
