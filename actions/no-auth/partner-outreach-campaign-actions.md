# Partner Outreach Campaign Builder

**Operation ID:** `createPartnerOutreachCampaign`

**Endpoint:** `POST https://brokerflow-ai.vercel.app/api/no-auth/partner-outreach-campaign`

**Canonical schema:** [`schemas/no-auth-partner-outreach-campaign.schema.yaml`](../../schemas/no-auth-partner-outreach-campaign.schema.yaml)

**Authentication:** No GPT Action auth; optional body secret.

Generate deterministic outreach copy and a campaign route from partner category, audience, relationship stage, goal, tone, and channel. Notes may select a controlled educational topic (inventory, cash flow, transactions, or growth); their text remains labeled internal context and is never treated as proof or copied verbatim into outreach.

## Input contract

Required: `source`, `action_type`, `company_name`, `partner_category`, `niche`, `target_client_type`, `relationship_stage`, `outreach_goal`, `tone`, `channel`.

Optional: `notes`, `shared_secret`, `prospect_id`, `contact_name`, `geographic_focus`.

Only documented fields are accepted. Required text must contain non-whitespace characters. Optional strings may be empty but cannot be null, objects, or arrays. Text lengths are enforced as specified in the schema. The `action_type` must be `partner_outreach_campaign`.

- `source`: `custom_gpt`, `website`, `internal_tool`, `webhook_test`.
- `partner_category`: `accountant_cpa`, `bookkeeper`, `tax_advisor`, `attorney`, `small_business_attorney`, `business_broker`, `commercial_real_estate`, `merchant_services`, `payroll_provider`, `fractional_cfo`, `equipment_vendor`, `insurance_agent`, `franchise_consultant`, `local_business_association`, `industry_consultant`, `ecommerce_consultant`, `restaurant_consultant`, `construction_consultant`, `trucking_logistics_consultant`, `healthcare_practice_consultant`, `other`.
- `relationship_stage`: `cold`, `aware`, `warm`, `existing_relationship`, `former_partner`, `inactive_partner`.
- `outreach_goal`: `initial_introduction`, `partner_program_invite`, `schedule_call`, `reactivate`, `request_referral_relationship`, `educational_touch`, `event_invitation`, `co_marketing`, `follow_up`.
- `tone`: `professional`, `friendly`, `consultative`, `concise`.
- `channel`: `email`, `linkedin`, `phone`, `sms`, `multi_channel`.

Use Batch 1 category identifiers; both `attorney` and `small_business_attorney` are accepted. Batch 2 uses `relationship_stage`: map Batch 1 `engaged` to `warm` and `strong` to `existing_relationship` only when the context supports that mapping. Resolve `unknown` rather than assuming a prior relationship.

## Vercel environment variables

