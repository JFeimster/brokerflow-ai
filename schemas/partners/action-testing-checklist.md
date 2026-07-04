# Partner Action Testing Checklist

Use this checklist before connecting a partner OpenAPI schema to a production Custom GPT.

## Test Environment

- [ ] Confirm you are testing against staging or a sandbox automation workspace.
- [ ] Confirm production credentials are not used in early schema testing.
- [ ] Confirm the schema server URL points to the correct test backend.
- [ ] Confirm backend logs are visible before running GPT Builder tests.
- [ ] Confirm test payloads use synthetic partner, lead, and deal IDs.

## Schema Validation

For each schema:

- [ ] `openapi` is set to `3.1.0`.
- [ ] `info.title` is clear and unique.
- [ ] `operationId` values are unique.
- [ ] Each write operation includes `x-openai-isConsequential: true`.
- [ ] Required fields are actually required in the request schema.
- [ ] Response examples return a predictable status and message.
- [ ] Error responses are included for invalid requests or unauthorized access.
- [ ] Placeholder URLs have been replaced before GPT Builder import.

## No-Auth Webhook Tests

For no-auth schemas:

- [ ] Backend validates `shared_secret`.
- [ ] Backend rejects missing `shared_secret`.
- [ ] Backend logs `source`, `event_type`, `event_id`, and `submitted_at`.
- [ ] Backend dedupes duplicate `event_id` values.
- [ ] Backend does not accept raw borrower documents.
- [ ] Backend routes review-required events to a human-review queue.
- [ ] Backend returns a stable success response for accepted events.

No-auth schemas to test:

```txt
openapi-no-auth-partner-signup.yaml
openapi-no-auth-referral-lead-intake.yaml
openapi-no-auth-channel-partner-prospect.yaml
openapi-no-auth-warm-intro-request.yaml
openapi-no-auth-partner-followup-trigger.yaml
```

## API-Key Tests

For API-key schemas:

- [ ] GPT Builder auth is configured as API Key / Bearer.
- [ ] Backend rejects missing `Authorization` header.
- [ ] Backend rejects invalid API keys.
- [ ] Backend accepts the staging API key.
- [ ] Backend rate limits by API key.
- [ ] Backend logs write actions with timestamp and operation name.
- [ ] Backend does not expose delete/destructive operations.
- [ ] Backend separates staging and production credentials.

API-key schema categories to test:

```txt
CRM sync
attribution
onboarding
activity summaries
program review
fit scoring
training progress
outreach campaigns
lifecycle automation
segment playbooks
health monitor
resource recommendations
quarterly review
```

## OAuth Tests

For OAuth schemas:

- [ ] OAuth provider URLs are real, not placeholders.
- [ ] Scopes are least-privilege.
- [ ] Authorization flow completes successfully.
- [ ] Token refresh works or failure states are handled.
- [ ] Calendar events do not contain sensitive borrower details.
- [ ] Drive/resource folders do not contain borrower documents.
- [ ] Revoked OAuth access fails safely.

OAuth schemas to test:

```txt
openapi-oauth-partner-calendar-scheduling.yaml
openapi-oauth-partner-drive-folder.yaml
```

## Workflow Tests

### Partner Signup

- [ ] Partner signup creates a partner/prospect record.
- [ ] Partner signup creates a review task.
- [ ] Signup does not activate the partner automatically.

### Referral Lead Intake

- [ ] Referral lead preserves partner attribution.
- [ ] Referral lead requires borrower consent before outreach.
- [ ] Referral lead creates a broker-review task.
- [ ] Referral lead does not submit to a lender automatically.

### Channel Partner Prospect

- [ ] COI prospect creates a prospect record.
- [ ] Outreach is queued as an internal task.
- [ ] No external message is sent automatically.

### Partner Health Monitor

- [ ] Health check returns internal health status.
- [ ] Health flag creates a review/follow-up task.
- [ ] Health flag does not deactivate partner access automatically.

### Quarterly Review

- [ ] Review summarizes internal partner metrics only.
- [ ] Review excludes borrower-level sensitive details.
- [ ] Follow-up task is internal only.

## Safety Regression Tests

The GPT must not be able to use Actions to:

- [ ] approve a borrower
- [ ] decline a borrower
- [ ] promise funding
- [ ] submit a deal to a lender
- [ ] activate a partner automatically
- [ ] deactivate a partner automatically
- [ ] authorize a payout
- [ ] move money
- [ ] publish partner-facing assets without review
- [ ] send external outreach without review
- [ ] expose borrower documents to partners

## Production Readiness

Before production use:

- [ ] All placeholder URLs replaced.
- [ ] Staging tests completed.
- [ ] Backend logs reviewed.
- [ ] Human-review queue confirmed.
- [ ] Rate limits configured.
- [ ] Error handling confirmed.
- [ ] Partner-facing copy templates approved.
- [ ] OAuth scopes reviewed.
- [ ] API keys stored securely.
- [ ] GPT instructions include the partner Action guardrails.

## Final Sign-Off

```txt
Schema file:
Environment:
Backend owner:
GPT name:
Tested by:
Date:
Ready for production: yes/no
Notes:
```
