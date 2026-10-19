# Synthetic core MCP workflow

Use an OAuth-authenticated MCP client against the approved `/mcp` resource. `get_my_workspaces` discovers current authorized organizations. Substitute the selected organization UUID for `ORG`, actual returned intake/deal/review IDs, and an active same-organization partner UUID. Examples are synthetic; never paste raw documents, account identifiers, credentials or private borrower records into MCP.

Every persistent operation requires the user to confirm the exact record/task first. Set `confirmed: true` only after that confirmation. Retain the same idempotency key across a retry and use a different key for a genuinely distinct request. Read-only tools do not need confirmation.

## 1. Capture borrower intake

`capture_borrower_intake` arguments:

```json
{
  "organization_id": "ORG",
  "confirmed": true,
  "idempotency_key": "synthetic-intake-capture-0001",
  "intake": {
    "external_reference": "synthetic-restaurant-equipment-2026-001",
    "contact_name": "Synthetic Restaurant Operator",
    "email": "synthetic-operator@example.test",
    "consent": { "status": "granted", "channels": ["email"], "source": "synthetic broker attestation", "captured_at": "2026-10-18T12:00:00Z" },
    "scenario": { "borrower_type": "business", "business_name": "Synthetic Harbor Restaurant LLC", "loan_purpose": "equipment_financing", "requested_amount": 85000, "state": "NY", "monthly_revenue": 55000, "time_in_business_months": 36, "credit_score_range": "660_699", "urgency": "normal" }
  }
}
```

Response fields: stable UUID `intake_id`, UUID `deal_id`, `organization_id`, `status: intake_captured`, `completeness` with missing/critical fields and information-coverage score, `next_action: broker_review`, `duplicate`. This creates one canonical lead and one deal, not a lending decision. Granted consent requires channels and an actual non-future timestamp. Denied/unknown consent can be recorded without authorizing contact.

## 2. Preliminary routing

Call `route_lender_fit` with `{ "organization_id": "ORG", "scenario": <same scenario object> }`. It returns `primary_route: equipment_financing`, secondary product paths, legacy heuristic `fit_score`/`fit_tier`, missing fields, flags, `routing_model: legacy_deterministic_v1`, `preliminary: true`, explicit limitations and the next broker-review step. It triggers no workflow and verifies no current lender offer.

## 3. Human review

Call `request_lender_match_review` with `organization_id`, `confirmed: true`, `intake_id`, retained `idempotency_key`, and `scenario` equal to the captured scenario plus `action_type: lender_match_review`, `requester_name: Synthetic broker`, and `human_review_required: true`. Supplied captured scenario values must match. It returns `review_id`, `review_request_id`, `status: queued_for_human_review`, `duplicate` and `next_step: manual_review`.

`create_review_request` remains compatible. Calling it with the same organization, actor, scenario and key replays the same review. To link an existing review to the intake, use the compatibility operation with that exact original key/scenario.

## 4. Checklist

Call `generate_document_checklist` with the selected organization and same scenario. It returns `template_version: brokerflow_v1`, route, items (`document_type`, `document_name`, `category`, `required`, `recommended`, `review_notes`), overall review notes and `preliminary: true`. This read generates no persistent checklist or file.

## 5. Track missing documents

`trigger_missing_document_request` arguments:

```json
{
  "organization_id": "ORG",
  "intake_id": "INTAKE_UUID",
  "review_id": "REVIEW_UUID",
  "confirmed": true,
  "idempotency_key": "synthetic-documents-request-001",
  "submitted_documents": [ { "document_type": "equipment_invoice_or_quote", "status": "rejected" } ],
  "due_date": "2026-10-25"
}
```

Use exactly one reported status per document type. Rejected/missing items remain outstanding; submitted/verified reports count toward this preliminary checklist. The service derives the scenario from persisted records and validates all supplied associations. Response includes request/task and linked IDs, missing types, safe draft, `status: task_created`, `draft_status: draft_prepared`, `delivery_status: not_sent`, `next_action: review_consent_and_draft_before_send` and `duplicate`. Secure uploads and contact permission need separate broker review; this tool never sends. When no required types remain, `no_missing_documents` returns null request/task IDs and no task is created.

## 6. Deal status

Call `lookup_deal_status` with `{ "organization_id": "ORG", "deal_id": "DEAL_UUID" }`. A page of `items` includes deal/intake IDs, `pipeline_stage: documents_pending`, assigned owner or null, linked `review_id` and distinct `review_status: queued_for_human_review`, task IDs/status/deadlines, `last_activity` and `next_action`. Omit IDs for a bounded workspace page (`limit` 1–100, default 25; `cursor` offset; `next_cursor` null when finished). Unknown explicit references return 404; an empty unfiltered workspace returns an empty array.

## 7. Partner referral

Call `capture_partner_referral` with `organization_id`, `confirmed: true`, retained `idempotency_key`, actual `partner_id`, `intake_id`, opaque `source_reference`, `permission_to_contact` and `warm_intro_available`. Optional `assigned_to` must be an active organization member. A true permission flag must agree with granted intake consent. The result includes `referral_id`, organization/intake/deal/review/partner references, `attribution_status: attributed`, `status: referral_captured`, next action and duplicate flag. The canonical referral retains funding scenario and permission metadata; lead events record creation and attribution updates. No commission or payout is authorized.

## Protocol and validation

For a raw protocol smoke request, initialize the client first and then send `tools/list` or `tools/call` with the MCP protocol-version header negotiated during initialization. For example, the JSON-RPC body for discovery is `{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}`. Use `Authorization: Bearer $MCP_ACCESS_TOKEN`, `Content-Type: application/json`, and `Accept: application/json, text/event-stream`. Keep the token in the environment and out of captured logs. Vercel Preview protection and application OAuth are separate authentication gates.

The automated acceptance path is `tests/integrations/core-workflow.postgres.test.js` against isolated PostgreSQL, with real services/registrations and an injected test authenticator/PostgreSQL adapter. It does not prove deployed Supabase OAuth, PostgREST, private-plugin installation or outbound delivery. New nested tests are discovered by `npm test` and `npm run test:postgres`; CI uses PostgreSQL 17 and requires the database suites rather than silently skipping them.