- `PARTNER_OUTREACH_CAMPAIGN_WEBHOOK_URL`: optional destination for the generated internal event.
- `PARTNER_OUTREACH_CAMPAIGN_SHARED_SECRET`: optional inbound body check; wrong or missing secrets return 400, matching Batch 1.
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
  "action_type": "partner_outreach_campaign",
  "prospect_id": "cpp_example",
  "contact_name": "Alex",
  "niche": "local service businesses",
  "target_client_type": "business owners",
  "outreach_goal": "initial_introduction",
  "tone": "consultative",
  "channel": "email",
  "geographic_focus": "Western New York",
  "notes": "Synthetic example: prefers educational materials."
}
```

HTTP 200:

```json
{
  "success": true,
  "campaign_id": "poc_20261007_11111111-2222-4333-8444-555555555555",
  "campaign_type": "educational_introduction",
  "partner_segment": "professional_services_coi",
  "message_angle": "Protect the advisory relationship with useful funding education and a client-controlled introduction.",
  "email_subjects": [
    "A referral conversation for Example Advisory",
    "Funding education for local service businesses"
  ],
  "first_touch_message": "Hi Alex,\n\nI am reaching out to explore whether a funding-education connection could be useful.\n\nA possible discussion topic is supporting business owners in local service businesses (Western New York).\n\nA useful starting point could be funding education that preserves your advisory role and keeps the client in control of an introduction.\n\nWhich part of the client experience would you most want to protect?\n\nAny introduction should follow the client's permission and your communication preferences.\n\nWould a short introduction to our referral process be useful?",
  "follow_up_sequence": [
    {
      "step": 1,
      "delay_days": 3,
      "channel": "email",
      "message": "Following up on a possible referral conversation. Would a short introduction to our referral process be useful?"
    },
    {
      "step": 2,
      "delay_days": 7,
      "channel": "email",
      "message": "Should I close the loop for now, or is there a better time to reconnect?"
    }
  ],
  "call_notes": [
    "Ask permission to continue. I am reaching out to explore whether a funding-education connection could be useful. A possible discussion topic is supporting business owners in local service businesses (Western New York). Would a short introduction to our referral process be useful? Record contact preferences; do not request borrower records.",
    "Discuss professional services coi needs without assuming client demand.",
    "Agree on handoff ownership, confidentiality, and follow-up frequency."
  ],
  "linkedin_message": "Hi Alex, I am reaching out to explore whether a funding-education connection could be useful. Would a short introduction to our referral process be useful?",
  "personalization_context": {
    "company_name": "Example Advisory",
    "niche": "local service businesses",
    "target_client_type": "business owners",
    "geographic_focus": "Western New York",
    "notes": "Synthetic example: prefers educational materials.",
    "information_basis": "caller_provided_unverified"
  },
  "sequence_policy": "Suggested delays are measured from first touch. Stop on reply or opt-out; use only permitted channels and existing contact preferences.",
  "recommended_next_step": "share_referral_process_overview",
  "message": "Partner outreach draft and campaign route prepared. No outreach was sent by this handler.",
  "webhook_status": "not_configured"
}
```

Errors use `success: false`, `error`, and `message`: 400 validation/secret failure, 405 unsupported method with `Allow: POST`, 500 generation failure, 502 unconfirmed webhook delivery. The schema documents all response bodies.

## Curl tests

Run against a configured preview or deployment after this PR is deployed. These examples do not claim the production route is already live. In PowerShell use `curl.exe` and shell-appropriate quoting.

```sh
curl -X POST 'https://brokerflow-ai.vercel.app/api/no-auth/partner-outreach-campaign' \
  -H 'Content-Type: application/json' \
  -d '{"source":"webhook_test","company_name":"Example Advisory","partner_category":"accountant_cpa","relationship_stage":"cold","action_type":"partner_outreach_campaign","prospect_id":"cpp_example","contact_name":"Alex","niche":"local service businesses","target_client_type":"business owners","outreach_goal":"initial_introduction","tone":"consultative","channel":"email","geographic_focus":"Western New York","notes":"Synthetic example: prefers educational materials."}'

# 405
curl -i 'https://brokerflow-ai.vercel.app/api/no-auth/partner-outreach-campaign'

# 400
curl -i -X POST 'https://brokerflow-ai.vercel.app/api/no-auth/partner-outreach-campaign' -H 'Content-Type: application/json' -d '{}'
```

When the inbound secret is configured, include `shared_secret` through the authorized caller's secret configuration. Never put real secrets in committed examples or logs.

## Automation and limits

Routine drafts, campaign routing, workflow triggers, and internal tasks can run automatically. Downstream outreach must use existing authorization, contact preferences, channel permissions, and suppression rules. The handler itself does not deliver partner-facing messages. Do not turn every draft into a human-review queue.

Reserve stronger authorization or review for legal/compliance ambiguity, actual compensation commitments, payouts, private-record access, lender submission, underwriting, approval/denial, formal pricing, and funding. Do not submit borrower records or use internal partner development as a lending decision.

See [guardrails](../../knowledge/partner-outreach-campaign-guardrails.md), [workflow](../../workflows/no-auth-partner-outreach-campaign-workflow.md), [templates](../../templates/partner-outreach-email-templates.md), and [testing checklist](../../docs/partner-outreach-campaign-testing-checklist.md).
