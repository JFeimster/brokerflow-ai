import {
  normalizeLead,
  detectMissingInformation,
} from "../../api/no-auth/_lead-intake-utils.js";
export function normalizeIntake(input) {
  const normalized = normalizeLead({
    ...input.scenario,
    contact_name: input.contact_name,
    email: input.email,
    phone: input.phone,
    consent_to_contact: input.consent.status === "granted",
  });
  // The legacy detector treats undefined as missing for revenue. Preserve that contract.
  const detectionInput = Object.fromEntries(
    Object.entries(normalized).filter(([, value]) => value !== null),
  );
  const missing = detectMissingInformation(detectionInput);
  return {
    ...input,
    contact_name: normalized.contact_name,
    ...(input.email ? { email: normalized.email } : {}),
    ...(input.phone ? { phone: normalized.phone } : {}),
    completeness: {
      ...missing,
      completeness_score: Math.max(
        0,
        100 -
          missing.critical_missing_information.length * 18 -
          (missing.missing_information.length -
            missing.critical_missing_information.length) *
            7,
      ),
    },
  };
}
