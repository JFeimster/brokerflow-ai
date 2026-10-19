# Daily Review Queue Digest

## Purpose

Prepare a concise, organization-scoped daily operations report covering pending reviews, aging items, overdue tasks, and assigned owners. This workflow does not create a recurring job, send notifications, change reviews, or create tasks by itself.

## Read steps

1. Call `get_my_workspaces` if the organization is unclear and let the user choose an authorized workspace.
2. Call `get_review_queue_summary` once. Capture open and overdue review totals, status and urgency counts, aging buckets, needs-information count, and oldest outstanding review references.
3. Call `list_follow_up_tasks` for `status: "open"` and `due_before` equal to the reporting date, with a page size of at most 100. Fetch additional pages only when the digest needs them.
4. Group tasks by `assigned_to`. Report the owner UUID if no authorized display name is available. Identify unassigned tasks separately.
5. Draft the report using counts, statuses, ages, task titles, due dates, and task owner IDs. Do not include borrower names, scenario fields, personal contact details, private records, or unrelated task descriptions.

## Digest format

- **Open reviews:** total, status counts, urgency counts.
- **Aging:** counts in each returned age bucket and up to five oldest review references.
- **Overdue reviews:** total and urgency breakdown, with the published operational age thresholds.
- **Needs information:** count and suggested broker follow-up.
- **Overdue or due-today tasks:** task ID, task type, due date, related review reference if present, and assigned owner ID or “unassigned.” Exclude task titles and descriptions because free text may contain borrower details.
- **Next steps:** up to three concise actions grounded in the tool results.

## Delivery controls

Generating a digest is read-only. Delivery is off unless the organization explicitly opts in and configures an authorized destination and delivery adapter. Even when configured, preview the exact content and require user authorization before the first send. Do not enable a recurring schedule through this workflow definition. Never send borrower records or expose them in a shared notification.
