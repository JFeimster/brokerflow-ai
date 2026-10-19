import { registerTool, result } from "../registry.js";
import { requireWorkspace } from "../context.js";
import { writeHints } from "../schemas/common.js";
import { referralInput, referralOutput } from "../schemas/partners.js";
import { capturePartnerReferral } from "../../partners/referral-service.js";
export function registerCapturePartnerReferral(
  server,
  { contextFor, rateLimit, captureReferral = capturePartnerReferral },
) {
  registerTool(
    server,
    "capture_partner_referral",
    {
      title: "Capture partner referral",
      description:
        "After explicit user confirmation (confirmed=true), persist a referral from an active same-workspace partner to a captured intake, using canonical attribution and audit records. Contact permission is recorded, not inferred. No commission, payout authorization or outbound contact.",
      inputSchema: referralInput,
      outputSchema: referralOutput,
      annotations: writeHints,
    },
    async (
      { organization_id, idempotency_key, confirmed, ...input },
      extra,
    ) => {
      const context = await contextFor(extra);
      requireWorkspace(context, organization_id, true);
      await rateLimit(
        context.db,
        "review_create",
        `${organization_id}:${context.user.id}:referral`,
        30,
        60,
      );
      return result(
        await captureReferral(context, organization_id, input, idempotency_key),
      );
    },
  );
}
