/**
 * BrokerFlow AI - Automated Lender Fit Routing API
 *
 * Vercel Serverless Function.
 * Expected endpoint: POST /api/no-auth/lender-fit-routing
 *
 * This endpoint automates scenario routing. It can score fit, select a route,
 * and trigger downstream workflows. It does not approve, decline, underwrite,
 * price, fund, or submit a borrower.
 */

const REQUIRED_FIELDS = [
  "source",
  "action_type",
  "borrower_type",
  "loan_purpose",
  "requested_amount",
  "state"
];

const ENUMS = {
  source: ["custom_gpt", "website", "internal_tool", "webhook_test"],
  borrower_type: ["individual", "business", "real_estate_investor", "commercial_borrower", "referral_partner_lead", "unknown"],
  loan_purpose: ["business_working_capital", "equipment_financing", "commercial_real_estate", "residential_purchase", "residential_refinance", "debt_consolidation", "bridge_loan", "construction", "invoice_financing", "sba_review", "personal_loan", "other"],
  credit_score_range: ["unknown", "below_580", "580_619", "620_659", "660_699", "700_739", "740_plus"],
  urgency: ["low", "normal", "high", "same_day"],
  property_type: ["single_family", "multifamily", "condo", "townhouse", "mixed_use", "commercial", "land", "construction", "not_applicable", "unknown", "other"],
  occupancy_type: ["primary_residence", "second_home", "investment_property", "owner_occupied_business", "tenant_occupied", "vacant", "not_applicable", "unknown"]
};

function sendJson(res, statusCode, payload) {
  res.setHeader("Content-Type", "application/json");
  return res.status(statusCode).json(payload);
}

