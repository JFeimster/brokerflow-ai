# BrokerFlow AI

**The operating library and landing experience behind the Loan Broker Automation Architect GPT.**

BrokerFlow AI is a structured repository plus a lightweight web front-end (deployed on Vercel at `brokerflow-ai.vercel.app`) that powers a Custom GPT for small-business loan brokers. It captures borrower intake, routes documents, fires internal alerts, and keeps every funding decision in human hands.

---

## 🎯 What This Is

This repo serves two purposes:

1. **An operating library** — actions, schemas, workflows, SOPs, templates, and knowledge files that define how the Loan Broker Automation Architect GPT behaves and integrates with your tools.
2. **A web front-end** — a simple landing page (`index.html`, `styles.css`, `script.js`) that introduces the GPT, explains what it does, and links users to it.

---

## 🧭 Core Principle

> The GPT can **recommend, draft, prepare, route, and log** — but it must **never approve, decline, qualify, guarantee, underwrite, or fund** a borrower.

Every funding decision routes to a human review step. This rule governs the entire repo.

---

## 🗂️ Complete Repository Structure

    brokerflow-ai/
    │
    ├── README.md                                    ← you are here
    ├── agents.md                                    ← GPT instructions / agent definition (Markdown)
    ├── agents.html                                  ← human-readable agent overview (web)
    ├── package.json                                 ← project metadata and scripts
    ├── index.html                                   ← landing page
    ├── styles.css                                   ← landing page styles
    ├── script.js                                    ← landing page interactivity
    │
    ├── actions/                                     ← Custom GPT Actions, organized by auth type
    │   ├── README.md
    │   ├── actions-authentication-decision-guide.md
    │   │
    │   ├── no-auth/                                 ← public endpoints, no credentials
    │   │   ├── README.md
    │   │   ├── actions-no-auth-overview.md
    │   │   ├── actions-no-auth-webhook-patterns.md
    │   │   ├── actions-no-auth-borrower-intake-actions.md
    │   │   ├── actions-no-auth-document-actions.md
    │   │   ├── actions-no-auth-internal-alert-actions.md
    │   │   ├── actions-no-auth-followup-actions.md
    │   │   ├── actions-no-auth-calculator-actions.md
    │   │   ├── actions-no-auth-schema-examples.md
    │   │   ├── actions-no-auth-testing-checklist.md
    │   │   └── actions-no-auth-risk-guardrails.md
    │   │
    │   ├── api-key/                                 ← Basic / Bearer / Custom header auth
    │   │   └── README.md
    │   │
    │   └── oauth/                                   ← user-authorized access
    │       └── README.md
    │
    ├── schemas/                                     ← reusable OpenAPI schema templates
    │   └── README.md
    │
    ├── workflows/                                   ← n8n / Zapier / Make automations
    │   └── README.md
    │
    ├── sops/                                        ← standard operating procedures
    │   └── README.md
    │
    ├── templates/                                   ← message and record templates
    │   └── README.md
    │
    └── knowledge/                                   ← GPT knowledge files
        └── README.md

---

## 📁 Folder Reference

| Folder | Purpose | Entry Point |
|--------|---------|-------------|
| `actions/` | Every Custom GPT Action, grouped by authentication type | `actions/README.md` |
| `actions/no-auth/` | Public-webhook Actions (intake, alerts, docs, follow-ups, calculators) | `actions/no-auth/README.md` |
| `actions/api-key/` | Single-backend Actions using a shared API key | `actions/api-key/README.md` |
| `actions/oauth/` | Per-user authorized Actions (Google, HubSpot, etc.) | `actions/oauth/README.md` |
| `schemas/` | Reusable OpenAPI 3.1.0 schema templates | `schemas/README.md` |
| `workflows/` | Automations that run after an Action fires | `workflows/README.md` |
| `sops/` | Human playbooks, especially the review gates | `sops/README.md` |
| `templates/` | Pre-approved messages and record layouts | `templates/README.md` |
| `knowledge/` | Reference files uploaded to the GPT | `knowledge/README.md` |

---

## 🌐 Front-End Files

| File | Role |
|------|------|
| `index.html` | Landing page markup — hero, features, how-it-works, CTA to the GPT |
| `styles.css` | Brand styling, layout, responsive design |
| `script.js` | Interactivity — nav, smooth scroll, FAQ toggles, CTA tracking |
| `agents.html` | Human-readable overview of the GPT (what it does and its guardrails) |
| `agents.md` | The GPT's instruction set / agent definition |
| `package.json` | Metadata, dependencies, and dev/build scripts |

---

## 🚀 Quick Start

1. **Clone the repo**

       git clone https://github.com/your-org/brokerflow-ai.git
       cd brokerflow-ai

2. **Install (front-end tooling, optional)**

       npm install

3. **Run locally**

       npm run dev

4. **Deploy** — push to your connected Vercel project, or:

       npm run build

---

## 🤖 The GPT

The Loan Broker Automation Architect GPT is configured from `agents.md`:

- **Role:** front-end assistant for borrower intake, document collection, follow-ups, and routing.
- **Actions:** defined in `/actions`, with schemas in `/schemas`.
- **Knowledge:** uploaded from `/knowledge`.
- **Behavior:** governed by `agents.md` and the safety contract in `actions/no-auth/actions-no-auth-risk-guardrails.md`.

---

## 🔌 How the Pieces Fit

    User ↔ Custom GPT (agents.md + knowledge/)
            │
            ▼
       Actions (/actions + /schemas)
            │  webhook
            ▼
       Workflows (/workflows: n8n / Zapier / Make)
            │
            ▼
       CRM + Alerts + Reminders
            │
            ▼
       Human Review (/sops)  ← all funding decisions

Templates (`/templates`) supply the wording sent at every borrower-facing step.

---

## 🛡️ Safety & Compliance

- No approvals, declines, terms, or guarantees without a human.
- No raw sensitive documents in payloads — secure links and metadata only.
- Possible-fit language only in borrower-facing content.
- Full safety contract: `actions/no-auth/actions-no-auth-risk-guardrails.md`.

---

## 🧩 Tech Stack

- **Front-end:** Vanilla HTML / CSS / JS (no framework required)
- **Hosting:** Vercel
- **Automation:** n8n, Zapier, or Make (webhook-driven)
- **GPT:** OpenAI Custom GPT with Actions

---

## 📄 License

Proprietary — © Moonshine Capital / Distilled Funding. All rights reserved unless otherwise noted.

---

## 🔗 Related Docs

- Agent definition → `agents.md`
- Actions library → `actions/README.md`
- Workflows → `workflows/README.md`
- SOPs → `sops/README.md`
- Knowledge → `knowledge/README.md`

---

*BrokerFlow AI — the operating library behind the Loan Broker Automation Architect GPT.*