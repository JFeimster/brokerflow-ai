# BrokerFlow MCP release checklist

- [ ] CI build, lint, unit, PostgreSQL integration, MCP protocol, auth boundary, and routing tests pass.
- [ ] Vercel Preview confirms `/mcp` and both protected-resource metadata paths; Deployment Protection remains enabled.
- [ ] Existing Supabase OAuth Server, consent flow, resource audience hook, approved client policy, and Preview variables are owner-authorized and verified.
- [ ] A real OAuth-authenticated MCP request completes from the private ChatGPT plugin. An unauthenticated 401 or a CI mock is not production proof.
- [ ] Review the single PR and authorize merge/release of the restricted `api/` and OAuth-dependent configuration only after the above checks.
- [ ] Create/connect the private plugin from the verified `plugin/` package. Do not publish it publicly.
