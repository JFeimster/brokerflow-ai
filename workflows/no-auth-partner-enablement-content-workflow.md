# Partner Enablement Content Workflow

1. Receive `POST /api/no-auth/partner-enablement-content` and validate required fields, category, content type, format, tone, channel, lengths, and configured request secret.
2. Select category-specific educational guidance and prepare a draft for the supplied business type and audience.
3. Store the request ID, content type, target partner segment, draft, and usage notes in the enablement task or content library.
4. Optionally forward the allowlisted response and input to `PARTNER_ENABLEMENT_CONTENT_WEBHOOK_URL`; verify `x-brokerflow-secret` using the shared outbound secret.
5. Apply the approved messaging review process before external distribution. Do not promise any lending or funding outcome.

An unconfirmed webhook returns a generic 502 with the content request ID. This endpoint does not provide idempotency keys; check downstream state before retrying.
