# BrokerFlow MCP V1 tool catalog

All tools require an OAuth bearer token for the MCP resource. Each tool reloads the user's active workspace roles and permissions. Select an organization explicitly; its ID is never trusted without membership validation.

| Tool | Permission | Behavior |
| --- | --- | --- |
| `get_my_workspaces` | `brokerflow.reviews.read` | Returns active workspaces and read/write/audit capabilities. |
| `list_reviews` | `brokerflow.reviews.read` | Server-filtered, paginated review rows; page size 1–100. |
| `get_review_queue_summary` | `brokerflow.reviews.read` | Organization-scoped status and urgency counts, open/overdue totals, aging buckets, needs-information count, oldest outstanding references, and suggested operational next steps. |
| `get_review` | `brokerflow.reviews.read` | One organization's allowlisted operational review fields. |
| `get_review_activity` | `brokerflow.reviews.read` and `brokerflow.reviews.audit` | One review's audit events, paginated separately. |
| `create_review_request` | `brokerflow.reviews.read` and `brokerflow.reviews.write` | Validated, idempotent, rate-limited request for human review. |
| `apply_review_action` | `brokerflow.reviews.read` and `brokerflow.reviews.write` | Version-checked, idempotent human workflow transition with an attributable audit event. |
| `create_follow_up_task` | `brokerflow.reviews.read` and `brokerflow.reviews.write` | Persistent, idempotent internal task creation with optional active member assignment and same-organization review link. |
| `list_follow_up_tasks` | `brokerflow.reviews.read` | Filtered, paginated internal task list with owners, due dates, status, and creation/completion attribution. |
| `complete_follow_up_task` | `brokerflow.reviews.read` and `brokerflow.reviews.write` | Idempotent task completion with actor attribution and an audit event. |

`create_review_request` returns `review_id` (the UUID accepted by `get_review` and `get_review_activity`) and `review_request_id` (the stable external request reference). Use `review_id` for subsequent MCP reads.

Creation is not a borrower decision and does not perform qualification, underwriting, approval, pricing, funding, or lender submission. No tool returns raw private documents, bank data, SSNs, credentials, or full conversation transcripts. Errors fail closed on missing backend configuration, permission changes, rate-limit failures, and persistence errors.

`apply_review_action` supports `start_review`, `request_information`, and `mark_reviewed`, following the existing status-transition rules. Supply the current `expected_version` and a unique `idempotency_key`. `request_information` requires a short note; notes reject common personal identifiers and contact details. The tool returns the resulting status and version without treating `reviewed` as a borrower decision. Confirm the intended state change with the user before invoking it.

`get_review_queue_summary` uses organization-filtered server-side counts and returns no borrower scenario fields. Status counts include all reviews; urgency counts, overdue counts, and age buckets cover open reviews only. The response includes up to five oldest open reviews and up to five oldest `needs_information` references. It classifies open reviews as overdue by elapsed age: `same_day` 24 hours, `high` 48 hours, `normal` 120 hours, and `low` 168 hours. These are operational triage thresholds, not borrower deadlines or eligibility rules. Age buckets are under 1 day, 1–3 days, 3–7 days, and over 7 days.

Follow-up tasks are internal workflow records. Task status is `open` or `completed`; task types are `call`, `email`, `request_information`, `document_follow_up`, `internal_review`, and `other`. Creation and completion write actor-attributed audit events. Idempotency keys are stored as hashes. Task text must stay operational and cannot contain common personal identifiers or contact details. Assignment and review links must belong to the selected active organization. MCP task tools never send a message or perform an external CRM write.

An explicit user request can authorize a permitted internal task create or completion without another confirmation prompt. Tasks are never created as an automatic side effect of triage. External message delivery and CRM synchronization require separate opt-in and authorization.

---

## Proposed MCP tools — prioritized backlog (not yet available)

**Status:** All 40 entries below are **Proposed** (not implemented, registered, enabled, or in development merely by appearing here). This separate table is a roadmap; the ten tools above are the active V1 catalog. Numbering **11–50** is the recommended implementation order, based on day-to-day broker utility, prerequisite services, and operational risk. Ship small batches with verified authorization and production acceptance rather than activating all 40 together.

**Planned waves:** **A** = operator task control; **B** = intake and canonical deal tracking; **C** = document-checklist metadata; **D** = verified lender-product reference; **E** = CRM, partner referrals and drafts; **F** = workflow reliability and operations analytics. Wave labels indicate proposed dependencies, **not** current implementation status.

