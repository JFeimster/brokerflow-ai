# Partner Outreach Campaign Builder Testing Checklist

Run from the repository root:

```sh
node --test tests/partner-outreach-conversion.test.js
python scripts/validate-partner-outreach-conversion.py
node --check api/no-auth/partner-outreach-campaign.js
git diff --check
```

The Python contract validator requires PyYAML and jsonschema. API tests use only Node built-ins and mocked HTTP delivery; they never contact real partners or webhooks.

- [ ] POST happy path returns 200 and a unique `campaign_id` with useful, category-specific output.
- [ ] GET, PUT, PATCH, DELETE, HEAD, and OPTIONS return 405 and `Allow: POST`.
- [ ] Missing/blank required fields, invalid enums, wrong types, excessive lengths, arrays, null, and unsupported fields return 400.
- [ ] Unconfigured, configured/correct, configured/missing, and configured/wrong inbound secret behavior matches the contract.
- [ ] Optional webhook receives the correct event and `x-brokerflow-secret`; neither inbound nor outbound secrets appear in the body or response.
- [ ] Unconfigured outbound secret omits the header. No webhook configured still produces a draft.
- [ ] HTTP rejection, network error, and timeout return generic 502 with a tracking ID; no upstream secrets or messages leak.
- [ ] No console logging or private-record retrieval occurs.
- [ ] All new OpenAPI YAML parses as 3.1.x; request/response examples and actual generated outputs validate.
- [ ] New operation IDs and endpoint paths introduce no collisions. Existing unrelated legacy duplicates are reported separately.
- [ ] Review the [guardrails](../knowledge/partner-outreach-campaign-guardrails.md) and run the action-specific behavior tests in the shared suite.

Live deployment is a separate check after deployment; `vercel.json` deployment settings are unchanged by this batch.
