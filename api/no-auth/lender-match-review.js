/**
 * BrokerFlow AI - No-Auth Lender Match Review API
 *
 * Vercel Serverless Function for the Loan Broker Automation Architect GPT.
 *
 * Purpose:
 * Accept a structured lender/product match review request and queue it for
 * human review.
 *
 * This endpoint must NOT:
 * - Approve a borrower
 * - Decline a borrower
 * - Underwrite a borrower
 * - Price a loan
 * - Submit a borrower to a lender
 * - Return private lender matrices
 * - Return final eligibility decisions
 * - Expose CRM records
 * - Store raw sensitive documents
 *
 * Expected endpoint:
 * POST /api/no-auth/lender-match-review
 */

const REQUIRED_FIELDS = [
  "source",
  "action_type",
  "requester_name",
  "borrower_type",
  "loan_purpose",
  "requested_amount",
  "state",
  "human_review_required"
];

const ALLOWED_SOURCES = [
  "custom_gpt",
  "website",
  "internal_tool",
  "webhook_test"
];

const ALLOWED_BORROWER_TYPES = [
  "individual",
  "business",
  "real_estate_investor",
  "commercial_borrower",
  "referral_partner_lead",
  "unknown"
];

const ALLOWED_LOAN_PURPOSES = [
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
  "other"
];

const ALLOWED_CREDIT_SCORE_RANGES = [
  "unknown",
  "below_580",
  "580_619",
  "620_659",
  "660_699",
  "700_739",
  "740_plus"
];

const ALLOWED_URGENCY_VALUES = [
  "low",
  "normal",
  "high",
  "same_day"
];

const ALLOWED_REVIEW_PATHS = [
  "business_funding_review",
  "commercial_real_estate_review",
  "residential_mortgage_review",
  "equipment_financing_review",
  "sba_or_bank_review",
  "manual_exception_review",
  "insufficient_information"
];

const ALLOWED_EMPLOYMENT_TYPES = [
  "employed",
  "self_employed",
  "business_owner",
  "investor",
  "retired",
  "unemployed",
  "unknown",
  "other"
];

const ALLOWED_PROPERTY_TYPES = [
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
  "other"
];

const ALLOWED_OCCUPANCY_TYPES = [
  "primary_residence",
  "second_home",
  "investment_property",
  "owner_occupied_business",
  "tenant_occupied",
  "vacant",
  "not_applicable",
  "unknown"
];

function sendJson(res, statusCode, payload) {
  res.setHeader("Content-Type", "application/json");
  return res.status(statusCode).json(payload);
}

function makeReviewRequestId() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `lmr_${datePart}_${randomPart}`;
}

function isBlank(value) {
  return value === undefined || value === null || value === "";
}

function isValidNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function validateEnum(value, allowedValues, fieldName) {
  if (isBlank(value)) {
    return null;
  }

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
      return {
        error: "missing_required_field",
        message: `${field} is required.`
      };
    }
  }

  if (body.action_type !== "lender_match_review") {
    return {
      error: "validation_error",
      message: "action_type must be lender_match_review."
    };
  }

  if (body.human_review_required !== true) {
    return {
      error: "invalid_human_review_flag",
      message: "human_review_required must be true for this Action."
    };
  }

  if (!isValidNumber(body.requested_amount) || body.requested_amount <= 0) {
    return {
      error: "validation_error",
      message: "requested_amount must be a number greater than 0."
    };
  }

  if (body.monthly_revenue !== undefined && (!isValidNumber(body.monthly_revenue) || body.monthly_revenue < 0)) {
    return {
      error: "validation_error",
      message: "monthly_revenue must be a number greater than or equal to 0."
    };
  }

  if (body.annual_revenue !== undefined && (!isValidNumber(body.annual_revenue) || body.annual_revenue < 0)) {
    return {
      error: "validation_error",
      message: "annual_revenue must be a number greater than or equal to 0."
    };
  }

  if (
    body.time_in_business_months !== undefined &&
    (!Number.isInteger(body.time_in_business_months) || body.time_in_business_months < 0)
  ) {
    return {
      error: "validation_error",
      message: "time_in_business_months must be an integer greater than or equal to 0."
    };
  }

  const enumChecks = [
    validateEnum(body.source, ALLOWED_SOURCES, "source"),
    validateEnum(body.borrower_type, ALLOWED_BORROWER_TYPES, "borrower_type"),
    validateEnum(body.loan_purpose, ALLOWED_LOAN_PURPOSES, "loan_purpose"),
    validateEnum(body.credit_score_range, ALLOWED_CREDIT_SCORE_RANGES, "credit_score_range"),
    validateEnum(body.urgency, ALLOWED_URGENCY_VALUES, "urgency"),
    validateEnum(body.recommended_review_path, ALLOWED_REVIEW_PATHS, "recommended_review_path"),
    validateEnum(body.employment_type, ALLOWED_EMPLOYMENT_TYPES, "employment_type"),
    validateEnum(body.property_type, ALLOWED_PROPERTY_TYPES, "property_type"),
    validateEnum(body.occupancy_type, ALLOWED_OCCUPANCY_TYPES, "occupancy_type")
  ];

  const enumError = enumChecks.find(Boolean);

  if (enumError) {
    return enumError;
  }

  if (body.email && typeof body.email === "string" && !body.email.includes("@")) {
    return {
      error: "validation_error",
      message: "email must be a valid email address."
    };
  }

  if (body.notes && body.notes.length > 4000) {
    return {
      error: "validation_error",
      message: "notes must be 4000 characters or fewer."
    };
  }

  return null;
}

