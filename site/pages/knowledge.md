---
title: BrokerFlow Knowledge — How the Agent Reasons
description: The knowledge base behind BrokerFlow AI — intake patterns, document checklists, pipeline definitions, and the guardrails that keep it safe.
slug: /knowledge
order: 4
---
# Knowledge
Knowledge files are the reference material BrokerFlow AI reasons from. They define how the agent structures intake, what documents a deal needs, how the pipeline is organized, and where a human must step in. The knowledge base is what keeps the agent consistent, accurate, and compliant across every brokerage.
> Knowledge informs how the agent prepares and routes work. It never overrides the core rule: the agent recommends and prepares, humans decide.
## How it's organized
The knowledge base is split into a **core** set (the essentials every brokerage needs) and an **expanded** set (deeper playbooks for teams that want more structure).
### Core knowledge
| File | What it covers |
| --- | --- |
| `broker-intake-workflow-examples` | Reusable intake patterns for leads and applications |
| `loan-document-checklist-templates` | Document checklists by product and stage |
| `crm-pipeline-stage-definitions` | Pipeline stages, statuses, and triggers |
| `lender-matching-rules-framework` | Safe, preliminary lender-fit logic (never underwriting) |
| `borrower-follow-up-email-sms-templates` | Borrower outreach by deal stage |
| `referral-partner-workflow-templates` | Partner intake, updates, and nurture |
| `n8n-workflow-pattern-library` | Reusable automation node patterns |
| `broker-automation-sops` | Repeatable operating procedures |
| `compliance-human-review-guardrails` | What must stay human, and safe language |
| `funding-agency-operations-playbook` | The broader operating model |
### Expanded knowledge
Deeper references for scaling teams: lead-source attribution, intake form field libraries, document-collection blueprints, status-update message libraries, daily pipeline reporting, duplicate-lead prevention, lender-submission tracking, renewal and re-engagement, task-management systems, error-handling playbooks, tech-stack options, testing checklists, offer templates, the funding data dictionary, and human-approval workflow examples.
## What the agent reasons about
- **Intake.** Which fields to capture and how to structure a clean record.
- **Documents.** What each product needs and what is still missing.
- **Pipeline.** Which stage a deal belongs in and what moves it forward.
- **Lender fit.** Possible matches framed as "potential fit", never approvals.
- **Communication.** Stage-appropriate, review-safe borrower and partner messaging.
- **Guardrails.** When to stop and route to a human.
## Standard data the agent knows
- **Pipeline stages:** new_lead, contacted, application_sent, application_received, docs_missing, ready_for_broker_review, lender_submission_pending_review, submitted_to_lender, lender_response_received, borrower_follow_up_needed, funded, not_moving_forward, renewal_follow_up, stale, closed.
- **Document types:** bank_statements, business_tax_return, personal_tax_return, driver_license, voided_check, debt_schedule, profit_and_loss, balance_sheet, application, other.
- **Product types:** working_capital, revenue_based_financing, term_loan, line_of_credit, equipment_financing, invoice_financing, sba_review, other.
## Compliance guardrails
The guardrails file governs everything else:
- Never claim a borrower is approved, qualified, eligible, or guaranteed.
- Frame lender fit as "possible match" or "potential fit", pending broker review.
- Keep sensitive documents out of chat; pass metadata and secure links only.
- Always route decision-bearing steps (lender submission, terms, declines) to a human.
## Footer
[Home](./home.md) · [Agent](./agents.md) · [Actions](./actions.md) · [Workflows](./workflows.md)
Proprietary / UNLICENSED. © Moonshine Capital / Distilled Funding. Knowledge files support operational guidance only and do not approve, qualify, guarantee, or fund financing.
