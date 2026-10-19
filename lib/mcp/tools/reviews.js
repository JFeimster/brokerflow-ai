import { reviewInput } from "../schemas/reviews.js";
import { z } from "zod";
import { registerTool, result } from "../registry.js";
import { requireWorkspace } from "../context.js";
import { validateReview } from "../../reviews/validation.js";
import { applyReviewFilters, parseReviewQuery } from "../../reviews/query.js";
import { getReviewQueueSummary } from "../../reviews/queue-summary.js";
const reviewColumns =
  "id,review_request_id,organization_id,source,requester_name,borrower_type,business_name,loan_purpose,requested_amount,state,urgency,recommended_review_path,scenario,status,version,created_at,updated_at";
const eventTypes = [
  "review_created",
  "review_started",
  "information_requested",
  "review_marked_reviewed",
];

export function registerReviews(
  server,
  { contextFor, create, apply, createTask, completeTask, rateLimit },
) {
  registerTool(
    server,
    "list_reviews",
    {
      title: "List reviews",
      description:
        "List a filtered page of operational reviews in an explicitly selected organization. Maximum 100 items per page.",
      inputSchema: {
        organization_id: z.string().uuid(),
        limit: z.number().int().min(1).max(100).optional(),
        cursor: z.number().int().min(0).optional(),
        search: z.string().max(80).optional(),
        priority: z.enum(["All items", "High", "Normal", "Low"]).optional(),
        status: z
          .enum([
            "queued_for_human_review",
            "in_review",
            "needs_information",
            "reviewed",
          ])
          .optional(),
      },
      outputSchema: {
        items: z.array(z.record(z.string(), z.unknown())),
        total_count: z.number().int(),
        next_cursor: z.number().int().nullable(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async (input, extra) => {
      const context = await contextFor(extra);
      const workspace = requireWorkspace(context, input.organization_id);
      const filters = parseReviewQuery(input);
      const query = applyReviewFilters(
        context.db
          .from("brokerflow_review_requests")
          .select(reviewColumns, { count: "exact" })
          .eq("organization_id", workspace.id)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false }),
        filters,
      ).range(filters.cursor, filters.cursor + filters.limit - 1);
      const { data, error, count } = await query;
      if (error)
        throw Object.assign(new Error("Unable to load reviews."), {
          status: 503,
        });
      const items = data || [];
      const nextOffset = filters.cursor + items.length;
      return result({
        items,
        total_count: count || 0,
        next_cursor: nextOffset < (count || 0) ? nextOffset : null,
      });
    },
  );

  registerTool(
    server,
    "get_review_queue_summary",
    {
      title: "Summarize the review queue",
      description:
        "Return organization-scoped review counts, age and overdue summaries, oldest outstanding review references, needs-information count, and operational next steps. Overdue thresholds are based on age and urgency and do not indicate lending eligibility.",
      inputSchema: { organization_id: z.string().uuid() },
      outputSchema: {
        counts_by_status: z.record(z.string(), z.number().int()),
        counts_by_urgency: z.record(z.string(), z.number().int()),
        open_review_count: z.number().int(),
        overdue_review_count: z.number().int(),
        overdue_by_urgency: z.record(z.string(), z.number().int()),
        overdue_threshold_hours_by_urgency: z.record(
          z.string(),
          z.number().int(),
        ),
        aging_buckets: z.record(
          z.string(),
          z.object({ label: z.string(), count: z.number().int() }),
        ),
        needs_information_count: z.number().int(),
        needs_information_reviews: z.array(z.record(z.string(), z.unknown())),
        oldest_outstanding_reviews: z.array(z.record(z.string(), z.unknown())),
        suggested_next_steps: z.array(
          z.object({
            priority: z.enum(["high", "normal", "low"]),
            action: z.string(),
            count: z.number().int(),
          }),
        ),
        as_of: z.string(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async ({ organization_id }, extra) => {
      const context = await contextFor(extra);
      const workspace = requireWorkspace(context, organization_id);
      return result(await getReviewQueueSummary(context.db, workspace.id));
    },
  );

  registerTool(
    server,
    "get_review",
    {
      title: "Get review details",
      description:
        "Get one review's allowlisted operational fields within an explicitly selected organization.",
      inputSchema: {
        organization_id: z.string().uuid(),
        review_id: z.string().uuid(),
      },
      outputSchema: { item: z.record(z.string(), z.unknown()) },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async ({ organization_id, review_id }, extra) => {
      const context = await contextFor(extra);
      requireWorkspace(context, organization_id);
      const { data, error } = await context.db
        .from("brokerflow_review_requests")
        .select(reviewColumns)
        .eq("id", review_id)
        .eq("organization_id", organization_id)
        .maybeSingle();
      if (error)
        throw Object.assign(new Error("Unable to load review."), {
          status: 503,
        });
      if (!data)
        throw Object.assign(new Error("Review not found."), {
          status: 404,
          code: "not_found",
        });
      return result({ item: data });
    },
  );

  registerTool(
    server,
    "get_review_activity",
    {
      title: "Get review activity",
      description:
        "Get audit events for one review. Requires brokerflow.reviews.audit independently of review read access.",
      inputSchema: {
        organization_id: z.string().uuid(),
        review_id: z.string().uuid(),
        limit: z.number().int().min(1).max(100).optional(),
        cursor: z.number().int().min(0).optional(),
      },
      outputSchema: {
        items: z.array(z.record(z.string(), z.unknown())),
        next_cursor: z.number().int().nullable(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async ({ organization_id, review_id, limit = 50, cursor = 0 }, extra) => {
      const context = await contextFor(extra);
      const workspace = requireWorkspace(context, organization_id);
      if (!workspace.canAudit)
        throw Object.assign(
          new Error("Review activity access is not granted."),
          { status: 403, code: "audit_access_denied" },
        );
      const { data: review, error: reviewError } = await context.db
        .from("brokerflow_review_requests")
        .select("id")
        .eq("id", review_id)
        .eq("organization_id", organization_id)
        .maybeSingle();
      if (reviewError)
        throw Object.assign(new Error("Unable to load review."), {
          status: 503,
        });
      if (!review)
        throw Object.assign(new Error("Review not found."), {
          status: 404,
          code: "not_found",
        });
      const { data, error } = await context.db
        .from("brokerflow_review_events")
        .select(
          "id,review_id,event_type,actor_user_id,actor_source,previous_status,new_status,note,version,created_at",
        )
        .eq("organization_id", organization_id)
        .eq("review_id", review_id)
        .in("event_type", eventTypes)
        .order("created_at", { ascending: false })
        .range(cursor, cursor + limit);
      if (error)
        throw Object.assign(new Error("Unable to load review activity."), {
          status: 503,
        });
      const events = data || [];
      const hasMore = events.length > limit;
      return result({
        items: events.slice(0, limit),
        next_cursor: hasMore ? cursor + limit : null,
      });
    },
  );

  registerTool(
    server,
    "create_review_request",
    {
      title: "Create a review request",
      description:
        "Create an operational task for human review. This does not make or imply a borrower decision, underwriting, approval, pricing, funding, or lender submission.",
      inputSchema: reviewInput,
      outputSchema: {
        review_id: z.string().uuid(),
        review_request_id: z.string(),
        status: z.string(),
        duplicate: z.boolean(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: false,
        idempotentHint: true,
      },
    },
    async ({ organization_id, idempotency_key, scenario }, extra) => {
      const context = await contextFor(extra);
      requireWorkspace(context, organization_id, true);
      const normalized = validateReview({ source: "custom_gpt", ...scenario });
      await rateLimit(
        context.db,
        "review_create",
        `${organization_id}:${context.user.id}`,
        30,
        60,
      );
      const created = await create(
        context,
        organization_id,
        normalized,
        idempotency_key,
        context.user.id,
      );
      return result({
        review_id: created.id,
        review_request_id: created.review_request_id,
        status: created.status,
        duplicate: Boolean(created.duplicate),
        next_step: "manual_review",
      });
    },
  );

  registerTool(
    server,
    "apply_review_action",
    {
      title: "Update a review task",
      description:
        "Apply one permission-checked human review workflow transition. Use start_review to take a queued task, request_information to return an in-progress task for missing information, or mark_reviewed to record that human review is complete. This records workflow status only; it does not approve, decline, qualify, underwrite, price, fund, or submit a borrower. Request information notes must be brief and contain no sensitive personal data. Confirm the intended action with the user before changing a task.",
      inputSchema: {
        organization_id: z.string().uuid(),
        review_id: z.string().uuid(),
        action: z.enum([
          "start_review",
          "request_information",
          "mark_reviewed",
        ]),
        expected_version: z.number().int().min(1),
        idempotency_key: z.string().min(16).max(200),
        note: z.string().max(500).optional(),
      },
      outputSchema: {
        review_id: z.string().uuid(),
        review_request_id: z.string(),
        status: z.string(),
        version: z.number().int(),
        action: z.string(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: false,
        idempotentHint: true,
      },
    },
    async (
      {
        organization_id,
        review_id,
        action,
        expected_version,
        idempotency_key,
        note = "",
      },
      extra,
    ) => {
      const context = await contextFor(extra);
      requireWorkspace(context, organization_id, true);
      await rateLimit(
        context.db,
        "review_action",
        `${organization_id}:${context.user.id}`,
        60,
        60,
      );
      const updated = await apply(context, organization_id, {
        review_id,
        action,
        expected_version,
        idempotency_key,
        note,
      });
      return result({
        review_id: updated.id,
        review_request_id: updated.review_request_id,
        status: updated.status,
        version: updated.version,
        action,
      });
    },
  );
}
