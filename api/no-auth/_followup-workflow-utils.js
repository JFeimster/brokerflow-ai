export function sendJson(res, statusCode, payload) {
  res.setHeader("Content-Type", "application/json");
  return res.status(statusCode).json(payload);
}

export function makeId(prefix) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${datePart}_${randomPart}`;
}

export function validateBody(body = {}, expectedActionType) {
  if (!body.source) return { error: "missing_required_field", message: "source is required." };
  if (!body.action_type) return { error: "missing_required_field", message: "action_type is required." };
  if (expectedActionType && body.action_type !== expectedActionType) return { error: "validation_error", message: `action_type must be ${expectedActionType}.` };
  return null;
}

export function enforceSharedSecret(body = {}) {
  if (process.env.FOLLOWUP_WORKFLOW_SHARED_SECRET && body.shared_secret !== process.env.FOLLOWUP_WORKFLOW_SHARED_SECRET) {
    return { error: "validation_error", message: "Invalid or missing shared_secret." };
  }
  return null;
}

export function normalizeContext(body = {}) {
  return {
    lead_id: body.lead_id || body.scenario_id || null,
    contact_name: body.contact_name || body.borrower_name || "there",
    business_name: body.business_name || null,
    primary_route: body.primary_route || body.loan_purpose || "funding_review",
    fit_tier: body.fit_tier || body.qualification_tier || "review_needed",
    requested_amount: body.requested_amount ?? null,
    state: body.state || null,
    urgency: body.urgency || "normal",
    missing_information: Array.isArray(body.missing_information) ? body.missing_information : [],
    missing_documents: Array.isArray(body.missing_documents) ? body.missing_documents : [],
    last_contact_days: body.last_contact_days ?? null,
    decline_reason: body.decline_reason || null,
    referral_partner_name: body.referral_partner_name || null,
    notes: body.notes || null
  };
}

export function createFollowUpPlan(ctx = {}) {
  const cadence = ctx.urgency === "same_day" || ctx.urgency === "high" ? ["same_day", "next_business_day", "day_3"] : ["day_1", "day_3", "day_7"];
  return { cadence, tasks: cadence.map((timing, index) => ({ task_id: `followup_${index + 1}`, timing, channel: index === 0 ? "email_or_sms" : "email", status: "draft" })), next_step: "draft_first_follow_up_message" };
}

export function generateBorrowerMessage(ctx = {}, tone = "professional") {
  const missing = [...(ctx.missing_information || []), ...(ctx.missing_documents || [])];
  const subject = missing.length > 0 ? "Quick items needed for your funding review" : "Next step for your funding review";
  const greeting = ctx.contact_name && ctx.contact_name !== "there" ? `Hi ${ctx.contact_name},` : "Hi,";
  const missingLine = missing.length > 0 ? `To keep your file moving, please send or confirm: ${missing.join(", ")}.` : "Your file is ready for the next internal review step.";
  return { subject, body: `${greeting}\n\n${missingLine}\n\nOnce I have that, I can organize the file for the appropriate review path.`, tone, channel: "email", next_step: missing.length > 0 ? "send_after_human_review" : "prepare_internal_review" };
}

export function createStalledRecovery(ctx = {}) {
  return { recovery_reason: ctx.last_contact_days && ctx.last_contact_days >= 14 ? "cold_or_stalled_lead" : "short_term_stall", recovery_plan: [{ step: 1, timing: "today", action: "send_value_recap_follow_up" }, { step: 2, timing: "2_business_days", action: "send_missing_items_reminder" }, { step: 3, timing: "5_business_days", action: "move_to_nurture_or_manual_review" }], next_step: "draft_recovery_message" };
}

export function createDeclinedReactivation(ctx = {}) {
  return { reactivation_path: ctx.decline_reason ? "reason_specific_reactivation" : "general_reactivation", reactivation_angles: ["new_revenue_or_docs", "different_route_family", "timing_or_credit_change"], next_step: "draft_reactivation_message" };
}

export function createReferralPartnerFollowUp(ctx = {}) {
  const partner = ctx.referral_partner_name || "the referral partner";
  return { subject: "Update on referred funding scenario", body: `Hi ${partner},\n\nQuick update: the referred file is being organized for the appropriate funding review path.`, partner, next_step: "send_after_human_review" };
}

export async function forwardFollowupEvent(payload) {
  const webhookUrl = process.env.FOLLOWUP_WORKFLOW_WEBHOOK_URL;
  if (!webhookUrl) return { forwarded: false, destination: "console" };
  const response = await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(`Follow-up webhook forwarding failed with status ${response.status}.`);
  return { forwarded: true, destination: "followup_workflow_webhook" };
}

export function complianceNotice() {
  return "Draft workflow support only. No message has been sent automatically and no funding decision has been made.";
}
