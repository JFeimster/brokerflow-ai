/**
 * BrokerFlow AI - Score Borrower Readiness API
 * Expected endpoint: POST /api/no-auth/score-borrower-readiness
 */

import {
  complianceNotice,
  enforceSharedSecret,
  forwardLeadEvent,
  makeId,
  normalizeLead,
  scoreReadiness,
  sendJson,
  validateBaseLead
} from "./_lead-intake-utils.js";

const REQUIRED_FIELDS = ["source", "action_type", "borrower_type", "loan_purpose", "requested_amount", "state"];

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
      expectedActionType: "score_borrower_readiness"
    });

    if (validationError) return sendJson(res, 400, { success: false, ...validationError });

    const normalized_lead = normalizeLead(body);
    const readiness = scoreReadiness(normalized_lead);
    const readiness_id = makeId("brs");

    const payload = {
      success: true,
      readiness_id,
      received_at: new Date().toISOString(),
      action_type: "score_borrower_readiness",
      normalized_lead,
      compliance_notice: complianceNotice(),
      ...readiness,
      next_step: readiness.readiness_tier === "incomplete" ? "collect_missing_information" : "continue_to_lender_fit_routing"
    };

    await forwardLeadEvent(payload);

    return sendJson(res, 200, {
      success: true,
      readiness_id,
      readiness_score: payload.readiness_score,
      readiness_tier: payload.readiness_tier,
      category_scores: payload.category_scores,
      strengths: payload.strengths,
      risks: payload.risks,
      missing_information: payload.missing_information,
      critical_missing_information: payload.critical_missing_information,
      next_step: payload.next_step
    });
  } catch (error) {
    console.error("Score borrower readiness error:", error);
    return sendJson(res, 500, {
      success: false,
      error: "server_error",
      message: "Unable to score borrower readiness."
    });
  }
}
