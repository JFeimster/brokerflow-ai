/**
 * BrokerFlow AI - Lender Matching + Routing utilities.
 *
 * Shared by no-auth lender matching endpoints. This layer ranks lender options,
 * creates lender shortlists, and flags scenarios that require manual review.
 * It does not approve, deny, underwrite, price, fund, or submit a borrower.
 */

export const LENDER_ROUTE_FAMILIES = [
  "business_working_capital",
  "equipment_financing",
  "invoice_financing",
  "sba_or_bank_review",
  "commercial_real_estate",
  "bridge_or_private_lending",
  "residential_mortgage",
  "debt_consolidation",
  "personal_loan_review",
  "manual_exception"
];

const DEFAULT_LENDER_POOL = [
  {
    lender_id: "bf_wc_speed",
    lender_name: "Working Capital Speed Review",
    route_family: "business_working_capital",
    min_amount: 5000,
    max_amount: 250000,
    min_monthly_revenue: 10000,
    min_time_in_business_months: 6,
    accepted_borrower_types: ["business", "commercial_borrower"],
    accepted_states: ["ALL"],
    speed: "fast",
    documentation_level: "standard"
  },
  {
    lender_id: "bf_wc_bankable",
    lender_name: "Bankable Working Capital Review",
    route_family: "sba_or_bank_review",
    min_amount: 25000,
    max_amount: 750000,
    min_monthly_revenue: 25000,
    min_time_in_business_months: 24,
    accepted_borrower_types: ["business", "commercial_borrower"],
    accepted_states: ["ALL"],
    speed: "moderate",
    documentation_level: "full"
  },
  {
    lender_id: "bf_equipment",
    lender_name: "Equipment Finance Review",
    route_family: "equipment_financing",
    min_amount: 10000,
    max_amount: 500000,
    min_monthly_revenue: 10000,
    min_time_in_business_months: 6,
    accepted_borrower_types: ["business", "commercial_borrower"],
    accepted_states: ["ALL"],
    speed: "moderate",
    documentation_level: "asset_based"
  },
  {
    lender_id: "bf_invoice",
    lender_name: "Invoice Financing Review",
    route_family: "invoice_financing",
    min_amount: 10000,
    max_amount: 1000000,
    min_monthly_revenue: 15000,
    min_time_in_business_months: 3,
    accepted_borrower_types: ["business", "commercial_borrower"],
    accepted_states: ["ALL"],
    speed: "fast",
    documentation_level: "receivables"
  },
  {
    lender_id: "bf_cre",
    lender_name: "Commercial Real Estate Review",
    route_family: "commercial_real_estate",
    min_amount: 100000,
    max_amount: 5000000,
    min_monthly_revenue: 0,
    min_time_in_business_months: 0,
    accepted_borrower_types: ["business", "real_estate_investor", "commercial_borrower"],
    accepted_states: ["ALL"],
    speed: "moderate",
    documentation_level: "property_based"
  },
  {
    lender_id: "bf_bridge",
    lender_name: "Bridge / Private Lending Review",
    route_family: "bridge_or_private_lending",
    min_amount: 50000,
    max_amount: 3000000,
    min_monthly_revenue: 0,
    min_time_in_business_months: 0,
    accepted_borrower_types: ["real_estate_investor", "commercial_borrower", "business"],
    accepted_states: ["ALL"],
    speed: "fast",
    documentation_level: "asset_based"
  },
  {
    lender_id: "bf_manual",
    lender_name: "Manual Exception Review",
    route_family: "manual_exception",
    min_amount: 1,
    max_amount: 10000000,
    min_monthly_revenue: 0,
    min_time_in_business_months: 0,
    accepted_borrower_types: ["individual", "business", "real_estate_investor", "commercial_borrower", "referral_partner_lead", "unknown"],
    accepted_states: ["ALL"],
    speed: "manual",
    documentation_level: "case_by_case"
  }
];

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

export function normalizeScenario(body = {}) {
  return {
    source: body.source || "custom_gpt",
    action_type: body.action_type,
    scenario_id: body.scenario_id || null,
    borrower_type: body.borrower_type || "unknown",
    loan_purpose: body.loan_purpose || "other",
    requested_amount: body.requested_amount ?? null,
    state: typeof body.state === "string" ? body.state.trim().toUpperCase() : body.state || null,
    monthly_revenue: body.monthly_revenue ?? null,
    annual_revenue: body.annual_revenue ?? null,
    time_in_business_months: body.time_in_business_months ?? null,
    credit_score_range: body.credit_score_range || "unknown",
    primary_route: body.primary_route || null,
    secondary_routes: Array.isArray(body.secondary_routes) ? body.secondary_routes : [],
    fit_tier: body.fit_tier || null,
    fit_score: body.fit_score ?? null,
    missing_information: Array.isArray(body.missing_information) ? body.missing_information : [],
    risk_flags: Array.isArray(body.risk_flags) ? body.risk_flags : [],
    urgency: body.urgency || "normal",
    collateral_available: body.collateral_available ?? null,
    property_type: body.property_type || null,
    occupancy_type: body.occupancy_type || null,
    notes: body.notes || null
  };
}

