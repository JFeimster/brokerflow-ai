import { randomUUID } from "node:crypto";

const SOURCES = ["custom_gpt", "website", "internal_tool", "webhook_test"];
const PARTNER_TYPES = ["affiliate", "referral_partner", "channel_partner", "strategic_partner", "broker_partner", "professional_services_partner", "unknown"];
const BUSINESS_TYPES = ["accountant_cpa", "bookkeeper", "tax_advisor", "small_business_attorney", "business_broker", "commercial_real_estate", "merchant_services", "payroll_provider", "fractional_cfo", "equipment_vendor", "insurance_agent", "franchise_consultant", "local_business_association", "industry_consultant", "ecommerce_consultant", "restaurant_consultant", "construction_consultant", "trucking_logistics_consultant", "healthcare_practice_consultant", "other"];
const CONTACT_METHODS = ["email", "phone", "text", "video_call", "no_preference"];

function sendJson(res, status, body) {
  res.setHeader("Content-Type", "application/json");
  return res.status(status).json(body);
}

function validate(body) {
  const required = ["source", "action_type", "partner_name", "email", "partner_type", "business_type", "compliance_acknowledged", "consent_to_contact"];
  for (const field of required) if (body[field] === undefined || body[field] === null || body[field] === "") return `${field} is required.`;
  if (!SOURCES.includes(body.source)) return `source must be one of: ${SOURCES.join(", ")}.`;
  if (body.action_type !== "affiliate_partner_signup") return "action_type must be affiliate_partner_signup.";
  if (!PARTNER_TYPES.includes(body.partner_type)) return `partner_type must be one of: ${PARTNER_TYPES.join(", ")}.`;
  if (!BUSINESS_TYPES.includes(body.business_type)) return `business_type must be one of: ${BUSINESS_TYPES.join(", ")}.`;
  if (typeof body.partner_name !== "string" || body.partner_name.trim().length > 160) return "partner_name must be a non-empty string of at most 160 characters.";
  if (typeof body.email !== "string" || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return "email must be a valid email address.";
  if (body.expected_referral_volume !== undefined && (!Number.isInteger(body.expected_referral_volume) || body.expected_referral_volume < 0 || body.expected_referral_volume > 100000)) return "expected_referral_volume must be an integer from 0 to 100000.";
  if (body.preferred_contact_method !== undefined && !CONTACT_METHODS.includes(body.preferred_contact_method)) return `preferred_contact_method must be one of: ${CONTACT_METHODS.join(", ")}.`;
  if (body.compliance_acknowledged !== true) return "compliance_acknowledged must be true.";
  if (body.consent_to_contact !== true) return "consent_to_contact must be true to create onboarding follow-up.";
  if (body.website !== undefined && !isHttpUrl(body.website)) return "website must be a valid HTTP or HTTPS URL.";
  for (const key of ["notes", "referral_experience", "primary_audience"]) if (body[key] !== undefined && (typeof body[key] !== "string" || body[key].length > 4000)) return `${key} must be a string of at most 4000 characters.`;
  return null;
}

function isHttpUrl(value) {
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}

export function classifySignup(body) {
  const volume = body.expected_referral_volume ?? 0;
  const knownType = body.partner_type !== "unknown";
  const partner_segment = knownType && volume >= 5 ? "high_potential_referral_partner" : volume >= 2 ? "developing_partner" : "general_partner_prospect";
  const onboarding_priority = volume >= 5 ? "high" : volume >= 2 ? "normal" : "low";
  const recommended_next_step = volume >= 5 ? "schedule_partner_discovery" : volume >= 2 ? "send_onboarding_information" : "review_partner_profile";
  return { partner_segment, onboarding_priority, recommended_next_step };
}

async function forward(payload) {
  const url = process.env.AFFILIATE_PARTNER_SIGNUP_WEBHOOK_URL;
  if (!url) return;
  const headers = { "Content-Type": "application/json" };
  const secret = process.env.WEBHOOK_SHARED_SECRET;
  if (secret) headers["x-brokerflow-secret"] = secret;
  const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error("webhook_forward_failed");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { success: false, error: "invalid_method", message: "Only POST requests are allowed." });
  }
  const body = req.body && typeof req.body === "object" ? req.body : {};
  if (process.env.AFFILIATE_PARTNER_SIGNUP_SHARED_SECRET && body.shared_secret !== process.env.AFFILIATE_PARTNER_SIGNUP_SHARED_SECRET) return sendJson(res, 400, { success: false, error: "validation_error", message: "Invalid or missing shared_secret." });
  const error = validate(body);
  if (error) return sendJson(res, 400, { success: false, error: "validation_error", message: error });
  const partner_signup_id = `aps_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const classification = classifySignup(body);
  const payload = {
    success: true, partner_signup_id, status: "received", received_at: new Date().toISOString(),
    source: body.source, action_type: body.action_type, partner_name: body.partner_name.trim(),
    company_name: body.company_name || null, email: body.email.trim(), phone: body.phone || null,
    partner_type: body.partner_type, business_type: body.business_type, website: body.website || null,
    state: body.state || null, primary_audience: body.primary_audience || null,
    expected_referral_volume: body.expected_referral_volume ?? null,
    preferred_contact_method: body.preferred_contact_method || "no_preference",
    referral_experience: body.referral_experience || null, compliance_acknowledged: true,
    consent_to_contact: true, notes: body.notes || null, ...classification,
    recommended_next_step: classification.recommended_next_step,
    onboarding_status: "followup_needed"
  };
  try {
    await forward(payload);
    return sendJson(res, 200, { success: true, partner_signup_id, status: "received", ...classification, message: "Partner signup captured for onboarding follow-up." });
  } catch {
    return sendJson(res, 502, { success: false, error: "forwarding_failed", message: "Signup validation succeeded, but the configured automation webhook could not accept it. Retry later." });
  }
}
