# Partner Onboarding Checklist Testing Checklist

- Run `node --test tests/partner-onboarding-enablement.test.js`.
- Run `python scripts/validate-partner-onboarding-enablement.py` (PyYAML and jsonschema required).
- Verify COI, affiliate, channel, embedded, and referral-model checklists include relevant items and deterministic next steps.
- Verify completed items reduce the missing list; blocked status prioritizes blocker resolution.
- Verify POST-only behavior, required fields, enums, booleans, array item types, uniqueness, and limits.
- Verify configured request-secret checks, outbound shared-secret header, forwarded payload excludes request secrets, and webhook failure returns a generic tracked 502.
- Verify the OpenAPI 3.1 example and response examples validate against their schemas and the legacy API-key schema is marked reference-only.
