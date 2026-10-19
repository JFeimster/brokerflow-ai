---
name: document-collection
description: Generate preliminary document checklists and track confirmed missing-document follow-up tasks.
---

Use `generate_document_checklist` for a read-only scenario-specific checklist. Distinguish required and recommended items and state that the template is preliminary broker guidance. Requirements must be confirmed for the actual lender/product. Documents stay with the secure upload provider; never request raw files, account numbers or identity-document contents through MCP.

When the user wants tracked follow-up, identify an authorized intake, deal or review. Collect the user-reported submitted/verified/missing/rejected status for each known document type; absence of a report does not prove provider receipt. Summarize the proposed internal task and get explicit confirmation. Then call `trigger_missing_document_request` with `confirmed: true`, an idempotency key, reference and reported metadata. Include an assignee or due date only when authorized.

Retain request/task IDs, missing items and draft copy. Report `task_created`, `draft_prepared` and `not_sent` exactly. `no_missing_documents` creates no task and is not a completeness or underwriting certification. Use `lookup_deal_status` or `list_follow_up_tasks` to inspect subsequent state. No tool here sends or retrieves private documents.
