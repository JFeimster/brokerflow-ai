---
name: borrower-follow-up
description: Prepare and track safe borrower follow-up drafts and internal tasks without claiming delivery.
---

Start with an authorized intake, deal or review reference. Use `lookup_deal_status`, `get_review`, and `list_follow_up_tasks` as needed to establish known operational state. Use `generate_document_checklist` for preliminary guidance. Never infer contact permission, provider receipt or missing private facts from a queue status.

Before creating a missing-document task, present the reference, reported missing items, owner/due date if supplied and intended draft-only outcome. After explicit confirmation use `trigger_missing_document_request` with `confirmed: true` and a stable retry key. A clear prior confirmation of that exact request is sufficient. For non-document operational work use `create_follow_up_task` only on explicit user request.

Return the stored request/task ID and label copy as a draft. `draft_prepared` means text exists; `task_created` means an internal task exists; `awaiting_review` would require an actual corresponding workflow state; `sent` requires a genuine delivery integration and receipt. This implementation returns `delivery_status: not_sent`. It does not send borrower communications. Review contact permission and use a verified secure upload channel before any separately authorized delivery.
