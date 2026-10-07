# Affiliate Partner Signup Workflow

1. Receive `POST /api/no-auth/affiliate-partner-signup` and enforce POST-only behavior.
2. Optionally validate the request secret; validate required fields, consent acknowledgments, email, enums, URL, and referral-volume bounds.
3. Generate a unique signup ID and assign segment, priority, and follow-up step from expected referral volume and partner type.
4. Forward the sanitized event to `AFFILIATE_PARTNER_SIGNUP_WEBHOOK_URL` when configured, adding `x-brokerflow-secret` from `WEBHOOK_SHARED_SECRET` when present. Never forward the body secret.
5. Return the signup ID and onboarding recommendation. A receiving automation may create an internal onboarding follow-up; it must not activate the partner automatically.

Configure `AFFILIATE_PARTNER_SIGNUP_WEBHOOK_URL`, `AFFILIATE_PARTNER_SIGNUP_SHARED_SECRET`, and optionally the shared `WEBHOOK_SHARED_SECRET` in Vercel.
