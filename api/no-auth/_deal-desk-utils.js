export function sendJson(res, statusCode, payload) {
  res.setHeader("Content-Type", "application/json");
  return res.status(statusCode).json(payload);
}

export function makeId(prefix) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${datePart}_${randomPart}`;
}

export function validateBody(body = {}, expectedActionType) {
  if (!body.source) return { error: "missing_required_field", message: "source is required." };
  if (!body.action_type) return { error: "missing_required_field", message: "action_type is required." };
  if (expectedActionType && body.action_type !== expectedActionType) return { error: "validation_error", message: `action_type must be ${expectedActionType}.` };
  return null;
}

export function enforceSharedSecret(body = {}) {
  if (process.env.DEAL_DESK_SHARED_SECRET && body.shared_secret !== process.env.DEAL_DESK_SHARED_SECRET) {
    return { error: "validation_error", message: "Invalid or missing shared_secret." };
  }
  return null;
}

export function context(body = {}) {
  return {
    lead_id: body.lead_id || body.scenario_id || null,
    business_name: body.business_name || null,
    contact_name: body.contact_name || body.borrower_name || null,
    borrower_type: body.borrower_type || "unknown",
    primary_route: body.primary_route || body.loan_purpose || "manual_review",
    requested_amount: body.requested_amount ?? null,
    state: body.state || null,
    monthly_revenue: body.monthly_revenue ?? null,
    time_in_business_months: body.time_in_business_months ?? null,
    credit_score_range: body.credit_score_range || "unknown",
    fit_tier: body.fit_tier || null,
    fit_score: body.fit_score ?? null,
    missing_information: Array.isArray(body.missing_information) ? body.missing_information : [],
    missing_documents: Array.isArray(body.missing_documents) ? body.missing_documents : [],
    risk_flags: Array.isArray(body.risk_flags) ? body.risk_flags : [],
    notes: body.notes || null
  };
}

export function dealDeskSummary(ctx) {
  return {
    summary_title: `${ctx.primary_route} review summary`,
    summary_points: [
      `Requested amount: ${ctx.requested_amount ?? "unknown"}`,
      `Borrower type: ${ctx.borrower_type}`,
      `State: ${ctx.state ?? "unknown"}`,
      `Fit tier: ${ctx.fit_tier ?? "not scored"}`,
      `Open gaps: ${[...ctx.missing_information, ...ctx.missing_documents].join(", ") || "none listed"}`
    ],
    risk_flags: ctx.risk_flags,
    next_step: ctx.missing_information.length || ctx.missing_documents.length ? "resolve_file_gaps" : "internal_broker_review"
  };
}

export function callPrep(ctx) {
  return {
    call_objective: "Confirm scenario details and collect remaining review inputs.",
    discovery_questions: [
      "What is the exact use of funds?",
      "What timing pressure is driving the request?",
      "What documents are already available?",
      "Are there existing debt obligations?",
      "What outcome would make this review successful?"
    ],
    talking_points: [`Current route: ${ctx.primary_route}`, `Requested amount: ${ctx.requested_amount ?? "unknown"}`],
    next_step: "complete_call_and_update_file"
  };
}

export function internalTask(ctx) {
  const priority = ctx.risk_flags.length > 1 || ctx.missing_information.length > 2 ? "high" : "normal";
  return {
    task_title: `Review ${ctx.primary_route} file`,
    task_priority: priority,
    task_items: ["Review summary", "Check gaps", "Confirm route", "Prepare next update"],
    next_step: "assign_internal_owner"
  };
}

export function submissionNotes(ctx) {
  return {
    note_title: `${ctx.primary_route} internal notes`,
    notes: [
      `Scenario route: ${ctx.primary_route}`,
      `Requested amount: ${ctx.requested_amount ?? "unknown"}`,
      `Revenue context: ${ctx.monthly_revenue ?? "unknown monthly revenue"}`,
      `Time in business: ${ctx.time_in_business_months ?? "unknown"} months`,
      `Credit score range: ${ctx.credit_score_range}`
    ],
    next_step: "human_review"
  };
}

export function scenarioMemo(ctx) {
  return {
    memo_title: `${ctx.primary_route} funding scenario memo`,
    memo_sections: [
      { heading: "Borrower / Business", content: ctx.business_name || ctx.contact_name || "Not provided" },
      { heading: "Funding Request", content: `${ctx.requested_amount ?? "Unknown amount"} for ${ctx.primary_route}` },
      { heading: "Strengths", content: ctx.fit_tier || "Not scored" },
      { heading: "Open Items", content: [...ctx.missing_information, ...ctx.missing_documents].join(", ") || "None listed" }
    ],
    next_step: "attach_memo_to_file"
  };
}

export async function forwardDealDeskEvent(payload) {
  const webhookUrl = process.env.DEAL_DESK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("No DEAL_DESK_WEBHOOK_URL configured. Payload logged only.");
    console.log(JSON.stringify(payload, null, 2));
    return { forwarded: false, destination: "console" };
  }
  const headers = { "Content-Type": "application/json" };
  if (process.env.WEBHOOK_SHARED_SECRET) headers["x-brokerflow-secret"] = process.env.WEBHOOK_SHARED_SECRET;
  const response = await fetch(webhookUrl, { method: "POST", headers, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(`Deal desk webhook forwarding failed with status ${response.status}.`);
  return { forwarded: true, destination: "deal_desk_webhook" };
}

export function complianceNotice() {
  return "Internal broker operations support only. No funding decision has been made.";
}
