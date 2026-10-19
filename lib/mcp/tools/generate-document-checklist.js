import { registerTool, result } from "../registry.js";
import { requireWorkspace } from "../context.js";
import { readHints } from "../schemas/common.js";
import { checklistInput, checklistOutput } from "../schemas/documents.js";
import { generateDocumentChecklist } from "../../documents/checklist-service.js";
export function registerGenerateDocumentChecklist(server, { contextFor }) {
  registerTool(
    server,
    "generate_document_checklist",
    {
      title: "Generate document checklist",
      description:
        "Generate a read-only product/scenario checklist for broker review. Guidance is preliminary; no raw documents, uploads, storage or lender submission.",
      inputSchema: checklistInput,
      outputSchema: checklistOutput,
      annotations: readHints,
    },
    async ({ organization_id, scenario }, extra) => {
      requireWorkspace(await contextFor(extra), organization_id);
      return result(generateDocumentChecklist(scenario));
    },
  );
}
