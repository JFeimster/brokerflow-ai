# Public site release checklist

The public static site has seven canonical pages: `/`, `/agents`, `/actions`, `/knowledge`, `/workflows`, `/plugin`, and `/docs`. Vercel uses clean URLs plus exact rewrites for the routes whose names collide with repository source directories.

Before opening a site change:

- Run `npm run build`, `npm run lint`, and `npm test`.
- Confirm each public page has one H1, a title, a search description and a canonical URL.
- Check the mobile navigation on each page and confirm all route links, downloadable n8n files, Markdown references, `robots.txt` and `sitemap.xml` resolve.
- Review every capability claim against actual authenticated MCP or REST behavior. Distinguish private OAuth access, Preview, production activation, and integrations that are only examples.
- Keep borrower decisions, lender submission, message delivery, raw document handling, payouts and guarantees outside autonomous site claims.

After a PR Preview is ready, verify `/`, `/agents`, `/actions`, `/knowledge`, `/workflows`, `/plugin`, and `/docs` return the expected HTML. Confirm the existing `/app/*`, `/mcp`, API and OAuth routes still resolve. A ready deployment is not proof that OAuth, migration, plugin installation or external workflow integrations are active.
