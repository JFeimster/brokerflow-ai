# BrokerFlow MCP OAuth setup

The server is deliberately fail-closed until OAuth settings are enabled and supplied. No shared Auth configuration or signing key is changed by this repository implementation.

## Owner configuration proposal

Use the existing Supabase `platform-core` project (`loaowmappekunngjknnx`) and existing Supabase Auth users. Configure OAuth Server's authorization path as `/oauth/consent`; this repository serves that consent page at `https://brokerflow-ai.vercel.app/oauth/consent`. Supabase combines this path with the shared Auth Site URL. That Site URL has historically been `http://localhost:3000`, so an owner must verify all current client flows and exact redirect allowlists before changing it to the production domain. Do not change the shared Auth Site URL until that impact check passes. Keep dynamic client registration disabled until its approval and redirect policies have been reviewed; if it is enabled, monitor registered clients. Do not rotate JWT signing keys as part of this setup.

Set `BROKERFLOW_MCP_RESOURCE` and `BROKERFLOW_MCP_AUDIENCE` to `https://brokerflow-ai.vercel.app/mcp`. Add a Custom Access Token Hook for OAuth authorization-code tokens that sets the access-token `aud` claim to that audience, preserving required standard Supabase claims. The server checks `iss`, `aud`, `sub`, `exp`, and `client_id`; `SUPABASE_SECRET_KEY` remains server-only and Supabase Auth `getUser(token)` verifies the signed token. Populate `BROKERFLOW_MCP_OAUTH_CLIENT_IDS` with at least one exact owner-approved client ID. The service fails closed if that allowlist is empty, so registering a client does not automatically grant it MCP access.

The organization membership and role-permission records remain authoritative. OAuth scopes are not treated as BrokerFlow authorization. The MCP service reloads membership and `brokerflow.reviews.read`, `brokerflow.reviews.write`, and `brokerflow.reviews.audit` on each tool request.

## Validate before activation

1. Confirm Supabase Auth signing-key mode is compatible with the selected OAuth Server configuration; do not rotate existing keys without a separate owner decision.
2. Confirm the shared Site URL change and existing Auth client redirect behavior; then set OAuth Server authorization path to `/oauth/consent`.
3. Test the authorization/consent path with a disposable existing test account and an approved client. Confirm explicit consent, PKCE S256, redirect allowlisting, and denial handling.
4. Configure Preview variables and run the MCP handshake, list tools, read authorization checks, and idempotent create replay against synthetic test data.
5. Keep Vercel Deployment Protection enabled. The public plugin URL is not usable until the OAuth setup and a protected Preview or approved production release are complete.

Supabase docs: [OAuth 2.1 Server](https://supabase.com/docs/guides/auth/oauth-server), [MCP Authentication](https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication), and [Token Security and RLS](https://supabase.com/docs/guides/auth/oauth-server/token-security).
