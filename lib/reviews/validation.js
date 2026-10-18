export const STATUS = Object.freeze({ QUEUED: "queued_for_human_review", IN_REVIEW: "in_review", NEEDS_INFO: "needs_information", REVIEWED: "reviewed" });
export const ACTIONS = Object.freeze({ start_review: [STATUS.QUEUED, STATUS.NEEDS_INFO, STATUS.IN_REVIEW], request_information: [STATUS.IN_REVIEW, STATUS.NEEDS_INFO], mark_reviewed: [STATUS.IN_REVIEW, STATUS.REVIEWED] });
const allowed = {
  source: ["custom_gpt", "website", "internal_tool", "webhook_test"],
  borrower_type: ["individual", "business", "real_estate_investor", "commercial_borrower", "referral_partner_lead", "unknown"],
  loan_purpose: ["business_working_capital", "equipment_financing", "commercial_real_estate", "residential_purchase", "residential_refinance", "debt_consolidation", "bridge_loan", "construction", "invoice_financing", "sba_review", "personal_loan", "other"],
  urgency: ["low", "normal", "high", "same_day"],
  recommended_review_path: ["business_funding_review", "commercial_real_estate_review", "residential_mortgage_review", "equipment_financing_review", "sba_or_bank_review", "manual_exception_review", "insufficient_information"],
  credit_score_range: ["unknown","below_580","580_619","620_659","660_699","700_739","740_plus"],
  employment_type: ["employed","self_employed","business_owner","investor","retired","unemployed","unknown","other"],
  property_type: ["single_family","multifamily","condo","townhouse","mixed_use","commercial","land","construction","not_applicable","unknown","other"],
  occupancy_type: ["primary_residence","second_home","investment_property","owner_occupied_business","tenant_occupied","vacant","not_applicable","unknown"]
};
const required = ["source", "action_type", "requester_name", "borrower_type", "loan_purpose", "requested_amount", "state", "human_review_required"];
export function validateReview(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw Object.assign(new Error("A JSON object is required."), { status: 400 });
  for (const key of required) if (input[key] === undefined || input[key] === null || input[key] === "") throw Object.assign(new Error(`${key} is required.`), { status: 422 });
  if (input.action_type !== "lender_match_review" || input.human_review_required !== true) throw Object.assign(new Error("A human review request is required."), { status: 422 });
  if (!Number.isFinite(input.requested_amount) || input.requested_amount <= 0 || input.requested_amount > 1000000000) throw Object.assign(new Error("requested_amount is outside the allowed range."), { status: 422 });
  for (const [key, values] of Object.entries(allowed)) if (input[key] != null && !values.includes(input[key])) throw Object.assign(new Error(`${key} is invalid.`), { status: 422 });
  for (const key of ["source", "requester_name", "borrower_type", "loan_purpose", "state"]) if (typeof input[key] !== "string" || input[key].length > 200) throw Object.assign(new Error(`${key} is invalid.`), { status: 422 });
  if (input.business_name !== undefined && input.business_name !== null && (typeof input.business_name !== "string" || input.business_name.length > 160)) throw Object.assign(new Error("business_name is invalid."), { status: 422 });
  for (const key of ["monthly_revenue","annual_revenue"]) if (input[key] !== undefined && (!Number.isFinite(input[key]) || input[key] < 0)) throw Object.assign(new Error(`${key} is invalid.`), { status: 422 });
  if (input.time_in_business_months !== undefined && (!Number.isInteger(input.time_in_business_months) || input.time_in_business_months < 0)) throw Object.assign(new Error("time_in_business_months is invalid."), { status: 422 });
  if (input.collateral_available !== undefined && typeof input.collateral_available !== "boolean") throw Object.assign(new Error("collateral_available is invalid."), { status: 422 });
  if (input.notes != null && (typeof input.notes !== "string" || input.notes.length > 4000 || /\b\d{3}-\d{2}-\d{4}\b|\b\d{12,}\b|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/i.test(input.notes))) throw Object.assign(new Error("notes are outside the allowed content limits."), { status: 422 });
  const normalized = Object.fromEntries(["source", "action_type", "requester_name", "borrower_type", "business_name", "loan_purpose", "requested_amount", "state", "credit_score_range", "monthly_revenue", "annual_revenue", "time_in_business_months", "urgency", "recommended_review_path", "employment_type", "property_type", "occupancy_type", "collateral_available", "notes"].filter(k => input[k] !== undefined).map(k => [k, input[k]]));
  if (typeof normalized.business_name === "string") normalized.business_name = normalized.business_name.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  normalized.human_review_required = true;
  if (normalized.notes) normalized.notes = normalized.notes.replace(/[\u0000-\u001f\u007f]/g," ").trim();
  return normalized;
}
export function targetStatus(action) {
  const next = { start_review: STATUS.IN_REVIEW, request_information: STATUS.NEEDS_INFO, mark_reviewed: STATUS.REVIEWED }[action];
  if (!next) throw Object.assign(new Error("This review action is not valid."), { status: 409 });
  return next;
}
export function assertTransition(current, action) {
  const next = { start_review: STATUS.IN_REVIEW, request_information: STATUS.NEEDS_INFO, mark_reviewed: STATUS.REVIEWED }[action];
  if (!next || !ACTIONS[action]?.includes(current) || (action === "request_information" && current !== STATUS.IN_REVIEW) || (action === "start_review" && current === STATUS.IN_REVIEW) || (action === "request_information" && next === current) || (action === "mark_reviewed" && current !== STATUS.IN_REVIEW)) throw Object.assign(new Error("This review action is not allowed from its current status."), { status: 409 });
  return next;
}