export function validateScenario(body = {}, expectedActionType) {
  const required = ["source", "action_type"];
  for (const field of required) {
    if (isBlank(body[field])) return { error: "missing_required_field", message: `${field} is required.` };
  }

  if (expectedActionType && body.action_type !== expectedActionType) {
    return { error: "validation_error", message: `action_type must be ${expectedActionType}.` };
  }

  if (body.requested_amount !== undefined && body.requested_amount !== null && (!isValidNumber(body.requested_amount) || body.requested_amount <= 0)) {
    return { error: "validation_error", message: "requested_amount must be a number greater than 0." };
  }

  for (const field of ["monthly_revenue", "annual_revenue", "fit_score"]) {
    if (body[field] !== undefined && body[field] !== null && !isValidNumber(body[field])) {
      return { error: "validation_error", message: `${field} must be a finite number.` };
    }
  }

  if (body.time_in_business_months !== undefined && body.time_in_business_months !== null && (!Number.isInteger(body.time_in_business_months) || body.time_in_business_months < 0)) {
    return { error: "validation_error", message: "time_in_business_months must be an integer greater than or equal to 0." };
  }

  return null;
}

export function enforceSharedSecret(body) {
  if (process.env.LENDER_MATCHING_ROUTING_SHARED_SECRET && body.shared_secret !== process.env.LENDER_MATCHING_ROUTING_SHARED_SECRET) {
    return {
      error: "validation_error",
      message: "Invalid or missing shared_secret."
    };
  }

  return null;
}

export function getLenderPool(inputPool) {
  if (Array.isArray(inputPool) && inputPool.length > 0) return inputPool;
  return DEFAULT_LENDER_POOL;
}

function amountScore(scenario, lender) {
  if (!scenario.requested_amount) return 8;
  if (scenario.requested_amount < lender.min_amount || scenario.requested_amount > lender.max_amount) return -25;
  return 20;
}

function routeScore(scenario, lender) {
  const routes = [scenario.primary_route, ...(scenario.secondary_routes || [])].filter(Boolean);
  if (routes.includes(lender.route_family)) return 25;
  if (!scenario.primary_route && scenario.loan_purpose && lender.route_family.includes(scenario.loan_purpose)) return 12;
  if (lender.route_family === "manual_exception") return 3;
  return 0;
}

function borrowerTypeScore(scenario, lender) {
  if (!scenario.borrower_type || scenario.borrower_type === "unknown") return 0;
  return lender.accepted_borrower_types?.includes(scenario.borrower_type) ? 15 : -15;
}

function revenueScore(scenario, lender) {
  if (!lender.min_monthly_revenue) return 10;
  const monthly = scenario.monthly_revenue ?? (scenario.annual_revenue ? scenario.annual_revenue / 12 : null);
  if (monthly === null) return -5;
  return monthly >= lender.min_monthly_revenue ? 15 : -10;
}

function timeInBusinessScore(scenario, lender) {
  if (!lender.min_time_in_business_months) return 8;
  if (scenario.time_in_business_months === null || scenario.time_in_business_months === undefined) return -5;
  return scenario.time_in_business_months >= lender.min_time_in_business_months ? 12 : -12;
}

function stateScore(scenario, lender) {
  if (!scenario.state) return 0;
  if (!Array.isArray(lender.accepted_states) || lender.accepted_states.includes("ALL")) return 5;
  return lender.accepted_states.includes(scenario.state) ? 5 : -20;
}

function creditRiskAdjustment(scenario) {
  if (scenario.credit_score_range === "below_580") return -15;
  if (["660_699", "700_739", "740_plus"].includes(scenario.credit_score_range)) return 8;
  return 0;
}

export function rankLenders(scenario, lenderPool) {
  const pool = getLenderPool(lenderPool);

  return pool.map((lender) => {
    const score_parts = {
      route: routeScore(scenario, lender),
      amount: amountScore(scenario, lender),
      borrower_type: borrowerTypeScore(scenario, lender),
      revenue: revenueScore(scenario, lender),
      time_in_business: timeInBusinessScore(scenario, lender),
      state: stateScore(scenario, lender),
      credit_risk: creditRiskAdjustment(scenario)
    };

    const match_score = Math.max(0, Math.min(100, Object.values(score_parts).reduce((sum, value) => sum + value, 20)));
    const match_tier = match_score >= 75 ? "strong_match" : match_score >= 55 ? "possible_match" : match_score >= 35 ? "weak_match" : "poor_match";

    return {
      lender_id: lender.lender_id,
      lender_name: lender.lender_name,
      route_family: lender.route_family,
      match_score,
      match_tier,
      speed: lender.speed,
      documentation_level: lender.documentation_level,
      score_parts,
      match_notes: buildMatchNotes(scenario, lender, match_tier)
    };
  }).sort((a, b) => b.match_score - a.match_score);
}

