# SOPs

This folder holds the **Standard Operating Procedures** for running the Loan Broker Automation Architect GPT (BrokerFlow AI). An SOP is a step-by-step playbook a human follows to operate the system safely and consistently — onboarding a borrower, reviewing a file, handling documents, submitting to a lender, and responding when something breaks.

Where `/actions` and `/workflows` define what the *system* does automatically, `/sops` defines what *people* do — especially at the human-review gates that the automation deliberately routes to.

---

## 📌 Why SOPs Matter Here

The GPT and its workflows are designed to **never** make funding decisions. That only works if the humans on the other side know exactly what to do when a file lands on their desk. SOPs close the loop:

- The automation captures, routes, and flags.
- The SOP tells a person how to review, decide, and act.

Clear SOPs are what keep the system fast *and* compliant.

---

## 🗂️ Suggested Files

    sops/
    ├── README.md                       ← you are here
    ├── sop-borrower-onboarding.md       ← first contact → intake → CRM
    ├── sop-document-collection.md       ← request, track, verify documents
    ├── sop-broker-file-review.md        ← the core human-review gate
    ├── sop-lender-submission.md         ← confirm, package, submit (human-led)
    ├── sop-followup-cadence.md          ← who follows up, when, and how
    ├── sop-renewal-and-repeat.md        ← post-funding renewals and referrals
    ├── sop-compliance-and-privacy.md    ← handling sensitive data correctly
    └── sop-incident-response.md         ← what to do when automation breaks

---

## 🧩 Core SOPs at a Glance

| SOP | Owner | Trigger | Key Output |
|-----|-------|---------|------------|
| Borrower Onboarding | Intake / Setter | New lead | Clean CRM record |
| Document Collection | Processor | `docs_missing` | Complete document set |
| Broker File Review | Broker | `ready_for_broker_review` | Go / no-go decision |
| Lender Submission | Broker | `lender_submission_pending_review` | Submitted package |
| Follow-Up Cadence | Setter / Processor | `borrower_follow_up_needed` | Re-engaged borrower |
| Renewal & Repeat | Broker | `renewal_follow_up` | Renewal opportunity |
| Compliance & Privacy | All | Any sensitive data | Safe handling |
| Incident Response | Ops / Admin | System failure | Restored service |

---

## 📝 SOP Template

Use this structure for every SOP file so they stay consistent:

    # SOP: <Name>

    ## Purpose
    What this procedure accomplishes and why it matters.

    ## Owner
    Role responsible for executing it.

    ## Trigger
    What starts this SOP (a pipeline stage, an alert, a schedule).

    ## Prerequisites
    What must be true/available before starting.

    ## Steps
    1. Step one
    2. Step two
    3. ...

    ## Human-Review Gates
    Decision points that require a person.

    ## Guardrails
    What must never happen in this procedure.

    ## Definition of Done
    How you know the procedure is complete.

---

## 🔄 Reference SOP: Broker File Review (Summary)

The most important human gate in the system:

1. Open the file flagged `ready_for_broker_review`.
2. Confirm intake data is complete and consistent.
3. Verify required documents are present and legible.
4. Assess fit against lender criteria (human judgment, not the GPT's).
5. Decide: request more info, prepare for submission, or decline.
6. If proceeding, move to `lender_submission_pending_review` and follow the submission SOP.
7. If declining, use compliant, respectful language and log the reason.
8. Record the decision and next step in the CRM.

The GPT may have prepared a "possible lender match" — the broker confirms or overrides it. The GPT never decides.

---

## 🛡️ SOP Guardrails

- **Humans decide funding outcomes** — always, at every gate.
- **No approvals, declines, or terms** go out without a human.
- **Verify before submission** — documents complete, data consistent.
- **Use compliant language** in all borrower communications.
- **Protect sensitive data** per the privacy SOP at every step.
- **Log decisions** for traceability and compliance.

The full safety contract in `../actions/no-auth/actions-no-auth-risk-guardrails.md` underpins every SOP.

---

## 🔗 Related

- What the GPT can send → `../actions/README.md`
- What runs automatically → `../workflows/README.md`
- Reusable messages/records → `../templates/README.md`

---

*Part of the BrokerFlow AI repository — the operating library behind the Loan Broker Automation Architect GPT.*