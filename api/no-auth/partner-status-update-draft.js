import { ACTIONS, createPartnerHandler } from "../../lib/partner-action-utils.js";

const stageMessages = {
  referral_received: "We received the referral.",
  borrower_contacted: "We have connected with the business owner.",
  intake_in_progress: "Intake is in progress.",
  documents_requested: "We have requested information needed to continue.",
  documents_pending: "We are waiting on requested information.",
  documents_received: "The requested information has been received.",
  lender_fit_review: "The scenario is being reviewed for potential routing options.",
  options_under_review: "Potential options are being reviewed.",
  submission_preparation: "The file has moved to the next process stage.",
  submitted: "The file has moved to the next process stage.",
  pending_lender_response: "A response is pending.",
  additional_information_needed: "Additional information is needed before the process can continue.",
  closed_funded: "The process is complete.",
  closed_not_funded: "The process is complete.",
  inactive: "The process is currently inactive.",
  withdrawn: "The process is complete."
};
const restrictedTerms = /credit|score|bank|balance|cash\s*flow|financial|revenue|income|debt|tax|declin|underwrit|private\s*lender|lender\s*note|pricing|interest\s*rate|apr|loan\s*amount|requested\s*amount|loan\s*term|ssn|social\s*security|date\s*of\s*birth|account\s*number|routing\s*number|statement|sensitive\s*document/i;
const doNotShare = ["Credit scores or reports", "Bank balances or account details", "Detailed financial or tax information", "Decline reasons or private lender notes", "Sensitive document contents", "Unapproved pricing, rates, or terms", "Any promise of lender acceptance or funding"];

export function buildPartnerStatusUpdate(input) {
  const disclosure_level = input.borrower_disclosure_level || "minimal";
  const details = disclosure_level === "expanded_with_consent"
    ? (input.allowed_details || []).filter((detail) => !restrictedTerms.test(detail) && !(input.restricted_details || []).some((restricted) => restricted && detail.toLowerCase().includes(restricted.toLowerCase())))
    : [];
  const safe_partner_update = [stageMessages[input.deal_stage], ...details].join(" ");
  const recommended_next_step = input.deal_stage === "additional_information_needed" || input.deal_stage === "documents_pending"
    ? "coordinate_requested_information"
    : ["closed_funded", "closed_not_funded", "withdrawn"].includes(input.deal_stage)
      ? "log_final_status_and_update_partner"
      : input.deal_stage === "inactive"
        ? "confirm_reactivation_timing"
        : "continue_current_workflow";
  return {
    safe_partner_update,
    disclosure_level,
    do_not_share_items: doNotShare,
    recommended_next_step,
    message: "Partner-safe status draft prepared. Review the recipient and any consent basis before sending; no funding or lender outcome is promised."
  };
}

export default createPartnerHandler(ACTIONS.statusUpdate, buildPartnerStatusUpdate);
