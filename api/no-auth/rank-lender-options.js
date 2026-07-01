/**
 * BrokerFlow AI - Rank Lender Options API
 * Expected endpoint: POST /api/no-auth/rank-lender-options
 */

import {
  complianceNotice,
  enforceSharedSecret,
  forwardLenderRoutingEvent,
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

    const validationError = validateScenario(body, "rank_lender_options");
    if (validationError) return sendJson(res, 400, { success: false, ...validationError });

    const scenario = normalizeScenario(body);
    const ranking_id = makeId("rlo");
    const ranked_lenders = rankLenders(scenario, body.lender_options);

    const payload = {
      success: true,
      ranking_id,
      received_at: new Date().toISOString(),
      action_type: "rank_lender_options",
      scenario,
      ranked_lenders,
      top_lender: ranked_lenders[0] || null,
      compliance_notice: complianceNotice(),
      next_step: ranked_lenders.length > 0 ? "review_top_ranked_options" : "manual_exception_review"
    };

    await forwardLenderRoutingEvent(payload);

    return sendJson(res, 200, {
      success: true,
      ranking_id,
      ranked_lenders,
      top_lender: payload.top_lender,
      next_step: payload.next_step
    });
  } catch (error) {
    console.error("Rank lender options error:", error);
    return sendJson(res, 500, { success: false, error: "server_error", message: "Unable to rank lender options." });
  }
}
