import { z } from "zod";
import { registerTool, result } from "../registry.js";
import { requireWorkspace } from "../context.js";
import { writeHints } from "../schemas/common.js";
import { reviewInput, reviewOutput } from "../schemas/reviews.js";
import { validateReview } from "../../reviews/validation.js";
import { workflowRpc } from "../../workflows/rpc.js";
export function registerRequestLenderMatchReview(
  server,
  { contextFor, create, rateLimit },
) {
  registerTool(
    server,
    "request_lender_match_review",
    {
      title: "Request lender match human review",
      description:
        "Compatibility operation for create_review_request using the same records, scenario validation, idempotency and human review queue. Confirm creation with the user, then supply confirmed=true. Optional intake_id links its deal atomically. No underwriting, borrower approval or lender submission.",
      inputSchema: {
        ...reviewInput,
        confirmed: z.literal(true),
        intake_id: z.string().uuid().optional(),
      },
      outputSchema: reviewOutput,
      annotations: writeHints,
    },
    async (
      { organization_id, idempotency_key, scenario, intake_id },
      extra,
    ) => {
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
      const created = intake_id
        ? await workflowRpc(
            context,
            organization_id,
            "brokerflow_request_lender_match_review",
            { intake_id, scenario: normalized },
            idempotency_key,
          )
        : await create(
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
}
