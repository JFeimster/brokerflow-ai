# BrokerFlow MCP release checklist

- [ ] CI build, lint, unit, PostgreSQL integration, MCP protocol, auth boundary, and routing tests pass.
- [ ] Owner-authorized review of the additive follow-up task migration; apply it in the approved environment, then verify task create/list/complete with synthetic records.
- [ ] Vercel Preview confirms `/mcp` and both protected-resource metadata paths; Deployment Protection remains enabled.
- [ ] Existing Supabase OAuth Server, consent flow, resource audience hook, approved client policy, and Preview variables are owner-authorized and verified.
- [ ] A real OAuth-authenticated MCP read/write workflow completes from the private ChatGPT plugin using synthetic records. An unauthenticated 401 or a CI mock is not production proof.
- [ ] Review the single PR and authorize merge/release of the restricted `api/` and OAuth-dependent configuration only after the above checks.
- [ ] Create/connect the private plugin from the verified `plugin/` package. Do not publish it publicly.