function sanitizePayload(body) {
  return {
    source: body.source,
    action_type: "lender_match_review",
    requester_name: body.requester_name,
    borrower_type: body.borrower_type,
    borrower_name: body.borrower_name || null,
    business_name: body.business_name || null,
    email: body.email || null,
    phone: body.phone || null,
    loan_purpose: body.loan_purpose,
    requested_amount: body.requested_amount,
    state: body.state,
    credit_score_range: body.credit_score_range || "unknown",
    monthly_revenue: body.monthly_revenue ?? null,
    annual_revenue: body.annual_revenue ?? null,
    time_in_business_months: body.time_in_business_months ?? null,
    employment_type: body.employment_type || "unknown",
    property_type: body.property_type || null,
    occupancy_type: body.occupancy_type || null,
    collateral_available: body.collateral_available ?? null,
    urgency: body.urgency || "normal",
    recommended_review_path: body.recommended_review_path || "manual_exception_review",
    consent_to_contact: body.consent_to_contact ?? null,
    notes: body.notes || null,
    human_review_required: true,
    received_at: new Date().toISOString()
  };
}

async function forwardToAutomation(payload) {
  /**
   * Optional forwarding targets.
   *
   * Add any of these environment variables in Vercel:
   *
   * LENDER_MATCH_REVIEW_WEBHOOK_URL
   *   - n8n, Zapier, Make, Pipedream, etc.
   *
   * WEBHOOK_SHARED_SECRET
   *   - Optional value sent as x-brokerflow-secret header to your automation tool.
   *
   * This function intentionally does not fail the request if the forwarding
   * target is not configured. That makes local testing easy.
   */

  const webhookUrl = process.env.LENDER_MATCH_REVIEW_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log("No LENDER_MATCH_REVIEW_WEBHOOK_URL configured. Payload logged only.");
    console.log(JSON.stringify(payload, null, 2));
    return {
      forwarded: false,
      destination: "console"
    };
  }

  const headers = {
    "Content-Type": "application/json"
  };

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

  return {
    forwarded: true,
    destination: "automation_webhook"
  };
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

    /**
     * Optional body-level shared secret check.
     *
     * This is still considered no-auth from the GPT Action perspective, but it
     * can help reduce random webhook abuse.
     *
     * To enable:
     * - Add LENDER_MATCH_REVIEW_SHARED_SECRET in Vercel
     * - Include matching shared_secret in the Action request body
     */
    if (process.env.LENDER_MATCH_REVIEW_SHARED_SECRET) {
      if (body.shared_secret !== process.env.LENDER_MATCH_REVIEW_SHARED_SECRET) {
        return sendJson(res, 400, {
          success: false,
          error: "validation_error",
          message: "Invalid or missing shared_secret."
        });
      }
    }

    const validationError = validatePayload(body);

    if (validationError) {
      return sendJson(res, 400, {
        success: false,
        error: validationError.error,
        message: validationError.message
      });
    }

    const reviewRequestId = makeReviewRequestId();

    const payload = {
      review_request_id: reviewRequestId,
      status: "queued_for_human_review",
      next_step: "manual_review",
      compliance_notice: "No approval, denial, pricing, underwriting, or lender submission has been made.",
      ...sanitizePayload(body)
    };

    await forwardToAutomation(payload);

    return sendJson(res, 200, {
      success: true,
      review_request_id: reviewRequestId,
      status: "queued_for_human_review",
      message: "Lender match review request created. A human reviewer must evaluate the scenario before any borrower-facing recommendation or lender submission.",
      next_step: "manual_review"
    });
  } catch (error) {
    console.error("Lender match review error:", error);

    return sendJson(res, 500, {
      success: false,
      error: "server_error",
      message: "Unable to create lender match review request."
    });
  }
}
