import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { createMcpAuthenticator } from "./auth.js";
import { applyAction, createReview } from "../reviews/service.js";
import { consumeRateLimit } from "../reviews/rate-limit.js";
import { applyReviewFilters, parseReviewQuery } from "../reviews/query.js";
import { validateReview } from "../reviews/validation.js";

const reviewColumns = "id,review_request_id,organization_id,source,requester_name,borrower_type,business_name,loan_purpose,requested_amount,state,urgency,recommended_review_path,scenario,status,version,created_at,updated_at";
const eventTypes = ["review_created", "review_started", "information_requested", "review_marked_reviewed"];

function result(value) {
  return { structuredContent: value, content: [{ type: "text", text: JSON.stringify(value) }] };
}

function publicError(error) {
  const status = [401, 403, 404, 409, 422, 429, 503].includes(error?.status) ? error.status : 500;
  const codes = { 401: "unauthorized", 403: "forbidden", 404: "not_found", 409: "conflict", 422: "invalid_input", 429: "rate_limited", 503: "unavailable", 500: "internal_error" };
  const message = status < 500 ? error.message : "The BrokerFlow service is temporarily unavailable.";
  const detail = { error: error?.code || codes[status], status, message };
  return { isError: true, structuredContent: detail, content: [{ type: "text", text: `${detail.error} (${status}): ${message}` }] };
}

function registerTool(server, name, config, handler) {
  server.registerTool(name, config, async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return publicError(error);
    }
  });
}

function requireWorkspace(context, organizationId, write = false) {
  const workspace = context.workspaces.find(item => item.id === organizationId);
  if (!workspace || !workspace.canRead || (write && !workspace.canWrite)) {
    throw Object.assign(new Error("Workspace access denied."), { status: 403, code: "workspace_access_denied" });
  }
  return workspace;
}

