import { complianceNotice, enforceSharedSecret, forwardFollowupEvent, generateBorrowerMessage, makeId, normalizeContext, sendJson, validateBody } from "./_followup-workflow-utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { success: false, error: "invalid_method", message: "Only POST requests are allowed." });
  }
  try {
    const body = req.body || {};
    const secretError = enforceSharedSecret(body);
    if (secretError) return sendJson(res, 400, { success: false, ...secretError });
    const validationError = validateBody(body, "generate_borrower_follow_up_message");
    if (validationError) return sendJson(res, 400, { success: false, ...validationError });
    const context = normalizeContext(body);
    const message = generateBorrowerMessage(context, body.tone || "professional");
    const payload = { success: true, message_id: makeId("bfm"), received_at: new Date().toISOString(), action_type: "generate_borrower_follow_up_message", context, ...message, compliance_notice: complianceNotice() };
    await forwardFollowupEvent(payload);
    return sendJson(res, 200, payload);
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { success: false, error: "server_error", message: "Unable to generate borrower message." });
  }
}
