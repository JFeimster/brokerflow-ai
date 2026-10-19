import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { resolve, relative, dirname } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "../lib/mcp/server.js";

const root = resolve(".");
const pluginRoot = resolve(root, "plugin");
async function listFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...await listFiles(path));
    else result.push(path);
  }
  return result;
}

const manifest = JSON.parse(await readFile(resolve(pluginRoot, "plugin.json"), "utf8"));
const registered = JSON.parse(await readFile(resolve(pluginRoot, "evals/registered-tool-cases.json"), "utf8"));
const expectedSkills = manifest.extensions["com.openai.chatgpt"].skills;
assert.equal(expectedSkills.length, 10, "manifest must keep all ten skills");
for (const skillPath of expectedSkills) {
  const absolute = resolve(pluginRoot, skillPath.replace(/^\.\//, ""));
  const skill = await readFile(absolute, "utf8");
  const expectedName = skill.split("\n").find((line) => line.startsWith("name: "))?.slice(6).trim();
  assert.ok(expectedName, `skill name missing: ${skillPath}`);
  for (const match of skill.matchAll(/`\.\.\/\.\.\/(references|templates)\/([^`]+)`/g)) {
    await readFile(resolve(dirname(absolute), "../../", match[1], match[2]), "utf8");
  }
}

const server = createMcpServer({ authenticateMcp: async () => ({}) });
const client = new Client({ name: "plugin-asset-validator", version: "1.0.0" });
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
let toolCount = 0;
let workflowCount = 0;
try {
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  const { tools } = await client.listTools();
  toolCount = tools.length;
  const expectedNames = [...registered.legacy_tools, ...registered.core_tools, ...registered.operations_tools].sort();
  assert.equal(tools.length, registered.expected_tool_count);
  assert.deepEqual(tools.map((tool) => tool.name).sort(), expectedNames);

  const workflowFiles = (await listFiles(resolve(root, "workflows/n8n")))
    .filter((file) => file.endsWith(".n8n.json"));
  workflowCount = workflowFiles.length;
  assert.ok(workflowFiles.length >= 6, "expected the six documented n8n workflow exports");
  for (const file of workflowFiles) {
    const workflow = JSON.parse(await readFile(file, "utf8"));
    assert.notEqual(workflow.active, true, `${relative(root, file)} must not be active`);
    assert.ok(workflow.nodes.length >= 2, `${relative(root, file)} must contain nodes`);
    const nodeNames = new Set(workflow.nodes.map((node) => node.name));
    for (const [from, output] of Object.entries(workflow.connections)) {
      assert.ok(nodeNames.has(from), `unknown source node ${from}`);
      for (const group of output.main ?? [])
        for (const edge of group) assert.ok(nodeNames.has(edge.node), `unknown target node ${edge.node}`);
    }
    assert.equal(JSON.stringify(workflow).includes("Bearer "), false, "workflow must not package credentials");
  }
} finally {
  await client.close();
  await server.close();
}

process.stdout.write(`Validated ${expectedSkills.length} plugin skills, ${toolCount} registered MCP tools and ${workflowCount} inactive n8n exports.\n`);
