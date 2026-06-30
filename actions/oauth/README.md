# OAuth Actions

This folder covers Custom GPT Actions that authenticate with **OAuth**. Use these when the Loan Broker Automation Architect GPT needs to access **each user's own account** — their Google Drive, their HubSpot, their QuickBooks, their Calendar — rather than one shared backend.

OAuth is the most advanced auth tier. It is more setup than no-auth or API key, but it is the **safest option for multi-user access** because every user authorizes the GPT individually with scoped, revocable permissions.

---

## 📌 When to Use OAuth

Choose OAuth when **any** of these are true:

- Each user must access **their own** account, not a shared one
- The provider requires OAuth (Google, Microsoft, HubSpot, QuickBooks, Xero)
- You need **scoped, revocable** permissions per user
- You want each user's actions tied to their own identity and audit trail

If the GPT calls one shared backend for the whole office, use **API Key**. If it only sends low-sensitivity events, use **No Auth**.

---

## 🔑 What OAuth Needs

To configure an OAuth Action in GPT Builder, you'll provide:

| Field | What It Is |
|-------|-----------|
| **Client ID** | Public identifier for your OAuth app |
| **Client Secret** | Private key for your OAuth app |
| **Authorization URL** | Where the user is sent to grant access |
| **Token URL** | Where the GPT exchanges the code for a token |
| **Scopes** | The specific permissions requested (least privilege) |
| **Token Exchange Method** | Default (POST body) or Basic auth header |

You create the OAuth app in the **provider's developer console**, then paste these values into the Action's Authentication settings.

---

## 🔄 The OAuth Flow (Plain English)

1. User triggers an Action that needs OAuth.
2. GPT sends them to the provider's **Authorization URL**.
3. User logs in and approves the requested **scopes**.
4. Provider returns a code; GPT exchanges it at the **Token URL**.
5. GPT receives a per-user **access token** (and refresh token).
6. GPT calls the API as that user, limited to the approved scopes.

The user can **revoke** access at any time from the provider — a key safety advantage.

---

## 🗂️ Files in This Folder

    oauth/
    └── README.md     ← you are here

Add Action docs here as you build them (suggested naming):

    actions-oauth-google-drive-actions.md   ← read/write a user's Drive files
    actions-oauth-calendar-actions.md        ← schedule borrower/broker meetings
    actions-oauth-hubspot-actions.md         ← per-user CRM access
    actions-oauth-accounting-actions.md      ← QuickBooks / Xero (read-only first)
    actions-oauth-schema-examples.md         ← OpenAPI with OAuth security schemes

---

## 🧩 Strong OAuth Use Cases

| Use Case | Provider | Suggested Scope Style | Human Review |
|----------|----------|-----------------------|--------------|
| Save documents to a user's Drive | Google Drive | File-scoped, not full drive | Optional |
| Schedule a call with a borrower | Google / MS Calendar | Calendar events only | Optional |
| Read a user's CRM deals | HubSpot | Read-only first | No (read) |
| Pull financial summaries | QuickBooks / Xero | Read-only | Yes (before use in decisions) |

Start every provider **read-only** where possible, then add write scopes only when needed.

---

## 🔐 Example OpenAPI OAuth Security Scheme

    components:
      securitySchemes:
        oauth2:
          type: oauth2
          flows:
            authorizationCode:
              authorizationUrl: https://provider.com/oauth/authorize
              tokenUrl: https://provider.com/oauth/token
              scopes:
                read: Read access to the user's records
                write: Create and update the user's records
    security:
      - oauth2:
          - read

Mark any write Action with `x-openai-isConsequential: true`.

---

## 🛡️ Security Rules for OAuth Actions

1. **Least-privilege scopes.** Request only what each Action needs. Avoid full-account scopes.
2. **Read-only first.** Launch with read scopes, add write access deliberately.
3. **Protect the client secret.** It lives in GPT Builder auth config, never in chat, instructions, or request bodies.
4. **Respect revocation.** Handle expired/revoked tokens gracefully and re-prompt for consent.
5. **Per-user audit.** Tie actions to the authorizing user for traceability.
6. **Separate apps per environment.** Use distinct OAuth apps for staging and production.

---

## 🛡️ Guardrails (Same Safety Contract)

Even with a user's authorized access, the GPT must never:

- Approve, decline, qualify, or guarantee a borrower
- Auto-submit a package to a lender without confirmation
- Send borrower-facing terms or rates without human review
- Use pulled financial data to make an automated funding decision

Route all funding decisions to a human. The full safety contract in `../no-auth/actions-no-auth-risk-guardrails.md` applies to every auth tier.

---

## 🔗 Related

- Choosing an auth type → `../actions-authentication-decision-guide.md`
- No-auth Actions → `../no-auth/README.md`
- API key Actions → `../api-key/README.md`
- Schema templates → `../../schemas/README.md`

---

*Part of the BrokerFlow AI repository — the operating library behind the Loan Broker Automation Architect GPT.*