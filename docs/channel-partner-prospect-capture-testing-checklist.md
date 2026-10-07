# Channel Partner Prospect Capture Testing Checklist

- [ ] Valid POST returns HTTP 200, unique `prospect_id`, category, priority, and recommended next step.
- [ ] GET and other methods return HTTP 405 with `Allow: POST`.
- [ ] Missing required fields, invalid source/action/category/potential/relationship/priority, malformed URLs, and wrong configured secret return HTTP 400.
- [ ] High referral potential plus engaged relationship and a core advisory category yields high priority; cold/unknown relationship recommends public-business research.
- [ ] Explicit urgent priority remains urgent; high input raises a low computed priority to high.
- [ ] Configured webhook receives sanitized partner fields and shared header; body secret is absent.
- [ ] Webhook failures return HTTP 502 without exposing upstream details.
- [ ] No private borrower information or secrets are logged or fetched.
