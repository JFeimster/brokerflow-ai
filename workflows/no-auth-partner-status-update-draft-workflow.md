# Partner Status Update Draft Workflow

1. Read the referral's authorized partner-facing stage from the CRM/orchestrator.
2. Call `draftPartnerStatusUpdate` with the referral ID, stage, update type, and minimal disclosure by default.
3. Include details only when a documented consent basis supports `expanded_with_consent`; the handler filters sensitive and explicitly restricted text.
4. Route the generated draft to the configured partner communication task or internal draft queue. This endpoint does not send email, SMS, or LinkedIn messages itself.
5. Keep private borrower financial and lender details in protected systems, not partner-facing drafts.
