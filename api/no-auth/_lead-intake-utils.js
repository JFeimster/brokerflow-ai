/**
 * BrokerFlow AI - Lead Intake + Qualification utilities.
 *
 * Shared by no-auth lead intake endpoints. These helpers normalize lead data,
 * score readiness, detect missing information, classify funding scenarios, and
 * generate safe routing notes. None of this approves, declines, underwrites,
 * prices, funds, or submits a borrower.
 */

export const ENUMS = {
  source: ["custom_gpt", "website", "internal_tool", "webhook_test"],
  borrower_type: ["individual", "business", "real_estate_investor", "commercial_borrower", "referral_partner_lead", "unknown"],
  loan_purpose: ["business_working_capital", "equipment_financing", "commercial_real_estate", "residential_purchase", "residential_refinance", "debt_consolidation", "bridge_loan", "construction", "invoice_financing", "sba_review", "personal_loan", "other"],
  credit_score_range: ["unknown", "below_580", "580_619", "620_659", "660_699", "700_739", "740_plus"],
  urgency: ["low", "normal", "high", "same_day"],
  property_type: ["single_family", "multifamily", "condo", "townhouse", "mixed_use", "commercial", "land", "construction", "not_applicable", "unknown", "other"],
  occupancy_type: ["primary_residence", "second_home", "investment_property", "owner_occupied_business", "tenant_occupied", "vacant", "not_applicable", "unknown"],
  consent_to_contact: [true, false]
};

const ROUTE_BY_PURPOSE = {
  business_working_capital: "business_working_capital",
  equipment_financing: "equipment_financing",
  commercial_real_estate: "commercial_real_estate",
  residential_purchase: "residential_mortgage",
  residential_refinance: "residential_mortgage",
  debt_consolidation: "debt_consolidation",
  bridge_loan: "bridge_or_private_lending",
  construction: "bridge_or_private_lending",
  invoice_financing: "invoice_financing",
  sba_review: "sba_or_bank_review",
  personal_loan: "personal_loan_review",
  other: "manual_exception"
};

export function sendJson(res, statusCode, payload) {
  res.setHeader("Content-Type", "application/json");
  return res.status(statusCode).json(payload);
}

