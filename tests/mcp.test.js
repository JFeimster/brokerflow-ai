import test from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer, handleMcpRequest } from "../lib/mcp/server.js";
import { createMcpAuthenticator, mcpResourceMetadata, validateMcpOAuthClaims } from "../lib/mcp/auth.js";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import mcpHandler from "../api/mcp.js";

const org = "00000000-0000-4000-8000-000000000001";
const review = "00000000-0000-4000-8000-000000000002";
const claims = { iss: "https://project.supabase.co/auth/v1", aud: "https://brokerflow-ai.vercel.app/mcp", sub: "user-1", exp: Math.floor(Date.now() / 1000) + 60, client_id: "chatgpt-client" };
const token = `header.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`;
const workspace = { id: org, name: "Test workspace", role: "broker", canRead: true, canWrite: true, canAudit: true };

function makeContext(overrides = {}) {
  return { user: { id: "user-1" }, workspaces: [workspace], db: { from() { throw new Error("unexpected query"); } }, ...overrides };
}

test("OAuth claims require exact issuer/resource audience, expiry, subject, and OAuth client identity", () => {
  const expected = { issuer: claims.iss, audience: claims.aud };
  assert.equal(validateMcpOAuthClaims(claims, expected), true);
  assert.equal(validateMcpOAuthClaims({ ...claims, exp: 1 }, expected), false);
  assert.equal(validateMcpOAuthClaims({ ...claims, aud: "authenticated" }, expected), false);
  assert.equal(validateMcpOAuthClaims({ ...claims, iss: "https://wrong.example" }, expected), false);
  assert.equal(validateMcpOAuthClaims({ ...claims, client_id: undefined }, expected), false);
  assert.equal(validateMcpOAuthClaims(claims, { ...expected, clientIds: ["approved-client"] }), false);
});

test("MCP authenticator delegates signature and current-user verification to Supabase before checking resource claims", async () => {
  let checked = false;
  const auth = createMcpAuthenticator({
    env: { SUPABASE_URL: "https://project.supabase.co", SUPABASE_SECRET_KEY: "server-only", BROKERFLOW_MCP_RESOURCE: claims.aud, BROKERFLOW_MCP_AUDIENCE: claims.aud, BROKERFLOW_MCP_OAUTH_CLIENT_IDS: "chatgpt-client" },
    verifyUser: async req => { checked = true; assert.equal(req.headers.authorization, `Bearer ${token}`); return makeContext(); },
  });
  const context = await auth({ headers: { authorization: `Bearer ${token}` } });
  assert.equal(checked, true);
  assert.equal(context.user.id, "user-1");
  await assert.rejects(() => auth({ headers: {} }), { status: 401 });
  const wrongSubject = createMcpAuthenticator({
    env: { SUPABASE_URL: "https://project.supabase.co", SUPABASE_SECRET_KEY: "server-only", BROKERFLOW_MCP_RESOURCE: claims.aud, BROKERFLOW_MCP_AUDIENCE: claims.aud, BROKERFLOW_MCP_OAUTH_CLIENT_IDS: "chatgpt-client" },
    verifyUser: async () => makeContext({ user: { id: "someone-else" } }),
  });
  await assert.rejects(() => wrongSubject({ headers: { authorization: `Bearer ${token}` } }), { status: 401 });
  const unapprovedClient = createMcpAuthenticator({
    env: { SUPABASE_URL: "https://project.supabase.co", SUPABASE_SECRET_KEY: "server-only", BROKERFLOW_MCP_RESOURCE: claims.aud, BROKERFLOW_MCP_AUDIENCE: claims.aud },
    verifyUser: async () => { throw new Error("The bearer token must not be checked without an approved OAuth client list."); },
  });
  await assert.rejects(() => unapprovedClient({ headers: { authorization: `Bearer ${token}` } }), { status: 503, code: "mcp_oauth_unavailable" });
});

test("protected resource metadata advertises only the configured Supabase authorization server", () => {
  assert.deepEqual(mcpResourceMetadata({ SUPABASE_URL: "https://project.supabase.co", BROKERFLOW_MCP_RESOURCE: claims.aud }), {
    resource: claims.aud,
    authorization_servers: ["https://project.supabase.co/auth/v1"],
    scopes_supported: ["openid", "email", "profile"],
    bearer_methods_supported: ["header"],
    resource_documentation: "https://github.com/JFeimster/brokerflow-ai/blob/main/docs/MCP_OAUTH_SETUP.md",
  });
});

