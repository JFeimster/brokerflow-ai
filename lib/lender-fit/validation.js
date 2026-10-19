const REQUIRED_FIELDS = [
  "source",
  "action_type",
  "borrower_type",
  "loan_purpose",
  "requested_amount",
  "state",
];

const ENUMS = {
  source: ["custom_gpt", "website", "internal_tool", "webhook_test"],
  borrower_type: [
    "individual",
    "business",
    "real_estate_investor",
    "commercial_borrower",
    "referral_partner_lead",
    "unknown",
  ],
  loan_purpose: [
    "business_working_capital",
    "equipment_financing",
    "commercial_real_estate",
    "residential_purchase",
    "residential_refinance",
    "debt_consolidation",
    "bridge_loan",
    "construction",
    "invoice_financing",
    "sba_review",
    "personal_loan",
    "other",
  ],
  credit_score_range: [
    "unknown",
    "below_580",
    "580_619",
    "620_659",
    "660_699",
    "700_739",
    "740_plus",
  ],
  urgency: ["low", "normal", "high", "same_day"],
  property_type: [
    "single_family",
    "multifamily",
    "condo",
    "townhouse",
    "mixed_use",
    "commercial",
    "land",
    "construction",
    "not_applicable",
    "unknown",
    "other",
  ],
  occupancy_type: [
    "primary_residence",
    "second_home",
    "investment_property",
    "owner_occupied_business",
    "tenant_occupied",
    "vacant",
    "not_applicable",
    "unknown",
  ],
};

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
      message: `${fieldName} must be one of: ${allowedValues.join(", ")}.`,
    };
  }
  return null;
}

export function validatePayload(body) {
  for (const field of REQUIRED_FIELDS) {
    if (isBlank(body[field])) {
      return {
        error: "missing_required_field",
        message: `${field} is required.`,
      };
    }
  }

  if (body.action_type !== "lender_fit_routing") {
    return {
      error: "validation_error",
      message: "action_type must be lender_fit_routing.",
    };
  }

  if (!isValidNumber(body.requested_amount) || body.requested_amount <= 0) {
    return {
      error: "validation_error",
      message: "requested_amount must be a number greater than 0.",
    };
  }

  const numericChecks = [
    ["monthly_revenue", body.monthly_revenue],
    ["annual_revenue", body.annual_revenue],
  ];

  for (const [field, value] of numericChecks) {
    if (value !== undefined && (!isValidNumber(value) || value < 0)) {
      return {
        error: "validation_error",
        message: `${field} must be a number greater than or equal to 0.`,
      };
    }
  }

  if (
    body.time_in_business_months !== undefined &&
    (!Number.isInteger(body.time_in_business_months) ||
      body.time_in_business_months < 0)
  ) {
    return {
      error: "validation_error",
      message:
        "time_in_business_months must be an integer greater than or equal to 0.",
    };
  }

  const enumChecks = [
    validateEnum(body.source, ENUMS.source, "source"),
    validateEnum(body.borrower_type, ENUMS.borrower_type, "borrower_type"),
    validateEnum(body.loan_purpose, ENUMS.loan_purpose, "loan_purpose"),
    validateEnum(
      body.credit_score_range,
      ENUMS.credit_score_range,
      "credit_score_range",
    ),
    validateEnum(body.urgency, ENUMS.urgency, "urgency"),
    validateEnum(body.property_type, ENUMS.property_type, "property_type"),
    validateEnum(body.occupancy_type, ENUMS.occupancy_type, "occupancy_type"),
  ];

  return enumChecks.find(Boolean) || null;
}
