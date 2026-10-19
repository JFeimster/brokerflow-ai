import { registerTool, result } from "../registry.js";
import { requireWorkspace } from "../context.js";
import { writeHints } from "../schemas/common.js";
import {
  documentRequestInput,
  documentRequestOutput,
} from "../schemas/documents.js";
import { prepareMissingDocumentRequest } from "../../documents/request-service.js";
export function registerTriggerMissingDocumentRequest(
  server,
  { contextFor, rateLimit, requestDocuments = prepareMissingDocumentRequest },
) {
  registerTool(
    server,
    "trigger_missing_document_request",
    {
      title: "Track missing-document follow-up",
      description:
        "After explicit user confirmation (confirmed=true), compare a persisted scenario checklist with user-reported document statuses and create a tracked internal task with safe draft copy. Rejected/missing items remain outstanding. Draft/task creation only; delivery_status is not_sent. No raw documents or automatic sending.",
      inputSchema: documentRequestInput,
      outputSchema: documentRequestOutput,
      annotations: writeHints,
    },
    async (
      { organization_id, idempotency_key, confirmed, ...input },
      extra,
    ) => {
      const context = await contextFor(extra);
      requireWorkspace(context, organization_id, true);
      await rateLimit(
        context.db,
        "review_create",
        `${organization_id}:${context.user.id}:documents`,
        30,
        60,
      );
      return result(
        await requestDocuments(
          context,
          organization_id,
          input,
          idempotency_key,
        ),
      );
    },
  );
}
