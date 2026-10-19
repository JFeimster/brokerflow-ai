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
  const client = await clientFor(t);
  const { tools } = await client.listTools();
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
