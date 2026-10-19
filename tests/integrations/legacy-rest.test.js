import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import routing from "../../api/no-auth/lender-fit-routing.js";
import documents from "../../api/no-auth/document-checklist-actions.js";
import referral from "../../api/no-auth/partner-referral.js";
const baseline = JSON.parse(
  readFileSync(
    new URL("../fixtures/legacy-contracts.json", import.meta.url),
    "utf8",
  ),
);

function response() {
  return {
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}
test("legacy routing REST response and forwarded event retain baseline behavior through shared service", async (t) => {
  const previous = globalThis.fetch,
    original = process.env.LENDER_FIT_ROUTING_WEBHOOK_URL;
  t.after(() => {
    globalThis.fetch = previous;
    if (original === undefined)
      delete process.env.LENDER_FIT_ROUTING_WEBHOOK_URL;
    else process.env.LENDER_FIT_ROUTING_WEBHOOK_URL = original;
  });
  process.env.LENDER_FIT_ROUTING_WEBHOOK_URL =
    "https://synthetic.invalid/routing";
  const events = [];
  globalThis.fetch = async (_url, options) => {
    events.push(JSON.parse(options.body));
    return { ok: true };
  };
  for (const item of baseline.routes) {
    const b = response();
    await routing({ method: "POST", body: item.input }, b);
    const { routing_id, ...output } = b.body;
    assert.ok(routing_id);
    assert.deepEqual(output, item.output);
    const event = events.shift();
    delete event.routing_id;
    delete event.received_at;
    assert.deepEqual(event, item.event);
  }
  for (const method of ["GET", "PUT"]) {
    const res = response();
    await routing({ method }, res);
    assert.equal(res.code, 405);
  }
});
test("legacy checklist generator remains byte-compatible and partner REST retains its contract", async (t) => {
  const current = await import("../../lib/documents/checklist-service.js");
  const helpers =
    await import("../../api/no-auth/_document-checklist-utils.js");
  for (const item of baseline.checklists) {
    assert.deepEqual(current.generateChecklist(item.input), item.output);
    assert.deepEqual(
      current.auditDocuments({
        ...item.input,
        submitted_documents: ["owner_id"],
      }),
      item.audit,
    );
    assert.deepEqual(helpers.createPacket(item.input), item.packet);
    assert.deepEqual(helpers.summarizeFundingFile(item.input), item.summary);
  }
  const previous = globalThis.fetch,
    docUrl = process.env.DOCUMENT_CHECKLIST_WEBHOOK_URL,
    partnerUrl = process.env.PARTNER_REFERRAL_WEBHOOK_URL;
  t.after(() => {
    globalThis.fetch = previous;
    for (const [key, value] of [
      ["DOCUMENT_CHECKLIST_WEBHOOK_URL", docUrl],
      ["PARTNER_REFERRAL_WEBHOOK_URL", partnerUrl],
    ])
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
  });
  globalThis.fetch = async () => ({ ok: true });
  process.env.DOCUMENT_CHECKLIST_WEBHOOK_URL = "https://synthetic.invalid/docs";
  process.env.PARTNER_REFERRAL_WEBHOOK_URL =
    "https://synthetic.invalid/referral";
  const d = response();
  await documents(
    {
      method: "POST",
      body: {
        source: "webhook_test",
        action_type: "generate_document_checklist",
        primary_route: "equipment_financing",
      },
    },
    d,
  );
  assert.equal(d.code, 200);
  assert.ok(
    d.body.checklist_items.some(
      (item) => item.document_type === "equipment_invoice_or_quote",
    ),
  );
  const p = response();
  await referral(
    {
      method: "POST",
      body: {
        source: "webhook_test",
        action_type: "partner_referral",
        partner_id: "legacy-partner-reference",
        partner_name: "Synthetic Partner",
        referral_type: "business_funding",
        permission_to_contact: false,
        warm_intro_available: true,
      },
    },
    p,
  );
  assert.equal(p.code, 200);
  assert.equal(p.body.attribution_status, "attributed");
  assert.equal(
    p.body.recommended_next_step,
    "request_partner_mediated_warm_introduction",
  );
});
