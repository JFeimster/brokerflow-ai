import { buildOpsPayload, makeId, normalizeContext, sendJson, validateBody } from "./_deal-desk-utils.js";

const OPS_ACTIONS = new Set([
  "create_deal_desk_summary",
  "generate_broker_call_prep",
  "create_internal_broker_task",
  "generate_lender_submission_notes",
  "create_funding_scenario_memo"
]);

const REVENUE_ACTIONS = new Set([
  "package_automation_offer",
  "generate_broker_automation_audit",
  "create_agency_client_roadmap",
  "recommend_paid_service_path",
  "create_implementation_scope"
]);

function revenueContext(body = {}) {
  return {
    client_type: body.client_type || "broker_or_agency",
    current_tools: Array.isArray(body.current_tools) ? body.current_tools : [],
    pain_points: Array.isArray(body.pain_points) ? body.pain_points : [],
    monthly_lead_volume: body.monthly_lead_volume ?? null,
    team_size: body.team_size ?? null,
    target_offer: body.target_offer || "broker_automation_package",
    implementation_timeline: body.implementation_timeline || "standard"
  };
}

function buildRevenuePayload(actionType, ctx) {
  if (actionType === "package_automation_offer") return { offer_name: "BrokerFlow Automation Starter Package", core_deliverables: ["intake workflow map", "lead qualification actions", "document checklist workflow", "follow-up workflow"], next_step: "create_implementation_scope" };
  if (actionType === "generate_broker_automation_audit") return { audit_score: Math.max(35, 90 - ctx.pain_points.length * 10), gaps: ctx.pain_points, recommendations: ["standardize intake", "add routing actions", "add document gaps workflow", "add follow-up cadence"], next_step: "recommend_paid_service_path" };
  if (actionType === "create_agency_client_roadmap") return { roadmap_name: "Broker Automation Implementation Roadmap", phases: [{ phase: 1, name: "Map intake and routing" }, { phase: 2, name: "Deploy actions" }, { phase: 3, name: "Add follow-up workflow" }], next_step: "create_implementation_scope" };
  if (actionType === "recommend_paid_service_path") return { recommended_path: (ctx.monthly_lead_volume || 0) >= 100 ? "implementation_retainer" : "starter_package", rationale: [`Lead volume: ${ctx.monthly_lead_volume ?? "unknown"}`, `Pain points: ${ctx.pain_points.join(", ") || "not listed"}`], next_step: "package_automation_offer" };
  if (actionType === "create_implementation_scope") return { scope_name: "BrokerFlow Implementation Scope", included_workstreams: ["intake normalization", "lead qualification", "lender routing", "document collection", "follow-up workflow"], assumptions: ["client provides existing intake fields", "client reviews drafts before use"], next_step: "review_scope_with_client" };
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { success: false, error: "invalid_method", message: "Only POST requests are allowed." });
  const body = req.body || {};
  const validationError = validateBody(body, body.action_type);
  if (validationError) return sendJson(res, 400, { success: false, ...validationError });

  if (OPS_ACTIONS.has(body.action_type)) {
    const ctx = normalizeContext(body);
    const result = buildOpsPayload(body.action_type, ctx);
    return sendJson(res, 200, { success: true, ops_id: makeId("ops"), received_at: new Date().toISOString(), ...result });
  }

  if (REVENUE_ACTIONS.has(body.action_type)) {
    const ctx = revenueContext(body);
    const result = buildRevenuePayload(body.action_type, ctx);
    return sendJson(res, 200, { success: true, revenue_action_id: makeId("rev"), received_at: new Date().toISOString(), action_type: body.action_type, context: ctx, ...result });
  }

  return sendJson(res, 400, { success: false, error: "validation_error", message: "Unsupported action_type." });
}
