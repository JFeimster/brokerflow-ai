import { z } from "zod";
import { writeInput } from "./common.js";
export const referralInput = {
  ...writeInput,
  partner_id: z.string().uuid(),
  intake_id: z.string().uuid(),
  source_reference: z.string().trim().min(1).max(120),
  permission_to_contact: z.boolean(),
  warm_intro_available: z.boolean(),
  assigned_to: z.string().uuid().optional(),
};
export const referralOutput = {
  referral_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  intake_id: z.string().uuid(),
  deal_id: z.string().uuid(),
  review_id: z.string().uuid().nullable(),
  partner_id: z.string().uuid(),
  attribution_status: z.literal("attributed"),
  status: z.literal("referral_captured"),
  next_action: z.string(),
  duplicate: z.boolean(),
};
