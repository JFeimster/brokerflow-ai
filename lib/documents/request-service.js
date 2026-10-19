import { createHash } from "node:crypto";
import { generateDocumentChecklist } from "./checklist-service.js";
import { getBorrowerIntake } from "../borrower-intake/query.js";
import { requireWorkspace } from "../mcp/context.js";
import { workflowRpc } from "../workflows/rpc.js";

async function reference(context, organizationId, table, id, columns) {
  const { data, error } = await context.db
    .from(table)
    .select(columns)
    .eq("organization_id", organizationId)
    .eq("id", id)
    .maybeSingle();
  if (error)
    throw Object.assign(new Error("Reference storage unavailable."), {
      status: 503,
    });
  if (!data)
    throw Object.assign(new Error("Reference not found in this workspace."), {
      status: 404,
    });
  return data;
}
export async function prepareMissingDocumentRequest(
  context,
  organizationId,
  input,
  key,
) {
  requireWorkspace(context, organizationId, true);
  if (!input.intake_id && !input.deal_id && !input.review_id)
    throw Object.assign(
      new Error("An intake_id, deal_id or review_id is required."),
      { status: 422 },
    );
  let deal, intake, review;
  if (input.deal_id)
    deal = await reference(
      context,
      organizationId,
      "brokerflow_deals",
      input.deal_id,
      "id,lead_id,review_id",
    );
  const intakeId = input.intake_id || deal?.lead_id;
  if (intakeId)
    intake = await getBorrowerIntake(context, organizationId, intakeId);
  if (deal && input.intake_id && deal.lead_id !== input.intake_id)
    throw Object.assign(
      new Error("References do not identify the same deal."),
      { status: 422 },
    );
  const reviewId = input.review_id || deal?.review_id;
  if (reviewId)
    review = await reference(
      context,
      organizationId,
      "brokerflow_review_requests",
      reviewId,
      "id,scenario",
    );
  if (deal && input.review_id && deal.review_id !== input.review_id)
    throw Object.assign(new Error("Review does not belong to this deal."), {
      status: 422,
    });
  const scenario =
    intake?.metadata.brokerflow_intake.scenario || review?.scenario;
  const checklist = generateDocumentChecklist(scenario);
  const submitted = new Set(
    input.submitted_documents
      .filter((doc) => ["submitted", "verified"].includes(doc.status))
      .map((doc) => doc.document_type),
  );
  const missing = checklist.items
    .filter((item) => item.required && !submitted.has(item.document_type))
    .map((item) => item.document_type);
  const plan = {
    intake_id: intakeId || null,
    deal_id: deal?.id || null,
    review_id: reviewId || null,
    assigned_to: input.assigned_to || null,
    due_date: input.due_date || null,
    checklist,
    submitted_documents: input.submitted_documents,
    missing_documents: missing,
    draft: missing.length
      ? `DRAFT — for broker review before sending.\nPlease provide the following through your broker's verified secure upload channel:\n${missing.map((type) => `- ${type.replaceAll("_", " ")}`).join("\n")}\nDo not send sensitive documents in chat or email. These items support initial review; requirements may change. No approval or funding decision has been made.`
      : "",
  };
  // A stable template reference is retained with the task for later reconciliation.
  plan.checklist_reference = createHash("sha256")
    .update(JSON.stringify(checklist))
    .digest("hex");
  return workflowRpc(
    context,
    organizationId,
    "brokerflow_trigger_missing_document_request",
    plan,
    key,
  );
}
