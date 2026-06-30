# No-Auth Actions: Overview

This file explains **when to use no-auth Custom GPT Actions** for the Loan Broker Automation Architect GPT, when to avoid them, and how to keep them safe. Read this before building anything in the `no-auth/` folder.

---

## 🧠 What "No Auth" Means

A no-auth Action calls an endpoint with **no credentials** — no API key, no OAuth token. The endpoint is public, so anyone who discovers the URL could call it.

That sounds risky, but it is perfectly fine for the right job: **sending low-sensitivity data one direction into a workflow you control.** Most automation platforms (n8n, Zapier, Make) give you a public webhook URL designed exactly for this.

---

## ✅ When to Use No-Auth

Use no-auth Actions when **all** of these are true:

- The Action only **sends** data (it does not read private records back)
- The data is **low sensitivity** (no raw documents, no credit reports, no SSNs)
- The endpoint is **one you control** (your own webhook)
- The workflow does **not** make a funding decision automatically
- A mistake would be **low impact** and easily recoverable

Great fits:
- Borrower intake → webhook → CRM (via your automation tool)
- Missing-document reminder requests
- Internal broker/team alerts and task creation
- Referral partner lead capture
- Renewal and follow-up triggers
- Conversation summary logging
- Simple calculators (ROI, time saved)

---

## 🚫 When NOT to Use No-Auth

Do not use no-auth when the Action would:

- Read or return **private borrower records**
- Write directly to a **CRM that holds sensitive data** without a controlled wrapper
- **Approve, decline, qualify, or submit** a deal to a lender
- Handle **raw document contents** (bank statements, IDs, tax returns)
- Expose **API keys, tokens, or internal system details**
- Trigger **irreversible** actions (deletes, payments, sending borrower-facing terms)

For any of these, move to **API Key** or **OAuth** and add a human-review step.

---

## 🔒 How to Keep No-Auth Endpoints Safe

Even without true authentication, you can reduce abuse:

1. **Add a shared secret in the body.** Include a field like `"shared_secret": "..."` and have your webhook reject requests that do not match. Not real auth, but it stops random hits.
2. **Validate required fields.** Reject malformed or incomplete payloads.
3. **Keep payloads minimal.** Send only what the workflow needs — names, contact info, deal metadata. Never raw documents.
4. **Use obscure, rotating URLs.** Treat the webhook URL itself like a low-grade secret.
5. **Log and rate-limit.** Watch for unusual volume and throttle if needed.
6. **Always flag human review.** Default `human_review_required` to `true` for anything deal-related.

---

## 🧩 Typical No-Auth Flow

A simple end-to-end example:

    User chats with the GPT
    → GPT collects borrower intake details
    → GPT calls "Submit Borrower Intake to Webhook" (no auth)
    → n8n/Zapier/Make receives the payload
    → Workflow creates a CRM record + a "Ready for broker review" task
    → Broker reviews before any lender submission

The GPT never decides anything. It captures and routes; a human reviews.

---

## 📋 No-Auth vs Authenticated — Quick Compare

| Question | No-Auth | API Key / OAuth |
|----------|---------|-----------------|
| Sends data one way? | ✅ Ideal | ✅ Works |
| Reads private records? | ❌ Avoid | ✅ Use this |
| Touches funding decisions? | ❌ Never | ✅ With human review |
| Easiest to test? | ✅ Yes | ⚠️ More setup |
| Needs credentials? | No | Yes |

---

## 🚦 Recommended First Builds

If you are just starting, build these no-auth Actions in order:

1. Submit Borrower Intake to Webhook
2. Create Manual Review Task
3. Create Missing Document Request
4. Send Internal Broker Alert
5. Log Conversation Summary

This gives you a useful, testable Action library before you ever touch API keys or OAuth.

---

## 🔗 Next

- Reusable request/response shapes → `actions-no-auth-webhook-patterns.md`
- Your first real Action → `actions-no-auth-borrower-intake-actions.md`
- Hard limits → `actions-no-auth-risk-guardrails.md`

---

*Part of the BrokerFlow AI repository — the operating library behind the Loan Broker Automation Architect GPT.*