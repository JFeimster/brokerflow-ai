# BrokerFlow MCP architecture

The MCP endpoint is a stateless Streamable HTTP adapter at `/mcp` over the existing Vercel Node.js functions. It calls the same Supabase project and review services used by the authenticated console and trusted intake. It does not create a second account, tenant, role, rate-limit, or review system.

Supabase Auth verifies the bearer token. The MCP adapter additionally requires the configured issuer, a resource-specific audience, an OAuth `client_id`, and a matching subject. It then reloads active organization memberships and role permissions for every MCP request. An explicitly supplied organization ID is accepted only after that server-side check.

The original Custom GPT Actions remain available. The web console, GPT Action endpoints, and MCP tools share review storage and the existing atomic create/action, idempotency, optimistic-version, and rate-limit services. Future n8n workflows may use the same authenticated service layer. The MCP V1 does not expose partner/CRM/lender integrations, document uploads, outbound messages, or lender submission.

## Routes

- `POST /mcp` — Streamable HTTP JSON-RPC endpoint; authentication required.
- `GET /.well-known/oauth-protected-resource` and `GET /.well-known/oauth-protected-resource/mcp` — protected-resource metadata.
- Supabase OAuth discovery is at `https://<project-ref>.supabase.co/.well-known/oauth-authorization-server/auth/v1` after the existing project owner enables OAuth Server.

See [the tool catalog](MCP_TOOL_CATALOG.md) and [OAuth setup](MCP_OAUTH_SETUP.md).
