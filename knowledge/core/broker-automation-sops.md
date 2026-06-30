# broker-automation-sops.md

> Knowledge file for the Loan Broker Automation Architect GPT (Moonshine Capital / Distilled Funding).
> Purpose: give the GPT a set of standard operating procedures (SOPs) that govern how the brokerage runs day-to-day with automation in the loop — who does what, in what order, and where humans must stay in control.
> Safety baseline for every SOP in this file: automations support the broker; they never decide borrower outcomes. Use possible fit, ready for broker review, preliminary, and human review required — never approved, qualified, eligible, guaranteed, pre-approved, or declined. Sensitive documents move only through the secure upload provider. A human reviews every borrower-facing message that references amounts, rates, terms, or timelines before it sends.

---

## 1. How to use this file

Each SOP follows the same structure: Purpose → Trigger → Roles → Steps → Automation support → Human checkpoints → Definition of done → Common mistakes. Steps are numbered; workflow references point to the matching patterns in n8n-workflow-pattern-library.md and message families in the borrower/partner template files. The GPT should use these SOPs to answer "how do we handle X" and to design or audit a process.

Roles referenced:
- Intake/Setup — whoever owns lead capture and CRM hygiene (often automated + a coordinator).
- Broker/Advisor — the human who reviews borrowers and owns outcomes.
- Ops/Coordinator — schedules, document chasing, CRM updates, partner support.
- Finance — verifies funded deals and commissions.
- Operator/Owner — oversees reporting, compliance, escalations.

---

## 2. SOP index

SOP-01 Lead intake & CRM hygiene
SOP-02 Lead routing & broker assignment
SOP-03 Borrower preliminary review
SOP-04 Document request & secure handling
SOP-05 Borrower follow-up cadence management
SOP-06 Possible-fit handoff & the broker call
SOP-07 Not-a-fit handling & nurture
SOP-08 Funded deal closeout & payout
SOP-09 Referral partner onboarding
SOP-10 Referral attribution & partner updates
SOP-11 Compliance copy review
SOP-12 Weekly operations review
SOP-13 Automation change management
SOP-14 Incident & error response

---

## 3. SOPs

### SOP-01 — Lead intake & CRM hygiene

Purpose: every inbound lead lands in the CRM, normalized, deduped, and consent-tagged.
Trigger: intake form submission, inbound call/email, or partner referral.
Roles: Intake/Setup (automated + coordinator).
Steps:
1. Capture the lead via form/webhook (n8n Pattern 1).
2. Normalize fields into the standard lead object; band revenue and time-in-business.
3. Deduplicate against existing records by email/phone/business name; merge if matched.
4. Record consent flags (email, SMS) and lead source.
5. Generate and store the secure upload link.
6. Set stage = received.
Automation support: Patterns 1, 11.
Human checkpoints: coordinator reviews any record that fails validation or dedup.
Definition of done: a clean, deduped lead at stage "received" with consent flags and a secure link.
Common mistakes: storing exact financials instead of bands; missing consent capture; ignoring duplicates.

### SOP-02 — Lead routing & broker assignment

Purpose: get each lead to the right broker quickly.
Trigger: stage = received, unassigned.
Roles: Ops/Coordinator (automated round-robin + override).
Steps:
1. Route by product interest, territory, or partner (Pattern 3).
2. Assign via round-robin across available brokers.
3. Notify the assigned broker.
4. Set stage = in_review.
Automation support: Pattern 3.
Human checkpoints: coordinator handles overflow/unassigned and manual reassignments.
Definition of done: lead assigned, broker notified, stage = in_review.
Common mistakes: assigning to unavailable brokers; no overflow path.

### SOP-03 — Borrower preliminary review

Purpose: a human broker assesses possible funding paths — the core judgment step.
Trigger: stage = in_review with a complete-enough file.
Roles: Broker/Advisor.
Steps:
1. Open the lead and review intake + any documents (via secure provider).
2. Apply the lender-matching-rules-framework.md to identify possible fits (preliminary only).
3. Note what's missing; if documents are needed, trigger SOP-04.
4. Set reviewStatus to one of: needs_more_info, possible_fit, or not_a_fit — a human decision.
Automation support: status reassurance to borrower (Pattern 6) while review is open.
Human checkpoints: the entire review — automation never sets these outcomes.
Definition of done: a human has set reviewStatus and logged brief internal notes.
Common mistakes: letting automation imply an outcome; using prohibited language; quoting terms before the call.

### SOP-04 — Document request & secure handling

Purpose: collect needed documents safely.
Trigger: broker flags missing documents.
Roles: Ops/Coordinator + automation.
Steps:
1. Identify the exact document list needed.
2. Send the secure upload link via the appropriate template (Family B/C).
3. Run the follow-up cadence (Pattern 4) until received or moved to re-engagement.
4. On upload, attach the file reference (not contents) and set stage = ready_for_review (Pattern 5).
5. Notify the broker.
Automation support: Patterns 4, 5.
Human checkpoints: broker confirms documents are sufficient.
Definition of done: documents referenced in CRM via secure provider; broker notified.
Common mistakes: requesting docs in chat/SMS; storing raw documents; logging sensitive contents.

