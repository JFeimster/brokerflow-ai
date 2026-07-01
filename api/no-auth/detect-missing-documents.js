import { auditDocuments, complianceNotice, enforceSharedSecret, forwardDocumentEvent, makeId, sendJson, validateBody } from "./_document-checklist-utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { success: false, error: "invalid_method", message: "Only POST requests are allowed." });
  }

  try {
    const body = req.body || {};
    const secretError = enforceSharedSecret(body);
    if (secretError) return sendJson(res, 400, { success: false, ...secretError });

    const validationError = validateBody(body, "detect_missing_documents");
    if (validationError) return sendJson(res, 400, { success: false, ...validationError });

    const missing_documents_id = makeId("dmd");
    const audit = auditDocuments(body);
    const recommended_requests = audit.missing_documents.map((document_type) => ({ document_type, message: `Please provide ${document_type}.` }));
    const payload = {
      success: true,
      missing_documents_id,
      received_at: new Date().toISOString(),
      action_type: "detect_missing_documents",
      missing_documents: audit.missing_documents,
      recommended_requests,
      completion_score: audit.completion_score,
      audit_status: audit.audit_status,
      next_step: audit.next_step,
      compliance_notice: complianceNotice()
    };

    await forwardDocumentEvent(payload);
    return sendJson(res, 200, payload);
  } catch (error) {
    console.error("Detect missing documents error:", error);
    return sendJson(res, 500, { success: false, error: "server_error", message: "Unable to detect missing documents." });
  }
}