test("MCP handshake and tools/list expose ten typed, annotated tools", async t => {
  const server = createMcpServer({ authenticateMcp: async () => makeContext() });
  const client = new Client({ name: "test-client", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  t.after(async () => { await client.close(); await server.close(); });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  const tools = await client.listTools();
  assert.deepEqual(tools.tools.map(tool => tool.name).sort(), ["apply_review_action", "complete_follow_up_task", "create_follow_up_task", "create_review_request", "get_my_workspaces", "get_review", "get_review_activity", "get_review_queue_summary", "list_follow_up_tasks", "list_reviews"].sort());
  const createTool = tools.tools.find(tool => tool.name === "create_review_request");
  assert.equal(createTool.annotations.readOnlyHint, false);
  assert.equal(createTool.inputSchema.properties.organization_id.format, "uuid");
  assert.equal(tools.tools.find(tool => tool.name === "get_review_activity").annotations.readOnlyHint, true);
  const actionTool = tools.tools.find(tool => tool.name === "apply_review_action");
  assert.equal(actionTool.annotations.readOnlyHint, false);
  assert.equal(actionTool.annotations.destructiveHint, true, "review transitions must require host-side confirmation safeguards");
  assert.deepEqual(actionTool.inputSchema.properties.action.enum, ["start_review", "request_information", "mark_reviewed"]);
  assert.match(actionTool.description, /does not approve, decline, qualify, underwrite, price, fund, or submit/i);
  const summaryTool = tools.tools.find(tool => tool.name === "get_review_queue_summary");
  assert.equal(summaryTool.annotations.readOnlyHint, true);
  const createTaskTool = tools.tools.find(tool => tool.name === "create_follow_up_task");
  assert.equal(createTaskTool.annotations.readOnlyHint, false);
  assert.equal(createTaskTool.annotations.idempotentHint, true);
  assert.equal(createTaskTool.inputSchema.properties.task_type.enum.includes("request_information"), true);
  assert.equal(tools.tools.find(tool => tool.name === "list_follow_up_tasks").annotations.readOnlyHint, true);
  assert.equal(tools.tools.find(tool => tool.name === "complete_follow_up_task").annotations.idempotentHint, true);
  assert.equal(tools.tools.find(tool => tool.name === "complete_follow_up_task").annotations.destructiveHint, true, "final task completion must retain MCP host confirmation safeguards");
  assert.match(tools.tools.find(tool => tool.name === "complete_follow_up_task").description, /does not send a message or update an external CRM/i);
});

test("stateless Streamable HTTP endpoint completes initialize and tools/list without a session", async t => {
  let authentications = 0;
  const context = makeContext();
  const httpServer = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bytes = Buffer.concat(chunks);
    req.body = bytes.length ? JSON.parse(bytes.toString("utf8")) : undefined;
    const authenticateMcp = async () => { authentications++; return context; };
    await authenticateMcp(req); // API gateway authenticates before allowing even initialization.
    await handleMcpRequest(req, res, { authenticateMcp });
  });
  await new Promise(resolve => httpServer.listen(0, "127.0.0.1", resolve));
  const { port } = httpServer.address();
  const transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`));
  const client = new Client({ name: "http-test-client", version: "1.0.0" });
  t.after(async () => { await client.close(); await new Promise(resolve => httpServer.close(resolve)); });
  await client.connect(transport);
  const response = await client.listTools();
  assert.equal(response.tools.length, 10);
  const workspaces = await client.callTool({ name: "get_my_workspaces", arguments: {} });
  assert.equal(workspaces.structuredContent.workspaces[0].id, org);
  assert.ok(authentications >= 1);
  assert.equal(transport.sessionId, undefined);
});

test("apply_review_action enforces organization write permission, delegates versioned lifecycle actions, and replays safely", async t => {
  const calls = [];
  const responses = new Map();
  const context = makeContext();
  const server = createMcpServer({
    authenticateMcp: async () => context,
    rateLimit: async (...args) => calls.push(["rate-limit", ...args.slice(1)]),
    apply: async (_context, organizationId, input) => {
      calls.push(["apply", organizationId, input]);
      if (input.expected_version !== 1) throw Object.assign(new Error("Review changed."), { status: 409 });
      const previous = responses.get(input.idempotency_key);
      if (previous) return { ...previous, duplicate: true };
      const status = { start_review: "in_review", request_information: "needs_information", mark_reviewed: "reviewed" }[input.action];
      const response = { id: review, review_request_id: "lmr_synthetic_stable", status, version: 2 };
      responses.set(input.idempotency_key, response);
      return response;
    },
  });
  const client = new Client({ name: "action-test-client", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  t.after(async () => { await client.close(); await server.close(); });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  for (const [index, action] of ["start_review", "request_information", "mark_reviewed"].entries()) {
    const args = { organization_id: org, review_id: review, action, expected_version: 1, idempotency_key: `synthetic-action-key-${index}-0001`, ...(action === "request_information" ? { note: "Please provide the missing business details." } : {}) };
    const result = await client.callTool({ name: "apply_review_action", arguments: args });
    assert.equal(result.structuredContent.status, { start_review: "in_review", request_information: "needs_information", mark_reviewed: "reviewed" }[action]);
    assert.equal(result.structuredContent.review_id, review);
    assert.equal(result.structuredContent.version, 2);
    assert.equal(calls.at(-1)[2].review_id, review);
    if (action === "request_information") assert.equal(calls.at(-1)[2].note, args.note);
    const replay = await client.callTool({ name: "apply_review_action", arguments: args });
    assert.equal(replay.structuredContent.status, result.structuredContent.status);
  }

  const conflict = await client.callTool({ name: "apply_review_action", arguments: { organization_id: org, review_id: review, action: "start_review", expected_version: 2, idempotency_key: "synthetic-version-conflict-01" } });
  assert.equal(conflict.isError, true);
  assert.equal(conflict.structuredContent.status, 409);
  const beforeDenied = calls.filter(call => call[0] === "apply").length;
  context.workspaces = [{ ...workspace, canWrite: false }];
  const denied = await client.callTool({ name: "apply_review_action", arguments: { organization_id: org, review_id: review, action: "start_review", expected_version: 1, idempotency_key: "synthetic-read-only-action-01" } });
  assert.equal(denied.isError, true);
  assert.equal(denied.structuredContent.status, 403);
  assert.equal(calls.filter(call => call[0] === "apply").length, beforeDenied);
  context.workspaces = [];
  const crossOrganization = await client.callTool({ name: "apply_review_action", arguments: { organization_id: org, review_id: review, action: "start_review", expected_version: 1, idempotency_key: "synthetic-cross-org-action-01" } });
  assert.equal(crossOrganization.isError, true);
  assert.equal(crossOrganization.structuredContent.status, 403);
  assert.equal(calls.filter(call => call[0] === "apply").length, beforeDenied);
  assert.ok(calls.filter(call => call[0] === "rate-limit").length >= 4);
});

test("follow-up task MCP tools require organization permissions, rate-limit writes, and list scoped tasks", async t => {
  const calls = [];
  const task = { id: review, organization_id: org, review_id: review, assigned_to: "00000000-0000-4000-8000-000000000003", task_type: "call", title: "Prepare broker call", description: "", due_date: "2026-10-25", status: "open", created_by: "user-1", created_at: "2026-10-19T12:00:00.000Z", completed_by: null, completed_at: null, duplicate: false };
  const context = makeContext({ user: { id: "00000000-0000-4000-8000-000000000099" }, db: { from(table) {
    assert.equal(table, "brokerflow_follow_up_tasks");
    const query = { select(columns, options) { calls.push(["select", columns, options]); return this; }, eq(key, value) { calls.push(["eq", key, value]); return this; }, lte(key, value) { calls.push(["lte", key, value]); return this; }, order() { return this; }, range(start, end) { calls.push(["range", start, end]); return this; }, then(resolve) { return Promise.resolve({ data: [task], count: 1, error: null }).then(resolve); } };
    return query;
  } } });
  const server = createMcpServer({
    authenticateMcp: async () => context,
    rateLimit: async (...args) => calls.push(["rate-limit", ...args.slice(1)]),
    createTask: async (_context, organizationId, input, actorId) => { calls.push(["create-task", organizationId, input, actorId]); return task; },
    completeTask: async (_context, organizationId, taskId, key, actorId) => { calls.push(["complete-task", organizationId, taskId, key, actorId]); return { ...task, status: "completed", completed_by: actorId, completed_at: "2026-10-19T13:00:00.000Z" }; },
  });
  const client = new Client({ name: "follow-up-task-test-client", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  t.after(async () => { await client.close(); await server.close(); });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  const args = { organization_id: org, idempotency_key: "synthetic-mcp-task-key-001", title: task.title, task_type: task.task_type, assigned_to: task.assigned_to, review_id: review, due_date: task.due_date };
  const created = await client.callTool({ name: "create_follow_up_task", arguments: args });
  assert.equal(created.structuredContent.id, review);
  assert.equal(calls.find(item => item[0] === "create-task")[3], "00000000-0000-4000-8000-000000000099");
  assert.ok(calls.some(item => item[0] === "rate-limit" && item[1] === "review_create"));
  const listed = await client.callTool({ name: "list_follow_up_tasks", arguments: { organization_id: org, status: "open", assigned_to: task.assigned_to, due_before: task.due_date } });
  assert.equal(listed.structuredContent.items[0].assigned_to, task.assigned_to);
  assert.ok(calls.some(item => item[0] === "eq" && item[1] === "organization_id" && item[2] === org));
  assert.ok(calls.some(item => item[0] === "lte" && item[1] === "due_date" && item[2] === task.due_date));
  const completed = await client.callTool({ name: "complete_follow_up_task", arguments: { organization_id: org, task_id: review, idempotency_key: "synthetic-mcp-complete-001" } });
  assert.equal(completed.structuredContent.status, "completed");
  assert.ok(calls.some(item => item[0] === "rate-limit" && item[1] === "review_action"));

  const writesBeforeDenied = calls.filter(item => item[0] === "create-task").length;
  context.workspaces = [{ ...workspace, canWrite: false }];
  const denied = await client.callTool({ name: "create_follow_up_task", arguments: { ...args, idempotency_key: "synthetic-readonly-task-001" } });
  assert.equal(denied.structuredContent.status, 403);
  assert.equal(calls.filter(item => item[0] === "create-task").length, writesBeforeDenied);
  context.workspaces = [];
  const crossTenant = await client.callTool({ name: "list_follow_up_tasks", arguments: { organization_id: org } });
  assert.equal(crossTenant.structuredContent.status, 403);
  const summaryDenied = await client.callTool({ name: "get_review_queue_summary", arguments: { organization_id: org } });
  assert.equal(summaryDenied.structuredContent.status, 403);
});

test("Vercel MCP route challenges missing tokens and keeps the canonical URL rewrites", async () => {
  const headers = {};
  const response = {
    statusCode: 200,
    setHeader(key, value) { headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await mcpHandler({ method: "POST", headers: {} }, response);
  assert.equal(response.statusCode, 401);
  assert.match(headers["WWW-Authenticate"], /oauth-protected-resource\/mcp/);
  assert.doesNotMatch(headers["WWW-Authenticate"], /invalid_token/);
  const config = JSON.parse(await (await import("node:fs/promises")).readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  assert.ok(config.rewrites.some(route => route.source === "/mcp" && route.destination === "/api/mcp"));
  assert.ok(config.rewrites.some(route => route.source === "/.well-known/oauth-protected-resource/mcp" && route.destination === "/api/mcp-metadata"));
  assert.ok(config.rewrites.some(route => route.source === "/oauth/consent" && route.destination === "/oauth-consent"));
});

test("private plugin package declares the HTTPS MCP endpoint and all five included workflow skills", async () => {
  const manifest = JSON.parse(await readFile(new URL("../plugin/plugin.json", import.meta.url), "utf8"));
  const mcp = JSON.parse(await readFile(new URL("../plugin/mcp.json", import.meta.url), "utf8"));
  assert.equal(manifest.$schema, "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json");
  assert.equal(manifest.version, "1.1.0");
  assert.match(manifest.name, /^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/);
  assert.equal(mcp.servers.brokerflow.type, "streamable-http");
  assert.equal(mcp.servers.brokerflow.url, "https://brokerflow-ai.vercel.app/mcp");
  const skills = manifest.extensions["com.openai.chatgpt"].skills;
  assert.equal(skills.length, 5);
  for (const skill of skills) await readFile(new URL(`../plugin/${skill.slice(2)}`, import.meta.url), "utf8");
  const evaluations = JSON.parse(await readFile(new URL("../plugin/evals/tool-selection-cases.json", import.meta.url), "utf8"));
  assert.ok(evaluations.some(item => item.expected_tool.startsWith("refuse_")));
});

test("MCP tools enforce tenant and audit permissions and reuse idempotent rate-limited creation", async t => {
  const calls = [];
  let duplicateReplay = false;
  const context = makeContext();
  context.db = {
    from(table) {
      calls.push(["from", table]);
      const query = {
        select() { return this; }, eq(key, value) { calls.push(["eq", key, value]); return this; },
        in() { return this; }, order() { return this; }, range() { return this; }, limit() { return this; },
        async maybeSingle() { return { data: { id: review }, error: null }; },
        then(resolve) { return Promise.resolve({ data: [{ id: review, organization_id: org }], error: null, count: 1 }).then(resolve); },
      };
      return query;
    },
  };
  const server = createMcpServer({
    authenticateMcp: async () => context,
    rateLimit: async (...args) => calls.push(["rate-limit", ...args.slice(1)]),
    create: async (_context, organizationId, scenario, key, actor) => {
      calls.push(["create", organizationId, scenario.human_review_required, key, actor]);
      const response = { id: review, review_request_id: "lmr_synthetic_stable", status: "queued_for_human_review", duplicate: duplicateReplay };
      duplicateReplay = true;
      return response;
    },
  });
  const client = new Client({ name: "test-client", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  t.after(async () => { await client.close(); await server.close(); });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  const list = await client.callTool({ name: "list_reviews", arguments: { organization_id: org, limit: 1 } });
  assert.equal(list.structuredContent.total_count, 1);
  assert.ok(calls.some(call => call[0] === "eq" && call[1] === "organization_id" && call[2] === org));

  context.workspaces = [{ ...workspace, canAudit: false }];
  const denied = await client.callTool({ name: "get_review_activity", arguments: { organization_id: org, review_id: review } });
  assert.equal(denied.isError, true);
  assert.equal(denied.structuredContent.status, 403);
  assert.equal(denied.structuredContent.error, "audit_access_denied");
  assert.equal(calls.filter(call => call[0] === "from" && call[1] === "brokerflow_review_events").length, 0);

  context.workspaces = [workspace];
  const created = await client.callTool({ name: "create_review_request", arguments: {
    organization_id: org,
    idempotency_key: "synthetic-idempotency-key-0001",
    scenario: { action_type: "lender_match_review", requester_name: "Synthetic test", borrower_type: "business", loan_purpose: "equipment_financing", requested_amount: 10000, state: "NY", human_review_required: true },
  } });
  assert.equal(created.structuredContent.duplicate, false);
  assert.equal(created.structuredContent.review_id, review);
  const replay = await client.callTool({ name: "create_review_request", arguments: {
    organization_id: org,
    idempotency_key: "synthetic-idempotency-key-0001",
    scenario: { action_type: "lender_match_review", requester_name: "Synthetic test", borrower_type: "business", loan_purpose: "equipment_financing", requested_amount: 10000, state: "NY", human_review_required: true },
  } });
  assert.equal(replay.structuredContent.review_request_id, created.structuredContent.review_request_id);
  assert.equal(replay.structuredContent.review_id, created.structuredContent.review_id);
  assert.equal(replay.structuredContent.duplicate, true);
  assert.ok(calls.some(call => call[0] === "rate-limit" && call[1] === "review_create"));
  assert.ok(calls.some(call => call[0] === "create" && call[1] === org && call[2] === true));

  context.workspaces = [{ ...workspace, canWrite: false }];
  const writesBefore = calls.filter(call => call[0] === "create").length;
  const readOnlyWrite = await client.callTool({ name: "create_review_request", arguments: {
    organization_id: org,
    idempotency_key: "synthetic-readonly-key-0001",
    scenario: { action_type: "lender_match_review", requester_name: "Synthetic test", borrower_type: "business", loan_purpose: "equipment_financing", requested_amount: 10000, state: "NY", human_review_required: true },
  } });
  assert.equal(readOnlyWrite.isError, true);
  assert.equal(readOnlyWrite.structuredContent.status, 403);
  assert.equal(calls.filter(call => call[0] === "create").length, writesBefore);

  context.workspaces = [workspace];
  const createsBeforeUnavailableLimit = calls.filter(call => call[0] === "create").length;
  const unavailableLimitServer = createMcpServer({
    authenticateMcp: async () => context,
    rateLimit: async () => { throw Object.assign(new Error("rate limit unavailable"), { status: 503 }); },
    create: async () => { calls.push(["unexpected-create"]); },
  });
  const limitClient = new Client({ name: "rate-limit-test-client", version: "1.0.0" });
  const [limitClientTransport, limitServerTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([unavailableLimitServer.connect(limitServerTransport), limitClient.connect(limitClientTransport)]);
  const unavailableLimit = await limitClient.callTool({ name: "create_review_request", arguments: {
    organization_id: org,
    idempotency_key: "synthetic-unavailable-limit-01",
    scenario: { action_type: "lender_match_review", requester_name: "Synthetic test", borrower_type: "business", loan_purpose: "equipment_financing", requested_amount: 10000, state: "NY", human_review_required: true },
  } });
  assert.equal(unavailableLimit.isError, true);
  assert.equal(unavailableLimit.structuredContent.status, 503);
  assert.equal(calls.filter(call => call[0] === "create").length, createsBeforeUnavailableLimit);
  await limitClient.close();
  await unavailableLimitServer.close();

  context.workspaces = [];
  const crossTenant = await client.callTool({ name: "get_review", arguments: { organization_id: org, review_id: review } });
  assert.equal(crossTenant.isError, true);
  assert.equal(crossTenant.structuredContent.status, 403);
});