### SOP-05 — Borrower follow-up cadence management

Purpose: keep borrowers warm with the right message at the right time.
Trigger: stage changes and scheduled cadence checks.
Roles: Ops/Coordinator + automation.
Steps:
1. Map current stage to the matching message family (borrower-follow-up-email-sms-templates.md).
2. Respect consent flags and opt-outs; enforce cadence/rate limits.
3. Run the copy guard before any send (SOP-11).
4. Update lastContactAt on every touch.
Automation support: Patterns 2, 4, 6, 8.
Human checkpoints: any message referencing money/terms/timelines goes to human review first.
Definition of done: borrower receives stage-appropriate, compliant messaging; CRM updated.
Common mistakes: over-messaging; ignoring STOP/unsubscribe; sending outcome-implying copy.

### SOP-06 — Possible-fit handoff & the broker call

Purpose: convert a possible fit into a live, value-adding conversation.
Trigger: a human sets reviewStatus = possible_fit.
Roles: Broker/Advisor + Ops.
Steps:
1. Confirm possible_fit was set by a human (checkpoint).
2. Send the scheduling templates (Family E) and book the call.
3. Prepare for the call using the lender-matching worksheet; keep specifics for the live conversation.
4. On the call, discuss possible paths, set expectations, and outline next steps — all preliminary.
5. Update stage based on the outcome of the conversation.
Automation support: Pattern 7.
Human checkpoints: only a human sets possible_fit; only a human discusses terms.
Definition of done: call held (or attempts logged) and next step recorded.
Common mistakes: putting amounts/terms in writing pre-call; auto-setting possible_fit.

### SOP-07 — Not-a-fit handling & nurture

Purpose: preserve the relationship when there's no current fit.
Trigger: a human sets reviewStatus = not_a_fit.
Roles: Broker/Advisor + automation.
Steps:
1. Confirm not_a_fit was set by a human.
2. Send the graceful-hold message (Family G) — never the word "declined."
3. Move to nurture with an appropriate long-cycle cadence.
4. Log internal reason codes (kept internal, never exposed to the borrower).
Automation support: Pattern 9.
Human checkpoints: the outcome decision and the reason coding.
Definition of done: borrower kept warm in nurture; internal notes logged.
Common mistakes: hard rejections; exposing internal reasons; dropping the relationship entirely.

### SOP-08 — Funded deal closeout & payout

Purpose: close funded deals cleanly and trigger partner payouts.
Trigger: a human/Finance sets reviewStatus = funded.
Roles: Finance + Broker + automation.
Steps:
1. Finance confirms the deal funded (checkpoint).
2. Send borrower congrats + referral ask (Family H).
3. If a referring partner exists, send the partner funded message and create a pending commission record.
4. Finance verifies and processes the commission per the signed agreement.
5. Set stage = funded; record fundedAt.
Automation support: Pattern 10.
Human checkpoints: Finance confirms funding and verifies commissions; automation never pays out.
Definition of done: borrower thanked, partner credited, commission processed, record closed.
Common mistakes: auto-paying commissions; stating guaranteed amounts; missing partner attribution.

### SOP-09 — Referral partner onboarding

Purpose: turn a new partner into an active, compliant referrer.
Trigger: partner agreement signed.
Roles: Ops/Coordinator + Broker.
Steps:
1. Confirm signed agreement and commission terms on file.
2. Provision a unique referral link/form and tracking.
3. Send the onboarding toolkit (Family C) with the how-to-refer guide.
4. Reinforce compliance: introduce only, no promises, no collecting documents.
5. Set partner stage = onboarded.
Automation support: partner Pattern 12 (activation monitoring).
Human checkpoints: agreement verification.
Definition of done: partner equipped, tracked, and compliant; stage = onboarded.
Common mistakes: onboarding without an agreement; no tracking; skipping compliance briefing.

### SOP-10 — Referral attribution & partner updates

Purpose: credit partners correctly and keep them informed.
Trigger: partner referral submitted; status changes on referred leads.
Roles: Ops + automation.
Steps:
1. Attribute the referral to the partner at capture (Pattern 11).
2. Send the partner a referral confirmation (Family E).
3. Send periodic, non-confidential status updates (Family F) while review is open.
4. On funded, trigger SOP-08 partner steps.
Automation support: Patterns 11, 12.
Human checkpoints: resolve unknown/ambiguous attribution.
Definition of done: partner credited and kept informed without exposing confidential details.
Common mistakes: losing attribution; sharing confidential borrower details with partners.

### SOP-11 — Compliance copy review

Purpose: ensure every outbound message meets language and consent rules.
Trigger: any outbound borrower/partner message.
Roles: automation (copy guard) + Operator for edge cases.
Steps:
1. Run the message through the copy guard sub-workflow (CopyGuard).
2. Reject and route to human review any text containing approved, qualified, eligible, guaranteed, pre-approved, or declined.
3. Verify consent flags and presence of opt-out/unsubscribe.
4. For any message referencing money/terms/timelines, require human review before send.
Automation support: CopyGuard sub-workflow.
Human checkpoints: all flagged messages.
Definition of done: only compliant, consented messages go out.
Common mistakes: bypassing the copy guard; missing opt-out lines.

