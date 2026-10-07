import { randomUUID } from "node:crypto";

// Batch 1 category names are retained, including the signup attorney alias.
export const CATEGORIES = ["accountant_cpa", "bookkeeper", "tax_advisor", "attorney", "small_business_attorney", "business_broker", "commercial_real_estate", "merchant_services", "payroll_provider", "fractional_cfo", "equipment_vendor", "insurance_agent", "franchise_consultant", "local_business_association", "industry_consultant", "ecommerce_consultant", "restaurant_consultant", "construction_consultant", "trucking_logistics_consultant", "healthcare_practice_consultant", "other"];
export const RELATIONSHIP_STAGES = ["cold", "aware", "warm", "existing_relationship", "former_partner", "inactive_partner"];
export const TONES = ["professional", "friendly", "consultative", "concise"];
export const CHANNELS = ["email", "linkedin", "phone", "sms", "multi_channel"];
export const OUTREACH_GOALS = ["initial_introduction", "partner_program_invite", "schedule_call", "reactivate", "request_referral_relationship", "educational_touch", "event_invitation", "co_marketing", "follow_up"];
export const OBJECTIONS = ["client_relationship_risk", "spam_concern", "compensation_question", "compliance_question", "who_should_i_refer", "already_have_lender", "bank_only_clients", "do_not_want_financing_role", "too_busy", "need_more_information", "trust_concern", "other"];
export const MEETING_GOALS = ["initial_discovery", "partner_program_pitch", "relationship_development", "referral_strategy", "reactivation", "co_marketing", "performance_review", "issue_resolution"];

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
    if (typeof body[field] !== "string") return `${field} must be a string.`;
    if (rule.maxLength && [...body[field]].length > rule.maxLength) return `${field} exceeds its maximum length of ${rule.maxLength}.`;
    if (rule.enum && !rule.enum.includes(body[field])) return `${field} must be one of: ${rule.enum.join(", ")}.`;
    if (rule.const && body[field] !== rule.const) return `${field} must be ${rule.const}.`;
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
      .map((field) => [field, body[field].trim()]));
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
