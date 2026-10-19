# BrokerFlow MCP release record

## Completed activation — 2026-10-19

Owner-confirmed release milestones:

- [x] PRs #34 and #35 merged to `main`; release CI and the Vercel deployment completed.
- [x] Applied `20261019165744_brokerflow_core_workflows.sql` to the active Supabase platform-core project.
- [x] Supabase OAuth authentication is functioning for the private ChatGPT plugin.
- [x] Authenticated ChatGPT discovery returned all seventeen registered MCP tools, including the seven core operations.
- [x] Installed the ten plugin skills and uploaded private plugin v1.3.0.
- [x] Completed nine live read-only MCP calls successfully.
- [x] Kept the existing plugin identity, `/mcp` endpoint, workspace permissions, and human-review boundaries.

Local and CI validation is recorded in [`MCP_CORE_VALIDATION.md`](MCP_CORE_VALIDATION.md). The seven-step synthetic data workflow passes through registered handlers and PostgreSQL-backed services in test; the nine live ChatGPT calls were read-only and do not establish live persistent-write acceptance.

## Follow-up operational validation

- [ ] In the authorized private test workspace, run and retain sanitized evidence for the complete synthetic persistent workflow: confirmed intake → preliminary routing → confirmed review → checklist → tracked missing-document task/draft → deal lookup → confirmed partner referral.
- [ ] Verify retry/conflict behavior, viewer and cross-workspace denial, empty states, and `delivery_status=not_sent` using authenticated live calls.
- [ ] Re-run the authenticated discovery and read smoke after any future OAuth, deployment, or plugin release change.

## Release boundaries

The activation does not enable borrower-facing message delivery, lender submission, automated underwriting, approval, denial, formal pricing, or funding. Routing and checklist output remains preliminary. Missing-document requests stop at an internal task and borrower-facing draft. Keep protected documents with the secure upload provider and use only approved, scoped references.

For future plugin packaging, run `npm run package:plugin`, `npm run build`, `npm run lint`, `npm test`, and `npm run test:postgres`. Never run database integration tests against a shared or populated database.
