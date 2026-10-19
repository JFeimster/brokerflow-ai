import { z } from "zod";
import { organization, fundingScenario, writeInput } from "./common.js";
import { DOC_SETS } from "../../documents/templates.js";
export const checklistScenario = fundingScenario
  .partial()
  .extend({ primary_route: z.enum(Object.keys(DOC_SETS)).optional() })
  .strict();
export const checklistInput = { ...organization, scenario: checklistScenario };
export const checklistItem = z.object({
  document_type: z.string(),
  document_name: z.string(),
  category: z.string(),
  required: z.boolean(),
  recommended: z.boolean(),
  review_notes: z.string(),
});
export const checklistOutput = {
  template_version: z.literal("brokerflow_v1"),
  route: z.string(),
  items: z.array(checklistItem),
  review_notes: z.array(z.string()),
  preliminary: z.literal(true),
};
export const documentRequestInput = {
  ...writeInput,
  intake_id: z.string().uuid().optional(),
  deal_id: z.string().uuid().optional(),
  review_id: z.string().uuid().optional(),
  submitted_documents: z
    .array(
      z
        .object({
          document_type: z.string().min(1).max(120),
          status: z.enum(["submitted", "verified", "missing", "rejected"]),
        })
        .strict(),
    )
    .max(100)
    .refine(
      (items) =>
        new Set(items.map((item) => item.document_type)).size === items.length,
      "Each document type must have one reported status.",
    )
    .default([]),
  assigned_to: z.string().uuid().optional(),
  due_date: z.string().date().optional(),
};
export const documentRequestOutput = {
  request_id: z.string().uuid().nullable(),
  task_id: z.string().uuid().nullable(),
  intake_id: z.string().uuid().nullable(),
  deal_id: z.string().uuid().nullable(),
  review_id: z.string().uuid().nullable(),
  status: z.enum(["task_created", "no_missing_documents"]),
  delivery_status: z.literal("not_sent"),
  draft_status: z.enum(["draft_prepared", "not_needed"]),
  missing_documents: z.array(z.string()),
  draft: z.string(),
  next_action: z.string(),
  duplicate: z.boolean(),
};
