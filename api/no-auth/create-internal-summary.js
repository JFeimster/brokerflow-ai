import { complianceNotice, context, dealDeskSummary, enforceSharedSecret, forwardDealDeskEvent, makeId, sendJson, validateBody } from "./_deal-desk-utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { success: false, error: "invalid_method", message: "Only POST requests are allowed." });
  try {
    const body = req.body || {};
    const secretError = enforceSharedSecret(body);
    if (secretError) return sendJson(res, 400, { success: false, ...secretError });
    const validationError = validateBody(body, "create_deal_desk_summary");
    if (validationError) return sendJson(res, 400, { success: false, ...validationError });
    const ctx = context(body);
    const payload = { success: true, summary_id: makeId("dds"), received_at: new Date().toISOString(), action_type: "create_deal_desk_summary", context: ctx, ...dealDeskSummary(ctx), compliance_notice: complianceNotice() };
    await forwardDealDeskEvent(payload);
    return sendJson(res, 200, payload);
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { success: false, error: "server_error", message: "Unable to create internal summary." });
  }
}
