import { complianceNotice, enforceSharedSecret, forwardDocumentEvent, makeId, sendJson, summarizeFundingFile, validateBody } from "./_document-checklist-utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { success: false, error: "invalid_method", message: "Only POST requests are allowed." });
  }

  try {
    const body = req.body || {};
    const secretError = enforceSharedSecret(body);
    if (secretError) return sendJson(res, 400, { success: false, ...secretError });

    const validationError = validateBody(body, "summarize_funding_file");
    if (validationError) return sendJson(res, 400, { success: false, ...validationError });

    const summary_id = makeId("sff");
    const summary = summarizeFundingFile(body);
    const payload = {
      success: true,
      summary_id,
      received_at: new Date().toISOString(),
      action_type: "summarize_funding_file",
      ...summary,
      compliance_notice: complianceNotice()
    };

    await forwardDocumentEvent(payload);
    return sendJson(res, 200, payload);
  } catch (error) {
    console.error("Summarize funding file error:", error);
    return sendJson(res, 500, { success: false, error: "server_error", message: "Unable to summarize funding file." });
  }
}
