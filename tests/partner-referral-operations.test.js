import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import referral, { buildPartnerReferral } from "../api/no-auth/partner-referral.js";
import status, { buildPartnerStatusUpdate } from "../api/no-auth/partner-status-update-draft.js";
import attribution, { buildPartnerAttributionLog } from "../api/no-auth/partner-attribution-log.js";
import { ACTIONS } from "../lib/partner-action-utils.js";

const cases = [
  { key: "referral", handler: referral, body: { source: "webhook_test", action_type: "partner_referral", partner_id: "partner_123", partner_name: "Alex Rivera", partner_email: "alex@example.com", partner_company: "Rivera Advisory", partner_category: "accountant_cpa", referral_type: "working_capital", borrower_name: "Jordan Lee", business_name: "Lee Design Studio", borrower_email: "jordan@example.com", borrower_phone: "2125550100", borrower_state: "NY", requested_amount: 75000, loan_purpose: "Purchase inventory", relationship_to_borrower: "client", permission_to_contact: true, warm_intro_available: true, referral_notes: "Owner requested an introduction." } },
  { key: "statusUpdate", handler: status, body: { source: "webhook_test", action_type: "partner_status_update_draft", partner_id: "partner_123", partner_name: "Alex Rivera", referral_id: "prf_123", deal_stage: "documents_pending", update_type: "document_update", borrower_disclosure_level: "minimal", communication_channel: "email", tone: "professional", known_status: "private text must not be copied", allowed_details: [], restricted_details: [], notes: "internal note must not be copied" } },
  { key: "attribution", handler: attribution, body: { source: "webhook_test", action_type: "partner_attribution_log", partner_id: "partner_123", partner_name: "Alex Rivera", referral_id: "prf_123", borrower_or_business_name: "Lee Design Studio", attribution_status: "attributed", commission_status: "pending_completion", payout_stage: "awaiting_deal_completion", attribution_notes: "Source captured.", dispute_flag: false, logged_by: "operations" } }
];
const envNames = ["WEBHOOK_SHARED_SECRET", ...cases.flatMap(({ key }) => [`${ACTIONS[key].env}_SHARED_SECRET`, `${ACTIONS[key].env}_WEBHOOK_URL`])];
let savedEnv;
let originalFetch;

beforeEach(() => {
  savedEnv = Object.fromEntries(envNames.map((name) => [name, process.env[name]]));
  for (const name of envNames) delete process.env[name];
  originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error("Unexpected network access"); };
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const name of envNames) {
    if (savedEnv[name] === undefined) delete process.env[name];
    else process.env[name] = savedEnv[name];
  }
});

async function invoke(handler, body, method = "POST") {
  const result = { headers: {} };
  await handler({ method, body }, {
    setHeader(name, value) { result.headers[name] = value; },
    status(code) { result.status = code; return this; },
    json(value) { result.body = value; return this; }
  });
  assert.equal(result.headers["Content-Type"], "application/json");
  assert.equal(result.headers["Cache-Control"], "no-store");
  return result;
}

