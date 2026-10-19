# CRM-neutral follow-up task synchronization boundary

BrokerFlow's `brokerflow_follow_up_tasks` table is the canonical task store. CRM synchronization is an optional adapter layer and is not implemented or enabled by this milestone. HubSpot may be the first adapter, but its task objects, IDs, or status values must not replace BrokerFlow's internal task record.

## Adapter contract

Future adapters should implement the following conceptual interface:

```ts
type CanonicalFollowUpTask = {
  id: string;
  reviewId: string | null;
  taskType: string;
  title: string;
  description: string;
  dueDate: string | null;
  assignedTo: string | null;
  status: "open" | "completed";
  createdAt: string;
  completedAt: string | null;
};

interface FollowUpTaskSyncAdapter {
  readonly provider: string;
  pushTask(input: {
    organizationId: string;
    task: CanonicalFollowUpTask;
    idempotencyKey: string;
  }): Promise<{ externalTaskId: string; syncState: "synced" | "pending" }>;
  readTaskState(input: {
    organizationId: string;
    externalTaskId: string;
  }): Promise<{ externalStatus: string; updatedAt: string }>;
}
```

`CanonicalFollowUpTask` is an allowlisted projection of the BrokerFlow task: internal task ID, related review reference, task type, title, description, due date, owner ID, status, and timestamps. Do not export borrower scenario data, contact details, private records, credentials, or audit notes by default.

## Required adapter behavior

- Enable per organization only after explicit authorization and credential configuration.
- Map BrokerFlow IDs to provider IDs in an isolated integration mapping; preserve BrokerFlow IDs as idempotency and correlation keys.
- Keep provider credentials server-side and never include them in task payloads or MCP results.
- Define field mapping, retry, duplicate, deletion, and conflict rules before enabling writes.
- Record attributable sync attempts and provider responses without storing secrets or unnecessary personal data.
- Keep provider writes behind an explicit sync request or a separately approved automation. No background push is implied by task creation or completion.
- Treat HubSpot as one optional implementation of this interface. Other CRMs, including a future BrokerFlow CRM and automation engine, can implement the same contract.

## Current state

The adapter is a design boundary only. No HubSpot API calls, credentials, task mappings, or external CRM writes are part of this workflow.
