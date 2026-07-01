import { buildOpsPayload, makeId, normalizeContext, sendJson, validateBody } from "./_deal-desk-utils.js";

const ACTIONS = new Set([
  "create_deal_desk_summary",
  "generate_broker_call_prep",
  "create_internal_broker_task",
  "generate_lender_submission_notes",
  "create_funding_scenario_memo"
]);

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { success: false, error: "invalid_method", message: "Only POST requests are allowed." });
  const body = req.body || {};
  if (!ACTIONS.has(body.action_type)) return sendJson(res, 400, { success: false, error: "validation_error", message: "Unsupported ops action_type." });
  const validationError = validateBody(body, body.action_type);
  if (validationError) return sendJson(res, 400, { success: false, ...validationError });
  const ctx = normalizeContext(body);
  const result = buildOpsPayload(body.action_type, ctx);
  return sendJson(res, 200, { success: true, ops_id: makeId("ops"), received_at: new Date().toISOString(), ...result });
}
