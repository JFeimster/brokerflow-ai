# funding-agency-operations-playbook.md

> Knowledge file for the Loan Broker Automation Architect GPT (Moonshine Capital / Distilled Funding).
> Purpose: tie the whole knowledge base together into one operating playbook — how the funding agency runs end to end, how the other nine files fit, the metrics that matter, and the rhythms that keep it healthy and compliant as it scales.
> Safety baseline (inherited from compliance-human-review-guardrails.md): never use approved, qualified, eligible, guaranteed, pre-approved, or declined. Use possible fit, ready for broker review, preliminary, and human review required. Sensitive documents move only through the secure upload provider. Humans own every funding outcome. This file does not override the guardrails file — that file always wins.

---

## 1. What this agency does

Moonshine Capital / Distilled Funding is a business-funding brokerage: it helps business owners explore possible funding paths and connects them with third-party lenders. It is not a direct lender. Value comes from (1) reaching owners who need capital, (2) running a fast, honest, well-organized process, and (3) keeping borrowers and partners informed without overpromising.

The operating thesis: automation handles the routine at scale; brokers spend their human time on judgment, relationships, and outcomes.

---

## 2. The knowledge base map (how the 10 files work together)

1. broker-intake-workflow-examples.md — how leads come in and what good intake looks like.
2. loan-document-checklist-templates.md — what documents are needed per path, requested safely.
3. crm-pipeline-stage-definitions.md — the shared stage language every system uses.
4. lender-matching-rules-framework.md — how brokers identify possible fits (preliminary only).
5. borrower-follow-up-email-sms-templates.md — compliant borrower messaging by stage.
6. referral-partner-workflow-templates.md — recruiting, onboarding, and managing partners.
7. n8n-workflow-pattern-library.md — the automation patterns that move it all.
8. broker-automation-sops.md — who does what, in what order, with human gates.
9. compliance-human-review-guardrails.md — the master safety rules everything inherits.
10. funding-agency-operations-playbook.md — this file: the operating system that connects them.

Dependency flow: intake (1) → stages (3) → documents (2) → matching (4) → messaging (5/6) → all powered by workflows (7), governed by SOPs (8) and guardrails (9), orchestrated by this playbook (10).

---

## 3. The end-to-end operating flow (one picture, inline)

Acquire lead (marketing, referral partner, inbound) →
Capture & normalize intake (file 1, Pattern 1) →
Stage = received; acknowledge borrower (file 5 Family A) →
Route to broker (SOP-02, Pattern 3); stage = in_review →
Broker preliminary review (file 4, SOP-03) →
  need docs? → request via secure link (file 2, Pattern 4/5) →
  status reassurance while open (file 5 Family D, Pattern 6) →
Human sets outcome →
  possible_fit → schedule call (file 5 Family E, Pattern 7) → live conversation →
  not_a_fit → graceful hold + nurture (file 5 Family G, Pattern 9) →
  funded → closeout + referral ask + partner payout queued (file 5 Family H, Pattern 10, SOP-08) →
Report & review (Pattern 13, SOP-12) →
Improve (SOP-13) and repeat.

Every outcome arrow passes through a human gate; every message passes the copy guard.

---

## 4. Operating cadence (the rhythm)

Daily:
- Automated digest reviewed: new leads, in review, possible fits, funded, errors.
- Brokers clear their review queues; respond to booked calls.
- Ops chases outstanding documents and confirms uploads.
- Copy-guard rejections and error-queue items triaged.

Weekly (SOP-12):
- Pipeline health: stuck leads, aging by stage, conversion by stage.
- Partner health: active/at-risk/dormant; activation nudges.
- Compliance spot-check: sample messages, consent/opt-out integrity.
- Funded recap and commission status with Finance.

Monthly:
- Source/channel ROI: which lead sources and partners produce funded deals.
- Matching quality: possible-fit → funded conversion; refine file 4 heuristics.
- Template performance: response rates by family; refine file 5/6 copy.
- Automation review: failures, bottlenecks, proposed changes (SOP-13).

Quarterly:
- Compliance review with counsel: language, consent, disclosures, data handling.
- Partner program review: terms, top partners, offboarding.
- Strategy: product mix, capacity, hiring, tooling.

---

## 5. Metrics that matter

Volume & flow:
- New leads (by source/partner)
- Leads in review; average time in each stage
- Possible-fit rate (possible_fit ÷ reviewed)
- Funded rate (funded ÷ possible_fit) and overall (funded ÷ leads)
- Time-to-first-contact and time-to-funded

Quality & health:
- Document completion rate; time-to-documents
- Response rate by message family
- Stuck/aging leads count
- Re-engagement recovery rate

Partner program:
- Active/at-risk/dormant partner counts
- Referrals per active partner; partner funded rate
- Commission pending/paid

