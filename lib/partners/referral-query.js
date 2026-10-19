import { requireWorkspace } from "../mcp/context.js";
export async function getPartnerReference(context, organizationId, partnerId) {
  requireWorkspace(context, organizationId);
  const { data, error } = await context.db
    .from("partners")
    .select("id,name,status")
    .eq("organization_id", organizationId)
    .eq("id", partnerId)
    .maybeSingle();
  if (error)
    throw Object.assign(new Error("Partner storage unavailable."), {
      status: 503,
    });
  if (!data || data.status !== "active")
    throw Object.assign(
      new Error("Active partner not found in this workspace."),
      { status: 404 },
    );
  return data;
}
