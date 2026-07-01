/**
 * BrokerFlow AI - Flag Manual Review Required API
 * Expected endpoint: POST /api/no-auth/flag-manual-review-required
 */

import {
  complianceNotice,
  enforceSharedSecret,
  flagManualReview,
  forwardLenderRoutingEvent,
  makeId,
  normalizeScenario,
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

    const validationError = validateScenario(body, "flag_manual_review_required");
    if (validationError) return sendJson(res, 400, { success: false, ...validationError });

    const scenario = normalizeScenario(body);
    const review_flag_id = makeId("mrr");
    const review = flagManualReview(scenario);

    const payload = {
      success: true,
      review_flag_id,
      received_at: new Date().toISOString(),
      action_type: "flag_manual_review_required",
      scenario,
      ...review,
      compliance_notice: complianceNotice()
    };

    await forwardLenderRoutingEvent(payload);

    return sendJson(res, 200, {
      success: true,
      review_flag_id,
      manual_review_required: payload.manual_review_required,
      review_priority: payload.review_priority,
      manual_review_flags: payload.manual_review_flags,
      review_queue: payload.review_queue,
      next_step: payload.next_step
    });
  } catch (error) {
    console.error("Flag manual review required error:", error);
    return sendJson(res, 500, { success: false, error: "server_error", message: "Unable to flag manual review requirement." });
  }
}
