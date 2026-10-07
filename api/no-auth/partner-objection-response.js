import { ACTIONS, createPartnerHandler, greeting, partnerSegment } from "../../lib/partner-action-utils.js";

const RESPONSES = {
  client_relationship_risk: ["Your client relationship should guide the handoff. We can agree on who introduces whom, what may be shared, and when follow-up is appropriate before an introduction.", "What communication boundaries would you want in place?", "Document the partner's role, the client's permission, and the follow-up owner.", "define_client_handoff_preferences"],
  spam_concern: ["A referral conversation should respect contact preferences. We can define an opt-in introduction, a limited follow-up cadence, and a clear stop-contact path.", "Which channel and follow-up frequency would be comfortable?", "Record contact preferences and apply suppression rules before any outreach.", "record_contact_preferences"],
  compensation_question: ["Compensation, if available, depends on the applicable written program terms and any required review. I can help obtain the current terms; this conversation does not establish a fee, split, entitlement, or payment commitment.", "Would you like the program owner to provide the current written terms?", "Use terms from an authorized source and confirm applicability before discussing a specific commitment.", "request_authorized_compensation_terms"],
  compliance_question: ["The answer depends on the proposed activity, location, and applicable requirements. I can summarize the workflow and the questions for the appropriate compliance or legal specialist, but cannot determine whether the arrangement is permitted.", "Which activity and jurisdiction need clarification?", "Describe the exact activity for specialist review without offering a legal conclusion.", "route_specific_compliance_question"],
  who_should_i_refer: ["A useful introduction starts with a business owner who wants to discuss a funding need and permits contact. Business purpose, timing, and preferred next step can guide that conversation; they do not establish lending eligibility.", "Which business situations do your clients ask you about most often?", "Start with non-sensitive context and use an authorized secure process for any later records.", "share_referral_scenario_examples"],
  already_have_lender: ["An existing lender relationship can remain central. We can explore whether funding preparation or an additional conversation would be useful in situations your current relationship does not address.", "Are there situations where clients still need help preparing questions or documents?", "Define a complementary role without claiming a better offer or outcome.", "identify_complementary_referral_situations"],
  bank_only_clients: ["We can respect a client's preference for bank financing and focus on organizing questions and readiness information. Any introduction should follow the client's preferences and the recipient's actual review process.", "Would preparation for a bank conversation be useful to your clients?", "Do not pressure clients toward a product or imply that bank criteria have been met.", "discuss_bank_conversation_preparation"],
  do_not_want_financing_role: ["The proposed role can focus on a permission-based introduction. We should define responsibilities clearly so you are not asked to quote terms, collect private records, or make financing decisions.", "Would an introduction-only process address your concern?", "Document roles and refer any licensing or activity questions to a specialist.", "outline_introduction_only_workflow"],
  too_busy: ["We can start with a short process outline and a single contact for introductions, then decide whether it merits more time.", "Would a brief written overview be easier than a call?", "Keep the next step small and leave timing with the partner.", "prepare_short_process_overview"],
  need_more_information: ["I can prepare a concise overview of the referral process, communication boundaries, and responsibilities so you can decide what else you need to know.", "Which part of the process would you like clarified first?", "Provide only verified materials and identify any unanswered questions.", "prepare_requested_program_information"],
  trust_concern: ["It makes sense to understand the process before involving a client. We can walk through a controlled introduction, confidentiality expectations, and who may communicate with the client.", "What would you need to verify before considering an introduction?", "Offer verifiable process information without inventing testimonials, safeguards, or prior results.", "document_trust_and_confidentiality_expectations"],
  other: ["I would like to understand the concern before suggesting a next step. We can clarify the proposed role and discuss whether a referral relationship would be useful.", "What specific concern would you most like addressed?", "Acknowledge uncertainty and avoid assuming facts about the partner.", "clarify_partner_concern"]
};

function classify(input) {
  const text = `${input.objection_text} ${input.notes || ""}`.toLowerCase();
  // Risk-sensitive questions take precedence even when the caller selected another label.
  if (input.objection_type === "compliance_question" || /\b(legal|compliance|licens\w*|regulat\w*|lawful|kickback)\b/.test(text)) return "compliance_question";
  if (input.objection_type === "compensation_question" || /\b(compensation|commission|payout|fee|split|paid)\b/.test(text)) return "compensation_question";
  if (input.objection_type !== "other") return input.objection_type;
  if (/spam|unsolicited|stop contact|opt.out/.test(text)) return "spam_concern";
  if (/confiden|trust|privacy/.test(text)) return "trust_concern";
  if (/client relationship|lose.*client/.test(text)) return "client_relationship_risk";
  if (/already.*lender/.test(text)) return "already_have_lender";
  if (/busy|no time/.test(text)) return "too_busy";
  return "other";
}

export function buildObjectionResponse(input) {
  const category = classify(input);
  const [response, question, trust, next] = RESPONSES[category];
  const acknowledgment = { professional: "Thank you for raising this.", friendly: "Thanks for sharing that concern.", consultative: "Let's clarify what would make this workable.", concise: "Understood." }[input.desired_tone];
  const context = partnerSegment(input.partner_category) === "professional_services_coi"
    ? "The starting point is protecting your advisory relationship."
    : partnerSegment(input.partner_category) === "embedded_referral_channel"
      ? "Any referral step should fit your existing service or purchase process."
      : "The starting point is a clear role and a respectful handoff.";
  const short = `${acknowledgment} ${response}`;
  const full = `${greeting(input.contact_name, input.desired_tone)}\n\n${short}\n\n${context} ${question}`;
  return {
    objection_category: category,
    recommended_response: ["sms", "linkedin"].includes(input.response_channel) || input.desired_tone === "concise" ? short : input.response_channel === "phone" ? `Talking points: ${short} ${question}` : full,
    short_response: short,
    follow_up_question: question,
    trust_builder: trust,
    compliance_safe_notes: [
      "No approval, funding, rates, eligibility, or outcome is promised.",
      "Caller notes and request credentials are not evidence of approved compensation terms; this endpoint states no specific terms.",
      "Set controlled communications and confidentiality expectations without claiming verified safeguards.",
      category === "compliance_question" ? "Specialist review is for the specific legal or compliance question; drafting and internal routing may continue." : "Routine drafting and internal follow-up do not require a blanket human-review gate."
    ],
    requires_specialist_review: category === "compliance_question",
    recommended_next_step: input.relationship_stage === "inactive_partner" && category === "other" ? "clarify_concern_before_reactivation" : next,
    message: "Partner objection response drafted. No partner message was sent by this handler."
  };
}

export default createPartnerHandler(ACTIONS.objection, buildObjectionResponse);
