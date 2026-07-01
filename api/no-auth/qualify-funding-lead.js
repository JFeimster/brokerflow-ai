/**
 * BrokerFlow AI - Qualify Funding Lead API
 * Expected endpoint: POST /api/no-auth/qualify-funding-lead
 */

import {
  complianceNotice,
  enforceSharedSecret,
  forwardLeadEvent,
  makeId,
  normalizeLead,
  qualifyLead,
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
      expectedActionType: "qualify_funding_lead"
    });

    if (validationError) return sendJson(res, 400, { success: false, ...validationError });

    const normalized_lead = normalizeLead(body);
    const qualification = qualifyLead(normalized_lead);
    const qualification_id = makeId("qfl");

    const payload = {
      success: true,
      qualification_id,
      received_at: new Date().toISOString(),
      action_type: "qualify_funding_lead",
      normalized_lead,
      compliance_notice: complianceNotice(),
      ...qualification
    };

    await forwardLeadEvent(payload);

    return sendJson(res, 200, {
      success: true,
      qualification_id,
      qualified: qualification.qualified,
      qualification_tier: qualification.qualification_tier,
      qualification_score: qualification.qualification_score,
      primary_route: qualification.primary_route,
      secondary_routes: qualification.secondary_routes,
      reasons: qualification.reasons,
      disqualifiers: qualification.disqualifiers,
      missing_information: qualification.missing_information,
      critical_missing_information: qualification.critical_missing_information,
      next_step: qualification.next_step
    });
  } catch (error) {
    console.error("Qualify funding lead error:", error);
    return sendJson(res, 500, {
      success: false,
      error: "server_error",
      message: "Unable to qualify funding lead."
    });
  }
}
