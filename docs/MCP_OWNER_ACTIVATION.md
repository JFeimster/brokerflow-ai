# BrokerFlow MCP activation record

This document records owner-confirmed activation of the seven core MCP capabilities following PRs #34 and #35.

## Completed

- The additive migration `20261019165744_brokerflow_core_workflows.sql` was applied to the active Supabase platform-core project.
- Supabase OAuth authentication is functioning for the existing private ChatGPT plugin connection.
- Private plugin v1.3.0 was uploaded with its ten skills.
- Authenticated ChatGPT discovery returned all seventeen registered tools.
- Nine live read-only MCP calls completed successfully.
- PRs #34 and #35 are merged to `main`; the Vercel deployment completed through the existing release process.

These milestones were confirmed by the repository owner. Do not replay the additive migration or historical migrations. Keep credentials and OAuth client details in approved secret management, never in Git, logs, CLI arguments, or this document.

## Remaining live acceptance

The reported nine live calls were read-only. They establish OAuth and read access, but do not by themselves verify live persistent writes. In the authorized private test workspace, run the synthetic intake → preliminary routing → confirmed review → checklist → confirmed missing-document task/draft → deal lookup → confirmed partner referral sequence. Verify persisted IDs and state from a fresh authenticated connection, retries, tenant isolation, and `delivery_status: not_sent`; retain sanitized evidence only.

The source package and deployment preserve explicit confirmation for writes, current organization membership and permissions on each call, human review for financing decisions, no lender submission, and no borrower-facing delivery. Keep production OAuth, future plugin updates, and any later deployment within the normal release process.
