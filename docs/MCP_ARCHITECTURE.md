# BrokerFlow MCP architecture

The MCP endpoint is a stateless Streamable HTTP adapter at `/mcp` over the existing Vercel Node.js functions. It calls the same Supabase project and review services used by the authenticated console and trusted intake. It does not create a second account, tenant, role, rate-limit, or review system.

Supabase Auth verifies the bearer token. The MCP adapter additionally requires the configured issuer, a resource-specific audience, an OAuth `client_id`, and a matching subject. It then reloads active organization memberships and role permissions for every MCP request. An explicitly supplied organization ID is accepted only after that server-side check.

The original Custom GPT Actions remain available. The web console, GPT Action endpoints, and MCP tools share review storage and the existing atomic create/action, idempotency, optimistic-version, and rate-limit services. Queue summary counts use organization-filtered queries. Internal tasks retain their existing store and actor-attributed events. All eighteen registrations pass through one registry/error adapter; `server.js` composes focused modules in `lib/mcp/tools`, schemas live in `lib/mcp/schemas`, and Streamable HTTP remains in `transport.js`.

The seven core capabilities extend this service layer. Routing/checklist computation has no outbound effects; legacy REST forwarding remains in the existing Action adapters. `request_lender_match_review` shares canonical review validation and creation, preserving `create_review_request`. Linking a captured intake uses one transaction around the existing review RPC, deal association and lead event.

Intakes use canonical platform-core `leads` with `source=brokerflow_mcp`, an opaque stable external reference, optional contact fields, and namespaced consent/scenario/completeness metadata. The canonical `qualification` field is not populated by these tools. Intake capture adds a `brokerflow_deals` row. Review status and deal stage remain distinct. Deal lookup returns bounded organization-scoped metadata, task states and last activity, not private contact fields or raw events.

Referrals reuse canonical `partners` and `referrals`, including the existing unique organization/partner/lead key. An active same-organization partner and captured intake are required. Source, permission, scenario, assigned broker and associations are namespaced referral metadata. Canonical `lead_events` records attributable intake/referral creation and attribution updates, with hashed actor/operation idempotency references and payload fingerprints. There is no duplicate generic audit or idempotency ledger.

Missing-document follow-up derives a template from the persisted scenario and compares explicitly user-reported document statuses. It creates an existing internal task and a `brokerflow_document_requests` snapshot atomically. The snapshot preserves the checklist version/reference, reported statuses, missing types and safe draft. Rejected items remain missing. `draft_status=draft_prepared`, `status=task_created` and `delivery_status=not_sent` describe different facts. No delivery adapter is present. An all-reported-complete request returns `no_missing_documents` with null request/task IDs and creates no task.

New persistent tools require explicit user confirmation represented by `confirmed=true`, retained retry keys, existing read and write grants, and the existing durable rate limiter. New service-only RPCs recheck active membership, organization status and `brokerflow.reviews.read`/`write` grants before replay or mutation. These grants authorize the documented BrokerFlow operational capabilities; no new role grants are installed. New tables enable RLS, revoke direct public/anon/authenticated access and permit server-side reads only. Transactional RPC execution is service-only. Shared canonical table grants/policies are preserved.

No tool uploads/retrieves sensitive documents, sends messages, writes an external CRM, determines compensation, makes a final borrower decision or submits to lenders. Lender-fit scores remain legacy internal routing heuristics rather than underwriting or verified current offers. The plugin package contains ten skills and retains its existing identity and MCP endpoint.

## Routes

- `POST /mcp` — Streamable HTTP JSON-RPC endpoint; authentication required.
- `GET /.well-known/oauth-protected-resource` and `GET /.well-known/oauth-protected-resource/mcp` — protected-resource metadata.
- Supabase OAuth discovery is at `https://<project-ref>.supabase.co/.well-known/oauth-authorization-server/auth/v1` after the existing project owner enables OAuth Server.

See [the tool catalog](MCP_TOOL_CATALOG.md) and [OAuth setup](MCP_OAUTH_SETUP.md).
