/**
 * BrokerFlow AI - Document + Checklist utilities.
 *
 * Shared by document/checklist no-auth endpoints. This layer generates document
 * checklists, audits submitted document lists, detects missing docs, assembles
 * submission-packet structure, and summarizes funding files. It does not approve,
 * deny, underwrite, price, fund, or submit a borrower.
 */

const DOC_SETS = {
  business_working_capital: ["business_bank_statements_3_months", "business_application", "owner_id", "voided_check", "profit_and_loss_optional"],
  equipment_financing: ["equipment_invoice_or_quote", "business_bank_statements_3_months", "business_application", "owner_id", "entity_documents"],
  invoice_financing: ["accounts_receivable_aging", "sample_invoices", "business_bank_statements_3_months", "customer_list", "entity_documents"],
  sba_or_bank_review: ["business_bank_statements_6_months", "tax_returns_2_years", "profit_and_loss", "balance_sheet", "debt_schedule", "entity_documents", "owner_id"],
  commercial_real_estate: ["purchase_contract_or_loan_request", "rent_roll", "property_financials", "appraisal_or_bpo_optional", "entity_documents", "owner_id"],
  bridge_or_private_lending: ["property_address", "purchase_contract_or_loan_request", "scope_of_work", "photos_or_valuation", "exit_strategy", "entity_documents"],
  residential_mortgage: ["loan_application", "income_documents", "bank_statements", "credit_authorization", "purchase_contract_if_applicable", "id"],
  debt_consolidation: ["current_debt_schedule", "monthly_payment_summary", "income_or_revenue_documents", "bank_statements", "id"],
  personal_loan_review: ["id", "income_documents", "bank_statements", "loan_purpose_summary"],
  manual_exception: ["scenario_summary", "known_documents", "missing_information_list", "manual_review_notes"]
};

export function sendJson(res, statusCode, payload) {
  res.setHeader("Content-Type", "application/json");
  return res.status(statusCode).json(payload);
}

export function makeId(prefix) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${datePart}_${randomPart}`;
}

export function validateBody(body = {}, expectedActionType) {
  if (!body.source) return { error: "missing_required_field", message: "source is required." };
  if (!body.action_type) return { error: "missing_required_field", message: "action_type is required." };
  if (expectedActionType && body.action_type !== expectedActionType) return { error: "validation_error", message: `action_type must be ${expectedActionType}.` };
  return null;
}

export function enforceSharedSecret(body = {}) {
  if (process.env.DOCUMENT_CHECKLIST_SHARED_SECRET && body.shared_secret !== process.env.DOCUMENT_CHECKLIST_SHARED_SECRET) {
    return { error: "validation_error", message: "Invalid or missing shared_secret." };
  }
  return null;
}

export function normalizeRoute(body = {}) {
  return body.primary_route || body.scenario_type || body.loan_purpose || "manual_exception";
}

export function normalizeSubmittedDocuments(documents = []) {
  if (!Array.isArray(documents)) return [];
  return documents.map((doc) => {
    if (typeof doc === "string") return { document_type: doc, status: "submitted", filename: null, notes: null };
    return {
      document_type: doc.document_type || doc.type || doc.name || "unknown_document",
      status: doc.status || "submitted",
      filename: doc.filename || null,
      notes: doc.notes || null
    };
  });
}

export function generateChecklist(body = {}) {
  const route = normalizeRoute(body);
  const base = DOC_SETS[route] || DOC_SETS.manual_exception;
  const urgency = body.urgency || "normal";
  const required_documents = [...base];
  const optional_documents = [];

  if (["business_working_capital", "equipment_financing", "invoice_financing"].includes(route) && body.requested_amount >= 250000) {
    required_documents.push("tax_returns_or_financial_statements_optional_by_file_strength");
  }
  if (body.credit_score_range === "below_580") optional_documents.push("credit_context_or_explanation_optional");
  if (urgency === "same_day" || urgency === "high") optional_documents.push("priority_contact_confirmation");

  return {
    route,
    checklist_items: [...new Set(required_documents)].map((document_type) => ({ document_type, required: true, status: "needed" })),
    optional_items: [...new Set(optional_documents)].map((document_type) => ({ document_type, required: false, status: "optional" })),
    checklist_notes: [`Checklist generated for ${route}.`, "Document checklist only; no underwriting, approval, funding, or lender submission has occurred."]
  };
}

export function auditDocuments(body = {}) {
  const checklist = generateChecklist(body);
  const submitted = normalizeSubmittedDocuments(body.submitted_documents);
  const submittedTypes = new Set(submitted.map((doc) => doc.document_type));
  const requiredTypes = checklist.checklist_items.map((item) => item.document_type);
  const missing_documents = requiredTypes.filter((doc) => !submittedTypes.has(doc));
  const submitted_required = requiredTypes.filter((doc) => submittedTypes.has(doc));
  const extra_documents = submitted.filter((doc) => !requiredTypes.includes(doc.document_type)).map((doc) => doc.document_type);
  const completion_score = Math.round((submitted_required.length / Math.max(1, requiredTypes.length)) * 100);

  return {
    submitted_documents: submitted,
    required_documents: requiredTypes,
    submitted_required,
    missing_documents,
    extra_documents,
    completion_score,
    audit_status: missing_documents.length === 0 ? "complete_for_initial_review" : "missing_required_documents",
    next_step: missing_documents.length === 0 ? "create_submission_packet" : "request_missing_documents"
  };
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
