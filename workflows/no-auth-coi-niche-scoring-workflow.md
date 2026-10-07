# COI Niche Scoring Workflow

1. Receive `POST /api/no-auth/coi-niche-scoring` and reject other methods.
2. Optionally validate the request secret and validate every score enum.
3. Map inputs to six 0–100 component scores. Trust includes relationship strength at 30%; repeat-referral potential includes it at 20%. Apply weights 20/20/20/15/15/10 and round the total to the nearest integer.
4. Determine priority, outreach angle, and next step using the documented deterministic rules in `actions/no-auth/coi-niche-scoring-actions.md`.
5. Forward the score and sanitized partner-development inputs when `COI_NICHE_SCORING_WEBHOOK_URL` is configured. Do not forward the body secret.
6. Return the score with its internal partner-development notice. Never use it for borrower decisions.

Configure `COI_NICHE_SCORING_WEBHOOK_URL`, `COI_NICHE_SCORING_SHARED_SECRET`, and optionally `WEBHOOK_SHARED_SECRET` in Vercel.
