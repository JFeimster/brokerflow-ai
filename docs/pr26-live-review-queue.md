# PR #26 — Live Review Queue + Automation Activity

## What this adds

The console keeps its vanilla JavaScript and Vercel function architecture. Authenticated console requests verify access tokens with Supabase Auth, then look up the active `public.memberships` entry, organization, role, and explicit `role_permissions` on every request. The selected organization is an existing `public.organizations.id`; the user must choose it in the console. No QA or reference organization is selected automatically.

Review rows and their append-only event ledger are isolated in additive `public.brokerflow_review_requests` and `public.brokerflow_review_events` tables. They use the existing public PostgREST schema because the existing REST integration cannot access a private `brokerflow` schema without a separate API-exposure change. Browser roles receive no table privileges or RPC access. A server-only Supabase secret key calls two narrowly scoped transaction functions; it is never returned to the browser. The Vercel API validates identity, organization membership, and BrokerFlow permission before calling a function. The trusted ingest endpoint uses a separate bearer key and one server-bound organization ID.

`brokerflow_create_review` atomically creates a review and its creation event. `brokerflow_apply_review_action` locks the review, checks its expected version and transition, updates the status, and inserts the audit event in one transaction. Idempotency keys are SHA-256 hashed before storage; create keys are scoped by organization, source, and actor, and action keys by organization, review, and actor. Reusing a key with changed content conflicts. The ledger is not writable through browser credentials.

Operational statuses are `queued_for_human_review`, `in_review`, `needs_information`, and `reviewed`. Allowed actions are start review, request information (with a concise note), and mark reviewed. Reviewed is terminal. These describe broker workflow only; they are never borrower approval, eligibility, underwriting, pricing, lender submission, or funding outcomes.

## Organization authorization (owner action)

The current `platform-core` permission registry does not contain BrokerFlow review permissions. The migration intentionally does not modify permission definitions, role assignments, organization records, memberships, or existing policies. Before enabling live mode, an organization owner must:

1. Select the specifically authorized organization and the intended users. Do not assume that a current reference/QA organization is a production tenant.
2. Add permission definitions `brokerflow.reviews.read`, `brokerflow.reviews.write`, and `brokerflow.reviews.audit` through the platform's approved owner process.
3. Assign `read` and `audit` only to organization roles that may view review history; assign `write` only to the explicitly approved broker role. Assign these grants in that organization's `role_permissions` rows only. Do not infer access from existing admin/operator/member/partner roles.
4. Verify that generic members/partners have no BrokerFlow grants and that the selected role assignments match the organization's review policy.

The app fails closed when permissions are absent. A viewer with read/audit grants can list and inspect review items and events but cannot create or transition them.

## Owner setup sequence

1. Review this additive migration and test it against an approved isolated, disposable PostgreSQL/Supabase environment before touching the shared populated project. This task did not create a paid database branch or isolated project, and did not apply this migration.
2. Separately authorize and apply `supabase/migrations/20261018000100_brokerflow_reviews.sql` to the selected target. It adds two prefixed tables, indexes, RLS, least-privilege grants, and two service-only atomic functions. No existing table, policy, trigger, integration, or data is replaced. For rollback, disable live traffic first; retain event data for audit, then use an owner-reviewed forward fix or a reviewed archival/drop plan. Do not blindly drop tables after real reviews exist.
3. Confirm Supabase Auth email OTP/magic links are enabled and add the console callback `/app/review-queue` to the allowed redirect URLs. Invite/create each broker through the owner process; no public bootstrap endpoint or universal admin is provided.
4. Add the three permission definitions and organization-scoped role grants described above. Verify membership status and role assignments.
5. Configure **Preview** Vercel variables first: `BROKERFLOW_CONSOLE_MODE=live`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `BROKERFLOW_INGEST_API_KEY`, and `BROKERFLOW_INGEST_ORGANIZATION_ID`. Keep the secret and ingest key server-only. Never add credentials to source or client variables. Production variables remain a separate release decision.
6. Use an explicitly authorized organization ID for the ingestion binding. Configure the corresponding GPT Action as bearer-authenticated and send a unique `Idempotency-Key`; the legacy `/api/no-auth/lender-match-review` route remains nonpersistent and reports `persisted:false`.
7. In the preview, sign in as an invited user, explicitly choose the organization, create a test review, verify the creation event, execute permitted transitions, refresh/sign in again, and verify viewer denial, cross-organization isolation, key failures, and idempotent retries. Remove or retain the test record according to the selected organization's data-retention policy.
8. Configure Vercel Firewall or an approved edge rate limiter for the protected ingestion and auth/mutation routes before production use. This PR does not add a distributed rate-limit store, and instance-local serverless throttling would not be a reliable control.

`BROKERFLOW_CONSOLE_MODE=live` fails closed if backend settings or access are missing. The Review Queue and Automation Activity screens never substitute sample rows in live mode. Other console sections remain visibly demonstrative. The public config endpoint returns only the URL and publishable key; the service key remains server-only.

## Routes and contracts

- `GET /api/console/config` — safe auth configuration and explicit mode.
- `GET /api/console/session` — verified actor and only organizations with explicit BrokerFlow read permission.
- `GET|POST /api/console/reviews` — authorized organization-scoped list/create.
- `GET /api/console/review?id=...&organization_id=...` — scoped detail and event history.
- `POST /api/console/review-action` — versioned action with an idempotency key in the JSON body.
- `GET /api/console/activity?organization_id=...` — read/audit-permission-gated event feed.
- `POST /api/ingest/lender-match-review` — distinct integration bearer key, owner-bound organization, `Idempotency-Key` header.

Authenticated API replies use `Cache-Control: no-store`. The Vercel file-based routes need no catch-all rewrite; the existing seven `/app/*` rewrites and `cleanUrls` configuration are preserved.

## Verification

Run `npm run build`, `npm run lint`, and `npm test`. Review-service unit and API tests are in `tests/pr26-review-service.test.js`. Database transaction/RLS/role-isolation tests require an approved isolated database and are intentionally not run against the populated `platform-core` project. After owner setup, use the sequence in step 7 for real preview validation. A Vercel preview marked READY is not proof of live auth or persistence.

### API smoke examples

```sh
curl -i https://<preview>/api/console/config
curl -i https://<preview>/api/console/session -H "Authorization: Bearer <user-access-token>"
curl -i https://<preview>/api/ingest/lender-match-review \
  -H "Authorization: Bearer <integration-key>" \
  -H "Idempotency-Key: <unique-random-value-at-least-16-chars>" \
  -H "Content-Type: application/json" \
  --data '{"source":"custom_gpt","action_type":"lender_match_review","requester_name":"Broker intake","borrower_type":"business","business_name":"Example Business","loan_purpose":"equipment_financing","requested_amount":185000,"state":"NY","human_review_required":true}'
```

Never put live tokens or borrower data in committed test fixtures, terminal transcripts, or PR descriptions.
