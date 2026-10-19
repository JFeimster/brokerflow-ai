import { z } from "zod";
import { organization } from "./common.js";
export const dealInput = {
  ...organization,
  deal_id: z.string().uuid().optional(),
  intake_id: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(25),
  cursor: z.number().int().min(0).max(100000).default(0),
};
export const dealStatus = z.object({
  deal_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  intake_id: z.string().uuid(),
  pipeline_stage: z.string(),
  assigned_owner: z.string().uuid().nullable(),
  review_id: z.string().uuid().nullable(),
  review_status: z.string().nullable(),
  tasks: z.array(
    z.object({
      id: z.string().uuid(),
      status: z.string(),
      due_date: z.string().nullable(),
    }),
  ),
  last_activity: z.string(),
  next_action: z.string(),
});
export const dealOutput = {
  items: z.array(dealStatus),
  next_cursor: z.number().int().nullable(),
};
