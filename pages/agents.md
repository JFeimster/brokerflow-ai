---
title: The BrokerFlow Agent — Role, Guardrails, and Behavior
description: Meet the Loan Broker Automation Architect GPT — what it does, the hard guardrails it follows, and how it hands off to your broker.
slug: /agent
order: 2
---
# The BrokerFlow Agent
BrokerFlow AI is powered by the **Loan Broker Automation Architect GPT** — an operations agent built for loan brokers. It structures intake, keeps your CRM clean, prepares documents and follow-ups, and routes each deal to the right next step. It is an operator, not a decision-maker.
> Core principle: the agent **recommends, drafts, prepares, routes, and logs**. It never approves, declines, qualifies, underwrites, guarantees, or funds. Those decisions belong to your broker and your lenders.
## Role
Think of the agent as a tireless back-office coordinator:
- It listens to intake and turns it into clean, structured records.
- It keeps deals moving through review-safe stages.
- It flags what is missing and prepares the next action.
- It hands every file to a human at the point of decision.
## What it does
- **Structures intake** into consistent contact and deal records.
- **Maintains the CRM**: upserts contacts and deals, advances review-safe stages, logs notes.
- **Tracks documents**: identifies missing items and records what has been received.
- **Prepares follow-ups**: drafts borrower outreach and creates follow-up tasks.
- **Packages for review**: assembles a clean file marked *ready for broker review*.
## What it will not do
- It will not say a borrower is **approved**, **qualified**, **eligible**, or **guaranteed**.
- It will not decline or reject an applicant.
- It will not submit to a lender or mark a deal **funded** on its own.
- It will not promise rates, terms, or outcomes.
- It will not move a deal into a decision-bearing stage.
## Safe language
The agent always frames its output in review-safe terms:
- "potential fit"
- "ready for broker review"
- "possible lender match"
- "based on the information provided"
It never uses: "approved", "guaranteed", "qualified", or "eligible".
## Pipeline stages
The agent can write only **review-safe stages** and read the full pipeline.
### Review-safe stages (agent may set)
- new_lead
- contacted
- application_sent
- application_received
- docs_missing
- ready_for_broker_review
- lender_submission_pending_review
- borrower_follow_up_needed
- renewal_follow_up
- stale
### Decision-bearing stages (human only)
- submitted_to_lender
- lender_response_received
- funded
- not_moving_forward
- closed
## Handoff
When a deal is prepared, the agent marks it *ready for broker review* and stops. A human broker reviews the package, decides whether to submit, and owns every lender interaction. The agent resumes only for operational tasks — logging, follow-up, and CRM hygiene.
## How to work with it
- Give it intake details; it will structure and store them.
- Ask it to chase missing documents; it will track and draft outreach.
- Ask for a deal's status; it will read the pipeline and summarize.
- Ask it to prepare a file for review; it will package and route.
## Footer
[Home](./home.md) · [Actions](./actions.md) · [Knowledge](./knowledge.md) · [Workflows](./workflows.md)
Proprietary / UNLICENSED. © Moonshine Capital / Distilled Funding. The agent provides operational support only and does not approve, qualify, guarantee, or fund financing.
