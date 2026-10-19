import { registerTool, result } from "../registry.js";
import { requireWorkspace } from "../context.js";
import { readHints } from "../schemas/common.js";
import { routingInput, routingOutput } from "../schemas/lender-fit.js";
import { routeLenderFit } from "../../lender-fit/service.js";
export function registerRouteLenderFit(server, { contextFor }) {
  registerTool(
    server,
    "route_lender_fit",
    {
      title: "Preliminary lender routing",
      description:
        "Compute preliminary product paths without outbound effects. Legacy scores are internal heuristics, never underwriting, eligibility or current lender offers. Broker review is required.",
      inputSchema: routingInput,
      outputSchema: routingOutput,
      annotations: readHints,
    },
    async ({ organization_id, scenario }, extra) => {
      requireWorkspace(await contextFor(extra), organization_id);
      return result(routeLenderFit(scenario));
    },
  );
}
