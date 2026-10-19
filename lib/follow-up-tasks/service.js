import { validateTaskInput } from "./validation.js";

function databaseError(error, operation) {
  if (error?.code === "42501") return Object.assign(new Error("Workspace access denied."), { status: 403, code: "workspace_access_denied" });
  if (error?.code === "23505" || error?.code === "22023" || error?.code === "40001") {
    return Object.assign(new Error("The task changed or the idempotency key was reused with different input."), { status: 409, code: "conflict" });
  }
  if (error?.code === "P0002") return Object.assign(new Error("Task not found."), { status: 404, code: "not_found" });
  if (error?.code === "23503") return Object.assign(new Error("The assigned owner or related review is not active in this workspace."), { status: 422, code: "invalid_reference" });
  return Object.assign(new Error(`Unable to ${operation} follow-up task.`), { status: 503, code: "storage_unavailable" });
}

export async function createFollowUpTask(context, organizationId, input, actorId = context.user.id) {
  const task = validateTaskInput(input);
  const { data, error } = await context.db.rpc("brokerflow_create_follow_up_task", {
    p_organization_id: organizationId,
    p_actor_user_id: actorId,
    p_idempotency_key: task.idempotency_key,
    p_task: {
      title: task.title,
      description: task.description,
      task_type: task.task_type,
      assigned_to: task.assigned_to,
      review_id: task.review_id,
      due_date: task.due_date,
    },
  });
  if (error) throw databaseError(error, "create");
  return data;
}

export async function completeFollowUpTask(context, organizationId, taskId, idempotencyKey, actorId = context.user.id) {
  if (typeof idempotencyKey !== "string" || idempotencyKey.length < 16 || idempotencyKey.length > 200) {
    throw Object.assign(new Error("idempotency_key must be between 16 and 200 characters."), { status: 422, code: "invalid_input" });
  }
  const { data, error } = await context.db.rpc("brokerflow_complete_follow_up_task", {
    p_organization_id: organizationId,
    p_task_id: taskId,
    p_actor_user_id: actorId,
    p_idempotency_key: idempotencyKey,
  });
  if (error) throw databaseError(error, "complete");
  return data;
}

export async function getFollowUpTask(context, organizationId, taskId) {
  const { data, error } = await context.db
    .from("brokerflow_follow_up_tasks")
    .select(
      "id,organization_id,review_id,assigned_to,task_type,title,description,due_date,status,created_by,created_at,completed_by,completed_at",
    )
    .eq("organization_id", organizationId)
    .eq("id", taskId)
    .maybeSingle();
  if (error) throw databaseError(error, "read");
  if (!data)
    throw Object.assign(new Error("Task not found."), {
      status: 404,
      code: "not_found",
    });
  return {
    ...data,
    due_date:
      data.due_date instanceof Date
        ? data.due_date.toISOString().slice(0, 10)
        : data.due_date,
    created_at:
      data.created_at instanceof Date
        ? data.created_at.toISOString()
        : data.created_at,
    completed_at:
      data.completed_at instanceof Date
        ? data.completed_at.toISOString()
        : data.completed_at,
  };
}
