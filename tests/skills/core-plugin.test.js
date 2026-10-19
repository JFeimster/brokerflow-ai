import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { clientFor, coreNames } from "../fixtures/mcp-harness.js";
test("portable plugin contains ten correctly named skills and evaluation cases map to registered tools", async (t) => {
  const root = new URL("../../plugin/", import.meta.url);
  const manifest = JSON.parse(
    await readFile(new URL("plugin.json", root), "utf8"),
  );
  const paths = manifest.extensions["com.openai.chatgpt"].skills;
  assert.equal(paths.length, 10);
  assert.equal(new Set(paths).size, 10);
  let combined = "";
  for (const path of paths) {
    const text = await readFile(new URL(path, root), "utf8");
    const name = path.split("/")[2];
    assert.match(
      text,
      new RegExp(`^---\\r?\\nname: ${name}\\r?\\ndescription: .+`),
    );
    combined += text;
  }
  for (const name of coreNames)
    assert.ok(combined.includes("`" + name + "`"), name);
  for (const name of [
    "queue-triage",
    "missing-information-prep",
    "broker-automation-architect",
  ])
    assert.ok(paths.includes(`./skills/${name}/SKILL.md`));
  const cases = JSON.parse(
    await readFile(new URL("evals/core-workflow-cases.json", root), "utf8"),
  );
  const catalog = JSON.parse(
    await readFile(new URL("evals/registered-tool-cases.json", root), "utf8"),
  );
  const selectionCases = JSON.parse(
    await readFile(new URL("evals/tool-selection-cases.json", root), "utf8"),
  );
  const client = await clientFor(t);
  const { tools } = await client.listTools();
  const registeredNames = [...catalog.legacy_tools, ...catalog.core_tools].sort();
  assert.equal(tools.length, catalog.expected_tool_count);
  assert.deepEqual(tools.map((tool) => tool.name).sort(), registeredNames);
  assert.equal(selectionCases.length, registeredNames.length);
  assert.deepEqual(
    selectionCases.map((item) => item.expected_tool).sort(),
    registeredNames,
  );
  assert.deepEqual(
    cases.map((item) => item.tool).sort(),
    [...coreNames].sort(),
  );
  for (const item of cases) {
    const tool = tools.find((tool) => tool.name === item.tool);
    assert.ok(tool);
    assert.equal(tool.annotations.readOnlyHint, !item.write);
    if (item.write) assert.match(item.prompt, /confirmed/);
  }
  assert.match(combined, /not_sent/);
  assert.match(combined, /not.*underwriting/i);
});

test("n8n workflow exports stay disabled and use protected preview webhooks", async () => {
  const { readdir } = await import("node:fs/promises");
  const directory = new URL("../../workflows/n8n/", import.meta.url);
  const files = (await readdir(directory)).filter((file) => file.endsWith(".n8n.json"));
  assert.equal(files.length, 6);
  for (const file of files) {
    const workflow = JSON.parse(await readFile(new URL(file, directory), "utf8"));
    assert.notEqual(workflow.active, true, file);
    if (file !== "no-auth-lender-match-review.n8n.json") {
      const webhook = workflow.nodes.find((node) => node.type === "n8n-nodes-base.webhook");
      assert.equal(webhook.parameters.authentication, "headerAuth", file);
      assert.match(workflow.nodes.find((node) => node.type === "n8n-nodes-base.code").parameters.jsCode, /preview_only/);
    }
  }
});
