# No-Auth Actions

This folder covers Custom GPT Actions that require **no authentication**. These are the easiest Actions to build and test, and they are the recommended starting point for the Loan Broker Automation Architect GPT.

No-auth Actions are best for **write-only, low-sensitivity events** that you send to public webhooks you control — intake, alerts, document requests, follow-up triggers, calculators, and logging.

---

## 📌 Golden Rule for No-Auth

> No-auth endpoints should only **receive** data and trigger low-risk workflows. They must never approve, decline, submit, underwrite, or expose sensitive borrower information.

If an endpoint needs to read private records, write to a CRM, or touch a funding decision, move it to API Key or OAuth and add human review.

---

## 🗂️ Files in This Folder

    no-auth/
    ├── README.md                              ← you are here
    ├── actions-no-auth-overview.md            ← when to use no-auth (and when not to)
    ├── actions-no-auth-webhook-patterns.md    ← reusable webhook request/response patterns
    ├── actions-no-auth-borrower-intake-actions.md  ← capture leads and intake data
    ├── actions-no-auth-document-actions.md    ← checklists and missing-doc requests
    ├── actions-no-auth-internal-alert-actions.md   ← broker/team notifications and tasks
    ├── actions-no-auth-followup-actions.md    ← borrower, referral, renewal follow-ups
    ├── actions-no-auth-calculator-actions.md  ← ROI and time-saved calculators
    ├── actions-no-auth-schema-examples.md     ← copy-paste OpenAPI snippets
    ├── actions-no-auth-testing-checklist.md   ← test before going live
    └── actions-no-auth-risk-guardrails.md     ← what must never be exposed no-auth

---

## 🚦 Recommended Build Order

Start with the highest-utility, lowest-risk Actions:

1. **Submit Borrower Intake to Webhook** — turns the GPT into a front-end intake assistant
2. **Create Manual Review Task** — keeps funding decisions human-reviewed
3. **Create Missing Document Request** — big time saver, low risk
4. **Send Internal Broker Alert** — simple and easy to test
5. **Log Conversation Summary** — saves GPT output to your CRM/Sheets/Notion
6. **Submit Referral Partner Lead** — great for partner-driven deal flow
7. **Submit Renewal Reminder Request** — clear ROI
8. **Generate Automation Blueprint Request** — stores workflow designs

---

## 🧩 Strong No-Auth Action Categories

| Category | Example Actions | Best For |
|----------|-----------------|----------|
| Intake Capture | Submit borrower intake, referral lead | Capturing structured data from the GPT |
| Internal Notifications | Broker alert, processor task, review request | Keeping humans in the loop |
| Document Collection | Missing-doc request, checklist generation | Reducing admin follow-up |
| Follow-Up Requests | Borrower follow-up, partner update, renewal | Starting communication workflows |
| Logging | Conversation summary, blueprint, SOP request | Saving GPT output outside chat |
| Calculators | Time savings, task volume, automation ROI | Simple utility without sensitive auth |
| Status Updates | Deal update draft, funded notification | Keeping teams aligned |
| Review Routing | Lender match review, manual approval task | Avoiding automated funding decisions |

---

## 🔌 Standard Endpoint Pattern

Most no-auth Actions post to a simple public webhook:

    POST /webhook/borrower-intake
    POST /webhook/create-review-task
    POST /webhook/missing-doc-request
    POST /webhook/referral-lead
    POST /webhook/log-summary
    POST /webhook/renewal-reminder

Minimum viable request body:

    {
      "source": "custom_gpt",
      "action_type": "borrower_intake",
      "borrower_name": "",
      "business_name": "",
      "email": "",
      "phone": "",
      "notes": "",
      "human_review_required": true
    }

---

## 🛡️ Quick Guardrails

- Do **not** expose actions that delete, approve, decline, or submit deals to lenders.
- Use no-auth mainly for intake, logging, notifications, and review requests.
- Add a shared-secret field in the body to reduce random webhook abuse.
- Keep sensitive document uploads out of no-auth actions — use secure tools with human-controlled access.
- Always route funding-related decisions to human review.

Full detail: `actions-no-auth-risk-guardrails.md`.

---

## 🔗 Related

- Choosing an auth type → `../actions-authentication-decision-guide.md`
- Schema templates → `../../schemas/README.md`
- Workflows these trigger → `../../workflows/README.md`

---

*Part of the BrokerFlow AI repository — the operating library behind the Loan Broker Automation Architect GPT.*