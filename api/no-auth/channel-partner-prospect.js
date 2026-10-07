import { randomUUID } from "node:crypto";

const SOURCES = ["custom_gpt", "website", "internal_tool", "webhook_test"];
const CATEGORIES = ["accountant_cpa", "bookkeeper", "tax_advisor", "attorney", "business_broker", "commercial_real_estate", "merchant_services", "payroll_provider", "fractional_cfo", "equipment_vendor", "insurance_agent", "franchise_consultant", "local_business_association", "industry_consultant", "ecommerce_consultant", "restaurant_consultant", "construction_consultant", "trucking_logistics_consultant", "healthcare_practice_consultant", "other"];
const POTENTIAL = ["low", "medium", "high", "unknown"];
const RELATIONSHIPS = ["cold", "aware", "engaged", "strong", "unknown"];
const PRIORITIES = ["low", "normal", "high", "urgent"];

function sendJson(res, status, body) {
  res.setHeader("Content-Type", "application/json");
  return res.status(status).json(body);
}

function validate(body) {
  const required = ["source", "action_type", "company_name", "contact_name", "partner_category", "niche", "target_client_type", "estimated_referral_potential", "relationship_strength"];
  for (const field of required) if (body[field] === undefined || body[field] === null || body[field] === "") return `${field} is required.`;
  if (!SOURCES.includes(body.source)) return `source must be one of: ${SOURCES.join(", ")}.`;
  if (body.action_type !== "channel_partner_prospect") return "action_type must be channel_partner_prospect.";
  if (!CATEGORIES.includes(body.partner_category)) return `partner_category must be one of: ${CATEGORIES.join(", ")}.`;
  if (!POTENTIAL.includes(body.estimated_referral_potential)) return `estimated_referral_potential must be one of: ${POTENTIAL.join(", ")}.`;
  if (!RELATIONSHIPS.includes(body.relationship_strength)) return `relationship_strength must be one of: ${RELATIONSHIPS.join(", ")}.`;
  if (body.outreach_priority !== undefined && !PRIORITIES.includes(body.outreach_priority)) return `outreach_priority must be one of: ${PRIORITIES.join(", ")}.`;
  for (const field of ["company_name", "contact_name", "niche", "target_client_type"]) if (typeof body[field] !== "string" || body[field].trim().length > 200) return `${field} must be a non-empty string of at most 200 characters.`;
  for (const field of ["website", "linkedin_url"]) if (body[field] !== undefined && !isHttpUrl(body[field])) return `${field} must be a valid HTTP or HTTPS URL.`;
  for (const field of ["notes", "next_step"]) if (body[field] !== undefined && (typeof body[field] !== "string" || body[field].length > 4000)) return `${field} must be a string of at most 4000 characters.`;
  return null;
}

function isHttpUrl(value) {
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}

export function classifyProspect(body) {
  const potentialPoints = { low: 0, medium: 1, high: 2, unknown: 0 }[body.estimated_referral_potential];
  const relationshipPoints = { cold: 0, aware: 1, engaged: 2, strong: 3, unknown: 0 }[body.relationship_strength];
  const categoryPoints = ["accountant_cpa", "bookkeeper", "tax_advisor", "business_broker", "commercial_real_estate", "fractional_cfo"].includes(body.partner_category) ? 1 : 0;
  const priorityPoints = potentialPoints + relationshipPoints + categoryPoints;
  let recommended_priority = priorityPoints >= 5 ? "high" : priorityPoints >= 2 ? "normal" : "low";
  if (body.outreach_priority === "urgent") recommended_priority = "urgent";
  else if (body.outreach_priority === "high" && recommended_priority === "low") recommended_priority = "high";
  let recommended_next_step;
  if (body.relationship_strength === "cold" || body.relationship_strength === "unknown") recommended_next_step = "research_public_business_information";
  else if (recommended_priority === "urgent" || recommended_priority === "high") recommended_next_step = "prepare_personalized_partner_outreach";
  else if (body.relationship_strength === "strong") recommended_next_step = "schedule_discovery_conversation";
  else recommended_next_step = "continue_relationship_nurture";
  return { recommended_priority, recommended_next_step };
}

async function forward(payload) {
  const url = process.env.CHANNEL_PARTNER_PROSPECT_WEBHOOK_URL;
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
  if (process.env.CHANNEL_PARTNER_PROSPECT_SHARED_SECRET && body.shared_secret !== process.env.CHANNEL_PARTNER_PROSPECT_SHARED_SECRET) return sendJson(res, 400, { success: false, error: "validation_error", message: "Invalid or missing shared_secret." });
  const error = validate(body);
  if (error) return sendJson(res, 400, { success: false, error: "validation_error", message: error });
  const prospect_id = `cpp_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const classification = classifyProspect(body);
  const payload = {
    success: true, prospect_id, status: "prospect_captured", received_at: new Date().toISOString(),
    source: body.source, action_type: body.action_type, company_name: body.company_name.trim(),
    contact_name: body.contact_name.trim(), partner_category: body.partner_category, niche: body.niche.trim(),
    target_client_type: body.target_client_type.trim(), estimated_referral_potential: body.estimated_referral_potential,
    relationship_strength: body.relationship_strength, outreach_priority: body.outreach_priority || "normal",
    city: body.city || null, state: body.state || null, website: body.website || null,
    linkedin_url: body.linkedin_url || null, notes: body.notes || null,
    submitted_next_step: body.next_step || null, ...classification
  };
  try {
    await forward(payload);
    return sendJson(res, 200, { success: true, prospect_id, status: "prospect_captured", partner_category: body.partner_category, ...classification, message: "Prospect captured and prioritized for internal business-development follow-up." });
  } catch {
    return sendJson(res, 502, { success: false, error: "forwarding_failed", message: "Prospect validation succeeded, but the configured automation webhook could not accept it. Retry later." });
  }
}
