import { requireWorkspace } from "../mcp/context.js";
export async function workflowRpc(
  context,
  organizationId,
  name,
  input,
  key,
  write = true,
) {
  requireWorkspace(context, organizationId, write);
  const { data, error } = await context.db.rpc(name, {
    p_organization_id: organizationId,
    p_actor_user_id: context.user.id,
    p_input: input,
    ...(write ? { p_idempotency_key: key } : {}),
  });
  if (error) {
    const status =
      {
        42501: 403,
        23505: 409,
        40001: 409,
        P0002: 404,
        23503: 422,
        22023: 422,
        "22P02": 422,
        23514: 422,
      }[error.code] || 503;
    const message = {
      403: "Workspace permission denied.",
      409: "Reference already exists with different input or idempotency key was reused.",
      404: "Reference not found in this workspace.",
      422: "Invalid input, reference, consent, or assigned workspace member.",
      503: "Workflow storage unavailable. Verify the approved migration is installed.",
    }[status];
    throw Object.assign(new Error(message), { status });
  }
  return data;
}
