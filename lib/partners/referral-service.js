import { getPartnerReference } from "./referral-query.js";
import { getBorrowerIntake } from "../borrower-intake/query.js";
import { validateReferral } from "./referral-validation.js";
import { buildPartnerReferral } from "./attribution.js";
import { workflowRpc } from "../workflows/rpc.js";
export async function capturePartnerReferral(
  context,
  organizationId,
  input,
  key,
) {
  const partner = await getPartnerReference(
    context,
    organizationId,
    input.partner_id,
  );
  const intake = await getBorrowerIntake(
    context,
    organizationId,
    input.intake_id,
  );
  const scenario = intake.metadata.brokerflow_intake.scenario;
  const purpose = scenario.loan_purpose;
  const referral_type =
    {
      commercial_real_estate: "commercial_real_estate",
      equipment_financing: "equipment_financing",
      sba_review: "sba_or_bank",
      residential_purchase: "residential_mortgage",
      residential_refinance: "residential_mortgage",
      business_working_capital: "working_capital",
    }[purpose] || "other";
  const legacy = validateReferral({
    source: "custom_gpt",
    action_type: "partner_referral",
    partner_id: partner.id,
    partner_name: partner.name,
    referral_type,
    permission_to_contact: input.permission_to_contact,
    warm_intro_available: input.warm_intro_available,
    borrower_name: intake.first_name,
    ...(intake.email ? { borrower_email: intake.email } : {}),
    ...(intake.phone ? { borrower_phone: intake.phone } : {}),
    borrower_state: scenario.state,
    requested_amount: scenario.requested_amount,
    loan_purpose: scenario.loan_purpose,
  });
  return workflowRpc(
    context,
    organizationId,
    "brokerflow_capture_partner_referral",
    {
      ...input,
      recommended_next_step: buildPartnerReferral(legacy).recommended_next_step,
    },
    key,
  );
}
