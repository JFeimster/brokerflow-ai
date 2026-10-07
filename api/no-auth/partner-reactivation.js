import { ACTIONS, createPartnerHandler } from "../../lib/partner-action-utils.js";

const plans = {
  signed_up_no_referrals: { priority: "normal", angle: "onboarding refresher and first-referral guide", next: "send_first_referral_guide", message: "Hi{{name}}, I wanted to make it easy to get started. I can send a short guide to the first referral and introduction process. Would that be useful?", cadence: [[0, "initial_check_in"], [7, "share_first_referral_guide"], [21, "close_loop_or_pause"]] },
  inactive_30_days: { priority: "low", angle: "light check-in and useful partner update", next: "send_low_pressure_partner_update", message: "Hi{{name}}, checking in and sharing a brief partner update in case it is useful. Is there anything that would make the referral process easier for your team?", cadence: [[0, "light_check_in"], [14, "share_relevant_resource"]] },
  inactive_60_days: { priority: "normal", angle: "useful resource and a simple preference check", next: "share_relevant_resource_and_confirm_fit", message: "Hi{{name}}, I have a practical resource that may help with business funding conversations. Would you like me to send it, or should I check back another time?", cadence: [[0, "resource_offer"], [10, "preference_check"], [24, "pause_if_no_response"]] },
  inactive_90_days: { priority: "high", angle: "new resources and whether the partnership still fits", next: "ask_whether_partnership_still_fits", message: "Hi{{name}}, it has been a while since we connected. We have updated partner resources available, and I wanted to ask whether this partnership still fits your current priorities. Happy to send the overview or close the loop for now.", cadence: [[0, "personalized_reengagement"], [10, "share_updated_resources"], [24, "close_loop_or_pause"]] },
  high_value_dormant_partner: { priority: "high", angle: "personalized relationship-manager follow-up", next: "assign_relationship_manager_follow_up", message: "Hi{{name}}, I wanted to reconnect personally and hear what has changed in your priorities. Would a brief conversation be useful, or is there another way we can support your team?", cadence: [[0, "relationship_manager_call_or_email"], [7, "personal_follow_up"], [21, "pause_or_set_reminder"]] },
  prospect_never_contacted: { priority: "normal", angle: "relevant initial introduction", next: "send_initial_partner_introduction", message: "Hi{{name}}, I am reaching out because your work with business owners may overlap with the funding conversations we support. If useful, I can share a short overview and learn whether a referral relationship would fit your practice.", cadence: [[0, "initial_introduction"], [5, "brief_follow_up"], [14, "final_polite_follow_up"]] },
  prospect_contacted_no_response: { priority: "low", angle: "short, low-friction follow-up sequence", next: "send_one_brief_follow_up_then_pause", message: "Hi{{name}}, following up once on my note about a possible partner fit. Would a short overview be useful? No problem if the timing is not right.", cadence: [[0, "brief_follow_up"], [7, "one_final_follow_up_then_pause"]] },
  former_active_partner: { priority: "normal", angle: "relationship reset and updated partner resources", next: "ask_about_current_priorities", message: "Hi{{name}}, I appreciated working together and wanted to reconnect. If your priorities have changed, I can share the current referral resources or simply update our notes.", cadence: [[0, "relationship_reset"], [12, "share_current_resources"], [28, "pause_or_set_reminder"]] },
  event_follow_up: { priority: "normal", angle: "specific event follow-up and promised resource", next: "send_event_follow_up_resource", message: "Hi{{name}}, it was good connecting around the event. I am following up with the resource we discussed. Would a brief conversation about a partner fit be helpful?", cadence: [[0, "event_follow_up"], [7, "offer_brief_conversation"]] },
  seasonal_reactivation: { priority: "normal", angle: "seasonal planning resource", next: "share_seasonal_planning_resource", message: "Hi{{name}}, as your team plans for the upcoming season, I wanted to share a practical resource for spotting timing-related business funding needs. Would you like a copy?", cadence: [[0, "seasonal_resource"], [14, "check_in"], [30, "pause_or_set_reminder"]] }
};

const defaultChannel = { email: "email", linkedin: "linkedin", phone: "phone", sms: "sms", multi_channel: "multi_channel" };

export function buildReactivation(input) {
  const plan = plans[input.reactivation_segment];
  const name = input.partner_name ? ` ${input.partner_name}` : "";
  const recommended_channel = input.reactivation_segment === "high_value_dormant_partner" && !input.preferred_channel ? "phone" : defaultChannel[input.preferred_channel || "email"];
  const follow_up_schedule = plan.cadence.map(([day, goal], index) => ({ day, channel: recommended_channel === "multi_channel" ? (index % 2 ? "linkedin" : "email") : recommended_channel, goal }));
  return {
    reactivation_segment: input.reactivation_segment,
    priority: plan.priority,
    recommended_message: plan.message.replaceAll("{{name}}", name),
    recommended_channel,
    recommended_offer_or_angle: plan.angle,
    follow_up_schedule,
    recommended_next_step: plan.next,
    message: input.reactivation_segment === "prospect_never_contacted" ? "Initial partner outreach prepared; this contact has not been framed as a reactivation." : "Partner reactivation workflow prepared with a bounded follow-up cadence."
  };
}

export default createPartnerHandler(ACTIONS.reactivation, buildReactivation);
