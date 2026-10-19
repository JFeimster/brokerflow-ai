import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import {
  clientFor,
  context,
  fixture,
  coreNames,
  reviewScenario,
} from "../fixtures/mcp-harness.js";
import { routingOutput } from "../../lib/mcp/schemas/lender-fit.js";
import { checklistOutput } from "../../lib/mcp/schemas/documents.js";
import { normalizeIntake } from "../../lib/borrower-intake/normalize.js";
import { validateIntake } from "../../lib/borrower-intake/validation.js";
import { workflowRpc } from "../../lib/workflows/rpc.js";
import { readFileSync } from "node:fs";

test("all ten legacy tool schemas, annotations and descriptions remain identical to main", async (t) => {
  const baseline = JSON.parse(
    readFileSync(
      new URL("../fixtures/mcp-legacy-contracts.json", import.meta.url),
      "utf8",
    ),
  );
  const client = await clientFor(t);
  const current = await client.listTools();
  for (const tool of baseline.tools)
    assert.deepEqual(
      JSON.parse(JSON.stringify(current.tools.find((item) => item.name === tool.name))),
      tool,
      tool.name,
    );
});

test("all seven requested names are discoverable with schemas, bounded reads and confirmed writes", async (t) => {
  const client = await clientFor(t);
  const { tools } = await client.listTools();
  assert.equal(tools.length, 18);
  for (const name of coreNames) {
    const tool = tools.find((item) => item.name === name);
    assert.ok(tool, name);
    assert.ok(tool.outputSchema.properties);
    assert.equal(tool.inputSchema.properties.organization_id.format, "uuid");
    const read = [
      "route_lender_fit",
      "generate_document_checklist",
      "lookup_deal_status",
    ].includes(name);
    assert.equal(tool.annotations.readOnlyHint, read);
    if (!read) {
      assert.equal(tool.annotations.destructiveHint, true);
      assert.ok(tool.inputSchema.required.includes("confirmed"));
      assert.ok(tool.inputSchema.required.includes("idempotency_key"));
    }
  }
});

test("single follow-up task reads are authorized, organization scoped and available to read-only workspaces", async (t) => {
  const task = {
    id: "70000000-0000-4000-8000-000000000001",
    organization_id: fixture.organization_id,
    review_id: null,
    assigned_to: fixture.actor_id,
    task_type: "call",
    title: "Prepare broker call",
    description: "",
    due_date: "2026-10-25",
    status: "open",
    created_by: fixture.actor_id,
    created_at: "2026-10-19T12:00:00Z",
    completed_by: null,
    completed_at: null,
  };
  const scopes = [];
  const ctx = context({
    db: {
      from(table) {
        assert.equal(table, "brokerflow_follow_up_tasks");
        const query = {
          select() {
            return this;
          },
          eq(column, value) {
            scopes.push([column, value]);
            return this;
          },
          async maybeSingle() {
            return { data: task, error: null };
          },
        };
        return query;
      },
    },
  });
  ctx.workspaces[0].canWrite = false;
  const client = await clientFor(t, ctx);
  const result = await client.callTool({
    name: "get_follow_up_task",
    arguments: {
      organization_id: fixture.organization_id,
      task_id: task.id,
    },
  });
  assert.equal(result.isError, undefined);
  assert.deepEqual(result.structuredContent, task);
  assert.deepEqual(scopes, [
    ["organization_id", fixture.organization_id],
    ["id", task.id],
  ]);

  const denied = await client.callTool({
    name: "get_follow_up_task",
    arguments: {
      organization_id: fixture.other_organization_id,
      task_id: task.id,
    },
  });
  assert.equal(denied.structuredContent.status, 403);
  assert.equal(scopes.length, 2);
  const invalid = await client.callTool({
    name: "get_follow_up_task",
    arguments: { organization_id: fixture.organization_id, task_id: "not-a-uuid" },
  });
  assert.equal(invalid.isError, true);
});

test("routing and checklists perform deterministic read-only computation with explicit limitations", async (t) => {
  const ctx = context();
  ctx.workspaces[0].canWrite = false;
  const client = await clientFor(t, ctx);
  const args = {
    organization_id: fixture.organization_id,
    scenario: fixture.intake.scenario,
  };
  const route = await client.callTool({
    name: "route_lender_fit",
    arguments: args,
  });
  assert.equal(route.isError, undefined);
  z.object(routingOutput).parse(route.structuredContent);
  assert.equal(route.structuredContent.primary_route, "equipment_financing");
  assert.match(
    route.structuredContent.score_limitations,
    /internal routing heuristics/,
  );
  assert.equal(route.structuredContent.next_step, "broker_review");
  assert.equal("automation_actions" in route.structuredContent, false);
  const repeat = await client.callTool({
    name: "route_lender_fit",
    arguments: args,
  });
  assert.deepEqual(repeat.structuredContent, route.structuredContent);
  const checklist = await client.callTool({
    name: "generate_document_checklist",
    arguments: args,
  });
  z.object(checklistOutput).parse(checklist.structuredContent);
  assert.equal(checklist.structuredContent.route, "equipment_financing");
  assert.ok(
    checklist.structuredContent.items.some(
      (item) =>
        item.document_type === "equipment_invoice_or_quote" && item.required,
    ),
  );
  const mortgage = await client.callTool({
    name: "generate_document_checklist",
    arguments: {
      organization_id: fixture.organization_id,
      scenario: { loan_purpose: "residential_purchase" },
    },
  });
  assert.equal(mortgage.structuredContent.route, "residential_mortgage");
  assert.ok(
    mortgage.structuredContent.items.some(
      (item) =>
        item.document_type === "purchase_contract_if_applicable" &&
        item.recommended,
    ),
  );
});

