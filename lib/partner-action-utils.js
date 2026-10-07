import { randomUUID } from "node:crypto";

// Batch 1 category names are retained, including the signup attorney alias.
export const CATEGORIES = ["accountant_cpa", "bookkeeper", "tax_advisor", "attorney", "small_business_attorney", "business_broker", "commercial_real_estate", "merchant_services", "payroll_provider", "fractional_cfo", "equipment_vendor", "insurance_agent", "franchise_consultant", "local_business_association", "industry_consultant", "ecommerce_consultant", "restaurant_consultant", "construction_consultant", "trucking_logistics_consultant", "healthcare_practice_consultant", "other"];
export const RELATIONSHIP_STAGES = ["cold", "aware", "warm", "existing_relationship", "former_partner", "inactive_partner"];
export const TONES = ["professional", "friendly", "consultative", "concise"];
export const CHANNELS = ["email", "linkedin", "phone", "sms", "multi_channel"];
export const OUTREACH_GOALS = ["initial_introduction", "partner_program_invite", "schedule_call", "reactivate", "request_referral_relationship", "educational_touch", "event_invitation", "co_marketing", "follow_up"];
export const OBJECTIONS = ["client_relationship_risk", "spam_concern", "compensation_question", "compliance_question", "who_should_i_refer", "already_have_lender", "bank_only_clients", "do_not_want_financing_role", "too_busy", "need_more_information", "trust_concern", "other"];
export const MEETING_GOALS = ["initial_discovery", "partner_program_pitch", "relationship_development", "referral_strategy", "reactivation", "co_marketing", "performance_review", "issue_resolution"];
export const REFERRAL_MODELS = ["direct_referral", "affiliate_link", "warm_introduction", "channel_referral", "co_marketing", "embedded_partner", "unknown"];
export const COMPENSATION_MODELS = ["none", "flat_referral_fee", "percentage_based", "case_by_case", "non_compensated_coi", "unknown"];
export const ONBOARDING_STATUSES = ["not_started", "in_progress", "blocked", "completed"];
export const ONBOARDING_ITEMS = ["profile_setup", "referral_link_setup", "commission_terms", "training_materials", "approved_messaging", "compliance_disclosures", "crm_tags", "first_referral_steps", "co_marketing_assets", "client_introduction_process", "funding_trigger_guide", "confidentiality_expectations", "partner_contact_preferences", "attribution_process", "intake_workflow", "lead_routing_rules", "partner_status_expectations", "technical_handoff_details", "escalation_path"];
export const CONTENT_TYPES = ["referral_cheat_sheet", "funding_trigger_guide", "conversation_script", "email_template", "linkedin_template", "faq", "one_pager", "training_outline", "call_script", "partner_playbook", "objection_guide", "educational_article"];
export const CONTENT_FORMATS = ["short_form", "long_form", "bullet_guide", "email", "script", "one_page", "faq", "training_module", "presentation_outline"];
export const REACTIVATION_SEGMENTS = ["signed_up_no_referrals", "inactive_30_days", "inactive_60_days", "inactive_90_days", "high_value_dormant_partner", "prospect_never_contacted", "prospect_contacted_no_response", "former_active_partner", "event_follow_up", "seasonal_reactivation"];

const textField = (maxLength = 200) => ({ type: "string", maxLength });
const enumField = (values) => ({ type: "string", enum: values });
const common = {
  source: enumField(["custom_gpt", "website", "internal_tool", "webhook_test"]),
  company_name: textField(),
  partner_category: enumField(CATEGORIES),
  relationship_stage: enumField(RELATIONSHIP_STAGES),
  notes: textField(4000),
  shared_secret: { ...textField(500), writeOnly: true }
};

