<img width="2172" height="724" alt="Image" src="https://github.com/user-attachments/assets/37d37330-e76b-4c6c-81c4-5d061430c6af" />

---

# BrokerFlow AI
This folder holds the marketing + documentation site for **BrokerFlow AI**, the public face of the Loan Broker Automation Architect GPT. It is a content-first site: every page is authored in Markdown under `pages/`, then rendered by the front-end in the repo root (`index.html`, `styles.css`, `script.js`) and deployed to **brokerflow-ai.vercel.app**.
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

### Automation boundary

The lender-fit routing action is automation-first: it can score/rank a scenario, select a route, create queue/workflow payloads, send alerts, and trigger downstream automation.

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
- Pages are Markdown; the root front-end renders them. No build step is required for content edits.
- Preview locally by opening `index.html`, or run the dev flow described in the root `README.md`.
- Deploys are handled by Vercel on push to the default branch.
## License
Proprietary / UNLICENSED. © Moonshine Capital / Distilled Funding. Internal and partner use only.
