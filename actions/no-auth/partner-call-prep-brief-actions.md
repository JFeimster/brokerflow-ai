# Partner Meeting / Call Prep Brief

**Operation ID:** `createPartnerCallPrepBrief`

**Endpoint:** `POST https://brokerflow-ai.vercel.app/api/no-auth/partner-call-prep-brief`

**Canonical schema:** [`schemas/no-auth-partner-call-prep-brief.schema.yaml`](../../schemas/no-auth-partner-call-prep-brief.schema.yaml)

**Authentication:** No GPT Action auth; optional body secret.

Prepare a category-specific, 20-minute internal meeting brief. Caller-provided context is labeled unverified and kept separate from suggested client audiences, triggers, objections, and opportunities. No external records or partner performance figures are inferred.

## Input contract

Required: `source`, `action_type`, `company_name`, `partner_category`, `meeting_goal`, `relationship_stage`.

Optional: `notes`, `shared_secret`, `partner_id`, `prospect_id`, `partner_name`, `niche`, `known_context`, `likely_client_base`, `geographic_focus`, `recent_activity`.

Only documented fields are accepted. Required text must contain non-whitespace characters. Optional strings may be empty but cannot be null, objects, or arrays. Text lengths are enforced as specified in the schema. The `action_type` must be `partner_call_prep_brief`.

- `source`: `custom_gpt`, `website`, `internal_tool`, `webhook_test`.
- `partner_category`: `accountant_cpa`, `bookkeeper`, `tax_advisor`, `attorney`, `small_business_attorney`, `business_broker`, `commercial_real_estate`, `merchant_services`, `payroll_provider`, `fractional_cfo`, `equipment_vendor`, `insurance_agent`, `franchise_consultant`, `local_business_association`, `industry_consultant`, `ecommerce_consultant`, `restaurant_consultant`, `construction_consultant`, `trucking_logistics_consultant`, `healthcare_practice_consultant`, `other`.
- `relationship_stage`: `cold`, `aware`, `warm`, `existing_relationship`, `former_partner`, `inactive_partner`.
- `meeting_goal`: `initial_discovery`, `partner_program_pitch`, `relationship_development`, `referral_strategy`, `reactivation`, `co_marketing`, `performance_review`, `issue_resolution`.

Use Batch 1 category identifiers; both `attorney` and `small_business_attorney` are accepted. Batch 2 uses `relationship_stage`: map Batch 1 `engaged` to `warm` and `strong` to `existing_relationship` only when the context supports that mapping. Resolve `unknown` rather than assuming a prior relationship.

## Vercel environment variables

