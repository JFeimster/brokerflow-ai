const isValidNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);
function detectMissingInformation(body) {
  const missing = [];

  if (
    body.borrower_type === "business" ||
    body.loan_purpose === "business_working_capital" ||
    body.loan_purpose === "invoice_financing"
  ) {
    if (body.monthly_revenue === undefined && body.annual_revenue === undefined)
      missing.push("business_revenue");
    if (body.time_in_business_months === undefined)
      missing.push("time_in_business_months");
  }

  if (
    [
      "commercial_real_estate",
      "residential_purchase",
      "residential_refinance",
      "bridge_loan",
      "construction",
    ].includes(body.loan_purpose)
  ) {
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

  if (
    body.borrower_type === "business" &&
    primary_route === "business_working_capital"
  )
    score += 15;
  if (isValidNumber(body.monthly_revenue) && body.monthly_revenue >= 15000)
    score += 15;
  if (isValidNumber(body.annual_revenue) && body.annual_revenue >= 180000)
    score += 10;
  if (
    Number.isInteger(body.time_in_business_months) &&
    body.time_in_business_months >= 24
  )
    score += 10;
  if (["660_699", "700_739", "740_plus"].includes(body.credit_score_range))
    score += 10;
  if (body.collateral_available === true) score += 5;
  if (body.urgency === "same_day" || body.urgency === "high") score += 5;

  if (missing_information.length > 0)
    score -= Math.min(25, missing_information.length * 10);
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

export function routeScenario(body) {
  const missing_information = detectMissingInformation(body);
  const { primary_route, secondary_routes } = selectRoutes(body);
  const fit_score = scoreScenario(body, missing_information, primary_route);
  const fit_tier = classifyFit(fit_score, missing_information);
  const automation_actions = buildAutomationActions(
    body,
    primary_route,
    fit_tier,
  );

  let next_step = "trigger_workflow";
  if (fit_tier === "insufficient_information")
    next_step = "collect_missing_information";
  if (primary_route === "manual_exception")
    next_step = "manual_exception_queue";

  return {
    primary_route,
    secondary_routes,
    fit_score,
    fit_tier,
    automation_actions,
    missing_information,
    next_step,
  };
}
