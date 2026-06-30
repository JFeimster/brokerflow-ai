# No-Auth Actions: Risk Guardrails

This file defines the **hard limits** for no-auth Custom GPT Actions in the Loan Broker Automation Architect GPT. Everything else in the `no-auth/` folder explains how to build Actions; this file explains what you must **never** build or expose without authentication and human review.

Treat this as the safety contract for the whole no-auth layer. If an Action would violate a rule here, it does not belong in `no-auth/` — move it to API Key or OAuth and add human review.

---

## 🚫 Never Expose These Through No-Auth

A no-auth Action must **never**:

- Approve, decline, qualify, or guarantee a borrower
- Submit a loan package or application to a lender
- Send borrower-facing funding **terms**, rates, or offers
- Make legal, tax, accounting, lending, or compliance determinations
- Delete or overwrite records
- Move money, charge cards, or process payments
- Return or transmit **raw sensitive documents** (bank statements, IDs, tax returns)
- Return full credit reports, full SSNs, or full account numbers
- Expose API keys, tokens, internal URLs, or system credentials

If you need any of the above, it is **not** a no-auth use case.

---

## ✅ What No-Auth IS For

No-auth Actions are appropriate for **write-only, low-sensitivity, reversible** events:

- Capturing intake and referral leads
- Requesting missing documents (metadata only)
- Sending internal alerts and creating review tasks
- Triggering pre-approved follow-up sequences
- Scheduling renewal and review reminders
- Logging conversation summaries
- Running stateless calculators

The common thread: the GPT **captures and routes**; a human **decides**.

---

## 🧭 The Safe-Language Rule

Whenever an Action produces or routes borrower-related content, use **possible-fit** language only.

**Safe**
- "Potential fit"
- "Ready for broker review"
- "Needs manual review"
- "May be worth submitting"
- "Possible lender match"
- "Based on the fields provided"

**Unsafe (never use)**
- "Approved"
- "Guaranteed"
- "Qualified"
- "Eligible"
- "This lender will fund them"
- "You will get funding"

---

## 🛡️ Mandatory Human-Review Points

Always route to a human **before**:

- Sending a deal to lenders
- Communicating any approval-like language
- Sharing funding terms or rates
- Rejecting or declining a borrower
- Handling sensitive financial documents
- Making underwriting decisions

The **Create Manual Review Task** Action exists for exactly these moments. Use it.

---

## 🔒 Minimum Hardening for Every No-Auth Endpoint

Even though there is no formal auth, apply these protections:

1. **Shared secret in the body** — reject requests without the correct value.
2. **Field validation** — reject malformed or incomplete payloads.
3. **Minimal payloads** — send only what the workflow needs.
4. **Obscure, rotatable URLs** — treat the webhook URL as a low-grade secret.
5. **Rate limiting** — throttle unusual volume.
6. **Idempotency** — dedupe on `event_id`.
7. **Sensitive-field masking** — never log raw PII or documents.

---

## 📊 Risk Tiers

Use this to decide whether an idea is safe for no-auth:

| Tier | Description | No-Auth OK? |
|------|-------------|-------------|
| 🟢 Low | Write-only, non-sensitive, reversible (intake, alerts, reminders, calculators) | ✅ Yes |
| 🟡 Medium | Reads/writes private records, CRM updates | ⚠️ Use API Key + review |
| 🔴 High | Funding decisions, lender submission, money movement, raw documents | ❌ Never no-auth |

---

## 🚨 Red-Flag Checklist

If you answer "yes" to any of these, the Action is **not** safe for no-auth:

- [ ] Does it decide a funding outcome?
- [ ] Does it submit to a lender?
- [ ] Does it send terms, rates, or offers to a borrower?
- [ ] Does it move money or charge a card?
- [ ] Does it transmit raw documents or full PII?
- [ ] Does it delete or overwrite data?
- [ ] Does it expose secrets or internal systems?

Any checked box → move to API Key/OAuth and add human review.

---

## 📝 Guardrail Summary Table

| Rule | Reason |
|------|--------|
| No approve/decline/guarantee | Underwriting must stay human |
| No lender submission | Requires confirmation and review |
| No borrower terms/rates | Must come from a verified source + human |
| No raw documents | Financial docs need secure, controlled handling |
| No money movement | Irreversible and high-risk |
| Shared secret required | Reduces random webhook abuse |
| Human review for deal events | Keeps the GPT a router, not a decision-maker |

---

## 🔗 Related

- When to use no-auth → `actions-no-auth-overview.md`
- Auth alternatives → `../actions-authentication-decision-guide.md`
- API key setup → `../api-key/README.md`
- OAuth setup → `../oauth/README.md`

---

*Part of the BrokerFlow AI repository — the operating library behind the Loan Broker Automation Architect GPT.*