import { z } from "zod";
export const reviewInput = {
  organization_id: z.string().uuid(),
  idempotency_key: z.string().min(16).max(200),
  scenario: z
    .object({
      action_type: z.literal("lender_match_review"),
      requester_name: z.string().min(1).max(120),
      borrower_type: z.enum([
        "individual",
        "business",
        "real_estate_investor",
        "commercial_borrower",
        "referral_partner_lead",
        "unknown",
      ]),
      business_name: z.string().max(160).optional(),
      loan_purpose: z.enum([
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
      ]),
      requested_amount: z.number().positive().max(1_000_000_000),
      state: z.string().length(2),
      urgency: z.enum(["low", "normal", "high", "same_day"]).optional(),
      recommended_review_path: z
        .enum([
          "business_funding_review",
          "commercial_real_estate_review",
          "residential_mortgage_review",
          "equipment_financing_review",
          "sba_or_bank_review",
          "manual_exception_review",
          "insufficient_information",
        ])
        .optional(),
      credit_score_range: z
        .enum([
          "unknown",
          "below_580",
          "580_619",
          "620_659",
          "660_699",
          "700_739",
          "740_plus",
        ])
        .optional(),
      monthly_revenue: z.number().nonnegative().optional(),
      annual_revenue: z.number().nonnegative().optional(),
      time_in_business_months: z.number().int().nonnegative().optional(),
      employment_type: z
        .enum([
          "employed",
          "self_employed",
          "business_owner",
          "investor",
          "retired",
          "unemployed",
          "unknown",
          "other",
        ])
        .optional(),
      property_type: z
        .enum([
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
        ])
        .optional(),
      occupancy_type: z
        .enum([
          "primary_residence",
          "second_home",
          "investment_property",
          "owner_occupied_business",
          "tenant_occupied",
          "vacant",
          "not_applicable",
          "unknown",
        ])
        .optional(),
      collateral_available: z.boolean().optional(),
      notes: z.string().max(4000).optional(),
      human_review_required: z.literal(true),
    })
    .strict(),
};
export const reviewOutput = {
  review_id: z.string().uuid(),
  review_request_id: z.string(),
  status: z.string(),
  duplicate: z.boolean(),
};