| Order | Proposed tool | Wave | Capability | Operator utility / intended contract | Dependency / release gate |
| ---: | --- | --- | --- | --- | --- |
| 11 | `get_follow_up_task` | A · Operator | Read | Retrieve one task, its review link, assignee, deadline, and current state. | Use allowlisted metadata and organization-scoped read access. |
| 12 | `update_follow_up_task` | A · Operator | Write | Edit a task title, type, non-sensitive description, or due date. | Require expected version, idempotency, write permission, and audit event. |
| 13 | `assign_follow_up_task` | A · Operator | Write | Assign or reassign an open task to an active workspace member. | Verify same-organization membership; capture prior/new owner. |
| 14 | `reopen_follow_up_task` | A · Operator | Write | Reopen a completed task after an explicit operational request. | Version-check and record reason and actor; no borrower decision. |
| 15 | `get_follow_up_task_activity` | A · Operator | Read | View a task's creation, assignments, edits, and completion history. | Enforce independent audit permission and scoped pagination. |
| 16 | `preview_bulk_queue_actions` | A · Operator | Read | Preview a proposed batch of review or task assignments and their conflicts. | Return an exact dry-run diff; never mutate during preview. |
| 17 | `apply_bulk_queue_actions` | A · Operator | Write | Apply a previously reviewed batch of operational queue assignments. | Explicit user approval, per-item authorization, idempotency, and audit. |
| 18 | `get_intake_completeness` | B · Intake/deals | Read | Identify missing intake fields using deterministic workflow requirements. | Completeness only; no credit scoring, eligibility, or inferred facts. |
| 19 | `create_intake_draft` | B · Intake/deals | Write | Save a minimal, resumable pre-review intake draft. | Consent, validation, scoped draft storage; exclude sensitive files and IDs. |
| 20 | `update_intake_draft` | B · Intake/deals | Write | Correct or complete an existing intake draft before human review. | Optimistic versioning, idempotency, attributable history. |
| 21 | `create_deal_from_review` | B · Intake/deals | Write | Create one canonical deal linked to an approved internal review reference. | Requires deal data model and explicit user request; deduplicate. |
| 22 | `list_deals` | B · Intake/deals | Read | Browse organization-scoped financing opportunities by owner, stage, and date. | Requires canonical deal model and permission-filtered fields. |
| 23 | `get_deal` | B · Intake/deals | Read | Retrieve a selected deal's operational fields and linked review/task IDs. | Exclude private documents and sensitive applicant details by default. |
| 24 | `update_deal_stage` | B · Intake/deals | Write | Record an internal pipeline stage change and responsible operator. | Separate internal stages from borrower approval; audit transitions. |
| 25 | `get_deal_timeline` | B · Intake/deals | Read | Unify approved deal milestones, review events, and follow-up references. | Requires deal associations; audit permission for event detail. |
| 26 | `get_document_checklist_templates` | C · Documents | Read | Return verified requirement templates for a selected financing workflow. | Versioned sources; templates are guidance, not lender commitments. |
| 27 | `create_document_checklist` | C · Documents | Write | Attach a required-document metadata checklist to a review or deal. | No raw uploads into MCP; explicit request and audit. |
| 28 | `list_document_checklist_items` | C · Documents | Read | Show outstanding, received, and verified document metadata. | Scoped access, minimal fields, no document contents. |
| 29 | `record_document_receipt` | C · Documents | Write | Log receipt or verification status for a checklist item. | Use authorized storage reference and operator attribution; no raw files. |
| 30 | `search_verified_lender_products` | D · Lender reference | Read | Search the operator-approved lender/product registry with current filters. | Requires maintained dated registry; no eligibility promise. |
| 31 | `get_lender_product_details` | D · Lender reference | Read | Inspect one product's provenance, limitations, effective date, and terms. | Show stale or missing source fields explicitly. |
| 32 | `compare_lender_products` | D · Lender reference | Read | Compare verified product terms side by side for broker consideration. | Evidence-based comparison only; no underwriting decision. |
| 33 | `create_lender_routing_shortlist` | D · Lender reference | Write | Save a broker-review shortlist with reasons and citations. | Human-reviewed routing only; never auto-submit an application. |
| 34 | `record_lender_submission_status` | D · Lender reference | Write | Record an externally completed submission milestone or lender reply. | Logging only; does not contact lenders or authorize a submission. |
| 35 | `search_crm_contacts` | E · CRM/partners | Read | Find permitted CRM contact references for an existing broker workflow. | Requires first authorized CRM adapter, dedupe, and data minimization. |
| 36 | `get_crm_contact` | E · CRM/partners | Read | Retrieve allowlisted organization-relevant contact and ownership fields. | CRM credential isolation and explicit access scope. |
| 37 | `preview_crm_task_sync` | E · CRM/partners | Read | Show BrokerFlow-to-CRM field mapping, duplicates, and planned changes. | Dry-run only; per-organization configured adapter. |
| 38 | `sync_follow_up_task_to_crm` | E · CRM/partners | External write | Sync one approved follow-up task to the CRM with delivery receipt. | Explicit authorization; idempotency, mapping, retry, and audit. |
| 39 | `create_partner_referral` | E · CRM/partners | Write | Record a permissioned referral source and its operational attribution. | No payout calculation/authorization; dedupe and audit. |
| 40 | `list_partner_referrals` | E · CRM/partners | Read | Review partner-sourced opportunities and follow-up statuses. | Organization-scoped referral data only. |
| 41 | `get_partner_pipeline_summary` | E · CRM/partners | Read | Summarize partner activity, referral counts, aging, and pending follow-up. | Business-development metrics, never borrower credit scores. |
| 42 | `get_referral_attribution_summary` | E · CRM/partners | Read | Measure verified referral sources and tracked conversion milestones. | Show provenance/coverage; no unverified commission amounts. |
| 43 | `draft_follow_up_message` | E · CRM/partners | Draft | Prepare a borrower or partner follow-up draft using approved context. | Draft only by default; no external send and no private record leakage. |
| 44 | `get_operations_metrics` | F · Automation/analytics | Read | Report review/task turnaround, backlog trends, and operator workload. | Aggregate by permitted organization; suppress unnecessary personal data. |
| 45 | `get_integration_health` | F · Automation/analytics | Read | Show connector status, last successful sync, and configuration gaps. | Never disclose tokens, secrets, or private errors. |
| 46 | `list_workflow_delivery_failures` | F · Automation/analytics | Read | Identify failed workflow deliveries and retry-safe correlation IDs. | Require durable outbox/delivery ledger and scoped access. |
| 47 | `retry_workflow_delivery` | F · Automation/analytics | External write | Retry one previously approved failed delivery safely. | Honor original authorization, dedupe keys, rate limits, and receipts. |
| 48 | `preview_automation_run` | F · Automation/analytics | Read | Show exact planned workflow actions, data destinations, and side effects. | No execution during preview; expose sensitive steps for approval. |
| 49 | `run_approved_automation` | F · Automation/analytics | External write | Start one explicitly approved workflow with durable execution tracking. | Allowlisted automation, scoped permissions, idempotency, audit. |
| 50 | `get_automation_run_status` | F · Automation/analytics | Read | Read job progress, completion, failures, and delivery receipts. | Read authorized run only; redacted operational logs. |

