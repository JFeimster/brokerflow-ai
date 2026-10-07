import { ACTIONS, createPartnerHandler } from "../../lib/partner-action-utils.js";

const labels = {
  profile_setup: "Confirm partner profile and preferred contact details.",
  referral_link_setup: "Create and verify the partner referral or tracking link.",
  commission_terms: "Record the documented compensation model for reference; do not approve or calculate compensation.",
  training_materials: "Share role-specific training and funding trigger materials.",
  approved_messaging: "Provide approved referral language and messaging.",
  compliance_disclosures: "Share applicable disclosures and approved-use guidance.",
  crm_tags: "Set CRM partner tags, source attribution, and routing owner.",
  first_referral_steps: "Explain the first-referral intake and status update steps.",
  co_marketing_assets: "Share approved co-marketing assets and usage rules.",
  client_introduction_process: "Document the client-introduction process and consent expectations.",
  funding_trigger_guide: "Share a concise guide to common business funding triggers.",
  confidentiality_expectations: "Explain confidentiality expectations and secure information handling.",
  partner_contact_preferences: "Confirm partner contact preferences and escalation contact.",
  attribution_process: "Explain referral attribution and how to resolve tracking questions.",
  intake_workflow: "Walk through the partner intake workflow and required business context.",
  lead_routing_rules: "Explain lead routing, ownership, and response expectations.",
  partner_status_expectations: "Explain partner status labels and routine status updates.",
  technical_handoff_details: "Confirm technical handoff fields, payload, and destination.",
  escalation_path: "Share the internal escalation path for routing or relationship issues."
};

function selectedItems(input) {
  const items = ["profile_setup", "first_referral_steps", "partner_contact_preferences"];
  if (["affiliate", "embedded_partner"].includes(input.partner_type) || input.referral_model === "affiliate_link") items.push("referral_link_setup", "attribution_process", "approved_messaging", "compliance_disclosures", "co_marketing_assets");
  if (input.partner_type === "professional_services_coi" || input.referral_model === "warm_introduction") items.push("approved_messaging", "client_introduction_process", "funding_trigger_guide", "confidentiality_expectations");
  if (input.partner_type === "channel_partner" || input.referral_model === "channel_referral" || input.referral_model === "embedded_partner") items.push("intake_workflow", "lead_routing_rules", "partner_status_expectations", "technical_handoff_details", "escalation_path");
  if (input.training_required) items.push("training_materials");
  if (input.approved_messaging_required && !items.includes("approved_messaging")) items.push("approved_messaging");
  if (input.crm_setup_required) items.push("crm_tags");
  if (input.compensation_model && !["none", "non_compensated_coi", "unknown"].includes(input.compensation_model)) items.push("commission_terms");
  if (input.referral_model === "co_marketing") items.push("co_marketing_assets", "approved_messaging", "compliance_disclosures");
  return [...new Set(items)];
}

export function buildOnboardingChecklist(input) {
  const requested = selectedItems(input);
  const done = new Set(input.completed_items || []);
  const completed_items = requested.filter((item) => done.has(item));
  const missing_items = requested.filter((item) => !done.has(item));
  const sectionNames = [...new Set(requested.map((item) => ({
    profile_setup: "profile_setup", referral_link_setup: "referral_link_setup", commission_terms: "commission_terms",
    training_materials: "training_materials", approved_messaging: "approved_messaging", compliance_disclosures: "approved_messaging",
    crm_tags: "crm_tags", first_referral_steps: "first_referral_steps", co_marketing_assets: "co_marketing_assets",
    client_introduction_process: "first_referral_steps", funding_trigger_guide: "training_materials", confidentiality_expectations: "approved_messaging",
    partner_contact_preferences: "profile_setup", attribution_process: "referral_link_setup", intake_workflow: "first_referral_steps",
    lead_routing_rules: "crm_tags", partner_status_expectations: "crm_tags", technical_handoff_details: "crm_tags", escalation_path: "first_referral_steps"
  })[item]))];
  const checklist_sections = sectionNames.map((section) => ({
    section,
    items: requested.filter((item) => ({
      profile_setup: ["profile_setup", "partner_contact_preferences"], referral_link_setup: ["referral_link_setup", "attribution_process"],
      commission_terms: ["commission_terms"], training_materials: ["training_materials", "funding_trigger_guide"],
      approved_messaging: ["approved_messaging", "client_introduction_process", "confidentiality_expectations", "compliance_disclosures"],
      crm_tags: ["crm_tags", "lead_routing_rules", "partner_status_expectations", "technical_handoff_details"],
      first_referral_steps: ["first_referral_steps", "intake_workflow", "escalation_path"], co_marketing_assets: ["co_marketing_assets"]
    })[section].includes(item)).map((item) => ({ item, label: labels[item], status: done.has(item) ? "completed" : "missing" }))
  }));
  const status = input.current_onboarding_status || "not_started";
  const onboarding_priority = status === "blocked" ? "high" : missing_items.length >= 6 ? "high" : missing_items.length ? "normal" : "low";
  return {
    onboarding_priority,
    partner_segment: input.partner_type,
    checklist_sections,
    missing_items,
    completed_items,
    recommended_next_step: status === "blocked" ? "resolve_the_recorded_onboarding_blocker" : missing_items[0] ? `complete_${missing_items[0]}` : "confirm_partner_is_ready_for_routine_referral_activity",
    message: `Onboarding checklist prepared with ${missing_items.length} outstanding item${missing_items.length === 1 ? "" : "s"}. Compensation details are descriptive only and require separate authorization for any terms or payment action.`
  };
}

export default createPartnerHandler(ACTIONS.onboarding, buildOnboardingChecklist);
