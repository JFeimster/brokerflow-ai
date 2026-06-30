# n8n-workflow-pattern-library.md

> Knowledge file for the Loan Broker Automation Architect GPT (Moonshine Capital / Distilled Funding).
> Purpose: give the GPT a reusable library of n8n automation patterns for a loan-brokerage operation — intake, routing, follow-up, document handling, partner attribution, and reporting — described in plain text so the GPT can design or explain a workflow on request.
> Safety baseline for every pattern in this file: automations may move and organize data, but they must never decide borrower outcomes or state approval/qualification. Use possible fit, ready for broker review, preliminary, and human review required. Sensitive documents move only through the secure upload provider — never store raw documents in chat logs, webhook payloads, or spreadsheets. Insert a human-review checkpoint before any borrower-facing message that references amounts, rates, terms, or timelines.

---

## 1. How to read this file

Each pattern below is described as: Trigger → Nodes (in order) → Output, plus notes. Workflow maps use → arrows and indentation instead of code fences. JSON payloads are shown inline as plain text. The GPT should translate these patterns into concrete n8n node configurations on request, substituting the operator's real apps (CRM, email/SMS provider, secure upload provider, storage).

Common building-block nodes referenced throughout:
- Webhook / Form Trigger — entry point for intake or partner submissions.
- Set / Edit Fields — normalize and shape data.
- IF / Switch — branching by stage, score band, or product path.
- HTTP Request — call CRM or external APIs.
- CRM node (e.g., the operator's CRM) — create/update records.
- Email node + SMS node — borrower/partner messaging.
- Merge / Aggregate — combine branches or batch records.
- Wait / Schedule Trigger — delays and cadences.
- Error Trigger — catch failures and alert a human.

---

## 2. Core data object (shared shape)

Most workflows pass around a normalized "lead object." Plain-text shape (inline JSON):

{ leadId: string, source: string, referringPartnerId: string|null, businessName: string, contactFirstName: string, contactLastName: string, email: string, phone: string, productInterest: string, monthlyRevenueBand: string, timeInBusinessBand: string, useOfFunds: string, stage: string, secureUploadLink: string, consentSms: boolean, consentEmail: boolean, createdAt: ISODate, lastContactAt: ISODate, reviewStatus: string }

Rules:
- Never put full SSNs, account numbers, or document contents in this object. Store only a reference/link to the secure upload provider.
- reviewStatus is set by humans or by neutral system states (received, in_review, possible_fit, not_a_fit, funded) — never by an automation deciding eligibility.
- monthlyRevenueBand / timeInBusinessBand are banded ranges, not exact figures, to keep payloads low-sensitivity.

---

## 3. Pattern library

### Pattern 1 — Intake capture & normalization

Trigger: Form/Webhook (intake form submitted).
Nodes:
  Webhook (receive submission) →
  Set/Edit Fields (map raw fields → lead object shape; band revenue and time-in-business) →
  IF (consent flags present?) →
    true → continue
    false → Set (consentSms=false / consentEmail=false; restrict to email-with-unsubscribe only) →
  CRM (create lead record, stage = "received") →
  HTTP Request (generate secureUploadLink from upload provider) →
  CRM (update record with secureUploadLink) →
  Respond to Webhook (thank-you page redirect).
Output: a normalized lead in CRM at stage "received" with a secure upload link.
Notes: do the banding here so downstream payloads never carry exact financials. Validate email/phone format; on failure, branch to a human-review queue rather than silently dropping.

### Pattern 2 — New-lead acknowledgment (borrower)

Trigger: CRM update / webhook (stage = "received").
Nodes:
  Trigger →
  IF (consentEmail true?) → Email node (send Family A acknowledgment from borrower-follow-up-email-sms-templates.md) →
  IF (consentSms true?) → Wait (5 min) → SMS node (send Family A SMS, includes opt-out) →
  CRM (set lastContactAt).
Output: borrower receives a no-promises acknowledgment; expectations set.
Notes: pull copy from the templates file; tokens filled from the lead object. No amounts/terms — no human review needed for this acknowledgment.

### Pattern 3 — Lead routing / round-robin to brokers

Trigger: CRM update (stage = "received" and review not yet assigned).
Nodes:
  Trigger →
  Switch (route by productInterest OR territory OR partner) →
  Function/Code (round-robin selector across available brokers) →
  CRM (assign broker, stage = "in_review") →
  Notify node (Slack/email to assigned broker: "New lead ready for review") →
  CRM (set reviewStatus = "in_review").
Output: lead assigned to a broker with a notification.
Notes: assignment is operational only. The workflow does not assess the borrower — it just distributes work. Keep an "unassigned overflow" path if no broker is available.

### Pattern 4 — Document follow-up cadence

Trigger: Schedule Trigger (e.g., daily) OR stage = "docs_requested".
Nodes:
  Schedule Trigger →
  CRM/HTTP (query leads where stage = "docs_requested" and docs not received) →
  Loop / SplitInBatches →
    Switch (days since request) →
      day 1 → Email C1 + SMS C1 (secure link) →
      day 3 → SMS C2 nudge →
      day 6 → Email C3 →
      day 7+ no response → CRM (move to re-engagement) →
  CRM (set lastContactAt each touch).
Output: escalating, polite document reminders pointing only to the secure upload link.
Notes: never attach or request documents in the messages themselves. Honor STOP/unsubscribe by excluding opted-out contacts from the query.

### Pattern 5 — Secure document received → review handoff

Trigger: Webhook from secure upload provider (upload completed).
Nodes:
  Webhook (upload event: leadId + file reference only) →
  CRM (attach file reference, NOT contents; stage = "ready_for_review") →
  Notify node (alert assigned broker: "Documents in — ready for broker review") →
  Email node (optional borrower confirmation: "We received your documents — your file is ready for broker review").
Output: broker is notified; file flagged ready for human review.
Notes: the payload carries a reference/URL to the document in the secure provider, never the file bytes or extracted sensitive fields. This is a hard rule.

### Pattern 6 — Status reassurance during review

Trigger: Schedule Trigger (every 3–4 business days).
Nodes:
  Schedule Trigger →
  CRM (query leads stage = "in_review" or "ready_for_review", open > 3 days) →
  Loop →
    IF (consentEmail) → Email D1 (status/reassurance) →
  CRM (set lastContactAt).
Output: borrowers in review get periodic, outcome-free reassurance.
Notes: messaging never states findings, amounts, or timelines.

### Pattern 7 — Possible-fit → schedule the call

Trigger: CRM update by a human (reviewStatus = "possible_fit").
Nodes:
  Trigger →
  Human-review checkpoint (confirm a broker set possible_fit) →
  Email E1 + SMS E1 (scheduler link) →
  Wait (48h) →
  IF (no booking) → SMS nudge + create broker task "call attempt" →
  CRM (stage = "call_scheduled" when booking webhook fires).
Output: borrower invited to book a call; broker tasked if no booking.
Notes: only a human sets possible_fit. The automation reacts to that human decision; it never sets possible_fit itself. No amounts/terms in any message.

### Pattern 8 — Re-engagement & break-up

Trigger: Schedule Trigger OR stage = "gone_quiet".
Nodes:
  Trigger →
  CRM (query leads with no response across prior touches) →
  Loop →
    Switch (touch count) →
      F1 → Email/SMS re-engage →
      F2 (+3d) → SMS →
      F3 (+4d) → break-up email →
      after F3 → CRM (move to nurture) →
  CRM (set lastContactAt).
Output: structured win-back ending in a graceful pause + nurture.
Notes: respect opt-outs; cap total touches.

### Pattern 9 — Not-a-fit → graceful hold/nurture

Trigger: CRM update by a human (reviewStatus = "not_a_fit").
Nodes:
  Trigger →
  Human-review checkpoint →
  Email G1 (graceful hold; never the word "declined") →
  CRM (stage = "nurture"; set nurture cadence) →
  (optional) add to long-cycle newsletter list.
Output: borrower kept warm without a hard rejection; relationship preserved.
Notes: only a human sets not_a_fit. Reason codes (if logged) stay internal and are never exposed in borrower messaging.

### Pattern 10 — Funded → confirmation, payout trigger, referral ask

Trigger: CRM update by a human (reviewStatus = "funded").
Nodes:
  Trigger →
  Human-review checkpoint (confirm funded by a human/finance) →
  Email H1 + SMS H1 (congrats + referral ask) →
  IF (referringPartnerId present) →
    Email G1 to partner (referral funded) →
    HTTP/CRM (create commission record = pending) →
  CRM (stage = "funded"; set fundedAt).
Output: borrower thanked, referral loop opened, partner commission queued.
Notes: commission records are created as "pending" for finance to verify — the automation never pays out or states guaranteed amounts.

### Pattern 11 — Partner referral intake & attribution

Trigger: Webhook/Form (partner referral submitted, includes referringPartnerId).
Nodes:
  Webhook →
  Set/Edit Fields (normalize to lead object; carry referringPartnerId) →
  CRM (create lead, stage = "received", attribute partner) →
  Email E1 to partner (referral confirmation) →
  Trigger Pattern 2 (borrower acknowledgment).
Output: referred lead captured and credited to the partner from the moment of capture.
Notes: attribution persists through outcome (see referral-partner-workflow-templates.md). Validate the partner exists; if unknown, route to a human to resolve.

### Pattern 12 — Partner activation & dormancy monitoring

Trigger: Schedule Trigger (weekly).
Nodes:
  Schedule Trigger →
  CRM (query partners; compute days since last referral) →
  Switch (health band) →
    onboarded + 0 leads + 14d → Email D1 activation nudge →
    60–89d since last lead → at-risk task for broker →
    90d+ → Email H1 dormant re-engagement →
  CRM (update partner health flag).
Output: partners nudged at the right moments; health flags kept current.

### Pattern 13 — Reporting & daily digest

Trigger: Schedule Trigger (daily/weekly).
Nodes:
  Schedule Trigger →
  CRM/HTTP (pull counts by stage, new leads, in review, funded, partner activity) →
  Aggregate / Function (build summary metrics) →
  Format (compose digest text) →
  Email/Slack node (send digest to operator) →
  (optional) append a row to a reporting sheet (no sensitive fields).
Output: a daily/weekly operations snapshot.
Notes: digest contains counts and banded metrics only — no borrower PII beyond names where appropriate, and never document contents or exact sensitive financials.

### Pattern 14 — Error handling & dead-letter queue

Trigger: Error Trigger (any workflow failure).
Nodes:
  Error Trigger →
  Set (capture workflow name, node, error, leadId if present) →
  CRM/Sheet (write to a "failed_events" queue — references only) →
  Notify node (alert operator with a link to retry).
Output: failures are captured and surfaced for a human instead of lost.
Notes: never log sensitive payload contents in the error record — store identifiers/references only.

---

## 4. Cross-cutting design rules

- Human-in-the-loop gates: possible_fit, not_a_fit, and funded are set by humans. Automations react to those states; they never set them.
- Consent & opt-out: every messaging branch checks consentEmail / consentSms and excludes anyone who replied STOP or unsubscribed. New SMS sequences include an opt-out line; emails include an unsubscribe link.
- Sensitive data minimization: payloads carry banded financials and document references — never raw documents, full SSNs, or account numbers. Secure upload provider is the only document path.
- Idempotency: use leadId (and event IDs) as keys so retries don't double-send or double-create. Add a "lastMessageType + timestamp" guard before sends.
- Rate & cadence limits: enforce minimum gaps between touches; cap total automated touches per lead and per partner.
- Time-zone awareness: schedule borrower/partner messages for reasonable local hours.
- Logging: log message type, timestamp, and outcome per contact for compliance — without logging message bodies that contain sensitive data.
- Compliance language enforcement: a shared Set/Function "copy guard" should reject any outbound text containing approved, qualified, eligible, guaranteed, pre-approved, or declined and route it to human review.

---

## 5. Reusable sub-workflows (call from multiple patterns)

- Sub: SendBorrowerMessage(leadId, templateId) → checks consent → fills tokens from lead object → runs copy guard → sends via correct channel → updates lastContactAt.
- Sub: SendPartnerMessage(partnerId, templateId) → same pattern for partner-facing copy.
- Sub: GenerateSecureUploadLink(leadId) → calls upload provider → returns link → never returns file contents.
- Sub: CopyGuard(text) → returns pass/fail + reason; fail routes to human review.
- Sub: AttributePartner(leadObject) → resolves referringPartnerId, persists attribution.

Designing patterns to call these sub-workflows keeps compliance and consent logic in one place.

---

## 6. Example end-to-end assembly (inline)

Referral lead → funded, fully automated except human decision points:

Pattern 11 (partner intake + attribution) →
Pattern 2 (borrower acknowledgment) →
Pattern 3 (route to broker) →
[human reviews] →
Pattern 4 (doc follow-up) ↔ Pattern 5 (secure docs received) →
Pattern 6 (status reassurance while open) →
[human sets possible_fit] → Pattern 7 (schedule call) →
[human sets funded] → Pattern 10 (funded + partner payout queued) →
Pattern 13 (reporting reflects the funded deal).

Every arrow is data/eventing; every [human ...] is a required review gate.

---

## 7. GPT behavior instructions for this file

When asked to design, explain, or troubleshoot an n8n workflow for the brokerage, the GPT should:
1. Identify the workflow's trigger and goal, then select the closest pattern(s) above as a starting point.
2. Express the design as Trigger → Nodes → Output with inline (fence-free) JSON for payloads.
3. Insert human-review gates wherever a borrower outcome (possible_fit, not_a_fit, funded) or a money/terms message is involved.
4. Apply the cross-cutting rules: consent checks, opt-outs, sensitive-data minimization, idempotency, copy guard.
5. Reference the matching message families in borrower-follow-up-email-sms-templates.md and referral-partner-workflow-templates.md rather than inventing new copy.
6. Keep all borrower-outcome language compliant: possible fit / ready for broker review / preliminary / human review required.
7. Recommend an error-handling path (Pattern 14) for any production workflow.

Default output format: a short purpose line, the Trigger → Nodes → Output map, an inline sample payload, and a one-line note on the human-review gate(s) involved.

Example output (mini):
Purpose: Confirm a partner referral and credit the partner.
Map: Webhook → Set (normalize + carry referringPartnerId) → CRM (create lead, attribute) → Email (partner confirmation) → trigger borrower acknowledgment.
Sample payload: { leadId: "L-1042", source: "partner", referringPartnerId: "P-7", businessName: "Bright Path Cafe", stage: "received" }
Human-review gate: none for capture; possible_fit/funded gates apply later downstream.

---

## 8. Final rule

Automations organize, route, and remind — they never approve, qualify, or decide funding, and they never carry sensitive documents. Keep humans on every outcome decision, keep consent and opt-outs enforced, keep sensitive data referenced (not stored), and run every outbound message through the copy guard. When in doubt, add a human-review gate.