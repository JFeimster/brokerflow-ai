/**
 * BrokerFlow AI - Detect Missing Funding Info API
 * Expected endpoint: POST /api/no-auth/detect-missing-funding-info
 */

import {
  buildRecommendedQuestions,
  complianceNotice,
  detectMissingInformation,
  enforceSharedSecret,
  forwardLeadEvent,
  makeId,
  normalizeLead,
  sendJson,
  validateBaseLead
} from "./_lead-intake-utils.js";

const REQUIRED_FIELDS = ["source", "action_type"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, {
      success: false,
      error: "invalid_method",
      message: "Only POST requests are allowed."
    });
  }

  try {
    const body = req.body || {};
    const secretError = enforceSharedSecret(body);
    if (secretError) return sendJson(res, 400, { success: false, ...secretError });

    const validationError = validateBaseLead(body, {
      requiredFields: REQUIRED_FIELDS,
      expectedActionType: "detect_missing_funding_info"
    });

    if (validationError) return sendJson(res, 400, { success: false, ...validationError });

    const normalized_lead = normalizeLead(body);
    const missing = detectMissingInformation(normalized_lead);
    const missing_info_id = makeId("mfi");
    const recommended_questions = buildRecommendedQuestions(missing.missing_information);
    const completeness_score = Math.max(0, 100 - missing.critical_missing_information.length * 18 - (missing.missing_information.length - missing.critical_missing_information.length) * 7);
    const next_step = missing.critical_missing_information.length > 0 ? "collect_critical_missing_information" : missing.missing_information.length > 0 ? "collect_optional_missing_information" : "continue_to_qualification";

    const payload = {
      success: true,
      missing_info_id,
      received_at: new Date().toISOString(),
      action_type: "detect_missing_funding_info",
      normalized_lead,
      missing_information: missing.missing_information,
      critical_missing_information: missing.critical_missing_information,
      recommended_questions,
      completeness_score,
      next_step,
      compliance_notice: complianceNotice()
    };

    await forwardLeadEvent(payload);

    return sendJson(res, 200, {
      success: true,
      missing_info_id,
      missing_information: payload.missing_information,
      critical_missing_information: payload.critical_missing_information,
      recommended_questions: payload.recommended_questions,
      completeness_score: payload.completeness_score,
      next_step: payload.next_step
    });
  } catch (error) {
    console.error("Detect missing funding info error:", error);
    return sendJson(res, 500, {
      success: false,
      error: "server_error",
      message: "Unable to detect missing funding information."
    });
  }
}
