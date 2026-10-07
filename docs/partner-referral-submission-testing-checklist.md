# Partner Referral Submission Testing Checklist

- POST complete and partial referral examples; confirm unique `referral_id` and readiness flags.
- Exercise every non-POST method and expect 405 with `Allow: POST`.
- Omit each required field; test invalid source/referral/relationship enums, invalid booleans, invalid emails, negative/too-large/nonfinite amounts, overlong strings, arrays/objects for scalar fields, and unsupported keys; expect 400.
- Configure `PARTNER_REFERRAL_SHARED_SECRET`; reject missing/wrong request secret and accept a match.
- Forward to a mock webhook; verify `x-brokerflow-secret` and ensure `shared_secret` is absent from body. Test webhook non-2xx/timeout yields generic tracked 502.
- Verify contact is never recommended when permission is false; warm introduction is recommended when available.
- Verify intake readiness requires name, contact, amount, and purpose; lender-fit readiness reflects high-level scenario fields only.
- Validate request/response examples against the OpenAPI schema and handler.
