import { ACTIONS, createPartnerHandler } from "../../lib/partner-action-utils.js";

export function buildPartnerAttributionLog(input) {
  const requires_review = input.dispute_flag || input.attribution_status === "disputed" || input.attribution_status === "duplicate_check_needed" || input.commission_status === "disputed";
  let recommended_next_step = "no_action_required";
  if (input.dispute_flag || input.attribution_status === "disputed" || input.commission_status === "disputed") recommended_next_step = "review_compensation_dispute";
  else if (input.attribution_status === "duplicate_check_needed") recommended_next_step = "review_duplicate";
  else if (input.attribution_status === "unverified") recommended_next_step = "verify_attribution";
  else if (["pending_completion"].includes(input.commission_status) || input.payout_stage === "awaiting_deal_completion") recommended_next_step = "await_deal_completion";
  else if (["pending_payment"].includes(input.commission_status) || ["awaiting_review", "approved_external_system", "scheduled_external_system"].includes(input.payout_stage)) recommended_next_step = "await_payment_workflow";
  return {
    attribution_status: input.attribution_status,
    commission_status: input.commission_status,
    payout_stage: input.payout_stage,
    requires_review,
    recommended_next_step,
    message: "Attribution and commission metadata logged for workflow use only. This request does not authorize payment, calculate a binding commission, or update a private payout ledger."
  };
}

export default createPartnerHandler(ACTIONS.attribution, buildPartnerAttributionLog);
