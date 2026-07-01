import { complianceNotice, enforceSharedSecret, forwardDocumentEvent, generateChecklist, makeId, sendJson, validateBody } from "./_document-checklist-utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { success: false, error: "invalid_method", message: "Only POST requests are allowed." });
  }

  try {
    const body = req.body || {};
    const secretError = enforceSharedSecret(body);
    if (secretError) return sendJson(res, 400, { success: false, ...secretError });

    const validationError = validateBody(body, "generate_document_checklist");
    if (validationError) return sendJson(res, 400, { success: false, ...validationError });

    const checklist_id = makeId("gdc");
    const checklist = generateChecklist(body);
    const payload = {
      success: true,
      checklist_id,
      received_at: new Date().toISOString(),
      action_type: "generate_document_checklist",
      ...checklist,
      compliance_notice: complianceNotice(),
      next_step: "collect_documents"
    };

    await forwardDocumentEvent(payload);
    return sendJson(res, 200, payload);
  } catch (error) {
    console.error("Generate document checklist error:", error);
    return sendJson(res, 500, { success: false, error: "server_error", message: "Unable to generate document checklist." });
  }
}
