import {
  complianceNotice,
  createDeclinedReactivation,
  createFollowUpPlan,
  createReferralPartnerFollowUp,
  createStalledRecovery,
  enforceSharedSecret,
  forwardFollowupEvent,
  generateBorrowerMessage,
  makeId,
  normalizeContext,
  sendJson,
  validateBody
} from "./_followup-workflow-utils.js";

const ACTIONS = new Set([
  "create_broker_follow_up_plan",
  "generate_borrower_follow_up_message",
  "create_stalled_deal_recovery_plan",
  "create_declined_lead_reactivation_plan",
  "generate_referral_partner_follow_up"
]);

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { success: false, error: "invalid_method", message: "Only POST requests are allowed." });
  try {
    const body = req.body || {};
    const secretError = enforceSharedSecret(body);
    if (secretError) return sendJson(res, 400, { success: false, ...secretError });
    if (!ACTIONS.has(body.action_type)) return sendJson(res, 400, { success: false, error: "validation_error", message: "Unsupported workflow action_type." });
    const validationError = validateBody(body, body.action_type);
    if (validationError) return sendJson(res, 400, { success: false, ...validationError });
    const context = normalizeContext(body);
    let payload;
    if (body.action_type === "create_broker_follow_up_plan") payload = { success: true, plan_id: makeId("bfp"), received_at: new Date().toISOString(), action_type: body.action_type, context, ...createFollowUpPlan(context), compliance_notice: complianceNotice() };
    if (body.action_type === "generate_borrower_follow_up_message") payload = { success: true, message_id: makeId("bfm"), received_at: new Date().toISOString(), action_type: body.action_type, context, ...generateBorrowerMessage(context, body.tone || "professional"), compliance_notice: complianceNotice() };
    if (body.action_type === "create_stalled_deal_recovery_plan") payload = { success: true, recovery_id: makeId("sdr"), received_at: new Date().toISOString(), action_type: body.action_type, context, ...createStalledRecovery(context), compliance_notice: complianceNotice() };
    if (body.action_type === "create_declined_lead_reactivation_plan") payload = { success: true, reactivation_id: makeId("dlr"), received_at: new Date().toISOString(), action_type: body.action_type, context, ...createDeclinedReactivation(context), compliance_notice: complianceNotice() };
    if (body.action_type === "generate_referral_partner_follow_up") payload = { success: true, referral_followup_id: makeId("rpf"), received_at: new Date().toISOString(), action_type: body.action_type, context, ...createReferralPartnerFollowUp(context), compliance_notice: complianceNotice() };
    await forwardFollowupEvent(payload);
    return sendJson(res, 200, payload);
  } catch (error) {
    console.error("Workflow action router error:", error);
    return sendJson(res, 500, { success: false, error: "server_error", message: "Unable to process workflow action." });
  }
}
