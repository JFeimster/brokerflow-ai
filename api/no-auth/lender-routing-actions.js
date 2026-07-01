import {
  complianceNotice,
  enforceSharedSecret,
  flagManualReview,
  forwardLenderRoutingEvent,
  generateShortlist,
  makeId,
  normalizeScenario,
  rankLenders,
  sendJson,
  validateScenario
} from "./_lender-routing-utils.js";

const ACTIONS = new Set([
  "rank_lender_options",
  "generate_lender_shortlist",
  "flag_manual_review_required"
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
      return sendJson(res, 400, { success: false, error: "validation_error", message: "Unsupported lender routing action_type." });
    }

    const validationError = validateScenario(body, body.action_type);
    if (validationError) return sendJson(res, 400, { success: false, ...validationError });

    const scenario = normalizeScenario(body);
    let payload;

    if (body.action_type === "rank_lender_options") {
      const ranked_lenders = rankLenders(scenario, body.lender_options);
      payload = {
        success: true,
        ranking_id: makeId("rlo"),
        received_at: new Date().toISOString(),
        action_type: body.action_type,
        scenario,
        ranked_lenders,
        top_lender: ranked_lenders[0] || null,
        next_step: ranked_lenders.length > 0 ? "review_top_ranked_options" : "manual_exception_review",
        compliance_notice: complianceNotice()
      };
    }

    if (body.action_type === "generate_lender_shortlist") {
      const ranked_lenders = rankLenders(scenario, body.lender_options);
      const shortlistResult = generateShortlist(scenario, ranked_lenders, body.max_results || 3);
      payload = {
        success: true,
        shortlist_id: makeId("gls"),
        received_at: new Date().toISOString(),
        action_type: body.action_type,
        scenario,
        ranked_lenders,
        ...shortlistResult,
        next_step: shortlistResult.fallback_used ? "manual_review_shortlist" : "prepare_lender_submission_notes",
        compliance_notice: complianceNotice()
      };
    }

    if (body.action_type === "flag_manual_review_required") {
      const review = flagManualReview(scenario);
      payload = {
        success: true,
        review_flag_id: makeId("mrr"),
        received_at: new Date().toISOString(),
        action_type: body.action_type,
        scenario,
        ...review,
        compliance_notice: complianceNotice()
      };
    }

    await forwardLenderRoutingEvent(payload);
    return sendJson(res, 200, payload);
  } catch (error) {
    console.error("Lender routing action router error:", error);
    return sendJson(res, 500, { success: false, error: "server_error", message: "Unable to process lender routing action." });
  }
}
