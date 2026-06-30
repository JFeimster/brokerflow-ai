# Actions

This folder documents every **Custom GPT Action** used by the **Loan Broker Automation Architect GPT** (BrokerFlow AI). Actions are how the GPT sends or retrieves data from outside systems — webhooks, CRMs, document tools, calendars, lender portals, and automation platforms like n8n, Zapier, and Make.

Files here are organized **by authentication type**, because the way you configure an Action inside the GPT Builder changes depending on whether the endpoint requires no auth, an API key, or OAuth.

---

## 📌 Core Principle

Every Action in this library follows one rule:

> **The GPT can recommend, draft, prepare, route, and log — but it should never approve, decline, guarantee, underwrite, or fund a borrower.**

Any Action that touches a funding decision must route to a **human review** step. See `no-auth/actions-no-auth-risk-guardrails.md` and the guardrails referenced in each subfolder.

---

## 🗂️ Folder Structure

    actions/
    ├── README.md                              ← you are here
    ├── actions-authentication-decision-guide.md
    │
    ├── no-auth/                               ← public endpoints, no credentials
    │   ├── README.md
    │   ├── actions-no-auth-overview.md
    │   ├── actions-no-auth-webhook-patterns.md
    │   ├── actions-no-auth-borrower-intake-actions.md
    │   ├── actions-no-auth-document-actions.md
    │   ├── actions-no-auth-internal-alert-actions.md
    │   ├── actions-no-auth-followup-actions.md
    │   ├── actions-no-auth-calculator-actions.md
    │   ├── actions-no-auth-schema-examples.md
    │   ├── actions-no-auth-testing-checklist.md
    │   └── actions-no-auth-risk-guardrails.md
    │
    ├── api-key/                               ← Basic / Bearer / Custom header auth
    │   └── README.md
    │
    └── oauth/                                 ← user-authorized access (Google, HubSpot, etc.)
        └── README.md

---

## 🔐 Authentication Types at a Glance

| Type | When to Use | Difficulty | Example Use Cases |
|------|-------------|------------|-------------------|
| **None (No Auth)** | Public webhooks and low-risk events you control | Easy | Borrower intake, document reminders, internal alerts, ROI calculators |
| **API Key** | A single trusted backend the GPT calls on behalf of your office | Medium | CRM create/update, Airtable, GoHighLevel, internal APIs |
| **OAuth** | Each user authorizes access to *their own* account | Advanced | Google Drive, HubSpot, QuickBooks, Calendar |

➡️ Not sure which to pick? Start with **`actions-authentication-decision-guide.md`**.

---

## 🚦 Recommended Build Order

Build Actions in this order so you can test the easiest, lowest-risk endpoints first:

1. **No-Auth webhooks** → intake, alerts, document requests, logging
2. **API Key (Bearer)** → CRM and pipeline updates
3. **API Key (Custom Header)** → tools like Airtable
4. **OAuth** → user-specific accounts (Calendar, Drive, accounting)

Start simple. Do not connect the GPT directly to every vendor. Wrap your CRM, document storage, lender rules, and compliance log behind **one backend API** and expose only safe, high-level Actions.

---

## 📄 What Each Action Doc Contains

Every Action file uses a consistent template:

- **Action name** (exactly as it appears in GPT Builder)
- **Auth type** (None / API Key Basic / Bearer / Custom / OAuth)
- **Endpoint + HTTP method**
- **Required inputs** and **optional inputs**
- **Output / result shape**
- **Human review required?** (Yes / No / Optional)
- **Notes, limits, and guardrails**
- Minimal example request and response

---

## ✅ Before You Ship Any Action

- [ ] Confirm the correct authentication type (see decision guide)
- [ ] Confirm the endpoint never auto-approves or auto-declines a borrower
- [ ] Add a human-review flag where funding decisions are involved
- [ ] Keep raw sensitive documents out of payloads (use secure links/metadata)
- [ ] Run the action through `no-auth/actions-no-auth-testing-checklist.md`
- [ ] Store the matching OpenAPI schema in `/schemas`

---

## 🔗 Related Folders

- `../schemas/` — reusable OpenAPI schema templates for each auth type
- `../workflows/` — n8n, Zapier, and Make workflows these Actions trigger
- `../sops/` — standard operating procedures for running the automations
- `../knowledge/` — GPT knowledge files referenced by the assistant

---

*Part of the BrokerFlow AI repository — the operating library behind the Loan Broker Automation Architect GPT.*