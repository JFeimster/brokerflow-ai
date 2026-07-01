import { complianceNotice, createStalledRecovery, enforceSharedSecret, forwardFollowupEvent, makeId, normalizeContext, sendJson, validateBody } from "./_followup-workflow-utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { success: false, error: "invalid_method", message: "Only POST requests are allowed." });
  }
  try {
    const body = req.body || {};
    const secretError = enforceSharedSecret(body);
    if (secretError) return sendJson(res, 400, { success: false, ...secretError });
    const validationError = validateBody(body, "create_stalled_deal_recovery_plan");
    if (validationError) return sendJson(res, 400, { success: false, ...validationError });
    const context = normalizeContext(body);
    const recovery = createStalledRecovery(context);
    const payload = { success: true, recovery_id: makeId("sdr"), received_at: new Date().toISOString(), action_type: "create_stalled_deal_recovery_plan", context, ...recovery, compliance_notice: complianceNotice() };
    await forwardFollowupEvent(payload);
    return sendJson(res, 200, payload);
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { success: false, error: "server_error", message: "Unable to create stalled deal recovery plan." });
  }
}
