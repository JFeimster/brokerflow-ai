# No-Auth Actions: Testing Checklist

This file is the **pre-launch testing checklist** for no-auth Custom GPT Actions in the Loan Broker Automation Architect GPT. Run every Action through these tests before you let real borrowers, partners, or team members rely on it.

No-auth Actions are easy to build, which makes it tempting to skip testing. Don't. A broken intake webhook means lost leads; a misfiring reminder means annoyed borrowers. Test deliberately.

---

## ✅ Master Pre-Launch Checklist

Before any no-auth Action goes live:

- [ ] The Action sends to the correct webhook URL (staging first, then production)
- [ ] `operationId` is unique and matches the schema
- [ ] `security: []` is set (no auth) and the URL is one you control
- [ ] Write Actions are marked `x-openai-isConsequential: true`
- [ ] A valid request returns a clear success status
- [ ] An invalid request returns a readable error
- [ ] `human_review_required` defaults to `true` for deal-related Actions
- [ ] No raw documents or sensitive data appear in the payload
- [ ] The shared-secret check is enforced server-side
- [ ] Duplicate `event_id`s are ignored (idempotency)
- [ ] The receiving workflow does what you expect end-to-end

---

## 🧪 Test 1 — Happy Path (Valid Request)

Send a fully valid payload and confirm the full chain works.

**What to check**
- GPT calls the Action without errors
- Webhook receives the payload
- Workflow creates the record / sends the alert / queues the reminder
- Response status is `received`, `accepted`, or `queued`

**Example prompt to the GPT**

    "Submit this borrower intake: Sam Rivera, sam@example.com,
    +15555550123, Rivera Logistics LLC, $75,000 working capital."

**Pass criteria:** a CRM record (or test record) appears and the GPT confirms success.

---

## 🧪 Test 2 — Missing Required Fields

Send a payload missing a required field (e.g., no email).

**What to check**
- Workflow rejects the request with `invalid_request`
- Error message names the missing field
- GPT relays the error and asks the user for the missing info

**Pass criteria:** no partial/garbage record is created.

---

## 🧪 Test 3 — Bad Data Types

Send wrong types (e.g., `funding_amount_requested: "a lot"`).

**What to check**
- Validation catches the type mismatch
- No record is created with corrupt data
- Error is readable

**Pass criteria:** the workflow fails safely and explains why.

---

## 🧪 Test 4 — Shared Secret Enforcement

Send a request with a missing or wrong `shared_secret`.

**What to check**
- Workflow rejects the request
- No record is created
- Rejection is logged

**Pass criteria:** only requests with the correct secret are processed.

---

## 🧪 Test 5 — Duplicate / Retry (Idempotency)

Send the same `event_id` twice.

**What to check**
- First request processes
- Second request is recognized as a duplicate and skipped
- No duplicate lead/task/reminder is created

**Pass criteria:** exactly one record exists after two identical calls.

---

## 🧪 Test 6 — Human Review Routing

For any deal-related Action, confirm the review path.

**What to check**
- `human_review_required: true` triggers a review task or flag
- Nothing is auto-submitted to a lender
- No approval-like language is generated

**Pass criteria:** a human review step is created before any consequential step.

---

## 🧪 Test 7 — Sensitive Data Leak Check

Try to push something sensitive (e.g., paste a "bank statement" into chat and ask the GPT to submit it).

**What to check**
- The GPT does **not** place raw documents in the payload
- Only metadata / secure links are sent
- The GPT routes the file to a secure upload path instead

**Pass criteria:** no sensitive content leaves through the no-auth Action.

---

## 🧪 Test 8 — Endpoint Failure / Timeout

Temporarily disable the webhook or point to a dead URL.

**What to check**
- GPT reports the failure clearly instead of pretending success
- No silent data loss
- Retry behavior is sane (does not spam)

**Pass criteria:** failures are visible and recoverable.

---

## 📋 Quick Reference Matrix

| Test | What It Proves | Must Pass |
|------|----------------|-----------|
| Happy path | End-to-end works | ✅ |
| Missing fields | Validation works | ✅ |
| Bad data types | No corrupt records | ✅ |
| Shared secret | Abuse protection | ✅ |
| Duplicate event | Idempotency | ✅ |
| Human review | Safety routing | ✅ |
| Sensitive data | No leaks | ✅ |
| Endpoint failure | Graceful errors | ✅ |

---

## 🚀 Promotion Steps (Staging → Production)

1. Build and test against a **staging** webhook URL.
2. Pass all eight tests above.
3. Swap the server URL to **production** in the Action schema.
4. Run the happy-path test once more against production with a test record.
5. Delete the test record and go live.
6. Monitor the first day of real traffic for errors and volume.

---

## 🔗 Next

- Hard limits → `actions-no-auth-risk-guardrails.md`
- Schema snippets → `actions-no-auth-schema-examples.md`
- Auth decisions → `../actions-authentication-decision-guide.md`

---

*Part of the BrokerFlow AI repository — the operating library behind the Loan Broker Automation Architect GPT.*