export const ACTIONS = {
  campaign: {
    actionType: "partner_outreach_campaign", env: "PARTNER_OUTREACH_CAMPAIGN", id: "campaign_id", prefix: "poc",
    required: ["source", "action_type", "company_name", "partner_category", "niche", "target_client_type", "relationship_stage", "outreach_goal", "tone", "channel"],
    fields: { ...common, action_type: { type: "string", const: "partner_outreach_campaign" }, prospect_id: textField(), contact_name: textField(160), niche: textField(160), target_client_type: textField(160), outreach_goal: enumField(OUTREACH_GOALS), tone: enumField(TONES), channel: enumField(CHANNELS), geographic_focus: textField(300) }
  },
  objection: {
    actionType: "partner_objection_response", env: "PARTNER_OBJECTION_RESPONSE", id: "response_id", prefix: "por",
    required: ["source", "action_type", "company_name", "partner_category", "objection_type", "objection_text", "relationship_stage", "desired_tone", "response_channel"],
    fields: { ...common, action_type: { type: "string", const: "partner_objection_response" }, contact_name: textField(160), objection_type: enumField(OBJECTIONS), objection_text: textField(4000), desired_tone: enumField(TONES), response_channel: enumField(CHANNELS.filter((channel) => channel !== "multi_channel")) }
  },
  brief: {
    actionType: "partner_call_prep_brief", env: "PARTNER_CALL_PREP", id: "brief_id", prefix: "pcb",
    required: ["source", "action_type", "company_name", "partner_category", "meeting_goal", "relationship_stage"],
    fields: { ...common, action_type: { type: "string", const: "partner_call_prep_brief" }, partner_id: textField(), prospect_id: textField(), partner_name: textField(160), niche: textField(160), meeting_goal: enumField(MEETING_GOALS), known_context: textField(4000), likely_client_base: textField(1000), geographic_focus: textField(300), recent_activity: textField(4000) }
  },
  onboarding: {
    actionType: "partner_onboarding_checklist", env: "PARTNER_ONBOARDING_CHECKLIST", id: "onboarding_checklist_id", prefix: "pon", required: ["source", "action_type", "partner_type"],
    fields: { source: common.source, action_type: { type: "string", const: "partner_onboarding_checklist" }, partner_id: textField(), partner_name: textField(160), company_name: textField(), partner_type: enumField(["professional_services_coi", "affiliate", "channel_partner", "embedded_partner", "referral_partner", "other"]), business_type: textField(160), state: textField(80), referral_model: enumField(REFERRAL_MODELS), compensation_model: enumField(COMPENSATION_MODELS), training_required: { type: "boolean" }, approved_messaging_required: { type: "boolean" }, crm_setup_required: { type: "boolean" }, current_onboarding_status: enumField(ONBOARDING_STATUSES), completed_items: { type: "array", maxItems: ONBOARDING_ITEMS.length, uniqueItems: true, items: enumField(ONBOARDING_ITEMS) }, notes: textField(4000), shared_secret: { ...textField(500), writeOnly: true } }
  },
  enablement: {
    actionType: "partner_enablement_content", env: "PARTNER_ENABLEMENT_CONTENT", id: "content_request_id", prefix: "pec", required: ["source", "action_type", "partner_category", "business_type", "content_type", "target_audience"],
    fields: { source: common.source, action_type: { type: "string", const: "partner_enablement_content" }, partner_id: textField(), partner_category: enumField(CATEGORIES), business_type: textField(160), content_type: enumField(CONTENT_TYPES), target_audience: textField(240), funding_product_focus: textField(300), tone: enumField(TONES), format: enumField(CONTENT_FORMATS), use_case: textField(1000), distribution_channel: enumField(CHANNELS), notes: textField(4000), shared_secret: { ...textField(500), writeOnly: true } }
  },
  reactivation: {
    actionType: "partner_reactivation", env: "PARTNER_REACTIVATION", id: "reactivation_id", prefix: "prx", required: ["source", "action_type", "reactivation_segment"],
    fields: { source: common.source, action_type: { type: "string", const: "partner_reactivation" }, partner_id: textField(), partner_name: textField(160), company_name: textField(), partner_category: enumField(CATEGORIES), reactivation_segment: enumField(REACTIVATION_SEGMENTS), last_activity_date: { type: "string", maxLength: 10, format: "date" }, last_referral_date: { type: "string", maxLength: 10, format: "date" }, relationship_strength: enumField(["new", "developing", "established", "high_value", "unknown"]), preferred_channel: enumField(CHANNELS), known_context: textField(2000), notes: textField(4000), shared_secret: { ...textField(500), writeOnly: true } }
  }
};

export function partnerSegment(category) {
  if (["accountant_cpa", "bookkeeper", "tax_advisor", "fractional_cfo", "attorney", "small_business_attorney", "insurance_agent"].includes(category)) return "professional_services_coi";
  if (["merchant_services", "payroll_provider", "equipment_vendor"].includes(category)) return "embedded_referral_channel";
  if (["business_broker", "commercial_real_estate", "franchise_consultant"].includes(category)) return "transaction_partner";
  return "business_network";
}

