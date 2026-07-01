import { sendJson, makeId, validateBody } from "./_deal-desk-utils.js";

const ROUTES = {
  create_deal_desk_summary: "summary_id",
  generate_broker_call_prep: "call_prep_id",
  create_internal_broker_task: "task_id",
  generate_lender_submission_notes: "notes_id",
  create_funding_scenario_memo: "memo_id",
  package_automation_offer: "offer_id",
  generate_broker_automation_audit: "audit_id",
  create_agency_client_roadmap: "roadmap_id",
  recommend_paid_service_path: "path_id",
  create_implementation_scope: "scope_id"
};

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { success: false, error: "invalid_method", message: "Only POST requests are allowed." });
  const body = req.body || {};
  const idField = ROUTES[body.action_type];
  if (!idField) return sendJson(res, 400, { success: false, error: "validation_error", message: "Unsupported action_type." });
  const validationError = validateBody(body, body.action_type);
  if (validationError) return sendJson(res, 400, { success: false, ...validationError });
  const payload = {
    success: true,
    [idField]: makeId("ops"),
    received_at: new Date().toISOString(),
    action_type: body.action_type,
    result_type: body.action_type,
    next_step: "human_review"
  };
  return sendJson(res, 200, payload);
}
