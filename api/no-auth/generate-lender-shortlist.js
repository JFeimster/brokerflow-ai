/**
 * BrokerFlow AI - Generate Lender Shortlist API
 * Expected endpoint: POST /api/no-auth/generate-lender-shortlist
 */

import {
  complianceNotice,
  enforceSharedSecret,
  forwardLenderRoutingEvent,
  generateShortlist,
  makeId,
  normalizeScenario,
  rankLenders,
  sendJson,
  validateScenario
} from "./_lender-routing-utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { success: false, error: "invalid_method", message: "Only POST requests are allowed." });
  }

  try {
    const body = req.body || {};
    const secretError = enforceSharedSecret(body);
    if (secretError) return sendJson(res, 400, { success: false, ...secretError });

    const validationError = validateScenario(body, "generate_lender_shortlist");
    if (validationError) return sendJson(res, 400, { success: false, ...validationError });

    const scenario = normalizeScenario(body);
    const shortlist_id = makeId("gls");
    const ranked_lenders = rankLenders(scenario, body.lender_options);
    const shortlistResult = generateShortlist(scenario, ranked_lenders, body.max_results || 3);

    const payload = {
      success: true,
      shortlist_id,
      received_at: new Date().toISOString(),
      action_type: "generate_lender_shortlist",
      scenario,
      ranked_lenders,
      ...shortlistResult,
      compliance_notice: complianceNotice(),
      next_step: shortlistResult.fallback_used ? "manual_review_shortlist" : "prepare_lender_submission_notes"
    };

    await forwardLenderRoutingEvent(payload);

    return sendJson(res, 200, {
      success: true,
      shortlist_id,
      shortlist: payload.shortlist,
      shortlist_count: payload.shortlist_count,
      fallback_used: payload.fallback_used,
      shortlist_strategy: payload.shortlist_strategy,
      next_step: payload.next_step
    });
  } catch (error) {
    console.error("Generate lender shortlist error:", error);
    return sendJson(res, 500, { success: false, error: "server_error", message: "Unable to generate lender shortlist." });
  }
}
