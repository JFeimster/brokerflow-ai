import { automationAudit, context, enforceSharedSecret, forwardRevenueEvent, makeId, sendJson, validateBody } from "./_revenue-agency-utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { success: false, error: "invalid_method", message: "Only POST requests are allowed." });
  try {
    const body = req.body || {};
    const secretError = enforceSharedSecret(body);
    if (secretError) return sendJson(res, 400, { success: false, ...secretError });
    const validationError = validateBody(body, "generate_broker_automation_audit");
    if (validationError) return sendJson(res, 400, { success: false, ...validationError });
    const ctx = context(body);
    const payload = { success: true, audit_id: makeId("baa"), received_at: new Date().toISOString(), action_type: "generate_broker_automation_audit", context: ctx, ...automationAudit(ctx) };
    await forwardRevenueEvent(payload);
    return sendJson(res, 200, payload);
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { success: false, error: "server_error", message: "Unable to generate audit." });
  }
}
