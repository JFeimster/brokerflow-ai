---
title: BrokerFlow Actions — Authenticated Operations
description: Explore BrokerFlow's organization-scoped MCP tools and existing REST Actions for broker operations.
slug: /actions
order: 3
---
# Actions

BrokerFlow exposes two integration surfaces: authenticated, organization-scoped MCP tools and existing REST Actions with their established request/response contracts. A package or configured endpoint alone does not prove that OAuth or an external integration is active.

## Seven core MCP operations

| Tool | Effect |
| --- | --- |
| `capture_borrower_intake` | Save a confirmed, permissioned intake and operational deal record |
| `route_lender_fit` | Compute read-only preliminary product paths from supplied facts |
| `request_lender_match_review` | Create a confirmed human review record, optionally linked to intake |
| `generate_document_checklist` | Return read-only preliminary checklist guidance |
| `trigger_missing_document_request` | Create a confirmed internal task and draft; delivery is `not_sent` |
| `lookup_deal_status` | Read organization-scoped operational deal status |
| `capture_partner_referral` | Save confirmed partner attribution to a captured intake |

Ten existing workspace, review and follow-up task tools remain available. See the [complete MCP tool catalog](../../docs/MCP_TOOL_CATALOG.md).

## REST compatibility

Existing REST Actions remain a separate integration surface. Their behavior and response contracts are covered by compatibility tests. See the repository's `ACTION_INDEX.md` and endpoint-specific action documentation.

## Authentication and data handling

Private MCP access uses the configured Supabase OAuth flow and current organization memberships. Credentials stay in approved server-side configuration. Sensitive documents remain with their secure upload provider; MCP returns checklist or status metadata, not raw files.

Core persistent MCP writes require explicit user confirmation and current workspace write permission. The new MCP routing tool computes deterministically without outbound effects. Legacy REST routing retains its established response contract.

## Safety rules

- Do not approve, decline, qualify, guarantee, underwrite, price, submit or fund a borrower.
- Treat routing scores as internal heuristics, not borrower credit scores, eligibility or verified lender offers.
- Treat a missing-document request as an internal task and draft unless a real separately authorized delivery integration reports a receipt.
- Keep cross-organization access denied and never work around an authorization failure.

## Footer

[Home](./home.md) · [Agent](./agents.md) · [Knowledge](./knowledge.md) · [Workflows](./workflows.md)
