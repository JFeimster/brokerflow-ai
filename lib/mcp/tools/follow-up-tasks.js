import { z } from "zod";
import { registerTool, result } from "../registry.js";
import { requireWorkspace } from "../context.js";
import { validateTaskInput } from "../../follow-up-tasks/validation.js";

export function registerFollowUpTasks(
  server,
  { contextFor, create, apply, createTask, completeTask, rateLimit },
) {
  registerTool(
    server,
    "create_follow_up_task",
    {
      title: "Create a follow-up task",
      description:
        "Create an accountable, organization-scoped internal follow-up task for an explicit operational request. Supports optional review linkage, active organization owner, and due date. This does not send messages, retrieve borrower records, or make a borrower decision.",
      inputSchema: {
        organization_id: z.string().uuid(),
        idempotency_key: z.string().min(16).max(200),
        title: z.string().min(1).max(160),
        description: z.string().max(500).optional(),
        task_type: z.enum([
          "call",
          "email",
          "request_information",
          "document_follow_up",
          "internal_review",
          "other",
        ]),
        assigned_to: z.string().uuid().optional(),
        review_id: z.string().uuid().optional(),
        due_date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      },
      outputSchema: {
        id: z.string().uuid(),
        organization_id: z.string().uuid(),
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
    async ({ organization_id, idempotency_key, ...input }, extra) => {
      const context = await contextFor(extra);
      requireWorkspace(context, organization_id, true);
      const validatedInput = validateTaskInput({ ...input, idempotency_key });
      await rateLimit(
        context.db,
        "review_create",
        `${organization_id}:${context.user.id}:follow_up_task`,
        30,
        60,
      );
      const task = await createTask(
        context,
        organization_id,
        validatedInput,
        context.user.id,
      );
      return result({ ...task, duplicate: Boolean(task.duplicate) });
    },
  );

  registerTool(
    server,
    "list_follow_up_tasks",
    {
      title: "List follow-up tasks",
      description:
        "List internal follow-up tasks in an explicitly selected authorized organization, optionally filtered by status, assigned owner, related review, or due date. Borrower records and external CRM data are not returned.",
      inputSchema: {
        organization_id: z.string().uuid(),
        status: z.enum(["open", "completed"]).optional(),
        assigned_to: z.string().uuid().optional(),
        review_id: z.string().uuid().optional(),
        due_before: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        limit: z.number().int().min(1).max(100).optional(),
        cursor: z.number().int().min(0).optional(),
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
    async (
      {
        organization_id,
        status,
        assigned_to,
        review_id,
        due_before,
        limit = 50,
        cursor = 0,
      },
      extra,
    ) => {
      const context = await contextFor(extra);
      requireWorkspace(context, organization_id);
      if (
        due_before &&
        (Number.isNaN(Date.parse(`${due_before}T00:00:00Z`)) ||
          new Date(`${due_before}T00:00:00Z`).toISOString().slice(0, 10) !==
            due_before)
      ) {
        throw Object.assign(
          new Error("due_before must be a valid YYYY-MM-DD date."),
          { status: 422, code: "invalid_input" },
        );
      }
      let query = context.db
        .from("brokerflow_follow_up_tasks")
        .select(
          "id,organization_id,review_id,assigned_to,task_type,title,description,due_date,status,created_by,created_at,completed_by,completed_at",
          { count: "exact" },
        )
        .eq("organization_id", organization_id);
      if (status) query = query.eq("status", status);
      if (assigned_to) query = query.eq("assigned_to", assigned_to);
      if (review_id) query = query.eq("review_id", review_id);
      if (due_before) query = query.lte("due_date", due_before);
      const { data, error, count } = await query
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true })
        .range(cursor, cursor + limit - 1);
      if (error)
        throw Object.assign(new Error("Unable to load follow-up tasks."), {
          status: 503,
        });
      const items = data || [];
      const nextOffset = cursor + items.length;
      return result({
        items,
        total_count: count || 0,
        next_cursor: nextOffset < (count || 0) ? nextOffset : null,
      });
    },
  );

  registerTool(
    server,
    "complete_follow_up_task",
    {
      title: "Complete a follow-up task",
      description:
        "Mark one authorized organization's open internal task complete with an attributable actor and idempotency key. This records task workflow only and does not send a message or update an external CRM.",
      inputSchema: {
        organization_id: z.string().uuid(),
        task_id: z.string().uuid(),
        idempotency_key: z.string().min(16).max(200),
      },
      outputSchema: {
        id: z.string().uuid(),
        organization_id: z.string().uuid(),
        status: z.literal("completed"),
        completed_by: z.string().uuid(),
        completed_at: z.string(),
        duplicate: z.boolean(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: false,
        idempotentHint: true,
      },
    },
    async ({ organization_id, task_id, idempotency_key }, extra) => {
      const context = await contextFor(extra);
      requireWorkspace(context, organization_id, true);
      await rateLimit(
        context.db,
        "review_action",
        `${organization_id}:${context.user.id}:follow_up_task`,
        60,
        60,
      );
      const task = await completeTask(
        context,
        organization_id,
        task_id,
        idempotency_key,
        context.user.id,
      );
      return result({ ...task, duplicate: Boolean(task.duplicate) });
    },
  );
}
