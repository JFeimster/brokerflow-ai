<img width="2172" height="724" alt="Image" src="https://github.com/user-attachments/assets/37d37330-e76b-4c6c-81c4-5d061430c6af" />

---

# BrokerFlow AI
This repository contains the **BrokerFlow** broker operations platform, its public site, and the existing Loan Broker Automation Architect GPT Actions. Public pages resolve at `/`, `/agents`, `/actions`, `/knowledge`, `/workflows`, `/plugin`, and `/docs`; deployment routes are covered by `tests/site/public-routes.test.js`. The responsive operations console lives at `/app/*` and is implemented in `app.html`, `app.css`, `app.js`, and `data.js`. The console uses clearly labeled sample records until an authenticated data source is configured. Existing API Actions, authenticated MCP tools, workflows, and knowledge files remain distinct integration surfaces.
> Compliance note: BrokerFlow AI **recommends, drafts, prepares, routes, and logs**. It never approves, declines, qualifies, guarantees, underwrites, or funds. All site copy uses review-safe language ("potential fit", "ready for broker review", "possible lender match", "based on information provided") and never says "approved", "guaranteed", "qualified", or "eligible".

---

| Site | URL |
| --- | --- |
| Web | https://brokerflow-ai.vercel.app/ | 
| ChatGPT | https://chatgpt.com/g/g-6a214c8c41d48191bebafa39c853412f-loan-broker-automation-architect |
| Notion | https://github.com/JFeimster/brokerflow-ai/ |
| Vercel | https://vercel.com/jason-feimsters-projects/brokerflow-ai |
| GitHub | https://github.com/JFeimster/brokerflow-ai/ | 

## Action packs

BrokerFlow also contains no-auth GPT Action packs for intake, scoring, routing, workflow triggers, and controlled review queues.

| Action | Operation ID | Vercel endpoint | Schema |
| --- | --- | --- | --- |
| Lender Match Review | `requestLenderMatchReview` | `POST /api/no-auth/lender-match-review` | `schemas/no-auth-lender-match-review.schema.yaml` |
| Automated Lender Fit Routing | `routeLenderFitScenario` | `POST /api/no-auth/lender-fit-routing` | `schemas/no-auth-automated-lender-fit-routing.schema.yaml` |

The 12 partner lifecycle Actions have a consolidated endpoint and operation map in [`docs/internal-partner-action-packs-overview.md`](docs/internal-partner-action-packs-overview.md), plus [GPT Builder setup](docs/internal-partner-action-packs-gpt-builder-setup.md), [Vercel environment configuration](docs/internal-partner-action-packs-vercel-env.md), and [testing guidance](docs/internal-partner-action-packs-test-plan.md).

### Automation boundary

The legacy REST lender-fit routing Action retains its existing automation response contract. The new MCP `route_lender_fit` tool uses the shared deterministic calculation without triggering outbound effects. Internal scores remain heuristics, not underwriting or current lender offers.

Human review should only block final regulated steps: approval, denial, underwriting, formal pricing, funding, or lender submission. The lender-match review action exists for cases where a manual queue is required.

