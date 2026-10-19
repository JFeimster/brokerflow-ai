import { workflowRpc } from "../workflows/rpc.js";
export async function lookupDealStatus(context, organizationId, input) {
  return workflowRpc(
    context,
    organizationId,
    "brokerflow_lookup_deal_status",
    input,
    undefined,
    false,
  );
}