export function greeting(name, tone) {
  return `${tone === "professional" ? "Hello" : "Hi"}${name ? ` ${name}` : ""},`;
}

function validate(body, config) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "Request body must be a JSON object.";
  if (Object.keys(body).some((key) => !Object.hasOwn(config.fields, key))) return "Request contains unsupported fields.";
  for (const field of config.required) {
    if (typeof body[field] !== "string" || !body[field].trim()) return `${field} must be a non-empty string.`;
  }
  for (const [field, rule] of Object.entries(config.fields)) {
    if (body[field] === undefined) continue;
    if (rule.type === "array") {
      if (!Array.isArray(body[field])) return `${field} must be an array.`;
      if (rule.maxItems && body[field].length > rule.maxItems) return `${field} has too many items.`;
      if (rule.uniqueItems && new Set(body[field]).size !== body[field].length) return `${field} must not contain duplicates.`;
      if (rule.items?.enum) {
        for (const value of body[field]) if (typeof value !== "string" || !rule.items.enum.includes(value)) return `${field} contains an unsupported item.`;
      }
      continue;
    }
    if (rule.type === "boolean") {
      if (typeof body[field] !== "boolean") return `${field} must be a boolean.`;
      continue;
    }
    if (typeof body[field] !== "string") return `${field} must be a string.`;
    if (rule.maxLength && [...body[field]].length > rule.maxLength) return `${field} exceeds its maximum length of ${rule.maxLength}.`;
    if (rule.enum && !rule.enum.includes(body[field])) return `${field} must be one of: ${rule.enum.join(", ")}.`;
    if (rule.const && body[field] !== rule.const) return `${field} must be ${rule.const}.`;
    if (rule.format === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(body[field]) || Number.isNaN(Date.parse(`${body[field]}T00:00:00Z`)) || new Date(`${body[field]}T00:00:00Z`).toISOString().slice(0, 10) !== body[field])) return `${field} must be a valid YYYY-MM-DD date.`;
  }
  return null;
}

function sendJson(res, status, body) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(body);
}

export function createPartnerHandler(config, buildResult) {
  return async function handler(req, res) {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return sendJson(res, 405, { success: false, error: "invalid_method", message: "Only POST requests are allowed." });
    }
    const body = req.body;
    const expectedSecret = process.env[`${config.env}_SHARED_SECRET`];
    if (expectedSecret && body?.shared_secret !== expectedSecret) return sendJson(res, 400, { success: false, error: "validation_error", message: "Invalid or missing shared_secret." });
    const error = validate(body, config);
    if (error) return sendJson(res, 400, { success: false, error: "validation_error", message: error });
    // Explicit allowlist: neither the inbound secret nor arbitrary extra fields leave this handler.
    const input = Object.fromEntries(Object.keys(config.fields)
      .filter((field) => field !== "shared_secret" && body[field] !== undefined)
      .map((field) => [field, typeof body[field] === "string" ? body[field].trim() : Array.isArray(body[field]) ? body[field].map((value) => typeof value === "string" ? value.trim() : value) : body[field]]));
    const id = `${config.prefix}_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}_${randomUUID()}`;
    const tracking = { [config.id]: id };
    let result;
    try {
      result = { success: true, ...tracking, ...buildResult(input) };
    } catch {
      return sendJson(res, 500, { success: false, ...tracking, error: "generation_failed", message: "The partner-development draft could not be prepared." });
    }
    const url = process.env[`${config.env}_WEBHOOK_URL`];
    if (url) {
      try {
        const headers = { "Content-Type": "application/json" };
        if (process.env.WEBHOOK_SHARED_SECRET) headers["x-brokerflow-secret"] = process.env.WEBHOOK_SHARED_SECRET;
        const response = await fetch(url, {
          method: "POST", headers, redirect: "error", signal: AbortSignal.timeout(8000),
          body: JSON.stringify({ ...result, received_at: new Date().toISOString(), input })
        });
        if (!response.ok) throw new Error("forwarding_failed");
      } catch {
        return sendJson(res, 502, { success: false, ...tracking, error: "forwarding_failed", message: "Draft prepared, but webhook delivery could not be confirmed. Check downstream state before retrying." });
      }
    }
    return sendJson(res, 200, { ...result, webhook_status: url ? "forwarded" : "not_configured" });
  };
}
