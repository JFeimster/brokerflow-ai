# API Key Actions

This folder covers Custom GPT Actions that authenticate with an **API key**. Use these when the Loan Broker Automation Architect GPT needs to call **one shared backend you control** on behalf of your whole office — most often a CRM, a database tool, or your own internal broker API.

API key auth is the middle tier: more powerful than no-auth (it can safely read and write real records) but simpler than OAuth (no per-user authorization flow). The same key is used for every request, so scope it tightly and protect it.

---

## 📌 When to Use API Key

Choose API key auth when **all** of these are true:

- The GPT calls **one backend**, not each user's personal account
- You can store a secret key securely on that backend
- The endpoint reads or writes **real records** (CRM, pipeline, tasks)
- You want the GPT to act as a single trusted client for the office

If each user needs to access *their own* account (their Google Drive, their HubSpot), use **OAuth** instead. If the endpoint only receives low-sensitivity events, use **No Auth**.

---

## 🔑 The Three API Key Formats

The GPT Builder supports three ways to send the key:

| Format | Header Sent | Use When |
|--------|-------------|----------|
| **Bearer** | `Authorization: Bearer <key>` | Most modern APIs and CRMs (default choice) |
| **Basic** | `Authorization: Basic <base64>` | Legacy APIs using username:password |
| **Custom** | `X-Api-Key: <key>` (named header) | Tools like Airtable that require a specific header name |

In GPT Builder: open the Action → **Authentication** → **API Key** → choose **Bearer**, **Basic**, or **Custom** and paste the key.

---

## 🗂️ Files in This Folder

    api-key/
    └── README.md     ← you are here

Add Action docs here as you build them (suggested naming):

    actions-api-key-crm-actions.md         ← create/update CRM contacts and deals
    actions-api-key-pipeline-actions.md    ← move deals through pipeline stages
    actions-api-key-airtable-actions.md    ← read/write Airtable bases (custom header)
    actions-api-key-task-actions.md        ← create and assign internal tasks
    actions-api-key-schema-examples.md     ← copy-paste OpenAPI with security schemes

---

## 🧩 Strong API Key Use Cases

| Use Case | What It Does | Human Review |
|----------|--------------|--------------|
| Create / update CRM contact | Adds or updates a borrower record | Optional |
| Update deal stage | Moves a deal in the pipeline | Optional |
| Create internal task | Assigns work to a broker/processor | Optional |
| Read deal status | Returns current pipeline status for a deal | No (read-only) |
| Write conversation log | Saves a summary to the CRM record | Optional |
| Submit for broker review | Flags a file as ready for human decision | Yes |

API key Actions can safely **read** private records (unlike no-auth). They must still route funding decisions to a human.

---

## 🛡️ Security Rules for API Key Actions

1. **Wrap, don't expose.** Put your CRM, document store, and lender logic behind **one backend API**. Give the GPT a few safe, high-level endpoints — never raw vendor keys.
2. **Least privilege.** The key should only allow the specific operations the GPT needs. No admin or delete scope unless required.
3. **Server-side validation.** Validate every request on your backend; never trust the GPT to enforce rules.
4. **No secrets in chat or schema bodies.** The key lives in GPT Builder's auth config, never in the request body or instructions.
5. **Rotate keys.** Rotate on a schedule and immediately if exposed.
6. **Scope by environment.** Use separate keys for staging and production.
7. **Log and monitor.** Track usage and alert on anomalies.

---

## 🔐 Example OpenAPI Security Schemes

**Bearer**

    components:
      securitySchemes:
        bearerAuth:
          type: http
          scheme: bearer
    security:
      - bearerAuth: []

**Custom header (e.g., Airtable)**

    components:
      securitySchemes:
        apiKeyAuth:
          type: apiKey
          in: header
          name: X-Api-Key
    security:
      - apiKeyAuth: []

Mark any write Action with `x-openai-isConsequential: true` so the GPT confirms before sending.

---

## 🛡️ Guardrails (Same Safety Contract)

Even with authenticated access, the GPT must never:

- Approve, decline, qualify, or guarantee a borrower
- Auto-submit a package to a lender without confirmation
- Send borrower-facing terms or rates without human review
- Expose the API key or internal system details

Route all funding decisions to a human. See `../no-auth/actions-no-auth-risk-guardrails.md` for the full safety contract — it applies to every auth tier.

---

## 🔗 Related

- Choosing an auth type → `../actions-authentication-decision-guide.md`
- No-auth Actions → `../no-auth/README.md`
- OAuth Actions → `../oauth/README.md`
- Schema templates → `../../schemas/README.md`

---

*Part of the BrokerFlow AI repository — the operating library behind the Loan Broker Automation Architect GPT.*