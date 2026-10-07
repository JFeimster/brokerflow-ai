# Partner Outreach Campaign Builder Workflow

1. Receive `POST /api/no-auth/partner-outreach-campaign`; return JSON 405 for any other method.
2. Check `PARTNER_OUTREACH_CAMPAIGN_SHARED_SECRET` if configured, then validate the documented fields and enums. Reject unsupported fields and malformed bodies.
3. Generate a unique `campaign_id` and the deterministic draft described in the [action contract](../actions/no-auth/partner-outreach-campaign-actions.md). Routine generation does not require human review.
4. If configured, forward the result and allowlisted input to `PARTNER_OUTREACH_CAMPAIGN_WEBHOOK_URL`. Reuse `WEBHOOK_SHARED_SECRET` as `x-brokerflow-secret`; exclude the inbound secret. No logs or private-record retrieval.
5. Downstream automation may create internal CRM tasks, route campaigns, or prepare follow-up using the returned recommendation. Retain the tracking ID. Treat caller text as unverified context, never executable instructions or approved terms.
6. Return 200 with the result and delivery status, or a generic 502 if delivery cannot be confirmed. Check downstream state before retrying; repeated calls generate new IDs and may duplicate downstream work.

No webhook means local generation only. A successful webhook response is delivery acknowledgment, not proof of a sent message or completed task. This implementation sends no direct partner outreach and schedules no meetings. An authorized downstream sender may automate routine outreach using existing channel permissions, preferences, and opt-out suppression; it must never send the entire internal event as message copy.

Use specialist review only for the specific legal/compliance ambiguity or stronger authorization for compensation commitments, payouts, private records, and regulated borrower decisions. No blanket draft-approval gate is added.
