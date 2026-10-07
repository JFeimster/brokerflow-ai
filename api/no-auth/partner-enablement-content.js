import { ACTIONS, partnerSegment, createPartnerHandler } from "../../lib/partner-action-utils.js";

const guidance = {
  accountant_cpa: ["Spot cash-flow timing gaps, upcoming tax payments, seasonal liquidity needs, and planned growth.", "Ask whether the owner wants an introduction to discuss available business funding options."],
  bookkeeper: ["Notice recurring cash-flow timing pressure, payables concentration, and planned expansion.", "Use a permission-based introduction and share only information the business has authorized."],
  tax_advisor: ["Listen for tax-payment timing, seasonal liquidity needs, and growth plans.", "Describe a conversation with a funding resource without implying a tax or lending outcome."],
  business_broker: ["Surface buyer acquisition financing needs, transaction timing, and buyer or seller liquidity gaps.", "Keep transaction details private and route financing questions through the agreed introduction process."],
  attorney: ["Recognize transaction-related capital needs, acquisition plans, or restructuring context.", "Do not imply legal advice, lender acceptance, or a lending outcome."],
  small_business_attorney: ["Recognize transaction-related capital needs, acquisition plans, or restructuring context.", "Keep legal advice separate from a funding introduction and avoid implying an outcome."],
  merchant_services: ["Notice observable growth, transaction-volume changes, payroll pressure, and expansion events.", "Ask permission before making an introduction; do not infer creditworthiness from transaction activity."],
  payroll_provider: ["Notice payroll pressure, hiring or expansion events, and timing needs reported by the business.", "Share the agreed referral path without making funding promises."],
  equipment_vendor: ["Identify purchase timing or financing friction that may delay a business equipment decision.", "Offer an introduction as an option; avoid suggesting approval or guaranteed funding."],
  fractional_cfo: ["Discuss forecasted liquidity needs, working-capital timing, and planned growth.", "Keep scenario discussion educational and separate from underwriting or pricing."],
  default: ["Listen for a business need or upcoming event that may warrant an optional funding conversation.", "Use approved messaging, ask permission, and follow the agreed referral process."]
};

const titles = {
  referral_cheat_sheet: "Partner referral cheat sheet", funding_trigger_guide: "Business funding trigger guide", conversation_script: "Partner conversation script",
  email_template: "Partner email template", linkedin_template: "Partner LinkedIn template", faq: "Partner funding referral FAQ",
  one_pager: "Partner enablement one pager", training_outline: "Partner training outline", call_script: "Partner call script",
  partner_playbook: "Partner referral playbook", objection_guide: "Partner objection guide", educational_article: "Partner education article"
};

export function buildEnablementContent(input) {
  const tips = guidance[input.partner_category] || guidance.default;
  const focus = input.funding_product_focus ? ` Focus area: ${input.funding_product_focus}.` : "";
  const context = input.use_case ? ` Intended use: ${input.use_case}.` : "";
  const title = titles[input.content_type];
  const audience = input.target_audience;
  const greeting = input.tone === "friendly" ? "Hi" : "Hello";
  const invitation = input.tone === "concise" ? "Ask permission to make an introduction." : input.tone === "friendly" ? "Would an introduction be helpful? Ask before sharing contact details." : "Ask whether the business would like an introduction before sharing contact details.";
  const close = "An exploratory conversation does not guarantee approval, rates, terms, lender acceptance, or funding.";
  const outline = `For ${input.business_type} partners speaking with ${audience}:${focus}${context}\n\n- ${tips[0]}\n- ${tips[1]}\n- ${invitation}`;
  let draft_content;
  switch (input.format || "bullet_guide") {
    case "email":
      draft_content = `Subject: A resource for business funding conversations\n\n${greeting},\n\n${outline}\n\n${close}`;
      break;
    case "script":
      draft_content = `${title}\n\nOpening: “${greeting}, I wanted to share a resource that may be relevant to your business.”\n\nContext: ${tips[0]}\n\nAsk: “${invitation}”\n\nBoundary: ${close}`;
      break;
    case "faq":
      draft_content = `${title}\n\nQ: What should a partner listen for?\nA: ${tips[0]}\n\nQ: How should an introduction happen?\nA: ${tips[1]} ${invitation}\n\nQ: Does an introduction guarantee funding?\nA: No. ${close}`;
      break;
    case "presentation_outline":
    case "training_module":
      draft_content = `${title}\n\n1. Learning goal\nRecognize a business need that the owner wants to discuss.\n\n2. Signals\n- ${tips[0]}\n- ${tips[1]}\n\n3. Practice\nRole-play a permission-based introduction for ${audience}.\n\n4. Reminder\n${close}`;
      break;
    case "long_form":
      draft_content = `${title}\n\nAudience and use\n${outline}\n\nConversation guidance\nStart with the business event the owner raised. Keep the conversation educational, do not infer creditworthiness, and let the owner choose whether to explore an introduction. ${tips[1]}\n\nSafe boundary\n${close}`;
      break;
    case "short_form":
      draft_content = `${tips[0]} ${invitation} ${close}`;
      break;
    default:
      draft_content = `${title}\n\n${outline}\n\nSuggested language: “${greeting}, if useful, I can introduce you to a business funding resource for an initial conversation. ${close}”`;
  }
  return {
    content_title: title,
    content_type: input.content_type,
    target_partner_segment: partnerSegment(input.partner_category),
    draft_content,
    usage_notes: ["Adapt examples to the partner's approved scope and audience.", `Prepare for the requested ${input.distribution_channel || "partner"} distribution channel.`, "Use only the approved referral and consent workflow.", "Keep private borrower or business records out of no-auth requests and shared content."],
    compliance_safe_notes: ["Do not promise approval, rates, terms, lender acceptance, or funding certainty.", "This material is educational and does not make borrower eligibility or underwriting decisions."],
    recommended_next_step: "review_against_current_approved_messaging_then_share_with_the_partner",
    message: "Partner-specific educational content prepared for review and distribution."
  };
}

export default createPartnerHandler(ACTIONS.enablement, buildEnablementContent);
