# COI Niche Scoring Testing Checklist

- [ ] Valid POST returns HTTP 200, unique `scoring_id`, total 0–100, all six component scores, priority, outreach angle, next step, and internal-score notice.
- [ ] GET and other methods return HTTP 405 with `Allow: POST`.
- [ ] Missing fields, invalid source/action/score enums, malformed values, and wrong configured secret return HTTP 400.
- [ ] Repeating the same inputs returns identical score components, overall score, priority, and recommendations (IDs/timestamps may differ).
- [ ] Verify weighted score calculation, relationship blends, niche-fit default mapping, priority thresholds, and cold-relationship next step against the action documentation.
- [ ] Configured webhook receives the same deterministic calculation and shared outbound header; body secret is absent.
- [ ] Webhook failures return HTTP 502 without exposing upstream details.
- [ ] The score is labeled internal partner-development prioritization and never borrower credit, qualification, underwriting, or eligibility.
