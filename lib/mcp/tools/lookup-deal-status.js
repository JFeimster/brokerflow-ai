import { registerTool, result } from "../registry.js";
import { readHints } from "../schemas/common.js";
import { dealInput, dealOutput } from "../schemas/deals.js";
import { lookupDealStatus } from "../../deals/service.js";
export function registerLookupDealStatus(
  server,
  { contextFor, lookupDeals = lookupDealStatus },
) {
  registerTool(
    server,
    "lookup_deal_status",
    {
      title: "Look up deal status",
      description:
        "Read organization-scoped operational deal stages, linked review status, task state, last activity and next action. Review status and deal pipeline stage are distinct; neither is a funding decision. Omit IDs for a bounded page.",
      inputSchema: dealInput,
      outputSchema: dealOutput,
      annotations: readHints,
    },
    async ({ organization_id, ...input }, extra) =>
      result(
        await lookupDeals(await contextFor(extra), organization_id, input),
      ),
  );
}
