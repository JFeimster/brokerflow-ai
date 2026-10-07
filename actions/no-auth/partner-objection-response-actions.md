# Partner Objection Handler / Response Draft

**Operation ID:** `draftPartnerObjectionResponse`

**Endpoint:** `POST https://brokerflow-ai.vercel.app/api/no-auth/partner-objection-response`

**Canonical schema:** [`schemas/no-auth-partner-objection-response.schema.yaml`](../../schemas/no-auth-partner-objection-response.schema.yaml)

**Authentication:** No GPT Action auth; optional body secret.

Draft trust-preserving responses with deterministic category-specific next steps. Legal and compensation language in the objection or notes takes precedence over a mismatched label. The other category also recognizes common trust, spam, time, and lender concerns; this keyword routing is not a legal classifier.

## Input contract

Required: `source`, `action_type`, `company_name`, `partner_category`, `objection_type`, `objection_text`, `relationship_stage`, `desired_tone`, `response_channel`.

Optional: `notes`, `shared_secret`, `contact_name`.

Only documented fields are accepted. Required text must contain non-whitespace characters. Optional strings may be empty but cannot be null, objects, or arrays. Text lengths are enforced as specified in the schema. The `action_type` must be `partner_objection_response`.

- `source`: `custom_gpt`, `website`, `internal_tool`, `webhook_test`.
- `partner_category`: `accountant_cpa`, `bookkeeper`, `tax_advisor`, `attorney`, `small_business_attorney`, `business_broker`, `commercial_real_estate`, `merchant_services`, `payroll_provider`, `fractional_cfo`, `equipment_vendor`, `insurance_agent`, `franchise_consultant`, `local_business_association`, `industry_consultant`, `ecommerce_consultant`, `restaurant_consultant`, `construction_consultant`, `trucking_logistics_consultant`, `healthcare_practice_consultant`, `other`.
- `relationship_stage`: `cold`, `aware`, `warm`, `existing_relationship`, `former_partner`, `inactive_partner`.
- `objection_type`: `client_relationship_risk`, `spam_concern`, `compensation_question`, `compliance_question`, `who_should_i_refer`, `already_have_lender`, `bank_only_clients`, `do_not_want_financing_role`, `too_busy`, `need_more_information`, `trust_concern`, `other`.
- `desired_tone`: `professional`, `friendly`, `consultative`, `concise`.
- `response_channel`: `email`, `linkedin`, `phone`, `sms`.

Use Batch 1 category identifiers; both `attorney` and `small_business_attorney` are accepted. Batch 2 uses `relationship_stage`: map Batch 1 `engaged` to `warm` and `strong` to `existing_relationship` only when the context supports that mapping. Resolve `unknown` rather than assuming a prior relationship.

## Vercel environment variables

- `PARTNER_OBJECTION_RESPONSE_WEBHOOK_URL`: optional destination for the generated internal event.
- `PARTNER_OBJECTION_RESPONSE_SHARED_SECRET`: optional inbound body check; wrong or missing secrets return 400, matching Batch 1.
- `WEBHOOK_SHARED_SECRET`: existing optional outbound `x-brokerflow-secret` header. Never sent in the body.

The webhook receives the generated result, tracking ID, `received_at`, and an allowlisted `input` object without `shared_secret`. There are no payload or secret logs. Delivery uses an eight-second timeout and rejects redirects. Only a successful HTTP webhook response counts as forwarded; upstream content is not returned or trusted as approved terms.

With no webhook configured, generation still succeeds with `webhook_status: not_configured`; no persistence or task creation is claimed. With a webhook, `webhook_status: forwarded` confirms delivery only, not completion of downstream tasks. Each request gets a new tracking ID. Delivery failures return 502 with that ID; check downstream state before retrying because this endpoint does not provide idempotency.

## Example request and response

Synthetic examples, not real partner facts or outcomes.

```json
{
  "source": "custom_gpt",
  "company_name": "Example Advisory",
  "partner_category": "accountant_cpa",
  "relationship_stage": "cold",
  "action_type": "partner_objection_response",
  "contact_name": "Alex",
  "objection_type": "client_relationship_risk",
  "objection_text": "How would I stay involved in a client introduction?",
  "desired_tone": "consultative",
  "response_channel": "email"
}
```

HTTP 200:

```json
{
  "success": true,
  "response_id": "por_20261007_11111111-2222-4333-8444-555555555555",
  "objection_category": "client_relationship_risk",
  "recommended_response": "Hi Alex,\n\nLet's clarify what would make this workable. Your client relationship should guide the handoff. We can agree on who introduces whom, what may be shared, and when follow-up is appropriate before an introduction.\n\nThe starting point is protecting your advisory relationship. What communication boundaries would you want in place?",
  "short_response": "Let's clarify what would make this workable. Your client relationship should guide the handoff. We can agree on who introduces whom, what may be shared, and when follow-up is appropriate before an introduction.",
  "follow_up_question": "What communication boundaries would you want in place?",
  "trust_builder": "Document the partner's role, the client's permission, and the follow-up owner.",
  "compliance_safe_notes": [
    "No approval, funding, rates, eligibility, or outcome is promised.",
    "Caller notes and request credentials are not evidence of approved compensation terms; this endpoint states no specific terms.",
    "Set controlled communications and confidentiality expectations without claiming verified safeguards.",
    "Routine drafting and internal follow-up do not require a blanket human-review gate."
  ],
  "requires_specialist_review": false,
  "recommended_next_step": "define_client_handoff_preferences",
  "message": "Partner objection response drafted. No partner message was sent by this handler.",
  "webhook_status": "not_configured"
}
```

Errors use `success: false`, `error`, and `message`: 400 validation/secret failure, 405 unsupported method with `Allow: POST`, 500 generation failure, 502 unconfirmed webhook delivery. The schema documents all response bodies.

## Curl tests

Run against a configured preview or deployment after this PR is deployed. These examples do not claim the production route is already live. In PowerShell use `curl.exe` and shell-appropriate quoting.

```sh
curl -X POST 'https://brokerflow-ai.vercel.app/api/no-auth/partner-objection-response' \
  -H 'Content-Type: application/json' \
  -d '{"source":"webhook_test","company_name":"Example Advisory","partner_category":"accountant_cpa","relationship_stage":"cold","action_type":"partner_objection_response","contact_name":"Alex","objection_type":"client_relationship_risk","objection_text":"How would I stay involved in a client introduction?","desired_tone":"consultative","response_channel":"email"}'

# 405
curl -i 'https://brokerflow-ai.vercel.app/api/no-auth/partner-objection-response'

# 400
curl -i -X POST 'https://brokerflow-ai.vercel.app/api/no-auth/partner-objection-response' -H 'Content-Type: application/json' -d '{}'
```

When the inbound secret is configured, include `shared_secret` through the authorized caller's secret configuration. Never put real secrets in committed examples or logs.

## Automation and limits

Routine drafts, campaign routing, workflow triggers, and internal tasks can run automatically. Downstream outreach must use existing authorization, contact preferences, channel permissions, and suppression rules. The handler itself does not deliver partner-facing messages. Do not turn every draft into a human-review queue.

Reserve stronger authorization or review for legal/compliance ambiguity, actual compensation commitments, payouts, private-record access, lender submission, underwriting, approval/denial, formal pricing, and funding. Do not submit borrower records or use internal partner development as a lending decision.

See [guardrails](../../knowledge/partner-objection-response-guardrails.md), [workflow](../../workflows/no-auth-partner-objection-response-workflow.md), [templates](../../templates/partner-objection-response-templates.md), and [testing checklist](../../docs/partner-objection-response-testing-checklist.md).