export function createMcpServer({ authenticateMcp = createMcpAuthenticator(), request, create = createReview, apply = applyAction, rateLimit = consumeRateLimit } = {}) {
  const server = new McpServer({ name: "brokerflow-ai", version: "1.0.0" });
  const contextFor = extra => authenticateMcp(request || extra.requestInfo?.request || extra);

  registerTool(server, "get_my_workspaces", {
    title: "List my BrokerFlow workspaces",
    description: "List active organizations where the authenticated user has review read access and their current role capabilities.",
    inputSchema: {},
    outputSchema: { workspaces: z.array(z.object({ id: z.string(), name: z.string(), role: z.string(), can_read: z.boolean(), can_write: z.boolean(), can_audit: z.boolean() })) },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, async (_input, extra) => {
    const context = await contextFor(extra);
    return result({ workspaces: context.workspaces.map(({ id, name, role, canRead, canWrite, canAudit }) => ({ id, name, role, can_read: canRead, can_write: canWrite, can_audit: canAudit })) });
  });

  registerTool(server, "list_reviews", {
    title: "List reviews",
    description: "List a filtered page of operational reviews in an explicitly selected organization. Maximum 100 items per page.",
    inputSchema: {
      organization_id: z.string().uuid(),
      limit: z.number().int().min(1).max(100).optional(),
      cursor: z.number().int().min(0).optional(),
      search: z.string().max(80).optional(),
      priority: z.enum(["All items", "High", "Normal", "Low"]).optional(),
      status: z.enum(["queued_for_human_review", "in_review", "needs_information", "reviewed"]).optional(),
    },
    outputSchema: { items: z.array(z.record(z.string(), z.unknown())), total_count: z.number().int(), next_cursor: z.number().int().nullable() },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, async (input, extra) => {
    const context = await contextFor(extra);
    const workspace = requireWorkspace(context, input.organization_id);
    const filters = parseReviewQuery(input);
    const query = applyReviewFilters(context.db.from("brokerflow_review_requests").select(reviewColumns, { count: "exact" }).eq("organization_id", workspace.id).order("created_at", { ascending: false }).order("id", { ascending: false }), filters).range(filters.cursor, filters.cursor + filters.limit - 1);
    const { data, error, count } = await query;
    if (error) throw Object.assign(new Error("Unable to load reviews."), { status: 503 });
    const items = data || [];
    const nextOffset = filters.cursor + items.length;
    return result({ items, total_count: count || 0, next_cursor: nextOffset < (count || 0) ? nextOffset : null });
  });

  registerTool(server, "get_review", {
    title: "Get review details",
    description: "Get one review's allowlisted operational fields within an explicitly selected organization.",
    inputSchema: { organization_id: z.string().uuid(), review_id: z.string().uuid() },
    outputSchema: { item: z.record(z.string(), z.unknown()) },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, async ({ organization_id, review_id }, extra) => {
    const context = await contextFor(extra);
    requireWorkspace(context, organization_id);
    const { data, error } = await context.db.from("brokerflow_review_requests").select(reviewColumns).eq("id", review_id).eq("organization_id", organization_id).maybeSingle();
    if (error) throw Object.assign(new Error("Unable to load review."), { status: 503 });
    if (!data) throw Object.assign(new Error("Review not found."), { status: 404, code: "not_found" });
    return result({ item: data });
  });

  registerTool(server, "get_review_activity", {
    title: "Get review activity",
    description: "Get audit events for one review. Requires brokerflow.reviews.audit independently of review read access.",
    inputSchema: { organization_id: z.string().uuid(), review_id: z.string().uuid(), limit: z.number().int().min(1).max(100).optional(), cursor: z.number().int().min(0).optional() },
    outputSchema: { items: z.array(z.record(z.string(), z.unknown())), next_cursor: z.number().int().nullable() },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, async ({ organization_id, review_id, limit = 50, cursor = 0 }, extra) => {
    const context = await contextFor(extra);
    const workspace = requireWorkspace(context, organization_id);
    if (!workspace.canAudit) throw Object.assign(new Error("Review activity access is not granted."), { status: 403, code: "audit_access_denied" });
    const { data: review, error: reviewError } = await context.db.from("brokerflow_review_requests").select("id").eq("id", review_id).eq("organization_id", organization_id).maybeSingle();
    if (reviewError) throw Object.assign(new Error("Unable to load review."), { status: 503 });
    if (!review) throw Object.assign(new Error("Review not found."), { status: 404, code: "not_found" });
    const { data, error } = await context.db.from("brokerflow_review_events").select("id,review_id,event_type,actor_user_id,actor_source,previous_status,new_status,note,version,created_at").eq("organization_id", organization_id).eq("review_id", review_id).in("event_type", eventTypes).order("created_at", { ascending: false }).range(cursor, cursor + limit);
    if (error) throw Object.assign(new Error("Unable to load review activity."), { status: 503 });
    const events = data || [];
    const hasMore = events.length > limit;
    return result({ items: events.slice(0, limit), next_cursor: hasMore ? cursor + limit : null });
  });

  registerTool(server, "create_review_request", {
    title: "Create a review request",
    description: "Create an operational task for human review. This does not make or imply a borrower decision, underwriting, approval, pricing, funding, or lender submission.",
    inputSchema: {
      organization_id: z.string().uuid(),
      idempotency_key: z.string().min(16).max(200),
      scenario: z.object({
        action_type: z.literal("lender_match_review"),
        requester_name: z.string().min(1).max(120),
        borrower_type: z.enum(["individual", "business", "real_estate_investor", "commercial_borrower", "referral_partner_lead", "unknown"]),
        business_name: z.string().max(160).optional(),
        loan_purpose: z.enum(["business_working_capital", "equipment_financing", "commercial_real_estate", "residential_purchase", "residential_refinance", "debt_consolidation", "bridge_loan", "construction", "invoice_financing", "sba_review", "personal_loan", "other"]),
        requested_amount: z.number().positive().max(1_000_000_000),
        state: z.string().length(2),
        urgency: z.enum(["low", "normal", "high", "same_day"]).optional(),
        recommended_review_path: z.enum(["business_funding_review", "commercial_real_estate_review", "residential_mortgage_review", "equipment_financing_review", "sba_or_bank_review", "manual_exception_review", "insufficient_information"]).optional(),
        credit_score_range: z.enum(["unknown", "below_580", "580_619", "620_659", "660_699", "700_739", "740_plus"]).optional(),
        monthly_revenue: z.number().nonnegative().optional(),
        annual_revenue: z.number().nonnegative().optional(),
        time_in_business_months: z.number().int().nonnegative().optional(),
        employment_type: z.enum(["employed", "self_employed", "business_owner", "investor", "retired", "unemployed", "unknown", "other"]).optional(),
        property_type: z.enum(["single_family", "multifamily", "condo", "townhouse", "mixed_use", "commercial", "land", "construction", "not_applicable", "unknown", "other"]).optional(),
        occupancy_type: z.enum(["primary_residence", "second_home", "investment_property", "owner_occupied_business", "tenant_occupied", "vacant", "not_applicable", "unknown"]).optional(),
        collateral_available: z.boolean().optional(),
        notes: z.string().max(4000).optional(),
        human_review_required: z.literal(true),
      }).strict(),
    },
    outputSchema: { review_id: z.string().uuid(), review_request_id: z.string(), status: z.string(), duplicate: z.boolean() },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false, idempotentHint: true },
  }, async ({ organization_id, idempotency_key, scenario }, extra) => {
    const context = await contextFor(extra);
    requireWorkspace(context, organization_id, true);
    const normalized = validateReview({ source: "custom_gpt", ...scenario });
    await rateLimit(context.db, "review_create", `${organization_id}:${context.user.id}`, 30, 60);
    const created = await create(context, organization_id, normalized, idempotency_key, context.user.id);
    return result({ review_id: created.id, review_request_id: created.review_request_id, status: created.status, duplicate: Boolean(created.duplicate), next_step: "manual_review" });
  });

  registerTool(server, "apply_review_action", {
    title: "Update a review task",
    description: "Apply one permission-checked human review workflow transition. Use start_review to take a queued task, request_information to return an in-progress task for missing information, or mark_reviewed to record that human review is complete. This records workflow status only; it does not approve, decline, qualify, underwrite, price, fund, or submit a borrower. Request information notes must be brief and contain no sensitive personal data. Confirm the intended action with the user before changing a task.",
    inputSchema: {
      organization_id: z.string().uuid(),
      review_id: z.string().uuid(),
      action: z.enum(["start_review", "request_information", "mark_reviewed"]),
      expected_version: z.number().int().min(1),
      idempotency_key: z.string().min(16).max(200),
      note: z.string().max(500).optional(),
    },
    outputSchema: { review_id: z.string().uuid(), review_request_id: z.string(), status: z.string(), version: z.number().int(), action: z.string() },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false, idempotentHint: true },
  }, async ({ organization_id, review_id, action, expected_version, idempotency_key, note = "" }, extra) => {
    const context = await contextFor(extra);
    requireWorkspace(context, organization_id, true);
    await rateLimit(context.db, "review_action", `${organization_id}:${context.user.id}`, 60, 60);
    const updated = await apply(context, organization_id, { review_id, action, expected_version, idempotency_key, note });
    return result({ review_id: updated.id, review_request_id: updated.review_request_id, status: updated.status, version: updated.version, action });
  });

  return server;
}

export async function handleMcpRequest(req, res, options = {}) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.setHeader("Cache-Control", "no-store");
    if (typeof res.status === "function") return res.status(405).json({ error: "method_not_allowed" });
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: "method_not_allowed" }));
  }
  const server = createMcpServer({ ...options, request: req });
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  return transport.handleRequest(req, res, req.body);
}