Compliance & ops:
- Copy-guard rejections (count, top reasons)
- Opt-out/unsubscribe rates
- Error-queue volume and resolution time
- Incidents (target: zero; track and learn)

Targets are set by the Operator; the point is to watch trends and act, not to chase vanity numbers. Keep all metrics in banded/aggregate form where they could expose sensitive data.

---

## 6. Roles & ownership (at a glance)

- Operator/Owner: strategy, compliance oversight, reporting, change management, counsel relationship.
- Broker/Advisor: preliminary review, outcomes, borrower conversations, relationships.
- Ops/Coordinator: CRM hygiene, scheduling, documents, partner support, attribution.
- Finance: funded verification, commissions, payouts.
- Automation: capture, routing, reminders, confirmations, attribution, reporting — never decisions.

See SOP RACI (file 8, section 5) for accountability detail.

---

## 7. Scaling guidance

Stage 1 — Solo/small (1–2 brokers):
- Prioritize intake (Pattern 1), borrower acknowledgment (Pattern 2), document follow-up (Pattern 4/5), and reporting (Pattern 13).
- Keep matching and outcomes fully manual; lean on templates for speed.

Stage 2 — Growing team (3–8):
- Add routing/round-robin (Pattern 3), status reassurance (Pattern 6), re-engagement (Pattern 8), and the partner program (file 6, Patterns 11/12).
- Formalize SOPs (file 8) and the copy guard (file 9, SOP-11).

Stage 3 — Scaled agency:
- Mature reporting/dashboards, partner tiers, capacity-based routing, and rigorous change management (SOP-13).
- Invest in compliance automation, audit trails, and quarterly counsel reviews.

Scaling rule: never scale a step that still needs a human judgment. Automate the routine around the judgment, not the judgment itself.

---

## 8. Common failure modes & how this system prevents them

- Overpromising outcomes → prevented by the language rules + copy guard (file 9).
- Sensitive data leaks → prevented by secure-upload-only + data minimization (file 9, section 5).
- Leads going cold → prevented by stage-based cadences (file 5, Patterns 4/6/8).
- Lost partner credit → prevented by attribution at capture (file 6, Pattern 11).
- Automation making decisions → prevented by human-review gates (file 8/9).
- Silent automation failures → prevented by error handling + dead-letter queue (Pattern 14, SOP-14).
- Process drift as you grow → prevented by SOPs + change management (file 8, SOP-13).

---

## 9. Quick-start checklist (standing up the system)

1. Define pipeline stages in the CRM (file 3).
2. Build the intake form + normalization (file 1, Pattern 1) with consent capture and secure-link generation.
3. Load borrower and partner templates (files 5/6) and wire the copy guard (file 9).
4. Stand up core automations: acknowledgment, routing, document follow-up, status, re-engagement, reporting, error handling (file 7).
5. Document the SOPs and human-review gates (file 8).
6. Brief everyone on the guardrails (file 9) and standing disclaimers.
7. Launch the partner program with agreements, links, and tracking (file 6).
8. Set the operating cadence (section 4) and the metric dashboard (section 5).
9. Review with counsel before scaling outbound messaging.
10. Iterate via monthly automation review and quarterly compliance review.

---

## 10. GPT behavior instructions for this file

When asked how the agency should operate, how the pieces fit, or what to build/measure next, the GPT should:
1. Anchor answers in the end-to-end flow (section 3) and point to the specific file/pattern/SOP that applies.
2. Keep all outcome language preliminary and human-review framed; run the self-check from file 9.
3. Recommend automation only for routine steps; keep judgment and outcomes with humans.
4. Tie recommendations to the metrics (section 5) and the operating cadence (section 4).
5. Match guidance to the agency's scale stage (section 7).
6. Reinforce data minimization, consent, and the copy guard in any operational design.
7. Defer legal/regulatory specifics to counsel and add disclaimers where outputs could read as offers.

Default output format: a short answer, the relevant flow/file/pattern reference, and a one-line note on the human-review gate or compliance consideration involved.

Example output (mini):
Question: How do we cut time-to-funded?
Answer: Tighten the front of the flow — faster routing (Pattern 3), same-day document requests (Pattern 4), and status reassurance (Pattern 6) to prevent stalls; measure time-in-stage (section 5) to find the bottleneck.
Reference: files 7/8, SOP-02/04/05.
Note: keep outcomes human-gated; don't automate possible_fit to "save time."

---

## 11. Final rule

This playbook is the operating system; the guardrails file is the constitution. Run the routine with automation, keep humans on every funding outcome, protect sensitive data, honor consent, and improve on a steady cadence. The agency connects borrowers with possible funding sources — it never approves, qualifies, or guarantees funding. When in doubt, slow down, route to a human, and consult counsel.