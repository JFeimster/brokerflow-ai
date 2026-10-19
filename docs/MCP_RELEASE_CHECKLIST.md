# BrokerFlow MCP release checklist

- [ ] CI build, lint, unit, PostgreSQL integration, MCP protocol, auth boundary, and routing tests pass.
- [ ] Owner-authorized review of the additive follow-up task migration; apply it in the approved environment, then verify task create/list/complete with synthetic records.
- [ ] Vercel Preview confirms `/mcp` and both protected-resource metadata paths; Deployment Protection remains enabled.
- [ ] Existing Supabase OAuth Server, consent flow, resource audience hook, approved client policy, and Preview variables are owner-authorized and verified.
- [ ] A real OAuth-authenticated MCP read/write workflow completes from the private ChatGPT plugin using synthetic records. An unauthenticated 401 or a CI mock is not production proof.
- [ ] Review the single PR and authorize merge/release of the restricted `api/` and OAuth-dependent configuration only after the above checks.
- [ ] Create/connect the private plugin from the verified `plugin/` package. Do not publish it publicly.

## Seven core tools release gate

- [ ] Verify all seventeen names in actual authenticated `tools/list`, including the seven requested core names.
- [ ] Review and apply only `20261019165744_brokerflow_core_workflows.sql` to the selected approved environment. Existing canonical leads, partners, referrals, events, review and task contracts must match the inspected schema. Do not replay historical migrations whose applied timestamps differ.
- [ ] Confirm new deal/request tables have RLS, no anon/authenticated direct access, service-only RPCs and current organization permission checks.
- [ ] Verify the complete synthetic workflow through an actual private-plugin OAuth connection: capture intake → preliminary routing → linked human review → checklist → tracked missing-document task/draft → refreshed deal status → related referral attribution. Retain IDs and sanitized outcomes.
- [ ] Test retry/conflict, viewer denial, foreign-organization denial, empty states and `delivery_status=not_sent` in that approved workspace.
- [ ] Refresh/install private package version 1.2.0 with all ten skills. Preserve existing plugin identity, MCP resource audience, OAuth client allowlist, deployment protection and sharing scope.

Single consolidated owner authorization for activation: approve the reviewed PR release, additive migration on the explicitly selected shared environment, any necessary environment-scoped OAuth configuration, and private-plugin refresh/synthetic live test. CI and the PR make none of those shared changes automatically. The implementation assignment authorizes code, isolated test data, CI and Preview validation; it is not production activation.
