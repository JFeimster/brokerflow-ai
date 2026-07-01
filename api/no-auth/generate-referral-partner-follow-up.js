import { complianceNotice, createReferralPartnerFollowUp, enforceSharedSecret, forwardFollowupEvent, makeId, normalizeContext, sendJson, validateBody } from "./_followup-workflow-utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { success: false, error: "invalid_method", message: "Only POST requests are allowed." });
  }
  try {
    const body = req.body || {};
    const secretError = enforceSharedSecret(body);
    if (secretError) return sendJson(res, 400, { success: false, ...secretError });
    const validationError = validateBody(body, "generate_referral_partner_follow_up");
    if (validationError) return sendJson(res, 400, { success: false, ...validationError });
    const context = normalizeContext(body);
    const partner_message = createReferralPartnerFollowUp(context);
    const payload = { success: true, referral_followup_id: makeId("rpf"), received_at: new Date().toISOString(), action_type: "generate_referral_partner_follow_up", context, ...partner_message, compliance_notice: complianceNotice() };
    await forwardFollowupEvent(payload);
    return sendJson(res, 200, payload);
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { success: false, error: "server_error", message: "Unable to generate referral partner follow-up." });
  }
}
