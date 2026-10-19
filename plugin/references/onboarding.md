# Private plugin onboarding

This package connects to the existing BrokerFlow MCP server at `https://brokerflow-ai.vercel.app/mcp`. It requires the owner-configured Supabase OAuth 2.1 connection and an organization membership with current server-side permissions. A packaged ZIP is not proof of installation, OAuth, discovery or live workflow acceptance.

1. Install or refresh this release only in an owner-approved private test workspace.
2. Complete OAuth and call `get_my_workspaces`. Select the organization returned for the current user; never guess an organization ID.
3. Call `tools/list` and verify the seventeen expected names against `references/tool-selection.md`.
4. Start with read-only operations. For a persistent write, summarize the exact record and obtain explicit confirmation before setting `confirmed: true`. Keep an idempotency key stable for retries of that exact request.
5. Run the synthetic sequence in `references/workflow-sequences.md`; use synthetic data only and verify the result from a new authenticated connection.

If OAuth metadata, workspace authorization or discovery fails, stop and follow the owner activation checklist in the repository. Do not work around an access denial with a REST Action or another workspace.
