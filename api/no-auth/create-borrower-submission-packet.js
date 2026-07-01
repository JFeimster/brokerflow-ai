import { complianceNotice, createPacket, enforceSharedSecret, forwardDocumentEvent, makeId, sendJson, validateBody } from "./_document-checklist-utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { success: false, error: "invalid_method", message: "Only POST requests are allowed." });
  }

  try {
    const body = req.body || {};
    const secretError = enforceSharedSecret(body);
    if (secretError) return sendJson(res, 400, { success: false, ...secretError });

    const validationError = validateBody(body, "create_borrower_submission_packet");
    if (validationError) return sendJson(res, 400, { success: false, ...validationError });

    const packet_id = makeId("bsp");
    const packet = createPacket(body);
    const payload = {
      success: true,
      packet_id,
      received_at: new Date().toISOString(),
      action_type: "create_borrower_submission_packet",
      ...packet,
      compliance_notice: complianceNotice()
    };

    await forwardDocumentEvent(payload);
    return sendJson(res, 200, payload);
  } catch (error) {
    console.error("Create borrower submission packet error:", error);
    return sendJson(res, 500, { success: false, error: "server_error", message: "Unable to create borrower submission packet." });
  }
}
