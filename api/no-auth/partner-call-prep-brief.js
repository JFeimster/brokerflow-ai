import { ACTIONS, createPartnerHandler, partnerSegment } from "../../lib/partner-action-utils.js";

const PROFILES = {
  advisory: {
    audience: "Business owners seeking accounting, tax, bookkeeping, or financial advice",
    triggers: ["Cash-flow gaps", "Tax obligations", "Expansion funding", "Seasonal working-capital needs"],
    pitch: "Explore funding-readiness education while preserving client trust and the advisor's role.",
    questions: ["When do clients raise cash-flow or tax-timing questions?", "What would protect client trust during an introduction?"],
    objections: ["client_relationship_risk", "do_not_want_financing_role"],
    cross: ["Explore permission-based introductions for bookkeeping or planning support."]
  },
  attorney: {
    audience: "Business owners navigating transactions, disputes, growth, or restructuring",
    triggers: ["Acquisitions", "Disputes affecting business timing", "Growth events", "Restructuring", "Transaction deadlines"],
    pitch: "Clarify transaction timing and referral boundaries without offering legal conclusions.",
    questions: ["Which transaction stages create funding-preparation questions?", "Which confidentiality and professional-responsibility questions need specialist clarification?"],
    objections: ["compliance_question", "client_relationship_risk"],
    cross: ["Explore introductions to independent legal support when the owner requests it; make no fee-sharing commitment."]
  },
  broker: {
    audience: "Business buyers and sellers evaluating acquisitions or transitions",
    triggers: ["Acquisition financing preparation", "Seller transitions", "Buyer liquidity questions", "Deal-completion risk and timing"],
    pitch: "Surface financing preparation and timeline questions early without implying a transaction will close.",
    questions: ["Where do financing questions slow a transaction?", "What can be discussed without sharing confidential buyer or seller records?"],
    objections: ["already_have_lender", "client_relationship_risk"],
    cross: ["Explore buyer or seller introductions with permission and documented transaction roles."]
  },
  merchant: {
    audience: "Merchants using payment processing and related business services",
    triggers: ["Transaction-volume changes", "Merchant growth", "Inventory cycles", "Location expansion", "Embedded referral opportunities"],
    pitch: "Explore an optional referral step within the merchant service journey without assuming access to transaction data.",
    questions: ["When do merchants ask about inventory or expansion?", "Where could an opt-in introduction fit the service journey?"],
    objections: ["spam_concern", "compensation_question"],
    cross: ["Explore payment-service introductions requested by business owners."]
  },
  equipment: {
    audience: "Business buyers evaluating equipment purchases or replacements",
    triggers: ["Buyer financing friction", "Equipment purchase timing", "Replacement cycles", "Lost-sale prevention discussions"],
    pitch: "Discuss an optional introduction at the point of financing friction without promising financing or a completed sale.",
    questions: ["At what point does payment timing delay purchases?", "How could a referral fit the sales process without adding pressure?"],
    objections: ["too_busy", "already_have_lender"],
    cross: ["Explore equipment-provider introductions when an owner requests sourcing help."]
  },
  payroll: {
    audience: "Employers using payroll or workforce services",
    triggers: ["Payroll timing gaps", "Seasonal hiring", "Headcount growth", "Working-capital planning"],
    pitch: "Explore a permission-based introduction alongside payroll support without requesting payroll records.",
    questions: ["When do employers ask about cash-flow timing?", "How could a referral fit existing service responsibilities?"],
    objections: ["client_relationship_risk", "spam_concern"],
    cross: ["Explore payroll-service introductions requested by employers."]
  },
  transaction: {
    audience: "Owners evaluating property, franchise, or expansion transactions",
    triggers: ["Transaction timing", "Expansion planning", "Documentation preparation"],
    pitch: "Coordinate early funding-preparation questions around the transaction timeline.",
    questions: ["Which transaction milestones create financing questions?", "What responsibilities should each participant retain?"],
    objections: ["already_have_lender", "do_not_want_financing_role"],
    cross: ["Explore relevant professional introductions only when requested."]
  },
  network: {
    audience: "Business owners in the partner's professional or industry network; verify the actual audience",
    triggers: ["Growth plans", "Seasonality", "Inventory or working-capital questions"],
    pitch: "Identify useful educational topics and a low-friction, permission-based referral process.",
    questions: ["Which client situations prompt funding questions?", "What would make an introduction useful to your network?"],
    objections: ["need_more_information", "trust_concern"],
    cross: ["Explore complementary services based on verified client needs and permission."]
  }
};
const GOALS = {
  initial_discovery: ["Understand the partner's audience and priorities", "Which client needs should we understand first?", "document_partner_needs_and_contact_preferences"],
  partner_program_pitch: ["Explain the proposed referral process and responsibilities", "Which program responsibilities need clarification?", "share_partner_program_process"],
  relationship_development: ["Compare current priorities and communication preferences", "What would make the relationship more useful?", "agree_relationship_follow_up"],
  referral_strategy: ["Map referral situations and a controlled handoff", "Which situations merit a permission-based introduction?", "document_referral_handoff_plan"],
  reactivation: ["Explore current priorities without assuming past results", "What has changed since the relationship was active?", "confirm_reactivation_interest"],
  co_marketing: ["Explore an educational topic and each party's role", "Which topic would be useful to both audiences?", "outline_co_marketing_concept"],
  performance_review: ["Review only supplied activity and identify evidence gaps", "Which verified activity records can support a later review?", "request_verified_activity_summary"],
  issue_resolution: ["Clarify the reported issue, impact, and responsible owner", "What happened, and which details still need confirmation?", "document_issue_and_assign_owner"]
};

