# BrokerFlow AI private plugin package

This package contains a portable Agent Plugins manifest, a remote Streamable HTTP MCP server definition, and three workflow skills. It is intended for private owner-approved testing only.

The server requires Supabase OAuth 2.1, an exact owner-approved OAuth client ID allowlist, and per-organization permissions. OAuth is not yet activated by this package. Until an owner-authorized Preview connection completes a real signed-in MCP request, the plugin is **built but not connected**. Do not treat this ZIP as an installed or operational plugin.

See `../docs/MCP_OAUTH_SETUP.md` and `../docs/MCP_RELEASE_CHECKLIST.md` for the exact activation gate. Do not publish the private package to a public directory.
