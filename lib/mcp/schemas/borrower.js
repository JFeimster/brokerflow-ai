import { z } from "zod";
import {
  consent,
  fundingScenario,
  writeInput,
  completeness,
} from "./common.js";
export const intakeSchema = z
  .object({
    external_reference: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(/^[A-Za-z0-9_.:-]+$/)
      .describe(
        "Stable opaque reference for this intake; do not use an email or sensitive identifier.",
      ),
    contact_name: z.string().trim().min(1).max(160),
    email: z.string().trim().email().max(254).optional(),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ()-]{7,30}$/)
      .refine(
        (value) => /^\+?\d{7,15}$/.test(value.replace(/[^0-9+]/g, "")),
        "Use a 7-15 digit contact number.",
      )
      .optional(),
    assigned_to: z.string().uuid().optional(),
    consent,
    scenario: fundingScenario,
  })
  .strict();
export const captureInput = { ...writeInput, intake: intakeSchema };
export const captureOutput = {
  intake_id: z.string().uuid(),
  deal_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  status: z.literal("intake_captured"),
  completeness,
  next_action: z.string(),
  duplicate: z.boolean(),
};
