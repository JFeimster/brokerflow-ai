# Partner Status Update Draft Testing Checklist

- Test each stage, default minimal disclosure, deterministic next step, and unique `status_update_id`.
- Verify non-POST methods return 405; missing required fields, invalid enums/types/arrays/lengths, and unknown properties return 400.
- Configure request shared secret and verify required/mismatch/match behavior.
- Verify free-text `known_status` and `notes` never appear in the generated update.
- Verify details are omitted at minimal/standard levels, restricted details are removed, and sensitive financial, credit, tax, lender, document, and pricing terms are filtered even with expanded consent.
- Test webhook header, secret exclusion, 502 behavior, and OpenAPI examples against actual output.
