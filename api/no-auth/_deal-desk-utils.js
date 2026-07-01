export function sendJson(res, statusCode, payload) {
  res.setHeader("Content-Type", "application/json");
  return res.status(statusCode).json(payload);
}

export function makeId(prefix) {
  return `${prefix}_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}_${Math.random().toString(36).slice(2, 8)}`;
}

export function validateBody(body = {}, expectedActionType) {
  if (!body.source) return { error: "missing_required_field", message: "source is required." };
  if (!body.action_type) return { error: "missing_required_field", message: "action_type is required." };
  if (expectedActionType && body.action_type !== expectedActionType) return { error: "validation_error", message: `action_type must be ${expectedActionType}.` };
  return null;
}

export function normalizeContext(body = {}) {
  return {
    business_name: body.business_name || null,
    contact_name: body.contact_name || body.borrower_name || null,
    borrower_type: body.borrower_type || "unknown",
    primary_route: body.primary_route || body.loan_purpose || "manual_review",
    requested_amount: body.requested_amount ?? null,
    state: body.state || null,
    fit_tier: body.fit_tier || null,
    missing_information: Array.isArray(body.missing_information) ? body.missing_information : [],
    missing_documents: Array.isArray(body.missing_documents) ? body.missing_documents : [],
    risk_flags: Array.isArray(body.risk_flags) ? body.risk_flags : []
  };
}

export function buildOpsPayload(actionType, ctx) {
  const openItems = [...ctx.missing_information, ...ctx.missing_documents];
  const base = {
    action_type: actionType,
    context: ctx,
    route: ctx.primary_route,
    open_items: openItems,
    compliance_notice: "Internal workflow draft only. No funding decision has been made."
  };

  if (actionType === "create_deal_desk_summary") return { ...base, summary_title: `${ctx.primary_route} review summary`, summary_points: [`Amount: ${ctx.requested_amount ?? "unknown"}`, `State: ${ctx.state ?? "unknown"}`, `Open items: ${openItems.join(", ") || "none listed"}`], next_step: openItems.length ? "resolve_file_gaps" : "internal_review" };
  if (actionType === "generate_broker_call_prep") return { ...base, call_objective: "Confirm scenario details and collect remaining inputs.", discovery_questions: ["What is the use of funds?", "What is the timing need?", "What files are available?"], next_step: "complete_call_notes" };
  if (actionType === "create_internal_broker_task") return { ...base, task_title: `Review ${ctx.primary_route} file`, task_priority: ctx.risk_flags.length > 1 ? "high" : "normal", task_items: ["Review summary", "Check gaps", "Confirm route"], next_step: "assign_owner" };
  if (actionType === "generate_lender_submission_notes") return { ...base, note_title: `${ctx.primary_route} internal notes`, notes: [`Route: ${ctx.primary_route}`, `Amount: ${ctx.requested_amount ?? "unknown"}`, `Open items: ${openItems.join(", ") || "none listed"}`], next_step: "human_review" };
  if (actionType === "create_funding_scenario_memo") return { ...base, memo_title: `${ctx.primary_route} memo`, memo_sections: [{ heading: "Request", content: `${ctx.requested_amount ?? "Unknown amount"}` }, { heading: "Open Items", content: openItems.join(", ") || "None listed" }], next_step: "attach_memo_to_file" };

  return null;
}