function makeId(prefix) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${datePart}_${randomPart}`;
}

function isBlank(value) {
  return value === undefined || value === null || value === "";
}

function isValidNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function validateEnum(value, allowedValues, fieldName) {
  if (isBlank(value)) return null;
  if (!allowedValues.includes(value)) {
    return {
      error: "validation_error",
      message: `${fieldName} must be one of: ${allowedValues.join(", ")}.`
    };
  }
  return null;
}

function validatePayload(body) {
  for (const field of REQUIRED_FIELDS) {
    if (isBlank(body[field])) {
      return { error: "missing_required_field", message: `${field} is required.` };
    }
  }

  if (body.action_type !== "lender_fit_routing") {
    return { error: "validation_error", message: "action_type must be lender_fit_routing." };
  }

  if (!isValidNumber(body.requested_amount) || body.requested_amount <= 0) {
    return { error: "validation_error", message: "requested_amount must be a number greater than 0." };
  }

  const numericChecks = [
    ["monthly_revenue", body.monthly_revenue],
    ["annual_revenue", body.annual_revenue]
  ];

  for (const [field, value] of numericChecks) {
    if (value !== undefined && (!isValidNumber(value) || value < 0)) {
      return { error: "validation_error", message: `${field} must be a number greater than or equal to 0.` };
    }
  }

  if (
    body.time_in_business_months !== undefined &&
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

function detectMissingInformation(body) {
  const missing = [];

  if (body.borrower_type === "business" || body.loan_purpose === "business_working_capital" || body.loan_purpose === "invoice_financing") {
    if (body.monthly_revenue === undefined && body.annual_revenue === undefined) missing.push("business_revenue");
    if (body.time_in_business_months === undefined) missing.push("time_in_business_months");
  }

  if (["commercial_real_estate", "residential_purchase", "residential_refinance", "bridge_loan", "construction"].includes(body.loan_purpose)) {
    if (!body.property_type) missing.push("property_type");
    if (!body.occupancy_type) missing.push("occupancy_type");
  }

  return missing;
}

function selectRoutes(body) {
  const secondary_routes = [];

  switch (body.loan_purpose) {
    case "business_working_capital":
    case "invoice_financing":
      secondary_routes.push("sba_or_bank_review");
      return { primary_route: "business_working_capital", secondary_routes };
    case "equipment_financing":
      secondary_routes.push("business_working_capital");
      return { primary_route: "equipment_financing", secondary_routes };
    case "commercial_real_estate":
      secondary_routes.push("bridge_or_private_lending");
      return { primary_route: "commercial_real_estate", secondary_routes };
    case "residential_purchase":
    case "residential_refinance":
      return { primary_route: "residential_mortgage", secondary_routes };
    case "bridge_loan":
    case "construction":
      secondary_routes.push("commercial_real_estate");
      return { primary_route: "bridge_or_private_lending", secondary_routes };
    case "sba_review":
      secondary_routes.push("business_working_capital");
      return { primary_route: "sba_or_bank_review", secondary_routes };
    case "debt_consolidation":
      return { primary_route: "debt_consolidation", secondary_routes };
    default:
      return { primary_route: "manual_exception", secondary_routes };
  }
}

function scoreScenario(body, missing_information, primary_route) {
  let score = 50;

  if (body.borrower_type === "business" && primary_route === "business_working_capital") score += 15;
  if (isValidNumber(body.monthly_revenue) && body.monthly_revenue >= 15000) score += 15;
  if (isValidNumber(body.annual_revenue) && body.annual_revenue >= 180000) score += 10;
  if (Number.isInteger(body.time_in_business_months) && body.time_in_business_months >= 24) score += 10;
  if (["660_699", "700_739", "740_plus"].includes(body.credit_score_range)) score += 10;
  if (body.collateral_available === true) score += 5;
  if (body.urgency === "same_day" || body.urgency === "high") score += 5;

  if (missing_information.length > 0) score -= Math.min(25, missing_information.length * 10);
  if (body.credit_score_range === "below_580") score -= 20;
  if (body.borrower_type === "unknown") score -= 15;
  if (primary_route === "manual_exception") score -= 10;

  return Math.max(0, Math.min(100, score));
}

function classifyFit(score, missing_information) {
  if (missing_information.length >= 3) return "insufficient_information";
  if (score >= 75) return "strong_fit";
  if (score >= 55) return "possible_fit";
  return "weak_fit";
}

function buildAutomationActions(body, primary_route, fit_tier) {
  const actions = [];

  if (fit_tier === "insufficient_information") {
    actions.push("request_missing_information");
  } else {
    actions.push(`create_${primary_route}_queue_item`);
    actions.push("send_broker_alert");
    actions.push("create_document_checklist");
  }

  if (body.urgency === "same_day" || body.urgency === "high") {
    actions.push("mark_high_priority");
  }

  return actions;
}

function routeScenario(body) {
  const missing_information = detectMissingInformation(body);
  const { primary_route, secondary_routes } = selectRoutes(body);
  const fit_score = scoreScenario(body, missing_information, primary_route);
  const fit_tier = classifyFit(fit_score, missing_information);
  const automation_actions = buildAutomationActions(body, primary_route, fit_tier);

  let next_step = "trigger_workflow";
  if (fit_tier === "insufficient_information") next_step = "collect_missing_information";
  if (primary_route === "manual_exception") next_step = "manual_exception_queue";

  return {
    primary_route,
    secondary_routes,
    fit_score,
    fit_tier,
    automation_actions,
    missing_information,
    next_step
  };
}

async function forwardToAutomation(payload) {
  const webhookUrl = process.env.LENDER_FIT_ROUTING_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log("No LENDER_FIT_ROUTING_WEBHOOK_URL configured. Payload logged only.");
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
    throw new Error(`Webhook forwarding failed with status ${response.status}: ${responseText}`);
  }

  return { forwarded: true, destination: "automation_webhook" };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, {
      success: false,
      error: "invalid_method",
      message: "Only POST requests are allowed."
    });
  }

  try {
    const body = req.body || {};

    if (process.env.LENDER_FIT_ROUTING_SHARED_SECRET && body.shared_secret !== process.env.LENDER_FIT_ROUTING_SHARED_SECRET) {
      return sendJson(res, 400, {
        success: false,
        error: "validation_error",
        message: "Invalid or missing shared_secret."
      });
    }

    const validationError = validatePayload(body);

    if (validationError) {
      return sendJson(res, 400, {
        success: false,
        error: validationError.error,
        message: validationError.message
      });
    }

    const routing_id = makeId("lfr");
    const routing = routeScenario(body);

    const payload = {
      success: true,
      routing_id,
      scenario_id: body.scenario_id || null,
      received_at: new Date().toISOString(),
      source: body.source,
      action_type: "lender_fit_routing",
      requester_name: body.requester_name || null,
      borrower_type: body.borrower_type,
      loan_purpose: body.loan_purpose,
      requested_amount: body.requested_amount,
      state: body.state,
      credit_score_range: body.credit_score_range || "unknown",
      monthly_revenue: body.monthly_revenue ?? null,
      annual_revenue: body.annual_revenue ?? null,
      time_in_business_months: body.time_in_business_months ?? null,
      property_type: body.property_type || null,
      occupancy_type: body.occupancy_type || null,
      collateral_available: body.collateral_available ?? null,
      urgency: body.urgency || "normal",
      consent_to_contact: body.consent_to_contact ?? null,
      notes: body.notes || null,
      compliance_notice: "Routing only. No approval, denial, underwriting, pricing, funding, or lender submission has been made.",
      ...routing
    };

    await forwardToAutomation(payload);

    return sendJson(res, 200, {
      success: true,
      routing_id,
      primary_route: routing.primary_route,
      secondary_routes: routing.secondary_routes,
      fit_score: routing.fit_score,
      fit_tier: routing.fit_tier,
      automation_actions: routing.automation_actions,
      missing_information: routing.missing_information,
      next_step: routing.next_step
    });
  } catch (error) {
    console.error("Lender fit routing error:", error);
    return sendJson(res, 500, {
      success: false,
      error: "server_error",
      message: "Unable to route lender fit scenario."
    });
  }
}
