import { ACTIONS, createPartnerHandler } from "../../lib/partner-action-utils.js";

export function buildPartnerReferral(input) {
  const contactAvailable = Boolean(input.borrower_email || input.borrower_phone);
  const borrower_intake_ready = Boolean(input.borrower_name && contactAvailable && input.requested_amount !== undefined && input.loan_purpose);
  const lender_fit_routing_ready = Boolean(input.referral_type && input.borrower_state && input.requested_amount !== undefined && input.loan_purpose);
  let recommended_next_step;
  if (!input.permission_to_contact) {
    recommended_next_step = input.warm_intro_available ? "request_partner_mediated_warm_introduction" : "collect_borrower_contact_permission";
  } else if (input.warm_intro_available) {
    recommended_next_step = "start_warm_introduction_workflow";
  } else if (borrower_intake_ready) {
    recommended_next_step = "handoff_to_borrower_intake";
  } else {
    recommended_next_step = "complete_referral_intake_details";
  }
  return {
    attribution_status: input.partner_id ? "attributed" : "unverified",
    referral_status: "received",
    recommended_next_step,
    borrower_intake_ready,
    lender_fit_routing_ready,
    message: "Referral captured for workflow routing. Readiness flags describe supplied information only and do not indicate borrower qualification, approval, or funding."
  };
}

export default createPartnerHandler(ACTIONS.referral, buildPartnerReferral);
