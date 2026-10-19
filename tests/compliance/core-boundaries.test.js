import test from "node:test";
import assert from "node:assert/strict";
import {
  clientFor,
  context,
  fixture,
  reviewScenario,
} from "../fixtures/mcp-harness.js";
import { generateDocumentChecklist } from "../../lib/documents/checklist-service.js";
import { prepareMissingDocumentRequest } from "../../lib/documents/request-service.js";

test("every new write denies unconfirmed, read-only and foreign-workspace calls before mutation", async (t) => {
  const ctx = context();
  let calls = 0;
  const rejectMutation = async () => {
    calls++;
    throw new Error("Unexpected mutation");
  };
  const client = await clientFor(t, ctx, {
    captureIntake: rejectMutation,
    captureReferral: rejectMutation,
    requestDocuments: rejectMutation,
    create: rejectMutation,
  });
  const common = {
    organization_id: fixture.organization_id,
    idempotency_key: "synthetic-permission-boundary-01",
  };
  const inputs = {
    capture_borrower_intake: { intake: fixture.intake },
    request_lender_match_review: { scenario: reviewScenario },
    trigger_missing_document_request: { intake_id: fixture.partner_id },
    capture_partner_referral: {
      partner_id: fixture.partner_id,
      intake_id: fixture.partner_id,
      source_reference: "synthetic-source",
      permission_to_contact: false,
      warm_intro_available: false,
    },
  };
  for (const [name, input] of Object.entries(inputs)) {
    assert.equal(
      (await client.callTool({ name, arguments: { ...common, ...input } }))
        .isError,
      true,
    );
    ctx.workspaces[0].canWrite = false;
    const denied = await client.callTool({
      name,
      arguments: { ...common, ...input, confirmed: true },
    });
    assert.equal(denied.structuredContent.status, 403, name);
    ctx.workspaces[0].canWrite = true;
    const foreign = await client.callTool({
      name,
      arguments: {
        ...common,
        ...input,
        confirmed: true,
        organization_id: fixture.other_organization_id,
      },
    });
    assert.equal(foreign.structuredContent.status, 403, name);
  }
  assert.equal(calls, 0);
});

test("a failed rate limiter prevents mutation and returns bounded error information", async (t) => {
  let writes = 0;
  const client = await clientFor(t, context(), {
    rateLimit: async () => {
      throw Object.assign(new Error("Rate limit exceeded."), { status: 429 });
    },
    captureIntake: async () => {
      writes++;
    },
  });
  const response = await client.callTool({
    name: "capture_borrower_intake",
    arguments: {
      organization_id: fixture.organization_id,
      intake: fixture.intake,
      confirmed: true,
      idempotency_key: "synthetic-rate-limited-write-01",
    },
  });
  assert.equal(response.structuredContent.status, 429);
  assert.equal(writes, 0);
});

test("document workflows use status metadata only and validate linked references", async () => {
  const intakeId = "60000000-0000-4000-8000-000000000001",
    dealId = "60000000-0000-4000-8000-000000000002";
  const calls = [];
  const ctx = context({
    db: {
      from(table) {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          async maybeSingle() {
            return {
              data:
                table === "leads"
                  ? {
                      id: intakeId,
                      metadata: {
                        brokerflow_intake: {
                          scenario: fixture.intake.scenario,
                        },
                      },
                    }
                  : { id: dealId, lead_id: intakeId, review_id: null },
              error: null,
            };
          },
        };
      },
      async rpc(name, args) {
        calls.push(args.p_input);
        return { data: { status: "task_created" }, error: null };
      },
    },
  });
  const checklist = generateDocumentChecklist(fixture.intake.scenario);
  const submitted = checklist.items
    .filter((item) => item.required)
    .map((item) => ({ document_type: item.document_type, status: "verified" }));
  await prepareMissingDocumentRequest(
    ctx,
    fixture.organization_id,
    { intake_id: intakeId, submitted_documents: submitted },
    "synthetic-complete-documents-01",
  );
  assert.deepEqual(calls[0].missing_documents, []);
  assert.equal(calls[0].draft, "");
  await prepareMissingDocumentRequest(
    ctx,
    fixture.organization_id,
    {
      intake_id: intakeId,
      submitted_documents: [
        { document_type: submitted[0].document_type, status: "missing" },
      ],
    },
    "synthetic-missing-document-01",
  );
  assert.ok(calls[1].missing_documents.includes(submitted[0].document_type));
  assert.match(calls[1].draft, /DRAFT/);
  assert.doesNotMatch(calls[1].draft, /synthetic-operator@example/);
  await assert.rejects(
    () =>
      prepareMissingDocumentRequest(
        ctx,
        fixture.organization_id,
        {
          deal_id: dealId,
          intake_id: fixture.partner_id,
          submitted_documents: [],
        },
        "synthetic-mismatched-reference-01",
      ),
    { status: 422 },
  );
});