### SOP-12 — Weekly operations review

Purpose: keep a human view of pipeline health.
Trigger: weekly schedule.
Roles: Operator/Owner.
Steps:
1. Review the automated digest (Pattern 13): new leads, in review, possible fits, funded, partner activity.
2. Spot stuck leads (too long in a stage) and reassign or intervene.
3. Review partner health flags and act on at-risk/dormant partners.
4. Review any copy-guard rejections and error queue items.
Automation support: Pattern 13 reporting.
Human checkpoints: the whole review is human.
Definition of done: action items assigned; stuck items resolved or scheduled.
Common mistakes: letting leads age silently; ignoring partner dormancy.

### SOP-13 — Automation change management

Purpose: change workflows safely.
Trigger: a new/changed automation is proposed.
Roles: Operator + whoever builds workflows.
Steps:
1. Document the change: trigger, nodes, expected output, affected SOPs.
2. Verify human-review gates remain on all outcome and money/terms paths.
3. Test in a staging flow with sample (non-sensitive) data.
4. Confirm consent checks, opt-outs, copy guard, idempotency, and error handling are intact.
5. Deploy, then monitor the first runs; keep a rollback plan.
Automation support: error trigger (Pattern 14) for monitoring.
Human checkpoints: pre-deploy review and post-deploy monitoring.
Definition of done: change deployed with gates intact and monitored.
Common mistakes: removing human gates "to speed things up"; deploying untested; logging sensitive data.

### SOP-14 — Incident & error response

Purpose: handle failures and data issues without losing leads or leaking data.
Trigger: error trigger fires, or a data/compliance issue is reported.
Roles: Operator + builder.
Steps:
1. Capture the failed event to the dead-letter queue (references only, Pattern 14).
2. Triage: identify scope, affected leads/partners, and whether any message was wrongly sent.
3. Remediate: retry safely (idempotent), correct records, and notify affected humans if needed.
4. If a compliance/privacy issue occurred, escalate to the Operator immediately and document.
5. Log root cause and a prevention step; feed into SOP-13 if a workflow change is needed.
Automation support: Pattern 14.
Human checkpoints: triage, remediation, and escalation are human-led.
Definition of done: incident resolved, records corrected, prevention logged.
Common mistakes: silent failures; logging sensitive payloads in the error record; no escalation path.

---

## 4. Cross-cutting operating principles

- Humans own outcomes. needs_more_info, possible_fit, not_a_fit, and funded are always set by people.
- Automation accelerates the routine: capture, routing, reminders, confirmations, reporting.
- Compliance is built in, not bolted on: copy guard, consent checks, opt-outs, and the prohibited-language list apply everywhere.
- Sensitive data minimization: bands not exact figures; references not raw documents; secure upload provider only.
- Single source of truth: the CRM record. Every step reads/writes there so nothing lives only in someone's inbox.
- Traceability: log message type, timestamp, and outcome per contact (without sensitive bodies) for compliance.
- Escalate on doubt: when an automation can't safely proceed, it routes to a human rather than guessing.

---

## 5. RACI quick reference (who's accountable)

Lead intake/hygiene — Responsible: Intake/automation; Accountable: Operator.
Routing/assignment — Responsible: Ops/automation; Accountable: Operator.
Preliminary review & outcomes — Responsible/Accountable: Broker.
Document handling — Responsible: Ops; Accountable: Broker.
Follow-up cadence — Responsible: automation/Ops; Accountable: Broker.
Compliance copy — Responsible: automation; Accountable: Operator.
Funded closeout & payout — Responsible: Finance; Accountable: Operator.
Partner onboarding/attribution — Responsible: Ops; Accountable: Operator.
Reporting & change management — Responsible/Accountable: Operator.

---

## 6. GPT behavior instructions for this file

When asked how a process should run, or to design/audit an SOP, the GPT should:
1. Identify which SOP applies (or compose a new one in the same structure: Purpose → Trigger → Roles → Steps → Automation support → Human checkpoints → Definition of done → Common mistakes).
2. Preserve human-review gates on every outcome and money/terms step.
3. Reference the matching n8n patterns and message families instead of inventing new ones.
4. Enforce compliance language and consent/opt-out rules throughout.
5. Keep sensitive data minimized (bands, references, secure upload only).
6. Call out common mistakes and the definition of done so the process is auditable.

Default output format: the SOP in the standard structure, plus a one-line note on the key human checkpoint(s).

Example output (mini):
SOP: Possible-fit handoff.
Purpose: turn a possible fit into a booked broker call.
Trigger: a human set reviewStatus = possible_fit.
Steps: confirm human decision → send Family E scheduling → book call → prep with worksheet → discuss preliminary paths live.
Human checkpoint: only a human sets possible_fit and discusses terms.

---

## 7. Final rule

SOPs keep automation in a support role and humans in control of every funding outcome. Capture, route, remind, confirm, and report automatically — but review, decide, and commit manually. Keep compliance language, consent, and sensitive-data rules in force at every step. When a step is ambiguous, route to a human and document it.