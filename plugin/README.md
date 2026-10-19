# BrokerFlow AI private plugin package

This package contains a portable Agent Plugins manifest, a remote Streamable HTTP MCP server definition, and five workflow skills, including queue triage and missing-information preparation. MCP tools include organization-scoped review queue summaries and accountable follow-up task management. It is intended for private owner-approved testing only.

The server requires Supabase OAuth 2.1, an exact owner-approved OAuth client ID allowlist, and per-organization permissions. OAuth is not yet activated by this package. Until an owner-authorized Preview connection completes a real signed-in MCP request, the plugin is **built but not connected**. Do not treat this ZIP as an installed or operational plugin.

Follow-up task storage requires owner-authorized application of the additive task migration. The daily review queue digest is draft-only; delivery remains opt-in. See `../docs/MCP_OAUTH_SETUP.md` and `../docs/MCP_RELEASE_CHECKLIST.md` for the exact activation gate. Do not publish the private package to a public directory.
