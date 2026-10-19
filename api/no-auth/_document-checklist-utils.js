import { generateChecklist, auditDocuments, normalizeRoute } from "../../lib/documents/checklist-service.js";
export { generateChecklist, auditDocuments, normalizeRoute, normalizeSubmittedDocuments } from "../../lib/documents/checklist-service.js";
export { validateBody } from "../../lib/documents/validation.js";
export function sendJson(res, statusCode, payload) {
  res.setHeader("Content-Type", "application/json");
  return res.status(statusCode).json(payload);
}

export function makeId(prefix) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${datePart}_${randomPart}`;
}

export function enforceSharedSecret(body = {}) {
  if (process.env.DOCUMENT_CHECKLIST_SHARED_SECRET && body.shared_secret !== process.env.DOCUMENT_CHECKLIST_SHARED_SECRET) {
    return { error: "validation_error", message: "Invalid or missing shared_secret." };
  }
  return null;
}

export function createPacket(body = {}) {
  const audit = auditDocuments(body);
  const packet_sections = [
    { section_id: "scenario_summary", title: "Scenario Summary", status: "draft_ready" },
    { section_id: "borrower_profile", title: "Borrower / Business Profile", status: "draft_ready" },
    { section_id: "funding_request", title: "Funding Request", status: "draft_ready" },
    { section_id: "document_index", title: "Document Index", status: audit.completion_score >= 100 ? "complete" : "incomplete" },
    { section_id: "review_notes", title: "Broker Review Notes", status: "draft_ready" }
  ];
  return {
    packet_status: audit.completion_score >= 100 ? "ready_for_internal_review" : "incomplete_packet",
    packet_sections,
    document_audit: audit,
    packet_notes: ["Packet assembled for internal broker review.", "No lender submission has been made by this action."],
    next_step: audit.completion_score >= 100 ? "internal_review_before_lender_submission" : "request_missing_documents"
  };
}

export function summarizeFundingFile(body = {}) {
  const audit = auditDocuments(body);
  const route = normalizeRoute(body);
  const strengths = [];
  const gaps = [];

  if (body.monthly_revenue || body.annual_revenue) strengths.push("revenue_context_present");
  if (body.time_in_business_months >= 24) strengths.push("time_in_business_24_months_plus");
  if (audit.missing_documents.length > 0) gaps.push("missing_required_documents");
  if (!body.requested_amount) gaps.push("missing_requested_amount");
  if (!body.state) gaps.push("missing_state");

  return {
    file_summary: `Funding file summarized for ${route}.`,
    route,
    strengths,
    gaps,
    document_completion_score: audit.completion_score,
    missing_documents: audit.missing_documents,
    recommended_next_steps: audit.missing_documents.length > 0 ? ["Request missing documents", "Recheck packet before internal review"] : ["Create borrower submission packet", "Send to internal broker review"],
    compliance_notice: complianceNotice()
  };
}

export async function forwardDocumentEvent(payload) {
  const webhookUrl = process.env.DOCUMENT_CHECKLIST_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("No DOCUMENT_CHECKLIST_WEBHOOK_URL configured. Payload logged only.");
    console.log(JSON.stringify(payload, null, 2));
    return { forwarded: false, destination: "console" };
  }
  const headers = { "Content-Type": "application/json" };
  if (process.env.WEBHOOK_SHARED_SECRET) headers["x-brokerflow-secret"] = process.env.WEBHOOK_SHARED_SECRET;
  const response = await fetch(webhookUrl, { method: "POST", headers, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(`Document webhook forwarding failed with status ${response.status}.`);
  return { forwarded: true, destination: "document_checklist_webhook" };
}

export function complianceNotice() {
  return "Document organization support only. No approval, denial, underwriting, pricing, funding, or lender submission has been made.";
}
