# Templates

This folder holds the **reusable templates** for the Loan Broker Automation Architect GPT (BrokerFlow AI) — the message scripts, record layouts, and document formats that the GPT and your team use over and over. Templates keep communication consistent, compliant, and fast.

Where `/actions` and `/workflows` move data and `/sops` tell people what to do, `/templates` provide the exact **wording and structure** for borrower messages, partner updates, internal notes, and CRM records — all pre-written with safe, possible-fit language.

---

## 📌 Why Templates Matter

Templates are how you keep the system **on-brand and compliant** at scale:

- The GPT triggers sequences; the **templates** are what actually gets sent.
- Pre-approved wording means **no improvised approval language** ever reaches a borrower.
- Consistent record layouts make automation and review reliable.

Every borrower-facing template uses **possible-fit language** — never "approved," "guaranteed," "qualified," or "eligible."

---

## 🗂️ Suggested Files

    templates/
    ├── README.md                          ← you are here
    ├── template-borrower-messages.md       ← intake, reminders, follow-ups
    ├── template-document-requests.md       ← missing-doc and upload-link messages
    ├── template-referral-partner-messages.md ← partner updates and recaps
    ├── template-internal-notes.md          ← broker alerts, review-task notes
    ├── template-crm-record.md              ← standard lead/deal record layout
    ├── template-conversation-summary.md    ← GPT-to-CRM summary format
    └── template-status-updates.md          ← stage-change and digest messages

---

## 🧩 Template Categories

| Category | Used By | Audience | Safe Language Required |
|----------|---------|----------|------------------------|
| Borrower messages | Follow-up workflows | Borrower | ✅ Yes |
| Document requests | Document workflow | Borrower | ✅ Yes |
| Partner messages | Referral workflow | Partner | ✅ Yes |
| Internal notes | Alert workflow | Team | Internal only |
| CRM record layout | Intake workflow | System | N/A |
| Conversation summary | Log workflow | System/Team | Internal only |
| Status updates | Pipeline workflow | Team / Borrower | ✅ if borrower-facing |

---

## ✉️ Example: Borrower Intake Confirmation

A safe, possible-fit confirmation message:

    Hi first_name,

    Thanks for sharing the details about business_name. I've passed your
    information to our funding team for review. A specialist will follow up to
    go over potential options that may fit your situation.

    To keep things moving, you may be asked for a few documents (like recent
    business bank statements). No decisions have been made yet — this is just
    the next step in reviewing a possible fit.

    Talk soon,
    broker_name

Note: no promises, no terms, no approval language — just next steps.

---

## 📄 Example: Missing Document Request

    Hi first_name,

    To continue reviewing options for business_name, we still need:

    - document_1
    - document_2

    You can upload them securely here: secure_upload_link

    Once we have these, your file can move to broker review. Reply here if you
    have any questions.

---

## 🗂️ Example: CRM Record Layout

A consistent shape for every lead/deal record:

    Borrower:        first_name last_name
    Business:        legal_business_name
    Contact:         email / phone (prefers preferred_contact_method)
    Industry:        industry  |  State: state
    Revenue (mo):    monthly_revenue
    Time in business:time_in_business_months months
    Product:         product_type
    Amount requested:funding_amount_requested
    Use of funds:    use_of_funds
    Stage:           pipeline_stage
    Documents:       document_status_summary
    Human review:    human_review_required
    Source:          lead_source
    Next step:       next_step

---

## 📝 Example: Conversation Summary (GPT → CRM)

    Summary: one_paragraph_summary
    Borrower: borrower_name
    Stage: pipeline_stage
    Documents outstanding: missing_documents
    Flags: human_review_required
    Next step: next_step
    Logged at: timestamp

---

## 🔧 Template Conventions

- Use `double_brace` placeholders so workflows can fill fields automatically.
- Match placeholder names to your CRM and intake field names.
- Keep borrower-facing templates in **possible-fit language** only.
- Separate **internal** templates (team notes) from **external** ones (borrower/partner).
- Honor contact preferences and opt-outs in every message template.
- Keep raw sensitive data out of templates — reference secure links and IDs.

---

## 🛡️ Template Guardrails

- **No approval, guarantee, qualification, or eligibility language** in borrower messages.
- **No terms or rates** in any template that sends without human review.
- **Use secure links**, never attached documents, for uploads.
- **Internal templates stay internal** — never forward team notes to borrowers.
- **Every borrower template** should make clear that next steps ≠ a decision.

The full safety contract in `../actions/no-auth/actions-no-auth-risk-guardrails.md` applies to all templates.

---

## 🔗 Related

- Sequences that send these → `../workflows/README.md`
- Who sends what, and when → `../sops/README.md`
- Actions that trigger messages → `../actions/README.md`

---

*Part of the BrokerFlow AI repository — the operating library behind the Loan Broker Automation Architect GPT.*