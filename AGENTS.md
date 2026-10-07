# BrokerFlow AI Project Instructions

## Project

- Project: BrokerFlow AI / Loan Broker Automation Architect GPT.
- Canonical remote: `https://github.com/JFeimster/brokerflow-ai`.
- Deployment platform: Vercel.
- The GPT may capture, classify, score, prioritize, route, notify, trigger workflows, prepare documents, draft partner messaging, and create CRM-ready payloads.
- Reserve human review or stronger authorization for legal or compliance uncertainty, compensation disputes, payout authorization, private-record retrieval, final regulated borrower decisions, lender submission, underwriting, approval or denial, formal pricing, and funding.
- Internal business-development scoring must never be presented as borrower credit scoring, underwriting, qualification, or lending eligibility.
- Preserve the borrower decision boundary: the system must not approve, decline, qualify, guarantee, underwrite, or fund borrowers.

## Repository Layout and Technical Conventions

- Prefer JavaScript Vercel serverless functions for current API actions.
- Place API files under `api/no-auth/` unless stronger authentication is justified.
- Use OpenAPI 3.1 for action schemas and keep schemas under `schemas/`.
- Keep action documentation under `actions/`, knowledge and guardrails under `knowledge/`, workflow documentation under `workflows/`, testing documentation under `docs/`, reusable templates under `templates/`, and standard operating procedures under `sops/`.
- Keep `ACTION_INDEX.md` aligned with implemented actions.
- Treat `gpt-instructions.md` as the Custom GPT instruction source. It is named separately because Windows cannot check out both `AGENTS.md` and `agents.md` in the same directory; on this platform those names collide.

## API Requirements

Each endpoint should:

- Accept only intended HTTP methods and return HTTP 405 for unsupported methods.
- Validate required inputs and enum values.
- Return JSON, fail gracefully, and generate a unique tracking ID where appropriate.
- Support optional webhook forwarding where appropriate and follow the existing shared webhook-header pattern.
- Avoid logging or exposing secrets and avoid exposing private borrower records through no-auth endpoints.

## Action Requirements

Each GPT Action should:

- Use a unique `operationId` and valid OpenAPI 3.1 YAML.
- Include request and response examples, Vercel environment-variable documentation, and curl tests.
- Update `ACTION_INDEX.md`; update `.env.example` for new variables.
- Update `README.md` only when materially useful.
- Avoid duplicating existing endpoints or operation IDs.

## Git Workflow

- Inspect repository identity, status, and relevant files before modifying them.
- Do not work directly on `main` for feature work. Create one branch per implementation batch.
- Keep commits scoped and descriptive; do not force-push unless explicitly instructed.
- Before creating a PR, inspect the diff and run available validation and tests.
- Preserve stronger existing implementations and unrelated local work.
