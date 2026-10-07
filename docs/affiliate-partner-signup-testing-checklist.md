# Affiliate Partner Signup Testing Checklist

- [ ] POST with a valid consented partner returns HTTP 200 and a unique `partner_signup_id`.
- [ ] GET and other methods return HTTP 405 with `Allow: POST`.
- [ ] Missing each required field, wrong `action_type`, invalid enum, malformed email/URL, invalid referral volume, false acknowledgments, and invalid configured secret return HTTP 400.
- [ ] With the body-secret variable unset, the body secret is optional; with it set, a matching value passes and missing/wrong values fail.
- [ ] Referral volume 0/1, 2, and 5 produces low/general, normal/developing, and high/high-potential tiers respectively.
- [ ] Configured webhook receives the event and `x-brokerflow-secret`; request `shared_secret` is absent from forwarded JSON.
- [ ] Webhook failures return HTTP 502 without exposing upstream details or secrets.
- [ ] No request body, contact details, or secret is logged.
