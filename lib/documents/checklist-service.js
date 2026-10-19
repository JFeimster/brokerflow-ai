import { DOC_SETS } from "./templates.js";

const purposeRoutes = {
  residential_purchase: "residential_mortgage",
  residential_refinance: "residential_mortgage",
  sba_review: "sba_or_bank_review",
  bridge_loan: "bridge_or_private_lending",
  construction: "bridge_or_private_lending",
  personal_loan: "personal_loan_review",
};
export function generateDocumentChecklist(scenario = {}) {
  const checklist = generateChecklist({
    ...scenario,
    primary_route:
      scenario.primary_route ||
      purposeRoutes[scenario.loan_purpose] ||
      scenario.loan_purpose,
  });
  const items = [...checklist.checklist_items, ...checklist.optional_items].map(
    (item) => {
      const recommended =
        !item.required || /optional|if_applicable/.test(item.document_type);
      return {
        document_type: item.document_type,
        document_name: item.document_type.replaceAll("_", " "),
        category: /id|authorization|application/.test(item.document_type)
          ? "identity_and_application"
          : /property|rent|contract|valuation|scope|exit/.test(
                item.document_type,
              )
            ? "property"
            : "financial_and_business",
        required: !recommended,
        recommended,
        review_notes: recommended
          ? "Scenario dependent; broker must confirm applicability."
          : "For initial broker review; lender requirements must be confirmed separately.",
      };
    },
  );
  return {
    template_version: "brokerflow_v1",
    route: checklist.route,
    items,
    review_notes: checklist.checklist_notes,
    preliminary: true,
  };
}
export function normalizeRoute(body = {}) {
  return (
    body.primary_route ||
    body.scenario_type ||
    body.loan_purpose ||
    "manual_exception"
  );
}

export function normalizeSubmittedDocuments(documents = []) {
  if (!Array.isArray(documents)) return [];
  return documents.map((doc) => {
    if (typeof doc === "string")
      return {
        document_type: doc,
        status: "submitted",
        filename: null,
        notes: null,
      };
    return {
      document_type:
        doc.document_type || doc.type || doc.name || "unknown_document",
      status: doc.status || "submitted",
      filename: doc.filename || null,
      notes: doc.notes || null,
    };
  });
}

export function generateChecklist(body = {}) {
  const route = normalizeRoute(body);
  const base = DOC_SETS[route] || DOC_SETS.manual_exception;
  const urgency = body.urgency || "normal";
  const required_documents = [...base];
  const optional_documents = [];

  if (
    [
      "business_working_capital",
      "equipment_financing",
      "invoice_financing",
    ].includes(route) &&
    body.requested_amount >= 250000
  ) {
    required_documents.push(
      "tax_returns_or_financial_statements_optional_by_file_strength",
    );
  }
  if (body.credit_score_range === "below_580")
    optional_documents.push("credit_context_or_explanation_optional");
  if (urgency === "same_day" || urgency === "high")
    optional_documents.push("priority_contact_confirmation");

  return {
    route,
    checklist_items: [...new Set(required_documents)].map((document_type) => ({
      document_type,
      required: true,
      status: "needed",
    })),
    optional_items: [...new Set(optional_documents)].map((document_type) => ({
      document_type,
      required: false,
      status: "optional",
    })),
    checklist_notes: [
      `Checklist generated for ${route}.`,
      "Document checklist only; no underwriting, approval, funding, or lender submission has occurred.",
    ],
  };
}

export function auditDocuments(body = {}) {
  const checklist = generateChecklist(body);
  const submitted = normalizeSubmittedDocuments(body.submitted_documents);
  const submittedTypes = new Set(submitted.map((doc) => doc.document_type));
  const requiredTypes = checklist.checklist_items.map(
    (item) => item.document_type,
  );
  const missing_documents = requiredTypes.filter(
    (doc) => !submittedTypes.has(doc),
  );
  const submitted_required = requiredTypes.filter((doc) =>
    submittedTypes.has(doc),
  );
  const extra_documents = submitted
    .filter((doc) => !requiredTypes.includes(doc.document_type))
    .map((doc) => doc.document_type);
  const completion_score = Math.round(
    (submitted_required.length / Math.max(1, requiredTypes.length)) * 100,
  );

  return {
    submitted_documents: submitted,
    required_documents: requiredTypes,
    submitted_required,
    missing_documents,
    extra_documents,
    completion_score,
    audit_status:
      missing_documents.length === 0
        ? "complete_for_initial_review"
        : "missing_required_documents",
    next_step:
      missing_documents.length === 0
        ? "create_submission_packet"
        : "request_missing_documents",
  };
}
