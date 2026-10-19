import { registerTool, result } from "../registry.js";
import { requireWorkspace } from "../context.js";
import { writeHints } from "../schemas/common.js";
import { captureInput, captureOutput } from "../schemas/borrower.js";
import { captureBorrowerIntake } from "../../borrower-intake/service.js";
export function registerCaptureBorrowerIntake(
  server,
  { contextFor, rateLimit, captureIntake = captureBorrowerIntake },
) {
  registerTool(
    server,
    "capture_borrower_intake",
    {
      title: "Capture borrower intake",
      description:
        "After explicit user confirmation, save a permissioned intake and operational deal for broker review. Requires confirmed=true. No borrower decision or communication is made.",
      inputSchema: captureInput,
      outputSchema: captureOutput,
      annotations: writeHints,
    },
    async ({ organization_id, idempotency_key, intake }, extra) => {
      const context = await contextFor(extra);
      requireWorkspace(context, organization_id, true);
      await rateLimit(
        context.db,
        "review_create",
        `${organization_id}:${context.user.id}:intake`,
        30,
        60,
      );
      return result(
        await captureIntake(context, organization_id, intake, idempotency_key),
      );
    },
  );
}
