/**
 * BrokerFlow AI - Classify Funding Scenario API
 * Expected endpoint: POST /api/no-auth/classify-funding-scenario
 */

import {
  classifyScenario,
  complianceNotice,
  detectMissingInformation,
  enforceSharedSecret,
  forwardLeadEvent,
  makeId,
  normalizeLead,
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
      expectedActionType: "classify_funding_scenario"
    });

    if (validationError) return sendJson(res, 400, { success: false, ...validationError });

    const normalized_lead = normalizeLead(body);
    const classification = classifyScenario(normalized_lead);
    const missing = detectMissingInformation(normalized_lead);
    const classification_id = makeId("cfs");

    const next_step = missing.critical_missing_information.length > 0
      ? "collect_missing_information"
      : classification.primary_route === "manual_exception"
        ? "manual_exception_review"
        : "continue_to_qualification_or_routing";

    const payload = {
      success: true,
      classification_id,
      received_at: new Date().toISOString(),
      action_type: "classify_funding_scenario",
      normalized_lead,
      scenario_type: classification.scenario_type,
      primary_route: classification.primary_route,
      secondary_routes: classification.secondary_routes,
      risk_flags: classification.risk_flags,
      routing_notes: classification.routing_notes,
      missing_information: missing.missing_information,
      critical_missing_information: missing.critical_missing_information,
      next_step,
      compliance_notice: complianceNotice()
    };

    await forwardLeadEvent(payload);

    return sendJson(res, 200, {
      success: true,
      classification_id,
      scenario_type: payload.scenario_type,
      primary_route: payload.primary_route,
      secondary_routes: payload.secondary_routes,
      risk_flags: payload.risk_flags,
      routing_notes: payload.routing_notes,
      missing_information: payload.missing_information,
      critical_missing_information: payload.critical_missing_information,
      next_step: payload.next_step
    });
  } catch (error) {
    console.error("Classify funding scenario error:", error);
    return sendJson(res, 500, {
      success: false,
      error: "server_error",
      message: "Unable to classify funding scenario."
    });
  }
}
