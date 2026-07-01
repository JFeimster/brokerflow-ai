import { context, enforceSharedSecret, forwardRevenueEvent, implementationScope, makeId, sendJson, validateBody } from "./_revenue-agency-utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { success: false, error: "invalid_method", message: "Only POST requests are allowed." });
  try {
    const body = req.body || {};
    const secretError = enforceSharedSecret(body);
    if (secretError) return sendJson(res, 400, { success: false, ...secretError });
    const validationError = validateBody(body, "create_implementation_scope");
    if (validationError) return sendJson(res, 400, { success: false, ...validationError });
    const ctx = context(body);
    const payload = { success: true, scope_id: makeId("cis"), received_at: new Date().toISOString(), action_type: "create_implementation_scope", context: ctx, ...implementationScope(ctx) };
    await forwardRevenueEvent(payload);
    return sendJson(res, 200, payload);
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { success: false, error: "server_error", message: "Unable to create project scope." });
  }
}
