# Channel Partner Prospect Capture Workflow

1. Receive `POST /api/no-auth/channel-partner-prospect` and reject other methods.
2. Optionally validate the request secret; validate partner category, referral potential, relationship strength, required descriptions, and public URLs.
3. Generate a unique prospect ID. Add deterministic category, relationship, potential, and user-supplied priority signals to recommend an outreach priority and next step.
4. Forward the sanitized business-development event to `CHANNEL_PARTNER_PROSPECT_WEBHOOK_URL` when configured, using the shared outbound secret header when available.
5. Return the classification. Downstream tasks remain internal; this workflow does not send outreach or make borrower decisions.

Configure `CHANNEL_PARTNER_PROSPECT_WEBHOOK_URL`, `CHANNEL_PARTNER_PROSPECT_SHARED_SECRET`, and optionally `WEBHOOK_SHARED_SECRET` in Vercel.
