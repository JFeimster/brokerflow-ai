/**
 * BrokerFlow AI - Normalize Broker Lead API
 * Expected endpoint: POST /api/no-auth/normalize-broker-lead
 */

import {
  complianceNotice,
  detectMissingInformation,
  enforceSharedSecret,
  forwardLeadEvent,
  makeId,
  normalizeLead,
  sendJson,
  validateBaseLead
} from "./_lead-intake-utils.js";

const REQUIRED_FIELDS = ["source", "action_type"];

function buildFieldWarnings(raw, normalized, missing) {
  const warnings = [];

  if (raw.email && normalized.email !== raw.email) warnings.push("email_normalized_to_lowercase");
  if (raw.phone && normalized.phone !== raw.phone) warnings.push("phone_digits_normalized");
  if (raw.state && normalized.state !== raw.state) warnings.push("state_normalized_to_uppercase");
  if (missing.critical_missing_information.length > 0) warnings.push("critical_fields_missing_after_normalization");
  if (!normalized.email && !normalized.phone) warnings.push("no_contact_method_available");

  return warnings;
}

function buildMappingNotes(normalized) {
  const notes = [];
  notes.push("Lead normalized into BrokerFlow canonical lead format.");
  if (!normalized.lead_id) notes.push("No external lead_id supplied; downstream systems should use normalized_lead_id if needed.");
  if (normalized.borrower_type === "unknown") notes.push("Borrower type remains unknown and should be collected before routing.");
  notes.push("Normalization only; not an approval, denial, underwriting decision, pricing decision, funding decision, or lender submission.");
  return notes;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, {
      success: false,
      error: "invalid_method",
      message: "Only POST requests are allowed."
    });
  }

  try {
    const body = req.body || {};
    const secretError = enforceSharedSecret(body);
    if (secretError) return sendJson(res, 400, { success: false, ...secretError });

    const validationError = validateBaseLead(body, {
      requiredFields: REQUIRED_FIELDS,
      expectedActionType: "normalize_broker_lead"
    });

    if (validationError) return sendJson(res, 400, { success: false, ...validationError });

    const normalized_lead = normalizeLead(body);
    const missing = detectMissingInformation(normalized_lead);
    const normalized_lead_id = makeId("nbl");
    const field_warnings = buildFieldWarnings(body, normalized_lead, missing);
    const mapping_notes = buildMappingNotes(normalized_lead);
    const next_step = missing.critical_missing_information.length > 0 ? "collect_missing_information" : "continue_to_qualification";

    const payload = {
      success: true,
      normalized_lead_id,
      received_at: new Date().toISOString(),
      action_type: "normalize_broker_lead",
      normalized_lead,
      field_warnings,
      mapping_notes,
      missing_information: missing.missing_information,
      critical_missing_information: missing.critical_missing_information,
      next_step,
      compliance_notice: complianceNotice()
    };

    await forwardLeadEvent(payload);

    return sendJson(res, 200, {
      success: true,
      normalized_lead_id,
      normalized_lead: payload.normalized_lead,
      field_warnings: payload.field_warnings,
      mapping_notes: payload.mapping_notes,
      missing_information: payload.missing_information,
      critical_missing_information: payload.critical_missing_information,
      next_step: payload.next_step
    });
  } catch (error) {
    console.error("Normalize broker lead error:", error);
    return sendJson(res, 500, {
      success: false,
      error: "server_error",
      message: "Unable to normalize broker lead."
    });
  }
}
