import { z } from "zod";
import { ENUMS } from "../../../api/no-auth/_lead-intake-utils.js";

export const organization = { organization_id: z.string().uuid() };
export const writeInput = {
  ...organization,
  idempotency_key: z.string().min(16).max(200),
  confirmed: z
    .literal(true)
    .describe(
      "Set only after the user explicitly confirms this record creation.",
    ),
};
export const readHints = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
};
export const writeHints = {
  readOnlyHint: false,
  destructiveHint: true,
  openWorldHint: false,
  idempotentHint: true,
};
export const fundingScenario = z
  .object({
    borrower_type: z.enum(ENUMS.borrower_type),
    loan_purpose: z.enum(ENUMS.loan_purpose),
    requested_amount: z.number().positive().max(1_000_000_000),
    state: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{2}$/)
      .transform((value) => value.toUpperCase()),
    business_name: z.string().trim().min(1).max(160).optional(),
    monthly_revenue: z.number().nonnegative().max(1_000_000_000_000).optional(),
    annual_revenue: z.number().nonnegative().max(1_000_000_000_000).optional(),
    time_in_business_months: z
      .number()
      .int()
      .nonnegative()
      .max(2400)
      .optional(),
    credit_score_range: z.enum(ENUMS.credit_score_range).optional(),
    urgency: z.enum(ENUMS.urgency).optional(),
    property_type: z.enum(ENUMS.property_type).optional(),
    occupancy_type: z.enum(ENUMS.occupancy_type).optional(),
    collateral_available: z.boolean().optional(),
  })
  .strict();
export const consent = z
  .object({
    status: z.enum(["granted", "denied", "unknown"]),
    channels: z.array(z.enum(["email", "sms", "phone"])).max(3),
    source: z.string().trim().min(1).max(120),
    captured_at: z.string().datetime({ offset: true }).optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.status !== "granted" ||
      (value.channels.length > 0 &&
        value.captured_at &&
        Date.parse(value.captured_at) <= Date.now()),
    "Granted permission requires channels and a non-future captured_at.",
  );
export const completeness = z.object({
  missing_information: z.array(z.string()),
  critical_missing_information: z.array(z.string()),
  completeness_score: z.number().int().min(0).max(100),
});