- `PARTNER_CALL_PREP_WEBHOOK_URL`: optional destination for the generated internal event.
- `PARTNER_CALL_PREP_SHARED_SECRET`: optional inbound body check; wrong or missing secrets return 400, matching Batch 1.
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
  "action_type": "partner_call_prep_brief",
  "partner_name": "Alex",
  "prospect_id": "cpp_example",
  "niche": "local service businesses",
  "meeting_goal": "initial_discovery",
  "known_context": "Synthetic example: an introductory conversation is planned.",
  "likely_client_base": "Local service business owners",
  "geographic_focus": "Western New York"
}
```

HTTP 200:

```json
{
  "success": true,
  "brief_id": "pcb_20261007_11111111-2222-4333-8444-555555555555",
  "partner_profile": {
    "partner_id": null,
    "prospect_id": "cpp_example",
    "partner_name": "Alex",
    "company_name": "Example Advisory",
    "partner_category": "accountant_cpa",
    "niche": "local service businesses",
    "relationship_stage": "cold",
    "geographic_focus": "Western New York",
    "known_context": "Synthetic example: an introductory conversation is planned.",
    "recent_activity": null,
    "notes": null,
    "information_basis": "caller_provided_unverified"
  },
  "likely_client_base": {
    "provided": "Local service business owners",
    "suggested_to_verify": "Business owners seeking accounting, tax, bookkeeping, or financial advice"
  },
  "funding_triggers_to_discuss": [
    "Cash-flow gaps",
    "Tax obligations",
    "Expansion funding",
    "Seasonal working-capital needs"
  ],
  "recommended_pitch_angle": "Explore funding-readiness education while preserving client trust and the advisor's role.",
  "questions_to_ask": [
    "Which client needs should we understand first?",
    "When do clients raise cash-flow or tax-timing questions?",
    "What would protect client trust during an introduction?",
    "Does the supplied niche (local service businesses) reflect the clients you want to serve?",
    "What local needs or constraints should we verify in Western New York?"
  ],
  "objections_to_expect": [
    "client_relationship_risk",
    "do_not_want_financing_role"
  ],
  "cross_referral_opportunities": [
    "Explore permission-based introductions for bookkeeping or planning support."
  ],
  "meeting_agenda": [
    {
      "minutes": 3,
      "topic": "Introductions and permission to explore a relationship"
    },
    {
      "minutes": 5,
      "topic": "Understand the partner's audience and priorities"
    },
    {
      "minutes": 5,
      "topic": "Discuss suggested category topics and verify their relevance"
    },
    {
      "minutes": 4,
      "topic": "Agree on roles, controlled communications, and confidentiality expectations"
    },
    {
      "minutes": 3,
      "topic": "Confirm a next step, owner, and timing"
    }
  ],
  "recommendation_notice": "Talking points, possible objections, and opportunities are category-based suggestions, not verified facts about this partner or its clients. Supplied context is unverified; no external records were retrieved.",
  "recommended_next_step": "document_partner_needs_and_contact_preferences",
  "message": "Internal partner meeting brief prepared. No meeting was scheduled and no borrower decision was made.",
  "webhook_status": "not_configured"
}
```

Errors use `success: false`, `error`, and `message`: 400 validation/secret failure, 405 unsupported method with `Allow: POST`, 500 generation failure, 502 unconfirmed webhook delivery. The schema documents all response bodies.

## Curl tests

Run against a configured preview or deployment after this PR is deployed. These examples do not claim the production route is already live. In PowerShell use `curl.exe` and shell-appropriate quoting.

```sh
curl -X POST 'https://brokerflow-ai.vercel.app/api/no-auth/partner-call-prep-brief' \
  -H 'Content-Type: application/json' \
  -d '{"source":"webhook_test","company_name":"Example Advisory","partner_category":"accountant_cpa","relationship_stage":"cold","action_type":"partner_call_prep_brief","partner_name":"Alex","prospect_id":"cpp_example","niche":"local service businesses","meeting_goal":"initial_discovery","known_context":"Synthetic example: an introductory conversation is planned.","likely_client_base":"Local service business owners","geographic_focus":"Western New York"}'

# 405
curl -i 'https://brokerflow-ai.vercel.app/api/no-auth/partner-call-prep-brief'

# 400
curl -i -X POST 'https://brokerflow-ai.vercel.app/api/no-auth/partner-call-prep-brief' -H 'Content-Type: application/json' -d '{}'
```

When the inbound secret is configured, include `shared_secret` through the authorized caller's secret configuration. Never put real secrets in committed examples or logs.

## Automation and limits

Routine drafts, campaign routing, workflow triggers, and internal tasks can run automatically. Downstream outreach must use existing authorization, contact preferences, channel permissions, and suppression rules. The handler itself does not deliver partner-facing messages. Do not turn every draft into a human-review queue.

Reserve stronger authorization or review for legal/compliance ambiguity, actual compensation commitments, payouts, private-record access, lender submission, underwriting, approval/denial, formal pricing, and funding. Do not submit borrower records or use internal partner development as a lending decision.

See [guardrails](../../knowledge/partner-call-prep-brief-guardrails.md), [workflow](../../workflows/no-auth-partner-call-prep-brief-workflow.md), [templates](../../templates/partner-call-prep-brief-template.md), and [testing checklist](../../docs/partner-call-prep-brief-testing-checklist.md).