function buildMatchNotes(scenario, lender, matchTier) {
  const notes = [`${lender.lender_name} ranked as ${matchTier}.`];
  if (scenario.primary_route && scenario.primary_route === lender.route_family) notes.push("Route family aligns with primary route.");
  if (scenario.requested_amount && (scenario.requested_amount < lender.min_amount || scenario.requested_amount > lender.max_amount)) notes.push("Requested amount is outside this option's preferred range.");
  if (scenario.credit_score_range === "below_580") notes.push("Credit score range may require manual review or alternative route.");
  notes.push("Matching support only; not a lender approval, pricing quote, underwriting decision, funding decision, or submission.");
  return notes;
}

export function generateShortlist(scenario, rankedLenders, maxResults = 3) {
  const shortlist = rankedLenders
    .filter((lender) => lender.match_tier !== "poor_match")
    .slice(0, Math.max(1, Math.min(10, maxResults)));

  const fallbackNeeded = shortlist.length === 0;

  return {
    shortlist: fallbackNeeded ? rankedLenders.slice(0, 1) : shortlist,
    shortlist_count: fallbackNeeded ? 1 : shortlist.length,
    fallback_used: fallbackNeeded,
    shortlist_strategy: fallbackNeeded ? "fallback_to_highest_available_review_path" : "ranked_fit_score"
  };
}

export function flagManualReview(scenario) {
  const flags = [];

  if (!scenario.borrower_type || scenario.borrower_type === "unknown") flags.push("unknown_borrower_type");
  if (!scenario.loan_purpose || scenario.loan_purpose === "other") flags.push("unclear_loan_purpose");
  if (!scenario.requested_amount) flags.push("missing_requested_amount");
  if (!scenario.state) flags.push("missing_state");
  if (scenario.credit_score_range === "below_580") flags.push("low_credit_score_range");
  if ((scenario.missing_information || []).length >= 3) flags.push("multiple_missing_information_items");
  if ((scenario.risk_flags || []).length >= 2) flags.push("multiple_risk_flags");
  if (scenario.fit_tier === "insufficient_information" || scenario.fit_tier === "weak_fit") flags.push("low_or_incomplete_fit_tier");
  if (scenario.primary_route === "manual_exception") flags.push("manual_exception_route");
  if (scenario.requested_amount && scenario.monthly_revenue && scenario.requested_amount > scenario.monthly_revenue * 8) flags.push("amount_high_relative_to_monthly_revenue");

  const manual_review_required = flags.length > 0;
  const review_priority = flags.includes("manual_exception_route") || flags.includes("multiple_risk_flags") ? "high" : manual_review_required ? "normal" : "none";

  return {
    manual_review_required,
    review_priority,
    manual_review_flags: [...new Set(flags)],
    review_queue: manual_review_required ? selectReviewQueue(scenario, flags) : null,
    next_step: manual_review_required ? "send_to_manual_review" : "continue_automated_routing"
  };
}

function selectReviewQueue(scenario, flags) {
  if (flags.includes("manual_exception_route")) return "manual_exception_review";
  if (["commercial_real_estate", "bridge_or_private_lending"].includes(scenario.primary_route)) return "real_estate_or_private_lending_review";
  if (["business_working_capital", "invoice_financing", "equipment_financing", "sba_or_bank_review"].includes(scenario.primary_route)) return "business_funding_review";
  return "general_funding_review";
}

export async function forwardLenderRoutingEvent(payload) {
  const webhookUrl = process.env.LENDER_MATCHING_ROUTING_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log("No LENDER_MATCHING_ROUTING_WEBHOOK_URL configured. Payload logged only.");
    console.log(JSON.stringify(payload, null, 2));
    return { forwarded: false, destination: "console" };
  }

  const headers = { "Content-Type": "application/json" };

  if (process.env.WEBHOOK_SHARED_SECRET) headers["x-brokerflow-secret"] = process.env.WEBHOOK_SHARED_SECRET;

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    throw new Error(`Lender routing webhook forwarding failed with status ${response.status}: ${responseText}`);
  }

  return { forwarded: true, destination: "lender_matching_routing_webhook" };
}

export function complianceNotice() {
  return "Lender matching and routing support only. No approval, denial, underwriting, pricing, funding, or lender submission has been made.";
}