function profileFor(category) {
  if (["accountant_cpa", "bookkeeper", "tax_advisor", "fractional_cfo"].includes(category)) return PROFILES.advisory;
  if (["attorney", "small_business_attorney"].includes(category)) return PROFILES.attorney;
  if (category === "business_broker") return PROFILES.broker;
  if (category === "merchant_services") return PROFILES.merchant;
  if (category === "equipment_vendor") return PROFILES.equipment;
  if (category === "payroll_provider") return PROFILES.payroll;
  return partnerSegment(category) === "transaction_partner" ? PROFILES.transaction : PROFILES.network;
}

export function buildCallPrepBrief(input) {
  const profile = profileFor(input.partner_category);
  const [goal, question, next] = GOALS[input.meeting_goal];
  const known = Object.fromEntries(["partner_id", "prospect_id", "partner_name", "company_name", "partner_category", "niche", "relationship_stage", "geographic_focus", "known_context", "recent_activity", "notes"].map((field) => [field, input[field] || null]));
  return {
    partner_profile: { ...known, information_basis: "caller_provided_unverified" },
    likely_client_base: { provided: input.likely_client_base || null, suggested_to_verify: profile.audience },
    funding_triggers_to_discuss: profile.triggers,
    recommended_pitch_angle: profile.pitch,
    questions_to_ask: [question, ...profile.questions, input.niche ? `Does the supplied niche (${input.niche}) reflect the clients you want to serve?` : "Which niche and client types should we focus on?", input.geographic_focus ? `What local needs or constraints should we verify in ${input.geographic_focus}?` : "Which geographic markets should we consider?"],
    objections_to_expect: profile.objections,
    cross_referral_opportunities: profile.cross,
    meeting_agenda: [
      { minutes: 3, topic: ["cold", "aware"].includes(input.relationship_stage) ? "Introductions and permission to explore a relationship" : "Confirm current relationship priorities" },
      { minutes: 5, topic: goal },
      { minutes: 5, topic: "Discuss suggested category topics and verify their relevance" },
      { minutes: 4, topic: "Agree on roles, controlled communications, and confidentiality expectations" },
      { minutes: 3, topic: "Confirm a next step, owner, and timing" }
    ],
    recommendation_notice: "Talking points, possible objections, and opportunities are category-based suggestions, not verified facts about this partner or its clients. Supplied context is unverified; no external records were retrieved.",
    recommended_next_step: next,
    message: "Internal partner meeting brief prepared. No meeting was scheduled and no borrower decision was made."
  };
}

export default createPartnerHandler(ACTIONS.brief, buildCallPrepBrief);
