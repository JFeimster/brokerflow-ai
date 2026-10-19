import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");

test("MCP server remains a composition root for focused tool modules", async () => {
  const source = await readFile(resolve(root, "lib/mcp/server.js"), "utf8");
  const expected = [
    "workspaces",
    "reviews",
    "follow-up-tasks",
    "route-lender-fit",
    "generate-document-checklist",
    "request-lender-match-review",
    "capture-borrower-intake",
    "trigger-missing-document-request",
    "lookup-deal-status",
    "capture-partner-referral",
  ];

  for (const module of expected) {
    assert.match(source, new RegExp(`tools/${module}\\.js`), module);
  }
  assert.doesNotMatch(source, /server\.registerTool\(/);
  assert.match(source, /export \{ handleMcpRequest \} from "\.\/transport\.js"/);
});

test("MCP schemas are partitioned by workflow domain", async () => {
  const expected = [
    "common",
    "borrower",
    "lender-fit",
    "reviews",
    "documents",
    "deals",
    "partners",
  ];
  for (const schema of expected) {
    const source = await readFile(
      resolve(root, `lib/mcp/schemas/${schema}.js`),
      "utf8",
    );
    assert.ok(source.length > 0, schema);
  }
});
