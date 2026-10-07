import { ACTIONS, createPartnerHandler, greeting, partnerSegment } from "../../lib/partner-action-utils.js";

const ANGLES = {
  professional_services_coi: "Protect the advisory relationship with useful funding education and a client-controlled introduction.",
  embedded_referral_channel: "Explore an optional funding conversation within the existing service or purchase journey.",
  transaction_partner: "Discuss funding preparation early enough to identify transaction timing and documentation questions.",
  business_network: "Share practical funding education and explore a respectful referral relationship."
};
const SEGMENT_COPY = {
  professional_services_coi: "A useful starting point could be funding education that preserves your advisory role and keeps the client in control of an introduction.",
  embedded_referral_channel: "We could explore an optional referral step that fits your existing service or purchase process.",
  transaction_partner: "We could discuss how to surface funding-preparation questions early in a transaction timeline.",
  business_network: "We could compare which educational topics and introduction process would be useful to your network."
};
const GOALS = {
  initial_introduction: ["introduction", "Would a short introduction to our referral process be useful?", "share_referral_process_overview"],
  partner_program_invite: ["program_invitation", "Would you like an overview of the partner program and its responsibilities?", "share_partner_program_overview"],
  schedule_call: ["discovery_call", "Would a brief call next week be useful?", "coordinate_partner_call"],
  reactivate: ["reactivation", "Would it be useful to revisit whether a referral conversation fits your current priorities?", "confirm_current_partner_priorities"],
  request_referral_relationship: ["referral_relationship", "Could we compare how a permission-based introduction would work for your clients?", "define_referral_handoff_preferences"],
  educational_touch: ["education", "Would a short funding-readiness checklist be useful?", "prepare_educational_resource"],
  event_invitation: ["event_interest", "Would a future educational partner session be of interest?", "confirm_event_details_before_invitation"],
  co_marketing: ["co_marketing", "Would you be open to exploring a joint educational topic?", "outline_co_marketing_topic"],
  follow_up: ["follow_up", "Is this still relevant, or would another time be better?", "confirm_interest_and_timing"]
};

export function buildCampaign(input) {
  const segment = partnerSegment(input.partner_category);
  const reactivation = ["inactive_partner", "former_partner"].includes(input.relationship_stage) || input.outreach_goal === "reactivate";
  const warm = ["warm", "existing_relationship"].includes(input.relationship_stage);
  const cold = ["cold", "aware"].includes(input.relationship_stage);
  const [goalType, goalCta, goalNext] = GOALS[input.outreach_goal];
  const campaignType = reactivation ? "reactivation" : `${cold ? "educational" : "relationship"}_${goalType}`;
  // Notes can select a controlled topic, but never become claims or instructions in message copy.
  const noteText = (input.notes || "").toLowerCase();
  const topic = /inventory/.test(noteText) ? "inventory planning" : /cash.flow|seasonal/.test(noteText) ? "cash-flow planning" : /acquisition|transition/.test(noteText) ? "transaction preparation" : /expansion|growth/.test(noteText) ? "growth planning" : null;
  const angle = `${reactivation ? "Revisit current priorities without assuming past results. " : ""}${ANGLES[segment]}${topic ? ` Explore ${topic} as a discussion topic.` : ""}`;
  const audience = `${input.target_client_type} in ${input.niche}${input.geographic_focus ? ` (${input.geographic_focus})` : ""}`;
  const opening = reactivation
    ? "I wanted to reconnect and learn what would be useful now."
    : warm ? "Could we build on our connection with a practical conversation about referrals?"
      : "I am reaching out to explore whether a funding-education connection could be useful.";
  // Cold scheduling starts with interest, not an assumed meeting or an invented prior conversation.
  const cta = cold && input.outreach_goal === "schedule_call" && !reactivation
    ? "Would a short overview help you decide whether a call is worthwhile?"
    : reactivation ? GOALS.reactivate[1] : goalCta;
  const focus = `A possible discussion topic is supporting ${audience}.`;
  const permission = "Any introduction should follow the client's permission and your communication preferences.";
  const toneLine = input.tone === "consultative" ? "Which part of the client experience would you most want to protect?"
    : input.tone === "friendly" ? "Happy to start with a simple exchange of ideas." : "";
  const fullMessage = [greeting(input.contact_name, input.tone), opening, focus, SEGMENT_COPY[segment], topic ? `One possible educational topic is ${topic}.` : "", toneLine, permission, cta].filter(Boolean).join("\n\n");
  const shortMessage = `${greeting(input.contact_name, input.tone)} ${reactivation ? "Open to reconnecting" : "Open to a funding-education connection"} around ${input.niche}? ${cta}`;
  const linkedin = `${greeting(input.contact_name, input.tone)} ${opening} ${cta}`;
  const phone = `Ask permission to continue. ${opening} ${focus} ${cta} Record contact preferences; do not request borrower records.`;
  const first = input.channel === "phone" ? phone : input.channel === "linkedin" ? linkedin
    : input.channel === "sms" || input.tone === "concise" ? shortMessage : fullMessage;
  const followupChannels = input.channel === "multi_channel" ? ["linkedin", "email"] : [input.channel, input.channel];
  return {
    campaign_type: campaignType,
    partner_segment: segment,
    message_angle: angle,
    email_subjects: [reactivation ? "Revisiting our referral conversation" : `A referral conversation for ${input.company_name}`, `Funding education for ${input.niche}`],
    first_touch_message: first,
    follow_up_sequence: [
      { step: 1, delay_days: 3, channel: followupChannels[0], message: `Following up on a possible referral conversation. ${cta}` },
      { step: 2, delay_days: 7, channel: followupChannels[1], message: "Should I close the loop for now, or is there a better time to reconnect?" }
    ],
    call_notes: [phone, `Discuss ${segment.replaceAll("_", " ")} needs without assuming client demand.`, "Agree on handoff ownership, confidentiality, and follow-up frequency."],
    linkedin_message: linkedin,
    personalization_context: { company_name: input.company_name, niche: input.niche, target_client_type: input.target_client_type, geographic_focus: input.geographic_focus || null, notes: input.notes || null, information_basis: "caller_provided_unverified" },
    sequence_policy: "Suggested delays are measured from first touch. Stop on reply or opt-out; use only permitted channels and existing contact preferences.",
    recommended_next_step: reactivation ? GOALS.reactivate[2] : cold && input.outreach_goal === "schedule_call" ? "share_referral_process_overview" : goalNext,
    message: "Partner outreach draft and campaign route prepared. No outreach was sent by this handler."
  };
}

export default createPartnerHandler(ACTIONS.campaign, buildCampaign);
