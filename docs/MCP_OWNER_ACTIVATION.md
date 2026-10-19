# Owner activation instructions

This checklist covers the shared changes deliberately kept outside the code PR. It is a single consolidated owner release for the new authenticated workflows.

## 1. Apply the additive platform-core migration

Confirm the target is the existing BrokerFlow `platform-core` project and inspect its migration history. The migration `20261019165744_brokerflow_core_workflows.sql` adds the deal and document-request records plus scoped service-only RPCs. Apply this migration once, after the already-applied review, rate-limit and follow-up-task migrations. Do not replay historical local migrations with timestamps that differ from the shared database history. Retain the migration command output and verify the new RPC and table grants/RLS before proceeding.

## 2. Deploy to Preview and configure Preview OAuth

Deploy the PR branch to its Vercel Preview. Configure only the Preview OAuth values needed by the existing Supabase OAuth 2.1 integration: the registered client/audience allowlist and exact Preview redirect/resource URLs. Reuse the existing server-side Supabase project configuration through the approved secret-management path; do not place secret values in Git, logs, CLI arguments or this checklist. Keep production environment values and production aliases unchanged.

Check the protected-resource metadata, OAuth discovery and consent callback from the Preview hostname. Then make an unauthenticated `tools/list` request and confirm it is rejected with the expected OAuth challenge. A successful HTTP response alone does not prove authenticated discovery.

## 3. Refresh the private plugin and run the synthetic acceptance flow

Package the reviewed plugin release and install/refresh it only in the owner-approved private test workspace. Authenticate with a user whose active workspace has the required read, write and audit grants. Confirm `tools/list` exposes all seventeen tools: the ten compatibility tools and these seven additions:

- `capture_borrower_intake`
- `route_lender_fit`
- `request_lender_match_review`
- `generate_document_checklist`
- `trigger_missing_document_request`
- `lookup_deal_status`
- `capture_partner_referral`

Run the synthetic intake → preliminary routing → confirmed review → checklist → confirmed missing-document task/draft → deal lookup → confirmed partner referral sequence. Verify IDs and state from a fresh authenticated connection, confirm organization isolation and idempotent retry behavior, and retain sanitized outcomes only. Confirm a new document request remains `delivery_status: not_sent`; this release does not deliver borrower messages.

## 4. Decide on production separately

After Preview acceptance, review the production migration and release through the normal owner-controlled deployment process. Production OAuth allowlists, migration state, plugin refresh and any production release are separate from this PR and must be explicitly authorized. Do not enable borrower-facing delivery or lender submission as part of this activation.
