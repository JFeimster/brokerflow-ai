# Partner Attribution Log Testing Checklist

- Test valid metadata, all enums, unique `attribution_log_id`, and deterministic review/next-step mapping.
- Verify review is required for dispute flag, disputed attribution, duplicate-check status, and disputed commission status.
- Verify non-POST methods return 405; missing required fields, invalid enums/types/lengths, and unknown properties return 400.
- Configure request shared secret and verify required/mismatch/match behavior.
- Verify `paid_external_system`, `approved_external_system`, and `scheduled_external_system` remain descriptive and no payment action is triggered.
- Test webhook header, request-secret exclusion, downstream failure handling, and schema/handler response examples.
