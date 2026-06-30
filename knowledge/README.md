# Knowledge

This folder holds the **knowledge files** for the Loan Broker Automation Architect GPT (BrokerFlow AI) — the reference documents the GPT reads to understand your funding products, processes, data structures, and guardrails. These files are uploaded into the Custom GPT's "Knowledge" section so the assistant can answer accurately and stay on-policy without you re-explaining context in every chat.

Where `/actions` and `/workflows` define what the system *does*, `/knowledge` defines what the GPT *knows*: the funding products, deal stages, document types, terminology, and the safety rules it must follow.

---

## 📌 What Knowledge Files Are For

The GPT uses knowledge files to:

- Understand your **funding products** and which situations they may fit
- Speak your **terminology** (deal stages, document types, funnel steps)
- Follow your **process** (intake → documents → broker review → submission)
- Apply your **guardrails** (never approve, decline, guarantee, or underwrite)
- Generate accurate **checklists, summaries, and drafts**

Knowledge files are **reference material**, not instructions to execute. The GPT's behavior is governed by its instructions; knowledge files inform its answers.

---

## 🗂️ Suggested Files

    knowledge/
    ├── README.md                              ← you are here
    ├── knowledge-company-overview.md           ← brand, mission, who you serve
    ├── knowledge-funding-products.md           ← products and possible-fit scenarios
    ├── knowledge-funding-lanes.md              ← how products map to borrower types
    ├── knowledge-deal-stages.md                ← pipeline stages and definitions
    ├── knowledge-document-types.md             ← document types and when needed
    ├── knowledge-data-dictionary.md            ← field names, formats, enums
    ├── knowledge-borrower-personas.md          ← who the borrowers are
    ├── knowledge-funnel-and-process.md         ← intake-to-funding journey
    ├── knowledge-glossary.md                   ← industry and internal terms
    ├── knowledge-compliance-and-language.md    ← safe language and disclaimers
    ├── knowledge-faqs.md                        ← common borrower/partner questions
    └── knowledge-guardrails.md                 ← the safety contract, restated

---

## 🧩 Core Knowledge Files

| File | What It Teaches the GPT | Priority |
|------|-------------------------|----------|
| Company Overview | Brand, mission, audience | High |
| Funding Products | What you offer, possible-fit use | High |
| Deal Stages | Pipeline vocabulary and gates | High |
| Document Types | What to request and when | High |
| Data Dictionary | Exact field names and formats | High |
| Compliance & Language | Safe, possible-fit wording | Critical |
| Guardrails | What the GPT must never do | Critical |
| Glossary | Shared terminology | Medium |
| FAQs | Fast, consistent answers | Medium |
| Borrower Personas | Tailoring tone and questions | Medium |

---

## 🚦 Reference: Deal Stages

The canonical pipeline vocabulary the GPT should use:

    new_lead
    contacted
    application_sent
    application_received
    docs_missing
    ready_for_broker_review
    lender_submission_pending_review
    submitted_to_lender
    lender_response_received
    borrower_follow_up_needed
    funded
    not_moving_forward
    renewal_follow_up
    stale
    closed

The review gates `ready_for_broker_review` and `lender_submission_pending_review` always precede `submitted_to_lender`.

---

## 📄 Reference: Document Types

The standard document type vocabulary:

    bank_statements
    business_tax_return
    personal_tax_return
    driver_license
    voided_check
    debt_schedule
    profit_and_loss
    balance_sheet
    application
    other

The GPT references these by type; it never handles raw document contents.

---

## 📝 Knowledge File Template

Use this structure for every knowledge file so the GPT can parse it consistently:

    # Knowledge: <Topic>

    ## Summary
    One-paragraph plain-English overview.

    ## Key Facts
    - Bullet the essential, stable facts.

    ## Vocabulary
    Exact terms, stages, or enums the GPT must use verbatim.

    ## How the GPT Should Use This
    Guidance on when and how to apply this knowledge.

    ## What NOT to Do
    Restate relevant guardrails for this topic.

    ## Last Reviewed
    YYYY-MM-DD — owner

---

## ✅ Conventions for This Repo

- Keep each file **focused on one topic** for clean retrieval.
- Use **exact enum values** (stages, document types) so outputs match your systems.
- Keep facts **stable and current** — stale knowledge produces wrong answers.
- Restate **possible-fit language** rules in any borrower-facing topic.
- Keep **sensitive data out** — knowledge files are reference, not records.
- Add a **Last Reviewed** date so you know when to refresh.

---

## 🛡️ Knowledge Guardrails

The GPT may use these files to inform answers, but must still **never**:

- Approve, decline, qualify, or guarantee a borrower
- State terms or rates as if they are offers
- Treat product "possible fit" as eligibility or approval
- Present internal triage signals to borrowers as decisions

The full safety contract in `../actions/no-auth/actions-no-auth-risk-guardrails.md` applies to everything the GPT says.

---

## 🔗 Related

- What the GPT can send → `../actions/README.md`
- What runs automatically → `../workflows/README.md`
- How humans operate it → `../sops/README.md`
- Reusable wording → `../templates/README.md`

---

*Part of the BrokerFlow AI repository — the operating library behind the Loan Broker Automation Architect GPT.*