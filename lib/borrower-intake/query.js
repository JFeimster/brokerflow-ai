import { requireWorkspace } from "../mcp/context.js";
export async function getBorrowerIntake(context, organizationId, intakeId) {
  requireWorkspace(context, organizationId);
  const { data, error } = await context.db
    .from("leads")
    .select(
      "id,organization_id,assigned_to,first_name,email,phone,metadata,created_at,updated_at",
    )
    .eq("organization_id", organizationId)
    .eq("id", intakeId)
    .eq("source", "brokerflow_mcp")
    .maybeSingle();
  if (error)
    throw Object.assign(new Error("Intake storage unavailable."), {
      status: 503,
    });
  if (!data?.metadata?.brokerflow_intake)
    throw Object.assign(new Error("Intake not found."), { status: 404 });
  return data;
}