## Folder structure
```
site/
  README.md            This file — site overview, design system, and authoring rules
  pages/
    home.md            Landing page: hero, value prop, how it works, demo, CTA
    agents.md          The GPT agent: role, guardrails, what it does and won't do
    actions.md         Connected actions: CRM sync, pipeline, documents, tasks
    knowledge.md       Knowledge base: how BrokerFlow reasons and what it knows
    workflows.md       Automations: n8n, Zapier, Make recipes and triggers
```
## Audience
- Independent loan brokers and small brokerages who want an AI operations layer.
- Funding shops (e.g. Moonshine Capital / Distilled Funding) standardizing intake and CRM hygiene.
- Partners evaluating whether BrokerFlow fits their lender-submission process.
## Design system
The site uses a premium dark AI/SaaS aesthetic. Page copy here is layout-aware: each page maps to the standard section flow and references these tokens so the front-end stays consistent.
### Color tokens
| Token | Value | Use |
| --- | --- | --- |
| bg | `#070A12` | Page background |
| surface | `#101827` | Cards, panels |
| surface2 | `#151F32` | Nested panels, code, table rows |
| text | `#F8FAFC` | Primary text |
| muted | `#94A3B8` | Secondary text, captions |
| primary | `#7C3AED` | Primary buttons, key accents |
| secondary | `#06B6D4` | Links, secondary accents |
| hot | `#F97316` | Highlights, badges |
| success | `#22C55E` | Positive states, checks |
| border | `rgba(148,163,184,0.18)` | Hairline borders |
### Standard landing flow
Every page composes from this section order (omit sections that do not apply):
1. Hero — one-line promise + primary CTA
2. Built For — who it is for
3. What It Does — core capabilities
4. How It Works — step sequence
5. Demo / Embed — interactive preview or video
6. Use Cases — concrete scenarios
7. Pricing / Access — how to get it
8. Proof — real results only (no fabricated metrics or logos)
9. FAQ — common questions
10. Footer — links, legal, compliance line
## Authoring rules
- Mobile-first: write short paragraphs and scannable lists; assume narrow viewports first.
- Real proof only: never invent testimonials, client names, metrics, or partner logos.
- Review-safe language everywhere: no approval/guarantee/qualification claims.
- Front matter (optional) per page: `title`, `description`, `slug`, `order` for SEO + nav.
- Keep one `# H1` per page (the page title); use `##` for sections and `###` for sub-sections.
- Link between pages with relative paths, e.g. `[Actions](./actions.md)`.
## SEO
- Each page should declare a `title` (<= 60 chars) and `description` (<= 155 chars).
- Use descriptive section headings; they become the page outline and anchor links.
- Canonical domain: `https://brokerflow-ai.vercel.app`.
## Build & deploy
- Public pages are static HTML at the repository root and resolve through Vercel clean URLs. Editorial source remains under `site/pages/`.
- Route and navigation checks live under `tests/site/` and run with `npm test`.
- Preview locally with `npm run dev`; Vercel Preview and production releases follow repository controls.
## License
Proprietary / UNLICENSED. © Moonshine Capital / Distilled Funding. Internal and partner use only.
## Authenticated MCP and private plugin

BrokerFlow includes a stateless Streamable HTTP MCP endpoint at `/mcp`, authenticated review and follow-up services, and a portable private plugin package under [`plugin/`](plugin/). The MCP path fails closed until owner-authorized Supabase OAuth 2.1 setup is complete. See [`docs/MCP_ARCHITECTURE.md`](docs/MCP_ARCHITECTURE.md), [`docs/MCP_OAUTH_SETUP.md`](docs/MCP_OAUTH_SETUP.md), and [`docs/MCP_RELEASE_CHECKLIST.md`](docs/MCP_RELEASE_CHECKLIST.md). Build a validated Plugin Creator-ready ZIP with `npm run package:plugin`; packaging is not installation or live-authentication proof.

The server registers seventeen tools, including the seven core operations: `capture_borrower_intake`, `route_lender_fit`, `request_lender_match_review`, `generate_document_checklist`, `trigger_missing_document_request`, `lookup_deal_status`, and `capture_partner_referral`. New writes require explicit confirmation; routing/checklists are preliminary and document follow-up stops at a tracked draft/internal task. Canonical platform-core leads, referrals and audit events are reused. The additive core-workflows migration remains separate from code release. See the [inspection inventory](docs/MCP_CORE_BUILD_INVENTORY.md), [tool catalog](docs/MCP_TOOL_CATALOG.md), and [synthetic examples](docs/MCP_CORE_TOOL_EXAMPLES.md).

`npm test` recursively discovers non-database tests under `tests/`, including MCP, REST compatibility, compliance and skill tests. `npm run test:postgres` runs both PostgreSQL suites with `DATABASE_URL` pointing to an isolated test server; the core suite creates and drops its own synthetic database. CI uses ephemeral PostgreSQL 17 and packages the private plugin. Never point integration tests at a shared or populated database.

The public pages and static-route release checks are described in [`docs/WEB_RELEASE_CHECKLIST.md`](docs/WEB_RELEASE_CHECKLIST.md). The plugin onboarding page is [`/plugin`](https://brokerflow-ai.vercel.app/plugin); private plugin deployment and shared OAuth/database activation remain owner controlled.
