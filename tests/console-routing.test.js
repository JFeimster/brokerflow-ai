import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(fs.readFileSync(path.join(repoRoot, "vercel.json"), "utf8"));
const shellPath = path.join(repoRoot, "app.html");
const consoleRoutes = [
  "/app/dashboard",
  "/app/review-queue",
  "/app/deals",
  "/app/activity",
  "/app/partners",
  "/app/integrations",
  "/app/settings"
];

test("the /app clean URL resolves to the deployed app.html shell", () => {
  assert.equal(config.outputDirectory, ".");
  assert.equal(config.cleanUrls, true);
  assert.equal(fs.existsSync(shellPath), true);
  assert.equal(config.rewrites.some(rule => rule.source === "/app"), false, "the /app entry is handled by cleanUrls");
});

test("every console deep link rewrites to the extensionless /app clean URL", () => {
  for (const route of consoleRoutes) {
    const rewrite = config.rewrites.find(rule => rule.source === route);
    assert.ok(rewrite, `missing Vercel rewrite for ${route}`);
    assert.equal(rewrite.destination, "/app", `${route} must resolve through /app.html using cleanUrls`);
    assert.equal(rewrite.destination.endsWith(".html"), false, `${route} must not use an extension in its rewrite destination`);
  }
});

test("all console assets are present in the configured static output and use root paths", () => {
  for (const asset of ["app.html", "app.js", "app.css", "data.js"]) {
    assert.equal(fs.existsSync(path.join(repoRoot, asset)), true, `missing deployed asset ${asset}`);
  }
  const html = fs.readFileSync(shellPath, "utf8");
  assert.match(html, /href="\/app\.css"/);
  assert.match(html, /src="\/data\.js"/);
  assert.match(html, /src="\/app\.js"/);
});

test("the app shell exposes navigation for all supported deep routes", () => {
  const html = fs.readFileSync(shellPath, "utf8");
  for (const route of consoleRoutes) {
    assert.match(html, new RegExp(`href="${route}"`), `missing internal navigation link for ${route}`);
  }
});

test("the public homepage console CTA points at the dashboard route", () => {
  const homepage = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
  assert.match(homepage, /href="\/app\/dashboard"[^>]*>Explore the console<\/a>/);
});
