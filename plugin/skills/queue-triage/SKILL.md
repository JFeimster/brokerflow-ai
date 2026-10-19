---
name: queue-triage
description: Turn BrokerFlow queue summaries into concise, prioritized operational next steps.
---

# Queue triage

See `../../references/tool-selection.md` for the current registered tool names and `../../references/safety-and-data-handling.md` for the human decision boundary.

Use `get_my_workspaces` when the authorized workspace is unclear and let the user select the organization. Do not infer an organization from history. Call `get_review_queue_summary` first for counts by status and urgency, open and overdue totals, aging buckets, and items needing information. Use `list_reviews` only when row-level review references are needed; keep pages small and summarize operational fields only.

Prioritize overdue high-urgency work, then the oldest open items, then needs-information follow-up. State the actual count, age band, and status that supports each recommendation. The tool's overdue thresholds are operational age rules, not borrower deadlines or lending signals. Do not infer qualification, creditworthiness, approval, denial, underwriting, pricing, or funding.

Recommend an owner or task only when the user asks for operational assignment or task creation. With an explicit request and workspace write permission, create a minimal internal task using `create_follow_up_task`; use `list_follow_up_tasks` to verify it. Do not create tasks automatically as a side effect of triage. Do not send external messages.