### Backlog acceptance rules

- **Source of truth:** Keep BrokerFlow's authenticated, organization-scoped review and task services authoritative. A future deal model or CRM adapter must not fork workflow state or silently override task records.
- **Permissions:** Each future tool needs explicitly defined read/write/audit or integration-specific privileges, checked on every call against the authenticated user's active organization. Labels in the backlog are *capability categories*, not already-granted scopes.
- **Writes:** Require validated inputs, attribution, tenant isolation, replay-safe idempotency, optimistic concurrency where relevant, rate limits, durable audit events, and clear failure responses. Host confirmation/approval must reflect the action's risk and effects.
- **External actions:** CRM sync, workflow retries, and automation execution require configured credentials, explicit authorized destinations, delivery receipts, and scoped approval. Draft-generation tools do not send messages. Lender product search/shortlists do not submit applications.
- **Data controls:** Expose minimum necessary operational data. Never return raw private documents, bank statements, account numbers, SSNs, secrets, or full application records to ChatGPT by default. Document tools track *metadata* and controlled references only.
- **Decision boundary:** Queue urgency, document completeness, partner attribution, and lender-product comparisons are informational. No tool is authorized to make borrower creditworthiness, eligibility, underwriting, pricing, approval, denial, or funding decisions.
- **Activation:** Only move a row to **In development** when implementation work starts; move it to **Active** only after schema/code, migrations (if needed), MCP tool discovery, scoped authenticated smoke tests, plugin packaging, and production validation pass. Update the active table above when a tool actually ships.

**Next recommended implementation batch:** Orders **11–15** (single-task detail, update, assignment, reopen, and audit history), then **16–17** (safe batch-preview and approved application). Complete the existing V1 synthetic task create → list → complete acceptance test before beginning this backlog.
