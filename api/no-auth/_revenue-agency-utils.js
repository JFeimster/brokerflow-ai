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
  if (process.env.REVENUE_AGENCY_SHARED_SECRET && body.shared_secret !== process.env.REVENUE_AGENCY_SHARED_SECRET) {
    return { error: "validation_error", message: "Invalid or missing shared_secret." };
  }
  return null;
}

export function context(body = {}) {
  return {
    client_type: body.client_type || "broker_or_agency",
    current_tools: Array.isArray(body.current_tools) ? body.current_tools : [],
    pain_points: Array.isArray(body.pain_points) ? body.pain_points : [],
    monthly_lead_volume: body.monthly_lead_volume ?? null,
    team_size: body.team_size ?? null,
    target_offer: body.target_offer || "broker_automation_package",
    budget_range: body.budget_range || null,
    implementation_timeline: body.implementation_timeline || "standard",
    notes: body.notes || null
  };
}

export function packageOffer(ctx) {
  return {
    offer_name: "BrokerFlow Automation Starter Package",
    offer_type: ctx.target_offer,
    core_deliverables: ["intake workflow map", "lead qualification action set", "document checklist workflow", "follow-up draft library", "implementation runbook"],
    suggested_positioning: "Operational automation package for brokers that need cleaner intake, faster review, and better follow-up consistency.",
    next_step: "create_scope"
  };
}

export function automationAudit(ctx) {
  const gaps = [];
  if (!ctx.current_tools.length) gaps.push("tool_stack_not_defined");
  if (!ctx.monthly_lead_volume) gaps.push("lead_volume_unknown");
  if (ctx.pain_points.includes("manual_follow_up")) gaps.push("manual_follow_up_gap");
  if (ctx.pain_points.includes("missing_documents")) gaps.push("document_collection_gap");
  return { audit_score: Math.max(35, 90 - gaps.length * 12), gaps, recommendations: ["standardize intake", "add routing actions", "add document gap workflow", "add follow-up cadence"], next_step: "recommend_paid_service_path" };
}

export function clientRoadmap(ctx) {
  return {
    roadmap_name: "Broker Automation Implementation Roadmap",
    phases: [
      { phase: 1, name: "Map intake and routing", timeframe: "week_1" },
      { phase: 2, name: "Deploy qualification and document actions", timeframe: "week_2" },
      { phase: 3, name: "Add follow-up and internal review workflows", timeframe: "week_3" },
      { phase: 4, name: "Connect reporting and optimization", timeframe: "week_4" }
    ],
    next_step: "create_implementation_scope"
  };
}

export function paidPath(ctx) {
  let path = "starter_package";
  if ((ctx.monthly_lead_volume || 0) >= 100 || (ctx.team_size || 0) >= 5) path = "implementation_retainer";
  if (ctx.pain_points.length >= 4) path = "full_workflow_buildout";
  return { recommended_path: path, rationale: [`Client type: ${ctx.client_type}`, `Lead volume: ${ctx.monthly_lead_volume ?? "unknown"}`, `Pain points: ${ctx.pain_points.join(", ") || "not listed"}`], next_step: "package_offer" };
}

export function implementationScope(ctx) {
  return {
    scope_name: "BrokerFlow Implementation Scope",
    included_workstreams: ["intake normalization", "lead qualification", "lender routing", "document collection", "follow-up workflow", "broker ops dashboard notes"],
    assumptions: ["client provides existing intake fields", "client reviews draft messages before use", "automation destinations are configured separately"],
    out_of_scope: ["regulated underwriting", "credit repair", "approval guarantees", "external lender submission without human review"],
    next_step: "review_scope_with_client"
  };
}

export async function forwardRevenueEvent(payload) {
  const webhookUrl = process.env.REVENUE_AGENCY_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("No REVENUE_AGENCY_WEBHOOK_URL configured. Payload logged only.");
    console.log(JSON.stringify(payload, null, 2));
    return { forwarded: false, destination: "console" };
  }
  const headers = { "Content-Type": "application/json" };
  if (process.env.WEBHOOK_SHARED_SECRET) headers["x-brokerflow-secret"] = process.env.WEBHOOK_SHARED_SECRET;
  const response = await fetch(webhookUrl, { method: "POST", headers, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(`Revenue webhook forwarding failed with status ${response.status}.`);
  return { forwarded: true, destination: "revenue_agency_webhook" };
}
