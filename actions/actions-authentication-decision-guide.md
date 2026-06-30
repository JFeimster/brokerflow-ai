# Actions: Authentication Decision Guide

Use this guide to choose the right authentication type **before** you build a Custom GPT Action for the Loan Broker Automation Architect GPT. Picking the wrong auth type is the most common reason an Action fails to connect or behaves unsafely.

The GPT Builder offers three choices: **None**, **API Key**, and **OAuth**. This guide explains when to use each, the risk level, and the recommended default for loan broker automations.

---

## 🧭 Quick Decision Tree

Ask these questions in order. Stop at the first "yes."

1. Does the endpoint act on data that belongs to *each individual user's own account* (their Google Drive, their HubSpot, their QuickBooks)?
   → **Use OAuth.**

2. Does the GPT call *one shared backend you control* on behalf of your whole office?
   → **Use API Key.**

3. Is it a *public webhook or low-risk endpoint you control* that only receives data (intake, alerts, logging, reminders)?
   → **Use None (No Auth).**

If you are unsure, default to the safest setup that still works: start with **No Auth** for testing, then move to **API Key** once real data is flowing.

---

## 🔐 The Three Authentication Types

### 1. None (No Auth)

**What it is:** The Action calls a public endpoint with no credentials. Anyone with the URL could technically call it.

**Best for:**
- Sending intake data to an n8n / Zapier / Make webhook
- Triggering internal alerts (Slack, email, Discord)
- Requesting missing documents
- Logging conversation summaries
- Simple calculators (ROI, time saved)

**Avoid for:**
- Anything that reads or writes sensitive borrower records
- Anything that approves, declines, or submits a deal
- Anything exposing API keys, tokens, or raw documents

**Risk level:** Low — *if* limited to write-only, low-sensitivity events.

**Hardening tip:** Even with no auth, include a shared-secret field inside the request body. It is not real authentication, but it reduces random webhook abuse.

---

### 2. API Key

**What it is:** The GPT sends a secret key with every request, acting as a single trusted backend client. The same key is used for all users.

**Three formats in GPT Builder:**

| Format | Header Example | Use When |
|--------|----------------|----------|
| **Bearer** | `Authorization: Bearer <key>` | Most modern APIs and CRMs |
| **Basic** | `Authorization: Basic <token>` | Legacy or username:password style APIs |
| **Custom** | `X-Api-Key: <key>` | Tools like Airtable that use a named header |

**Best for:**
- Creating or updating CRM contacts (HubSpot, GoHighLevel, Pipedrive)
- Reading/writing Airtable, Google Sheets via a wrapper
- Calling your own internal broker API

**Avoid for:**
- Letting individual brokers access *their own separate* accounts (use OAuth instead)

**Risk level:** Medium — the key grants broad access, so scope it tightly and never expose it in client-side code.

---

### 3. OAuth

**What it is:** Each user authorizes the GPT to access *their own* account. The GPT receives a per-user token, not a shared key.

**Two token-exchange methods in GPT Builder:**
- **Default (POST):** client credentials sent in the request body — works for most providers
- **Basic auth header:** client credentials sent as a Basic auth header at the token endpoint — required by some providers

**Best for:**
- Google Drive / Google Calendar
- HubSpot (per-user)
- QuickBooks / Xero
- Microsoft 365

**Avoid for:**
- Quick tests and simple webhooks (overkill)

**Risk level:** Advanced setup, but **safest for multi-user access** because each user controls their own grant and you use least-privilege scopes.

---

## 📊 Side-by-Side Comparison

| Factor | None | API Key | OAuth |
|--------|------|---------|-------|
| Setup difficulty | Easiest | Medium | Hardest |
| Credentials needed | None | One shared key | Client ID + secret + scopes |
| Per-user access | No | No | Yes |
| Good for testing | Yes | Sometimes | No |
| Sensitive data | No | With care | Yes (scoped) |
| Best first build | ✅ | After no-auth | Last |

---

## 🛡️ Safety Rules That Override Auth Choice

No matter which authentication type you choose, the Action must **never** autonomously:

- Approve or deny a borrower
- Submit a loan package to a lender without confirmation
- Send rate quotes without live source data
- Make legal, tax, or compliance determinations
- Expose raw sensitive borrower documents
- Change financial terms without human approval

Always route these to a **human review** step. See `no-auth/actions-no-auth-risk-guardrails.md`.

---

## ✅ Recommended Defaults for This GPT

| Scenario | Recommended Auth |
|----------|------------------|
| First Action you ever build | **None** (webhook intake) |
| CRM create/update | **API Key – Bearer** |
| Airtable | **API Key – Custom Header** |
| Google Drive / Calendar | **OAuth – Default POST** |
| Accounting (QuickBooks/Xero) | **OAuth** |
| Internal alerts / logging | **None** |

---

## 🔗 Next Steps

- Building a no-auth webhook? → `no-auth/actions-no-auth-overview.md`
- Need reusable schema snippets? → `../schemas/README.md`
- Ready to test? → `no-auth/actions-no-auth-testing-checklist.md`

---

*Part of the BrokerFlow AI repository — the operating library behind the Loan Broker Automation Architect GPT.*