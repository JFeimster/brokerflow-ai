import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const pages = new Map([
  ["/", "index.html"],
  ["/agents", "agents.html"],
  ["/actions", "actions.html"],
  ["/knowledge", "knowledge.html"],
  ["/workflows", "workflows.html"],
  ["/plugin", "plugin.html"],
  ["/docs", "docs.html"],
]);

test("Vercel clean URLs resolve every public information page", async () => {
  const config = JSON.parse(await readFile(resolve(root, "vercel.json"), "utf8"));
  assert.equal(config.cleanUrls, true);
  const rewrites = new Map(config.rewrites.map((route) => [route.source, route.destination]));
  for (const [route, file] of pages) {
    const html = await readFile(resolve(root, file), "utf8");
    assert.equal((html.match(/<h1\b/gi) ?? []).length, 1, `${route} needs exactly one H1`);
    assert.match(html, /<title>[^<]+<\/title>/, route);
    assert.match(html, /name="description" content="[^"]+"/, route);
    assert.match(html, /rel="canonical" href="https:\/\/brokerflow-ai\.vercel\.app/, route === "/" ? "" : route);
    assert.match(html, /id="primary-nav"/, route);
    assert.match(html, /class="nav-toggle"/, route);
    assert.match(html, /script\.js/, route);
    if (route !== "/" && route !== "/agents")
      assert.equal(rewrites.get(route), `/${file}`, `${route} must resolve around its source directory`);
  }
});

test("public page navigation and linked static documents resolve inside the deployment", async () => {
  const requiredRoutes = [...pages.keys()].filter((route) => route !== "/");
  for (const file of pages.values()) {
    const html = await readFile(resolve(root, file), "utf8");
    for (const route of requiredRoutes) assert.ok(html.includes(`href="${route}"`), `${file} missing ${route}`);
    const links = [...html.matchAll(/href="(\/[^"#?]+)"/g)].map((match) => match[1]);
    for (const link of links) {
      if (pages.has(link) || link.startsWith("/app/")) continue;
      const path = resolve(root, `.${link}`);
      await readFile(path, "utf8");
    }
  }
  const sitemap = await readFile(resolve(root, "sitemap.xml"), "utf8");
  for (const route of pages.keys()) assert.ok(sitemap.includes(`https://brokerflow-ai.vercel.app${route === "/" ? "/" : route}`));
  const robots = await readFile(resolve(root, "robots.txt"), "utf8");
  assert.match(robots, /Sitemap:\s+https:\/\/brokerflow-ai\.vercel\.app\/sitemap\.xml/);
});

test("public workflows and onboarding describe current effects and owner gates accurately", async () => {
  const workflows = await readFile(resolve(root, "workflows.html"), "utf8");
  const plugin = await readFile(resolve(root, "plugin.html"), "utf8");
  const actions = await readFile(resolve(root, "actions.html"), "utf8");
  assert.match(workflows, /do not connect to BrokerFlow storage/i);
  assert.match(workflows, /Download n8n JSON/);
  assert.match(plugin, /owner-approved migration and OAuth setup/i);
  assert.match(plugin, /ten existing tools and seven core additions/i);
  assert.match(actions, /not_sent/);
  assert.match(actions, /REST Actions remain available/i);
});
