import {
  auditDocuments,
  complianceNotice,
  createPacket,
  enforceSharedSecret,
  forwardDocumentEvent,
  generateChecklist,
  makeId,
  sendJson,
  summarizeFundingFile,
  validateBody
} from "./_document-checklist-utils.js";

const ACTIONS = new Set([
  "generate_document_checklist",
  "audit_submitted_documents",
  "detect_missing_documents",
  "create_borrower_submission_packet",
  "summarize_funding_file"
]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { success: false, error: "invalid_method", message: "Only POST requests are allowed." });
  }

  try {
    const body = req.body || {};
    const secretError = enforceSharedSecret(body);
    if (secretError) return sendJson(res, 400, { success: false, ...secretError });

    if (!ACTIONS.has(body.action_type)) {
      return sendJson(res, 400, { success: false, error: "validation_error", message: "Unsupported document action_type." });
    }

    const validationError = validateBody(body, body.action_type);
    if (validationError) return sendJson(res, 400, { success: false, ...validationError });

    let payload;

    if (body.action_type === "generate_document_checklist") {
      payload = {
        success: true,
        checklist_id: makeId("gdc"),
        received_at: new Date().toISOString(),
        action_type: body.action_type,
        ...generateChecklist(body),
        compliance_notice: complianceNotice(),
        next_step: "collect_documents"
      };
    }

    if (body.action_type === "audit_submitted_documents") {
      payload = {
        success: true,
        audit_id: makeId("asd"),
        received_at: new Date().toISOString(),
        action_type: body.action_type,
        ...auditDocuments(body),
        compliance_notice: complianceNotice()
      };
    }

    if (body.action_type === "detect_missing_documents") {
      const audit = auditDocuments(body);
      payload = {
        success: true,
        missing_documents_id: makeId("dmd"),
        received_at: new Date().toISOString(),
        action_type: body.action_type,
        missing_documents: audit.missing_documents,
        recommended_requests: audit.missing_documents.map((document_type) => ({ document_type, message: `Please provide ${document_type}.` })),
        completion_score: audit.completion_score,
        audit_status: audit.audit_status,
        next_step: audit.next_step,
        compliance_notice: complianceNotice()
      };
    }

    if (body.action_type === "create_borrower_submission_packet") {
      payload = {
        success: true,
        packet_id: makeId("bsp"),
        received_at: new Date().toISOString(),
        action_type: body.action_type,
        ...createPacket(body),
        compliance_notice: complianceNotice()
      };
    }

    if (body.action_type === "summarize_funding_file") {
      payload = {
        success: true,
        summary_id: makeId("sff"),
        received_at: new Date().toISOString(),
        action_type: body.action_type,
        ...summarizeFundingFile(body),
        compliance_notice: complianceNotice()
      };
    }

    await forwardDocumentEvent(payload);
    return sendJson(res, 200, payload);
  } catch (error) {
    console.error("Document action router error:", error);
    return sendJson(res, 500, { success: false, error: "server_error", message: "Unable to process document action." });
  }
}