for (const entry of cases) {
  const config = ACTIONS[entry.key];
  test(`${entry.key}: POST returns tracked output with unique IDs`, async () => {
    const first = await invoke(entry.handler, entry.body);
    const second = await invoke(entry.handler, entry.body);
    assert.equal(first.status, 200);
    assert.equal(first.body.success, true);
    assert.equal(first.body.webhook_status, "not_configured");
    assert.match(first.body[config.id], new RegExp(`^${config.prefix}_\\d{8}_[0-9a-f-]{36}$`));
    assert.notEqual(first.body[config.id], second.body[config.id]);
    assert.doesNotMatch(JSON.stringify(first.body), /shared_secret/);
  });

  for (const method of ["GET", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]) {
    test(`${entry.key}: ${method} returns 405`, async () => {
      const result = await invoke(entry.handler, {}, method);
      assert.equal(result.status, 405);
      assert.equal(result.headers.Allow, "POST");
    });
  }

  test(`${entry.key}: validates required fields, types, enums, lengths, and allowed properties`, async () => {
    for (const field of config.required) {
      for (const value of [undefined, null, "", "  "]) assert.equal((await invoke(entry.handler, { ...entry.body, [field]: value })).status, 400, `required ${field}`);
    }
    for (const [field, rule] of Object.entries(config.fields)) {
      if (rule.type === "array") {
        for (const value of ["wrong", {}, 1, null]) assert.equal((await invoke(entry.handler, { ...entry.body, [field]: value })).status, 400, `array type ${field}`);
        assert.equal((await invoke(entry.handler, { ...entry.body, [field]: ["x".repeat(rule.items.maxLength + 1)] })).status, 400, `array item length ${field}`);
        assert.equal((await invoke(entry.handler, { ...entry.body, [field]: [null] })).status, 400, `array item type ${field}`);
        continue;
      }
      if (rule.type === "boolean") {
        for (const value of ["true", 0, null, [], {}]) assert.equal((await invoke(entry.handler, { ...entry.body, [field]: value })).status, 400, `boolean ${field}`);
        continue;
      }
      if (rule.type === "number") {
        for (const value of ["10", NaN, Infinity, -1, rule.maximum + 1, null]) assert.equal((await invoke(entry.handler, { ...entry.body, [field]: value })).status, 400, `number ${field}`);
        continue;
      }
      for (const value of [[], {}, 123, true, null]) assert.equal((await invoke(entry.handler, { ...entry.body, [field]: value })).status, 400, `type ${field}`);
      if (rule.enum) assert.equal((await invoke(entry.handler, { ...entry.body, [field]: "not-an-enum" })).status, 400, `enum ${field}`);
      if (rule.const) assert.equal((await invoke(entry.handler, { ...entry.body, [field]: "not-the-const" })).status, 400, `const ${field}`);
      if (rule.maxLength) assert.equal((await invoke(entry.handler, { ...entry.body, [field]: "x".repeat(rule.maxLength + 1) })).status, 400, `length ${field}`);
      if (rule.format === "email") assert.equal((await invoke(entry.handler, { ...entry.body, [field]: "not-an-email" })).status, 400, `email ${field}`);
    }
    assert.equal((await invoke(entry.handler, { ...entry.body, unsupported: true })).status, 400);
    for (const body of [null, undefined, [], "json", 5, true]) assert.equal((await invoke(entry.handler, body)).status, 400);
  });

  test(`${entry.key}: configured request secret is validated and never returned`, async () => {
    process.env[`${config.env}_SHARED_SECRET`] = "request-only-test-secret";
    for (const value of [undefined, "wrong"]) {
      const result = await invoke(entry.handler, { ...entry.body, shared_secret: value });
      assert.equal(result.status, 400);
      assert.doesNotMatch(JSON.stringify(result.body), /request-only-test-secret|wrong/);
    }
    assert.equal((await invoke(entry.handler, { ...entry.body, shared_secret: "request-only-test-secret" })).status, 200);
  });

  test(`${entry.key}: webhook uses outbound secret and excludes request secret`, async () => {
    process.env[`${config.env}_WEBHOOK_URL`] = "https://example.invalid/action-test";
    process.env[`${config.env}_SHARED_SECRET`] = "request-only-test-secret";
    process.env.WEBHOOK_SHARED_SECRET = "outbound-test-secret";
    const calls = [];
    globalThis.fetch = async (url, options) => { calls.push({ url, options }); return { ok: true }; };
    const result = await invoke(entry.handler, { ...entry.body, shared_secret: "request-only-test-secret" });
    assert.equal(result.status, 200);
    assert.equal(calls[0].options.headers["x-brokerflow-secret"], "outbound-test-secret");
    assert.doesNotMatch(calls[0].options.body, /request-only-test-secret|outbound-test-secret|shared_secret/);
  });

  test(`${entry.key}: webhook failure returns generic tracked 502`, async () => {
    process.env[`${config.env}_WEBHOOK_URL`] = "https://example.invalid/action-test";
    globalThis.fetch = async () => ({ ok: false, status: 500 });
    const result = await invoke(entry.handler, entry.body);
    assert.equal(result.status, 502);
    assert.equal(result.body.error, "forwarding_failed");
    assert.ok(result.body[config.id]);
  });
}

test("referral: readiness and consent routing are deterministic", () => {
  const complete = buildPartnerReferral(cases[0].body);
  assert.equal(complete.borrower_intake_ready, true);
  assert.equal(complete.lender_fit_routing_ready, true);
  assert.equal(complete.recommended_next_step, "start_warm_introduction_workflow");
  const noConsent = buildPartnerReferral({ ...cases[0].body, permission_to_contact: false, warm_intro_available: false });
  assert.equal(noConsent.recommended_next_step, "collect_borrower_contact_permission");
  const partnerIntro = buildPartnerReferral({ ...cases[0].body, permission_to_contact: false, warm_intro_available: true });
  assert.equal(partnerIntro.recommended_next_step, "request_partner_mediated_warm_introduction");
  assert.doesNotMatch(complete.message, /eligible|approved|funded/i);
});

test("status update: ignores raw status/notes and filters restricted details", () => {
  const minimal = buildPartnerStatusUpdate({ ...cases[1].body, known_status: "Credit score is 700", notes: "Bank balance is sensitive" });
  assert.equal(minimal.safe_partner_update, "We are waiting on requested information.");
  const expanded = buildPartnerStatusUpdate({ ...cases[1].body, borrower_disclosure_level: "expanded_with_consent", allowed_details: ["The owner prefers email.", "Credit score is 700", "Bank balance is high"], restricted_details: ["prefers email"] });
  assert.equal(expanded.safe_partner_update, "We are waiting on requested information.");
  const safe = buildPartnerStatusUpdate({ ...cases[1].body, borrower_disclosure_level: "expanded_with_consent", allowed_details: ["The owner prefers email."] });
  assert.match(safe.safe_partner_update, /prefers email/);
});

test("attribution: dispute and duplicate review logic is deterministic", () => {
  assert.equal(buildPartnerAttributionLog(cases[2].body).requires_review, false);
  for (const change of [{ dispute_flag: true }, { attribution_status: "disputed" }, { attribution_status: "duplicate_check_needed" }, { commission_status: "disputed" }]) {
    assert.equal(buildPartnerAttributionLog({ ...cases[2].body, ...change }).requires_review, true);
  }
  assert.equal(buildPartnerAttributionLog({ ...cases[2].body, attribution_status: "duplicate_check_needed" }).recommended_next_step, "review_duplicate");
  assert.equal(buildPartnerAttributionLog({ ...cases[2].body, dispute_flag: true }).recommended_next_step, "review_compensation_dispute");
  assert.match(buildPartnerAttributionLog(cases[2].body).message, /does not authorize payment/i);
});
