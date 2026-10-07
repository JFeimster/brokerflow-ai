# Partner Enablement Content Testing Checklist

- Run `node --test tests/partner-onboarding-enablement.test.js`.
- Run `python scripts/validate-partner-onboarding-enablement.py` (PyYAML and jsonschema required).
- Verify category-specific draft guidance for accountants, brokers, attorneys, merchant/payroll providers, and equipment vendors.
- Verify every supported content type returns a title; notes and unsafe promises are not copied into the draft.
- Verify required fields, category/content/format/tone/channel enums, type and length limits, and POST-only behavior.
- Verify request-secret handling, outbound shared-secret header, request-secret exclusion from webhook body, and generic tracked webhook failures.
- Validate OpenAPI 3.1 request/response examples and uniqueness of new operation IDs and paths.
