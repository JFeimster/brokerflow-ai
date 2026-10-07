# Partner Attribution Log Workflow

1. Correlate the completed referral to the partner and referral IDs in the system of record.
2. Call `logPartnerAttribution` with the current descriptive attribution and commission states.
3. Route dispute/duplicate flags to the appropriate internal review queue; route completion/payment workflow states to the existing protected systems.
4. Treat `approved_external_system`, `scheduled_external_system`, and `paid_external_system` as reported states only. Do not trigger money movement from this Action.
5. Store and deduplicate records in the downstream system. The endpoint is stateless and retries may create duplicate logs.