export function makeId(prefix) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${datePart}_${randomPart}`;
}

export function isBlank(value) {
  return value === undefined || value === null || value === "";
}

export function isValidNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function normalizeString(value) {
  if (typeof value !== "string") return value;
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeEmail(value) {
  if (typeof value !== "string") return value;
  return value.trim().toLowerCase();
}

export function normalizePhone(value) {
  if (typeof value !== "string") return value;
  return value.replace(/[^0-9+]/g, "");
}

export function normalizeState(value) {
  if (typeof value !== "string") return value;
  return value.trim().toUpperCase();
}

export function normalizeLead(body = {}) {
  return {
    source: body.source || "custom_gpt",
    action_type: body.action_type,
    lead_id: body.lead_id || null,
    requester_name: normalizeString(body.requester_name || body.broker_name || null),
    contact_name: normalizeString(body.contact_name || body.borrower_name || null),
    business_name: normalizeString(body.business_name || null),
    email: normalizeEmail(body.email || null),
    phone: normalizePhone(body.phone || null),
    state: normalizeState(body.state || null),
    borrower_type: body.borrower_type || "unknown",
    loan_purpose: body.loan_purpose || "other",
    requested_amount: body.requested_amount ?? null,
    monthly_revenue: body.monthly_revenue ?? null,
    annual_revenue: body.annual_revenue ?? null,
    time_in_business_months: body.time_in_business_months ?? null,
    credit_score_range: body.credit_score_range || "unknown",
    urgency: body.urgency || "normal",
    collateral_available: body.collateral_available ?? null,
    property_type: body.property_type || null,
    occupancy_type: body.occupancy_type || null,
    existing_debt_amount: body.existing_debt_amount ?? null,
    consent_to_contact: body.consent_to_contact ?? null,
    notes: normalizeString(body.notes || null)
  };
}

export function validateEnum(value, allowedValues, fieldName) {
  if (isBlank(value)) return null;
  if (!allowedValues.includes(value)) {
    return {
      error: "validation_error",
      message: `${fieldName} must be one of: ${allowedValues.join(", ")}.`
    };
  }
  return null;
}

export function validateBaseLead(body, options = {}) {
  const requiredFields = options.requiredFields || ["source", "action_type"];

  for (const field of requiredFields) {
    if (isBlank(body[field])) {
      return { error: "missing_required_field", message: `${field} is required.` };
    }
  }

  const expectedActionType = options.expectedActionType;
  if (expectedActionType && body.action_type !== expectedActionType) {
    return { error: "validation_error", message: `action_type must be ${expectedActionType}.` };
  }

  const numericChecks = [
    ["requested_amount", body.requested_amount, 1],
    ["monthly_revenue", body.monthly_revenue, 0],
    ["annual_revenue", body.annual_revenue, 0],
    ["existing_debt_amount", body.existing_debt_amount, 0]
  ];

  for (const [field, value, min] of numericChecks) {
    if (value !== undefined && value !== null && (!isValidNumber(value) || value < min)) {
      return { error: "validation_error", message: `${field} must be a number greater than or equal to ${min}.` };
    }
  }

  if (
    body.time_in_business_months !== undefined &&
    body.time_in_business_months !== null &&
    (!Number.isInteger(body.time_in_business_months) || body.time_in_business_months < 0)
  ) {
    return { error: "validation_error", message: "time_in_business_months must be an integer greater than or equal to 0." };
  }

  const enumChecks = [
    validateEnum(body.source, ENUMS.source, "source"),
    validateEnum(body.borrower_type, ENUMS.borrower_type, "borrower_type"),
    validateEnum(body.loan_purpose, ENUMS.loan_purpose, "loan_purpose"),
    validateEnum(body.credit_score_range, ENUMS.credit_score_range, "credit_score_range"),
    validateEnum(body.urgency, ENUMS.urgency, "urgency"),
    validateEnum(body.property_type, ENUMS.property_type, "property_type"),
    validateEnum(body.occupancy_type, ENUMS.occupancy_type, "occupancy_type")
  ];

  return enumChecks.find(Boolean) || null;
}

export function enforceSharedSecret(body) {
  if (process.env.LEAD_INTAKE_SHARED_SECRET && body.shared_secret !== process.env.LEAD_INTAKE_SHARED_SECRET) {
    return {
      error: "validation_error",
      message: "Invalid or missing shared_secret."
    };
  }

  return null;
}

export function detectMissingInformation(body = {}) {
  const missing = [];
  const critical = [];

  if (!body.borrower_type || body.borrower_type === "unknown") critical.push("borrower_type");
  if (!body.loan_purpose || body.loan_purpose === "other") critical.push("loan_purpose");
  if (!body.requested_amount) critical.push("requested_amount");
  if (!body.state) critical.push("state");
  if (body.consent_to_contact !== true) missing.push("consent_to_contact");

  if (["business", "commercial_borrower", "referral_partner_lead"].includes(body.borrower_type) || ["business_working_capital", "equipment_financing", "invoice_financing", "sba_review"].includes(body.loan_purpose)) {
    if (body.monthly_revenue === undefined && body.annual_revenue === undefined) critical.push("business_revenue");
    if (body.time_in_business_months === undefined || body.time_in_business_months === null) critical.push("time_in_business_months");
    if (!body.business_name) missing.push("business_name");
  }

  if (["commercial_real_estate", "residential_purchase", "residential_refinance", "bridge_loan", "construction"].includes(body.loan_purpose)) {
    if (!body.property_type) critical.push("property_type");
    if (!body.occupancy_type) critical.push("occupancy_type");
  }

  if (!body.credit_score_range || body.credit_score_range === "unknown") missing.push("credit_score_range");
  if (!body.email && !body.phone) missing.push("contact_method");

  return {
    missing_information: [...new Set([...critical, ...missing])],
    critical_missing_information: [...new Set(critical)]
  };
}

export function classifyScenario(body = {}) {
  const secondary_routes = [];
  const risk_flags = [];

  const primary_route = ROUTE_BY_PURPOSE[body.loan_purpose] || "manual_exception";

  if (["business_working_capital", "invoice_financing", "equipment_financing"].includes(body.loan_purpose)) {
    secondary_routes.push("sba_or_bank_review");
  }

  if (["bridge_loan", "construction"].includes(body.loan_purpose)) {
    secondary_routes.push("commercial_real_estate");
  }

  if (body.credit_score_range === "below_580") risk_flags.push("low_credit_score_range");
  if (body.borrower_type === "unknown") risk_flags.push("unknown_borrower_type");
  if (body.requested_amount && body.monthly_revenue && body.requested_amount > body.monthly_revenue * 6) risk_flags.push("high_amount_relative_to_monthly_revenue");
  if (body.consent_to_contact === false) risk_flags.push("no_contact_consent");

  return {
    scenario_type: primary_route,
    primary_route,
    secondary_routes: [...new Set(secondary_routes)],
    risk_flags,
    routing_notes: buildRoutingNotes(primary_route, risk_flags)
  };
}

function buildRoutingNotes(primary_route, risk_flags) {
  const notes = [`Classified as ${primary_route}.`];
  if (risk_flags.length > 0) notes.push(`Review flags: ${risk_flags.join(", ")}.`);
  notes.push("Routing only; not an approval, denial, underwriting decision, pricing decision, funding decision, or lender submission.");
  return notes;
}

export function scoreReadiness(body = {}) {
  let score = 35;
  const category_scores = {
    identity_and_contact: 0,
    funding_request: 0,
    revenue_capacity: 0,
    credit_and_risk_context: 0,
    routing_completeness: 0
  };
  const strengths = [];
  const risks = [];

  if (body.contact_name || body.business_name) category_scores.identity_and_contact += 10;
  if (body.email || body.phone) category_scores.identity_and_contact += 10;
  if (body.consent_to_contact === true) category_scores.identity_and_contact += 5;

  if (body.requested_amount && body.requested_amount > 0) category_scores.funding_request += 10;
  if (body.loan_purpose && body.loan_purpose !== "other") category_scores.funding_request += 10;
  if (body.state) category_scores.funding_request += 5;

  if (body.monthly_revenue >= 15000 || body.annual_revenue >= 180000) {
    category_scores.revenue_capacity += 15;
    strengths.push("revenue_capacity_present");
  }
  if (body.time_in_business_months >= 24) {
    category_scores.revenue_capacity += 10;
    strengths.push("time_in_business_24_months_plus");
  } else if (body.time_in_business_months !== undefined && body.time_in_business_months < 6) {
    risks.push("limited_time_in_business");
  }

  if (["660_699", "700_739", "740_plus"].includes(body.credit_score_range)) {
    category_scores.credit_and_risk_context += 10;
    strengths.push("stronger_credit_score_range");
  } else if (body.credit_score_range === "below_580") {
    risks.push("low_credit_score_range");
  }
  if (body.collateral_available === true) category_scores.credit_and_risk_context += 5;

  const missing = detectMissingInformation(body);
  category_scores.routing_completeness = Math.max(0, 20 - missing.missing_information.length * 4);

  score += Object.values(category_scores).reduce((sum, value) => sum + value, 0);
  score -= Math.min(30, missing.critical_missing_information.length * 10);
  if (risks.includes("low_credit_score_range")) score -= 10;
  if (body.borrower_type === "unknown") score -= 10;

  const readiness_score = Math.max(0, Math.min(100, score));

  let readiness_tier = "low_readiness";
  if (missing.critical_missing_information.length >= 3) readiness_tier = "incomplete";
  else if (readiness_score >= 75) readiness_tier = "high_readiness";
  else if (readiness_score >= 55) readiness_tier = "medium_readiness";

  return {
    readiness_score,
    readiness_tier,
    category_scores,
    strengths,
    risks,
    ...missing
  };
}

export function qualifyLead(body = {}) {
  const classification = classifyScenario(body);
  const readiness = scoreReadiness(body);

  let qualification_score = readiness.readiness_score;
  if (classification.risk_flags.includes("no_contact_consent")) qualification_score -= 15;
  if (classification.primary_route === "manual_exception") qualification_score -= 10;

  qualification_score = Math.max(0, Math.min(100, qualification_score));

  let qualification_tier = "low_priority";
  if (readiness.critical_missing_information.length >= 3) qualification_tier = "incomplete";
  else if (qualification_score >= 75) qualification_tier = "qualified_priority";
  else if (qualification_score >= 55) qualification_tier = "qualified_review";

  const qualified = ["qualified_priority", "qualified_review"].includes(qualification_tier);

  return {
    qualified,
    qualification_tier,
    qualification_score,
    primary_route: classification.primary_route,
    secondary_routes: classification.secondary_routes,
    reasons: buildQualificationReasons(qualification_tier, readiness, classification),
    disqualifiers: buildDisqualifiers(readiness, classification),
    missing_information: readiness.missing_information,
    critical_missing_information: readiness.critical_missing_information,
    next_step: determineNextStep(qualification_tier, classification.primary_route)
  };
}

function buildQualificationReasons(qualification_tier, readiness, classification) {
  const reasons = [`Lead classified as ${qualification_tier}.`, `Primary route: ${classification.primary_route}.`];
  if (readiness.strengths.length > 0) reasons.push(`Strengths: ${readiness.strengths.join(", ")}.`);
  if (readiness.missing_information.length > 0) reasons.push(`Missing info: ${readiness.missing_information.join(", ")}.`);
  return reasons;
}

function buildDisqualifiers(readiness, classification) {
  const disqualifiers = [];
  if (readiness.critical_missing_information.length >= 3) disqualifiers.push("too_much_critical_information_missing");
  if (classification.risk_flags.includes("no_contact_consent")) disqualifiers.push("no_contact_consent");
  return disqualifiers;
}

function determineNextStep(qualification_tier, primary_route) {
  if (qualification_tier === "incomplete") return "collect_missing_information";
  if (primary_route === "manual_exception") return "manual_review";
  if (qualification_tier === "qualified_priority") return "route_to_priority_queue";
  if (qualification_tier === "qualified_review") return "route_to_standard_review";
  return "nurture_or_manual_review";
}

export function buildRecommendedQuestions(missing = []) {
  const questionMap = {
    borrower_type: "Is this lead an individual, business, real estate investor, commercial borrower, or referral partner lead?",
    loan_purpose: "What is the primary funding purpose?",
    requested_amount: "How much funding is being requested?",
    state: "What state is the borrower or business located in?",
    business_revenue: "What are the monthly or annual revenues?",
    time_in_business_months: "How many months has the business been operating?",
    property_type: "What property type is involved?",
    occupancy_type: "What is the occupancy type?",
    consent_to_contact: "Does the lead consent to be contacted?",
    credit_score_range: "What is the approximate credit score range?",
    contact_method: "What email or phone number should be used for follow-up?",
    business_name: "What is the business name?"
  };

  return missing.map((field) => questionMap[field] || `Please provide ${field}.`);
}

export async function forwardLeadEvent(payload) {
  const webhookUrl = process.env.LEAD_INTAKE_QUALIFICATION_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log("No LEAD_INTAKE_QUALIFICATION_WEBHOOK_URL configured. Payload logged only.");
    console.log(JSON.stringify(payload, null, 2));
    return { forwarded: false, destination: "console" };
  }

  const headers = { "Content-Type": "application/json" };

  if (process.env.WEBHOOK_SHARED_SECRET) {
    headers["x-brokerflow-secret"] = process.env.WEBHOOK_SHARED_SECRET;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    throw new Error(`Lead intake webhook forwarding failed with status ${response.status}: ${responseText}`);
  }

  return { forwarded: true, destination: "lead_intake_qualification_webhook" };
}

export function complianceNotice() {
  return "Qualification and routing support only. No approval, denial, underwriting, pricing, funding, or lender submission has been made.";
}
