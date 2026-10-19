# Changelog

Project and private plugin release history. The private plugin is distributed only through the owner-approved ChatGPT workspace; it is not a public marketplace listing.

## 1.3.0 — 2026-10-19

### Added

- Authenticated, tenant-scoped MCP capabilities for borrower intake, preliminary lender-fit routing, lender review requests, document checklists, missing-document follow-up tracking, deal status, and partner referral attribution.
- Private plugin package with ten workflow skills, workflow references, draft templates, and evaluation cases.
- Public documentation and onboarding pages for the MCP server and private plugin.

### Changed

- Preserved all ten existing MCP tool names and their contracts while extending discovery to seventeen tools.
- Reused canonical platform-core lead, referral, review, follow-up, and audit services.
- Added persistent deal and document-request workflow storage through the additive core-workflows migration.

### Safety

- Lender-fit routing and checklists remain preliminary broker guidance.
- Persistent writes require explicit confirmation and organization-scoped authorization.
- Missing-document follow-up records an internal task and draft; no borrower message is sent.
- Borrower decisions, lender submission, underwriting, pricing, and funding remain human-controlled.

### Activation status

- Owner confirmed PRs #34 and #35 merged, migration applied, OAuth functioning, all seventeen tools discovered in ChatGPT, ten skills installed, nine live read-only calls successful, and private plugin v1.3.0 uploaded.
- The nine live calls were read-only. Full live persistent-write acceptance remains a separate operational check; see [`docs/MCP_RELEASE_CHECKLIST.md`](docs/MCP_RELEASE_CHECKLIST.md).
