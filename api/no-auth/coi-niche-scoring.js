import { randomUUID } from "node:crypto";

const SOURCES = ["custom_gpt", "website", "internal_tool", "webhook_test"];
const ENUMS = {
  client_access_level: ["indirect", "direct", "broad", "unknown"],
  funding_trigger_frequency: ["rare", "occasional", "frequent", "very_frequent", "unknown"],
  trust_authority_level: ["informational", "advisory", "decision_influencer", "primary_advisor", "unknown"],
  repeat_referral_potential: ["one_time", "occasional", "recurring", "high_volume", "unknown"],
  relationship_strength: ["cold", "aware", "engaged", "strong", "unknown"],
  niche_fit: ["limited", "moderate", "strong", "unknown"],
  urgency_signals: ["none", "emerging", "time_sensitive", "urgent", "unknown"]
};
const VALUES = {
  client_access_level: { indirect: 40, direct: 75, broad: 100, unknown: 25 },
  funding_trigger_frequency: { rare: 20, occasional: 45, frequent: 75, very_frequent: 100, unknown: 25 },
  trust_authority_level: { informational: 25, advisory: 50, decision_influencer: 75, primary_advisor: 100, unknown: 25 },
  relationship_strength: { cold: 20, aware: 45, engaged: 75, strong: 100, unknown: 25 },
  repeat_referral_potential: { one_time: 20, occasional: 50, recurring: 80, high_volume: 100, unknown: 25 },
  niche_fit: { limited: 25, moderate: 65, strong: 100, unknown: 40 },
  urgency_signals: { none: 0, emerging: 35, time_sensitive: 70, urgent: 100, unknown: 25 }
};
const WEIGHTS = { client_access_score: 20, funding_trigger_score: 20, trust_authority_score: 20, repeat_referral_score: 15, niche_fit_score: 15, urgency_score: 10 };
const STRONG_FIT_CATEGORIES = ["accountant_cpa", "bookkeeper", "tax_advisor", "small_business_attorney", "attorney", "business_broker", "commercial_real_estate", "fractional_cfo"];

function sendJson(res, status, body) {
  res.setHeader("Content-Type", "application/json");
  return res.status(status).json(body);
}

function validate(body) {
  const required = ["source", "action_type", "company_name", "partner_category", "niche", "client_access_level", "funding_trigger_frequency", "trust_authority_level", "repeat_referral_potential", "relationship_strength", "urgency_signals"];
  for (const field of required) if (body[field] === undefined || body[field] === null || body[field] === "") return `${field} is required.`;
  if (!SOURCES.includes(body.source)) return `source must be one of: ${SOURCES.join(", ")}.`;
  if (body.action_type !== "coi_niche_scoring") return "action_type must be coi_niche_scoring.";
  for (const [field, values] of Object.entries(ENUMS)) if (body[field] !== undefined && !values.includes(body[field])) return `${field} must be one of: ${values.join(", ")}.`;
  for (const field of ["company_name", "partner_category", "niche"]) if (typeof body[field] !== "string" || body[field].trim().length > 200) return `${field} must be a non-empty string of at most 200 characters.`;
  if (body.notes !== undefined && (typeof body.notes !== "string" || body.notes.length > 4000)) return "notes must be a string of at most 4000 characters.";
  if (body.geographic_focus !== undefined && (typeof body.geographic_focus !== "string" || body.geographic_focus.length > 300)) return "geographic_focus must be a string of at most 300 characters.";
  return null;
}

export function scoreProspect(body) {
  const niche_fit = body.niche_fit || (STRONG_FIT_CATEGORIES.includes(body.partner_category) ? "strong" : "moderate");
  const relationship = VALUES.relationship_strength[body.relationship_strength];
  const score_breakdown = {
    client_access_score: VALUES.client_access_level[body.client_access_level],
    funding_trigger_score: VALUES.funding_trigger_frequency[body.funding_trigger_frequency],
    trust_authority_score: Math.round(VALUES.trust_authority_level[body.trust_authority_level] * 0.7 + relationship * 0.3),
    repeat_referral_score: Math.round(VALUES.repeat_referral_potential[body.repeat_referral_potential] * 0.8 + relationship * 0.2),
    niche_fit_score: VALUES.niche_fit[niche_fit],
    urgency_score: VALUES.urgency_signals[body.urgency_signals]
  };
  const overall_partner_score = Math.round(Object.entries(score_breakdown).reduce((total, [key, value]) => total + value * WEIGHTS[key], 0) / 100);
  const recommended_priority = overall_partner_score >= 85 && body.urgency_signals === "urgent" ? "urgent" : overall_partner_score >= 70 ? "high" : overall_partner_score >= 45 ? "normal" : "low";
  let recommended_next_step;
  if (body.relationship_strength === "cold" || body.relationship_strength === "unknown") recommended_next_step = "research_public_business_information";
  else if (recommended_priority === "high" || recommended_priority === "urgent") recommended_next_step = "schedule_partner_discovery";
  else if (body.relationship_strength === "strong" || body.relationship_strength === "engaged") recommended_next_step = "prepare_personalized_partner_outreach";
  else recommended_next_step = "continue_relationship_nurture";
  const category = body.partner_category.toLowerCase();
  const recommended_outreach_angle = /account|bookkeep|tax|cfo|finance/.test(category)
    ? "Offer a brief exchange on business cash-flow questions and funding readiness resources for the clients they serve."
    : /broker|real_estate|franchise/.test(category)
      ? "Explore how neutral business-funding education could support owners evaluating a purchase, expansion, or transition."
      : "Explore whether practical small-business funding education would be useful to the owners in their network.";
  return { overall_partner_score, recommended_priority, score_breakdown, recommended_outreach_angle, recommended_next_step };
}

async function forward(payload) {
  const url = process.env.COI_NICHE_SCORING_WEBHOOK_URL;
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
  if (process.env.COI_NICHE_SCORING_SHARED_SECRET && body.shared_secret !== process.env.COI_NICHE_SCORING_SHARED_SECRET) return sendJson(res, 400, { success: false, error: "validation_error", message: "Invalid or missing shared_secret." });
  const error = validate(body);
  if (error) return sendJson(res, 400, { success: false, error: "validation_error", message: error });
  const scoring_id = `coi_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const scoring = scoreProspect(body);
  const payload = {
    success: true, scoring_id, status: "partner_development_scored", received_at: new Date().toISOString(),
    source: body.source, action_type: body.action_type, prospect_id: body.prospect_id || null,
    company_name: body.company_name.trim(), partner_category: body.partner_category, niche: body.niche.trim(),
    client_access_level: body.client_access_level, funding_trigger_frequency: body.funding_trigger_frequency,
    trust_authority_level: body.trust_authority_level, repeat_referral_potential: body.repeat_referral_potential,
    relationship_strength: body.relationship_strength, niche_fit: body.niche_fit || (STRONG_FIT_CATEGORIES.includes(body.partner_category) ? "strong" : "moderate"),
    urgency_signals: body.urgency_signals, geographic_focus: body.geographic_focus || null,
    notes: body.notes || null, ...scoring,
    score_notice: "This score is an internal partner-development prioritization score. It is not a borrower credit score, underwriting model, qualification score, or lending decision."
  };
  try {
    await forward(payload);
    return sendJson(res, 200, { success: true, scoring_id, ...scoring, message: "Internal partner-development score calculated; no borrower or lending decision was made." });
  } catch {
    return sendJson(res, 502, { success: false, error: "forwarding_failed", message: "Scoring completed, but the configured automation webhook could not accept the result. Retry later." });
  }
}
