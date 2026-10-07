# Partner Reactivation Trigger Testing Checklist

- Run `node --test tests/partner-onboarding-enablement.test.js`.
- Run `python scripts/validate-partner-onboarding-enablement.py` (PyYAML and jsonschema required).
- Verify all segments return deterministic plans; high-value dormant routes to relationship-manager follow-up.
- Verify never-contacted prospects receive initial outreach wording and no-response plans remain short and bounded.
- Verify preferred-channel routing, multi-channel alternation, valid and invalid ISO dates, enums, types, and field lengths.
- Verify POST-only behavior, request-secret checks, outbound shared-secret header, request-secret exclusion from forwarded body, and generic tracked webhook failures.
- Validate OpenAPI 3.1 examples and repository-wide new operation/path uniqueness.