test("new writes require confirmation and current workspace write access before persistence", async (t) => {
  let writes = 0;
  const ctx = context();
  const client = await clientFor(t, ctx, {
    captureIntake: async () => {
      writes++;
    },
  });
  const args = {
    organization_id: fixture.organization_id,
    idempotency_key: "synthetic-intake-request-001",
    intake: fixture.intake,
  };
  for (const confirmed of [undefined, false]) {
    const response = await client.callTool({
      name: "capture_borrower_intake",
      arguments: { ...args, ...(confirmed === undefined ? {} : { confirmed }) },
    });
    assert.equal(response.isError, true);
  }
  ctx.workspaces[0].canWrite = false;
  const denied = await client.callTool({
    name: "capture_borrower_intake",
    arguments: { ...args, confirmed: true },
  });
  assert.equal(denied.structuredContent.status, 403);
  assert.equal(writes, 0);
});

test("invalid amounts, unknown fields and absent scenario fields fail protocol validation", async (t) => {
  const client = await clientFor(t);
  for (const scenario of [
    { ...fixture.intake.scenario, requested_amount: -1 },
    { ...fixture.intake.scenario, state: "New York" },
    { ...fixture.intake.scenario, raw_document: "private bytes" },
    { borrower_type: "business" },
  ]) {
    const result = await client.callTool({
      name: "route_lender_fit",
      arguments: { organization_id: fixture.organization_id, scenario },
    });
    assert.equal(result.isError, true);
  }
  assert.throws(
    () =>
      validateIntake({
        ...fixture.intake,
        consent: { ...fixture.intake.consent, captured_at: undefined },
      }),
    { status: 422 },
  );
  assert.throws(
    () =>
      validateIntake({
        ...fixture.intake,
        consent: {
          ...fixture.intake.consent,
          captured_at: "2099-01-01T00:00:00Z",
        },
      }),
    { status: 422 },
  );
  const normalized = normalizeIntake(
    validateIntake({
      ...fixture.intake,
      scenario: {
        borrower_type: "business",
        loan_purpose: "business_working_capital",
        state: "ny",
        requested_amount: 15000,
      },
    }),
  );
  assert.equal(normalized.scenario.state, "NY");
  assert.ok(
    normalized.completeness.critical_missing_information.includes(
      "business_revenue",
    ),
  );
});

test("review compatibility operation reuses the legacy create service and identity", async (t) => {
  const calls = [];
  const id = "60000000-0000-4000-8000-000000000001";
  const client = await clientFor(t, context(), {
    create: async (...args) => {
      calls.push(args);
      return {
        id,
        review_request_id: "lmr_synthetic",
        status: "queued_for_human_review",
        duplicate: calls.length > 1,
      };
    },
  });
  const args = {
    organization_id: fixture.organization_id,
    idempotency_key: "synthetic-review-alias-001",
    scenario: reviewScenario,
  };
  const a = await client.callTool({
    name: "create_review_request",
    arguments: args,
  });
  const b = await client.callTool({
    name: "request_lender_match_review",
    arguments: { ...args, confirmed: true },
  });
  assert.equal(a.structuredContent.review_id, b.structuredContent.review_id);
  assert.equal(b.structuredContent.duplicate, true);
  assert.deepEqual(calls[0].slice(1), calls[1].slice(1));
});

test("cross-tenant requests, revoked membership and unauthenticated calls fail closed", async (t) => {
  const ctx = context();
  const client = await clientFor(t, ctx);
  for (const name of ["route_lender_fit", "generate_document_checklist"]) {
    const res = await client.callTool({
      name,
      arguments: {
        organization_id: fixture.other_organization_id,
        scenario: fixture.intake.scenario,
      },
    });
    assert.equal(res.structuredContent.status, 403);
  }
  ctx.workspaces = [];
  const revoked = await client.callTool({
    name: "route_lender_fit",
    arguments: {
      organization_id: fixture.organization_id,
      scenario: fixture.intake.scenario,
    },
  });
  assert.equal(revoked.structuredContent.status, 403);
  const unauthenticated = await clientFor(t, context(), {
    authenticateMcp: async () => {
      throw Object.assign(new Error("Authentication required."), {
        status: 401,
      });
    },
  });
  const denied = await unauthenticated.callTool({
    name: "generate_document_checklist",
    arguments: { organization_id: fixture.organization_id, scenario: {} },
  });
  assert.equal(denied.structuredContent.status, 401);
});

test("workflow errors are consistent and hide private database errors", async () => {
  for (const [code, status] of [
    ["42501", 403],
    ["23505", 409],
    ["P0002", 404],
    ["23503", 422],
    ["secret-db-error", 503],
  ]) {
    const ctx = context({
      db: {
        rpc: async () => ({
          error: { code, message: "private database content" },
        }),
      },
    });
    await assert.rejects(
      () =>
        workflowRpc(
          ctx,
          fixture.organization_id,
          "unused",
          {},
          "synthetic-operation-001",
        ),
      (error) =>
        error.status === status &&
        !error.message.includes("private database content"),
    );
  }
});
