import { callPrep, complianceNotice, context, dealDeskSummary, enforceSharedSecret, forwardDealDeskEvent, internalTask, makeId, scenarioMemo, sendJson, submissionNotes, validateBody } from "./_deal-desk-utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { success: false, error: "invalid_method", message: "Only POST requests are allowed." });
  try {
    const body = req.body || {};
    const secretError = enforceSharedSecret(body);
    if (secretError) return sendJson(res, 400, { success: false, ...secretError });
    const validationError = validateBody(body, body.action_type);
    if (validationError) return sendJson(res, 400, { success: false, ...validationError });
    const ctx = context(body);
    const base = { success: true, received_at: new Date().toISOString(), action_type: body.action_type, context: ctx, compliance_notice: complianceNotice() };
    let payload;
    switch (body.action_type) {
      case "create_deal_desk_summary": payload = { ...base, summary_id: makeId("dds"), ...dealDeskSummary(ctx) }; break;
      case "generate_broker_call_prep": payload = { ...base, call_prep_id: makeId("bcp"), ...callPrep(ctx) }; break;
      case "create_internal_broker_task": payload = { ...base, task_id: makeId("ibt"), ...internalTask(ctx) }; break;
      case "generate_lender_submission_notes": payload = { ...base, notes_id: makeId("lsn"), ...submissionNotes(ctx) }; break;
      case "create_funding_scenario_memo": payload = { ...base, memo_id: makeId("fsm"), ...scenarioMemo(ctx) }; break;
      default: return sendJson(res, 400, { success: false, error: "validation_error", message: "Unsupported action_type." });
    }
    await forwardDealDeskEvent(payload);
    return sendJson(res, 200, payload);
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { success: false, error: "server_error", message: "Unable to process action." });
  }
}
