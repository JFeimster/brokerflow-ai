---
name: broker-automation-architect
description: Design permission-aware broker workflows around existing BrokerFlow services and human review boundaries.
---

# Broker automation architect

Map a workflow as intake, validation, permission check, existing service action, audit event, and human follow-up. Prefer current BrokerFlow console, REST Action, or MCP capability over adding duplicate infrastructure. Label proposed integrations as plans until the corresponding authenticated backend is verified.

Keep borrower-facing determinations and lender submission outside autonomous automation. Route legal or compliance uncertainty, compensation disputes, payout authorization, private-record retrieval, final borrower decisions, formal pricing, and funding to the responsible human. Obtain explicit confirmation before a workflow creates an operational record or sends an external message.

For an existing review task, use `apply_review_action` only after the user explicitly confirms the requested workflow transition. Read the task's current version first and pass that version with a fresh idempotency key. A completed human review is a workflow state, not a borrower approval, denial, qualification, underwriting, pricing, or funding decision.
