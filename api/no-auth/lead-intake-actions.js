import {
  buildRecommendedQuestions,
  classifyScenario,
  complianceNotice,
  detectMissingInformation,
  enforceSharedSecret,
  forwardLeadEvent,
  makeId,
  normalizeLead,
  qualifyLead,
  scoreReadiness,
  sendJson,
  validateBaseLead
} from "./_lead-intake-utils.js";

const ACTIONS = new Set([
  "qualify_funding_lead",
  "score_borrower_readiness",
  "detect_missing_funding_info",
  "classify_funding_scenario",
  "normalize_broker_lead"
]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { success: false, error: "invalid_method", message: "Only POST requests are allowed." });
  }

  try {
    const body = req.body || {};
    const secretError = enforceSharedSecret(body);
    if (secretError) return sendJson(res, 400, { success: false, ...secretError });

    if (!ACTIONS.has(body.action_type)) {
      return sendJson(res, 400, { success: false, error: "validation_error", message: "Unsupported lead intake action_type." });
    }

    const validationError = validateBaseLead(body, { requiredFields: ["source", "action_type"], expectedActionType: body.action_type });
    if (validationError) return sendJson(res, 400, { success: false, ...validationError });

    const normalized_lead = normalizeLead(body);
    let payload;

    if (body.action_type === "qualify_funding_lead") {
      payload = { success: true, qualification_id: makeId("qfl"), received_at: new Date().toISOString(), action_type: body.action_type, normalized_lead, ...qualifyLead(normalized_lead), compliance_notice: complianceNotice() };
    }

    if (body.action_type === "score_borrower_readiness") {
      const readiness = scoreReadiness(normalized_lead);
      payload = { success: true, readiness_id: makeId("brs"), received_at: new Date().toISOString(), action_type: body.action_type, normalized_lead, ...readiness, next_step: readiness.readiness_tier === "incomplete" ? "collect_missing_information" : "continue_to_lender_fit_routing", compliance_notice: complianceNotice() };
    }

    if (body.action_type === "detect_missing_funding_info") {
      const missing = detectMissingInformation(normalized_lead);
      const completeness_score = Math.max(0, 100 - missing.critical_missing_information.length * 18 - (missing.missing_information.length - missing.critical_missing_information.length) * 7);
      payload = { success: true, missing_info_id: makeId("mfi"), received_at: new Date().toISOString(), action_type: body.action_type, normalized_lead, ...missing, recommended_questions: buildRecommendedQuestions(missing.missing_information), completeness_score, next_step: missing.critical_missing_information.length > 0 ? "collect_critical_missing_information" : "continue_to_qualification", compliance_notice: complianceNotice() };
    }

    if (body.action_type === "classify_funding_scenario") {
      const classification = classifyScenario(normalized_lead);
      const missing = detectMissingInformation(normalized_lead);
      payload = { success: true, classification_id: makeId("cfs"), received_at: new Date().toISOString(), action_type: body.action_type, normalized_lead, ...classification, ...missing, next_step: missing.critical_missing_information.length > 0 ? "collect_missing_information" : "continue_to_qualification_or_routing", compliance_notice: complianceNotice() };
    }

    if (body.action_type === "normalize_broker_lead") {
      const missing = detectMissingInformation(normalized_lead);
      payload = { success: true, normalized_lead_id: makeId("nbl"), received_at: new Date().toISOString(), action_type: body.action_type, normalized_lead, field_warnings: [], mapping_notes: ["Lead normalized into BrokerFlow canonical lead format."], ...missing, next_step: missing.critical_missing_information.length > 0 ? "collect_missing_information" : "continue_to_qualification", compliance_notice: complianceNotice() };
    }

    await forwardLeadEvent(payload);
    return sendJson(res, 200, payload);
  } catch (error) {
    console.error("Lead intake action router error:", error);
    return sendJson(res, 500, { success: false, error: "server_error", message: "Unable to process lead intake action." });
  }
}
